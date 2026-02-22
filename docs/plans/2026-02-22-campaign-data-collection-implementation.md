# Campaign & Data Collection UI — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the full GHG data collection campaign UI — from workflow template setup through campaign activation to task-driven data entry and multi-tier approval.

**Architecture:** SvelteKit pages with server-side data loading (`+page.server.ts`), Superforms + Zod 4 for forms, `apiFetchAuth()` API client calls. All business logic enforced by backend — frontend is a thin presentational layer.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, shadcn-svelte, Tailwind CSS 4, Superforms, Zod 4, TanStack Table, Lucide icons, svelte-sonner

**Design Doc:** `docs/plans/2026-02-22-campaign-data-collection-ui-design.md`

**API Handoffs:** `docs/handoffs/emission-api-handoff.md`, `docs/handoffs/workflow-api-handoff.md`, `docs/handoffs/campaign-api-handoff.md`

---

## Task 1: Types & Enums

**Files:**
- Modify: `src/lib/api/types.ts`

**Step 1: Add emission domain types to types.ts**

Append after the existing types at the end of `src/lib/api/types.ts`:

```typescript
// ── Emission Domain ──

/** Emission source categories */
export type EmissionCategory = 'stationary' | 'mobile' | 'fugitive' | 'process';

export const EMISSION_CATEGORY_LABELS: Record<EmissionCategory, string> = {
  stationary: 'Stationary Combustion',
  mobile: 'Mobile Combustion',
  fugitive: 'Fugitive Emissions',
  process: 'Process Emissions'
};

/** Calculation methods */
export type CalculationMethod =
  | 'ipcc_energy_based'
  | 'defra_direct'
  | 'ipcc_mobile_fuel'
  | 'ipcc_mobile_distance'
  | 'material_balance'
  | 'process_production'
  | 'process_gas_abatement';

export const CALCULATION_METHOD_LABELS: Record<CalculationMethod, string> = {
  ipcc_energy_based: 'IPCC Energy Based',
  defra_direct: 'DEFRA Direct',
  ipcc_mobile_fuel: 'IPCC Mobile (Fuel)',
  ipcc_mobile_distance: 'IPCC Mobile (Distance)',
  material_balance: 'Material Balance',
  process_production: 'Process Production',
  process_gas_abatement: 'Process Gas Abatement'
};

/** Category-method compatibility */
export const CATEGORY_METHOD_MAP: Record<EmissionCategory, CalculationMethod[]> = {
  stationary: ['ipcc_energy_based', 'defra_direct'],
  mobile: ['ipcc_mobile_fuel', 'ipcc_mobile_distance'],
  fugitive: ['material_balance'],
  process: ['process_production', 'process_gas_abatement']
};

/** Evidence file status */
export type EvidenceStatus = 'pending_upload' | 'uploaded' | 'linked';

/** Emission source — GET/POST/PATCH /v1/emission/emission-sources */
export interface EmissionSourceResponseDto {
  id: string;
  tenantId: string;
  orgUnitId: string;
  category: EmissionCategory;
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

/** Calculation trace — nested in emission entry */
export interface CalculationTraceResponseDto {
  calculationMethod: string;
  authority: string;
  gwpBasis: string | null;
  gwpCh4: number | null;
  gwpN2o: number | null;
  factorLibraryId: string | null;
  factorLibraryVersion: string | null;
  factorResolutionTier: string | null;
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

/** Emission entry — GET/POST/PATCH /v1/emission/emission-entries */
export interface EmissionEntryResponseDto {
  id: string;
  tenantId: string;
  orgUnitId: string;
  sourceId: string | null;
  category: EmissionCategory;
  calculationMethod: CalculationMethod;
  reportingYear: number;
  startDate: string;
  endDate: string;
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

/** Paginated emission entry list */
export interface EmissionEntryListResponse {
  data: EmissionEntryResponseDto[];
  total: number;
  page: number;
  pageSize: number;
}

/** Evidence file — returned by evidence endpoints */
export interface EvidenceFileResponseDto {
  id: string;
  tenantId: string;
  entryId: string | null;
  s3Key: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number | null;
  status: EvidenceStatus;
  uploadedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Upload URL response */
export interface EvidenceUploadUrlResponse {
  evidenceId: string;
  uploadUrl: string;
  s3Key: string;
  expiresAt: string;
}

/** Emission factor library */
export interface EmissionFactorLibraryResponseDto {
  id: string;
  name: string;
  authority: string;
  version: string;
  releaseYear: number;
  isDefault: boolean;
  createdAt: string;
}

// ── Workflow Domain ──

/** Workflow template status */
export type WorkflowTemplateStatus = 'draft' | 'active' | 'archived';

export const WORKFLOW_STATUS_LABELS: Record<WorkflowTemplateStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  archived: 'Archived'
};

/** Workflow step type */
export type WorkflowStepType = 'submit' | 'review' | 'approve';

/** Workflow gate type */
export type WorkflowGateType = 'serial' | 'parallel_all' | 'parallel_any';

/** Workflow transition trigger */
export type WorkflowTransitionTrigger = 'complete' | 'reject' | 'timeout';

/** Workflow step response */
export interface WorkflowStepResponseDto {
  id: string;
  name: string;
  type: WorkflowStepType;
  assignedRole: TenantRole;
  gateType: WorkflowGateType;
  stepOrder: number;
}

/** Workflow transition response */
export interface WorkflowTransitionResponseDto {
  id: string;
  fromStepId: string;
  toStepId: string;
  trigger: WorkflowTransitionTrigger;
  rejectionTargetStepId: string | null;
}

/** Workflow template — GET/POST/PATCH /v1/workflow-templates */
export interface WorkflowTemplateResponseDto {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  version: number;
  status: WorkflowTemplateStatus;
  steps: WorkflowStepResponseDto[];
  transitions: WorkflowTransitionResponseDto[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Workflow template list response */
export interface WorkflowTemplateListResponse {
  data: WorkflowTemplateResponseDto[];
  total: number;
}

// ── Campaign Domain ──

/** Campaign status */
export type CampaignStatus = 'draft' | 'active' | 'closed';

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  closed: 'Closed'
};

/** Campaign task status */
export type CampaignTaskStatus =
  | 'pending'
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'revision_requested'
  | 'approved'
  | 'locked';

export const CAMPAIGN_TASK_STATUS_LABELS: Record<CampaignTaskStatus, string> = {
  pending: 'Pending',
  draft: 'Draft',
  submitted: 'Submitted',
  in_review: 'In Review',
  revision_requested: 'Revision Requested',
  approved: 'Approved',
  locked: 'Locked'
};

/** Indicator — GET/POST/PATCH /v1/indicators */
export interface IndicatorResponseDto {
  id: string;
  tenantId: string | null;
  name: string;
  emissionCategory: EmissionCategory;
  calculationMethod: CalculationMethod;
  defaultFuelType: string | null;
  defaultGasType: string | null;
  isGlobal: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Campaign org unit (nested in campaign response) */
export interface CampaignOrgUnit {
  orgUnitId: string;
  orgUnitName: string;
}

/** Campaign approver override (nested in campaign response) */
export interface CampaignApproverOverride {
  orgUnitId: string;
  tier: number;
  userId: string;
}

/** Campaign response — POST/GET /v1/campaigns */
export interface CampaignResponseDto {
  id: string;
  name: string;
  indicatorId: string;
  indicator: { name: string; emissionCategory: string } | null;
  workflowTemplateId: string;
  approvalTiers: number;
  reportingYear: number;
  periodStart: string;
  periodEnd: string;
  status: CampaignStatus;
  orgUnits: CampaignOrgUnit[];
  approverOverrides: CampaignApproverOverride[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Campaign detail (with raw org units + overrides) — GET /v1/campaigns/{id} */
export interface CampaignWithDetails {
  id: string;
  tenantId: string;
  name: string;
  indicatorId: string;
  workflowTemplateId: string;
  approvalTiers: number;
  reportingYear: number;
  periodStart: string;
  periodEnd: string;
  status: CampaignStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  orgUnits: { id: string; campaignId: string; orgUnitId: string }[];
  approverOverrides: {
    id: string;
    campaignId: string;
    orgUnitId: string;
    tier: number;
    userId: string;
  }[];
}

/** Campaign task — GET /v1/campaigns/{id}/tasks, /v1/tasks/* */
export interface CampaignTask {
  id: string;
  campaignId: string;
  orgUnitId: string;
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

/** Campaign activation response */
export interface CampaignActivationResponse {
  campaign: CampaignWithDetails;
  taskCount: number;
}
```

