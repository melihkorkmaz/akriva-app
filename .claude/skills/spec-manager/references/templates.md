# Spec Templates

Four templates for different spec types, plus a design document template.
Each template includes YAML frontmatter for metadata and markdown sections for content.
All date fields use `YYYY-MM-DD` format.

---

## Feature Spec Template

```markdown
---
title: "<Feature Title>"
type: feature
status: draft
priority: high | medium | low
created: YYYY-MM-DD
updated: YYYY-MM-DD
author: "<author>"
areas:
  - <affected-area-1>
  - <affected-area-2>
figma: "<figma-url-if-available>"
backend-spec: "<path-to-backend-spec-if-exists>"
---

# <Feature Title>

## Summary

Brief 2-3 sentence description of the feature and why it is needed.

## Problem Statement

Describe the current gap or user need this feature addresses.
Include any relevant context about how the app works today.

## Proposed Solution

### Overview

High-level description of the solution approach.

### Pages / Routes

| Route | Purpose | Auth |
|-------|---------|------|
| `/(app)/<route>` | ... | Any authenticated / tenant_admin |

### User Flow

Describe the step-by-step user journey through this feature:

1. User navigates to...
2. User fills in...
3. On submit...
4. User sees...

### API Endpoints Consumed

| Method | Backend Endpoint | Purpose | Response Type |
|--------|-----------------|---------|---------------|
| GET | `/v1/...` | Fetch data | `XxxResponseDto` |
| POST | `/v1/...` | Create resource | `XxxResponseDto` |

### Form Fields

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| name | text input | min 1, max 200 | Yes |
| type | select | enum values | Yes |

### Components Needed

List key UI components and whether they exist or need creation:

| Component | Status | Location |
|-----------|--------|----------|
| ExistingCard | Exists | `$lib/components/ui/card/` |
| NewCustomWidget | New | `$components/NewCustomWidget.svelte` |

### Authorization

Which user roles can access this feature and what actions they can perform.

## Figma Design

Link to Figma frames (if available). Note any deviations from design system.

## Testing Strategy

- Visual review against Figma design
- Form validation edge cases
- API error handling scenarios
- Authorization guard behavior

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Out of Scope

What is explicitly NOT included in this feature.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| ... | ... | ... |

## Backend Dependencies

List any backend specs or API endpoints that must exist before this can be implemented:

- [ ] Backend spec: `.claude/specs/<type>/<name>/spec.md` — status: approved/pending
- [ ] API endpoint: `POST /v1/...` — available: yes/no

## References

- Related specs, PRs, commits, or external docs

## Notes

### YYYY-MM-DD
- Initial draft
```

---

## Tech Debt Spec Template

```markdown
---
title: "<Tech Debt Title>"
type: tech-debt
status: draft
priority: high | medium | low
severity: critical | major | minor
created: YYYY-MM-DD
updated: YYYY-MM-DD
author: "<author>"
areas:
  - <affected-area-1>
---

# <Tech Debt Title>

## Summary

Brief 2-3 sentence description of the technical debt and its impact.

## Current State

Describe the current implementation, including specific files, patterns, or code
that constitutes the debt.

### Affected Areas

- `src/routes/(app)/<route>/...` — Description of issue
- `src/lib/...` — Description of issue
- `src/components/...` — Description of issue

### Symptoms

How this debt manifests (bugs, DX friction, performance issues, visual glitches, etc.):

- Symptom 1
- Symptom 2

## Root Cause

What led to this debt (time pressure, evolving requirements, framework migration, etc.).

## Impact Assessment

### Developer Experience
How this debt affects development velocity and maintainability.

### User Experience
Any visible impact on users (slow rendering, broken layouts, inconsistent behavior).

### Risk of Inaction
What happens if this debt is not addressed.

## Proposed Resolution

### Approach

Step-by-step plan to resolve the debt.

### Code Changes

Describe the specific changes needed, referencing current file paths and patterns.

## Effort Estimate

- **Scope**: Small (< 1 day) | Medium (1-3 days) | Large (3+ days)
- **Files affected**: ~N files across M areas
- **Risk**: Low | Medium | High

## Testing Strategy

- What existing behavior must be preserved
- How to verify the debt is resolved
- Visual regression checks if UI-related

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## References

## Notes

### YYYY-MM-DD
- Initial draft
```

---

## Refactor Spec Template

