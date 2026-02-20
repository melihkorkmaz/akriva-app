# API Handoff: Tenant & Tenant Settings

## Business Context

The Tenant domain manages company/organization profiles and application-level preferences in the Akriva carbon emissions management platform. A "tenant" represents a company using the platform. Each tenant has two distinct configuration surfaces:

1. **Company Settings** (on the `tenants` table) — identity (name, slug), geography (HQ country, city), financial settings (reporting currency, fiscal year), and GHG-specific settings (base year, sector, consolidation approach).
2. **Application Settings** (on the `tenant_settings` table) — localization preferences (number formatting, date/time, timezone), unit system, emission display units, and scientific authority references (GWP version, emission factor sources for Scope 1 and Scope 2).

Tenants are created during the signup flow (Auth domain). Application settings are auto-created with sensible defaults at signup. There are four live endpoints: GET tenant by ID, PATCH company settings, GET application settings, and PATCH application settings.

## Endpoints

### GET /v1/tenants/{id}

- **Purpose**: Retrieve a single tenant by its UUID
- **Auth**: Required — Cognito JWT (any authenticated user)
- **Request**:

  ```
  GET /v1/tenants/{id}
  Authorization: Bearer <jwt_token>
  ```

  No request body. Path parameter `id` is a UUID string.

- **Response** (200):

  ```json
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Acme Corporation",
    "slug": "acme-corp",
    "status": "active",
    "hqCountry": "US",
    "stateProvince": "California",
    "city": "San Francisco",
    "reportingCurrency": "USD",
    "fiscalYearStartMonth": 1,
    "fiscalYearStartDay": 1,
    "baseYear": 2023,
    "sector": "Technology",
    "subSector": "Software Development",
    "consolidationApproach": "operational_control",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-02-10T14:22:00.000Z",
    "deletedAt": null
  }
  ```

- **Response** (error):

  | Status | Code            | When                                                                                                                                           |
  | ------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
  | 400    | (plain message) | Missing path parameter: `{ "error": "Tenant ID is required" }`                                                                                 |
  | 404    | `NOT_FOUND`     | Tenant does not exist: `{ "error": "Tenant not found: <id>", "code": "NOT_FOUND", "details": { "resource": "Tenant", "identifier": "<id>" } }` |
  | 500    | (none)          | Internal error: `{ "error": "Internal server error" }`                                                                                         |

- **Notes**: The tenant ID typically comes from the JWT claim `custom:tenant_id`. Nullable fields (`hqCountry`, `stateProvince`, etc.) return `null` when not set.

---

### PATCH /v1/tenants/settings

- **Purpose**: Update the current user's tenant company settings
- **Auth**: Required — Cognito JWT (any authenticated user; tenant ID is extracted from JWT)
- **Request**:

  ```json
  PATCH /v1/tenants/settings
  Authorization: Bearer <jwt_token>
  Content-Type: application/json

  {
    "name": "Updated Corp Name",
    "slug": "updated-corp",
    "hqCountry": "TR",
    "stateProvince": "Istanbul",
    "city": "Kadikoy",
    "reportingCurrency": "TRY",
    "fiscalYearStartMonth": 4,
    "fiscalYearStartDay": 1,
    "baseYear": 2024,
    "sector": "Manufacturing",
    "subSector": "Electronics",
    "consolidationApproach": "financial_control"
  }
  ```

  All fields are **optional**. Send only the fields you want to change. The `tenantId` is injected from the JWT claim `custom:tenant_id` server-side — do NOT include it in the request body.

  To **clear** a nullable field, send it as `null`:

  ```json
  { "hqCountry": null, "city": null }
  ```

  Sending an **empty body** `{}` returns the current tenant state without modification (200).

- **Response** (200): Returns the full updated tenant object (same shape as GET).

- **Response** (error):

  | Status | Code                | When                                                          |
  | ------ | ------------------- | ------------------------------------------------------------- |
  | 400    | (plain message)     | Malformed JSON: `{ "error": "Invalid JSON in request body" }` |
  | 400    | `VALIDATION_FAILED` | Zod validation failure (see Validation Error Shape below)     |
  | 404    | `NOT_FOUND`         | Tenant does not exist                                         |
  | 500    | (none)              | Internal error                                                |

- **Notes**: The `status` field is intentionally excluded from this endpoint — tenant lifecycle changes (activate, deactivate) will use a dedicated endpoint. Every PATCH triggers an outbox event for audit trail purposes.