**Step 2: Commit**

```bash
git add src/lib/api/types.ts
git commit -m "feat: add emission, workflow, campaign, and task type definitions"
```

---

## Task 2: API Modules

**Files:**
- Create: `src/lib/api/workflow-templates.ts`
- Create: `src/lib/api/indicators.ts`
- Create: `src/lib/api/emission-sources.ts`
- Create: `src/lib/api/emission-entries.ts`
- Create: `src/lib/api/evidence.ts`
- Create: `src/lib/api/campaigns.ts`
- Create: `src/lib/api/tasks.ts`
- Create: `src/lib/api/emission-factors.ts`

**Step 1: Create all API modules**

Follow the exact pattern from `src/lib/api/tenant.ts` — typed functions using `apiFetchAuth`. Each module exports functions matching its API handoff doc endpoints.

**`src/lib/api/workflow-templates.ts`:**
```typescript
import { apiFetchAuth } from './client.js';
import type {
  WorkflowTemplateResponseDto,
  WorkflowTemplateListResponse,
  WorkflowTemplateStatus
} from './types.js';

export async function listWorkflowTemplates(
  accessToken: string
): Promise<WorkflowTemplateListResponse> {
  return apiFetchAuth<WorkflowTemplateListResponse>('/workflow-templates', accessToken);
}

export async function getWorkflowTemplate(
  accessToken: string,
  id: string
): Promise<WorkflowTemplateResponseDto> {
  return apiFetchAuth<WorkflowTemplateResponseDto>(`/workflow-templates/${id}`, accessToken);
}

export async function createWorkflowTemplate(
  accessToken: string,
  data: {
    name: string;
    description?: string | null;
    steps: Array<{
      name: string;
      type: 'submit' | 'review' | 'approve';
      assignedRole: string;
      gateType?: string;
      stepOrder: number;
    }>;
    transitions?: Array<{
      fromStepOrder: number;
      toStepOrder: number;
      trigger: string;
      rejectionTargetStepOrder?: number | null;
    }>;
  }
): Promise<WorkflowTemplateResponseDto> {
  return apiFetchAuth<WorkflowTemplateResponseDto>('/workflow-templates', accessToken, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateWorkflowTemplate(
  accessToken: string,
  id: string,
  data: {
    name?: string;
    description?: string | null;
    status?: WorkflowTemplateStatus;
    steps?: Array<{
      name: string;
      type: string;
      assignedRole: string;
      gateType?: string;
      stepOrder: number;
    }>;
    transitions?: Array<{
      fromStepOrder: number;
      toStepOrder: number;
      trigger: string;
      rejectionTargetStepOrder?: number | null;
    }>;
  }
): Promise<WorkflowTemplateResponseDto> {
  return apiFetchAuth<WorkflowTemplateResponseDto>(`/workflow-templates/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteWorkflowTemplate(
  accessToken: string,
  id: string
): Promise<WorkflowTemplateResponseDto> {
  return apiFetchAuth<WorkflowTemplateResponseDto>(`/workflow-templates/${id}`, accessToken, {
    method: 'DELETE'
  });
}
```

**`src/lib/api/indicators.ts`:**
```typescript
import { apiFetchAuth } from './client.js';
import type { IndicatorResponseDto } from './types.js';

export async function listIndicators(
  accessToken: string,
  params?: { isGlobal?: string; category?: string }
): Promise<IndicatorResponseDto[]> {
  const qs = new URLSearchParams();
  if (params?.isGlobal) qs.set('isGlobal', params.isGlobal);
  if (params?.category) qs.set('category', params.category);
  const query = qs.toString();
  return apiFetchAuth<IndicatorResponseDto[]>(`/indicators${query ? `?${query}` : ''}`, accessToken);
}

