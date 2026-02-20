# Organizational Tree Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the static org tree mockup with a fully functional CRUD + drag-and-drop tree management page backed by the org-units API.

**Architecture:** Hybrid data flow — SvelteKit form actions for create/update/delete (consistent with existing settings pages), server proxy endpoint for client-side drag-and-drop move. Two-panel layout: tree on left, context-dependent details on right. Two Superforms instances (create + update) returned from the load function.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, Superforms + Zod 4, shadcn-svelte, Lucide icons, HTML5 Drag and Drop API, Sonner toasts.

**Design doc:** `docs/plans/2026-02-20-organizational-tree-design.md`
**API handoff:** `docs/handoffs/organizational-unit.md`

---

### Task 1: Add TypeScript Types for Org Units

**Files:**
- Modify: `src/lib/api/types.ts`

**Step 1: Add the org unit types at the end of `src/lib/api/types.ts`**

Add these types after the existing types (before the closing of the file):

```typescript
/** Org unit type */
export type OrgUnitType = 'subsidiary' | 'division' | 'facility';

/** Org unit status */
export type OrgUnitStatus = 'active' | 'inactive';

/** Single org unit (flat) — returned by GET/POST/PATCH/DELETE /v1/org-units */
export interface OrgUnitResponseDto {
	id: string;
	tenantId: string;
	parentId: string | null;
	name: string;
	type: OrgUnitType;
	code: string;
	description: string | null;
	equitySharePercentage: number | null;
	orderIndex: number;
	status: OrgUnitStatus;
	createdAt: string;
	updatedAt: string;
}

/** Tree node (recursive children) — returned by GET /v1/org-units?view=tree */
export interface OrgUnitTreeResponseDto extends OrgUnitResponseDto {
	children: OrgUnitTreeResponseDto[];
}

/** Tree list response — GET /v1/org-units?view=tree */
export interface OrgUnitTreeListResponseDto {
	view: 'tree';
	data: OrgUnitTreeResponseDto[];
	total: number;
}

/** Create org unit request — POST /v1/org-units */
export interface CreateOrgUnitRequest {
	parentId: string | null;
	name: string;
	type: OrgUnitType;
	code: string;
	description: string | null;
	equitySharePercentage: number | null;
}

/** Update org unit request — PATCH /v1/org-units/{id} */
export interface UpdateOrgUnitRequest {
	name?: string;
	description?: string | null;
	equitySharePercentage?: number | null;
	status?: OrgUnitStatus;
}

/** Move org unit request — PATCH /v1/org-units/{id}/move */
export interface MoveOrgUnitRequest {
	parentId: string | null;
	orderIndex?: number;
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to the new types.

**Step 3: Commit**

```bash
git add src/lib/api/types.ts
git commit -m "feat(org-units): add TypeScript types for org unit API"
```

---

### Task 2: Create API Client Functions

**Files:**
- Create: `src/lib/api/org-units.ts`

**Step 1: Create the API client module**

Create `src/lib/api/org-units.ts` following the exact pattern from `src/lib/api/tenant.ts`:

```typescript
import { apiFetchAuth } from './client.js';
import type {
	OrgUnitResponseDto,
	OrgUnitTreeListResponseDto,
	CreateOrgUnitRequest,
	UpdateOrgUnitRequest,
	MoveOrgUnitRequest
} from './types.js';

/** GET /v1/org-units?view=tree */
export async function getOrgUnitsTree(accessToken: string): Promise<OrgUnitTreeListResponseDto> {
	return apiFetchAuth<OrgUnitTreeListResponseDto>('/org-units?view=tree', accessToken);
}