---

### GET /v1/tenants/settings/application

- **Purpose**: Retrieve application/localization settings for the current user's tenant
- **Auth**: Required — Cognito JWT (tenant ID extracted from `custom:tenant_id` claim)
- **Request**:

  ```
  GET /v1/tenants/settings/application
  Authorization: Bearer <jwt_token>
  ```

  No path parameters, no query parameters, no body.

- **Response** (200):

  ```json
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "decimalSeparator": "point",
    "thousandsSeparator": "comma",
    "decimalPrecision": 2,
    "dateFormat": "yyyy_mm_dd",
    "timeFormat": "24h",
    "timezone": "UTC",
    "unitSystem": "metric",
    "emissionDisplayUnit": "tco2e",
    "gwpVersion": "ar6",
    "scope1Authority": "ipcc",
    "scope2Authority": "defra",
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T08:00:00.000Z"
  }
  ```

- **Response** (error):

  | Status | Code        | When                                                                                                                                                                           |
  | ------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | 401    | —           | Missing or invalid JWT                                                                                                                                                         |
  | 404    | `NOT_FOUND` | Settings record not found: `{ "error": "TenantSettings not found: <tenantId>", "code": "NOT_FOUND", "details": { "resource": "TenantSettings", "identifier": "<tenantId>" } }` |
  | 500    | (none)      | Internal error                                                                                                                                                                 |

- **Notes**: Settings are auto-created with defaults during signup. A 404 should only occur if the signup saga partially failed. The response does NOT include a `deletedAt` field — settings records are not soft-deletable.

---

### PATCH /v1/tenants/settings/application

- **Purpose**: Update application/localization settings for the current user's tenant
- **Auth**: Required — Cognito JWT (tenant ID extracted from `custom:tenant_id` claim)
- **Request**:

  ```json
  PATCH /v1/tenants/settings/application
  Authorization: Bearer <jwt_token>
  Content-Type: application/json

  {
    "decimalSeparator": "comma",
    "thousandsSeparator": "point",
    "decimalPrecision": 4,
    "dateFormat": "dd_mm_yyyy",
    "timeFormat": "12h",
    "timezone": "Europe/Istanbul",
    "unitSystem": "metric",
    "emissionDisplayUnit": "kgco2e",
    "gwpVersion": "ar6",
    "scope1Authority": "ipcc",
    "scope2Authority": "defra"
  }
  ```

  All fields are **optional**. Send only the fields you want to change. The `tenantId` is injected from the JWT claim server-side.

  **Minimal examples:**

  ```json
  // Switch to European number format
  { "decimalSeparator": "comma", "thousandsSeparator": "point" }

  // Update only GHG authority settings
  { "gwpVersion": "ar6", "scope1Authority": "epa" }

  // Change timezone only
  { "timezone": "America/New_York" }
  ```

- **Response** (200): Returns the full updated `TenantSettingsResponseDto` (same shape as GET above).

- **Response** (error):

  | Status | Code                | When                                                                                                                  |
  | ------ | ------------------- | --------------------------------------------------------------------------------------------------------------------- |
  | 400    | (plain message)     | Missing body: `{ "error": "Request body is required" }`                                                               |
  | 400    | (plain message)     | Malformed JSON: `{ "error": "Invalid JSON in request body" }`                                                         |
  | 400    | `VALIDATION_FAILED` | Zod validation failure (invalid enum, out-of-range number, etc.)                                                      |
  | 400    | `VALIDATION_FAILED` | Separator conflict — both separators sent and equal: `"Decimal separator and thousands separator cannot be the same"` |
  | 400    | `VALIDATION_FAILED` | Separator conflict — one separator sent conflicts with stored value (use-case-level check)                            |
  | 400    | `VALIDATION_FAILED` | Invalid timezone string: `"Invalid IANA timezone identifier"`                                                         |
  | 401    | —                   | Missing or invalid JWT                                                                                                |
  | 404    | `NOT_FOUND`         | Settings not found for tenant                                                                                         |
  | 500    | (none)              | Internal error                                                                                                        |

- **Notes**: The separator conflict check has two layers — see "Business Logic & Edge Cases" section below.

---

## Data Models / DTOs

### TenantResponseDto (GET/PATCH tenant)

