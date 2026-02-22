# API Handoff: Campaign Domain (Indicators, Campaigns, Tasks)

## Business Context

The Campaign domain manages GHG data collection campaigns. A campaign ties together an indicator (what to measure), a workflow template (how to approve), and organizational units (who reports). When activated, one task per org unit is created. Tasks follow a multi-tier approval workflow: data entry users fill in emission data, then approvers review tier-by-tier until the final tier locks the data.

Key domain terms:

- **Indicator**: A named measurement type mapping to an emission category and calculation method (e.g., "Stationary Combustion - IPCC Energy Based")
- **Campaign**: A time-bound data collection effort for a specific indicator across selected org units
- **Task**: A per-org-unit work item created on campaign activation, following the approval lifecycle
- **Approval tier**: Multi-level review (1-3 tiers). Each tier's approver is resolved from the org unit hierarchy.
- **Approver override**: Per-org-unit, per-tier override of the default approver resolution

## Endpoints

---

### Indicators

#### POST /v1/indicators

- **Purpose**: Create a tenant-specific indicator
- **Auth**: `tenant_admin` or higher
- **Request**:

  ```json
  {
    "name": "string — 1-200 chars, required",
    "emissionCategory": "'stationary' | 'mobile' | 'fugitive' | 'process' — required",
    "calculationMethod": "'ipcc_energy_based' | 'defra_direct' | 'ipcc_mobile_fuel' | 'ipcc_mobile_distance' | 'material_balance' | 'process_production' | 'process_gas_abatement' — required",
    "defaultFuelType": "string | null — max 100 chars, optional",
    "defaultGasType": "string | null — max 100 chars, optional"
  }
  ```

- **Response** (201):

  ```json
  {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "string",
    "emissionCategory": "string",
    "calculationMethod": "string",
    "defaultFuelType": "string | null",
    "defaultGasType": "string | null",
    "isGlobal": false,
    "isActive": true,
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601"
  }
  ```

- **Response** (error): `400` validation, `401` missing claims, `403` insufficient role
- **Notes**: `isGlobal` is always `false` for tenant-created indicators. `tenantId` and `createdBy` injected from JWT.

#### GET /v1/indicators

- **Purpose**: List indicators visible to the tenant (own + global)
- **Auth**: Any authenticated user
- **Request**: Query params:
  - `isGlobal?: 'true' | 'false'` — filter by global/tenant-specific
  - `category?: string` — filter by `emissionCategory`
- **Response** (200): `IndicatorResponseDto[]`
- **Notes**: Returns tenant indicators PLUS global indicators (`tenantId: null`). Soft-deleted excluded. Both filters optional and combinable.

#### PATCH /v1/indicators/{id}

- **Purpose**: Update an indicator (partial)
- **Auth**: `tenant_admin` or higher
- **Request**:

  ```json
  {
    "name": "string — 1-200 chars, optional",
    "defaultFuelType": "string | null — max 100 chars, optional",
    "defaultGasType": "string | null — max 100 chars, optional",
    "isActive": "boolean — optional"
  }
  ```

- **Response** (200): `IndicatorResponseDto`
- **Response** (error): `403` insufficient role, `404` not found for tenant
- **Notes**: `emissionCategory` and `calculationMethod` are NOT updatable after creation. Tenants cannot update global indicators (silently returns 404).

#### DELETE /v1/indicators/{id}

- **Purpose**: Soft-delete an indicator
- **Auth**: `tenant_admin` or higher
- **Response** (200): Empty body / `null`
- **Response** (error): `403` insufficient role, `404` not found
- **Notes**: No guard preventing deletion of indicators referenced by active campaigns. Frontend should warn users.

---

### Campaigns

#### POST /v1/campaigns