/** POST /v1/org-units */
export async function createOrgUnit(
	accessToken: string,
	data: CreateOrgUnitRequest
): Promise<OrgUnitResponseDto> {
	return apiFetchAuth<OrgUnitResponseDto>('/org-units', accessToken, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

/** PATCH /v1/org-units/{id} */
export async function updateOrgUnit(
	accessToken: string,
	id: string,
	data: UpdateOrgUnitRequest
): Promise<OrgUnitResponseDto> {
	return apiFetchAuth<OrgUnitResponseDto>(`/org-units/${id}`, accessToken, {
		method: 'PATCH',
		body: JSON.stringify(data)
	});
}

/** DELETE /v1/org-units/{id} */
export async function deleteOrgUnit(
	accessToken: string,
	id: string
): Promise<OrgUnitResponseDto> {
	return apiFetchAuth<OrgUnitResponseDto>(`/org-units/${id}`, accessToken, {
		method: 'DELETE'
	});
}

/** PATCH /v1/org-units/{id}/move */
export async function moveOrgUnit(
	accessToken: string,
	id: string,
	data: MoveOrgUnitRequest
): Promise<OrgUnitResponseDto> {
	return apiFetchAuth<OrgUnitResponseDto>(`/org-units/${id}/move`, accessToken, {
		method: 'PATCH',
		body: JSON.stringify(data)
	});
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/lib/api/org-units.ts
git commit -m "feat(org-units): add API client functions for org unit endpoints"
```

---

### Task 3: Create Zod Schemas

**Files:**
- Create: `src/lib/schemas/org-unit.ts`

**Step 1: Create the schema file**

Create `src/lib/schemas/org-unit.ts`. Follow the pattern from `src/lib/schemas/tenant-settings.ts` — use `z.coerce.number()` for numeric fields and `.nullish().default(null)` for nullable optional fields:

```typescript
import { z } from 'zod';

/** Schema for creating an org unit — POST /v1/org-units */
export const createOrgUnitSchema = z.object({
	parentId: z.string().uuid().nullish().default(null),
	name: z.string().min(1, 'Name is required').max(200, 'Name must be at most 200 characters'),
	type: z.enum(['subsidiary', 'division', 'facility'], {
		required_error: 'Type is required'
	}),
	code: z
		.string()
		.min(1, 'Code is required')
		.max(50, 'Code must be at most 50 characters')
		.regex(
			/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
			'Code must be lowercase alphanumeric with dashes (e.g., "eu-west-hq")'
		),
	description: z.string().max(1000, 'Description must be at most 1000 characters').nullish().default(null),
	equitySharePercentage: z.coerce
		.number()
		.min(0, 'Equity share must be between 0 and 100')
		.max(100, 'Equity share must be between 0 and 100')
		.nullish()
		.default(null)
});

/** Schema for updating an org unit — PATCH /v1/org-units/{id} */
export const updateOrgUnitSchema = z.object({
	name: z.string().min(1, 'Name is required').max(200, 'Name must be at most 200 characters'),
	description: z.string().max(1000, 'Description must be at most 1000 characters').nullish().default(null),
	equitySharePercentage: z.coerce
		.number()
		.min(0, 'Equity share must be between 0 and 100')
		.max(100, 'Equity share must be between 0 and 100')
		.nullish()
		.default(null),
	status: z.enum(['active', 'inactive'])
});
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/lib/schemas/org-unit.ts
git commit -m "feat(org-units): add Zod schemas for create and update forms"
```

---

### Task 4: Create the Page Server (load + form actions)

**Files:**
- Create: `src/routes/(app)/settings/organizational-tree/+page.server.ts`

**Step 1: Create the server file**

This is the most complex server file — it has a load function that returns tree data + two Superforms instances, and three named form actions (create, update, delete). Follow the pattern from `src/routes/(app)/settings/company/+page.server.ts` but with named actions.

```typescript
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { getOrgUnitsTree, createOrgUnit, updateOrgUnit, deleteOrgUnit } from '$lib/api/org-units.js';
import { ApiError } from '$lib/api/client.js';
import { createOrgUnitSchema, updateOrgUnitSchema } from '$lib/schemas/org-unit.js';
import type { CreateOrgUnitRequest, UpdateOrgUnitRequest } from '$lib/api/types.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session!;
	const treeResponse = await getOrgUnitsTree(session.idToken);

	const createForm = await superValidate(zod4(createOrgUnitSchema));
	const updateForm = await superValidate(zod4(updateOrgUnitSchema));

	return {
		tree: treeResponse.data,
		total: treeResponse.total,
		createForm,
		updateForm
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const session = locals.session!;
		const form = await superValidate(request, zod4(createOrgUnitSchema));

		if (!form.valid) {
			return message(form, 'Please check your information and try again.', { status: 400 });
		}

		try {
			const payload: CreateOrgUnitRequest = {
				parentId: form.data.parentId ?? null,
				name: form.data.name,
				type: form.data.type,
				code: form.data.code,
				description: form.data.description ?? null,
				equitySharePercentage: form.data.equitySharePercentage ?? null
			};

			const created = await createOrgUnit(session.idToken, payload);
			return message(form, JSON.stringify({ success: true, id: created.id }));
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 400 && err.body.code === 'VALIDATION_FAILED') {
					return message(form, err.body.error || 'Validation failed.', { status: 400 });
				}
				if (err.status === 404) {
					return message(form, 'Parent org unit not found.', { status: 404 });
				}
				if (err.status === 409) {
					return message(form, 'This code is already in use.', { status: 409 });
				}
				if (err.status === 403) {
					return message(form, "You don't have permission to perform this action.", { status: 403 });
				}
			}
			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}
	},

	update: async ({ request, locals }) => {
		const session = locals.session!;
		const formData = await request.formData();
		const id = formData.get('id') as string;

		const form = await superValidate(formData, zod4(updateOrgUnitSchema));

		if (!form.valid) {
			return message(form, 'Please check your information and try again.', { status: 400 });
		}

		try {
			const payload: UpdateOrgUnitRequest = {
				name: form.data.name,
				description: form.data.description ?? null,
				equitySharePercentage: form.data.equitySharePercentage ?? null,
				status: form.data.status
			};

			await updateOrgUnit(session.idToken, id, payload);
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 400 && err.body.code === 'VALIDATION_FAILED') {
					return message(form, err.body.error || 'Validation failed.', { status: 400 });
				}
				if (err.status === 404) {
					return message(form, 'Org unit not found.', { status: 404 });
				}
				if (err.status === 403) {
					return message(form, "You don't have permission to perform this action.", { status: 403 });
				}
			}
			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		return message(form, 'Changes saved successfully.');
	},

	delete: async ({ request, locals }) => {
		const session = locals.session!;
		const formData = await request.formData();
		const id = formData.get('id') as string;

		// We don't need a Superforms instance for delete — just use a plain response
		try {
			await deleteOrgUnit(session.idToken, id);
			return { success: true };
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 409) {
					return {
						success: false,
						error: 'This node has active children. Move or delete them first.'
					};
				}
				if (err.status === 404) {
					return { success: false, error: 'Org unit not found.' };
				}
				if (err.status === 403) {
					return {
						success: false,
						error: "You don't have permission to perform this action."
					};
				}
			}
			return { success: false, error: 'Something went wrong. Please try again.' };
		}
	}
};
```

**Key patterns from existing code:**
- `locals.session!` — app layout guard ensures session exists (see `src/routes/(app)/settings/company/+page.server.ts:11`)
- `message(form, msg, { status })` — Superforms message helper for toast feedback
- `ApiError` instance check with `err.body.code` — error code matching (see `src/routes/(app)/settings/company/+page.server.ts:62`)
- The `delete` action uses plain return objects instead of Superforms since there's no form to validate
- The `create` action encodes the created node's ID in the message JSON string so the client can auto-select it
- The `update` action reads the org unit `id` from a hidden form field

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/routes/(app)/settings/organizational-tree/+page.server.ts
git commit -m "feat(org-units): add page server with load, create, update, delete actions"
```