export async function createIndicator(
  accessToken: string,
  data: {
    name: string;
    emissionCategory: string;
    calculationMethod: string;
    defaultFuelType?: string | null;
    defaultGasType?: string | null;
  }
): Promise<IndicatorResponseDto> {
  return apiFetchAuth<IndicatorResponseDto>('/indicators', accessToken, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateIndicator(
  accessToken: string,
  id: string,
  data: {
    name?: string;
    defaultFuelType?: string | null;
    defaultGasType?: string | null;
    isActive?: boolean;
  }
): Promise<IndicatorResponseDto> {
  return apiFetchAuth<IndicatorResponseDto>(`/indicators/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteIndicator(
  accessToken: string,
  id: string
): Promise<void> {
  await apiFetchAuth<null>(`/indicators/${id}`, accessToken, { method: 'DELETE' });
}
```

**`src/lib/api/emission-sources.ts`:**
```typescript
import { apiFetchAuth } from './client.js';
import type { EmissionSourceResponseDto } from './types.js';

export async function listEmissionSources(
  accessToken: string,
  params?: { orgUnitId?: string; category?: string; isActive?: string }
): Promise<EmissionSourceResponseDto[]> {
  const qs = new URLSearchParams();
  if (params?.orgUnitId) qs.set('orgUnitId', params.orgUnitId);
  if (params?.category) qs.set('category', params.category);
  if (params?.isActive) qs.set('isActive', params.isActive);
  const query = qs.toString();
  return apiFetchAuth<EmissionSourceResponseDto[]>(
    `/emission/emission-sources${query ? `?${query}` : ''}`, accessToken
  );
}

export async function getEmissionSource(
  accessToken: string,
  id: string
): Promise<EmissionSourceResponseDto> {
  return apiFetchAuth<EmissionSourceResponseDto>(`/emission/emission-sources/${id}`, accessToken);
}

export async function createEmissionSource(
  accessToken: string,
  data: {
    orgUnitId: string;
    category: string;
    name: string;
    meterNumber?: string | null;
    vehicleType?: string | null;
    technology?: string | null;
    defaultFuelType?: string | null;
    defaultGasType?: string | null;
  }
): Promise<EmissionSourceResponseDto> {
  return apiFetchAuth<EmissionSourceResponseDto>('/emission/emission-sources', accessToken, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateEmissionSource(
  accessToken: string,
  id: string,
  data: {
    name?: string;
    meterNumber?: string | null;
    vehicleType?: string | null;
    technology?: string | null;
    defaultFuelType?: string | null;
    defaultGasType?: string | null;
    isActive?: boolean;
  }
): Promise<EmissionSourceResponseDto> {
  return apiFetchAuth<EmissionSourceResponseDto>(`/emission/emission-sources/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteEmissionSource(
  accessToken: string,
  id: string
): Promise<EmissionSourceResponseDto> {
  return apiFetchAuth<EmissionSourceResponseDto>(`/emission/emission-sources/${id}`, accessToken, {
    method: 'DELETE'
  });
}
```

**`src/lib/api/emission-entries.ts`:**
```typescript
import { apiFetchAuth } from './client.js';
import type { EmissionEntryResponseDto, EmissionEntryListResponse } from './types.js';

export async function listEmissionEntries(
  accessToken: string,
  params?: { orgUnitId?: string; reportingYear?: number; category?: string; page?: number; pageSize?: number }
): Promise<EmissionEntryListResponse> {
  const qs = new URLSearchParams();
  if (params?.orgUnitId) qs.set('orgUnitId', params.orgUnitId);
  if (params?.reportingYear) qs.set('reportingYear', String(params.reportingYear));
  if (params?.category) qs.set('category', params.category);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
  const query = qs.toString();
  return apiFetchAuth<EmissionEntryListResponse>(
    `/emission/emission-entries${query ? `?${query}` : ''}`, accessToken
  );
}

export async function getEmissionEntry(
  accessToken: string,
  id: string
): Promise<EmissionEntryResponseDto> {
  return apiFetchAuth<EmissionEntryResponseDto>(`/emission/emission-entries/${id}`, accessToken);
}

export async function createEmissionEntry(
  accessToken: string,
  data: Record<string, unknown>,
  dryRun = false
): Promise<EmissionEntryResponseDto> {
  const query = dryRun ? '?dryRun=true' : '';
  return apiFetchAuth<EmissionEntryResponseDto>(`/emission/emission-entries${query}`, accessToken, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateEmissionEntry(
  accessToken: string,
  id: string,
  data: Record<string, unknown>
): Promise<EmissionEntryResponseDto> {
  return apiFetchAuth<EmissionEntryResponseDto>(`/emission/emission-entries/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteEmissionEntry(
  accessToken: string,
  id: string
): Promise<void> {
  await apiFetchAuth<void>(`/emission/emission-entries/${id}`, accessToken, { method: 'DELETE' });
}

export async function getEmissionEntryTraces(
  accessToken: string,
  entryId: string
): Promise<unknown[]> {
  return apiFetchAuth<unknown[]>(`/emission/emission-entries/${entryId}/traces`, accessToken);
}
```

**`src/lib/api/evidence.ts`:**
```typescript
import { apiFetchAuth } from './client.js';
import type { EvidenceFileResponseDto, EvidenceUploadUrlResponse } from './types.js';

export async function requestUploadUrl(
  accessToken: string,
  data: { originalFilename: string; contentType: string }
): Promise<EvidenceUploadUrlResponse> {
  return apiFetchAuth<EvidenceUploadUrlResponse>('/emission/evidence/upload-url', accessToken, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function confirmUpload(
  accessToken: string,
  evidenceId: string
): Promise<EvidenceFileResponseDto> {
  return apiFetchAuth<EvidenceFileResponseDto>(
    `/emission/evidence/${evidenceId}/confirm`, accessToken, { method: 'POST' }
  );
}

export async function getDownloadUrl(
  accessToken: string,
  evidenceId: string
): Promise<string> {
  return apiFetchAuth<string>(`/emission/evidence/${evidenceId}/download-url`, accessToken);
}

export async function deleteEvidence(
  accessToken: string,
  evidenceId: string
): Promise<void> {
  await apiFetchAuth<void>(`/emission/evidence/${evidenceId}`, accessToken, { method: 'DELETE' });
}
```

**`src/lib/api/campaigns.ts`:**
```typescript
import { apiFetchAuth } from './client.js';
import type {
  CampaignResponseDto,
  CampaignWithDetails,
  CampaignTask,
  CampaignActivationResponse
} from './types.js';

interface CampaignListItem {
  id: string;
  tenantId: string;
  name: string;
  indicatorId: string;
  workflowTemplateId: string;
  approvalTiers: number;
  reportingYear: number;
  periodStart: string;
  periodEnd: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export async function listCampaigns(
  accessToken: string,
  params?: { status?: string; reportingYear?: string }
): Promise<CampaignListItem[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.reportingYear) qs.set('reportingYear', params.reportingYear);
  const query = qs.toString();
  return apiFetchAuth<CampaignListItem[]>(`/campaigns${query ? `?${query}` : ''}`, accessToken);
}

export async function getCampaign(
  accessToken: string,
  id: string
): Promise<CampaignWithDetails> {
  return apiFetchAuth<CampaignWithDetails>(`/campaigns/${id}`, accessToken);
}

export async function createCampaign(
  accessToken: string,
  data: {
    name: string;
    indicatorId: string;
    workflowTemplateId: string;
    approvalTiers: number;
    reportingYear: number;
    periodStart: string;
    periodEnd: string;
    orgUnitIds: string[];
    approverOverrides?: Array<{ orgUnitId: string; tier: number; userId: string }>;
  }
): Promise<CampaignResponseDto> {
  return apiFetchAuth<CampaignResponseDto>('/campaigns', accessToken, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateCampaign(
  accessToken: string,
  id: string,
  data: Record<string, unknown>
): Promise<CampaignWithDetails> {
  return apiFetchAuth<CampaignWithDetails>(`/campaigns/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteCampaign(
  accessToken: string,
  id: string
): Promise<void> {
  await apiFetchAuth<void>(`/campaigns/${id}`, accessToken, { method: 'DELETE' });
}

export async function activateCampaign(
  accessToken: string,
  id: string
): Promise<CampaignActivationResponse> {
  return apiFetchAuth<CampaignActivationResponse>(`/campaigns/${id}/activate`, accessToken, {
    method: 'POST'
  });
}

export async function listCampaignTasks(
  accessToken: string,
  campaignId: string,
  params?: { status?: string; orgUnitId?: string }
): Promise<CampaignTask[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.orgUnitId) qs.set('orgUnitId', params.orgUnitId);
  const query = qs.toString();
  return apiFetchAuth<CampaignTask[]>(
    `/campaigns/${campaignId}/tasks${query ? `?${query}` : ''}`, accessToken
  );
}
```

**`src/lib/api/tasks.ts`:**
```typescript
import { apiFetchAuth } from './client.js';
import type { CampaignTask } from './types.js';

export async function getMyTasks(accessToken: string): Promise<CampaignTask[]> {
  return apiFetchAuth<CampaignTask[]>('/tasks/my', accessToken);
}

export async function getTask(accessToken: string, taskId: string): Promise<CampaignTask> {
  return apiFetchAuth<CampaignTask>(`/tasks/${taskId}`, accessToken);
}

export async function startTask(accessToken: string, taskId: string): Promise<CampaignTask> {
  return apiFetchAuth<CampaignTask>(`/tasks/${taskId}/start`, accessToken, { method: 'POST' });
}

export async function submitTask(accessToken: string, taskId: string): Promise<CampaignTask> {
  return apiFetchAuth<CampaignTask>(`/tasks/${taskId}/submit`, accessToken, { method: 'POST' });
}

export async function approveTask(accessToken: string, taskId: string): Promise<CampaignTask> {
  return apiFetchAuth<CampaignTask>(`/tasks/${taskId}/approve`, accessToken, { method: 'POST' });
}

export async function rejectTask(
  accessToken: string,
  taskId: string,
  data: { notes: string }
): Promise<CampaignTask> {
  return apiFetchAuth<CampaignTask>(`/tasks/${taskId}/reject`, accessToken, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
```

**`src/lib/api/emission-factors.ts`:**
```typescript
import { apiFetchAuth } from './client.js';
import type { EmissionFactorLibraryResponseDto } from './types.js';

export async function listEmissionFactorLibraries(
  accessToken: string,
  params?: { authority?: string; releaseYear?: number }
): Promise<EmissionFactorLibraryResponseDto[]> {
  const qs = new URLSearchParams();
  if (params?.authority) qs.set('authority', params.authority);
  if (params?.releaseYear) qs.set('releaseYear', String(params.releaseYear));
  const query = qs.toString();
  return apiFetchAuth<EmissionFactorLibraryResponseDto[]>(
    `/emission-factors/emission-factor-libraries${query ? `?${query}` : ''}`, accessToken
  );
}

export async function listFuelProperties(
  accessToken: string,
  params: { libraryId: string; fuelType?: string; propertyType?: string }
): Promise<unknown[]> {
  const qs = new URLSearchParams({ libraryId: params.libraryId });
  if (params.fuelType) qs.set('fuelType', params.fuelType);
  if (params.propertyType) qs.set('propertyType', params.propertyType);
  return apiFetchAuth<unknown[]>(`/emission-factors/fuel-properties?${qs}`, accessToken);
}

export async function listGwpValues(
  accessToken: string,
  params?: { version?: string }
): Promise<unknown[]> {
  const qs = new URLSearchParams();
  if (params?.version) qs.set('version', params.version);
  const query = qs.toString();
  return apiFetchAuth<unknown[]>(
    `/emission-factors/gwp-values${query ? `?${query}` : ''}`, accessToken
  );
}
```

**Step 2: Commit**

```bash
git add src/lib/api/workflow-templates.ts src/lib/api/indicators.ts src/lib/api/emission-sources.ts src/lib/api/emission-entries.ts src/lib/api/evidence.ts src/lib/api/campaigns.ts src/lib/api/tasks.ts src/lib/api/emission-factors.ts
git commit -m "feat: add API modules for workflow, campaign, emission, and evidence domains"
```

---

## Task 3: Zod Schemas

**Files:**
- Create: `src/lib/schemas/workflow-template.ts`
- Create: `src/lib/schemas/indicator.ts`
- Create: `src/lib/schemas/emission-source.ts`
- Create: `src/lib/schemas/campaign.ts`
- Create: `src/lib/schemas/emission-entry.ts`
- Create: `src/lib/schemas/task-reject.ts`

**Step 1: Create all schemas**

Follow the exact pattern from `src/lib/schemas/org-unit.ts` — Zod 4 schemas, `z.object()` + `.superRefine()` for cross-field validation.

**`src/lib/schemas/workflow-template.ts`:**
```typescript
import { z } from 'zod';

export const createWorkflowTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).nullish().default(null),
  approvalTiers: z.coerce.number().int().min(1).max(3)
});

export const updateWorkflowTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).optional(),
  description: z.string().max(1000).nullish()
});
```

**`src/lib/schemas/indicator.ts`:**
```typescript
import { z } from 'zod';

export const createIndicatorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  emissionCategory: z.enum(['stationary', 'mobile', 'fugitive', 'process'], {
    required_error: 'Category is required'
  }),
  calculationMethod: z.string().min(1, 'Calculation method is required'),
  defaultFuelType: z.string().max(100).nullish().default(null),
  defaultGasType: z.string().max(100).nullish().default(null)
});

export const updateIndicatorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).optional(),
  defaultFuelType: z.string().max(100).nullish(),
  defaultGasType: z.string().max(100).nullish(),
  isActive: z.boolean().optional()
});
```

**`src/lib/schemas/emission-source.ts`:**
```typescript
import { z } from 'zod';

