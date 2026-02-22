# Campaign & Data Collection UI Design

## Summary

Full UI implementation for GHG data collection campaigns: workflow template management, indicator management, campaign CRUD with activation, task execution (data entry, evidence upload, multi-tier approval), and emission source management within org units.

## Decisions

- **Campaign-only data entry** — no standalone emission entry; all data goes through campaign tasks
- **Navigation**: Settings-centric approach — config under Settings, campaigns under Admin, My Tasks under Data
- **Workflow builder**: Simplified mode (pick 1-3 tiers) with advanced toggle for full step/transition editor
- **Emission sources**: Managed within org unit detail (Organizational Tree page), not a separate settings page
- **Task view**: Card-based list with status filter tabs, sorted by urgency
- **All at once**: Single comprehensive plan covering all features end-to-end

## Navigation & Routes

### Sidebar Changes

**Data group** (all users):
- Dashboard → `/dashboard`
- Scope 1 → `/scope-1/emission-entries` (existing)
- **My Tasks** → `/tasks` (NEW)

**Admin group** (tenant_admin+):
- **Campaigns** → `/campaigns` (NEW)
- Settings → `/settings`
- Team Members → `/settings/team-members`

**Settings sidebar** (within `/settings` layout):
- Company (existing)
- Application Settings (existing)
- Organizational Tree (existing — now also shows emission sources per org unit)
- **Workflow Templates** → `/settings/workflow-templates` (NEW)
- **Indicators** → `/settings/indicators` (NEW)
- Team Members (existing)

### Route Structure

```
/tasks                              — My Tasks (card list + filters)
/tasks/[taskId]                     — Task detail (data entry + evidence + actions)
/campaigns                          — Campaign list
/campaigns/new                      — Create campaign
/campaigns/[id]                     — Campaign detail (task overview)
/campaigns/[id]/edit                — Edit draft campaign
/settings/workflow-templates        — Workflow template list
/settings/workflow-templates/new    — Create workflow template
/settings/workflow-templates/[id]   — View/edit workflow template
/settings/indicators                — Indicator list (with create/edit dialogs)
```

## Page Designs

### Settings: Workflow Templates

**List page** (`/settings/workflow-templates`):
- Card-based list, each card: name, description, status badge (draft/active/archived), tier count, version, created date
- Actions: Edit (draft only), Activate, Archive, Delete (draft only)
- "New Template" button in page header

**Create/Edit page** (`/settings/workflow-templates/new`, `/settings/workflow-templates/[id]`):

Simplified mode (default):
- Name (text input)
- Description (textarea, optional)
- Number of Approval Tiers: radio group (1 / 2 / 3)
- Visual preview: `Data Entry → Tier 1 Review → [Tier 2 Review →] Approved & Locked`
- Auto-generates steps/transitions on save

Advanced mode (toggle):
- Step editor: table of steps with name, type (submit/review/approve), assigned role, gate type, step order
- Add/remove steps
- Transition editor: from step → to step → trigger (complete/reject/timeout)

Status transitions via header buttons:
- Draft → "Activate" (confirmation dialog, warns about one-active-per-tenant)
- Active → "Archive"
- Draft → "Delete"

### Settings: Indicators

**List page** (`/settings/indicators`):
- Data table: Name, Emission Category, Calculation Method, Fuel Type, Gas Type, Active status, Actions
- "New Indicator" button → opens create dialog

**Create/Edit dialog:**
- Name (text input)
- Emission Category (select: Stationary, Mobile, Fugitive, Process)
- Calculation Method (select, filtered by category — see compatibility matrix)
- Default Fuel Type (optional)
- Default Gas Type (optional)
- Edit: category and calculation method are read-only

### Settings: Emission Sources (within Org Tree)

When an org unit is selected in the Organizational Tree page:
- New tab/section: "Emission Sources"
- Data table: Name, Category, Meter Number, Fuel Type, Active, Actions
- "Add Source" button → dialog: Name, Category, Meter Number, Vehicle Type, Technology, Default Fuel/Gas Type
- Edit/deactivate/delete per row
- Category and org unit are read-only after creation

### Campaign Management

**List page** (`/campaigns`):
- Filter bar: Status (All/Draft/Active/Closed), Reporting Year
- Card list or data table: Name, Indicator name + category badge, Period, Status, Org unit count, Task progress (active only)
- Actions: View, Edit (draft), Activate (draft), Delete (draft)

**Create/Edit page** (`/campaigns/new`, `/campaigns/[id]/edit`):

Section 1 — Campaign Details:
- Name, Indicator (select), Reporting Year, Period Start, Period End

Section 2 — Workflow & Approval:
- Workflow Template (select from active templates), Approval Tiers (1-3)

Section 3 — Organizational Units:
- Tree view with checkboxes, selected units shown as chips, min 1 required

Section 4 — Approver Overrides (optional, collapsible):
- Per org-unit, per-tier override table: Org Unit | Tier | User (select)
- "Add Override" button

Actions: Save Draft, Cancel, Activate (on edit page)

**Detail page** (`/campaigns/[id]`):
- Header: name + status badge + action buttons
- Summary cards: Indicator, Period, Workflow, Tiers, Created By
- Task table (active campaigns): Org Unit, Status, Current Tier, Submitted At, Approved At, Actions
- Progress stats: X locked, Y in review, Z pending

### Task Execution

