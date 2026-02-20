# API Handoff: Emission Factor Domain

## Business Context

The Emission Factor domain provides **read-only reference data** for GHG (greenhouse gas) calculations. It exposes libraries of emission factors (e.g., DEFRA 2024, EPA 2023), physical fuel properties (density, net calorific value), and GWP (Global Warming Potential) values from IPCC assessment reports. This data is consumed by the emissions calculation engine when a user enters activity data (e.g., "burned 100 MWh of natural gas") — the system resolves the correct emission factor for the authority, year, fuel type, and gas, then multiplies to get CO₂e. All endpoints are read-only; there is no creation, update, or deletion.

---

## Endpoints

### GET /emission-factor-libraries

- **Purpose**: List available emission factor libraries, optionally filtered by authority or release year
- **Auth**: JWT required (all authenticated users)
- **Request**: Query params (all optional)

  ```
  ?authority=defra&releaseYear=2024
  ```

- **Response** (200):

  ```json
  [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "DEFRA 2024",
      "authority": "defra",
      "version": "2024",
      "releaseYear": 2024,
      "isDefault": true,
      "createdAt": "2024-01-15T00:00:00.000Z"
    }
  ]
  ```

- **Response** (error): 400 validation, 401 unauthorized
- **Notes**: Returns all libraries when no filters supplied. `isDefault: true` marks the fallback library used when no better version matches a reporting year.

---

### GET /emission-factors

- **Purpose**: Search emission factors within a specific library, with pagination
- **Auth**: JWT required (all authenticated users)
- **Request**: Query params

  ```
  ?libraryId=<uuid>&fuelType=Natural%20Gas&gas=CO2&page=1&pageSize=20
  ```

  | Param        | Required | Type        | Constraints                |
  | ------------ | -------- | ----------- | -------------------------- |
  | `libraryId`  | **Yes**  | UUID string | Must be valid UUID         |
  | `fuelType`   | No       | string      | min 1 char                 |
  | `gas`        | No       | string      | min 1 char                 |
  | `category`   | No       | string      | min 1 char                 |
  | `region`     | No       | string      | min 1 char                 |
  | `technology` | No       | string      | min 1 char                 |
  | `unit`       | No       | string      | min 1 char                 |
  | `page`       | No       | integer     | min 1, default 1           |
  | `pageSize`   | No       | integer     | min 1, max 100, default 20 |

- **Response** (200):

  ```json
  {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "libraryId": "550e8400-e29b-41d4-a716-446655440000",
        "externalId": "1.A.1.a",
        "category": "1.A.1",
        "fuelType": "Natural Gas",
        "gas": "CO2",
        "isBiogenic": false,
        "value": 0.18396,
        "oxidationFactor": 0.995,
        "unit": "kg/kWh",
        "region": null,
        "technology": null,
        "createdAt": "2024-01-15T00:00:00.000Z"
      }
    ],
    "total": 842,
    "page": 1,
    "pageSize": 20,
    "totalPages": 43
  }
  ```

- **Response** (error): 400 for missing/invalid `libraryId`, 401 unauthorized
- **Notes**: Pagination is 1-indexed. `externalId` is the source database's own identifier (e.g., IPCC category code) — may be null for some libraries. `isBiogenic` flags biomass/biofuel factors that may be excluded from fossil CO₂e totals. `oxidationFactor` is typically 0.99–1.0 and already factored into some calculation methodologies.

---

### GET /emission-factors/resolve

- **Purpose**: Resolve the best matching emission factor for a given authority, reporting year, and fuel/gas/category combination using a tiered fallback hierarchy
- **Auth**: JWT required (all authenticated users)
- **Request**: Query params

  ```
  ?authority=defra&reportingYear=2024&fuelType=Natural%20Gas&gas=CO2&category=1.A.1&region=Europe&technology=Catalyst
  ```

  | Param           | Required | Type    | Constraints                            |
  | --------------- | -------- | ------- | -------------------------------------- |
  | `authority`     | **Yes**  | enum    | `ipcc`, `defra`, `epa`, `iea`, `egrid` |
  | `reportingYear` | **Yes**  | integer | 1990–2100                              |
  | `fuelType`      | **Yes**  | string  | min 1 char                             |
  | `gas`           | **Yes**  | string  | min 1 char                             |
  | `category`      | **Yes**  | string  | min 1 char                             |
  | `region`        | No       | string  | min 1 char                             |
  | `technology`    | No       | string  | min 1 char                             |