export const createEmissionSourceSchema = z.object({
  orgUnitId: z.string().uuid('Invalid org unit'),
  category: z.enum(['stationary', 'mobile', 'fugitive', 'process'], {
    required_error: 'Category is required'
  }),
  name: z.string().min(1, 'Name is required').max(255),
  meterNumber: z.string().max(100).nullish().default(null),
  vehicleType: z.string().max(100).nullish().default(null),
  technology: z.string().max(100).nullish().default(null),
  defaultFuelType: z.string().max(100).nullish().default(null),
  defaultGasType: z.string().max(100).nullish().default(null)
});

export const updateEmissionSourceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  meterNumber: z.string().max(100).nullish(),
  vehicleType: z.string().max(100).nullish(),
  technology: z.string().max(100).nullish(),
  defaultFuelType: z.string().max(100).nullish(),
  defaultGasType: z.string().max(100).nullish(),
  isActive: z.boolean().optional()
});
```

**`src/lib/schemas/campaign.ts`:**
```typescript
import { z } from 'zod';

export const createCampaignSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(200),
    indicatorId: z.string().uuid('Indicator is required'),
    workflowTemplateId: z.string().uuid('Workflow template is required'),
    approvalTiers: z.coerce.number().int().min(1).max(3),
    reportingYear: z.coerce.number().int().min(2000).max(2100),
    periodStart: z.string().min(1, 'Start date is required'),
    periodEnd: z.string().min(1, 'End date is required'),
    orgUnitIds: z.array(z.string().uuid()).min(1, 'At least one org unit is required')
  })
  .superRefine((data, ctx) => {
    if (data.periodStart && data.periodEnd && data.periodStart >= data.periodEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be after start date',
        path: ['periodEnd']
      });
    }
  });

