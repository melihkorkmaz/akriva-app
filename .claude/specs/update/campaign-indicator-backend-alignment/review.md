---
title: "Design Review: Campaign & Indicator Backend Alignment"
type: review
status: complete
design: "campaign-indicator-backend-alignment"
reviewer: design-reviewer-agent
created: 2026-03-02
updated: 2026-03-02
---

# Design Review: Campaign & Indicator Backend Alignment

**Design:** `.claude/specs/update/campaign-indicator-backend-alignment/design.md`
**Spec:** `.claude/specs/update/campaign-indicator-backend-alignment/spec.md`

## Review Summary

| Category | Status | Findings |
|----------|--------|----------|
| Architecture Compliance | PASS | 0 findings |
| shadcn-svelte Patterns | PASS | 0 findings |
| Superforms Pattern | PASS | 0 findings |
| Design Token Usage | PASS | 0 findings |
| API Integration | WARN | 1 finding |
| Type Safety | WARN | 1 finding |
| Accessibility | PASS | 0 findings |
| Routing Conventions | PASS | 0 findings |
| Component Design | WARN | 2 findings |
| Spec Alignment | WARN | 2 findings |

**Overall:** APPROVED (0 Blockers, 5 Warnings resolved, 4 Suggestions)

---

## Findings

### Blockers

None.

### Warnings

#### [W-1] `data_reviewer` role referenced in `ApproverOverrides.svelte` does not exist in `TenantRole` type
- **Category:** Type Safety
- **Location:** Design Section 6, `ApproverOverrides.svelte` (line ~764 of design)
- **Issue:** The design filters eligible approver users with:
  ```typescript
  users.filter((u) => u.role === 'data_approver' || u.role === 'data_reviewer' || u.role === 'tenant_admin')
  ```
  The `TenantRole` type in `src/lib/api/types.ts` (line 60) is defined as:
  ```typescript
  type TenantRole = 'viewer' | 'data_entry' | 'data_approver' | 'tenant_admin' | 'super_admin';
  ```
  There is no `data_reviewer` role. The string `data_reviewer` only appears in a description label for the `two_step` workflow type (line 569 of types.ts). Filtering by a non-existent role will cause no match but may also cause a TypeScript strict mode error since `'data_reviewer'` is not assignable to `TenantRole`.
- **Recommendation:** Remove `u.role === 'data_reviewer'` from the filter, or confirm with the backend team if the `TenantRole` union is being updated to include `data_reviewer`. If a new role is planned, the design should include adding it to the `TenantRole` type and `TENANT_ROLE_LABELS` map in `src/lib/api/types.ts`.
- **Resolution:** RESOLVED. Confirmed `data_reviewer` exists in the backend `UserRole` enum. Updated design to add `data_reviewer` to the frontend `TenantRole` type and `TENANT_ROLE_LABELS` map (Section 1, Modified Types). Filter in `ApproverOverrides.svelte` correctly includes `data_reviewer`.

#### [W-2] Task detail page loses `approvalTiers` and `periodStart`/`periodEnd` after simplification
- **Category:** Spec Alignment
- **Location:** Design Section 8, `tasks/[taskId]/+page.svelte` (lines 1288-1321 of design)
- **Issue:** The current task detail page uses `data.campaign.approvalTiers` (passed to `ApprovalSection`) and `data.campaign.periodStart`/`periodEnd` (displayed in the header). After the simplification, the load function no longer fetches `getCampaign()`, so these values are unavailable. The `TaskDetailDto` type defined in the design does not include `approvalTiers`, `periodStart`, or `periodEnd`. The design acknowledges this with "derive from task context" but does not specify how. The existing `ApprovalSection` component (at `src/routes/(app)/tasks/[taskId]/_components/ApprovalSection.svelte`, line 15-17) requires a `totalTiers` prop. Without `approvalTiers` from the campaign, the approval tier indicator will break.
- **Recommendation:** Either:
  (a) Add `approvalTiers`, `periodStart`, and `periodEnd` to the `TaskDetailDto` type definition in the design, or
  (b) Keep a minimal `getCampaign()` call to fetch these missing fields, or
  (c) Explicitly update `ApprovalSection` to not require `totalTiers` if it will be derived differently.
- **Resolution:** RESOLVED. Added `approvalTiers`, `periodStart`, `periodEnd`, `emissionCategory`, and `emissionEntryId` to `TaskDetailDto` type definition in the design. `ApprovalSection` receives `totalTiers` from `data.task.approvalTiers`.