```markdown
---
title: "<Refactor Title>"
type: refactor
status: draft
priority: high | medium | low
created: YYYY-MM-DD
updated: YYYY-MM-DD
author: "<author>"
areas:
  - <affected-area-1>
---

# <Refactor Title>

## Summary

Brief 2-3 sentence description of the refactoring and its motivation.

## Motivation

Why this refactoring is needed. Reference specific pain points, code smells,
or architectural improvements.

## Current Structure

Describe the current code organization, patterns, and relationships.

### Key Files

- `path/to/file.svelte` — Current role and issues
- `path/to/other.ts` — Current role and issues

### Current Flow

Describe how the current code flows (data flow, component hierarchy, etc.).

## Target Structure

Describe the desired code organization after refactoring.

### Key Changes

| Current | Target | Rationale |
|---------|--------|-----------|
| ... | ... | ... |

### Target Flow

Describe how the code will flow after refactoring.

## Migration Plan

### Phase 1: <Description>
- Step 1
- Step 2

### Phase 2: <Description>
- Step 3
- Step 4

### Incremental Strategy

Describe how this can be done incrementally to avoid a big-bang change.

## Behavioral Preservation

Confirm that external behavior remains unchanged:

- [ ] All existing routes remain accessible at same URLs
- [ ] All forms continue to submit correctly
- [ ] No visual regressions
- [ ] No changes to API integration
- [ ] TypeScript strict mode still passes

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| ... | ... | ... |

## Testing Strategy

- Visual regression checks
- Form submission testing
- Route navigation testing
- TypeScript strict mode compliance (`npm run check`)

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## References

## Notes

### YYYY-MM-DD
- Initial draft
```

---

## Update Spec Template

```markdown
---
title: "<Update Title>"
type: update
status: draft
priority: high | medium | low
created: YYYY-MM-DD
updated: YYYY-MM-DD
author: "<author>"
areas:
  - <affected-area-1>
figma: "<figma-url-if-available>"
---

# <Update Title>

## Summary

Brief 2-3 sentence description of the update and why it is needed.

## Current Behavior

Describe how the feature currently works, including specific routes,
components, and data flows.

### Affected Routes

| Route | Current Behavior |
|-------|-----------------|
| `/(app)/...` | ... |

### Current Data Flow

Describe the current data flow from load → component → form → action → API.

## Desired Behavior

Describe the updated behavior in detail.

### Updated Routes

| Route | Updated Behavior | Breaking? |
|-------|-----------------|-----------|
| `/(app)/...` | ... | Yes/No |

### Updated Data Flow

Describe the new data flow.

## Changes Required

### Routes / Pages
- New or modified routes and their load functions/actions

### Components
- Modified existing components or new components needed

### Schemas
- Modified Zod schemas for form validation

### API Integration
- Modified API calls, new endpoints, changed response handling

### Types
- New or modified types in `src/lib/api/types.ts`

## Backward Compatibility

### Breaking Changes
List any breaking changes (URL changes, removed form fields, etc.).

### Non-Breaking Changes
List changes that are backward compatible.

## Figma Design

Link to updated Figma frames (if available).

## Testing Strategy

- Modified behavior verification
- Regression testing for unchanged functionality
- Form validation edge cases

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Rollback Plan

How to revert if the update causes issues.

## References

## Notes

### YYYY-MM-DD
- Initial draft
```

---

## Design Document Template

The design document is the implementation blueprint. Every section must be concrete enough
that implementation can follow it directly without further design decisions.