- **Response** (200):

  ```json
  {
    "factor": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "libraryId": "550e8400-e29b-41d4-a716-446655440000",
      "externalId": "1.A.1.a",
      "category": "1.A.1",
      "fuelType": "Natural Gas",
      "gas": "CO2",
      "isBiogenic": false,
      "value": 0.18396,
      "oxidationFactor": 0.995,
      "unit": "kg/kWh",
      "region": null,
      "technology": null,
      "createdAt": "2024-01-15T00:00:00.000Z"
    },
    "tier": "global",
    "library": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "DEFRA 2024",
      "authority": "defra",
      "version": "2024",
      "releaseYear": 2024,
      "isDefault": true,
      "createdAt": "2024-01-15T00:00:00.000Z"
    },
    "usedFallback": false
  }
  ```

  When no factor is found:

  ```json
  {
    "factor": null,
    "tier": null,
    "library": null,
    "usedFallback": false
  }
  ```

- **Response** (error): 400 for missing/invalid required params, 401 unauthorized
- **Notes**: This is the primary endpoint for the emissions calculation flow. `tier` tells the UI the confidence level of the match — show a warning if `tier === 'global'` or `usedFallback === true`. `usedFallback: true` means the system couldn't find a library matching the reporting year and fell back to the default library for that authority.

---

### GET /fuel-properties

- **Purpose**: List fuel properties (density and net calorific value) for unit conversion in emissions calculations
- **Auth**: JWT required (all authenticated users)
- **Request**: Query params

  ```
  ?libraryId=<uuid>&fuelType=Natural%20Gas&propertyType=density
  ```

  | Param          | Required | Type        | Constraints        |
  | -------------- | -------- | ----------- | ------------------ |
  | `libraryId`    | **Yes**  | UUID string | Must be valid UUID |
  | `fuelType`     | No       | string      | min 1 char         |
  | `propertyType` | No       | enum        | `density`, `ncv`   |

- **Response** (200):

  ```json
  [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "libraryId": "550e8400-e29b-41d4-a716-446655440000",
      "fuelType": "Natural Gas",
      "propertyType": "ncv",
      "value": 10.55,
      "unit": "kWh/m³",
      "region": null,
      "createdAt": "2024-01-15T00:00:00.000Z"
    }
  ]
  ```

- **Response** (error): 400 for missing/invalid `libraryId`, 401 unauthorized
- **Notes**: `ncv` (Net Calorific Value) is used to convert volumetric/mass activity data to energy units before applying an emission factor. `density` converts volumetric to mass. These are reference values — their `unit` field determines the conversion formula.

---

### GET /gwp-values

- **Purpose**: List Global Warming Potential values per gas, by IPCC Assessment Report version
- **Auth**: JWT required (all authenticated users)
- **Request**: Query params (all optional)

  ```
  ?version=ar5
  ```

- **Response** (200):

  ```json
  [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "version": "ar5",
      "gas": "CH4",
      "value": 28,
      "createdAt": "2024-01-15T00:00:00.000Z"
    }
  ]
  ```

- **Response** (error): 400 for invalid `version`, 401 unauthorized
- **Notes**: GWP values are multiplied by the mass of each GHG (CH₄, N₂O, etc.) to convert to CO₂-equivalent (CO₂e). CO₂ itself has GWP = 1 and may not appear in the dataset. The tenant's GWP version setting (from tenant settings API) determines which version to use here.

---

## Data Models / DTOs