#### [W-3] `getMyTasks()` return type change from flat array to wrapped object is a breaking change in callers
- **Category:** API Integration
- **Location:** Design Section 2 (`src/lib/api/tasks.ts`) and Section 7 (`tasks/+page.server.ts`)
- **Issue:** The current `getMyTasks()` returns `Promise<CampaignTask[]>` (flat array). The design changes it to `Promise<MyTasksResponse>` where `MyTasksResponse = { tasks: MyTaskDto[] }`. The design's task list server load (Section 7, line ~1001) correctly accesses `response.tasks`. However, the design should verify that no other caller of `getMyTasks()` exists. The current `tasks/+page.server.ts` (line 11) uses it in `Promise.all` and destructures the result as a flat array (`const [tasks, ...] = await Promise.all([getMyTasks(...), ...])`). The design's rewrite handles this correctly, but this is a subtle breaking change that must not be overlooked during implementation.
- **Recommendation:** During implementation, search for all usages of `getMyTasks` and `listCampaignTasks` to ensure all callers are updated. The design should include a note about this.
- **Resolution:** RESOLVED. Added "Migration Notes" section to the design with a table of all breaking API function return type changes and a grep command to verify all callers are updated during implementation.

#### [W-4] `flattenTree` utility duplicated between `CampaignForm.svelte` and existing `+page.svelte`
- **Category:** Component Design
- **Location:** Design Section 6, CampaignForm changes (lines 889-901 of design)
- **Issue:** The design adds a `flattenTree` helper inside `CampaignForm.svelte` to build an `orgUnitNames` lookup. The existing `tasks/+page.svelte` (lines 24-34) already has an identical `flattenOrgTree` function. This creates duplicated utility code.
- **Recommendation:** Consider extracting this into a shared utility function (e.g., in `src/lib/utils.ts` or a new `src/lib/helpers/org-tree.ts`) and importing it in both locations. This is a minor concern since the task list page's version will be removed in this same design, but if the CampaignForm still needs it, having a single source is cleaner.
- **Resolution:** RESOLVED. Updated design to extract `flattenOrgTree` as a shared utility in `src/lib/utils.ts`. `CampaignForm.svelte` imports it from there instead of defining a local copy.

#### [W-5] Spec requires explicit error code mapping, but design delegates to existing pattern
- **Category:** Spec Alignment
- **Location:** Design Section "Error Handling" (lines 1403-1408 of design) vs. Spec "Error Handling" section (lines 259-276 of spec)
- **Issue:** The spec explicitly lists 11 backend error codes with user-friendly messages (e.g., `CAMPAIGN_NOT_FOUND` -> "Campaign not found", `SELF_APPROVAL` -> "You cannot approve your own submission"). The design states "No new error handling infrastructure needed" and relies on `err.body.error` which is the backend's human-readable message. This is a valid approach **if** the backend guarantees user-friendly error messages in `err.body.error`. However, the spec acceptance criteria include "All backend error codes are mapped to user-friendly messages". The design should either: (a) explicitly confirm the backend sends user-friendly messages in the `error` field (making frontend mapping unnecessary), or (b) add a frontend error code-to-message mapping utility as specified.
- **Recommendation:** Add a brief note in the design confirming that the backend `error` field already contains the user-friendly messages listed in the spec's error table, making a separate frontend mapping redundant. If the backend returns machine-readable codes (like `SELF_APPROVAL` rather than "You cannot approve your own submission"), then a frontend mapping is needed.
- **Resolution:** RESOLVED. Updated the Error Handling section in the design to explicitly confirm that the backend `err.body.error` field contains human-readable messages, making frontend error code mapping unnecessary.

### Suggestions