export const updateCampaignSchema = createCampaignSchema.partial();
```

**`src/lib/schemas/emission-entry.ts`:**
```typescript
import { z } from 'zod';

export const emissionEntrySchema = z.object({
  sourceId: z.string().uuid().nullish().default(null),
  fuelType: z.string().max(100).nullish().default(null),
  activityAmount: z.coerce.number().positive().nullish().default(null),
  activityUnit: z.string().max(50).nullish().default(null),
  distance: z.coerce.number().positive().nullish().default(null),
  distanceUnit: z.enum(['km', 'miles']).nullish().default(null),
  vehicleType: z.string().max(100).nullish().default(null),
  technology: z.string().max(100).nullish().default(null),
  productionVolume: z.coerce.number().positive().nullish().default(null),
  productionUnit: z.string().max(100).nullish().default(null),
  abatementEfficiency: z.coerce.number().min(0).max(1).nullish().default(null),
  gasType: z.string().max(100).nullish().default(null),
  refrigerantInventoryStart: z.coerce.number().min(0).nullish().default(null),
  refrigerantInventoryEnd: z.coerce.number().min(0).nullish().default(null),
  refrigerantPurchased: z.coerce.number().min(0).nullish().default(null),
  refrigerantRecovered: z.coerce.number().min(0).nullish().default(null),
  notes: z.string().max(2000).nullish().default(null)
});
```

**`src/lib/schemas/task-reject.ts`:**
```typescript
import { z } from 'zod';

