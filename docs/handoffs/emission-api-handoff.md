# API Handoff: Emission Domain (Sources, Entries, Evidence, Reference Data)

## Business Context

The Emission domain handles Scope 1 GHG emission data: creating emission sources (equipment/vehicles), recording emission entries with automatic CO2e calculation, and managing evidence files via S3. It also provides read-only reference data (emission factor libraries, fuel properties, GWP values) used by the calculation engine and for building frontend dropdowns.

Two separate API base paths:

- **Emission API** (`/v1/emission/*`): CRUD for sources, entries, evidence
- **Emission-Factor API** (`/v1/emission-factors/*`): Read-only reference data

Key domain terms:

- **Emission source**: A piece of equipment, vehicle, or process that emits GHGs
- **Emission entry**: A recorded measurement with calculated CO2e (linked to a source and/or campaign task)
- **Calculation trace**: Full audit trail of how CO2e was computed (SCD Type 2 — historical traces preserved)
- **Evidence file**: Supporting documentation uploaded to S3 (invoices, meter readings, etc.)
- **Emission factor**: Reference value for how much GHG a fuel/activity produces per unit
- **GWP (Global Warming Potential)**: Conversion factor for non-CO2 gases to CO2 equivalent

## Endpoints

---

### Emission Sources

#### POST /v1/emission/emission-sources

- **Purpose**: Create a new emission source
- **Auth**: `data_entry` or higher
- **Request**:

  ```json
  {
    "orgUnitId": "uuid — required",
    "category": "'stationary' | 'mobile' | 'fugitive' | 'process' — required",
    "name": "string — 1-255 chars, required",
    "meterNumber": "string | null — max 100 chars",
    "vehicleType": "string | null — max 100 chars",
    "technology": "string | null — max 100 chars",
    "defaultFuelType": "string | null — max 100 chars",
    "defaultGasType": "string | null — max 100 chars"
  }
  ```

- **Response** (201):

  ```json
  {
    "id": "uuid",
    "tenantId": "uuid",
    "orgUnitId": "uuid",
    "category": "stationary",
    "name": "Boiler Room A",
    "meterNumber": "MTR-001",
    "vehicleType": null,
    "technology": null,
    "defaultFuelType": "natural_gas",
    "defaultGasType": null,
    "isActive": true,
    "createdBy": "uuid",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
  ```

- **Response** (error): `400` validation, `401` missing claims, `403` insufficient role
- **Notes**: `tenantId` and `createdBy` injected from JWT. `isActive` always `true` on create.

#### GET /v1/emission/emission-sources

- **Purpose**: List emission sources for the tenant
- **Auth**: Any authenticated user
- **Request**: Query params:
  - `orgUnitId?: uuid` — filter by org unit
  - `category?: EmissionCategory` — filter by category
  - `isActive?: 'true' | 'false'` — filter by active status (string coerced to boolean)
- **Response** (200): `EmissionSourceResponseDto[]`

#### GET /v1/emission/emission-sources/{id}

- **Purpose**: Get a single emission source
- **Auth**: Any authenticated user
- **Response** (200): `EmissionSourceResponseDto`
- **Response** (error): `404` not found or wrong tenant

#### PATCH /v1/emission/emission-sources/{id}

- **Purpose**: Update an emission source (partial)
- **Auth**: `data_entry` or higher
- **Request**:

  ```json
  {
    "name": "string — 1-255 chars, optional",
    "meterNumber": "string | null — max 100 chars",
    "vehicleType": "string | null — max 100 chars",
    "technology": "string | null — max 100 chars",
    "defaultFuelType": "string | null — max 100 chars",
    "defaultGasType": "string | null — max 100 chars",
    "isActive": "boolean — optional"
  }
  ```

- **Response** (200): `EmissionSourceResponseDto`
- **Notes**: `category` and `orgUnitId` are NOT updatable after creation.

#### DELETE /v1/emission/emission-sources/{id}

- **Purpose**: Soft-delete (sets `isActive = false`)
- **Auth**: `tenant_admin` or higher
- **Response** (200): `EmissionSourceResponseDto` with `isActive: false`

---

### Emission Entries

#### POST /v1/emission/emission-entries