```markdown
---
title: "<Design Title>"
type: design
status: draft
spec: "<friendly-name>"
created: YYYY-MM-DD
updated: YYYY-MM-DD
author: "<author>"
areas:
  - <affected-area-1>
  - <affected-area-2>
---

# <Design Title>

## Overview

Brief summary of what this design implements. Reference the parent spec:
`Spec: .claude/specs/<type>/<friendly-name>/spec.md`

## File Inventory

Complete list of every file to create or modify:

### New Files

| File Path | Purpose |
|-----------|---------|
| `src/routes/(app)/<route>/+page.svelte` | Page component |
| `src/routes/(app)/<route>/+page.server.ts` | Server load + actions |
| `src/routes/(app)/<route>/_components/XxxForm.svelte` | Form component |
| `src/lib/schemas/<name>.ts` | Zod form schema |
| `src/lib/api/<domain>.ts` | API client functions (if new domain) |
| `src/components/XxxWidget.svelte` | Reusable component (if needed) |

### Modified Files

| File Path | Change Description |
|-----------|--------------------|
| `src/lib/api/types.ts` | Add new DTOs and response types |
| `src/lib/api/<existing-domain>.ts` | Add new API functions |
| `src/components/app-sidebar.svelte` | Add navigation item (if new top-level page) |

## Route Structure

### `+page.server.ts` — Load Function

\```typescript
import type { PageServerLoad, Actions } from './$types.js';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { redirect, error } from '@sveltejs/kit';
import { ApiError } from '$lib/api/client.js';
import { requireAdmin } from '$lib/server/auth.js';
// ... domain-specific imports

export const load: PageServerLoad = async ({ locals }) => {
  // Auth check (if needed)
  requireAdmin(locals);
  const session = locals.session!;

  // Load data in parallel
  const [dataA, dataB] = await Promise.all([
    fetchDataA(session.idToken),
    fetchDataB(session.idToken),
  ]);

  // Initialize form (for form pages)
  const form = await superValidate(zod4(mySchema));

  return { form, dataA, dataB };
};
\```

### `+page.server.ts` — Actions

\```typescript
export const actions: Actions = {
  default: async ({ request, locals }) => {
    requireAdmin(locals);
    const session = locals.session!;

    const form = await superValidate(request, zod4(mySchema));
    if (!form.valid) {
      return message(form, 'Please check your input.', { status: 400 });
    }

    try {
      const result = await createXxx(session.idToken, {
        // Map form data to API request
      });
      redirect(303, `/target-route/${result.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) return message(form, err.body.error || 'Validation failed.', { status: 400 });
        if (err.status === 409) return message(form, 'Already exists.', { status: 409 });
        if (err.status === 403) return message(form, 'You lack permissions.', { status: 403 });
      }
      throw err;
    }
  }
};
\```

### `+page.svelte` — Page Component

\```svelte
<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';

  let { data } = $props();
</script>

<svelte:head>
  <title>Page Title | Akriva</title>
</svelte:head>

<div class="flex flex-col gap-6 p-7 px-8">
  <!-- Page Header -->
  <div class="flex items-center gap-3">
    <Button variant="ghost" size="icon" href="/parent-route">
      <ArrowLeft class="size-4" />
    </Button>
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold">Page Title</h1>
      <p class="text-sm text-muted-foreground">Description</p>
    </div>
  </div>

  <!-- Content -->
</div>
\```

## Zod Schema

\```typescript
// src/lib/schemas/<name>.ts
import { z } from 'zod/v4';

export const mySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  description: z.string().max(1000).optional(),
  type: z.enum(['option_a', 'option_b']),
  // ... fields matching form
}).superRefine((data, ctx) => {
  // Cross-field validation (if needed)
  if (data.startDate >= data.endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'End date must be after start date',
      path: ['endDate'],
    });
  }
});
```

## Form Component