**My Tasks page** (`/tasks`):
- Status filter tabs: All | Pending | Draft | In Review | Revision Requested | Locked
- Task cards (not table): Campaign name, Org Unit, Indicator, Status badge, Period, Dates
- Action per card: "Start" (pending), "Continue" (draft), "View" (in_review/locked), "Revise" (revision_requested)
- Sort: revision_requested first, then pending, draft, in_review, locked

**Task Detail page** (`/tasks/[taskId]`):

Header: Campaign name, Org Unit, Indicator, Status, Period

Content varies by status:

*Pending:* "Start Task" button → creates draft emission entry

*Draft / Revision Requested:*
- Rejection notes alert banner (if revision_requested)
- Section 1 — Activity Data (fields depend on category):
  - Stationary: Fuel Type, Amount, Unit
  - Mobile (fuel): Fuel Type, Amount
  - Mobile (distance): Distance, Unit, Vehicle Type
  - Fugitive: Gas Type, Refrigerant fields
  - Process: Production Volume/Unit or Amount + Abatement Efficiency
  - Plus: Emission Source (optional), Notes
- Section 2 — Evidence: Upload area + file list + download/delete
- Section 3 — Calculation Preview: CO2e result, breakdown, formula (read-only)
- Actions: Save Draft, Submit for Review, Cancel

*In Review (approver view):*
- Same sections but read-only
- Approval section: current tier indicator, Approve button, Request Revision button (opens notes dialog)
- Approval history table

*Locked:*
- Everything read-only, "Locked" banner, full history, download evidence

## API Integration

### New Modules

| Module | File | Endpoints |
|--------|------|-----------|
| Campaigns | `src/lib/api/campaigns.ts` | CRUD, activate, list tasks |
| Indicators | `src/lib/api/indicators.ts` | CRUD |
| Workflow Templates | `src/lib/api/workflow-templates.ts` | CRUD, activate, archive |
| Emission Sources | `src/lib/api/emission-sources.ts` | CRUD |
| Emission Entries | `src/lib/api/emission-entries.ts` | CRUD, dry-run |
| Evidence | `src/lib/api/evidence.ts` | Upload URL, confirm, download URL, delete |
| Tasks | `src/lib/api/tasks.ts` | My tasks, detail, start/submit/approve/reject |
| Emission Factors | `src/lib/api/emission-factors.ts` | Libraries, factors, fuel properties, GWP |

### New Types (`src/lib/api/types.ts`)

All DTOs from handoff docs:
- `EmissionSourceResponseDto`, `EmissionEntryResponseDto`, `CalculationTraceResponseDto`
- `EvidenceFileResponseDto`, `ResolvedEmissionFactorResponseDto`
- `WorkflowTemplateResponseDto`, `WorkflowStepResponseDto`, `WorkflowTransitionResponseDto`
- `CampaignResponseDto`, `CampaignTask`, `IndicatorResponseDto`
- Enums: `EmissionCategory`, `CalculationMethod`, `CampaignStatus`, `CampaignTaskStatus`, `WorkflowTemplateStatus`, `EvidenceStatus`, `ApprovalAction`

### New Schemas (`src/lib/schemas/`)

- `workflow-template.ts` — name, description, tiers, steps, transitions
- `indicator.ts` — name, category, method, defaults
- `emission-source.ts` — org unit, category, name, optional fields
- `campaign.ts` — name, indicator, workflow, tiers, period, org units, overrides (cross-field: periodEnd > periodStart)
- `emission-entry.ts` — dynamic fields per category
- `evidence.ts` — filename, content type
- `task-reject.ts` — notes (1-2000 chars)

### Evidence Upload Pattern

Client-side S3 upload (bypasses SvelteKit server for file bytes):
1. Server action → API `POST /evidence/upload-url` → presigned URL + evidenceId
2. Client-side `fetch(presignedUrl, { method: 'PUT', body: file })` (direct to S3)
3. Server action → API `POST /evidence/{id}/confirm`
4. Evidence IDs linked to entry on save/submit

Requires a client-side upload component since files go to S3 directly.

## Category-Method Compatibility

| Category | Valid Methods |
|----------|-------------|
| Stationary | `ipcc_energy_based`, `defra_direct` |
| Mobile | `ipcc_mobile_fuel`, `ipcc_mobile_distance` |
| Fugitive | `material_balance` |
| Process | `process_production`, `process_gas_abatement` |

## Fields Required Per Category

| Category + Method | Required Fields |
|-------------------|----------------|
| Stationary | fuelType, activityAmount, activityUnit |
| Mobile (fuel) | fuelType, activityAmount |
| Mobile (distance) | distance, distanceUnit, vehicleType |
| Fugitive | gasType, refrigerantInventoryStart/End, Purchased, Recovered |
| Process (production) | productionVolume, productionUnit |
| Process (abatement) | activityAmount, abatementEfficiency |

## Task State Machine

```
pending ──[start]──► draft ──[submit]──► in_review
                                            │
                         [approve non-final] ├──► in_review (tier++)
                         [approve final]     ├──► locked
                         [reject]            └──► revision_requested ──[submit]──► in_review
```

## Key Business Rules (enforced by backend)

- Evidence required at submit time, not at draft save
- Person who enters data cannot approve (separation of duties)
- Same person cannot approve at multiple tiers
- Locked entries are immutable
- Only one workflow template can be active per tenant
- Only draft campaigns can be edited/deleted
- Workflow template must be active at campaign activation time