- **Purpose**: Create an emission entry and run CO2e calculation
- **Auth**: `data_entry` or higher
- **Request**: Query param: `dryRun=true` (optional) — calculate without persisting
- **Request body**:

  ```json
  {
    "orgUnitId": "uuid — required",
    "sourceId": "uuid | null — optional link to emission source",
    "category": "'stationary' | 'mobile' | 'fugitive' | 'process' — required",
    "calculationMethod": "required — see CalculationMethod enum",
    "reportingYear": "integer 2000-2100, required",
    "startDate": "YYYY-MM-DD, required",
    "endDate": "YYYY-MM-DD, required",
    "fuelType": "string | null — for stationary/mobile-fuel",
    "activityAmount": "number | null — positive, fuel quantity",
    "activityUnit": "string | null — e.g. 'm3', 'litres', 'kg'",
    "distance": "number | null — positive, for mobile-distance",
    "distanceUnit": "'km' | 'miles' | null",
    "vehicleType": "string | null",
    "technology": "string | null",
    "productionVolume": "number | null — positive, for process",
    "productionUnit": "string | null",
    "abatementEfficiency": "number | null — 0.0 to 1.0, for process-gas-abatement",
    "gasType": "string | null — for fugitive",
    "refrigerantInventoryStart": "number | null — >= 0",
    "refrigerantInventoryEnd": "number | null — >= 0",
    "refrigerantPurchased": "number | null — >= 0",
    "refrigerantRecovered": "number | null — >= 0",
    "notes": "string | null — max 2000 chars",
    "evidenceIds": ["uuid — required if no taskId"],
    "taskId": "uuid | null — link to campaign task"
  }
  ```

- **Response** (201):

  ```json
  {
    "id": "uuid (or 'dry-run')",
    "tenantId": "uuid",
    "orgUnitId": "uuid",
    "sourceId": "uuid | null",
    "category": "stationary",
    "calculationMethod": "ipcc_energy_based",
    "reportingYear": 2025,
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "fuelType": "natural_gas",
    "gasType": null,
    "activityAmount": 1000,
    "activityUnit": "m3",
    "distance": null,
    "distanceUnit": null,
    "vehicleType": null,
    "technology": null,
    "productionVolume": null,
    "productionUnit": null,
    "abatementEfficiency": null,
    "refrigerantInventoryStart": null,
    "refrigerantInventoryEnd": null,
    "refrigerantPurchased": null,
    "refrigerantRecovered": null,
    "notes": null,
    "createdBy": "uuid",
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601",
    "trace": {
      "calculationMethod": "ipcc_energy_based",
      "authority": "ipcc",
      "gwpBasis": "ar6",
      "gwpCh4": 27.9,
      "gwpN2o": 273,
      "factorLibraryId": "uuid",
      "factorLibraryVersion": "2023",
      "factorResolutionTier": "global",
      "basisAmount": 800,
      "basisUnit": "kg",
      "energyTj": 0.0000392,
      "massKg": null,
      "massGg": null,
      "co2Kg": 2200.5,
      "ch4Kg": 0.04,
      "n2oKg": 0.001,
      "biogenicCo2Kg": null,
      "co2Co2eKg": 2200.5,
      "ch4Co2eKg": 1.116,
      "n2oCo2eKg": 0.273,
      "totalCo2eKg": 2201.889,
      "totalCo2eTonnes": 2.201889,
      "formulaText": "CO2e = energy_TJ * EF * GWP"
    }
  }
  ```

- **Response** (error):
  - `400` — validation failure
  - `404` — org unit not found
  - `422` — evidence not uploaded, missing evidence, calculation error, no GWP configured
- **Notes**:
  - `dryRun=true` runs full calculation without persisting. Returns `id: 'dry-run'`.
  - If `taskId` is absent: `evidenceIds` required and all must have `status: 'uploaded'`
  - If `taskId` is present: evidence validation skipped (managed by campaign domain)
  - Standalone entries (no taskId) get `status: 'approved'`; task-linked entries get `status: 'draft'`
  - Calculation uses org unit's `scope1Authority` and `gwpVersion` settings

#### GET /v1/emission/emission-entries

- **Purpose**: List entries with pagination
- **Auth**: Any authenticated user
- **Request**: Query params:
  - `orgUnitId?: uuid`
  - `reportingYear?: number` (coerced from string)
  - `category?: EmissionCategory`
  - `page?: number` (default 1, min 1)
  - `pageSize?: number` (default 20, min 1, max 100)
- **Response** (200):

  ```json
  {
    "data": ["EmissionEntryResponseDto[] — trace is null for all items"],
    "total": 150,
    "page": 1,
    "pageSize": 20
  }
  ```