\```svelte
<!-- src/routes/(app)/<route>/_components/XxxForm.svelte -->
<script lang="ts">
  import { superForm, type SuperValidated, type Infer } from 'sveltekit-superforms';
  import { zod4Client } from 'sveltekit-superforms/adapters';
  import { toast } from 'svelte-sonner';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Form from '$lib/components/ui/form/index.js';
  import * as Field from '$lib/components/ui/field/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
  import { mySchema } from '$lib/schemas/<name>.js';
  import type { XxxResponseDto } from '$lib/api/types.js';

  type FormData = Infer<typeof mySchema>;

  let {
    formData,
    mode = 'create',
    // ... additional props
  }: {
    formData: SuperValidated<FormData>;
    mode?: 'create' | 'edit';
  } = $props();

  // CRITICAL: Store full superForm object
  const superform = superForm(formData, {
    validators: zod4Client(mySchema),
    dataType: 'json',
    resetForm: false,
    onUpdated({ form }) {
      if (form.message) {
        if (form.valid) toast.success(form.message);
        else toast.error(form.message);
      }
    },
    onError({ result }) {
      toast.error(typeof result.error === 'string' ? result.error : 'An unexpected error occurred.');
    },
  });

  const { form, allErrors, enhance, message, submitting } = superform;
</script>

<Card.Root class="max-w-3xl">
  <Card.Content class="pt-6">
    {#if $message}
      <Alert variant="destructive" class="mb-4">
        <AlertDescription>{$message}</AlertDescription>
      </Alert>
    {/if}

    <form method="POST" use:enhance>
      <Field.Group>
        <Field.Set>
          <Field.Legend>Section Name</Field.Legend>
          <Field.Description>Helper text for this section</Field.Description>
          <Field.Group>
            <div class="grid grid-cols-2 gap-4">
              <Form.Field form={superform} name="name">
                <Form.Control>
                  {#snippet children({ props })}
                    <Form.Label>Name</Form.Label>
                    <Input {...props} bind:value={$form.name} />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>

              <Form.Field form={superform} name="type">
                <Form.Control>
                  {#snippet children({ props })}
                    <Form.Label>Type</Form.Label>
                    <Select.Root
                      type="single"
                      value={$form.type}
                      onValueChange={(val) => ($form.type = val)}
                    >
                      <Select.Trigger {...props}>
                        {$form.type || 'Select type'}
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="option_a">Option A</Select.Item>
                        <Select.Item value="option_b">Option B</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>
            </div>
          </Field.Group>
        </Field.Set>
        <Field.Separator />
      </Field.Group>

      <div class="flex justify-end gap-3 pt-4">
        <Button variant="outline" href="/parent-route">Cancel</Button>
        <Button type="submit" disabled={$submitting}>
          {mode === 'create' ? 'Create' : 'Update'}
        </Button>
      </div>
    </form>
  </Card.Content>
</Card.Root>
\```

## API Integration

### New Types (`src/lib/api/types.ts`)

\```typescript
// Request
export interface CreateXxxRequest {
  name: string;
  type: 'option_a' | 'option_b';
  // ... fields
}

// Response
export interface XxxResponseDto {
  id: string;
  name: string;
  type: string;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

// List response
export interface XxxListResponse {
  data: XxxResponseDto[];
  total: number;
}
\```

### API Functions (`src/lib/api/<domain>.ts`)

\```typescript
import { apiFetchAuth } from './client.js';
import type { CreateXxxRequest, XxxResponseDto, XxxListResponse } from './types.js';

export async function listXxx(token: string): Promise<XxxListResponse> {
  return apiFetchAuth<XxxListResponse>('/domain/xxx', token);
}

export async function createXxx(token: string, data: CreateXxxRequest): Promise<XxxResponseDto> {
  return apiFetchAuth<XxxResponseDto>('/domain/xxx', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getXxx(token: string, id: string): Promise<XxxResponseDto> {
  return apiFetchAuth<XxxResponseDto>(`/domain/xxx/${id}`, token);
}

export async function updateXxx(token: string, id: string, data: Partial<CreateXxxRequest>): Promise<XxxResponseDto> {
  return apiFetchAuth<XxxResponseDto>(`/domain/xxx/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