```typescript
interface TenantResponseDto {
  id: string; // UUID
  name: string; // 1-255 chars
  slug: string; // 3-50 chars, lowercase alphanumeric + hyphens
  status: "init" | "active" | "inactive" | "removed";
  hqCountry: string | null; // ISO 3166-1 alpha-2 ("US", "TR")
  stateProvince: string | null; // free text, 1-255
  city: string | null; // free text, 1-255
  reportingCurrency: string | null; // ISO 4217 ("USD", "EUR")
  fiscalYearStartMonth: number | null; // 1-12
  fiscalYearStartDay: number | null; // 1-31 (validated against month)
  baseYear: number | null; // 1900-2100
  sector: string | null; // free text, 1-255
  subSector: string | null; // free text, 1-255
  consolidationApproach:
    | "operational_control"
    | "financial_control"
    | "equity_share"
    | null;
  createdAt: string; // ISO 8601 (e.g., "2024-01-15T10:30:00.000Z")
  updatedAt: string; // ISO 8601
  deletedAt: string | null; // ISO 8601 or null
}
```

### TenantSettingsResponseDto (GET/PATCH application settings)

```typescript
interface TenantSettingsResponseDto {
  id: string; // UUID — settings record ID
  tenantId: string; // UUID — the tenant this belongs to
  decimalSeparator: "point" | "comma";
  thousandsSeparator: "comma" | "point" | "space" | "none";
  decimalPrecision: number; // integer 0-10
  dateFormat: "dd_mm_yyyy" | "mm_dd_yyyy" | "yyyy_mm_dd";
  timeFormat: "24h" | "12h";
  timezone: string; // IANA timezone identifier (e.g., "UTC", "Europe/Istanbul")
  unitSystem: "metric" | "imperial" | "custom";
  emissionDisplayUnit: "tco2e" | "kgco2e";
  gwpVersion: "ar5" | "ar6";
  scope1Authority: "ipcc" | "defra" | "epa" | "iea" | "egrid";
  scope2Authority: "ipcc" | "defra" | "epa" | "iea" | "egrid";
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

### UpdateTenantRequest (PATCH /settings body)

```typescript
// All fields optional. Send only what you want to change.
// Send null to clear a nullable field.
interface UpdateTenantRequest {
  name?: string;
  slug?: string;
  hqCountry?: string | null;
  stateProvince?: string | null;
  city?: string | null;
  reportingCurrency?: string | null;
  fiscalYearStartMonth?: number | null;
  fiscalYearStartDay?: number | null;
  baseYear?: number | null;
  sector?: string | null;
  subSector?: string | null;
  consolidationApproach?:
    | "operational_control"
    | "financial_control"
    | "equity_share"
    | null;
}
```

### UpdateTenantSettingsRequest (PATCH /settings/application body)

```typescript
// All fields optional. Send only what you want to change.
interface UpdateTenantSettingsRequest {
  decimalSeparator?: "point" | "comma";
  thousandsSeparator?: "comma" | "point" | "space" | "none";
  decimalPrecision?: number; // integer, 0-10
  dateFormat?: "dd_mm_yyyy" | "mm_dd_yyyy" | "yyyy_mm_dd";
  timeFormat?: "24h" | "12h";
  timezone?: string; // must be a valid IANA timezone identifier
  unitSystem?: "metric" | "imperial" | "custom";
  emissionDisplayUnit?: "tco2e" | "kgco2e";
  gwpVersion?: "ar5" | "ar6";
  scope1Authority?: "ipcc" | "defra" | "epa" | "iea" | "egrid";
  scope2Authority?: "ipcc" | "defra" | "epa" | "iea" | "egrid";
}
```

## Enums & Constants

### Tenant Status

| Value      | Meaning                       | Notes                                     |
| ---------- | ----------------------------- | ----------------------------------------- |
| `init`     | Freshly created during signup | Default state                             |
| `active`   | Actively using the platform   | Set after onboarding completes            |
| `inactive` | Temporarily suspended         | Admin action                              |
| `removed`  | Marked for deletion           | Soft-delete; `deletedAt` will also be set |

> **Note**: `status` is read-only on the PATCH /settings endpoint.

### Consolidation Approach (GHG Protocol)

| Value                 | Meaning                          | Display Label       |
| --------------------- | -------------------------------- | ------------------- |
| `operational_control` | Company operates the facility    | Operational Control |
| `financial_control`   | Company has financial control    | Financial Control   |
| `equity_share`        | Proportional to equity ownership | Equity Share        |

### Decimal Separator

| Value   | Display Example |
| ------- | --------------- |
| `point` | `1,234.56`      |
| `comma` | `1.234,56`      |

### Thousands Separator

| Value   | Display Example |
| ------- | --------------- |
| `comma` | `1,234,567`     |
| `point` | `1.234.567`     |
| `space` | `1 234 567`     |
| `none`  | `1234567`       |

### Date Format

| Value        | Display Example |
| ------------ | --------------- |
| `dd_mm_yyyy` | 31/12/2024      |
| `mm_dd_yyyy` | 12/31/2024      |
| `yyyy_mm_dd` | 2024-12-31      |

### Time Format

| Value | Display |
| ----- | ------- |
| `24h` | 14:30   |
| `12h` | 2:30 PM |

### Unit System

| Value      | Meaning                        |
| ---------- | ------------------------------ |
| `metric`   | Metric system (kg, km, etc.)   |
| `imperial` | Imperial system (lb, mi, etc.) |
| `custom`   | Custom unit configuration      |

### Emission Display Unit

| Value    | Meaning                     | Display |
| -------- | --------------------------- | ------- |
| `tco2e`  | Tonnes of CO2 equivalent    | tCO2e   |
| `kgco2e` | Kilograms of CO2 equivalent | kgCO2e  |

### GWP Version

| Value | Meaning                             |
| ----- | ----------------------------------- |
| `ar5` | IPCC Fifth Assessment Report (2014) |
| `ar6` | IPCC Sixth Assessment Report (2021) |

### Emission Factor Authority

| Value   | Full Name                                                |
| ------- | -------------------------------------------------------- |
| `ipcc`  | Intergovernmental Panel on Climate Change                |
| `defra` | UK Department for Environment, Food and Rural Affairs    |
| `epa`   | US Environmental Protection Agency                       |
| `iea`   | International Energy Agency                              |
| `egrid` | Emissions & Generation Resource Integrated Database (US) |

### JWT Custom Claims

| Claim                | Type          | Example                                                |
| -------------------- | ------------- | ------------------------------------------------------ |
| `sub`                | string (UUID) | Cognito user ID                                        |
| `email`              | string        | `user@acme.com`                                        |
| `custom:tenant_id`   | string (UUID) | `550e8400-...`                                         |
| `custom:user_id`     | string (UUID) | `660f9500-...`                                         |
| `custom:tenant_role` | string        | `owner`, `admin`, `member`, `billing_admin`, `auditor` |

## Validation Rules

### Company Settings (PATCH /v1/tenants/settings)

| Field                   | Type         | Constraints                                                        | Error message                                              |
| ----------------------- | ------------ | ------------------------------------------------------------------ | ---------------------------------------------------------- |
| `name`                  | string       | 1-255 chars, required if present                                   | "Name is required" / "Name must be at most 255 characters" |
| `slug`                  | string       | 3-50 chars, regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`                     | "Slug must be lowercase alphanumeric with hyphens"         |
| `hqCountry`             | string\|null | Exactly 2 uppercase letters: `/^[A-Z]{2}$/`                        | "Country code must be uppercase ISO 3166-1 alpha-2"        |
| `reportingCurrency`     | string\|null | Exactly 3 uppercase letters: `/^[A-Z]{3}$/`                        | "Currency code must be uppercase ISO 4217"                 |
| `stateProvince`         | string\|null | 1-255 chars                                                        | "State/province must not be empty"                         |
| `city`                  | string\|null | 1-255 chars                                                        | "City must not be empty"                                   |
| `fiscalYearStartMonth`  | number\|null | Integer, 1-12                                                      | Zod min/max error                                          |
| `fiscalYearStartDay`    | number\|null | Integer, 1-31 (cross-validated with month)                         | "Day {d} is invalid for month {m} (max: {max})"            |
| `baseYear`              | number\|null | Integer, 1900-2100                                                 | Zod min/max error                                          |
| `sector`                | string\|null | 1-255 chars                                                        | "Sector must not be empty"                                 |
| `subSector`             | string\|null | 1-255 chars                                                        | "Sub-sector must not be empty"                             |
| `consolidationApproach` | enum\|null   | One of: `operational_control`, `financial_control`, `equity_share` | Zod enum error                                             |