```typescript
interface EmissionFactorLibraryDto {
  id: string; // UUID
  name: string;
  authority: EmissionFactorAuthority;
  version: string;
  releaseYear: number;
  isDefault: boolean;
  createdAt: string; // ISO 8601
}

interface EmissionFactorDto {
  id: string; // UUID
  libraryId: string; // UUID
  externalId: string | null; // Source DB identifier (e.g. IPCC category code)
  category: string;
  fuelType: string;
  gas: string;
  isBiogenic: boolean;
  value: number;
  oxidationFactor: number;
  unit: string;
  region: string | null;
  technology: string | null;
  createdAt: string; // ISO 8601
}

interface PaginatedEmissionFactorsDto {
  items: EmissionFactorDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ResolvedEmissionFactorDto {
  factor: EmissionFactorDto | null;
  tier: "specific" | "regional" | "global" | null;
  library: EmissionFactorLibraryDto | null;
  usedFallback: boolean;
}

interface FuelPropertyDto {
  id: string; // UUID
  libraryId: string; // UUID
  fuelType: string;
  propertyType: FuelPropertyType;
  value: number;
  unit: string;
  region: string | null;
  createdAt: string; // ISO 8601
}

interface GwpValueDto {
  id: string; // UUID
  version: GwpVersion;
  gas: string;
  value: number;
  createdAt: string; // ISO 8601
}
```

---

## Enums & Constants

### EmissionFactorAuthority

| Value   | Meaning                                             | Display Label |
| ------- | --------------------------------------------------- | ------------- |
| `ipcc`  | Intergovernmental Panel on Climate Change           | IPCC          |
| `defra` | UK Department for Environment, Food & Rural Affairs | DEFRA         |
| `epa`   | US Environmental Protection Agency                  | EPA           |
| `iea`   | International Energy Agency                         | IEA           |
| `egrid` | US EPA eGRID (electricity grid)                     | eGRID         |

### GwpVersion

| Value | Meaning                           | Display Label |
| ----- | --------------------------------- | ------------- |
| `ar4` | IPCC 4th Assessment Report (2007) | AR4           |
| `ar5` | IPCC 5th Assessment Report (2014) | AR5           |
| `ar6` | IPCC 6th Assessment Report (2021) | AR6           |

### FuelPropertyType

| Value     | Meaning                                   | Display Label |
| --------- | ----------------------------------------- | ------------- |
| `density` | Mass per unit volume                      | Density       |
| `ncv`     | Net Calorific Value (lower heating value) | NCV           |

### ResolutionTier

| Value      | Meaning                                  | UI Implication                                       |
| ---------- | ---------------------------------------- | ---------------------------------------------------- |
| `specific` | Matched region + technology              | Highest confidence, no warning needed                |
| `regional` | Matched region only (technology ignored) | Good confidence                                      |
| `global`   | No region match (global average)         | Consider warning user: "using global average factor" |

---

## Validation Rules

| Endpoint        | Field           | Rule                                                 |
| --------------- | --------------- | ---------------------------------------------------- |
| List Libraries  | `authority`     | Optional; must be one of the 5 authority enum values |
| List Libraries  | `releaseYear`   | Optional; integer 1990–2100                          |
| Search Factors  | `libraryId`     | **Required**; must be valid UUID                     |
| Search Factors  | `page`          | Optional; integer ≥ 1, default 1                     |
| Search Factors  | `pageSize`      | Optional; integer 1–100, default 20                  |
| Resolve Factors | `authority`     | **Required**; must be valid authority enum           |
| Resolve Factors | `reportingYear` | **Required**; integer 1990–2100                      |
| Resolve Factors | `fuelType`      | **Required**; non-empty string                       |
| Resolve Factors | `gas`           | **Required**; non-empty string                       |
| Resolve Factors | `category`      | **Required**; non-empty string                       |
| Fuel Properties | `libraryId`     | **Required**; must be valid UUID                     |
| Fuel Properties | `propertyType`  | Optional; must be `density` or `ncv` if supplied     |
| GWP Values      | `version`       | Optional; must be `ar4`, `ar5`, or `ar6` if supplied |

All query string values are coerced from string to number where needed (e.g., `releaseYear`, `reportingYear`, `page`, `pageSize`).

---

## Business Logic & Edge Cases

