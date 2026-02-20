# Design: Application Settings Page

**Date**: 2026-02-20
**Scope**: Wire the application settings page to the backend API with all 11 fields from the handoff doc.

## Goal

Replace the current static/hardcoded application settings page with a fully functional form backed by `GET/PATCH /v1/tenants/settings/application`. Add the 6 missing fields (dateFormat, timeFormat, timezone, unitSystem, emissionDisplayUnit) and integrate all 11 fields with Superforms + Zod validation.

## Key Decisions

- **Scope**: Application settings page only. Company page is already complete.
- **All 11 fields**: decimalSeparator, thousandsSeparator, decimalPrecision, dateFormat, timeFormat, timezone, unitSystem, emissionDisplayUnit, gwpVersion, scope1Authority, scope2Authority.
- **Section components**: 3 extracted sections in `_components/` (matches company page pattern).
- **Client-side separator validation**: Zod superRefine cross-field check for separator conflict.
- **No nullable fields**: Unlike company settings, all application settings fields have defaults and are non-nullable.

## Architecture

### Data Flow

```
+page.server.ts (load)
  → getApplicationSettings(idToken)
  → GET /v1/tenants/settings/application
  → populate Superforms with 11 fields

+page.svelte (orchestrator)
  → initializes superForm with zod4Client validator
  → passes superform to 3 section components
  → Cancel + Save buttons

+page.server.ts (action)
  → validate with applicationSettingsSchema (zod4 adapter)
  → updateApplicationSettings(idToken, payload)
  → PATCH /v1/tenants/settings/application
  → return success/error message
```

### Section Grouping

| Section Component | Fields | Card Title |
|---|---|---|
| `LocalizationSection` | decimalSeparator, thousandsSeparator, decimalPrecision, dateFormat, timeFormat, timezone | Localization |
| `UnitsSection` | unitSystem, emissionDisplayUnit | Units & Display |
| `ScientificAuthoritySection` | gwpVersion, scope1Authority, scope2Authority | Scientific Authority |

## Files to Create

| File | Purpose |
|---|---|
| `src/lib/schemas/application-settings.ts` | Zod 4 schema with separator conflict superRefine |
| `src/routes/(app)/settings/application-settings/+page.server.ts` | Load function + form action |
| `src/routes/(app)/settings/application-settings/_components/LocalizationSection.svelte` | 6 localization fields |
| `src/routes/(app)/settings/application-settings/_components/UnitsSection.svelte` | 2 unit fields |
| `src/routes/(app)/settings/application-settings/_components/ScientificAuthoritySection.svelte` | 3 scientific authority fields |

## Files to Modify

| File | Change |
|---|---|
| `src/lib/api/types.ts` | Add `TenantSettingsResponseDto`, `UpdateTenantSettingsRequest` |
| `src/lib/api/tenant.ts` | Add `getApplicationSettings()`, `updateApplicationSettings()` |
| `src/routes/(app)/settings/application-settings/+page.svelte` | Rewrite as Superforms orchestrator |

## Zod Schema

```typescript
// src/lib/schemas/application-settings.ts
const applicationSettingsSchema = z.object({
  decimalSeparator:    z.enum(["point", "comma"]),
  thousandsSeparator:  z.enum(["comma", "point", "space", "none"]),
  decimalPrecision:    z.coerce.number().int().min(0).max(10),
  dateFormat:          z.enum(["dd_mm_yyyy", "mm_dd_yyyy", "yyyy_mm_dd"]),
  timeFormat:          z.enum(["24h", "12h"]),
  timezone:            z.string().min(1),
  unitSystem:          z.enum(["metric", "imperial", "custom"]),
  emissionDisplayUnit: z.enum(["tco2e", "kgco2e"]),
  gwpVersion:          z.enum(["ar5", "ar6"]),
  scope1Authority:     z.enum(["ipcc", "defra", "epa", "iea", "egrid"]),
  scope2Authority:     z.enum(["ipcc", "defra", "epa", "iea", "egrid"]),
}).superRefine((data, ctx) => {
  if (data.decimalSeparator === data.thousandsSeparator) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Decimal separator and thousands separator cannot be the same",
      path: ["thousandsSeparator"],
    });
  }
});
```

## UI Field Details

### LocalizationSection

Layout: two rows within a Card.

Row 1 (3 columns):
- **Decimal Separator** — Select: Point (.) / Comma (,)
- **Thousands Separator** — Select: Comma (,) / Point (.) / Space ( ) / None
- **Decimal Precision** — Input type="number", min=0, max=10

Row 2 (3 columns):
- **Date Format** — Select: DD/MM/YYYY / MM/DD/YYYY / YYYY-MM-DD
- **Time Format** — Select: 24h / 12h
- **Timezone** — Select: static list of ~30 popular IANA timezones

Format Examples section below (carried over from current page).

### UnitsSection

- **Unit System** — RadioGroup styled as cards: Metric / Imperial / Custom
- **Emission Display Unit** — Select: tCO2e / kgCO2e

### ScientificAuthoritySection

- **GWP Version** — RadioGroup inline: IPCC AR6 / IPCC AR5
- **Scope 1 Authority** — Select: IPCC / DEFRA / EPA / IEA / eGRID
- **Scope 2 Authority** — Select: IPCC / DEFRA / EPA / IEA / eGRID

## Error Handling

- **Form-level**: Alert banner at top for server messages (success/error)
- **Field-level**: `Form.FieldErrors` under each field (standard formsnap)
- **Separator conflict**: Client-side via superRefine, server-side as fallback
- **API error mapping** in form action:
  - `VALIDATION_FAILED` → field-specific errors or form message
  - `NOT_FOUND` → "Settings not found"
  - Generic → "Something went wrong"

## Dependencies

- Handoff doc: `docs/handoffs/tenant-tenantsettings.md`
- Company page pattern: `src/routes/(app)/settings/company/` (reference for structure)
- Existing API client: `src/lib/api/client.ts` (`apiFetchAuth`)