**Cross-field**: When both `fiscalYearStartMonth` and `fiscalYearStartDay` are present, the day is validated against the month's max days (Feb=29, Apr/Jun/Sep/Nov=30, rest=31).

### Application Settings (PATCH /v1/tenants/settings/application)

| Field                 | Type   | Constraints                                               | Error message                      |
| --------------------- | ------ | --------------------------------------------------------- | ---------------------------------- |
| `decimalSeparator`    | enum   | `point` \| `comma`                                        | Zod enum error                     |
| `thousandsSeparator`  | enum   | `comma` \| `point` \| `space` \| `none`                   | Zod enum error                     |
| `decimalPrecision`    | number | Integer, 0-10                                             | Zod min/max error                  |
| `dateFormat`          | enum   | `dd_mm_yyyy` \| `mm_dd_yyyy` \| `yyyy_mm_dd`              | Zod enum error                     |
| `timeFormat`          | enum   | `24h` \| `12h`                                            | Zod enum error                     |
| `timezone`            | string | Valid IANA timezone (validated via `Intl.DateTimeFormat`) | "Invalid IANA timezone identifier" |
| `unitSystem`          | enum   | `metric` \| `imperial` \| `custom`                        | Zod enum error                     |
| `emissionDisplayUnit` | enum   | `tco2e` \| `kgco2e`                                       | Zod enum error                     |
| `gwpVersion`          | enum   | `ar5` \| `ar6`                                            | Zod enum error                     |
| `scope1Authority`     | enum   | `ipcc` \| `defra` \| `epa` \| `iea` \| `egrid`            | Zod enum error                     |
| `scope2Authority`     | enum   | `ipcc` \| `defra` \| `epa` \| `iea` \| `egrid`            | Zod enum error                     |

