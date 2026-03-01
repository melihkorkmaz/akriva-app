---
title: "Campaign & Indicator Backend Alignment"
type: update
status: approved
priority: medium
created: 2026-03-01
updated: 2026-03-01
author: "claude"
areas:
  - campaigns
  - indicators
  - tasks
  - settings
backend-spec: "/Users/m89346/Projects/zcet/akriva-backend/.claude/docs/ai/campaign/frontend-handover.md"
---

# Campaign & Indicator Backend Alignment

## Summary

Align the frontend campaign, indicator, and task implementations with the finalized backend Campaign domain API. The backend handover document defines enriched response shapes (nested indicator names, task summaries, approval history), a new `methodVariant` field on indicators, and richer task detail responses that eliminate the need for multiple client-side API calls. This update brings the frontend types, schemas, API functions, and UI components into alignment with these backend contracts.

## Current Behavior

### Indicators (`/settings/indicators`)

- `IndicatorResponseDto` has: `id`, `tenantId`, `name`, `emissionCategory`, `isGlobal`, `isActive`, timestamps
- Create schema accepts only `name` and `emissionCategory`
- `IndicatorDialog` shows name input + category select
- No concept of `methodVariant` exists anywhere in the frontend

### Campaigns (`/campaigns/*`)

- Two separate response types exist: `CampaignResponseDto` (with nested `indicator`, `orgUnits[]`, `approverOverrides[]`) and `CampaignWithDetails` (with raw DB-shaped `orgUnits[]` containing `{ id, campaignId, orgUnitId }` and `approverOverrides[]` containing `{ id, campaignId, orgUnitId, tier, userId }`)
- `getCampaign()` returns `CampaignWithDetails` (raw shape) — campaign detail page must separately fetch indicators and org tree to resolve names
- No `taskSummary` in campaign detail response — progress is computed client-side by counting tasks
- `listCampaignTasks()` returns `CampaignTask[]` flat array — backend now wraps in `{ tasks, total }`
- Campaign form has no approver overrides UI section
- `updateCampaign()` accepts `Record<string, unknown>` — not type-safe

### Tasks (`/tasks/*`)

- `getMyTasks()` returns `CampaignTask[]` — the task list page must separately fetch campaigns, indicators, and org tree to resolve display names
- `getTask()` returns basic `CampaignTask` — task detail page must separately fetch campaign, indicator, emission entry, and evidence via 4+ additional API calls
- `CampaignTask` type has no `orgUnitName`, `campaignName`, `indicatorName`, `emissionEntry`, or `approvalHistory`
- No approval history timeline in task detail UI
- No `currentTrace` display (calculated emissions) in task detail

### Affected Routes

| Route | Current Behavior |
|-------|-----------------|
| `/(app)/settings/indicators` | CRUD without method variant |
| `/(app)/campaigns` | List with client-side indicator name lookup |
| `/(app)/campaigns/new` | Create form without approver overrides |
| `/(app)/campaigns/[id]` | Detail with client-side name resolution + manual task counting |
| `/(app)/campaigns/[id]/edit` | Edit form without approver overrides |
| `/(app)/tasks` | List with 3 extra API calls for name resolution |
| `/(app)/tasks/[taskId]` | Detail with 4+ extra API calls for enriched data |

### Current Data Flow

**Campaign detail page:**
```
load() → getCampaign(id) → CampaignWithDetails (raw orgUnit IDs)
       → listCampaignTasks(id) → CampaignTask[] (no org names)
       → listIndicators() → resolve indicator name client-side
       → getOrgUnitsTree() → build flat map for org unit name lookups
```

**Task list page:**
```
load() → getMyTasks() → CampaignTask[] (no names, no campaign/indicator info)
       → listCampaigns() → resolve campaign names client-side
       → listIndicators() → resolve indicator names client-side
       → getOrgUnitsTree() → resolve org unit names client-side
```

**Task detail page:**
```
load() → getTask(id) → CampaignTask (basic fields only)
       → getCampaign(task.campaignId) → get indicator ID, campaign details
       → listIndicators() → resolve indicator name
       → getOrgUnitsTree() → resolve org unit name
       → getEmissionEntry(task.emissionEntryId) → conditionally load emission data
       → listEvidence() → conditionally load evidence files
```