export const taskRejectSchema = z.object({
  notes: z.string().min(1, 'Notes are required').max(2000)
});
```

**Step 2: Commit**

```bash
git add src/lib/schemas/workflow-template.ts src/lib/schemas/indicator.ts src/lib/schemas/emission-source.ts src/lib/schemas/campaign.ts src/lib/schemas/emission-entry.ts src/lib/schemas/task-reject.ts
git commit -m "feat: add Zod schemas for workflow, campaign, emission, and task forms"
```

---

## Task 4: Navigation Updates

**Files:**
- Modify: `src/components/app-sidebar.svelte`
- Modify: `src/routes/(app)/settings/+layout.svelte`

**Step 1: Add My Tasks and Campaigns to app sidebar**

In `src/components/app-sidebar.svelte`:

1. Add imports:
```typescript
import ListChecks from "@lucide/svelte/icons/list-checks";
import Megaphone from "@lucide/svelte/icons/megaphone";
```

2. Add "My Tasks" to `dataItems` array (after "Scope 1-3"):
```typescript
{ title: "My Tasks", url: "/tasks", icon: ListChecks },
```

3. Add "Campaigns" to `adminItems` array (before "Settings"):
```typescript
{ title: "Campaigns", url: "/campaigns", icon: Megaphone },
```

**Step 2: Add Workflow Templates and Indicators to settings sidebar**

In `src/routes/(app)/settings/+layout.svelte`:

1. Add imports:
```typescript
import GitBranch from "@lucide/svelte/icons/git-branch";
import Gauge from "@lucide/svelte/icons/gauge";
```

2. Add to `navItems` array (after "Organizational Tree", before "Team Members"):
```typescript
{ href: "/settings/workflow-templates", label: "Workflow Templates", icon: GitBranch },
{ href: "/settings/indicators", label: "Indicators", icon: Gauge },
```

3. Filter these for admin-only visibility (like Team Members):
```typescript
let visibleNavItems = $derived(
  navItems.filter((item) => {
    if (item.href === '/settings/team-members') return isAdmin;
    if (item.href === '/settings/workflow-templates') return isAdmin;
    if (item.href === '/settings/indicators') return isAdmin;
    return true;
  })
);
```

**Step 3: Commit**

```bash
git add src/components/app-sidebar.svelte src/routes/(app)/settings/+layout.svelte
git commit -m "feat: add My Tasks, Campaigns, Workflow Templates, and Indicators navigation"
```

---

## Task 5: Workflow Templates Pages

**Files:**
- Create: `src/routes/(app)/settings/workflow-templates/+page.server.ts`
- Create: `src/routes/(app)/settings/workflow-templates/+page.svelte`
- Create: `src/routes/(app)/settings/workflow-templates/_components/WorkflowCard.svelte`
- Create: `src/routes/(app)/settings/workflow-templates/new/+page.server.ts`
- Create: `src/routes/(app)/settings/workflow-templates/new/+page.svelte`
- Create: `src/routes/(app)/settings/workflow-templates/[id]/+page.server.ts`
- Create: `src/routes/(app)/settings/workflow-templates/[id]/+page.svelte`

**Step 1: Build the list page**

`+page.server.ts` — Load all templates. Actions for delete, activate, archive.
`+page.svelte` — Page header with "New Template" button. Map templates to `WorkflowCard` components. Empty state if no templates.

**Step 2: Build WorkflowCard component**

Card with: name, description, status badge (draft=slate, active=green, archived=amber), tier count (derived from steps where type=review/approve), version, created date. Action buttons conditionally shown based on status.

**Step 3: Build the create page**

Form with Superforms pattern. Simplified mode: name, description, approval tiers radio (1/2/3). Visual flow preview component showing step flow. On save, auto-generate steps array:
- Step 1: "Submit Data" (type: submit, role: data_entry, order: 1)
- Step 2: "Tier 1 Review" (type: review, role: data_approver, order: 2)
- Step 3 (if tiers >= 2): "Tier 2 Review" (type: review, role: data_approver, order: 3)
- Step 4 (if tiers >= 3): "Final Approval" (type: approve, role: tenant_admin, order: 4)
- Else last step: type approve

Auto-generate transitions:
- Each step -> next step (trigger: complete)
- Each review/approve step -> step 1 (trigger: reject)

Advanced mode toggle: show full step/transition editor.

**Step 4: Build the view/edit page**

Same form as create, pre-populated from loaded template. If status != draft, form fields are disabled. Status transition buttons in header. Confirmation dialogs for activate/archive/delete.

**Step 5: Commit**

```bash
git add src/routes/(app)/settings/workflow-templates/
git commit -m "feat: add workflow template list, create, and edit pages"
```

---

## Task 6: Indicators Page

**Files:**
- Create: `src/routes/(app)/settings/indicators/+page.server.ts`
- Create: `src/routes/(app)/settings/indicators/+page.svelte`
- Create: `src/routes/(app)/settings/indicators/_components/IndicatorDialog.svelte`

**Step 1: Build the page**

`+page.server.ts` — Load indicators list. Actions: create, update, delete.
`+page.svelte` — Data table with columns (Name, Category, Method, Fuel, Gas, Active, Actions). "New Indicator" button opens IndicatorDialog. Edit button per row also opens dialog in edit mode. Delete button with confirmation.

**Step 2: Build IndicatorDialog**

Dialog component. Props: `open` (bindable), `mode` ('create' | 'edit'), `indicator` (for edit).

Create mode: Name, Category select, Calculation Method select (filtered by category using `CATEGORY_METHOD_MAP`), Default Fuel Type, Default Gas Type.

Edit mode: Same but Category and Method are disabled/read-only.

Form uses Superforms with `createIndicatorSchema` or `updateIndicatorSchema`.

Use `$derived` to filter calculation methods when category changes:
```typescript
let availableMethods = $derived(
  $form.emissionCategory
    ? CATEGORY_METHOD_MAP[$form.emissionCategory as EmissionCategory]
    : []
);
```

**Step 3: Commit**

```bash
git add src/routes/(app)/settings/indicators/
git commit -m "feat: add indicators list page with create/edit dialog"
```

---

## Task 7: Emission Sources in Org Tree

**Files:**
- Modify: `src/routes/(app)/settings/organizational-tree/+page.server.ts`
- Modify: `src/routes/(app)/settings/organizational-tree/+page.svelte`
- Create: `src/routes/(app)/settings/organizational-tree/_components/EmissionSourcesSection.svelte`
- Create: `src/routes/(app)/settings/organizational-tree/_components/EmissionSourceDialog.svelte`

**Step 1: Add emission source loading and actions**

In `+page.server.ts`:
- Import `listEmissionSources`, `createEmissionSource`, `updateEmissionSource`, `deleteEmissionSource`
- Add `createEmissionSourceForm` and `updateEmissionSourceForm` to load function
- Add `createSource`, `updateSource`, `deleteSource` actions

**Step 2: Add EmissionSourcesSection**

New section in OrgNodeForm (when mode="edit"): below the existing org unit fields, add a "Emission Sources" section with a data table and "Add Source" button. This section is shown after a `Field.Separator`.

**Step 3: Build EmissionSourceDialog**

Dialog with fields: Name, Category (select), Meter Number, Vehicle Type, Technology, Default Fuel Type, Default Gas Type. For edit mode, Category is disabled.

**Step 4: Wire into the org tree page**

Pass emission source data and forms to OrgNodeForm. The section loads sources for the selected org unit. Add/edit/delete operate via form actions.

**Step 5: Commit**

```bash
git add src/routes/(app)/settings/organizational-tree/
git commit -m "feat: add emission source management within org unit detail"
```

---

## Task 8: Campaign List Page

**Files:**
- Create: `src/routes/(app)/campaigns/+page.server.ts`
- Create: `src/routes/(app)/campaigns/+page.svelte`
- Create: `src/routes/(app)/campaigns/+layout.svelte` (minimal — just renders children)

**Step 1: Build +page.server.ts**

Load: Fetch campaigns list (optionally filtered by status/year from URL params). Fetch indicators list (for display names). Actions: delete (draft only).

**Step 2: Build +page.svelte**

Page header: "Campaigns" title + "New Campaign" button (link to `/campaigns/new`).
Filter bar: Status select (All/Draft/Active/Closed) + Reporting Year select.
Campaign cards: Each card shows name, indicator name + category badge, period, status badge, org unit count. Actions: View, Edit (draft), Delete (draft).

Empty state if no campaigns.

**Step 3: Commit**

```bash
git add src/routes/(app)/campaigns/
git commit -m "feat: add campaign list page with status and year filters"
```

---

## Task 9: Campaign Create/Edit Pages

**Files:**
- Create: `src/routes/(app)/campaigns/new/+page.server.ts`
- Create: `src/routes/(app)/campaigns/new/+page.svelte`
- Create: `src/routes/(app)/campaigns/_components/CampaignForm.svelte`
- Create: `src/routes/(app)/campaigns/_components/OrgUnitSelector.svelte`
- Create: `src/routes/(app)/campaigns/_components/ApproverOverrides.svelte`
- Create: `src/routes/(app)/campaigns/[id]/edit/+page.server.ts`
- Create: `src/routes/(app)/campaigns/[id]/edit/+page.svelte`

**Step 1: Build the shared CampaignForm component**

4-section form following the design doc:
1. Campaign Details: name, indicator select, reporting year, period start/end
2. Workflow & Approval: workflow template select (active only), approval tiers (1-3)
3. Org Units: OrgUnitSelector component (tree with checkboxes)
4. Approver Overrides: collapsible section, per-org-unit per-tier table

**Step 2: Build OrgUnitSelector**

Reuse the existing OrgTree component style but with checkboxes. Shows tree structure, user checks/unchecks org units. Selected org units displayed as chips below. Minimum 1 required.

**Step 3: Build ApproverOverrides**

Dynamic table: Org Unit select (from selected org units), Tier select (1 to approvalTiers), User select (from user list). "Add Override" button. Remove button per row.

**Step 4: Build create page server + page**

`+page.server.ts`: Load indicators, active workflow templates, org tree, users. Create form with superValidate. Action: create campaign via API.
`+page.svelte`: Render CampaignForm. Save navigates to campaign detail.

**Step 5: Build edit page server + page**

`+page.server.ts`: Load existing campaign + reference data. Pre-populate form. Action: update campaign. Guard: only draft campaigns.
`+page.svelte`: Same CampaignForm, pre-populated. "Activate" button triggers activate action.

**Step 6: Commit**

```bash
git add src/routes/(app)/campaigns/new/ src/routes/(app)/campaigns/_components/ src/routes/(app)/campaigns/\[id\]/edit/
git commit -m "feat: add campaign create and edit pages with org unit selector"
```

---

## Task 10: Campaign Detail Page

**Files:**
- Create: `src/routes/(app)/campaigns/[id]/+page.server.ts`
- Create: `src/routes/(app)/campaigns/[id]/+page.svelte`
- Create: `src/routes/(app)/campaigns/_components/TaskOverviewTable.svelte`

**Step 1: Build +page.server.ts**

Load: Campaign detail, campaign tasks (if active), indicator detail, org units (for name resolution). Actions: activate, delete.

**Step 2: Build +page.svelte**

Header: Campaign name + status badge + action buttons (Activate for draft, Edit for draft).
Summary section: Cards showing Indicator, Period, Workflow Template, Tiers, Created By.
Task overview (active campaigns): TaskOverviewTable + progress stats (X locked, Y in review, Z pending).

**Step 3: Build TaskOverviewTable**

Data table: Org Unit, Status (badge), Current Tier, Submitted At, Approved At, Actions (View link to `/tasks/[taskId]`).

**Step 4: Commit**

```bash
git add src/routes/(app)/campaigns/\[id\]/+page.server.ts src/routes/(app)/campaigns/\[id\]/+page.svelte src/routes/(app)/campaigns/_components/TaskOverviewTable.svelte
git commit -m "feat: add campaign detail page with task overview"
```

---

## Task 11: My Tasks Page

**Files:**
- Create: `src/routes/(app)/tasks/+page.server.ts`
- Create: `src/routes/(app)/tasks/+page.svelte`
- Create: `src/routes/(app)/tasks/_components/TaskCard.svelte`

**Step 1: Build +page.server.ts**

Load: Fetch my tasks via `getMyTasks()`. Also fetch campaigns and org units for name resolution (parallel loading).

**Step 2: Build +page.svelte**

Page header: "My Tasks".
Status filter tabs using `Tabs.Root`: All | Pending | Draft | In Review | Revision Requested | Locked.
Filtered task list rendered as TaskCard components.
Sort: revision_requested first, then pending, draft, in_review, locked.

Empty state per tab if no tasks match filter.

**Step 3: Build TaskCard**

Card component showing: Campaign name (subtle), Org Unit name (prominent), Indicator name, Status badge, Reporting period, Dates. Action button: "Start" (pending), "Continue" (draft), "View" (in_review/locked), "Revise" (revision_requested). Links to `/tasks/[taskId]`.

Badge styling per status:
- pending: slate
- draft: blue
- in_review: amber
- revision_requested: red
- locked: green

**Step 4: Commit**

```bash
git add src/routes/(app)/tasks/
git commit -m "feat: add My Tasks page with status filter tabs and task cards"
```

---

## Task 12: Task Detail Page — Structure & Start

**Files:**
- Create: `src/routes/(app)/tasks/[taskId]/+page.server.ts`
- Create: `src/routes/(app)/tasks/[taskId]/+page.svelte`

**Step 1: Build +page.server.ts**

Load: Fetch task, campaign, indicator, org unit name. If task has emissionEntryId, fetch the emission entry. Fetch emission sources for the org unit (for the source select dropdown). Initialize emission entry form if task is in draft/revision_requested. Actions: start, saveDraft, submit, approve, reject.

Start action: calls `startTask()`, redirects back (page reloads with new status).
SaveDraft action: calls `updateEmissionEntry()` with form data.
Submit action: calls `submitTask()`, redirects back.
Approve action: calls `approveTask()`, redirects back.
Reject action: validates notes, calls `rejectTask()`, redirects back.

**Step 2: Build +page.svelte**

Header: Campaign name, Org Unit, Indicator, Status badge, Period.

Content switches on task status:
- `pending`: Start button
- `draft` / `revision_requested`: Data entry form + evidence section + calculation preview + actions
- `in_review`: Read-only data + approval section
- `locked`: Read-only data + locked banner

For now, focus on the page structure and the pending → start flow. Data entry form, evidence, and approval sections will be built in subsequent tasks.

**Step 3: Commit**

```bash
git add src/routes/(app)/tasks/\[taskId\]/
git commit -m "feat: add task detail page structure with start task action"
```

---

## Task 13: Task Detail — Data Entry Form

**Files:**
- Create: `src/routes/(app)/tasks/[taskId]/_components/ActivityDataSection.svelte`
- Modify: `src/routes/(app)/tasks/[taskId]/+page.svelte`

**Step 1: Build ActivityDataSection**

Form section that renders different fields based on the emission category:

**Stationary:** Fuel Type (text input), Activity Amount (number), Activity Unit (select: m3, litres, kg, etc.)
**Mobile (fuel):** Fuel Type, Activity Amount (fuel mass in kg)
**Mobile (distance):** Distance (number), Distance Unit (select: km/miles), Vehicle Type (text)
**Fugitive:** Gas Type (text), Refrigerant Inventory Start/End (numbers), Purchased/Recovered (numbers)
**Process (production):** Production Volume (number), Production Unit (text)
**Process (abatement):** Activity Amount (number), Abatement Efficiency (number 0-1)

Plus shared fields: Emission Source (select from org unit sources, optional), Notes (textarea).

Props: `superform`, `form`, `category`, `calculationMethod`, `sources`, `readonly`.

Use `{#if category === 'stationary'}` blocks to show/hide category-specific fields.

**Step 2: Wire into page**

Render ActivityDataSection in the draft/revision_requested view. Pass the superform, category from indicator, sources from load.

**Step 3: Commit**

```bash
git add src/routes/(app)/tasks/\[taskId\]/_components/ src/routes/(app)/tasks/\[taskId\]/+page.svelte
git commit -m "feat: add activity data section with category-specific fields"
```

---

## Task 14: Task Detail — Evidence Upload

**Files:**
- Create: `src/routes/(app)/tasks/[taskId]/_components/EvidenceSection.svelte`
- Modify: `src/routes/(app)/tasks/[taskId]/+page.server.ts`
- Modify: `src/routes/(app)/tasks/[taskId]/+page.svelte`

**Step 1: Build EvidenceSection**

Client-side component for file upload. Uses the 3-step S3 flow:
1. User picks file → component calls server action `requestUploadUrl` with filename + MIME type
2. Server returns presigned URL + evidenceId → component uploads file directly to S3 via `fetch(url, { method: 'PUT', body: file })`
3. Component calls server action `confirmUpload` → evidence marked as uploaded
4. Evidence ID added to local list, displayed in file table

File list table: Filename, Type, Status, Actions (Download, Delete).
Upload area: Drag & drop zone + "Browse" button.
Warning indicator if no evidence files (not blocking, just visual cue).

Props: `evidenceIds` (bindable array of strings), `accessToken` (for client-side S3 upload), `readonly`.

**Step 2: Add server actions for evidence**

In `+page.server.ts`, add actions:
- `requestUploadUrl`: calls `requestUploadUrl()` API, returns URL + ID
- `confirmUpload`: calls `confirmUpload()` API
- `deleteEvidence`: calls `deleteEvidence()` API
- `downloadEvidence`: calls `getDownloadUrl()` API, returns URL

**Step 3: Wire into page**

Render EvidenceSection in draft/revision_requested view. Pass evidence IDs, bind them for use in save/submit.

**Step 4: Commit**

```bash
git add src/routes/(app)/tasks/\[taskId\]/
git commit -m "feat: add evidence upload section with S3 presigned URL flow"
```

---

## Task 15: Task Detail — Calculation Preview

**Files:**
- Create: `src/routes/(app)/tasks/[taskId]/_components/CalculationPreview.svelte`
- Modify: `src/routes/(app)/tasks/[taskId]/+page.svelte`

**Step 1: Build CalculationPreview**

Read-only section showing the CO2e calculation result from the emission entry's trace:
- Total CO2e (tonnes) — prominent large number
- Breakdown: CO2, CH4, N2O in kg
- CO2e equivalents: CO2 CO2e, CH4 CO2e, N2O CO2e
- Formula used
- Emission factor library + version
- Resolution tier (specific/regional/global)

Props: `trace: CalculationTraceResponseDto | null`.

If trace is null, show "Save your data to see calculation results" message.

**Step 2: Wire into page**

Render CalculationPreview below evidence section. Pass the trace from the emission entry.

**Step 3: Commit**

```bash
git add src/routes/(app)/tasks/\[taskId\]/
git commit -m "feat: add calculation preview section showing CO2e breakdown"
```

---

## Task 16: Task Detail — Approval Flow

**Files:**
- Create: `src/routes/(app)/tasks/[taskId]/_components/ApprovalSection.svelte`
- Create: `src/routes/(app)/tasks/[taskId]/_components/RejectDialog.svelte`
- Modify: `src/routes/(app)/tasks/[taskId]/+page.svelte`

**Step 1: Build ApprovalSection**

Shown when task is in `in_review` status and user is an approver:
- Current tier indicator: "Reviewing as Tier X of Y"
- "Approve" button (primary)
- "Request Revision" button (destructive variant) → opens RejectDialog
- Approval history (if available): table showing past approvals/rejections

**Step 2: Build RejectDialog**

Dialog with:
- Title: "Request Revision"
- Textarea for notes (required, 1-2000 chars)
- Cancel + "Send Back" buttons
- Uses `taskRejectSchema` for validation

**Step 3: Wire into page**

For `in_review` tasks:
- All data sections rendered in read-only mode
- ApprovalSection rendered at the bottom
- Form actions for approve and reject

For `locked` tasks:
- All sections read-only
- "Locked" alert banner at top
- Approval history shown

For `revision_requested` tasks:
- Alert banner showing rejection notes
- Data sections in editable mode (same as draft)

**Step 4: Commit**

```bash
git add src/routes/(app)/tasks/\[taskId\]/
git commit -m "feat: add approval section with approve/reject flow and history"
```

---

## Task 17: Save Draft & Submit Actions

**Files:**
- Modify: `src/routes/(app)/tasks/[taskId]/+page.server.ts`
- Modify: `src/routes/(app)/tasks/[taskId]/+page.svelte`

**Step 1: Implement saveDraft action**

In `+page.server.ts` saveDraft action:
- Parse form data with `emissionEntrySchema`
- Build payload from form data + entry's fixed fields (category, method, reporting year, dates from task/campaign)
- Call `updateEmissionEntry()` with merged data
- Include `evidenceIds` from form data
- Return success message

**Step 2: Implement submit action**

In `+page.server.ts` submit action:
- Call `submitTask()` API
- Handle errors: 409 (not in correct state), 422 (missing evidence/data)
- On success, redirect back to task detail (now shows in_review)

**Step 3: Wire sticky footer**

In `+page.svelte`, add sticky footer for draft/revision_requested:
- "Save Draft" button (form submit to saveDraft action)
- "Submit for Review" button (form submit to submit action, with confirmation dialog)
- "Cancel" link back to /tasks

**Step 4: Commit**

```bash
git add src/routes/(app)/tasks/\[taskId\]/
git commit -m "feat: add save draft and submit for review actions"
```

---

## Task 18: Polish & Edge Cases

**Files:**
- Various files from previous tasks

**Step 1: Add loading states**

Add `{$submitting}` disabled states to all form buttons. Show "Saving..." / "Submitting..." text.

**Step 2: Add empty states**

- Campaign list: "No campaigns yet" with create button
- My Tasks: "No tasks assigned" message
- Workflow templates: "No templates" with create button
- Indicators: "No indicators" with create button

**Step 3: Add confirmation dialogs**

- Campaign activation: "This will create tasks for X org units and send notifications. Continue?"
- Workflow template activation: "Only one template can be active. This will be used for new campaigns."
- Delete confirmations for all deletable entities

**Step 4: Add error handling**

Ensure all API errors are caught and displayed via toast. Map common error codes:
- 409 → conflict messages (duplicate name, wrong status, etc.)
- 422 → validation messages (missing evidence, no approver found, etc.)
- 403 → permission denied
- 404 → not found

**Step 5: Verify build**

Run: `npm run build`
Expected: No TypeScript errors, no build failures.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add loading states, empty states, confirmations, and error handling"
```

---

## Task Summary

| # | Task | Files | Scope |
|---|------|-------|-------|
| 1 | Types & Enums | 1 modified | Foundation |
| 2 | API Modules | 8 created | Foundation |
| 3 | Zod Schemas | 6 created | Foundation |
| 4 | Navigation Updates | 2 modified | Navigation |
| 5 | Workflow Templates | 7+ created | Settings |
| 6 | Indicators Page | 3 created | Settings |
| 7 | Emission Sources in Org Tree | 2 modified, 2 created | Settings |
| 8 | Campaign List | 3 created | Campaigns |
| 9 | Campaign Create/Edit | 7+ created | Campaigns |
| 10 | Campaign Detail | 3 created | Campaigns |
| 11 | My Tasks Page | 3 created | Tasks |
| 12 | Task Detail — Structure | 2 created | Tasks |
| 13 | Task Detail — Data Entry | 1 created, 1 modified | Tasks |
| 14 | Task Detail — Evidence | 1 created, 2 modified | Tasks |
| 15 | Task Detail — Calc Preview | 1 created, 1 modified | Tasks |
| 16 | Task Detail — Approval | 2 created, 1 modified | Tasks |
| 17 | Save Draft & Submit | 2 modified | Tasks |
| 18 | Polish & Edge Cases | Various | Polish |