- **Purpose**: Create a new campaign (starts as `draft`)
- **Auth**: `tenant_admin` or higher
- **Request**:

  ```json
  {
    "name": "string — 1-200 chars, required",
    "indicatorId": "uuid — required, must exist for tenant",
    "workflowTemplateId": "uuid — required (active check deferred to activation)",
    "approvalTiers": "integer 1-3, required",
    "reportingYear": "integer 2000-2100, required",
    "periodStart": "YYYY-MM-DD, required",
    "periodEnd": "YYYY-MM-DD, required, must be > periodStart",
    "orgUnitIds": ["uuid — min 1, no duplicates"],
    "approverOverrides": [
      {
        "orgUnitId": "uuid — should be in orgUnitIds",
        "tier": "integer — 1 to approvalTiers",
        "userId": "uuid — approver user"
      }
    ]
  }
  ```

- **Response** (201): `CampaignResponseDto`

  ```json
  {
    "id": "uuid",
    "name": "string",
    "indicatorId": "uuid",
    "indicator": { "name": "string", "emissionCategory": "string" },
    "workflowTemplateId": "uuid",
    "approvalTiers": 2,
    "reportingYear": 2025,
    "periodStart": "2025-01-01",
    "periodEnd": "2025-12-31",
    "status": "draft",
    "orgUnits": [{ "orgUnitId": "uuid", "orgUnitName": "string" }],
    "approverOverrides": [{ "orgUnitId": "uuid", "tier": 1, "userId": "uuid" }],
    "createdBy": "uuid",
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601"
  }
  ```

- **Response** (error): `400` validation, `403` role, `404` indicator not found
- **Notes**:
  - Zod refinements: `periodStart < periodEnd`, override tiers <= `approvalTiers`, no duplicate `orgUnitIds`
  - Workflow template is NOT validated at creation time (only at activation)
  - `orgUnitName` in create response equals raw UUID (known gap — names not resolved on create path)

#### GET /v1/campaigns

- **Purpose**: List all campaigns for the tenant
- **Auth**: Any authenticated user
- **Request**: Query params:
  - `status?: 'draft' | 'active' | 'closed'`
  - `reportingYear?: string` (parsed as integer)
- **Response** (200): Flat `Campaign[]` (no org unit or override details):

  ```json
  [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "name": "string",
      "indicatorId": "uuid",
      "workflowTemplateId": "uuid",
      "approvalTiers": 2,
      "reportingYear": 2025,
      "periodStart": "2025-01-01",
      "periodEnd": "2025-12-31",
      "status": "active",
      "createdBy": "uuid",
      "createdAt": "ISO 8601",
      "updatedAt": "ISO 8601"
    }
  ]
  ```

- **Notes**: No org unit or override details. Frontend must call GET /campaigns/{id} for full details.

#### GET /v1/campaigns/{id}

- **Purpose**: Get full campaign with org units and overrides
- **Auth**: Any authenticated user
- **Response** (200): `CampaignWithDetails`

  ```json
  {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "string",
    "indicatorId": "uuid",
    "workflowTemplateId": "uuid",
    "approvalTiers": 2,
    "reportingYear": 2025,
    "periodStart": "2025-01-01",
    "periodEnd": "2025-12-31",
    "status": "draft",
    "createdBy": "uuid",
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601",
    "deletedAt": "ISO 8601 | null",
    "orgUnits": [{ "id": "uuid", "campaignId": "uuid", "orgUnitId": "uuid" }],
    "approverOverrides": [
      {
        "id": "uuid",
        "campaignId": "uuid",
        "orgUnitId": "uuid",
        "tier": 1,
        "userId": "uuid"
      }
    ]
  }
  ```

- **Response** (error): `404` not found
- **Notes**: Returns raw domain type including `tenantId` and `deletedAt`. Date fields are raw `Date` objects (serialized as ISO 8601).

#### PATCH /v1/campaigns/{id}

- **Purpose**: Update a draft campaign (partial)
- **Auth**: `tenant_admin` or higher
- **Request**:

  ```json
  {
    "name": "string — 1-200 chars, optional",
    "indicatorId": "uuid — optional",
    "workflowTemplateId": "uuid — optional",
    "approvalTiers": "integer 1-3, optional",
    "reportingYear": "integer 2000-2100, optional",
    "periodStart": "YYYY-MM-DD, optional",
    "periodEnd": "YYYY-MM-DD, optional",
    "orgUnitIds": ["uuid — min 1, no duplicates, REPLACES existing"],
    "approverOverrides": [{ "orgUnitId": "uuid", "tier": 1, "userId": "uuid" }]
  }
  ```

