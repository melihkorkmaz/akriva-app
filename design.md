# Design: Organizational Unit Location & Scientific Authority Override

**Date**: 2026-02-20
**Status**: Approved
**Branch**: feat/tenant-application-settings (continuation)

## Goal

Extend the organizational unit domain to support per-node location information and scientific authority overrides. Currently, location fields exist only on the `tenants` table (HQ address) and scientific authority settings exist only on `tenant_settings` (global). The design screen shows each OU node needs its own location and the ability to override the tenant-global GWP version and emission factor authorities.

## Key Decisions

| Decision            | Choice                                  | Rationale                                                                                                                       |
| ------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Inheritance model   | Server-side resolution                  | API returns `effective*` values resolved from OU override or tenant_settings. Frontend never merges.                            |
| Location validation | Free text (all fields)                  | Matches existing `tenants.hqCountry` pattern. No ISO code list to maintain.                                                     |
| Location required   | Country + City required, State nullable | Backend enforces country/city NOT NULL. Frontend handles per-country state requirement.                                         |
| API shape           | Extend existing endpoints               | Location + authority fields added to CREATE/UPDATE DTOs. No new endpoints.                                                      |
| Data model          | Flat columns + override flag            | `override_scientific_authority` boolean + nullable authority columns on `org_units`. Simple, consistent with codebase patterns. |

## Database Schema Changes

### `org_units` table — 7 new columns

```sql
-- Location (always present)
country                        TEXT NOT NULL
state_province                 TEXT                              -- nullable
city                           TEXT NOT NULL

-- Scientific Authority Override
override_scientific_authority   BOOLEAN NOT NULL DEFAULT false
gwp_version                    gwp_version_enum                  -- nullable, used when override=true
scope1_authority               emission_factor_authority_enum     -- nullable
scope2_authority               emission_factor_authority_enum     -- nullable
```

**Validation rules:**

- `overrideScientificAuthority = true` → all 3 authority fields required (Zod superRefine)
- `overrideScientificAuthority = false` → authority fields must be null/undefined (Zod superRefine)
- `country`: required, 1-100 chars, trimmed
- `city`: required, 1-100 chars, trimmed
- `stateProvince`: optional, max 100 chars

### `audit.org_unit_history` table — 7 new columns (TEXT type, SCD2 pattern)

```sql
country                        TEXT
state_province                 TEXT
city                           TEXT
override_scientific_authority   TEXT
gwp_version                    TEXT
scope1_authority               TEXT
scope2_authority               TEXT
```

All nullable in audit table (decoupled from app constraints, follows existing SCD2 convention).

### Migration

Single migration file with 14 ALTER TABLE statements. Existing rows get `country = ''` and `city = ''` as migration defaults (no production data expected). Defaults removed after migration.

## Domain Types

### `OrganizationalUnit` entity

```typescript
interface OrganizationalUnit {
  // ...existing fields...

  // Location
  country: string;
  stateProvince: string | null;
  city: string;

  // Scientific Authority Override
  overrideScientificAuthority: boolean;
  gwpVersion: GwpVersionValue | null; // 'ar5' | 'ar6'
  scope1Authority: EmissionFactorAuthorityValue | null; // 'ipcc' | 'defra' | 'epa' | 'iea' | 'egrid'
  scope2Authority: EmissionFactorAuthorityValue | null;
}
```

## DTOs

### Create DTO additions

```typescript
{
  country: z.string().min(1).max(100).trim(),                    // required
  stateProvince: z.string().max(100).trim().nullable().optional(), // optional
  city: z.string().min(1).max(100).trim(),                       // required
  overrideScientificAuthority: z.boolean().optional().default(false),
  gwpVersion: gwpVersionSchema.nullable().optional(),
  scope1Authority: emissionFactorAuthoritySchema.nullable().optional(),
  scope2Authority: emissionFactorAuthoritySchema.nullable().optional(),
}
// superRefine: cross-field validation for override flag vs authority fields
```

### Update DTO additions

Same fields, all optional. Cross-field validation via `superRefine`:

- If `overrideScientificAuthority` is set to `true` in this request, all 3 authority fields must be provided (either in this request or already stored on the entity).
- If `overrideScientificAuthority` is set to `false`, authority fields must be null/undefined.

### Response DTO additions

```typescript
interface OrgUnitResponseDto {
  // ...existing fields...

  // Location
  country: string;
  stateProvince: string | null;
  city: string;

  // Scientific Authority (always resolved)
  overrideScientificAuthority: boolean;
  effectiveGwpVersion: GwpVersionValue;
  effectiveScope1Authority: EmissionFactorAuthorityValue;
  effectiveScope2Authority: EmissionFactorAuthorityValue;
}
```

The `effective*` fields are always populated by the mapper — resolved from either the OU's own override values or from tenant_settings.

## Use Case Changes

All 6 use cases gain an `ITenantSettingsRepository` dependency to fetch tenant_settings for response resolution.