\```

## Component Design

### Props API

For each new component, specify the props interface:

\```typescript
// NewWidget.svelte props
{
  items: XxxResponseDto[];           // Data to display
  selected?: string;                  // Currently selected item ID
  onSelect?: (id: string) => void;   // Selection callback
  disabled?: boolean;                 // Disable interaction
}
\```

### State Management

Describe Svelte 5 runes usage:

\```svelte
<script lang="ts">
  let { items, selected = $bindable() } = $props();

  let searchQuery = $state('');
  let filteredItems = $derived(
    items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  let hasSelection = $derived(selected != null);
</script>
\```

## Layout

### Page Layout

Describe the Tailwind layout structure:

\```
┌─────────────────────────────────────┐
│ Page Header (h1 + description)      │
├─────────────────────────────────────┤
│ Card                                │
│ ┌─────────────────────────────────┐ │
│ │ Section 1 (Field.Set)           │ │
│ │ ┌──────────┬──────────┐        │ │
│ │ │ Field A  │ Field B  │        │ │
│ │ └──────────┴──────────┘        │ │
│ ├─────────────────────────────────┤ │
│ │ Section 2 (Field.Set)           │ │
│ │ ┌──────────┬──────────┐        │ │
│ │ │ Field C  │ Field D  │        │ │
│ │ └──────────┴──────────┘        │ │
│ ├─────────────────────────────────┤ │
│ │ Actions (Cancel | Submit)       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
\```

Layout classes:
- Page wrapper: `flex flex-col gap-6 p-7 px-8`
- Card content: `flex flex-col gap-5`
- Form grid: `grid grid-cols-2 gap-4`
- Action row: `flex justify-end gap-3 pt-4`

## Navigation

### Sidebar Entry (if new top-level page)

\```svelte
<!-- Addition to src/components/app-sidebar.svelte -->
{
  title: "Page Name",
  url: "/route",
  icon: IconName,
}
\```

### Breadcrumbs

\```svelte
<Breadcrumb.Root>
  <Breadcrumb.List>
    <Breadcrumb.Item><Breadcrumb.Link href="/parent">Parent</Breadcrumb.Link></Breadcrumb.Item>
    <Breadcrumb.Separator />
    <Breadcrumb.Item><Breadcrumb.Page>Current</Breadcrumb.Page></Breadcrumb.Item>
  </Breadcrumb.List>
</Breadcrumb.Root>
\```

## Error Handling

| API Status | Form Message | Behavior |
|------------|-------------|----------|
| 400 | `err.body.error` or 'Validation failed.' | Show in form alert |
| 403 | 'You lack permissions.' | Show in form alert |
| 409 | 'Already exists.' | Show in form alert |
| 5xx | Re-thrown | SvelteKit error page |

## Authorization

| Route | Required Role(s) | Guard |
|-------|-------------------|-------|
| `/(app)/route` | Any authenticated | `locals.session!` |
| `/(app)/route/new` | `tenant_admin` | `requireAdmin(locals)` |

## Figma Alignment

If Figma design provided, document:
- Figma frame references and their corresponding components
- Design token mappings (Figma colors → Tailwind utilities)
- Any deviations from Figma design and justification

## Implementation Order

Ordered sequence for implementing this design:

1. **Types**: Add DTOs to `src/lib/api/types.ts`
2. **API functions**: Add client functions to `src/lib/api/<domain>.ts`
3. **Schema**: Create Zod schema in `src/lib/schemas/<name>.ts`
4. **Server load + actions**: Create `+page.server.ts`
5. **Form component**: Create form in `_components/`
6. **Page component**: Create `+page.svelte`
7. **Navigation**: Add sidebar entry / breadcrumbs
8. **Custom components**: Build any new reusable components
9. **Visual review**: Verify against Figma design
10. **Type check**: Run `npm run check` for strict mode compliance

## Open Questions

List any unresolved design decisions:

- [ ] Question 1
- [ ] Question 2

## References

- Spec: `.claude/specs/<type>/<friendly-name>/spec.md`
- Related designs, PRs, commits

## Notes

### YYYY-MM-DD
- Initial design
```

---

## Review Document Template

```markdown
---
title: "Design Review: <Design Title>"
type: review
status: in-progress
design: "<friendly-name>"
reviewer: design-reviewer-agent
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Design Review: <Design Title>

**Design:** `.claude/specs/<type>/<friendly-name>/design.md`
**Spec:** `.claude/specs/<type>/<friendly-name>/spec.md`

## Review Summary

| Category | Status | Findings |
|----------|--------|----------|
| Architecture Compliance | PASS/FAIL/WARN | N findings |
| shadcn-svelte Patterns | PASS/FAIL/WARN | N findings |
| Superforms Pattern | PASS/FAIL/WARN | N findings |
| Design Token Usage | PASS/FAIL/WARN | N findings |
| API Integration | PASS/FAIL/WARN | N findings |
| Type Safety | PASS/FAIL/WARN | N findings |
| Accessibility | PASS/FAIL/WARN | N findings |
| Routing Conventions | PASS/FAIL/WARN | N findings |
| Component Design | PASS/FAIL/WARN | N findings |
| Spec Alignment | PASS/FAIL/WARN | N findings |

**Overall:** APPROVED / CHANGES REQUESTED

## Findings

### Blockers

#### [B-1] <Finding Title>
- **Category:** <category>
- **Location:** <file path or section>
- **Issue:** Description of the problem
- **Recommendation:** How to fix it
- **Resolution:** _(to be filled after fix)_

### Warnings

#### [W-1] <Finding Title>
- **Category:** <category>
- **Location:** <file path or section>
- **Issue:** Description of the concern
- **Recommendation:** Suggested improvement
- **Resolution:** _(to be filled after fix)_

### Suggestions

#### [S-1] <Finding Title>
- **Category:** <category>
- **Location:** <file path or section>
- **Suggestion:** Optional improvement idea

## Verification

After fixes are applied:

- [ ] All blockers resolved
- [ ] Warnings addressed or acknowledged
- [ ] Re-review passed

## Notes

### YYYY-MM-DD
- Initial review
```