- **Response** (200): `CampaignWithDetails`
- **Response** (error): `403` role, `404` not found, `409` not draft
- **Notes**: `orgUnitIds` and `approverOverrides` perform full-replace when provided. Only draft campaigns can be updated.

#### DELETE /v1/campaigns/{id}

- **Purpose**: Soft-delete a draft campaign
- **Auth**: `tenant_admin` or higher
- **Response** (200): Empty body
- **Response** (error): `403` role, `404` not found, `409` not draft
- **Notes**: Only draft campaigns can be deleted. No cascade to tasks (draft campaigns have no tasks).

#### POST /v1/campaigns/{id}/activate

- **Purpose**: Activate a campaign — creates tasks and sends email notifications
- **Auth**: `tenant_admin` or higher
- **Request**: No body
- **Response** (200):

  ```json
  {
    "campaign": { "...full campaign object with status: 'active'" },
    "taskCount": 5
  }
  ```

- **Response** (error):
  - `404` — campaign or workflow template not found
  - `409` — campaign not draft, or workflow template not active
- **Notes**:
  - Creates one task per org unit (status `pending`, `currentTier: 0`)
  - **Idempotent**: if tasks already exist (partial prior run), skips task creation
  - **Validates workflow template is `active`** (not checked at campaign creation)
  - Sends "New data collection task" email to all `data_entry` users per org unit (fire-and-forget)
  - Email from: `noreply@akriva.io`

---

### Tasks

#### GET /v1/campaigns/{id}/tasks

- **Purpose**: List tasks for a specific campaign
- **Auth**: Any authenticated user
- **Request**: Query params:
  - `status?: CampaignTaskStatus`
  - `orgUnitId?: uuid`
- **Response** (200): `CampaignTask[]`

  ```json
  [
    {
      "id": "uuid",
      "campaignId": "uuid",
      "orgUnitId": "uuid",
      "tenantId": "uuid",
      "status": "pending",
      "currentTier": 0,
      "emissionEntryId": "uuid | null",
      "submittedAt": "ISO 8601 | null",
      "approvedAt": "ISO 8601 | null",
      "lockedAt": "ISO 8601 | null",
      "createdAt": "ISO 8601",
      "updatedAt": "ISO 8601"
    }
  ]
  ```

- **Notes**: Does NOT validate campaign exists — returns empty array for invalid campaign ID.

#### GET /v1/tasks/my

- **Purpose**: List all tasks assigned to the current user (cross-campaign)
- **Auth**: Any authenticated user
- **Response** (200): `CampaignTask[]`
- **Notes**: Returns tasks for all org units the user is assigned to. No query params. Efficient single DB query using subquery.

#### GET /v1/tasks/{taskId}