- **Notes**: Traces NOT included in list (always `null`). Fetch individual entry for trace.

#### GET /v1/emission/emission-entries/{id}

- **Purpose**: Get a single entry with its current calculation trace
- **Auth**: Any authenticated user
- **Response** (200): `EmissionEntryResponseDto` with `trace` populated

#### PATCH /v1/emission/emission-entries/{id}

- **Purpose**: Update an entry and recalculate CO2e
- **Auth**: `data_entry` or higher
- **Request**: Same fields as create, all optional (at least one required). Additionally:
  - `evidenceIds?: string[]` — min 1 if provided, replaces current links
- **Response** (200): `EmissionEntryResponseDto` with updated trace
- **Response** (error): `404` not found, `409` entry is locked
- **Notes**:
  - At least one field must be provided (Zod refinement)
  - Omitted fields retain existing values for recalculation (merge logic)
  - **Locked entries cannot be updated** — returns `409 EmissionEntryLockedError`
  - Previous calculation trace gets `isCurrent: false` (SCD Type 2), new trace inserted

#### DELETE /v1/emission/emission-entries/{id}

- **Purpose**: Hard-delete an entry (cascades to traces)
- **Auth**: `data_entry` or higher
- **Response** (200): No body
- **Response** (error): `404` not found

#### GET /v1/emission/emission-entries/{id}/traces

- **Purpose**: List all calculation traces for an entry (full audit history)
- **Auth**: Any authenticated user
- **Response** (200): `CalculationTraceResponseDto[]` — ordered most recent first
- **Notes**: Each trace is a historical snapshot. The `isCurrent: true` trace matches the one in `GET /emission-entries/{id}`.

---

### Evidence Files

Three-step upload flow:

1. **Request presigned URL** → `POST /evidence/upload-url`
2. **Upload file to S3** → `PUT {presignedUrl}` (direct to S3, not through API)
3. **Confirm upload** → `POST /evidence/{id}/confirm`

#### POST /v1/emission/evidence/upload-url

- **Purpose**: Get a presigned S3 upload URL
- **Auth**: `data_entry` or higher
- **Request**:

  ```json
  {
    "originalFilename": "string — 1-255 chars, required",
    "contentType": "string — MIME type, 1-100 chars, required"
  }
  ```

- **Response** (201):

  ```json
  {
    "evidenceId": "uuid",
    "uploadUrl": "https://s3.amazonaws.com/... (presigned PUT URL)",
    "s3Key": "tenant-uuid/evidence/1706000000-filename.pdf",
    "expiresAt": "ISO 8601 — URL valid for 15 minutes"
  }
  ```

- **Notes**: After receiving the URL, upload the file directly to S3:

  ```
  PUT {uploadUrl}
  Content-Type: {same contentType from request}
  Body: <raw file bytes>
  ```

#### POST /v1/emission/evidence/{id}/confirm

- **Purpose**: Confirm file upload completed, transition status to `uploaded`
- **Auth**: `data_entry` or higher
- **Response** (200):

  ```json
  {
    "id": "uuid",
    "tenantId": "uuid",
    "entryId": "null (not yet linked)",
    "s3Key": "string",
    "originalFilename": "string",
    "contentType": "string",
    "sizeBytes": null,
    "status": "uploaded",
    "uploadedAt": "ISO 8601",
    "createdBy": "uuid",
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601"
  }
  ```