- **Read-only domain**: No mutations. All 5 endpoints are GET. No POST/PATCH/DELETE.
- **Library year selection in `/resolve`**: The system selects the library with the highest `releaseYear` that does not exceed `reportingYear`. This follows GHG Protocol guidance that you use the factor edition available at reporting time. If `reportingYear=2024` and available library years are [2022, 2023], it picks 2023.
- **Default library fallback**: If no library matches the year, the system uses the `isDefault: true` library for that authority. `usedFallback: true` in the response indicates this occurred.
- **Null factor response is valid**: `/resolve` returns `factor: null` when no match exists — this is not an error (HTTP 200). The UI should handle this case explicitly (prompt user to select a different authority or enter manually).
- **`tier` indicates match quality**: `specific` > `regional` > `global`. Global means only a worldwide average was available — suitable for preliminary estimates, not final reporting.
- **`isBiogenic`**: Some GHG frameworks (e.g., CSRD, GHG Protocol) exclude biogenic CO₂ from the fossil emissions total. Flag this in the UI if your calculation screen distinguishes scope totals.
- **`oxidationFactor`**: Typically 0.99–1.0. Some calculation flows multiply `value * oxidationFactor`; others use `value` alone (factor already incorporates it). Confirm with calculation engine.
- **No role-based access control**: Any authenticated user can access all endpoints. No tenant scoping — this is global reference data shared across all tenants.
- **No pagination on library/fuel/gwp endpoints**: Only `/emission-factors` paginates. The other endpoints return full arrays.

---

## Integration Notes

- **Recommended flow for emissions entry**:
  1. Fetch tenant settings → get configured `authority` and `gwpVersion`
  2. Call `GET /emission-factor-libraries?authority={authority}` → show available library versions (optional/advanced)
  3. On activity data entry (fuel type, gas, category, region, technology, reporting year) → call `GET /emission-factors/resolve`
  4. Display resolved factor with tier badge; warn if `tier === 'global'` or `usedFallback === true`
  5. Use factor `value` in calculation; fetch GWP via `GET /gwp-values?version={gwpVersion}` for non-CO₂ gases
- **Optimistic UI**: Safe for library/factor listing (static reference data); not applicable for resolve (depends on inputs).
- **Caching**: This is stable reference data — safe to cache aggressively (e.g., 24h for library lists, session-level for factor lookups). No cache invalidation signals are emitted; data changes only when new emission factor datasets are loaded by admins.
- **Authority default**: The tenant's `ghgAuthority` setting (from tenant settings API) provides the default authority value for pre-filling the resolve endpoint's `authority` param.
- **GWP version default**: The tenant's `gwpVersion` setting provides the default for filtering `GET /gwp-values`.

---

## Error Response Shape

All errors follow this structure:

```json
{
  "error": "Validation error: Invalid library ID",
  "code": "VALIDATION_FAILED",
  "details": {
    "issues": [
      {
        "code": "invalid_string",
        "message": "Invalid library ID",
        "path": ["libraryId"]
      }
    ]
  }
}
```

| HTTP Code | Scenario                                                                     |
| --------- | ---------------------------------------------------------------------------- |
| 400       | Invalid UUID, invalid enum value, missing required field, value out of range |
| 401       | Missing or invalid JWT token                                                 |
| 500       | Server/database error                                                        |

---

## Test Scenarios

1. **Happy path — list libraries**: `GET /emission-factor-libraries` returns array; empty array if no data seeded.
2. **Happy path — filter libraries**: `GET /emission-factor-libraries?authority=defra` returns only DEFRA libraries.
3. **Happy path — paginate factors**: `GET /emission-factors?libraryId={id}&pageSize=5&page=2` returns page 2 with correct `totalPages`.
4. **Happy path — resolve specific tier**: Supply all of `region` + `technology` matching a seeded factor → `tier === 'specific'`.
5. **Happy path — resolve with fallback**: Supply `reportingYear` beyond all available library years → `usedFallback: true`.
6. **Happy path — resolve no match**: Supply `fuelType` not in database → `factor: null, tier: null, library: null`.
7. **Validation — missing libraryId**: `GET /emission-factors` (no params) → 400 `VALIDATION_FAILED`.
8. **Validation — invalid UUID**: `GET /emission-factors?libraryId=not-a-uuid` → 400 `VALIDATION_FAILED`.
9. **Validation — invalid authority**: `GET /emission-factors/resolve?authority=unknown&...` → 400.
10. **Validation — reportingYear out of range**: `?reportingYear=1800` → 400.
11. **Unauthorized**: No `Authorization` header → 401.
12. **GWP filter**: `GET /gwp-values?version=ar5` returns only AR5 rows.
13. **Fuel properties filter**: `GET /fuel-properties?libraryId={id}&propertyType=ncv` returns only NCV properties.
