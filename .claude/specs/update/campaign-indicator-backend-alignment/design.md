---
title: "Design: Campaign & Indicator Backend Alignment"
type: design
status: approved
spec: "campaign-indicator-backend-alignment"
created: 2026-03-02
updated: 2026-03-02
author: "claude"
areas:
  - campaigns
  - indicators
  - tasks
  - settings
---

# Design: Campaign & Indicator Backend Alignment

## Overview

Implementation blueprint for aligning the frontend with the finalized Campaign domain backend API. Covers three areas: (1) adding `methodVariant` to indicators, (2) using enriched campaign responses with `taskSummary`, (3) simplifying task pages by using enriched backend responses that include pre-resolved names and nested data.

Spec: `.claude/specs/update/campaign-indicator-backend-alignment/spec.md`

## File Inventory

### Modified Files

| File Path | Change Description |
|-----------|--------------------|
| `src/lib/api/types.ts` | Add `MethodVariant`, `TaskSummary`, `MyTaskDto`, `TaskDetailDto`, `ApprovalHistoryEntry`, `CampaignTaskListResponse`; update `TenantRole` (add `data_reviewer`), `IndicatorResponseDto`, `CampaignWithDetails`, `CampaignTask` |
| `src/lib/api/indicators.ts` | Add `methodVariant` to `createIndicator()` request body |
| `src/lib/api/campaigns.ts` | Update `getCampaign()` return type, type `updateCampaign()`, update `listCampaignTasks()` return type |
| `src/lib/api/tasks.ts` | Update `getMyTasks()` and `getTask()` return types |
| `src/lib/schemas/indicator.ts` | Add `methodVariant` with conditional validation via `superRefine` |
| `src/lib/schemas/campaign.ts` | Add optional `approverOverrides` array field |
| `src/routes/(app)/settings/indicators/+page.server.ts` | Pass `methodVariant` in `?/create` action |
| `src/routes/(app)/settings/indicators/+page.svelte` | Add method variant column to table |
| `src/routes/(app)/settings/indicators/_components/IndicatorDialog.svelte` | Add method variant select (conditional on category) |
| `src/routes/(app)/campaigns/[id]/+page.server.ts` | Remove `listIndicators`/`getOrgUnitsTree` calls; use enriched response |
| `src/routes/(app)/campaigns/[id]/+page.svelte` | Use `campaign.indicator`, `campaign.taskSummary`; remove client-side counting |
| `src/routes/(app)/campaigns/_components/CampaignForm.svelte` | Add approver overrides section |
| `src/routes/(app)/campaigns/_components/TaskOverviewTable.svelte` | Use `task.orgUnitName` directly; drop `orgUnitNames` prop |
| `src/routes/(app)/campaigns/new/+page.server.ts` | Pass `approverOverrides` in create action |
| `src/routes/(app)/campaigns/[id]/edit/+page.server.ts` | Pre-fill `approverOverrides` from campaign; pass in update action |
| `src/routes/(app)/tasks/+page.server.ts` | Remove 3 extra API calls; use enriched `getMyTasks()` |
| `src/routes/(app)/tasks/+page.svelte` | Remove lookup maps; use `MyTaskDto` fields directly |
| `src/routes/(app)/tasks/_components/TaskCard.svelte` | Accept `MyTaskDto` instead of separate name props |
| `src/routes/(app)/tasks/[taskId]/+page.server.ts` | Remove 3 extra API calls; use enriched `getTask()` |
| `src/routes/(app)/tasks/[taskId]/+page.svelte` | Use nested `emissionEntry`/`approvalHistory`; add history timeline |

### New Files

| File Path | Purpose |
|-----------|---------|
| `src/routes/(app)/campaigns/_components/ApproverOverrides.svelte` | Per-org-unit approver override form section |
| `src/routes/(app)/tasks/[taskId]/_components/ApprovalHistory.svelte` | Timeline display of approval/rejection history |

---

## 1. Types (`src/lib/api/types.ts`)

### New Types

```typescript
// ── Method Variant ──

/** Indicator method variant */
export type MethodVariant = 'fuel' | 'distance' | 'production' | 'gas_abatement';

export const METHOD_VARIANT_VALUES = ['fuel', 'distance', 'production', 'gas_abatement'] as const;

export const METHOD_VARIANT_LABELS: Record<MethodVariant, string> = {
  fuel: 'Fuel-based',
  distance: 'Distance-based',
  production: 'Production-based',
  gas_abatement: 'Gas Abatement'
};

/** Which categories require which variants */
export const CATEGORY_VARIANT_MAP: Record<EmissionCategory, MethodVariant[] | null> = {
  stationary: null,
  mobile: ['fuel', 'distance'],
  fugitive: null,
  process: ['production', 'gas_abatement']
};

// ── Campaign ──

/** Task summary counts from campaign detail response */
export interface TaskSummary {
  total: number;
  pending: number;
  draft: number;
  submitted: number;
  inReview: number;
  revisionRequested: number;
  approved: number;
  locked: number;
}

/** Paginated campaign task list response */
export interface CampaignTaskListResponse {
  tasks: CampaignTask[];
  total: number;
}

// ── Tasks ──

/** My Tasks enriched DTO — returned by GET /v1/tasks/my */
export interface MyTaskDto {
  id: string;
  campaignName: string;
  indicatorName: string;
  orgUnitName: string;
  status: CampaignTaskStatus;
  periodStart: string;
  periodEnd: string;
}

/** My Tasks list response */
export interface MyTasksResponse {
  tasks: MyTaskDto[];
}

/** Approval history entry — nested in task detail */
export interface ApprovalHistoryEntry {
  tier: number;
  action: 'approve' | 'reject';
  actorId: string;
  actorName: string;
  notes: string | null;
  createdAt: string;
}

/** Emission trace summary in task detail */
export interface TaskEmissionTrace {
  totalCo2eKg: number;
  totalCo2eTonnes: number;
}

/** Nested emission entry in task detail */
export interface TaskEmissionEntry {
  id: string;
  status: string;
  activityAmount: number | null;
  activityUnit: string | null;
  startDate: string;
  endDate: string;
  evidenceFiles: Array<{
    id: string;
    originalFilename: string;
    status: string;
  }>;
  currentTrace: TaskEmissionTrace | null;
}

/** Task detail DTO — returned by GET /v1/tasks/{taskId} */
export interface TaskDetailDto {
  id: string;
  campaignId: string;
  campaignName: string;
  indicatorName: string;
  emissionCategory: EmissionCategory;
  orgUnitId: string;
  orgUnitName: string;
  status: CampaignTaskStatus;
  currentTier: number;
  approvalTiers: number;
  periodStart: string;
  periodEnd: string;
  emissionEntryId: string | null;
  emissionEntry: TaskEmissionEntry | null;
  approvalHistory: ApprovalHistoryEntry[];
}
```