| Use Case        | Change                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| `CreateOrgUnit` | Accepts location + authority fields. Fetches tenant_settings for mapper.                                 |
| `UpdateOrgUnit` | Accepts fields as optional updates. Cross-field validation for override toggle. Fetches tenant_settings. |
| `GetOrgUnit`    | Fetches tenant_settings for resolution.                                                                  |
| `ListOrgUnits`  | Fetches tenant_settings once, passes to mapper for all items.                                            |
| `MoveOrgUnit`   | Fetches tenant_settings for response.                                                                    |
| `DeleteOrgUnit` | Fetches tenant_settings for response.                                                                    |

## Mapper Changes

```typescript
static toResponseDto(
  entity: OrganizationalUnit,
  tenantSettings: TenantSettings
): OrgUnitResponseDto {
  return {
    // ...existing fields...
    country: entity.country,
    stateProvince: entity.stateProvince,
    city: entity.city,
    overrideScientificAuthority: entity.overrideScientificAuthority,
    effectiveGwpVersion: entity.overrideScientificAuthority
      ? entity.gwpVersion!
      : tenantSettings.gwpVersion,
    effectiveScope1Authority: entity.overrideScientificAuthority
      ? entity.scope1Authority!
      : tenantSettings.scope1Authority,
    effectiveScope2Authority: entity.overrideScientificAuthority
      ? entity.scope2Authority!
      : tenantSettings.scope2Authority,
  };
}
```

## DI Container Changes

Register `ITenantSettingsRepository` in the OU domain's container:

- Import `DrizzleTenantSettingsRepository` from tenant domain infrastructure
- Add `ORGANIZATIONAL_UNIT_TOKENS.TenantSettingsRepository` DI token
- Wire concrete adapter in container setup

## Infrastructure Changes

- **CDK Stack**: No changes (same 6 Lambdas, same routes)
- **Repository**: Update `OrgUnitCreateData` / `OrgUnitUpdateData` types with new fields. Update SQL queries in Drizzle adapter.
- **Audit history**: Update snapshot logic to include new columns.

## Files to Create/Modify

### Modified files

1. `src/shared/database/schema/app/organizational-units.ts` — add 7 columns
2. `src/shared/database/schema/audit/org-unit-history.ts` — add 7 text columns
3. `src/domains/organizational-unit/domain/types/organizational-unit.types.ts` — add fields to interface
4. `src/domains/organizational-unit/application/dtos/create-organizational-unit.dto.ts` — add fields + superRefine
5. `src/domains/organizational-unit/application/dtos/update-organizational-unit.dto.ts` — add fields + superRefine
6. `src/domains/organizational-unit/application/dtos/organizational-unit-response.dto.ts` — add location + effective fields
7. `src/domains/organizational-unit/application/mappers/organizational-unit.mapper.ts` — add tenantSettings param, resolve effective values
8. `src/domains/organizational-unit/application/ports/organizational-unit-repository.port.ts` — update create/update data types
9. `src/domains/organizational-unit/application/use-cases/create-organizational-unit.use-case.ts` — accept new fields, inject tenant settings repo
10. `src/domains/organizational-unit/application/use-cases/update-organizational-unit.use-case.ts` — accept new fields, cross-field validation
11. `src/domains/organizational-unit/application/use-cases/get-organizational-unit.use-case.ts` — inject tenant settings repo
12. `src/domains/organizational-unit/application/use-cases/list-organizational-units.use-case.ts` — inject tenant settings repo
13. `src/domains/organizational-unit/application/use-cases/move-organizational-unit.use-case.ts` — inject tenant settings repo
14. `src/domains/organizational-unit/application/use-cases/delete-organizational-unit.use-case.ts` — inject tenant settings repo
15. `src/domains/organizational-unit/infrastructure/adapters/drizzle-organizational-unit.repository.ts` — update queries
16. `src/domains/organizational-unit/handlers/di/container.ts` — register tenant settings repo
17. `src/domains/organizational-unit/application/tokens.ts` — add TenantSettingsRepository token

### Test files to update

18. `src/domains/organizational-unit/application/dtos/dtos.spec.ts`
19. `src/domains/organizational-unit/application/mappers/organizational-unit.mapper.spec.ts`
20. `src/domains/organizational-unit/application/use-cases/create-organizational-unit.use-case.spec.ts`
21. `src/domains/organizational-unit/application/use-cases/update-organizational-unit.use-case.spec.ts`
22. `src/domains/organizational-unit/application/use-cases/get-organizational-unit.use-case.spec.ts`
23. `src/domains/organizational-unit/application/use-cases/list-organizational-units.use-case.spec.ts`
24. `src/domains/organizational-unit/application/use-cases/move-organizational-unit.use-case.spec.ts`
25. `src/domains/organizational-unit/application/use-cases/delete-organizational-unit.use-case.spec.ts`

### Docs to update

26. `.claude/docs/ai/organizational-units/api-handoff.md`

### Migration

27. New Drizzle migration file (generated via `drizzle-kit generate`)

## Dependencies

- Tenant domain's `ITenantSettingsRepository` port and `DrizzleTenantSettingsRepository` adapter must be importable from the OU domain
- Existing `gwp_version_enum` and `emission_factor_authority_enum` Postgres enums already exist (used by `tenant_settings`)
- No new npm packages required