#### [S-1] Consider adding `emissionCategory` to `TaskDetailDto` for task detail UI
- **Category:** Component Design
- **Location:** Design Section 1, `TaskDetailDto` type (lines 157-169 of design)
- **Issue:** The current task detail page passes `data.indicator.emissionCategory` to `ActivityDataSection` (line 170 of existing `+page.svelte`). The new `TaskDetailDto` includes `indicatorName` but not `emissionCategory`. The design's updated `+page.server.ts` still calls `getEmissionEntry()` to get the full entry (which includes `category` and `calculationMethod`), but the `ActivityDataSection` component also needs the indicator's emission category independently (not just the entry's category). If the backend can include `emissionCategory` on the `TaskDetailDto`, it would eliminate potential mismatches.
- **Recommendation:** Add `emissionCategory: EmissionCategory` to the `TaskDetailDto` type, or confirm the `emissionEntry.category` from the full `getEmissionEntry()` call is sufficient.

#### [S-2] The `CATEGORY_VARIANT_MAP` key type could be `EmissionCategory` instead of `string`
- **Category:** Type Safety
- **Location:** Design Section 1, new types (line 80 of design)
- **Issue:** The design defines:
  ```typescript
  export const CATEGORY_VARIANT_MAP: Record<string, MethodVariant[] | null> = { ... };
  ```
  Using `string` as the key type is less strict than using `EmissionCategory`. Since the map's keys exactly match `EmissionCategory` values, the key type should be `Record<EmissionCategory, MethodVariant[] | null>`.
- **Recommendation:** Change to `Record<EmissionCategory, MethodVariant[] | null>` for stricter type checking.

#### [S-3] Template literal in `ApprovalHistory.svelte` timeline line height may clip
- **Category:** Component Design
- **Location:** Design Section 8, `ApprovalHistory.svelte` (line 1374 of design)
- **Issue:** The timeline connecting line uses `class="absolute top-8 h-full w-px bg-border"`. Since the parent `div` uses `relative`, the `h-full` computes relative to the parent flex item. For entries with long notes, this may not extend far enough. This is a minor CSS concern that should be validated visually during implementation.
- **Recommendation:** Test with multi-line notes entries and adjust if needed (e.g., use `bottom-0` instead of `h-full`).

#### [S-4] Architecture context doc and templates use `from 'zod/v4'` but all source files use `from 'zod'`
- **Category:** Documentation
- **Location:** `.claude/skills/spec-manager/references/architecture-context.md` (line 214), `.claude/skills/spec-manager/references/templates.md` (line 578)
- **Issue:** The design correctly uses `import { z } from 'zod'` matching all 14 existing schema files in the codebase. However, the architecture context and template reference documents incorrectly show `from 'zod/v4'`. This discrepancy could mislead future designs.
- **Recommendation:** Update the architecture context and template files to use `from 'zod'` to match the actual codebase convention. This is not a finding against this design (which is correct), but a note for project maintenance.

---

## Detailed Category Analysis

### 1. Architecture Compliance -- PASS

The design maintains the thin presentational layer principle. The conditional `methodVariant` validation in the Zod schema (`superRefine` checking which variants are valid for which categories) is acceptable as **client-side form validation mirroring backend rules** -- this is UI-level validation to provide immediate user feedback, not business logic. The backend will independently enforce the same rules. All data loading remains in `+page.server.ts` load functions and actions. No business logic or domain-level decision-making is added to client-side Svelte components.

### 2. shadcn-svelte Patterns -- PASS

All code snippets follow the correct import conventions:
- Compound components use namespace imports: `import * as Card from '$lib/components/ui/card/index.js'`, `import * as Select from '$lib/components/ui/select/index.js'`, `import * as Form from '$lib/components/ui/form/index.js'`, `import * as Dialog from '$lib/components/ui/dialog/index.js'`, `import * as Tabs from '$lib/components/ui/tabs/index.js'`
- Single components use named imports: `import { Button } from '$lib/components/ui/button/index.js'`, `import { Badge } from '$lib/components/ui/badge/index.js'`, `import { Input } from '$lib/components/ui/input/index.js'`, `import { Label } from '$lib/components/ui/label/index.js'`
- All imports include the `/index.js` suffix
- Icons use the tree-shakeable pattern: `import Check from '@lucide/svelte/icons/check'`
- The `{#snippet children({ props })}` pattern is used correctly for Form.Control

### 3. Superforms Pattern -- PASS

All Superforms usage follows the correct pattern:
- `IndicatorDialog.svelte`: `const createSF = superForm(createFormData, ...)` and `<Form.Field form={createSF} name="...">`
- `CampaignForm.svelte`: `const superform = superForm(formData, ...)` and `<Form.Field form={superform} name="...">`
- Task detail page: `const entryFormObj = superForm(data.entryForm, ...)`
- The full superForm return object is passed to `Form.Field`, never the destructured `form` store
- `zod4Client` is used for client-side validators
- `zod4` is used for server-side validation
- `dataType: 'json'` is correctly used in `CampaignForm.svelte` (line 51 of existing file), which handles the `approverOverrides` array of objects

### 4. Design Token Usage -- PASS

No hardcoded colors detected in the design's code snippets. All colors use Tailwind utilities:
- `bg-emerald-100`, `text-emerald-700`, `bg-red-100`, `text-red-700` in `ApprovalHistory.svelte` -- these follow the existing badge status color pattern already used in `CAMPAIGN_TASK_STATUS_BADGE_CLASSES` (lines 603-611 of `types.ts`)
- `text-muted-foreground`, `text-foreground`, `bg-muted`, `border-border`, `text-destructive` all map to design tokens
- Typography follows standard hierarchy: `text-2xl font-semibold` for page titles, `text-lg font-semibold` for card titles, `text-sm` for body, `text-xs` for helper text
- Icon sizes use standard `size-4`, `size-3.5`, `size-5`

### 5. API Integration -- WARN (1 finding)

See [W-3]. The API function changes follow correct patterns:
- `apiFetchAuth<T>` with proper type parameters
- `JSON.stringify()` for POST/PATCH bodies
- `ApiError` catch blocks in server load functions
- The `updateCampaign()` properly typed replacement for `Record<string, unknown>` is a good improvement

### 6. Type Safety -- WARN (1 finding)

See [W-1]. Otherwise:
- All new types are properly defined with explicit fields
- `MethodVariant` uses a union type with `as const` array
- `TaskDetailDto`, `MyTaskDto`, `ApprovalHistoryEntry` are well-typed
- No `any` types detected
- Props use Svelte 5 `$props()` with explicit interface definitions
- `$bindable()` used correctly for `ApproverOverrides.overrides`

### 7. Accessibility -- PASS

- All form fields use `<Form.Label>` associations
- `Form.FieldErrors` present for interactive fields
- `ApproverOverrides.svelte` uses `<Label>` for each select
- `ApprovalHistory.svelte` uses semantic structure with headings
- Interactive elements (buttons, selects) are keyboard-accessible via shadcn-svelte's built-in accessibility
- The timeline component uses visual indicators (colored circles with check/X icons) which provide non-text cues

### 8. Routing Conventions -- PASS

- All routes use `(app)/` group for protected pages
- Load functions in `+page.server.ts` use `locals.session!` for auth
- `requireAdmin(locals)` used where appropriate
- Form actions use SvelteKit actions pattern
- Successful mutations redirect with `redirect(303, '/path')`
- Error handling with `error(404, 'Task not found')` for missing resources
- `<svelte:head><title>Page | Akriva</title></svelte:head>` pattern maintained

### 9. Component Design -- WARN (2 findings)

See [W-4] and [S-1]. The new components follow conventions:
- `ApproverOverrides.svelte` placed in page-local `_components/` directory (correct for campaign-specific)
- `ApprovalHistory.svelte` placed in task detail's `_components/` directory (correct)
- Both use Svelte 5 runes (`$props`, `$state`, `$derived`, `$bindable`)
- Neither duplicates existing shadcn-svelte components
- Props interfaces are explicit with TypeScript types

### 10. Spec Alignment -- WARN (2 findings)

See [W-2] and [W-5]. Coverage of spec requirements:

- [x] `methodVariant` on indicators -- Fully covered in Sections 1, 3, 4
- [x] Conditional validation rules -- Covered with `superRefine` in indicator schema
- [x] Campaign `taskSummary` usage -- Covered in Section 5
- [x] Campaign approver overrides UI -- Covered in Section 6
- [x] Simplified task list (1 API call) -- Covered in Section 7
- [x] Simplified task detail (fewer API calls) -- Covered in Section 8, but see [W-2]
- [x] Approval history timeline -- Covered with `ApprovalHistory.svelte`
- [x] Error code mapping -- Covered by delegation, but see [W-5]
- [x] `npm run check` passes -- Implementation order step 11 includes type check

---

## Verification

After fixes are applied:

- [x] All blockers resolved (N/A -- none found)
- [x] Warnings addressed or acknowledged
  - [x] [W-1] `data_reviewer` added to `TenantRole` type and `TENANT_ROLE_LABELS`; filter restored
  - [x] [W-2] `TaskDetailDto` includes `approvalTiers`, `periodStart`, `periodEnd`, `emissionCategory`, `emissionEntryId`
  - [x] [W-3] Migration Notes section added with breaking API changes table
  - [x] [W-4] `flattenOrgTree` extracted to shared `$lib/utils.ts`
  - [x] [W-5] Error handling section clarifies backend provides human-readable messages
- [x] Re-review passed

## Notes

### 2026-03-02
- Initial review of design document
- Design is well-grounded in actual codebase patterns -- verified against current source files
- Zod import (`from 'zod'`) correctly matches codebase convention (not `from 'zod/v4'`)
- No blockers found; 5 warnings requiring attention before implementation
- The `dataType: 'json'` in CampaignForm's superForm config correctly handles the `approverOverrides` nested array
- The design correctly maintains the `getEmissionEntry()` call for the task detail form pre-fill, since the nested `TaskEmissionEntry` DTO has fewer fields than the full `EmissionEntryResponseDto`

### 2026-03-02 (resolution)
- All 5 warnings resolved in design.md
- W-1: Confirmed `data_reviewer` exists in backend `UserRole` enum — added to frontend `TenantRole` type and `TENANT_ROLE_LABELS` instead of removing from filter
- W-2: Added `approvalTiers`, `periodStart`, `periodEnd`, `emissionCategory`, `emissionEntryId` to `TaskDetailDto`
- W-3: Added Migration Notes section with breaking API changes table and grep verification command
- W-4: Extracted `flattenOrgTree` to shared `$lib/utils.ts`
- W-5: Clarified backend provides human-readable error messages in `err.body.error`
- S-2: Changed `CATEGORY_VARIANT_MAP` key type from `Record<string, ...>` to `Record<EmissionCategory, ...>`
- Design status updated to `approved`