- **Response** (error):
  - `404` — evidence not found
  - `409` — already confirmed or already linked
  - `422` — file not found in S3 (upload hasn't completed)

#### GET /v1/emission/evidence/{id}/download-url

- **Purpose**: Get a presigned S3 download URL
- **Auth**: Any authenticated user
- **Response** (200): Plain string (presigned download URL, valid for 5 minutes)
- **Response** (error): `404` not found, `422` file still `pending_upload`
- **Notes**: Response is a raw string URL, not JSON.

#### DELETE /v1/emission/evidence/{id}

- **Purpose**: Delete evidence file from S3 and database
- **Auth**: `data_entry` or higher
- **Response** (200): No body
- **Response** (error): `404` not found, `409` file is `linked` to an entry

---

### Emission Factor Reference Data (Read-Only)

All endpoints under `/v1/emission-factors/*`. Any authenticated user, no minimum role.

#### GET /v1/emission-factors/emission-factor-libraries

- **Purpose**: List emission factor libraries
- **Auth**: Any authenticated user
- **Request**: Query params:
  - `authority?: 'ipcc' | 'defra' | 'epa' | 'iea' | 'egrid'`
  - `releaseYear?: number` (1990-2100)
- **Response** (200):

  ```json
  [
    {
      "id": "uuid",
      "name": "IPCC 2006 Guidelines",
      "authority": "ipcc",
      "version": "2023",
      "releaseYear": 2023,
      "isDefault": true,
      "createdAt": "ISO 8601"
    }
  ]
  ```

- **Notes**: Ordered by `authority`, then `releaseYear` ascending.

#### GET /v1/emission-factors/emission-factors

- **Purpose**: Search emission factors within a library (paginated)
- **Auth**: Any authenticated user
- **Request**: Query params:
  - `libraryId: uuid` — **REQUIRED**
  - `fuelType?: string`
  - `gas?: string` (e.g., `CO2`, `CH4`, `N2O`, `CO2e`)
  - `category?: string`
  - `region?: string`
  - `technology?: string`
  - `unit?: string`
  - `page?: number` (default 1)
  - `pageSize?: number` (default 20, max 100)
- **Response** (200):

  ```json
  {
    "items": [
      {
        "id": "uuid",
        "libraryId": "uuid",
        "externalId": "string | null",
        "category": "stationary",
        "fuelType": "natural_gas",
        "gas": "CO2",
        "isBiogenic": false,
        "value": 56.1,
        "oxidationFactor": 1.0,
        "unit": "kg/GJ",
        "region": null,
        "technology": null,
        "createdAt": "ISO 8601"
      }
    ],
    "total": 250,
    "page": 1,
    "pageSize": 20,
    "totalPages": 13
  }
  ```

#### GET /v1/emission-factors/emission-factors/resolve

- **Purpose**: Resolve the best-matching emission factor using tiered hierarchy
- **Auth**: Any authenticated user
- **Request**: Query params (all required except region/technology):
  - `authority: 'ipcc' | 'defra' | 'epa' | 'iea' | 'egrid'` — **REQUIRED**
  - `reportingYear: number` — **REQUIRED**
  - `fuelType: string` — **REQUIRED**
  - `gas: string` — **REQUIRED**
  - `category: string` — **REQUIRED**
  - `region?: string`
  - `technology?: string`
- **Response** (200):

  ```json
  {
    "factor": "EmissionFactorResponseDto | null",
    "tier": "'specific' | 'regional' | 'global' | null",
    "library": "EmissionFactorLibraryResponseDto | null",
    "usedFallback": false
  }
  ```

- **Notes**:
  - Returns nulls (not 404) when no match found
  - Resolution: specific (technology+region) > regional (region) > global
  - Selects most recent eligible library (`releaseYear <= reportingYear`), falls back to `isDefault` library

#### GET /v1/emission-factors/fuel-properties

- **Purpose**: List fuel properties (density and NCV values)
- **Auth**: Any authenticated user
- **Request**: Query params:
  - `libraryId: uuid` — **REQUIRED**
  - `fuelType?: string`
  - `propertyType?: 'density' | 'ncv'`
- **Response** (200):

  ```json
  [
    {
      "id": "uuid",
      "libraryId": "uuid",
      "fuelType": "natural_gas",
      "propertyType": "density",
      "value": 0.717,
      "unit": "kg/m3",
      "region": null,
      "createdAt": "ISO 8601"
    }
  ]
  ```

#### GET /v1/emission-factors/gwp-values

- **Purpose**: List Global Warming Potential values
- **Auth**: Any authenticated user
- **Request**: Query params:
  - `version?: 'ar4' | 'ar5' | 'ar6'`
- **Response** (200):

  ```json
  [
    {
      "id": "uuid",
      "version": "ar6",
      "gas": "CH4",
      "value": 27.9,
      "createdAt": "ISO 8601"
    }
  ]
  ```

## Data Models / DTOs

```typescript
interface EmissionSourceResponseDto {
  id: string;
  tenantId: string;
  orgUnitId: string;
  category: EmissionCategoryValue;
  name: string;
  meterNumber: string | null;
  vehicleType: string | null;
  technology: string | null;
  defaultFuelType: string | null;
  defaultGasType: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface EmissionEntryResponseDto {
  id: string;
  tenantId: string;
  orgUnitId: string;
  sourceId: string | null;
  category: EmissionCategoryValue;
  calculationMethod: CalculationMethodValue;
  reportingYear: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  fuelType: string | null;
  gasType: string | null;
  activityAmount: number | null;
  activityUnit: string | null;
  distance: number | null;
  distanceUnit: string | null;
  vehicleType: string | null;
  technology: string | null;
  productionVolume: number | null;
  productionUnit: string | null;
  abatementEfficiency: number | null;
  refrigerantInventoryStart: number | null;
  refrigerantInventoryEnd: number | null;
  refrigerantPurchased: number | null;
  refrigerantRecovered: number | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  trace: CalculationTraceResponseDto | null;
}

interface CalculationTraceResponseDto {
  calculationMethod: string;
  authority: string;
  gwpBasis: string | null;
  gwpCh4: number | null;
  gwpN2o: number | null;
  factorLibraryId: string | null;
  factorLibraryVersion: string | null;
  factorResolutionTier: string | null; // 'specific' | 'regional' | 'global'
  basisAmount: number | null;
  basisUnit: string | null;
  energyTj: number | null;
  massKg: number | null;
  massGg: number | null;
  co2Kg: number | null;
  ch4Kg: number | null;
  n2oKg: number | null;
  biogenicCo2Kg: number | null;
  co2Co2eKg: number | null;
  ch4Co2eKg: number | null;
  n2oCo2eKg: number | null;
  totalCo2eKg: number;
  totalCo2eTonnes: number;
  formulaText: string | null;
}

interface EvidenceFileResponseDto {
  id: string;
  tenantId: string;
  entryId: string | null;
  s3Key: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number | null;
  status: "pending_upload" | "uploaded" | "linked";
  uploadedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface ResolvedEmissionFactorResponseDto {
  factor: EmissionFactorResponseDto | null;
  tier: "specific" | "regional" | "global" | null;
  library: EmissionFactorLibraryResponseDto | null;
  usedFallback: boolean;
}
```

## Enums & Constants

| Enum                      | Values                                                                                                                                             | Notes                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `EmissionCategory`        | `stationary`, `mobile`, `fugitive`, `process`                                                                                                      | Categories of Scope 1 emissions |
| `CalculationMethod`       | `ipcc_energy_based`, `defra_direct`, `ipcc_mobile_fuel`, `ipcc_mobile_distance`, `material_balance`, `process_production`, `process_gas_abatement` | Calculation approaches          |
| `EvidenceStatus`          | `pending_upload`, `uploaded`, `linked`                                                                                                             | Evidence file lifecycle         |
| `EmissionFactorAuthority` | `ipcc`, `defra`, `epa`, `iea`, `egrid`                                                                                                             | Reference data sources          |
| `GwpVersion`              | `ar4`, `ar5`, `ar6`                                                                                                                                | IPCC assessment report versions |
| `FuelPropertyType`        | `density`, `ncv`                                                                                                                                   | Physical fuel properties        |
| `ResolutionTier`          | `specific`, `regional`, `global`                                                                                                                   | Factor match specificity        |

### Category-Method Compatibility

| Category     | Valid Calculation Methods                     |
| ------------ | --------------------------------------------- |
| `stationary` | `ipcc_energy_based`, `defra_direct`           |
| `mobile`     | `ipcc_mobile_fuel`, `ipcc_mobile_distance`    |
| `fugitive`   | `material_balance`                            |
| `process`    | `process_production`, `process_gas_abatement` |

### Fields Required Per Category

| Category + Method           | Required Fields                                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Stationary (energy/defra)   | `fuelType`, `activityAmount`, `activityUnit`                                                                      |
| Mobile (fuel)               | `fuelType`, `activityAmount` (as fuel mass kg)                                                                    |
| Mobile (distance)           | `distance`, `distanceUnit`, `vehicleType`                                                                         |
| Fugitive (material balance) | `gasType`, `refrigerantInventoryStart`, `refrigerantInventoryEnd`, `refrigerantPurchased`, `refrigerantRecovered` |
| Process (production)        | `productionVolume`, `productionUnit`                                                                              |
| Process (abatement)         | `activityAmount`, `abatementEfficiency`                                                                           |

## Validation Rules

### Emission Source

| Field                | Rule                             |
| -------------------- | -------------------------------- |
| `name`               | 1-255 chars, required            |
| `orgUnitId`          | valid UUID, required             |
| `category`           | valid EmissionCategory, required |
| `meterNumber`        | max 100 chars                    |
| All optional strings | max 100 chars                    |

### Emission Entry

| Field                  | Rule                              |
| ---------------------- | --------------------------------- |
| `orgUnitId`            | valid UUID, required              |
| `category`             | valid EmissionCategory, required  |
| `calculationMethod`    | valid CalculationMethod, required |
| `reportingYear`        | integer 2000-2100, required       |
| `startDate`, `endDate` | YYYY-MM-DD, required              |
| `activityAmount`       | must be positive if provided      |
| `distance`             | must be positive if provided      |
| `productionVolume`     | must be positive if provided      |
| `abatementEfficiency`  | 0.0 to 1.0 if provided            |
| `refrigerant*` fields  | >= 0 if provided                  |
| `notes`                | max 2000 chars                    |
| `evidenceIds`          | required if no `taskId`           |

### Evidence

| Field              | Rule                             |
| ------------------ | -------------------------------- |
| `originalFilename` | 1-255 chars, required            |
| `contentType`      | 1-100 chars, MIME type, required |

## Business Logic & Edge Cases

- **Dry run mode**: `POST /emission-entries?dryRun=true` calculates without persisting. Returns `id: 'dry-run'`. Useful for previewing CO2e before final submission.
- **Locked entries are immutable**: Entries with `status: 'locked'` (from campaign approval) cannot be updated — returns 409.
- **SCD Type 2 traces**: On update, previous trace gets `isCurrent: false`, new trace inserted. All historical traces available via GET `/traces`.
- **Evidence lifecycle**: `pending_upload` -> `uploaded` (after confirm) -> `linked` (after entry creation/update). Cannot delete `linked` evidence.
- **Presigned URL expiry**: Upload URLs valid for 15 minutes, download URLs for 5 minutes.
- **Org unit settings affect calculations**: The org unit's `scope1Authority` determines which emission factor library is used. The `gwpVersion` determines GWP values for fugitive emissions.
- **Factor resolution**: Automatically selects best-matching library and factor using tiered hierarchy (specific > regional > global).
- **Miles to km conversion**: Distance in miles is automatically converted to km (x 1.60934).
- **Hard delete for entries**: Entries are hard-deleted (not soft-deleted), cascading to calculation traces.
- **Soft delete for sources**: Sources are deactivated (`isActive: false`), not removed.
- **Evidence for standalone vs task entries**: Standalone entries (no `taskId`) require `evidenceIds` at creation. Task-linked entries manage evidence separately through the campaign workflow.

## Integration Notes

- **Evidence upload flow**:
  1. `POST /evidence/upload-url` — get presigned URL and `evidenceId`
  2. `PUT {uploadUrl}` with file bytes (direct to S3)
  3. `POST /evidence/{evidenceId}/confirm` — verify upload
  4. Include `evidenceIds` in `POST /emission-entries` or `PATCH /emission-entries/{id}`
- **Calculation preview**: Use `dryRun=true` query param on entry creation to preview CO2e before committing.
- **Trace history**: Use `GET /emission-entries/{id}/traces` to show calculation audit trail (most recent first).
- **Reference data for dropdowns**: Use emission-factor endpoints to populate fuel type, gas type, and other dropdowns.
- **Factor resolution for display**: Use `GET /emission-factors/resolve` to show users which factor/library will be used for their inputs.
- **Optimistic UI**: Safe for source/entry CRUD. Not safe for evidence confirm (S3 may not have received file yet).
- **Pagination**: Entry list supports pagination (default 20, max 100). Sources and evidence are not paginated.
- **No real-time**: No websocket/SSE. Poll or refresh after actions.

## Test Scenarios

1. **Happy path — emission entry**: Create source -> Create entry with evidence -> Verify trace populated
2. **Dry run**: Create entry with `dryRun=true`, verify `id: 'dry-run'` and trace present
3. **Evidence upload flow**: Request URL -> Upload to S3 -> Confirm -> Link to entry
4. **Update recalculation**: Create entry -> Update `activityAmount` -> Verify new trace, old trace preserved
5. **Locked entry rejection**: Attempt to update locked entry -> 409
6. **Evidence not uploaded**: Confirm evidence before S3 upload completes -> 422
7. **Delete linked evidence**: Attempt to delete evidence linked to an entry -> 409
8. **Factor resolution**: Resolve factor with specific region -> verify tier = 'specific'
9. **Fugitive without GWP**: Create fugitive entry when org unit has no gwpVersion -> 422
   1