---

### Task 5: Create the Move Server Proxy

**Files:**
- Create: `src/routes/(app)/settings/organizational-tree/move/+server.ts`

**Step 1: Create the move directory and server endpoint**

This is a simple JSON API proxy — the client-side drag-and-drop calls this endpoint, which forwards to the backend API with the JWT.

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { moveOrgUnit } from '$lib/api/org-units.js';
import { ApiError } from '$lib/api/client.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = locals.session!;
	const { id, parentId, orderIndex } = await request.json();

	try {
		const result = await moveOrgUnit(session.idToken, id, {
			parentId: parentId ?? null,
			orderIndex: orderIndex ?? 0
		});
		return json(result);
	} catch (err) {
		if (err instanceof ApiError) {
			return json({ error: err.body.error, code: err.body.code }, { status: err.status });
		}
		return json({ error: 'Something went wrong.' }, { status: 500 });
	}
};
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/routes/(app)/settings/organizational-tree/move/+server.ts
git commit -m "feat(org-units): add server proxy endpoint for drag-and-drop move"
```

---

### Task 6: Create the EmptyState Component

**Files:**
- Create: `src/routes/(app)/settings/organizational-tree/_components/EmptyState.svelte`

**Step 1: Create the _components directory and EmptyState component**

```svelte
<script lang="ts">
  import TreePine from "@lucide/svelte/icons/tree-pine";
</script>

<div class="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
  <TreePine class="size-12 text-muted-foreground" />
  <div class="flex flex-col gap-1">
    <h2 class="text-lg font-semibold text-muted-foreground">No node selected</h2>
    <p class="text-sm text-muted-foreground max-w-sm">
      Select a node from the tree to view its details, or click Add to create a
      new organizational unit.
    </p>
  </div>