### Modified Types

**`TenantRole`** — add `data_reviewer` role (exists in backend `UserRole` enum):

```typescript
export type TenantRole = 'viewer' | 'data_entry' | 'data_approver' | 'data_reviewer' | 'tenant_admin' | 'super_admin';

export const TENANT_ROLE_LABELS: Record<TenantRole, string> = {
  viewer: 'Viewer',
  data_entry: 'Data Entry',
  data_approver: 'Data Approver',
  data_reviewer: 'Data Reviewer',
  tenant_admin: 'Admin',
  super_admin: 'Super Admin'
};
```

**`IndicatorResponseDto`** — add `methodVariant`:

```typescript
export interface IndicatorResponseDto {
  id: string;
  tenantId: string | null;
  name: string;
  emissionCategory: EmissionCategory;
  methodVariant: MethodVariant | null;  // ← NEW
  isGlobal: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**`CampaignWithDetails`** — align with backend response shape, add `indicator` and `taskSummary`:

```typescript
export interface CampaignWithDetails {
  id: string;
  tenantId: string;
  name: string;
  indicatorId: string;
  indicator: { name: string; emissionCategory: string } | null;  // ← NEW
  workflowType: WorkflowType;
  approvalTiers: number;
  reportingYear: number;
  periodStart: string;
  periodEnd: string;
  status: CampaignStatus;
  orgUnits: CampaignOrgUnit[];  // ← CHANGED from raw shape to CampaignOrgUnit[]
  approverOverrides: CampaignApproverOverride[];  // ← CHANGED from raw shape
  taskSummary?: TaskSummary;  // ← NEW (present on detail, absent on create response)
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
```

**`CampaignTask`** — add `orgUnitName`:

```typescript
export interface CampaignTask {
  id: string;
  campaignId: string;
  orgUnitId: string;
  orgUnitName: string;  // ← NEW
  tenantId: string;
  status: CampaignTaskStatus;
  currentTier: number;
  emissionEntryId: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  lockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

**`CampaignActivationResponse`** — update to match:

```typescript
export interface CampaignActivationResponse {
  campaign: CampaignWithDetails;  // Uses updated CampaignWithDetails
  taskCount: number;
}
```

---

## 2. API Functions

### `src/lib/api/indicators.ts` — `createIndicator()`

Add `methodVariant` to request body:

```typescript
export async function createIndicator(
  accessToken: string,
  data: {
    name: string;
    emissionCategory: string;
    methodVariant?: string | null;  // ← NEW
  }
): Promise<IndicatorResponseDto> {
  return apiFetchAuth<IndicatorResponseDto>(
    "/campaign/indicators",
    accessToken,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}
```

### `src/lib/api/campaigns.ts`

**`getCampaign()`** — return updated `CampaignWithDetails`:

```typescript
// No code change needed — the return type CampaignWithDetails is already used.
// The type itself is being updated (see above).
```

**`updateCampaign()`** — replace `Record<string, unknown>` with typed interface:

```typescript
export async function updateCampaign(
  accessToken: string,
  id: string,
  data: {
    name?: string;
    indicatorId?: string;
    workflowType?: WorkflowType;
    reportingYear?: number;
    periodStart?: string;
    periodEnd?: string;
    orgUnitIds?: string[];
    approverOverrides?: Array<{
      orgUnitId: string;
      tier: number;
      userId: string;
    }>;
  }
): Promise<CampaignWithDetails> {
  return apiFetchAuth<CampaignWithDetails>(
    `/campaign/campaigns/${id}`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}
```

**`listCampaignTasks()`** — return wrapped response:

```typescript
export async function listCampaignTasks(
  accessToken: string,
  campaignId: string,
  params?: { status?: string; orgUnitId?: string }
): Promise<CampaignTaskListResponse> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.orgUnitId) qs.set("orgUnitId", params.orgUnitId);
  const query = qs.toString();
  return apiFetchAuth<CampaignTaskListResponse>(
    `/campaign/campaigns/${campaignId}/tasks${query ? `?${query}` : ""}`,
    accessToken
  );
}
```

### `src/lib/api/tasks.ts`

**`getMyTasks()`** — return enriched response:

```typescript
export async function getMyTasks(accessToken: string): Promise<MyTasksResponse> {
  return apiFetchAuth<MyTasksResponse>('/tasks/my', accessToken);
}
```

**`getTask()`** — return enriched detail:

```typescript
export async function getTask(accessToken: string, taskId: string): Promise<TaskDetailDto> {
  return apiFetchAuth<TaskDetailDto>(`/tasks/${taskId}`, accessToken);
}
```

---

## 3. Zod Schemas

### `src/lib/schemas/indicator.ts`

Add `methodVariant` with conditional validation:

```typescript
import { z } from 'zod';

/** Schema for creating an indicator — POST /v1/indicators */
export const createIndicatorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  emissionCategory: z.enum(['stationary', 'mobile', 'fugitive', 'process'], {
    message: 'Category is required'
  }),
  methodVariant: z.enum(['fuel', 'distance', 'production', 'gas_abatement']).nullable().default(null)
}).superRefine((data, ctx) => {
  const cat = data.emissionCategory;
  const variant = data.methodVariant;

  if (cat === 'mobile' && !variant) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Method variant is required for Mobile Combustion',
      path: ['methodVariant']
    });
  } else if (cat === 'mobile' && variant && !['fuel', 'distance'].includes(variant)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Mobile Combustion requires Fuel-based or Distance-based',
      path: ['methodVariant']
    });
  }

  if (cat === 'process' && !variant) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Method variant is required for Process Emissions',
      path: ['methodVariant']
    });
  } else if (cat === 'process' && variant && !['production', 'gas_abatement'].includes(variant)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Process Emissions requires Production-based or Gas Abatement',
      path: ['methodVariant']
    });
  }

  if ((cat === 'stationary' || cat === 'fugitive') && variant) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'This category does not support method variants',
      path: ['methodVariant']
    });
  }
});

/** Schema for updating an indicator — PATCH /v1/indicators/{id} */
export const updateIndicatorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).optional(),
  isActive: z.boolean().optional()
});
```

### `src/lib/schemas/campaign.ts`

Add optional `approverOverrides` array:

```typescript
import { z } from 'zod';
import { WORKFLOW_TYPE_VALUES } from '$lib/api/types.js';

const approverOverrideSchema = z.object({
  orgUnitId: z.string().uuid(),
  tier: z.number().int().min(1).max(2),
  userId: z.string().uuid()
});

/** Base campaign fields (without refinements) */
const campaignBaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  indicatorId: z.string().uuid('Indicator is required'),
  workflowType: z.enum(WORKFLOW_TYPE_VALUES, { message: 'Workflow type is required' }),
  reportingYear: z.coerce.number().int().min(2000).max(2100),
  periodStart: z.string().min(1, 'Start date is required'),
  periodEnd: z.string().min(1, 'End date is required'),
  orgUnitIds: z.array(z.string().uuid()).min(1, 'At least one org unit is required'),
  approverOverrides: z.array(approverOverrideSchema).default([])  // ← NEW
});

/** Schema for creating a campaign — POST /v1/campaigns */
export const createCampaignSchema = campaignBaseSchema.superRefine((data, ctx) => {
  if (data.periodStart && data.periodEnd && data.periodStart >= data.periodEnd) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'End date must be after start date',
      path: ['periodEnd']
    });
  }
});

/** Schema for updating a campaign — PATCH /v1/campaigns/{id} */
export const updateCampaignSchema = campaignBaseSchema.partial();
```

---

## 4. Indicator Dialog Changes

### `IndicatorDialog.svelte`

Add a method variant select field that conditionally appears when category is `mobile` or `process`.

**Key changes:**
- Import `CATEGORY_VARIANT_MAP`, `METHOD_VARIANT_LABELS` from types
- Add `methodVariant` field to create form
- Derive `availableVariants` from selected category
- Show variant select only when `availableVariants` is non-null
- Reset `methodVariant` to `null` when category changes to one that doesn't need variants
- Add `$effect` to auto-clear methodVariant when category changes

```svelte
<script lang="ts">
  // ... existing imports ...
  import { CATEGORY_VARIANT_MAP, METHOD_VARIANT_LABELS } from '$lib/api/types.js';
  import type { MethodVariant } from '$lib/api/types.js';

  // ... existing code ...

  // Derived: available variants for selected category
  let availableVariants = $derived(
    CATEGORY_VARIANT_MAP[$createForm.emissionCategory] ?? null
  );

  // Auto-clear methodVariant when category changes to one that doesn't support it
  $effect(() => {
    const variants = CATEGORY_VARIANT_MAP[$createForm.emissionCategory];
    if (!variants) {
      $createForm.methodVariant = null;
    } else if ($createForm.methodVariant && !variants.includes($createForm.methodVariant as MethodVariant)) {
      $createForm.methodVariant = null;
    }
  });
</script>

<!-- Inside create form, after emission category field: -->
{#if availableVariants}
  <Form.Field form={createSF} name="methodVariant">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Method Variant</Form.Label>
        <Select.Root
          type="single"
          value={$createForm.methodVariant ?? undefined}
          onValueChange={(val) => {
            $createForm.methodVariant = (val as MethodVariant) ?? null;
          }}
        >
          <Select.Trigger class="w-full" {...props}>
            {#if $createForm.methodVariant}
              {METHOD_VARIANT_LABELS[$createForm.methodVariant as MethodVariant]}
            {:else}
              <span class="text-muted-foreground">Select method variant</span>
            {/if}
          </Select.Trigger>
          <Select.Content>
            {#each availableVariants as variant}
              <Select.Item value={variant}>
                {METHOD_VARIANT_LABELS[variant]}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>
{/if}
```

In the edit form, show method variant as read-only (immutable after creation):

```svelte
<!-- In edit form, after category display: -->
{#if indicator?.methodVariant}
  <div class="flex flex-col gap-2">
    <Form.Label>Method Variant</Form.Label>
    <Input
      value={METHOD_VARIANT_LABELS[indicator.methodVariant as MethodVariant] ?? indicator.methodVariant}
      disabled
    />
  </div>
{/if}
```

### `+page.server.ts` (Indicators)

Update `?/create` action to pass `methodVariant`:

```typescript
// In the create action:
await createIndicator(session.idToken, {
  name: form.data.name,
  emissionCategory: form.data.emissionCategory,
  methodVariant: form.data.methodVariant ?? null  // ← NEW
});
```

### `+page.svelte` (Indicators)

Add method variant column to the indicator table:

```svelte
<!-- Add column header after Category -->
<Table.Head>Method</Table.Head>

<!-- Add column cell after Category cell -->
<Table.Cell>
  {#if indicator.methodVariant}
    {METHOD_VARIANT_LABELS[indicator.methodVariant as MethodVariant] ?? indicator.methodVariant}
  {:else}
    <span class="text-muted-foreground">—</span>
  {/if}
</Table.Cell>
```

Import `METHOD_VARIANT_LABELS` and `MethodVariant` type at the top.

---

## 5. Campaign Detail Page Simplification

### `campaigns/[id]/+page.server.ts`

Remove `listIndicators()` and `getOrgUnitsTree()` calls. The enriched `CampaignWithDetails` now includes `indicator` and `orgUnits[].orgUnitName`.

```typescript
import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { getCampaign, activateCampaign, deleteCampaign, listCampaignTasks } from '$lib/api/campaigns.js';
import { ApiError } from '$lib/api/client.js';
import { requireAdmin } from '$lib/server/auth.js';

export const load: PageServerLoad = async ({ locals, params }) => {
  requireAdmin(locals);
  const session = locals.session!;

  let campaign;
  try {
    campaign = await getCampaign(session.idToken, params.id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      error(404, 'Campaign not found.');
    }
    throw err;
  }

  // Fetch tasks only for non-draft campaigns
  const tasks = campaign.status !== 'draft'
    ? await listCampaignTasks(session.idToken, params.id)
    : { tasks: [], total: 0 };

  return {
    campaign,
    tasks: tasks.tasks,
    taskTotal: tasks.total
  };
};

// Actions remain unchanged
```

### `campaigns/[id]/+page.svelte`

**Key changes:**
- Remove `data.indicator` / `data.orgUnitNames` usage
- Use `campaign.indicator` for indicator display
- Use `campaign.taskSummary` for progress stats instead of client-side counting
- Pass tasks directly to `TaskOverviewTable` without `orgUnitNames`

Replace the task status counting logic:

```svelte
<!-- BEFORE: client-side counting -->
<!-- let taskStatusCounts = $derived.by(() => { ... counting loop ... }); -->

<!-- AFTER: use taskSummary from backend -->
let taskSummary = $derived(campaign.taskSummary);
let totalTasks = $derived(taskSummary?.total ?? data.tasks.length);
```

Replace indicator card:

```svelte
<!-- BEFORE -->
<!-- {#if data.indicator} ... data.indicator.name ... -->

<!-- AFTER -->
{#if campaign.indicator}
  <p class="text-sm font-medium">{campaign.indicator.name}</p>
  <Badge variant="outline" class="w-fit text-xs">
    {EMISSION_CATEGORY_LABELS[campaign.indicator.emissionCategory as EmissionCategory] ?? campaign.indicator.emissionCategory}
  </Badge>
{:else}
  <p class="text-sm text-muted-foreground">Unknown</p>
{/if}
```

Replace progress stats section:

```svelte
<!-- AFTER: use taskSummary -->
{#if taskSummary && taskSummary.total > 0}
  <div class="flex flex-wrap items-center gap-3">
    {#each [
      { status: 'locked', count: taskSummary.locked },
      { status: 'approved', count: taskSummary.approved },
      { status: 'inReview', count: taskSummary.inReview, label: 'In Review' },
      { status: 'submitted', count: taskSummary.submitted },
      { status: 'draft', count: taskSummary.draft },
      { status: 'pending', count: taskSummary.pending },
      { status: 'revisionRequested', count: taskSummary.revisionRequested, label: 'Revision Requested' }
    ] as item}
      {#if item.count > 0}
        <div class="flex items-center gap-1.5 text-sm">
          <span class="font-medium">{item.count}</span>
          <span class="text-muted-foreground">{item.label ?? CAMPAIGN_TASK_STATUS_LABELS[item.status as CampaignTaskStatus] ?? item.status}</span>
        </div>
      {/if}
    {/each}
  </div>
{/if}
```

Update TaskOverviewTable call:

```svelte
<!-- BEFORE -->
<!-- <TaskOverviewTable tasks={data.tasks} orgUnitNames={data.orgUnitNames} /> -->

<!-- AFTER -->
<TaskOverviewTable tasks={data.tasks} />
```

### `TaskOverviewTable.svelte`

Remove `orgUnitNames` prop, use `task.orgUnitName` directly:

```svelte
<script lang="ts">
  // ... existing imports ...
  import type { CampaignTask } from '$lib/api/types.js';

  interface Props {
    tasks: CampaignTask[];
  }

  let { tasks }: Props = $props();

  // ... formatDate stays the same ...
</script>

<!-- In table body, replace org unit cell: -->
<Table.Cell class="font-medium">
  {task.orgUnitName}
</Table.Cell>
```

---

## 6. Campaign Form — Approver Overrides

### New Component: `ApproverOverrides.svelte`

Located at `src/routes/(app)/campaigns/_components/ApproverOverrides.svelte`.

```svelte
<script lang="ts">
  import * as Select from '$lib/components/ui/select/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import Plus from '@lucide/svelte/icons/plus';
  import type { UserResponseDto, WorkflowType } from '$lib/api/types.js';

  interface ApproverOverride {
    orgUnitId: string;
    tier: number;
    userId: string;
  }

  let {
    overrides = $bindable([]),
    orgUnitIds,
    orgUnitNames,
    workflowType,
    users,
    disabled = false
  }: {
    overrides: ApproverOverride[];
    orgUnitIds: string[];
    orgUnitNames: Record<string, string>;
    workflowType: WorkflowType;
    users: UserResponseDto[];
    disabled?: boolean;
  } = $props();

  let maxTier = $derived(workflowType === 'two_step' ? 2 : 1);

  // Users eligible for approval roles
  let approverUsers = $derived(
    users.filter((u) => u.role === 'data_approver' || u.role === 'data_reviewer' || u.role === 'tenant_admin')
  );

  function addOverride() {
    if (orgUnitIds.length === 0) return;
    overrides = [...overrides, { orgUnitId: orgUnitIds[0], tier: 1, userId: '' }];
  }

  function removeOverride(index: number) {
    overrides = overrides.filter((_, i) => i !== index);
  }
</script>

{#if overrides.length > 0}
  <div class="flex flex-col gap-3">
    {#each overrides as override, index}
      <div class="flex items-end gap-3 rounded-lg border border-border p-3">
        <div class="flex-1">
          <Label class="text-xs text-muted-foreground">Org Unit</Label>
          <Select.Root
            type="single"
            value={override.orgUnitId}
            onValueChange={(val) => {
              if (val) overrides[index].orgUnitId = val;
            }}
            {disabled}
          >
            <Select.Trigger class="w-full mt-1">
              {orgUnitNames[override.orgUnitId] ?? 'Select org unit'}
            </Select.Trigger>
            <Select.Content>
              {#each orgUnitIds as ouId}
                <Select.Item value={ouId}>{orgUnitNames[ouId] ?? ouId}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

        <div class="w-28">
          <Label class="text-xs text-muted-foreground">Tier</Label>
          <Select.Root
            type="single"
            value={String(override.tier)}
            onValueChange={(val) => {
              if (val) overrides[index].tier = Number(val);
            }}
            {disabled}
          >
            <Select.Trigger class="w-full mt-1">
              Tier {override.tier}
            </Select.Trigger>
            <Select.Content>
              {#each Array.from({ length: maxTier }, (_, i) => i + 1) as tier}
                <Select.Item value={String(tier)}>Tier {tier}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

        <div class="flex-1">
          <Label class="text-xs text-muted-foreground">Approver</Label>
          <Select.Root
            type="single"
            value={override.userId}
            onValueChange={(val) => {
              if (val) overrides[index].userId = val;
            }}
            {disabled}
          >
            <Select.Trigger class="w-full mt-1">
              {#if override.userId}
                {@const user = approverUsers.find((u) => u.id === override.userId)}
                {user?.displayName ?? user?.email ?? 'Select user'}
              {:else}
                <span class="text-muted-foreground">Select approver</span>
              {/if}
            </Select.Trigger>
            <Select.Content>
              {#each approverUsers as user}
                <Select.Item value={user.id}>
                  {user.displayName ?? user.email}
                  <Badge variant="outline" class="ml-2 text-xs">{user.role}</Badge>
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

        <Button
          variant="ghost"
          size="icon"
          class="size-8 text-destructive hover:text-destructive"
          onclick={() => removeOverride(index)}
          {disabled}
        >
          <Trash2 class="size-3.5" />
        </Button>
      </div>
    {/each}
  </div>
{/if}

<Button
  variant="outline"
  size="sm"
  onclick={addOverride}
  disabled={disabled || orgUnitIds.length === 0}
  class="w-fit"
>
  <Plus class="size-3.5 mr-1.5" />
  Add Approver Override
</Button>
```

### `CampaignForm.svelte` — Add Overrides Section

Add after the Organizational Units section, before the Footer:

```svelte
<script>
  // Add imports
  import ApproverOverrides from './ApproverOverrides.svelte';
  import { flattenOrgTree } from '$lib/utils.js';
  // ... existing imports ...

  let orgUnitNames = $derived(flattenOrgTree(orgTree));
</script>
```

> **Note:** Extract `flattenOrgTree` into `src/lib/utils.ts` as a shared utility:
> ```typescript
> // Add to src/lib/utils.ts
> import type { OrgUnitTreeResponseDto } from '$lib/api/types.js';
>
> /** Recursively flatten org tree into an id → name lookup map */
> export function flattenOrgTree(
>   nodes: OrgUnitTreeResponseDto[],
>   map: Record<string, string> = {}
> ): Record<string, string> {
>   for (const node of nodes) {
>     map[node.id] = node.name;
>     if (node.children?.length) flattenOrgTree(node.children, map);
>   }
>   return map;
> }
> ```
> All existing usages of inline `flattenOrgTree` / `flattenTree` (in `campaigns/[id]/+page.server.ts`, `tasks/[taskId]/+page.server.ts`) should be replaced with this shared import.

```svelte

<!-- New section after org units, before footer -->
<Field.Separator />

<Field.Set>
  <Field.Legend>Approver Overrides</Field.Legend>
  <Field.Description>
    Optionally assign specific approvers per org unit and tier.
    If not set, the default org hierarchy resolution is used.
  </Field.Description>
  <Field.Group>
    <ApproverOverrides
      bind:overrides={$form.approverOverrides}
      orgUnitIds={$form.orgUnitIds}
      {orgUnitNames}
      workflowType={$form.workflowType}
      {users}
      disabled={fieldsDisabled}
    />
  </Field.Group>
</Field.Set>
```

### `campaigns/new/+page.server.ts`

Update create action to pass `approverOverrides`:

```typescript
// In default action:
const created = await createCampaign(session.idToken, {
  name: form.data.name,
  indicatorId: form.data.indicatorId,
  workflowType: form.data.workflowType,
  reportingYear: form.data.reportingYear,
  periodStart: form.data.periodStart,
  periodEnd: form.data.periodEnd,
  orgUnitIds: form.data.orgUnitIds,
  approverOverrides: form.data.approverOverrides  // ← NEW
});
```

### `campaigns/[id]/edit/+page.server.ts`

Pre-fill approver overrides from campaign:

```typescript
// In load function, form initialization:
const form = await superValidate(
  {
    name: campaign.name,
    indicatorId: campaign.indicatorId,
    workflowType: campaign.workflowType,
    reportingYear: campaign.reportingYear,
    periodStart: campaign.periodStart,
    periodEnd: campaign.periodEnd,
    orgUnitIds: campaign.orgUnits.map((ou) => ou.orgUnitId),
    approverOverrides: campaign.approverOverrides.map((ao) => ({
      orgUnitId: ao.orgUnitId,
      tier: ao.tier,
      userId: ao.userId
    }))  // ← NEW
  },
  zod4(createCampaignSchema)
);
```

Update action to pass overrides:

```typescript
// In default action:
await updateCampaign(session.idToken, params.id, {
  name: form.data.name,
  indicatorId: form.data.indicatorId,
  workflowType: form.data.workflowType,
  reportingYear: form.data.reportingYear,
  periodStart: form.data.periodStart,
  periodEnd: form.data.periodEnd,
  orgUnitIds: form.data.orgUnitIds,
  approverOverrides: form.data.approverOverrides  // ← NEW
});
```

---

## 7. Task List Page Simplification

### `tasks/+page.server.ts`

Remove 3 extra API calls. Use only `getMyTasks()`:

```typescript
import type { PageServerLoad } from './$types.js';
import { getMyTasks } from '$lib/api/tasks.js';

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session!;

  try {
    const response = await getMyTasks(session.idToken);
    return { tasks: response.tasks };
  } catch (err) {
    console.error('Failed to load tasks:', err);
    return { tasks: [] };
  }
};
```

### `tasks/+page.svelte`

Remove all lookup maps. Use `MyTaskDto` fields directly:

```svelte
<script lang="ts">
  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import TaskCard from './_components/TaskCard.svelte';
  import ListChecks from '@lucide/svelte/icons/list-checks';
  import type { MyTaskDto, CampaignTaskStatus } from '$lib/api/types.js';
  import { CAMPAIGN_TASK_STATUS_LABELS } from '$lib/api/types.js';

  let { data } = $props();

  // Status filter
  let activeTab = $state('all');

  const STATUS_PRIORITY: Record<string, number> = {
    revision_requested: 0,
    pending: 1,
    draft: 2,
    in_review: 3,
    submitted: 4,
    approved: 5,
    locked: 6
  };

  const FILTER_TABS: { value: string; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'draft', label: 'Draft' },
    { value: 'in_review', label: 'In Review' },
    { value: 'revision_requested', label: 'Revision Requested' },
    { value: 'locked', label: 'Locked' }
  ];

  let filteredTasks = $derived.by(() => {
    let tasks = data.tasks as MyTaskDto[];
    if (activeTab !== 'all') {
      tasks = tasks.filter((t) => t.status === activeTab);
    }
    return tasks.toSorted((a, b) => {
      const pa = STATUS_PRIORITY[a.status] ?? 99;
      const pb = STATUS_PRIORITY[b.status] ?? 99;
      return pa - pb;
    });
  });

  function getTaskCount(status: string): number {
    if (status === 'all') return data.tasks.length;
    return (data.tasks as MyTaskDto[]).filter((t) => t.status === status).length;
  }
</script>

<!-- Template: replace TaskCard call -->
{#each filteredTasks as task (task.id)}
  <TaskCard {task} />
{/each}
```

### `TaskCard.svelte`

Accept `MyTaskDto` directly instead of separate props:

```svelte
<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import Calendar from '@lucide/svelte/icons/calendar';
  import Play from '@lucide/svelte/icons/play';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Eye from '@lucide/svelte/icons/eye';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import type { MyTaskDto } from '$lib/api/types.js';
  import { CAMPAIGN_TASK_STATUS_LABELS, CAMPAIGN_TASK_STATUS_BADGE_CLASSES } from '$lib/api/types.js';

  interface Props {
    task: MyTaskDto;
  }

  let { task }: Props = $props();

  // ... badgeVariant, actionConfig, formatDate stay the same but use task.* fields ...

  let badgeVariant = $derived(
    task.status === 'pending'
      ? ('secondary' as const)
      : task.status === 'revision_requested'
        ? ('destructive' as const)
        : ('default' as const)
  );

  let badgeClass = $derived(CAMPAIGN_TASK_STATUS_BADGE_CLASSES[task.status]);

  interface ActionConfig {
    label: string;
    icon: typeof Play;
    variant: 'default' | 'outline' | 'secondary';
  }

  let actionConfig = $derived.by((): ActionConfig => {
    switch (task.status) {
      case 'pending':
        return { label: 'Start', icon: Play, variant: 'default' };
      case 'draft':
        return { label: 'Continue', icon: Pencil, variant: 'default' };
      case 'revision_requested':
        return { label: 'Revise', icon: RotateCcw, variant: 'default' };
      default:
        return { label: 'View', icon: Eye, variant: 'outline' };
    }
  });

  function formatDate(dateString: string) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }
</script>

<Card.Root class="transition-shadow hover:shadow-md">
  <Card.Header class="pb-3">
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <Card.Title class="truncate text-base font-semibold">
          {task.orgUnitName}
        </Card.Title>
        <p class="mt-0.5 truncate text-sm text-muted-foreground">
          {task.campaignName}
        </p>
      </div>
      <Badge variant={badgeVariant} class={badgeClass}>
        {CAMPAIGN_TASK_STATUS_LABELS[task.status]}
      </Badge>
    </div>
  </Card.Header>

  <Card.Content class="pt-0">
    <div class="flex flex-col gap-2">
      {#if task.indicatorName}
        <div class="flex items-center gap-2 text-sm">
          <span class="text-muted-foreground">Indicator:</span>
          <span class="truncate font-medium">{task.indicatorName}</span>
        </div>
      {/if}
      {#if task.periodStart && task.periodEnd}
        <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar class="size-3.5" />
          <span>{formatDate(task.periodStart)} - {formatDate(task.periodEnd)}</span>
        </div>
      {/if}
    </div>
  </Card.Content>

  <Card.Footer class="border-t border-border pt-4">
    <Button variant={actionConfig.variant} size="sm" href="/tasks/{task.id}">
      <actionConfig.icon class="mr-1.5 size-3.5" />
      {actionConfig.label}
    </Button>
  </Card.Footer>
</Card.Root>
```

---

## 8. Task Detail Page Simplification

### `tasks/[taskId]/+page.server.ts`

The enriched `TaskDetailDto` includes campaign name, indicator name, org unit name, emission entry, and approval history. Remove separate API calls for campaign, indicators, org tree.

Evidence files are still loaded via the emission domain if the entry exists, since the task detail's nested `emissionEntry.evidenceFiles` may not include full file details needed for download/upload operations. The existing evidence actions (requestUploadUrl, confirmUpload, downloadEvidence, deleteEvidence) remain unchanged.

```typescript
import { error, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { getTask, startTask, submitTask, approveTask, rejectTask } from '$lib/api/tasks.js';
import { getEmissionEntry, updateEmissionEntry } from '$lib/api/emission-entries.js';
import { listEmissionSources } from '$lib/api/emission-sources.js';
import { emissionEntrySchema } from '$lib/schemas/emission-entry.js';
import { taskRejectSchema } from '$lib/schemas/task-reject.js';
import { ApiError } from '$lib/api/client.js';
import {
  listEvidenceByEntry as apiListEvidence,
  requestUploadUrl as apiRequestUploadUrl,
  confirmUpload as apiConfirmUpload,
  getDownloadUrl as apiGetDownloadUrl,
  deleteEvidence as apiDeleteEvidence
} from '$lib/api/evidence.js';
import type { EvidenceFileResponseDto } from '$lib/api/types.js';

export const load: PageServerLoad = async ({ params, locals }) => {
  const session = locals.session!;

  try {
    // Single enriched API call — replaces getTask + getCampaign + listIndicators + getOrgUnitsTree
    const task = await getTask(session.idToken, params.taskId);

    // Load full emission entry if exists (for form pre-fill and detailed fields)
    let emissionEntry = null;
    const entryId = task.emissionEntry?.id;
    if (entryId) {
      try {
        emissionEntry = await getEmissionEntry(session.idToken, entryId);
      } catch {
        // Entry may not be accessible
      }
    }

    // Load evidence files for download/upload operations
    let evidenceFiles: EvidenceFileResponseDto[] = [];
    if (entryId) {
      try {
        evidenceFiles = await apiListEvidence(session.idToken, entryId);
      } catch {
        // Graceful fallback
      }
    }

    // Load emission sources for this org unit
    let emissionSources: Awaited<ReturnType<typeof listEmissionSources>> = [];
    try {
      emissionSources = await listEmissionSources(session.idToken, {
        orgUnitId: task.orgUnitId
      });
    } catch {
      // Not critical
    }

    // Initialize entry form
    const entryForm = await superValidate(
      emissionEntry
        ? {
            sourceId: emissionEntry.sourceId,
            fuelType: emissionEntry.fuelType,
            activityAmount: emissionEntry.activityAmount,
            activityUnit: emissionEntry.activityUnit,
            distance: emissionEntry.distance,
            distanceUnit: emissionEntry.distanceUnit as 'km' | 'miles' | null,
            vehicleType: emissionEntry.vehicleType,
            technology: emissionEntry.technology,
            gasType: emissionEntry.gasType,
            refrigerantInventoryStart: emissionEntry.refrigerantInventoryStart,
            refrigerantInventoryEnd: emissionEntry.refrigerantInventoryEnd,
            refrigerantPurchased: emissionEntry.refrigerantPurchased,
            refrigerantRecovered: emissionEntry.refrigerantRecovered,
            productionVolume: emissionEntry.productionVolume,
            productionUnit: emissionEntry.productionUnit,
            abatementEfficiency: emissionEntry.abatementEfficiency,
            notes: emissionEntry.notes
          }
        : {},
      zod4(emissionEntrySchema)
    );

    return {
      task,
      emissionEntry,
      evidenceFiles,
      emissionSources,
      entryForm
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      error(404, 'Task not found');
    }
    throw err;
  }
};

// Actions remain the same — start, saveDraft, submit, approve, reject, evidence actions
// ... (no changes to actions)
```

### `tasks/[taskId]/+page.svelte`

Update to use enriched `TaskDetailDto` fields. The `data.task` now contains `campaignName`, `indicatorName`, `orgUnitName`, and `approvalHistory`.

Key changes:
- Replace `data.campaign.name` → `data.task.campaignName`
- Replace `data.indicator?.name` → `data.task.indicatorName`
- Replace `data.indicator?.emissionCategory` → `data.task.emissionCategory`
- Replace `data.orgUnitName` → `data.task.orgUnitName`
- Replace `data.campaign.periodStart/periodEnd` → `data.task.periodStart/periodEnd`
- Replace `data.campaign.approvalTiers` → `data.task.approvalTiers`
- Replace `data.task.emissionEntryId` checks → `data.task.emissionEntry?.id`
- Add `ApprovalHistory` component display
- Show `currentTrace` from task's nested `emissionEntry`

```svelte
<!-- In head -->
<title>{data.task.orgUnitName} - {data.task.campaignName} | Akriva</title>

<!-- In header -->
<h1 class="text-2xl font-semibold">{data.task.orgUnitName}</h1>
<p class="text-sm text-muted-foreground">{data.task.campaignName}</p>

<!-- Indicator display -->
{#if data.task.indicatorName}
  <div>
    <span class="font-medium text-foreground">Indicator:</span>
    {data.task.indicatorName}
  </div>
{/if}

<!-- Period dates -->
<div class="flex items-center gap-1.5">
  <Calendar class="size-3.5" />
  <span>{formatDate(data.task.periodStart)} - {formatDate(data.task.periodEnd)}</span>
</div>

<!-- ApprovalSection uses task fields directly -->
<ApprovalSection
  taskId={data.task.id}
  currentTier={data.task.currentTier}
  totalTiers={data.task.approvalTiers}
/>

<!-- Add approval history after approval section (for in_review, approved, locked statuses) -->
{#if data.task.approvalHistory.length > 0}
  <ApprovalHistory entries={data.task.approvalHistory} />
{/if}
```

### New Component: `ApprovalHistory.svelte`

Located at `src/routes/(app)/tasks/[taskId]/_components/ApprovalHistory.svelte`.

```svelte
<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import Check from '@lucide/svelte/icons/check';
  import X from '@lucide/svelte/icons/x';
  import type { ApprovalHistoryEntry } from '$lib/api/types.js';

  interface Props {
    entries: ApprovalHistoryEntry[];
  }

  let { entries }: Props = $props();

  function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title class="text-lg font-semibold">Approval History</Card.Title>
  </Card.Header>
  <Card.Content>
    <div class="relative flex flex-col gap-0">
      {#each entries as entry, index}
        <div class="flex gap-3 pb-6 last:pb-0">
          <!-- Timeline line -->
          <div class="relative flex flex-col items-center">
            <div
              class="flex size-8 items-center justify-center rounded-full {entry.action === 'approve'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'}"
            >
              {#if entry.action === 'approve'}
                <Check class="size-4" />
              {:else}
                <X class="size-4" />
              {/if}
            </div>
            {#if index < entries.length - 1}
              <div class="absolute top-8 h-full w-px bg-border"></div>
            {/if}
          </div>

          <!-- Content -->
          <div class="flex flex-col gap-1 pt-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium">{entry.actorName}</span>
              <Badge
                variant={entry.action === 'approve' ? 'default' : 'destructive'}
                class="text-xs"
              >
                {entry.action === 'approve' ? 'Approved' : 'Rejected'} at Tier {entry.tier}
              </Badge>
            </div>
            {#if entry.notes}
              <p class="text-sm text-muted-foreground">{entry.notes}</p>
            {/if}
            <p class="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
          </div>
        </div>
      {/each}
    </div>
  </Card.Content>
</Card.Root>
```

---

## Error Handling

No new error handling infrastructure needed. The backend's standard error response shape `{ error: "Human-readable message", code: "ERROR_CODE" }` provides user-friendly messages in the `error` field. The existing pattern of catching `ApiError` and using `err.body.error` as the form message already surfaces the correct user-facing text for all error codes documented in the handover (e.g., `SELF_APPROVAL` returns `error: "You cannot approve your own submission"`).

The existing `catch` blocks correctly handle this — no separate frontend error code-to-message mapping is needed since the backend guarantees human-readable messages in `err.body.error`.

## Migration Notes

**Breaking API function return types** — The following API functions change their return types. During implementation, search for all callers of each function and update them:

| Function | Before | After | Callers to Update |
|----------|--------|-------|-------------------|
| `getMyTasks()` | `Promise<CampaignTask[]>` | `Promise<MyTasksResponse>` | `tasks/+page.server.ts` |
| `getTask()` | `Promise<CampaignTask>` | `Promise<TaskDetailDto>` | `tasks/[taskId]/+page.server.ts` |
| `listCampaignTasks()` | `Promise<CampaignTask[]>` | `Promise<CampaignTaskListResponse>` | `campaigns/[id]/+page.server.ts` |

Run `grep -r "getMyTasks\|getTask\|listCampaignTasks" src/` during implementation to verify all call sites are updated.

---

## Authorization

No authorization changes. All existing guards remain:

| Route | Required Role(s) | Guard |
|-------|-------------------|-------|
| `/(app)/settings/indicators` | `tenant_admin` | `requireAdmin(locals)` |
| `/(app)/campaigns/new` | `tenant_admin` | `requireAdmin(locals)` |
| `/(app)/campaigns/[id]` | `tenant_admin` | `requireAdmin(locals)` |
| `/(app)/campaigns/[id]/edit` | `tenant_admin` | `requireAdmin(locals)` |
| `/(app)/tasks` | Any authenticated | `locals.session!` |
| `/(app)/tasks/[taskId]` | Any authenticated | `locals.session!` |

---

## Implementation Order

1. **Types** — Add new types and update existing types in `src/lib/api/types.ts`
2. **Schemas** — Update `indicator.ts` (add methodVariant), `campaign.ts` (add approverOverrides)
3. **API functions** — Update `indicators.ts`, `campaigns.ts`, `tasks.ts`
4. **Indicator dialog** — Add method variant field to `IndicatorDialog.svelte`
5. **Indicator page** — Update server action + table column in settings/indicators
6. **Campaign form** — Create `ApproverOverrides.svelte`, integrate into `CampaignForm.svelte`
7. **Campaign create/edit** — Update server files to pass approverOverrides
8. **Campaign detail** — Simplify load function, use `taskSummary`, update `TaskOverviewTable`
9. **Task list** — Simplify load function, update `TaskCard` props
10. **Task detail** — Simplify load function, add `ApprovalHistory` component
11. **Type check** — Run `npm run check` for strict mode compliance

---

## Open Questions

- [ ] Does the backend `GET /tasks/my` response wrap in `{ tasks: [...] }` or return a flat array? Design assumes `{ tasks: MyTaskDto[] }` per handover doc. Verify actual response shape.
- [ ] Does the campaign detail `GET /campaigns/{id}` always include `taskSummary`, or only when status is `active`? Design uses optional chaining (`campaign.taskSummary?.total`) as safeguard.
- [ ] For the task detail, does `emissionEntry` include enough data for the entry form, or do we still need the separate `getEmissionEntry()` call? Design keeps the separate call for form pre-fill since the nested DTO has fewer fields.

## References

- Spec: `.claude/specs/update/campaign-indicator-backend-alignment/spec.md`
- Backend handover: `/Users/m89346/Projects/zcet/akriva-backend/.claude/docs/ai/campaign/frontend-handover.md`

## Notes

### 2026-03-02
- Initial design document grounded in actual codebase
- API path prefixes remain as-is per project convention
- Evidence-related actions and endpoints unchanged
- No Figma design — all UI follows existing app patterns