**Cross-field**: `decimalSeparator` and `thousandsSeparator` cannot be the same value — see separator conflict logic below.

## Business Logic & Edge Cases

### Company Settings (PATCH /settings)

- **Empty PATCH body**: Returns 200 with the current tenant state (no-op update). No error thrown.
- **Partial updates**: Only fields present in the body are updated. Absent fields remain unchanged.
- **Null to clear**: Send `null` for any nullable field to clear it (e.g., `"hqCountry": null`).
- **Slug uniqueness**: The slug has a unique constraint in the database. Attempting to set a slug that another tenant already uses will result in a database-level error (currently surfaces as 500; a future improvement may return 409 Conflict).
- **Tenant ID source**: The PATCH endpoint does NOT accept a tenant ID in the URL or body. It reads `custom:tenant_id` from the JWT, so users can only update their own tenant.
- **`status` is not settable**: The PATCH /settings endpoint strips `status` from input.
- **Soft-deleted tenants**: GET will still return soft-deleted tenants (where `deletedAt` is non-null). Frontend should check `deletedAt` and/or `status === 'removed'`.

### Application Settings (PATCH /settings/application)

- **Separator conflict — two layers**:
  1. **DTO-level (Zod `superRefine`)**: If both `decimalSeparator` and `thousandsSeparator` are provided in the same request and they are equal, the request is rejected immediately with a 400.
  2. **Use-case-level (merged-state check)**: If only one separator field is sent, the use case fetches the existing record and checks that the incoming value doesn't conflict with the stored value. Example: DB has `thousandsSeparator = 'point'` and PATCH sends `{ "decimalSeparator": "point" }` — rejected with 400.
- **Timezone validation**: Uses `Intl.DateTimeFormat` to validate IANA timezone strings. Invalid values like `"Invalid/Zone"` are rejected.
- **No null clearing**: Unlike company settings, application settings fields are NOT nullable. Every field has a default value and accepts only valid enum/range values. You cannot send `null` to clear a field.
- **Audit trail**: Every PATCH triggers an outbox event recording what changed, who changed it, and from which IP/user-agent. Frontend does not need to send audit metadata.

### Default Values (created at signup)

| Field                 | Default      |
| --------------------- | ------------ |
| `decimalSeparator`    | `point`      |
| `thousandsSeparator`  | `comma`      |
| `decimalPrecision`    | `2`          |
| `dateFormat`          | `yyyy_mm_dd` |
| `timeFormat`          | `24h`        |
| `timezone`            | `UTC`        |
| `unitSystem`          | `metric`     |
| `emissionDisplayUnit` | `tco2e`      |
| `gwpVersion`          | `ar6`        |
| `scope1Authority`     | `ipcc`       |
| `scope2Authority`     | `defra`      |

## Integration Notes