</div>
```

**Step 2: Commit**

```bash
git add src/routes/(app)/settings/organizational-tree/_components/EmptyState.svelte
git commit -m "feat(org-units): add EmptyState component for details panel"
```

---

### Task 7: Create the DeleteDialog Component

**Files:**
- Create: `src/routes/(app)/settings/organizational-tree/_components/DeleteDialog.svelte`

**Step 1: Create the delete confirmation dialog**

This uses shadcn Dialog (`$lib/components/ui/dialog/index.js`) and submits a hidden form to the `?/delete` action.

```svelte
<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import TriangleAlert from "@lucide/svelte/icons/triangle-alert";

  let {
    open = $bindable(false),
    nodeId,
    nodeName,
    onDeleted,
  }: {
    open: boolean;
    nodeId: string;
    nodeName: string;
    onDeleted: () => void;
  } = $props();

  let deleting = $state(false);

  async function handleDelete() {
    deleting = true;
    const formData = new FormData();
    formData.set("id", nodeId);

    const response = await fetch("?/delete", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    deleting = false;

    // SvelteKit form action responses are wrapped in a data array
    const data = result?.data?.[0] ?? result;

    if (data?.success) {
      open = false;
      onDeleted();
    } else {
      // Error is handled by the parent via toast
      const { toast } = await import("svelte-sonner");
      toast.error(data?.error || "Failed to delete org unit.");
      open = false;
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <TriangleAlert class="size-5 text-destructive" />
        Delete Organizational Unit
      </Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete <strong>{nodeName}</strong>? This action
        cannot be undone. The node will be removed from the organizational tree.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (open = false)} disabled={deleting}>
        Cancel
      </Button>
      <Button variant="destructive" onclick={handleDelete} disabled={deleting}>
        {deleting ? "Deleting..." : "Delete"}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
```

**Notes:**
- The delete action doesn't use Superforms — it's a plain fetch to the `?/delete` named action
- On success, calls `onDeleted` callback so the parent can clear selection and refetch
- On error (e.g., 409 children exist), shows a toast with the error message

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/routes/(app)/settings/organizational-tree/_components/DeleteDialog.svelte
git commit -m "feat(org-units): add DeleteDialog confirmation component"
```

---

### Task 8: Create the OrgNodeForm Component

**Files:**
- Create: `src/routes/(app)/settings/organizational-tree/_components/OrgNodeForm.svelte`

**Step 1: Create the form component**

This is the largest component. It handles both create and edit modes using separate Superforms instances. Follow the patterns from `src/routes/(app)/settings/company/+page.svelte` and `src/routes/(app)/settings/company/_components/CompanyIdentificationSection.svelte`.

```svelte
<script lang="ts">
  import { superForm } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import { toast } from "svelte-sonner";
  import { invalidateAll } from "$app/navigation";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import TriangleAlert from "@lucide/svelte/icons/triangle-alert";
  import {
    createOrgUnitSchema,
    updateOrgUnitSchema,
  } from "$lib/schemas/org-unit";
  import DeleteDialog from "./DeleteDialog.svelte";
  import type { OrgUnitTreeResponseDto } from "$lib/api/types";

  let {
    mode,
    node = null,
    parentId = null,
    createFormData,
    updateFormData,
    allNodes,
    onCreated,
    onDeleted,
    onCancel,
  }: {
    mode: "create" | "edit";
    node: OrgUnitTreeResponseDto | null;
    parentId: string | null;
    createFormData: any;
    updateFormData: any;
    allNodes: { id: string; name: string }[];
    onCreated: (id: string) => void;
    onDeleted: () => void;
    onCancel: () => void;
  } = $props();

  // --- Create form ---
  const createSuperform = superForm(createFormData, {
    id: "create-org-unit",
    validators: zod4Client(createOrgUnitSchema),
    dataType: "json",
    resetForm: true,
    onUpdated({ form }) {
      if (form.message) {
        if (form.valid) {
          try {
            const parsed = JSON.parse(form.message);
            if (parsed.success && parsed.id) {
              toast.success("Organizational unit created successfully.");
              invalidateAll().then(() => onCreated(parsed.id));
              return;
            }
          } catch {
            // Not JSON — treat as plain message
          }
          toast.success(form.message);
        } else {
          toast.error(form.message);
        }
      }
    },
    onError({ result }) {
      const msg =
        typeof result.error === "string"
          ? result.error
          : "An unexpected error occurred.";
      toast.error(msg);
    },
  });
  const {
    form: createForm,
    enhance: createEnhance,
    submitting: createSubmitting,
  } = createSuperform;

  // Set parentId when entering create mode
  $effect(() => {
    if (mode === "create") {
      $createForm.parentId = parentId;
    }
  });

  // --- Update form ---
  const updateSuperform = superForm(updateFormData, {
    id: "update-org-unit",
    validators: zod4Client(updateOrgUnitSchema),
    dataType: "json",
    resetForm: false,
    onUpdated({ form }) {
      if (form.message) {
        if (form.valid) {
          toast.success(form.message);
          invalidateAll();
        } else {
          toast.error(form.message);
        }
      }
    },
    onError({ result }) {
      const msg =
        typeof result.error === "string"
          ? result.error
          : "An unexpected error occurred.";
      toast.error(msg);
    },
  });
  const {
    form: updateForm,
    enhance: updateEnhance,
    submitting: updateSubmitting,
  } = updateSuperform;

  // Populate update form when node changes
  $effect(() => {
    if (mode === "edit" && node) {
      $updateForm.name = node.name;
      $updateForm.description = node.description;
      $updateForm.equitySharePercentage = node.equitySharePercentage;
      $updateForm.status = node.status;
    }
  });

  // Delete dialog state
  let deleteDialogOpen = $state(false);

  // Type display labels
  const typeLabels: Record<string, string> = {
    subsidiary: "Subsidiary",
    division: "Division",
    facility: "Facility",
  };
</script>

{#if mode === "create"}
  <!-- CREATE MODE -->
  <h1 class="text-xl font-semibold">New Organizational Unit</h1>

  <form method="POST" action="?/create" use:createEnhance>
    <div class="flex flex-col gap-6 mt-4">
      <Card.Root>
        <Card.Content class="pt-6">
          <div class="flex flex-col gap-5">
            <!-- Parent -->
            <Form.Field form={createSuperform} name="parentId">
              <Form.Control>
                {#snippet children({ props })}
                  <Form.Label>Parent</Form.Label>
                  <Select.Root
                    type="single"
                    value={$createForm.parentId ?? "__root__"}
                    onValueChange={(val) => {
                      $createForm.parentId =
                        val === "__root__" ? null : (val ?? null);
                    }}
                  >
                    <Select.Trigger {...props} class="w-full">
                      {$createForm.parentId
                        ? (allNodes.find((n) => n.id === $createForm.parentId)
                            ?.name ?? "Unknown")
                        : "None (root node)"}
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="__root__"
                        >None (root node)</Select.Item
                      >
                      {#each allNodes as orgNode}
                        <Select.Item value={orgNode.id}
                          >{orgNode.name}</Select.Item
                        >
                      {/each}
                    </Select.Content>
                  </Select.Root>
                {/snippet}
              </Form.Control>
              <Form.FieldErrors />
            </Form.Field>

            <div class="grid grid-cols-2 gap-4">
              <!-- Name -->
              <Form.Field form={createSuperform} name="name">
                <Form.Control>
                  {#snippet children({ props })}
                    <Form.Label>Name</Form.Label>
                    <Input
                      {...props}
                      placeholder="e.g., Chicago HQ"
                      bind:value={$createForm.name}
                    />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>

              <!-- Type -->
              <Form.Field form={createSuperform} name="type">
                <Form.Control>
                  {#snippet children({ props })}
                    <Form.Label>Type</Form.Label>
                    <Select.Root
                      type="single"
                      value={$createForm.type}
                      onValueChange={(val) => {
                        if (val) $createForm.type = val as any;
                      }}
                    >
                      <Select.Trigger {...props} class="w-full">
                        {$createForm.type
                          ? typeLabels[$createForm.type]
                          : "Select type..."}
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="subsidiary"
                          >Subsidiary</Select.Item
                        >
                        <Select.Item value="division">Division</Select.Item>
                        <Select.Item value="facility">Facility</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>
            </div>

            <!-- Code -->
            <Form.Field form={createSuperform} name="code">
              <Form.Control>
                {#snippet children({ props })}
                  <Form.Label>Code</Form.Label>
                  <Input
                    {...props}
                    placeholder="e.g., eu-west-hq"
                    bind:value={$createForm.code}
                  />
                {/snippet}
              </Form.Control>
              <Form.Description>
                Unique identifier: lowercase letters, numbers, and dashes
              </Form.Description>
              <Form.FieldErrors />
            </Form.Field>

            <!-- Description -->
            <Form.Field form={createSuperform} name="description">
              <Form.Control>
                {#snippet children({ props })}
                  <Form.Label>Description</Form.Label>
                  <Textarea
                    {...props}
                    placeholder="Optional description..."
                    rows={3}
                    value={$createForm.description ?? ""}
                    oninput={(e) => {
                      const val = (e.target as HTMLTextAreaElement).value;
                      $createForm.description = val || null;
                    }}
                  />
                {/snippet}
              </Form.Control>
              <Form.FieldErrors />
            </Form.Field>

            <!-- Equity Share -->
            <Form.Field form={createSuperform} name="equitySharePercentage">
              <Form.Control>
                {#snippet children({ props })}
                  <Form.Label>Equity Share (%)</Form.Label>
                  <div class="flex items-center gap-2">
                    <Input
                      {...props}
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      placeholder="e.g., 100"
                      class="w-[150px]"
                      value={$createForm.equitySharePercentage ?? ""}
                      oninput={(e) => {
                        const val = (e.target as HTMLInputElement).value;
                        $createForm.equitySharePercentage = val
                          ? Number(val)
                          : null;
                      }}
                    />
                    <span class="text-sm text-muted-foreground">%</span>
                  </div>
                {/snippet}
              </Form.Control>
              <Form.Description>
                Used for equity-based consolidation. Leave empty if not
                applicable.
              </Form.Description>
              <Form.FieldErrors />
            </Form.Field>
          </div>
        </Card.Content>
      </Card.Root>

      <div class="flex gap-3 justify-end">
        <Button variant="outline" type="button" onclick={onCancel}>
          Cancel
        </Button>
        <Form.Button disabled={$createSubmitting}>
          {$createSubmitting ? "Creating..." : "Create"}
        </Form.Button>
      </div>
    </div>
  </form>
{:else if mode === "edit" && node}
  <!-- EDIT MODE -->
  <div class="flex items-center gap-3">
    <h1 class="text-xl font-semibold">{node.name}</h1>
    <Badge variant="secondary">{typeLabels[node.type]}</Badge>
  </div>

  <form method="POST" action="?/update" use:updateEnhance>
    <input type="hidden" name="id" value={node.id} />
    <div class="flex flex-col gap-6 mt-4">
      <Card.Root>
        <Card.Content class="pt-6">
          <div class="flex flex-col gap-5">
            <div class="grid grid-cols-2 gap-4">
              <!-- Name -->
              <Form.Field form={updateSuperform} name="name">
                <Form.Control>
                  {#snippet children({ props })}
                    <Form.Label>Name</Form.Label>
                    <Input {...props} bind:value={$updateForm.name} />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>

              <!-- Code (read-only) -->
              <div class="flex flex-col gap-1.5">
                <Label>Code</Label>
                <Input value={node.code} disabled />
                <p class="text-xs text-muted-foreground">
                  Immutable after creation
                </p>
              </div>
            </div>

            <!-- Description -->
            <Form.Field form={updateSuperform} name="description">
              <Form.Control>
                {#snippet children({ props })}
                  <Form.Label>Description</Form.Label>
                  <Textarea
                    {...props}
                    rows={3}
                    value={$updateForm.description ?? ""}
                    oninput={(e) => {
                      const val = (e.target as HTMLTextAreaElement).value;
                      $updateForm.description = val || null;
                    }}
                  />
                {/snippet}
              </Form.Control>
              <Form.FieldErrors />
            </Form.Field>

            <!-- Equity Share -->
            <Form.Field form={updateSuperform} name="equitySharePercentage">
              <Form.Control>
                {#snippet children({ props })}
                  <Form.Label>Equity Share (%)</Form.Label>
                  <div class="flex items-center gap-2">
                    <Input
                      {...props}
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      class="w-[150px]"
                      value={$updateForm.equitySharePercentage ?? ""}
                      oninput={(e) => {
                        const val = (e.target as HTMLInputElement).value;
                        $updateForm.equitySharePercentage = val
                          ? Number(val)
                          : null;
                      }}
                    />
                    <span class="text-sm text-muted-foreground">%</span>
                  </div>
                {/snippet}
              </Form.Control>
              <Form.FieldErrors />
            </Form.Field>

            <Separator />

            <!-- Status -->
            <Form.Field form={updateSuperform} name="status">
              <Form.Control>
                {#snippet children({ props })}
                  <div class="flex flex-col gap-2">
                    <Form.Label>Status</Form.Label>
                    <div class="flex gap-3 items-center">
                      <span class="text-sm text-muted-foreground">
                        Inactive
                      </span>
                      <Switch
                        {...props}
                        checked={$updateForm.status === "active"}
                        onCheckedChange={(checked) => {
                          $updateForm.status = checked ? "active" : "inactive";
                        }}
                      />
                      <span class="text-sm font-semibold">Active</span>
                    </div>
                    <p class="text-xs text-muted-foreground">
                      Active nodes are included in emissions calculations
                    </p>
                  </div>
                {/snippet}
              </Form.Control>
            </Form.Field>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Danger Zone -->
      <Card.Root class="border-destructive/50">
        <Card.Content class="pt-6">
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-2">
              <TriangleAlert class="size-5 text-destructive" />
              <span class="text-lg font-semibold text-destructive">
                Danger Zone
              </span>
            </div>
            <div class="flex justify-between items-center">
              <div class="flex flex-col gap-1">
                <span class="font-semibold">Delete this node</span>
                <span class="text-xs text-muted-foreground">
                  Remove {node.name} from the organizational tree
                </span>
              </div>
              <Button
                variant="destructive"
                type="button"
                onclick={() => (deleteDialogOpen = true)}
              >
                <Trash2 class="size-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <div class="flex gap-3 justify-end">
        <Form.Button disabled={$updateSubmitting}>
          {$updateSubmitting ? "Saving..." : "Save Changes"}
        </Form.Button>
      </div>
    </div>
  </form>

  <DeleteDialog
    bind:open={deleteDialogOpen}
    nodeId={node.id}
    nodeName={node.name}
    {onDeleted}
  />
{/if}
```

**Key patterns referenced:**
- Superforms setup: `src/routes/(app)/settings/company/+page.svelte:20-41`
- Form.Field + Form.Control + snippet: `src/routes/(app)/settings/company/_components/CompanyIdentificationSection.svelte:25-37`
- Select with onValueChange: same pattern as existing SectorSelect usage
- Nullable field input pattern: `value={$form.field ?? ""}` + `oninput` handler (see MEMORY.md)
- Hidden input for the `id` on the update form: `<input type="hidden" name="id" value={node.id} />`

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/routes/(app)/settings/organizational-tree/_components/OrgNodeForm.svelte
git commit -m "feat(org-units): add OrgNodeForm component with create and edit modes"
```

---

### Task 9: Create the OrgTree Component

**Files:**
- Create: `src/routes/(app)/settings/organizational-tree/_components/OrgTree.svelte`

**Step 1: Create the tree panel component**

This evolves the existing recursive tree snippet from the mockup (`src/routes/(app)/settings/organizational-tree/+page.svelte:99-131`) and adds drag-and-drop.

```svelte
<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { toast } from "svelte-sonner";
  import { invalidateAll } from "$app/navigation";
  import Building2 from "@lucide/svelte/icons/building-2";
  import Building from "@lucide/svelte/icons/building";
  import Warehouse from "@lucide/svelte/icons/warehouse";
  import Plus from "@lucide/svelte/icons/plus";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import type { Component } from "svelte";
  import type { OrgUnitTreeResponseDto } from "$lib/api/types";

  let {
    tree,
    selectedId = null,
    onSelect,
    onAddRoot,
    onAddChild,
  }: {
    tree: OrgUnitTreeResponseDto[];
    selectedId: string | null;
    onSelect: (node: OrgUnitTreeResponseDto) => void;
    onAddRoot: () => void;
    onAddChild: (parentId: string) => void;
  } = $props();

  // Type icon mapping
  const typeIcons: Record<string, Component> = {
    subsidiary: Building2,
    division: Building,
    facility: Warehouse,
  };

  // Track expanded state by node ID
  let expanded = $state<Record<string, boolean>>({});

  // Auto-expand root nodes on first render
  $effect(() => {
    for (const node of tree) {
      if (!(node.id in expanded)) {
        expanded[node.id] = true;
      }
    }
  });

  function toggleExpand(nodeId: string, e: Event) {
    e.stopPropagation();
    expanded[nodeId] = !expanded[nodeId];
  }

  // --- Drag and Drop ---
  let draggedNodeId = $state<string | null>(null);
  let dropTargetId = $state<string | null>(null);

  // Collect all descendant IDs for a node (to prevent dropping onto self/descendants)
  function getDescendantIds(
    nodes: OrgUnitTreeResponseDto[],
    targetId: string,
  ): Set<string> {
    const result = new Set<string>();
    function collect(children: OrgUnitTreeResponseDto[]) {
      for (const child of children) {
        result.add(child.id);
        if (child.children.length > 0) collect(child.children);
      }
    }
    // Find the target node in the tree
    function find(
      nodes: OrgUnitTreeResponseDto[],
    ): OrgUnitTreeResponseDto | null {
      for (const n of nodes) {
        if (n.id === targetId) return n;
        const found = find(n.children);
        if (found) return found;
      }
      return null;
    }
    const node = find(nodes);
    if (node) collect(node.children);
    return result;
  }

  function handleDragStart(nodeId: string, e: DragEvent) {
    draggedNodeId = nodeId;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", nodeId);
    }
  }

  function handleDragOver(nodeId: string, e: DragEvent) {
    e.preventDefault();
    if (!draggedNodeId || draggedNodeId === nodeId) return;

    // Prevent dropping onto self or descendants
    const descendants = getDescendantIds(tree, draggedNodeId);
    if (descendants.has(nodeId)) return;

    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    dropTargetId = nodeId;
  }

  function handleDragLeave() {
    dropTargetId = null;
  }

  function handleDragEnd() {
    draggedNodeId = null;
    dropTargetId = null;
  }

  async function handleDrop(targetParentId: string | null, e: DragEvent) {
    e.preventDefault();
    dropTargetId = null;

    if (!draggedNodeId || draggedNodeId === targetParentId) return;

    // Prevent dropping onto descendants
    if (targetParentId) {
      const descendants = getDescendantIds(tree, draggedNodeId);
      if (descendants.has(targetParentId)) {
        toast.error("Cannot move a node under its own descendant.");
        draggedNodeId = null;
        return;
      }
    }

    try {
      const response = await fetch("/settings/organizational-tree/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draggedNodeId,
          parentId: targetParentId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to move node.");
      } else {
        toast.success("Node moved successfully.");
        await invalidateAll();
      }
    } catch {
      toast.error("Failed to move node.");
    }

    draggedNodeId = null;
  }
</script>

<div class="tree-panel flex flex-col gap-3">
  <div class="flex justify-between items-center">
    <span class="text-lg font-semibold">Organization</span>
    <Button size="sm" onclick={onAddRoot}>
      <Plus class="size-4 mr-1" />
      Add
    </Button>
  </div>

  <Separator />

  {#if tree.length === 0}
    <div class="flex flex-col items-center gap-2 py-8 text-center">
      <p class="text-sm text-muted-foreground">No organizational units yet.</p>
      <Button size="sm" variant="outline" onclick={onAddRoot}>
        Create your first unit
      </Button>
    </div>
  {:else}
    <div
      class="flex flex-col"
      role="tree"
      ondragover={(e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      }}
      ondrop={(e) => handleDrop(null, e)}
    >
      {#snippet renderTree(nodes: OrgUnitTreeResponseDto[], depth: number)}
        {#each nodes as node}
          {@const Icon = typeIcons[node.type] ?? Building2}
          {@const isExpanded = expanded[node.id] ?? false}
          {@const hasChildren = node.children.length > 0}
          {@const isSelected = node.id === selectedId}
          {@const isDropTarget = node.id === dropTargetId}
          <div role="treeitem">
            <div class="relative group">
              <button
                type="button"
                class="tree-node"
                class:selected={isSelected}
                class:drop-target={isDropTarget}
                style:padding-left="{depth * 20 + 8}px"
                draggable="true"
                ondragstart={(e) => handleDragStart(node.id, e)}
                ondragover={(e) => handleDragOver(node.id, e)}
                ondragleave={handleDragLeave}
                ondragend={handleDragEnd}
                ondrop={(e) => handleDrop(node.id, e)}
                onclick={() => onSelect(node)}
              >
                {#if hasChildren}
                  <button
                    type="button"
                    class="shrink-0 p-0 border-0 bg-transparent cursor-pointer"
                    onclick={(e) => toggleExpand(node.id, e)}
                  >
                    {#if isExpanded}
                      <ChevronDown
                        class="size-4 text-muted-foreground"
                      />
                    {:else}
                      <ChevronRight
                        class="size-4 text-muted-foreground"
                      />
                    {/if}
                  </button>
                {:else}
                  <span class="w-4 shrink-0"></span>
                {/if}
                <Icon class="size-4 shrink-0" />
                <span class="truncate">{node.name}</span>
              </button>
              <!-- Hover add-child button -->
              <button
                type="button"
                class="add-child-btn"
                title="Add child"
                onclick={(e) => {
                  e.stopPropagation();
                  onAddChild(node.id);
                }}
              >
                <Plus class="size-3" />
              </button>
            </div>
            {#if hasChildren && isExpanded}
              {@render renderTree(node.children, depth + 1)}
            {/if}
          </div>
        {/each}
      {/snippet}
      {@render renderTree(tree, 0)}
    </div>
  {/if}
</div>

<style>
  .tree-panel {
    width: 300px;
    flex-shrink: 0;
    background: var(--card);
    border-right: 1px solid var(--border);
    padding: 24px;
    overflow-y: auto;
  }

  .tree-node {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 4px 8px;
    border-radius: 4px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 14px;
    color: var(--muted-foreground);
    text-align: left;
    transition: background-color 0.15s;
  }

  .tree-node:hover {
    background: var(--secondary);
  }

  .tree-node.selected {
    color: var(--primary);
    font-weight: 600;
    background: transparent;
  }

  .tree-node.drop-target {
    background: hsl(var(--primary) / 0.1);
    outline: 2px dashed hsl(var(--primary) / 0.4);
    outline-offset: -2px;
  }

  .add-child-btn {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    display: none;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--muted-foreground);
    cursor: pointer;
    padding: 0;
  }

  .add-child-btn:hover {
    background: var(--secondary);
    color: var(--foreground);
  }

  .group:hover .add-child-btn {
    display: flex;
  }
</style>
```

**Key patterns referenced:**
- Recursive snippet from existing mockup: `src/routes/(app)/settings/organizational-tree/+page.svelte:99-131`
- Tree node styling from existing mockup: `src/routes/(app)/settings/organizational-tree/+page.svelte:410-433`
- HTML5 DnD: standard `draggable`, `ondragstart`, `ondragover`, `ondrop`, `ondragend`
- Move calls the server proxy at `/settings/organizational-tree/move`
- Expanded state tracked as `Record<string, boolean>` instead of mutating tree data

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/routes/(app)/settings/organizational-tree/_components/OrgTree.svelte
git commit -m "feat(org-units): add OrgTree component with drag-and-drop reparenting"
```

---

### Task 10: Rewrite the Page Orchestrator

**Files:**
- Modify: `src/routes/(app)/settings/organizational-tree/+page.svelte`

**Step 1: Replace the entire file content**

This replaces the static mockup with the real orchestrator that wires up the tree panel, details panel, and state management.

```svelte
<script lang="ts">
  import OrgTree from "./_components/OrgTree.svelte";
  import OrgNodeForm from "./_components/OrgNodeForm.svelte";
  import EmptyState from "./_components/EmptyState.svelte";
  import type { OrgUnitTreeResponseDto } from "$lib/api/types";

  let { data } = $props();

  // Panel state
  let mode = $state<"empty" | "create" | "edit">("empty");
  let selectedNode = $state<OrgUnitTreeResponseDto | null>(null);
  let createParentId = $state<string | null>(null);

  // Flatten tree into a list of { id, name } for the parent dropdown in create form
  function flattenTree(
    nodes: OrgUnitTreeResponseDto[],
  ): { id: string; name: string }[] {
    const result: { id: string; name: string }[] = [];
    function walk(nodes: OrgUnitTreeResponseDto[]) {
      for (const node of nodes) {
        result.push({ id: node.id, name: node.name });
        if (node.children.length > 0) walk(node.children);
      }
    }
    walk(nodes);
    return result;
  }

  let allNodes = $derived(flattenTree(data.tree));

  // Find a node by ID in the tree (needed to re-select after invalidateAll)
  function findNode(
    nodes: OrgUnitTreeResponseDto[],
    id: string,
  ): OrgUnitTreeResponseDto | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = findNode(node.children, id);
      if (found) return found;
    }
    return null;
  }

  // Re-sync selectedNode when tree data changes (after invalidateAll)
  $effect(() => {
    if (selectedNode && mode === "edit") {
      const updated = findNode(data.tree, selectedNode.id);
      if (updated) {
        selectedNode = updated;
      } else {
        // Node was deleted or no longer exists
        selectedNode = null;
        mode = "empty";
      }
    }
  });

  function handleSelect(node: OrgUnitTreeResponseDto) {
    selectedNode = node;
    mode = "edit";
  }

  function handleAddRoot() {
    createParentId = null;
    selectedNode = null;
    mode = "create";
  }

  function handleAddChild(parentId: string) {
    createParentId = parentId;
    selectedNode = null;
    mode = "create";
  }

  function handleCreated(id: string) {
    const newNode = findNode(data.tree, id);
    if (newNode) {
      selectedNode = newNode;
      mode = "edit";
    } else {
      mode = "empty";
    }
  }

  function handleDeleted() {
    selectedNode = null;
    mode = "empty";
  }

  function handleCancel() {
    mode = selectedNode ? "edit" : "empty";
  }
</script>

<svelte:head>
  <title>Organizational Tree | Akriva</title>
</svelte:head>

<div class="org-layout">
  <OrgTree
    tree={data.tree}
    selectedId={selectedNode?.id ?? null}
    onSelect={handleSelect}
    onAddRoot={handleAddRoot}
    onAddChild={handleAddChild}
  />

  <div class="details-panel">
    {#if mode === "empty"}
      <EmptyState />
    {:else if mode === "create"}
      <OrgNodeForm
        mode="create"
        node={null}
        parentId={createParentId}
        createFormData={data.createForm}
        updateFormData={data.updateForm}
        {allNodes}
        onCreated={handleCreated}
        onDeleted={handleDeleted}
        onCancel={handleCancel}
      />
    {:else if mode === "edit" && selectedNode}
      <OrgNodeForm
        mode="edit"
        node={selectedNode}
        parentId={null}
        createFormData={data.createForm}
        updateFormData={data.updateForm}
        {allNodes}
        onCreated={handleCreated}
        onDeleted={handleDeleted}
        onCancel={handleCancel}
      />
    {/if}
  </div>
</div>

<style>
  .org-layout {
    display: flex;
    height: 100%;
  }

  .details-panel {
    flex: 1;
    overflow-y: auto;
    padding: 24px 32px;
  }
</style>
```

**Key patterns:**
- `let { data } = $props()` — page data from `+page.server.ts` load function
- `$derived` for computed flat node list
- `$effect` for re-syncing selected node after tree data reload
- State machine: `mode` controls which panel content is shown
- All callbacks are functions that change `mode` and `selectedNode`

**Step 2: Verify the dev server starts without errors**

Run: `npx vite build 2>&1 | tail -20`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/routes/(app)/settings/organizational-tree/+page.svelte
git commit -m "feat(org-units): rewrite page as orchestrator wiring tree and details panels"
```

---

### Task 11: Manual Smoke Test

**No files to change — this is a verification task.**

**Step 1: Start the dev server**

Run: `npm run dev`

**Step 2: Test in the browser**

Navigate to `http://localhost:5173/settings/organizational-tree` and verify:

1. **Empty state**: If no org units exist, the tree panel shows "No organizational units yet" with a "Create your first unit" button. The details panel shows the EmptyState component.
2. **Create flow**: Click "Add" → details panel shows create form with Parent dropdown, Name, Type, Code, Description, Equity Share fields → fill in and submit → toast shows success → tree updates → new node is auto-selected.
3. **Edit flow**: Click a tree node → details panel shows edit form with Name (editable), Code (disabled), Description, Equity Share, Status toggle, and Danger Zone card.
4. **Update flow**: Change name → click "Save Changes" → toast shows success → tree reflects the updated name.
5. **Delete flow**: Click "Delete" in Danger Zone → confirmation dialog appears → confirm → toast shows success → tree updates → details panel returns to empty state.
6. **Drag and drop**: Drag a node onto another → node moves under the new parent → toast shows success → tree re-renders.
7. **Add child**: Hover a node → small "+" appears → click → create form opens with the parent pre-selected.
8. **Error handling**: Try creating a node with a duplicate code → error message appears.

**Step 3: Fix any issues found during smoke testing**

Address bugs iteratively — fix, verify, repeat.

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(org-units): address issues found during smoke testing"
```

---

### Task 12: Final Cleanup and Commit

**Step 1: Run TypeScript check**

Run: `npx tsc --noEmit --pretty`
Expected: No errors.

**Step 2: Run linter**

Run: `npx eslint src/routes/\(app\)/settings/organizational-tree/ src/lib/api/org-units.ts src/lib/schemas/org-unit.ts --fix`
Expected: No errors after fixing.

**Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit any lint/build fixes**

```bash
git add -A
git commit -m "chore(org-units): fix lint and build issues"
```