- **Purpose**: Get a single task
- **Auth**: Any authenticated user
- **Response** (200): `CampaignTask`
- **Response** (error): `404` not found
- **Notes**: Returns raw `CampaignTask` (not the detailed DTO with emission entry and approval history — that's prepared for future use).

#### POST /v1/tasks/{taskId}/start

- **Purpose**: Start a pending task — creates a draft emission entry pre-filled from the indicator
- **Auth**: `data_entry` or higher
- **Response** (200): `CampaignTask` with `status: 'draft'`, `emissionEntryId` set
- **Response** (error): `404` not found, `409` task not `pending`
- **Notes**:
  - Creates a `draft` emission entry in the emission domain pre-filled with: category, calculation method, reporting year, period dates, fuel/gas types from indicator defaults
  - Links `emissionEntryId` to the task
  - After starting, the user edits the emission entry via emission domain endpoints

#### POST /v1/tasks/{taskId}/submit

- **Purpose**: Submit a task for review
- **Auth**: `data_entry` or higher
- **Response** (200): `CampaignTask` with `status: 'in_review'`, `currentTier: 1`
- **Response** (error):
  - `404` — not found
  - `409` — task not in `draft` or `revision_requested`
  - `422` — missing emission entry, missing `activityAmount`/`activityUnit`, insufficient evidence (< 1 file)
- **Notes**:
  - Valid from `draft` or `revision_requested` states
  - Validates emission entry completeness: entry must exist, `activityAmount` and `activityUnit` must be set, at least 1 evidence file required
  - Resolves tier 1 approver from org unit hierarchy (throws 422 if none found)
  - Sends "Review requested" email to resolved approvers

#### POST /v1/tasks/{taskId}/approve

- **Purpose**: Approve a task at the current tier
- **Auth**: `data_approver` or higher
- **Response** (200): `CampaignTask` with updated tier/status
- **Response** (error):
  - `404` — not found
  - `409` — task not `in_review`
  - `403` — self-approval (actor created the entry or approved at a prior tier)
  - `422` — no eligible approver for next tier
- **Notes**:
  - **Separation of duties**: actor cannot approve if they created the emission entry OR already approved at a prior tier
  - **Non-final tier**: advances `currentTier` by 1, stays `in_review`. Sends "Task approved" email to next tier approvers.
  - **Final tier** (currentTier >= approvalTiers): transitions to `locked`, sets `approvedAt` and `lockedAt`, locks the emission entry

#### POST /v1/tasks/{taskId}/reject

- **Purpose**: Reject a task back to the submitter
- **Auth**: `data_approver` or higher
- **Request**:

  ```json
  {
    "notes": "string — 1-2000 chars, required"
  }
  ```

- **Response** (200): `CampaignTask` with `status: 'revision_requested'`, `currentTier: 0`
- **Response** (error): `404` not found, `409` not `in_review`, `400` missing/invalid notes
- **Notes**:
  - Resets `currentTier` to 0
  - Creates rejection approval record with `notes`
  - Sends "Revision requested" email with notes to all `data_entry` users for the org unit
  - Task can then be resubmitted (submit accepts `revision_requested` state)

## Data Models / DTOs

```typescript
interface IndicatorResponseDto {
  id: string;
  tenantId: string | null; // null for global indicators
  name: string;
  emissionCategory: EmissionCategoryValue;
  calculationMethod: CalculationMethodValue;
  defaultFuelType: string | null;
  defaultGasType: string | null;
  isGlobal: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CampaignResponseDto {
  id: string;
  name: string;
  indicatorId: string;
  indicator: { name: string; emissionCategory: string } | null;
  workflowTemplateId: string;
  approvalTiers: number;
  reportingYear: number;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  status: CampaignStatusValue;
  orgUnits: { orgUnitId: string; orgUnitName: string }[];
  approverOverrides: { orgUnitId: string; tier: number; userId: string }[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CampaignTask {
  id: string;
  campaignId: string;
  orgUnitId: string;
  tenantId: string;
  status: CampaignTaskStatusValue;
  currentTier: number; // 0 = not in review, 1-3 = active tier
  emissionEntryId: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  lockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## Enums & Constants

| Enum                 | Values                                                                                                                                             | Display Labels                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `EmissionCategory`   | `stationary`, `mobile`, `fugitive`, `process`                                                                                                      | Stationary Combustion, Mobile Combustion, Fugitive Emissions, Process Emissions |
| `CalculationMethod`  | `ipcc_energy_based`, `defra_direct`, `ipcc_mobile_fuel`, `ipcc_mobile_distance`, `material_balance`, `process_production`, `process_gas_abatement` | IPCC Energy Based, DEFRA Direct, etc.                                           |
| `CampaignStatus`     | `draft`, `active`, `closed`                                                                                                                        | Draft, Active, Closed                                                           |
| `CampaignTaskStatus` | `pending`, `draft`, `submitted`, `in_review`, `revision_requested`, `approved`, `locked`                                                           | Pending, Draft, Submitted, In Review, Revision Requested, Approved, Locked      |
| `ApprovalAction`     | `approve`, `reject`                                                                                                                                | Approve, Reject                                                                 |
| `TenantRole`         | `viewer`, `data_entry`, `data_approver`, `tenant_admin`, `super_admin`                                                                             | Viewer, Data Entry, Data Approver, Tenant Admin, Super Admin                    |

## Validation Rules

### Indicator

| Field               | Rule                     |
| ------------------- | ------------------------ |
| `name`              | 1-200 chars, required    |
| `emissionCategory`  | must be valid enum value |
| `calculationMethod` | must be valid enum value |
| `defaultFuelType`   | max 100 chars, nullable  |
| `defaultGasType`    | max 100 chars, nullable  |

### Campaign

| Field                      | Rule                              |
| -------------------------- | --------------------------------- |
| `name`                     | 1-200 chars, required             |
| `approvalTiers`            | integer 1-3                       |
| `reportingYear`            | integer 2000-2100                 |
| `periodStart`              | YYYY-MM-DD format                 |
| `periodEnd`                | YYYY-MM-DD, must be > periodStart |
| `orgUnitIds`               | min 1, no duplicates              |
| `approverOverrides[].tier` | must be <= approvalTiers          |

### Task Reject

| Field   | Rule                   |
| ------- | ---------------------- |
| `notes` | 1-2000 chars, required |

## Business Logic & Edge Cases

### Task Lifecycle State Machine

```
pending --[start]--> draft --[submit]--> in_review
                                           |
                              [approve non-final] --> in_review (tier++)
                              [approve final]     --> locked
                              [reject]            --> revision_requested --[submit]--> in_review
```

### Approver Resolution Algorithm

1. If an approver override exists for the org unit + tier, use that user directly
2. Otherwise, start at the org unit (tier 1) or walk up `tier - 1` levels in the org hierarchy
3. Find all `data_approver` users at that level
4. Exclude the entry creator and all previous tier approvers (separation of duties)
5. If none found, walk up to parent org unit and repeat
6. If root reached with no eligible approver, throw `NoApproverFoundError` (422)

### Key Rules

- **Only draft campaigns can be edited/deleted** — active and closed campaigns are immutable
- **Workflow template must be `active` at activation time** — not validated at campaign creation
- **One task per org unit** per campaign — created automatically on activation
- **Separation of duties** — entry creator cannot approve; same user cannot approve at multiple tiers
- **Evidence required for submission** — at least 1 evidence file must be attached
- **Rejection resets tier to 0** — resubmission starts review from tier 1 again
- **Locked entries are immutable** — once a task reaches `locked`, the emission entry is also locked
- **Email notifications are fire-and-forget** — failures logged but never propagate to API response

### Known Gaps

1. `orgUnitName` in create response equals raw UUID (names not resolved on create path)
2. Evidence count always returns 0 in the adapter — submit will fail until this is fixed
3. GET /campaigns list returns flat Campaign without indicator/org-unit details
4. GET /tasks/{id} returns raw CampaignTask without emission entry or approval history
5. No referential integrity guard when deleting indicators referenced by campaigns

## Integration Notes

- **Campaign creation flow**: Create indicator (or select global) -> Create campaign with org units -> Activate
- **Task execution flow**: Start task -> Edit emission entry (emission domain) -> Upload evidence -> Submit -> Approve (per tier) -> Locked
- **Cross-domain dependency**: Starting a task creates an emission entry in the emission domain. Evidence is managed via emission domain endpoints. The campaign domain only reads emission data for validation.
- **Optimistic UI**: Safe for draft campaign edits. Not safe for task state transitions (conflict possible).
- **Polling for task status**: No real-time updates. Frontend should poll or refresh after actions.

## Test Scenarios

1. **Happy path — full lifecycle**: Create indicator -> Create campaign -> Activate -> Start task -> Submit -> Approve all tiers -> Verify locked
2. **Multi-tier approval**: Campaign with 3 tiers, different approvers at each level
3. **Rejection and resubmission**: Submit -> Reject with notes -> Edit entry -> Resubmit -> Approve
4. **Self-approval prevention**: Entry creator attempts to approve -> 403
5. **Duplicate tier approval**: Same user approves tier 1, then attempts tier 2 -> 403
6. **Activate with inactive template**: Campaign references a draft template -> 409
7. **Delete active campaign**: Attempt to delete non-draft campaign -> 409
8. **Submit without evidence**: Submit task with 0 evidence files -> 422
9. **Submit with incomplete entry**: Submit without activityAmount -> 422
10. **No approver found**: Org unit has no data_approver users at any level -> 422