- **Recommended flow for company settings page**:

  1. On page load: `GET /v1/tenants/{tenantId}` (get `tenantId` from JWT claims)
  2. Display form pre-filled with current values
  3. On save: `PATCH /v1/tenants/settings` with only changed fields
  4. On success: update local state with response body (it's the full updated tenant)

- **Recommended flow for application settings page**:

  1. On page load: `GET /v1/tenants/settings/application`
  2. Display form pre-filled with current values
  3. On save: `PATCH /v1/tenants/settings/application` with only changed fields
  4. On success: update local state with response body

- **Separator conflict UX**: When the user changes either `decimalSeparator` or `thousandsSeparator`, the frontend should pre-validate that the two values won't be the same. If only one is changing, compare against the current value of the other. This avoids a server round-trip for a guaranteed validation error.

- **Optimistic UI**: Safe for company settings non-unique fields (name, country, sector, etc.). Risky for `slug` due to uniqueness constraint — wait for server confirmation. Safe for all application settings fields.

- **Caching**: No cache headers are set. Frontend can cache locally but should refresh on navigation to settings pages.

- **CORS**: Preflight configured for `GET`, `PATCH`, `OPTIONS`. Allowed headers: `Content-Type`, `Authorization`, `X-Amz-Date`, `X-Api-Key`. Origin: `*` (wildcard).

## Validation Error Shape

All validation errors (400) follow this structure:

```json
{
  "error": "Validation error: <first issue message>",
  "code": "VALIDATION_FAILED",
  "details": {
    "issues": [
      {
        "code": "too_small",
        "minimum": 3,
        "type": "string",
        "inclusive": true,
        "exact": false,
        "message": "Slug must be at least 3 characters",
        "path": ["slug"]
      }
    ]
  }
}
```

## Test Scenarios

### Company Settings

1. **Happy path — GET**: Fetch existing tenant by ID, verify all fields returned correctly
2. **Happy path — PATCH**: Update 2-3 fields, verify response contains updated values and unchanged fields preserved
3. **Empty PATCH**: Send `{}` body, verify 200 with current tenant state
4. **Clear nullable field**: Send `{ "hqCountry": null }`, verify field is null in response
5. **Validation — slug format**: Send `{ "slug": "INVALID SLUG!" }`, expect 400 with `VALIDATION_FAILED`
6. **Validation — fiscal year pair**: Send `{ "fiscalYearStartMonth": 2, "fiscalYearStartDay": 30 }`, expect 400 with message "Day 30 is invalid for month 2 (max: 29)"
7. **Validation — country code**: Send `{ "hqCountry": "usa" }` (lowercase, 3 chars), expect 400
8. **Not found**: GET with non-existent UUID, expect 404 with `NOT_FOUND`
9. **Malformed JSON**: PATCH with `body: "not json"`, expect 400 "Invalid JSON in request body"
10. **Missing auth**: Request without Authorization header, expect 401 from API Gateway

### Application Settings

11. **Happy path — GET**: Fetch settings, verify all default values returned for new tenant
12. **Happy path — PATCH**: Update `timezone` and `dateFormat`, verify response reflects changes
13. **Separator conflict — both sent**: Send `{ "decimalSeparator": "comma", "thousandsSeparator": "comma" }`, expect 400 "Decimal separator and thousands separator cannot be the same"
14. **Separator conflict — stored clash**: DB has `thousandsSeparator: "comma"`, send `{ "decimalSeparator": "comma" }`, expect 400 same message
15. **Invalid timezone**: Send `{ "timezone": "Not/A/Zone" }`, expect 400 "Invalid IANA timezone identifier"
16. **Invalid enum**: Send `{ "gwpVersion": "ar7" }`, expect 400 `VALIDATION_FAILED`
17. **Decimal precision bounds**: Send `{ "decimalPrecision": 11 }`, expect 400
18. **Valid partial update**: Send `{ "scope1Authority": "epa" }`, verify only that field changed in response

## Open Questions / TODOs

- **Slug conflict handling**: Currently a duplicate slug returns a 500 (database constraint violation). Should be improved to return 409 Conflict with a clear message.
- **Role-based access**: No role checks are currently enforced — any authenticated user can read/update their own tenant's settings. Consider restricting PATCH to `owner`/`admin` roles.
- **Tenant status endpoint**: A dedicated endpoint for lifecycle changes (activate, deactivate, remove) is planned but not yet implemented.
- **List tenants endpoint**: `GET /v1/tenants` (with filters/pagination) is planned but not yet available.