## Desired Behavior

### Indicators

- `IndicatorResponseDto` includes `methodVariant: MethodVariant | null`
- Create schema validates `methodVariant` conditionally:
  - `mobile` category requires `fuel` or `distance`
  - `process` category requires `production` or `gas_abatement`
  - `stationary` / `fugitive` require `null`
- `IndicatorDialog` shows a method variant select that appears/hides based on selected category
- Indicator list table shows method variant when present

### Campaigns

- Single unified `CampaignDetailDto` response type with:
  - `indicator: { name, emissionCategory }` nested
  - `orgUnits: { orgUnitId, orgUnitName }[]` with resolved names
  - `approverOverrides: { orgUnitId, tier, userId }[]` clean shape
  - `taskSummary: { total, pending, draft, submitted, inReview, revisionRequested, approved, locked }` for progress display
- Campaign detail page uses `taskSummary` for progress bars/counts instead of counting tasks
- Campaign detail page reads indicator name from nested `indicator` field
- Campaign form includes optional approver overrides section
- `listCampaignTasks()` handles `{ tasks, total }` wrapper response
- `updateCampaign()` is properly typed

### Tasks

- New `MyTaskDto` type with enriched fields: `campaignName`, `indicatorName`, `orgUnitName`, `periodStart`, `periodEnd`
- New `TaskDetailDto` type with `emissionEntry` (including `currentTrace`), `approvalHistory[]`
- Task list page uses enriched My Tasks response directly — no extra API calls for name resolution
- Task detail page uses enriched task detail — no extra API calls for campaign/indicator/entry data
- Task detail page shows approval history timeline
- Task detail page shows calculated emissions from `currentTrace`
- `getMyTasks()` returns `{ tasks: MyTaskDto[] }`
- `getTask()` returns `TaskDetailDto`

### Updated Routes

| Route | Updated Behavior | Breaking? |
|-------|-----------------|-----------|
| `/(app)/settings/indicators` | Add method variant to create/edit dialog | No |
| `/(app)/campaigns` | List unchanged (still flat) | No |
| `/(app)/campaigns/new` | Add approver overrides section to form | No |
| `/(app)/campaigns/[id]` | Use enriched response with taskSummary + nested indicator | No |
| `/(app)/campaigns/[id]/edit` | Add approver overrides section to form | No |
| `/(app)/tasks` | Simplified load — use enriched My Tasks response | No |
| `/(app)/tasks/[taskId]` | Simplified load — use enriched task detail + approval history UI | No |

### Updated Data Flow

**Campaign detail page (simplified):**
```
load() → getCampaign(id) → CampaignDetailDto (indicator name, orgUnit names, taskSummary all included)
       → listCampaignTasks(id) → { tasks, total } (tasks have orgUnitName)
```

**Task list page (simplified):**
```
load() → getMyTasks() → { tasks: MyTaskDto[] } (all names pre-resolved)
```

**Task detail page (simplified):**
```
load() → getTask(id) → TaskDetailDto (campaign/indicator/orgUnit names + emissionEntry + approvalHistory)
       → evidence still loaded separately if needed
```

## Changes Required

### Types (`src/lib/api/types.ts`)

**New types:**

| Type | Purpose |
|------|---------|
| `MethodVariant` | Union: `'fuel' \| 'distance' \| 'production' \| 'gas_abatement'` |
| `METHOD_VARIANT_LABELS` | Display label map for method variants |
| `METHOD_VARIANT_VALUES` | Array of valid method variant values |
| `TaskSummary` | `{ total, pending, draft, submitted, inReview, revisionRequested, approved, locked }` |
| `MyTaskDto` | Enriched task for My Tasks list (campaign/indicator/org names + period) |
| `TaskDetailDto` | Full task detail with `emissionEntry`, `approvalHistory[]` |
| `ApprovalHistoryEntry` | `{ tier, action, actorId, actorName, notes, createdAt }` |
| `TaskEmissionEntry` | Nested emission entry in task detail with `currentTrace` |
| `EmissionTrace` | `{ totalCo2eKg, totalCo2eTonnes }` |
| `CampaignTaskListResponse` | `{ tasks: CampaignTask[], total: number }` |

**Modified types:**

| Type | Change |
|------|--------|
| `IndicatorResponseDto` | Add `methodVariant: MethodVariant \| null` |
| `CampaignWithDetails` | Align `orgUnits` and `approverOverrides` shapes with backend; add `indicator` and `taskSummary`; or consolidate with `CampaignResponseDto` |
| `CampaignTask` | Add `orgUnitName: string` |

### Schemas (`src/lib/schemas/`)

**Modified:**

| Schema | Change |
|--------|--------|
| `createIndicatorSchema` | Add `methodVariant` enum field with `.superRefine()` for category-dependent validation |
| `createCampaignSchema` | Add optional `approverOverrides` array field |
| `updateCampaignSchema` | Inherit approverOverrides from base |

### API Functions

**Modified (`src/lib/api/indicators.ts`):**

| Function | Change |
|----------|--------|
| `createIndicator()` | Add `methodVariant` to request body type |

**Modified (`src/lib/api/campaigns.ts`):**

| Function | Change |
|----------|--------|
| `getCampaign()` | Update return type to consolidated campaign detail type |
| `updateCampaign()` | Replace `Record<string, unknown>` with proper typed interface |
| `listCampaignTasks()` | Update return type to `CampaignTaskListResponse` |

**Modified (`src/lib/api/tasks.ts`):**

| Function | Change |
|----------|--------|
| `getMyTasks()` | Update return type to `{ tasks: MyTaskDto[] }` |
| `getTask()` | Update return type to `TaskDetailDto` |

### Routes / Pages

**`/(app)/settings/indicators` — Indicator Settings:**
- Update `IndicatorDialog` to add method variant select
- Conditional display: show variant select only when category is `mobile` or `process`
- Update `?/create` action to include `methodVariant` in API call
- Optionally show method variant in indicator list table

**`/(app)/campaigns/[id]` — Campaign Detail:**
- Remove redundant `listIndicators()` and `getOrgUnitsTree()` calls from load function
- Use `campaign.indicator.name` instead of client-side indicator lookup
- Use `campaign.orgUnits[].orgUnitName` instead of client-side org tree lookup
- Add progress summary section using `campaign.taskSummary`
- Update `TaskOverviewTable` to use `task.orgUnitName` directly

**`/(app)/campaigns/new` and `/(app)/campaigns/[id]/edit` — Campaign Form:**
- Add optional approver overrides section to `CampaignForm`
- Per selected org unit, allow setting approver user per tier
- Dynamic tier count based on `workflowType` (1 for simple, 2 for two_step)

**`/(app)/tasks` — Task List:**
- Simplify load function to only call `getMyTasks()`
- Remove separate `listCampaigns()`, `listIndicators()`, `getOrgUnitsTree()` calls
- Update `TaskCard` to read names directly from `MyTaskDto`

**`/(app)/tasks/[taskId]` — Task Detail:**
- Simplify load function to primarily call `getTask(taskId)` for enriched response
- Remove separate `getCampaign()`, `listIndicators()`, `getOrgUnitsTree()` calls
- Add approval history timeline component
- Show `currentTrace` (calculated emissions) when available
- Update `ActivityDataSection`, `EvidenceSection` to work with nested `emissionEntry`

### Components

| Component | Change |
|-----------|--------|
| `IndicatorDialog` | Add method variant select with conditional visibility |
| `CampaignForm` | Add approver overrides section |
| `TaskOverviewTable` | Use `orgUnitName` from task directly instead of lookup map |
| `TaskCard` | Accept enriched `MyTaskDto` props instead of separate name props |
| New: `ApprovalHistory` | Timeline component for task approval history entries |
| New: `ApproverOverrides` | Form section for setting per-org-unit approver overrides |

### Error Handling

Add backend error code mapping for user-friendly messages:

| Error Code | User Message |
|------------|-------------|
| `CAMPAIGN_NOT_FOUND` | Campaign not found |
| `CAMPAIGN_NOT_DRAFT` | Only draft campaigns can be modified |
| `CAMPAIGN_DUPLICATE_NAME` | A campaign with this name already exists |
| `INDICATOR_NOT_FOUND` | Indicator not found |
| `INDICATOR_DUPLICATE_NAME` | An indicator with this name already exists |
| `INVALID_TASK_TRANSITION` | This action is not available for the current task status |
| `MISSING_REQUIRED_FIELDS` | Please fill in all required fields before submitting |
| `INSUFFICIENT_EVIDENCE` | At least one evidence file must be attached before submitting |
| `SELF_APPROVAL` | You cannot approve your own submission |
| `NO_APPROVER_FOUND` | No eligible approver found in the organizational hierarchy |
| `EMISSION_ENTRY_LOCKED` | This emission entry has been locked and cannot be modified |

## Backward Compatibility

### Breaking Changes

None. All changes are additive or replace internal implementation details. No URL changes, no removed form fields.

### Non-Breaking Changes

- Types gain new fields (additive)
- Load functions become simpler (fewer API calls)
- Indicator dialog gains a new optional field
- Campaign form gains a new optional section
- Task detail gains new UI sections (approval history, emission trace)

## Testing Strategy

- Verify indicator create/edit with method variant for all 4 emission categories
- Verify conditional method variant validation (mobile/process require variant; stationary/fugitive forbid it)
- Verify campaign detail page renders taskSummary progress correctly
- Verify campaign form with approver overrides for both simple and two_step workflows
- Verify task list loads without extra API calls (only `getMyTasks`)
- Verify task detail loads without extra API calls (only `getTask`)
- Verify approval history timeline renders correctly with multiple entries
- Verify emission trace display when `currentTrace` is present/null
- Regression: all existing campaign/task workflows still function
- Error handling: verify user-friendly messages for each backend error code

## Acceptance Criteria

- [ ] `IndicatorResponseDto` includes `methodVariant` field
- [ ] Indicator create dialog shows method variant select conditionally based on category
- [ ] Indicator create validates method variant rules (mobile/process require it, stationary/fugitive forbid it)
- [ ] Campaign detail response type includes `indicator`, `taskSummary`, and resolved `orgUnitName`s
- [ ] Campaign detail page uses `taskSummary` for progress display
- [ ] Campaign form has optional approver overrides section
- [ ] Task list page load function requires only `getMyTasks()` call
- [ ] Task detail page load function requires only `getTask()` call (plus evidence if needed)
- [ ] Task detail page shows approval history timeline
- [ ] Task detail page shows calculated emissions from `currentTrace` when available
- [ ] All backend error codes are mapped to user-friendly messages
- [ ] `npm run check` passes with no type errors
- [ ] No business logic added to the frontend — all validation/decisions remain in the backend

## Rollback Plan

All changes are internal to the frontend with no backend dependency changes. Rollback is a simple git revert of the implementation commits. The backend API is backward-compatible (new fields are additive), so the old frontend code would continue to work with the updated backend.

## Backend Dependencies

- [x] Backend spec: Campaign domain handover — status: approved
- [x] API endpoint: `POST /v1/indicators` with `methodVariant` — available: yes
- [x] API endpoint: `GET /v1/campaigns/{id}` with `taskSummary` — available: yes
- [x] API endpoint: `GET /v1/tasks/my` with enriched response — available: yes
- [x] API endpoint: `GET /v1/tasks/{taskId}` with `emissionEntry` + `approvalHistory` — available: yes

## References

- Backend handover: `/Users/m89346/Projects/zcet/akriva-backend/.claude/docs/ai/campaign/frontend-handover.md`

## Notes

### 2026-03-01
- Initial draft based on backend campaign domain handover document
- All backend APIs are available — no blocking dependencies
- API path prefixes remain as-is (`/campaign/indicators`, `/campaign/campaigns`, `/tasks/`) per project convention
- No Figma designs — UI updates follow existing app patterns
