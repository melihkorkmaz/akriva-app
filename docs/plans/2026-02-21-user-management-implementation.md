# User Management (Team Members) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Team Members page under Settings that lets tenant admins list users, change roles, manage org-unit assignments, and deactivate users — plus migrate the frontend from 3-role to 5-role system.

**Architecture:** Single page at `/settings/team-members/` with a TanStack data table and three action dialogs (Change Role, Manage Assignments, Deactivate). All mutations go through SvelteKit named form actions calling the backend API. The 5-role `TenantRole` type replaces the legacy `UserRole` everywhere.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, shadcn-svelte, TanStack Table, Superforms + Zod 4, svelte-sonner toasts

**Design doc:** `docs/plans/2026-02-21-user-management-design.md`
**API handoff:** `docs/handoffs/user-management.md`

---

## Task 1: Migrate Role System (Types & Auth)

**Files:**
- Modify: `src/lib/api/types.ts`
- Modify: `src/lib/server/auth.ts`

**Step 1: Update types.ts — replace UserRole with TenantRole and add user DTOs**

Replace the existing `UserRole` type and add the new DTOs at the end of the file:

```typescript
/** Valid tenant roles (lowest → highest privilege) */
export type TenantRole = 'viewer' | 'data_entry' | 'data_approver' | 'tenant_admin' | 'super_admin';

/** Display labels for tenant roles */
export const TENANT_ROLE_LABELS: Record<TenantRole, string> = {
	viewer: 'Viewer',
	data_entry: 'Data Entry',
	data_approver: 'Data Approver',
	tenant_admin: 'Admin',
	super_admin: 'Super Admin'
};
```

Replace the `UserRole` reference in `UserInfo`:

```typescript
export interface UserInfo {
	id: string;
	email: string;
	tenantId: string;
	role: TenantRole;
}
```

Add these new interfaces (from handoff doc):

```typescript
/** Returned by GET /v1/users/me */
export interface UserMeResponseDto {
	id: string;
	email: string;
	displayName: string | null;
	role: TenantRole;
	isActive: boolean;
	cognitoSub: string | null;
	createdAt: string;
	updatedAt: string;
}

/** Returned by all other user endpoints (list, update, delete) */
export interface UserResponseDto {
	id: string;
	email: string;
	displayName: string | null;
	role: TenantRole;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

/** Returned by GET /v1/users */
export interface UserListResponse {
	users: UserResponseDto[];
}

/** Returned by assignment endpoints */
export interface AssignmentResponseDto {
	id: string;
	orgUnitId: string;
	assignedBy: string;
	createdAt: string;
}
```

Remove the old `UserRole` type entirely. Update `JwtCustomClaims` to use `TenantRole`:

```typescript
export interface JwtCustomClaims {
	sub: string;
	email: string;
	given_name: string;
	family_name: string;
	'custom:tenant_id': string;
	'custom:user_id': string;
	'custom:tenant_role': TenantRole;
}
```

**Step 2: Update auth.ts — SessionUser and VALID_ROLES**

In `src/lib/server/auth.ts`:

Change the import:
```typescript
import type { AuthTokens, TenantRole } from '$lib/api/types.js';
```

Update `VALID_ROLES`:
```typescript
const VALID_ROLES: TenantRole[] = ['viewer', 'data_entry', 'data_approver', 'tenant_admin', 'super_admin'];
```

Update `SessionUser`:
```typescript
export interface SessionUser {
	id: string;
	email: string;
	tenantId: string;
	role: TenantRole;
	givenName: string;
	familyName: string;
}
```

Update `getSessionFromTokens` — the `role` cast changes to `role as TenantRole`.

**Step 3: Fix all TypeScript references to the old UserRole**

Search for any remaining `UserRole` imports/references and update them to `TenantRole`. Key files:
- `src/components/nav-user.svelte` — no role usage, just user name/email (no change needed)
- `src/components/app-sidebar.svelte` — imports `SessionUser` (type flows through, no change needed)

**Step 4: Verify the app compiles**

Run: `npx svelte-check --tsconfig ./tsconfig.json`
Expected: No errors related to `UserRole` or `TenantRole`.

**Step 5: Commit**

```bash
git add src/lib/api/types.ts src/lib/server/auth.ts
git commit -m "refactor: migrate from 3-role UserRole to 5-role TenantRole system"
```

---

## Task 2: Create Users API Module

**Files:**
- Create: `src/lib/api/users.ts`

**Step 1: Create the API wrapper file**

Follow the exact pattern from `src/lib/api/org-units.ts`:

```typescript
import { apiFetchAuth } from './client.js';
import type {
	UserMeResponseDto,
	UserResponseDto,
	UserListResponse,
	AssignmentResponseDto,
	TenantRole
} from './types.js';

/** Query params for GET /v1/users */
export interface FetchUsersParams {
	role?: TenantRole;
	search?: string;
	includeInactive?: boolean;
	limit?: number;
	offset?: number;
}

/** GET /v1/users/me */
export async function fetchCurrentUser(accessToken: string): Promise<UserMeResponseDto> {
	return apiFetchAuth<UserMeResponseDto>('/users/me', accessToken);
}

/** GET /v1/users */
export async function fetchUsers(
	accessToken: string,
	params?: FetchUsersParams
): Promise<UserListResponse> {
	const searchParams = new URLSearchParams();
	if (params?.role) searchParams.set('role', params.role);
	if (params?.search) searchParams.set('search', params.search);
	if (params?.includeInactive) searchParams.set('includeInactive', 'true');
	if (params?.limit) searchParams.set('limit', String(params.limit));
	if (params?.offset) searchParams.set('offset', String(params.offset));

	const query = searchParams.toString();
	return apiFetchAuth<UserListResponse>(`/users${query ? `?${query}` : ''}`, accessToken);
}

/** PATCH /v1/users/profile */
export async function updateProfile(
	accessToken: string,
	data: { displayName: string }
): Promise<UserResponseDto> {
	return apiFetchAuth<UserResponseDto>('/users/profile', accessToken, {
		method: 'PATCH',
		body: JSON.stringify(data)
	});
}

/** PATCH /v1/users/{userId}/role */
export async function updateUserRole(
	accessToken: string,
	userId: string,
	role: TenantRole
): Promise<UserResponseDto> {
	return apiFetchAuth<UserResponseDto>(`/users/${userId}/role`, accessToken, {
		method: 'PATCH',
		body: JSON.stringify({ role })
	});
}

/** DELETE /v1/users/{userId} — soft delete (deactivate) */
export async function deactivateUser(
	accessToken: string,
	userId: string
): Promise<UserResponseDto> {
	return apiFetchAuth<UserResponseDto>(`/users/${userId}`, accessToken, {
		method: 'DELETE'
	});
}

/** GET /v1/users/{userId}/assignments */
export async function fetchAssignments(
	accessToken: string,
	userId: string
): Promise<AssignmentResponseDto[]> {
	return apiFetchAuth<AssignmentResponseDto[]>(`/users/${userId}/assignments`, accessToken);
}

/** PUT /v1/users/{userId}/assignments — full replace */
export async function replaceAssignments(
	accessToken: string,
	userId: string,
	orgUnitIds: string[]
): Promise<AssignmentResponseDto[]> {
	return apiFetchAuth<AssignmentResponseDto[]>(`/users/${userId}/assignments`, accessToken, {
		method: 'PUT',
		body: JSON.stringify({ orgUnitIds })
	});
}

/** POST /v1/users/{userId}/assignments — add single */
export async function addAssignment(
	accessToken: string,
	userId: string,
	orgUnitId: string
): Promise<AssignmentResponseDto> {
	return apiFetchAuth<AssignmentResponseDto>(`/users/${userId}/assignments`, accessToken, {
		method: 'POST',
		body: JSON.stringify({ orgUnitId })
	});
}

/** DELETE /v1/users/{userId}/assignments/{orgUnitId} — remove single */
export async function removeAssignment(
	accessToken: string,
	userId: string,
	orgUnitId: string
): Promise<void> {
	await apiFetchAuth<void>(`/users/${userId}/assignments/${orgUnitId}`, accessToken, {
		method: 'DELETE'
	});
}
```

**Step 2: Verify compilation**

Run: `npx svelte-check --tsconfig ./tsconfig.json`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/lib/api/users.ts
git commit -m "feat: add users API module with all user management endpoints"
```

---

## Task 3: Create Zod Schemas

**Files:**
- Create: `src/lib/schemas/user-management.ts`

**Step 1: Create the schemas file**

Follow the pattern from `src/lib/schemas/tenant-settings.ts`:

```typescript
import { z } from 'zod';

const tenantRoleEnum = z.enum([
	'viewer',
	'data_entry',
	'data_approver',
	'tenant_admin',
	'super_admin'
]);

/** Schema for changing a user's role */
export const changeRoleSchema = z.object({
	userId: z.string().uuid('Invalid user ID'),
	role: tenantRoleEnum
});

/** Schema for updating org-unit assignments (full replace) */
export const updateAssignmentsSchema = z.object({
	userId: z.string().uuid('Invalid user ID'),
	orgUnitIds: z
		.array(z.string().uuid('Invalid org unit ID'))
		.max(100, 'Maximum 100 assignments allowed')
		.refine(
			(ids) => new Set(ids).size === ids.length,
			'Duplicate org unit IDs are not allowed'
		)
});

/** Schema for deactivating a user */
export const deactivateUserSchema = z.object({
	userId: z.string().uuid('Invalid user ID')
});
```

**Step 2: Commit**

```bash
git add src/lib/schemas/user-management.ts
git commit -m "feat: add Zod schemas for user management forms"
```

---

## Task 4: Create the Page Server (Load + Form Actions)

**Files:**
- Create: `src/routes/(app)/settings/team-members/+page.server.ts`

**Step 1: Create the server file**

Follow the exact pattern from `src/routes/(app)/settings/company/+page.server.ts`:

```typescript
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { fetchUsers, updateUserRole, deactivateUser, fetchAssignments, replaceAssignments } from '$lib/api/users.js';
import { getOrgUnitsTree } from '$lib/api/org-units.js';
import { ApiError } from '$lib/api/client.js';
import { changeRoleSchema, updateAssignmentsSchema, deactivateUserSchema } from '$lib/schemas/user-management.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals.session!;

	// Route guard: admin-only
	if (session.user.role !== 'tenant_admin' && session.user.role !== 'super_admin') {
		redirect(302, '/settings/company');
	}

	// Parse query params for search/filter
	const search = url.searchParams.get('search') || undefined;
	const role = url.searchParams.get('role') || undefined;
	const includeInactive = url.searchParams.get('includeInactive') === 'true';

	const [usersResponse, orgTree] = await Promise.all([
		fetchUsers(session.idToken, {
			search,
			role: role as any,
			includeInactive,
			limit: 200
		}),
		getOrgUnitsTree(session.idToken)
	]);

	const [changeRoleForm, deactivateForm, assignmentsForm] = await Promise.all([
		superValidate(zod4(changeRoleSchema)),
		superValidate(zod4(deactivateUserSchema)),
		superValidate(zod4(updateAssignmentsSchema))
	]);

	return {
		users: usersResponse.users,
		orgTree: orgTree.data,
		currentUserId: session.user.id,
		changeRoleForm,
		deactivateForm,
		assignmentsForm,
		filters: { search: search || '', role: role || '', includeInactive }
	};
};

export const actions: Actions = {
	changeRole: async ({ request, locals }) => {
		const session = locals.session!;
		const form = await superValidate(request, zod4(changeRoleSchema));

		if (!form.valid) {
			return message(form, 'Please select a valid role.', { status: 400 });
		}

		try {
			await updateUserRole(session.idToken, form.data.userId, form.data.role);
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 409) {
					return message(form, err.body.error || 'Cannot demote the last Super Admin.', { status: 409 });
				}
				if (err.status === 403) {
					return message(form, 'You do not have permission to change this role.', { status: 403 });
				}
				if (err.status === 404) {
					return message(form, 'User not found.', { status: 404 });
				}
			}
			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		return message(form, 'Role updated successfully.');
	},

	deactivate: async ({ request, locals }) => {
		const session = locals.session!;
		const form = await superValidate(request, zod4(deactivateUserSchema));

		if (!form.valid) {
			return message(form, 'Invalid request.', { status: 400 });
		}

		try {
			await deactivateUser(session.idToken, form.data.userId);
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 409) {
					return message(form, err.body.error || 'Cannot deactivate the last Super Admin.', { status: 409 });
				}
				if (err.status === 403) {
					return message(form, err.body.error || 'You cannot deactivate this user.', { status: 403 });
				}
				if (err.status === 404) {
					return message(form, 'User not found.', { status: 404 });
				}
			}
			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		return message(form, 'User deactivated successfully.');
	},

	updateAssignments: async ({ request, locals }) => {
		const session = locals.session!;
		const form = await superValidate(request, zod4(updateAssignmentsSchema));

		if (!form.valid) {
			return message(form, 'Invalid assignment data.', { status: 400 });
		}

		try {
			await replaceAssignments(session.idToken, form.data.userId, form.data.orgUnitIds);
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 400) {
					return message(form, err.body.error || 'Invalid assignment data.', { status: 400 });
				}
				if (err.status === 404) {
					return message(form, 'User not found.', { status: 404 });
				}
			}
			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		return message(form, 'Assignments updated successfully.');
	},

	fetchAssignments: async ({ request, locals }) => {
		const session = locals.session!;
		const formData = await request.formData();
		const userId = formData.get('userId') as string;

		try {
			const assignments = await fetchAssignments(session.idToken, userId);
			return { assignments };
		} catch (err) {
			if (err instanceof ApiError) {
				return { assignments: [], error: err.body.error };
			}
			return { assignments: [], error: 'Failed to load assignments.' };
		}
	}
};
```

**Step 2: Verify compilation**

Run: `npx svelte-check --tsconfig ./tsconfig.json`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/routes/(app)/settings/team-members/+page.server.ts
git commit -m "feat: add team members page server with load and form actions"
```

---

## Task 5: Create Column Definitions

**Files:**
- Create: `src/routes/(app)/settings/team-members/_components/columns.ts`

**Step 1: Create the columns file**

Follow the exact pattern from `src/routes/(app)/scope-1/emission-entries/columns.ts`:

```typescript
import type { ColumnDef } from '@tanstack/table-core';
import { createRawSnippet } from 'svelte';
import { renderSnippet } from '$lib/components/ui/data-table';
import type { UserResponseDto, TenantRole } from '$lib/api/types.js';
import { TENANT_ROLE_LABELS } from '$lib/api/types.js';

const roleBadgeConfig: Record<TenantRole, { cls: string }> = {
	super_admin: {
		cls: 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-violet-50 text-violet-700 ring-1 ring-violet-500/20'
	},
	tenant_admin: {
		cls: 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-500/20'
	},
	data_approver: {
		cls: 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-500/20'
	},
	data_entry: {
		cls: 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20'
	},
	viewer: {
		cls: 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 ring-1 ring-slate-300/60'
	}
};

export function createColumns(currentUserId: string): ColumnDef<UserResponseDto>[] {
	return [
		{
			accessorKey: 'displayName',
			header: 'Name',
			cell: ({ row }) => {
				const name = row.original.displayName || 'No name set';
				const email = row.original.email;
				const isCurrentUser = row.original.id === currentUserId;
				const snippet = createRawSnippet<[{ name: string; email: string; isCurrentUser: boolean }]>((getData) => {
					const d = getData();
					return {
						render: () =>
							`<div class="flex flex-col gap-0.5">
								<span class="font-medium text-foreground">${d.name}${d.isCurrentUser ? ' <span class="text-xs text-muted-foreground">(you)</span>' : ''}</span>
								<span class="text-xs text-muted-foreground">${d.email}</span>
							</div>`
					};
				});
				return renderSnippet(snippet, { name, email, isCurrentUser });
			}
		},
		{
			accessorKey: 'role',
			header: 'Role',
			cell: ({ row }) => {
				const role = row.getValue('role') as TenantRole;
				const config = roleBadgeConfig[role];
				const label = TENANT_ROLE_LABELS[role];
				const snippet = createRawSnippet<[{ cls: string; label: string }]>((getData) => {
					const d = getData();
					return { render: () => `<span class="${d.cls}">${d.label}</span>` };
				});
				return renderSnippet(snippet, { cls: config.cls, label });
			}
		},
		{
			accessorKey: 'isActive',
			header: 'Status',
			cell: ({ row }) => {
				const isActive = row.getValue('isActive') as boolean;
				const snippet = createRawSnippet<[boolean]>((getActive) => {
					const active = getActive();
					return {
						render: () =>
							`<div class="flex items-center gap-2">
								<span class="size-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-300'}"></span>
								<span class="text-sm ${active ? 'text-foreground' : 'text-muted-foreground'}">${active ? 'Active' : 'Inactive'}</span>
							</div>`
					};
				});
				return renderSnippet(snippet, isActive);
			}
		}
	];
}
```

Note: The Actions column will be handled in the DataTable component itself using Svelte snippets (since it needs interactive buttons that `createRawSnippet` can't handle well).

**Step 2: Commit**

```bash
git add src/routes/(app)/settings/team-members/_components/columns.ts
git commit -m "feat: add team members table column definitions"
```

---

## Task 6: Create the Data Table Component

**Files:**
- Create: `src/routes/(app)/settings/team-members/_components/DataTable.svelte`

**Step 1: Create the data table**

Adapt the pattern from `src/routes/(app)/scope-1/emission-entries/data-table.svelte`, adding an actions column with a DropdownMenu:

```svelte
<script lang="ts">
	import {
		type ColumnDef,
		type PaginationState,
		getCoreRowModel,
		getPaginationRowModel
	} from '@tanstack/table-core';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table';
	import * as Table from '$lib/components/ui/table';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import Shield from '@lucide/svelte/icons/shield';
	import Network from '@lucide/svelte/icons/network';
	import UserX from '@lucide/svelte/icons/user-x';
	import type { UserResponseDto } from '$lib/api/types.js';

	interface Props {
		columns: ColumnDef<UserResponseDto, unknown>[];
		data: UserResponseDto[];
		currentUserId: string;
		onChangeRole: (user: UserResponseDto) => void;
		onManageAssignments: (user: UserResponseDto) => void;
		onDeactivate: (user: UserResponseDto) => void;
	}

	let { columns, data, currentUserId, onChangeRole, onManageAssignments, onDeactivate }: Props =
		$props();

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 20 });

	const table = createSvelteTable({
		get data() {
			return data;
		},
		columns,
		state: {
			get pagination() {
				return pagination;
			}
		},
		onPaginationChange: (updater) => {
			pagination = typeof updater === 'function' ? updater(pagination) : updater;
		},
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel()
	});
</script>

<div class="flex flex-col gap-4">
	<div class="rounded-xl border border-border bg-background">
		<Table.Root>
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup}
					<Table.Row class="hover:bg-transparent">
						{#each headerGroup.headers as header}
							<Table.Head class="text-xs font-medium text-muted-foreground">
								{#if !header.isPlaceholder}
									<FlexRender
										content={header.column.columnDef.header}
										context={header.getContext()}
									/>
								{/if}
							</Table.Head>
						{/each}
						<Table.Head class="w-12"></Table.Head>
					</Table.Row>
				{/each}
			</Table.Header>
			<Table.Body>
				{#each table.getRowModel().rows as row}
					{@const user = row.original}
					{@const isSelf = user.id === currentUserId}
					<Table.Row class={user.isActive ? '' : 'opacity-50'}>
						{#each row.getVisibleCells() as cell}
							<Table.Cell class="text-sm">
								<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
							</Table.Cell>
						{/each}
						<Table.Cell class="text-sm">
							{#if !isSelf && user.isActive}
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										{#snippet child({ props })}
											<Button variant="ghost" size="icon" class="size-8" {...props}>
												<Ellipsis class="size-4" />
											</Button>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end">
										<DropdownMenu.Item onclick={() => onChangeRole(user)}>
											<Shield class="size-4 mr-2" />
											Change Role
										</DropdownMenu.Item>
										<DropdownMenu.Item onclick={() => onManageAssignments(user)}>
											<Network class="size-4 mr-2" />
											Manage Assignments
										</DropdownMenu.Item>
										<DropdownMenu.Separator />
										<DropdownMenu.Item
											class="text-destructive focus:text-destructive"
											onclick={() => onDeactivate(user)}
										>
											<UserX class="size-4 mr-2" />
											Deactivate
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							{/if}
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={columns.length + 1} class="h-24 text-center text-sm text-muted-foreground">
							No users found.
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	{#if table.getPageCount() > 1}
		<div class="flex items-center justify-between">
			<p class="text-sm text-muted-foreground">
				Page {pagination.pageIndex + 1} of {table.getPageCount()}
			</p>
			<div class="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					onclick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
				>
					Previous
				</Button>
				<Button
					variant="outline"
					size="sm"
					onclick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}
				>
					Next
				</Button>
			</div>
		</div>
	{/if}
</div>
```

**Step 2: Commit**

```bash
git add src/routes/(app)/settings/team-members/_components/DataTable.svelte
git commit -m "feat: add team members data table with row actions"
```

---

## Task 7: Create the Change Role Dialog

**Files:**
- Create: `src/routes/(app)/settings/team-members/_components/ChangeRoleDialog.svelte`

**Step 1: Create the dialog**

Follow the pattern from `src/routes/(app)/settings/organizational-tree/_components/DeleteDialog.svelte`:

```svelte
<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import type { UserResponseDto, TenantRole } from '$lib/api/types.js';
	import { TENANT_ROLE_LABELS } from '$lib/api/types.js';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

	let {
		open = $bindable(false),
		user
	}: {
		open: boolean;
		user: UserResponseDto | null;
	} = $props();

	let submitting = $state(false);
	let errorMessage = $state('');
	let selectedRole = $state<TenantRole | ''>('');

	const roles: TenantRole[] = ['viewer', 'data_entry', 'data_approver', 'tenant_admin', 'super_admin'];

	// Reset state when dialog opens with new user
	$effect(() => {
		if (open && user) {
			selectedRole = user.role;
			errorMessage = '';
		}
	});

	async function handleSubmit() {
		if (!user || !selectedRole) return;

		submitting = true;
		errorMessage = '';

		const formData = new FormData();
		formData.set('userId', user.id);
		formData.set('role', selectedRole);

		const response = await fetch('?/changeRole', {
			method: 'POST',
			body: formData
		});

		const result = await response.json();
		submitting = false;

		const data = result?.data?.[0] ?? result;

		if (data?.status && data.status >= 400) {
			errorMessage = data.message || 'Failed to change role.';
			return;
		}

		open = false;
		toast.success('Role updated successfully.');
		await invalidateAll();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Change Role</Dialog.Title>
			<Dialog.Description>
				{#if user}
					Update the role for <strong>{user.displayName || user.email}</strong>
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		{#if errorMessage}
			<Alert variant="destructive">
				<TriangleAlert class="size-4" />
				<AlertDescription>{errorMessage}</AlertDescription>
			</Alert>
		{/if}

		<div class="py-4">
			<Select.Root
				type="single"
				value={selectedRole}
				onValueChange={(v) => { selectedRole = v as TenantRole; }}
			>
				<Select.Trigger class="w-full">
					{selectedRole ? TENANT_ROLE_LABELS[selectedRole as TenantRole] : 'Select a role'}
				</Select.Trigger>
				<Select.Content>
					{#each roles as role}
						<Select.Item value={role}>{TENANT_ROLE_LABELS[role]}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (open = false)} disabled={submitting}>
				Cancel
			</Button>
			<Button
				onclick={handleSubmit}
				disabled={submitting || !selectedRole || selectedRole === user?.role}
			>
				{submitting ? 'Saving...' : 'Save Role'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
```

**Step 2: Commit**

```bash
git add src/routes/(app)/settings/team-members/_components/ChangeRoleDialog.svelte
git commit -m "feat: add change role dialog for team members"
```

---

## Task 8: Create the Manage Assignments Dialog

**Files:**
- Create: `src/routes/(app)/settings/team-members/_components/ManageAssignmentsDialog.svelte`

**Step 1: Create the dialog**

This dialog fetches assignments when opened and shows a flat checkbox list of all org units:

```svelte
<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Button } from '$lib/components/ui/button';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import Info from '@lucide/svelte/icons/info';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import type { UserResponseDto, OrgUnitTreeResponseDto, AssignmentResponseDto } from '$lib/api/types.js';

	let {
		open = $bindable(false),
		user,
		orgTree
	}: {
		open: boolean;
		user: UserResponseDto | null;
		orgTree: OrgUnitTreeResponseDto[];
	} = $props();

	let loading = $state(false);
	let submitting = $state(false);
	let errorMessage = $state('');
	let selectedOrgUnitIds = $state<Set<string>>(new Set());

	// Flatten the org tree with depth info for indentation
	interface FlatOrgUnit {
		id: string;
		name: string;
		depth: number;
	}

	function flattenTree(nodes: OrgUnitTreeResponseDto[], depth: number = 0): FlatOrgUnit[] {
		const result: FlatOrgUnit[] = [];
		for (const node of nodes) {
			result.push({ id: node.id, name: node.name, depth });
			if (node.children?.length) {
				result.push(...flattenTree(node.children, depth + 1));
			}
		}
		return result;
	}

	let flatOrgUnits = $derived(flattenTree(orgTree));

	let isAdminRole = $derived(
		user?.role === 'tenant_admin' || user?.role === 'super_admin'
	);

	// Fetch assignments when dialog opens
	$effect(() => {
		if (open && user) {
			errorMessage = '';
			loadAssignments();
		}
	});

	async function loadAssignments() {
		if (!user) return;
		loading = true;

		const formData = new FormData();
		formData.set('userId', user.id);

		const response = await fetch('?/fetchAssignments', {
			method: 'POST',
			body: formData
		});

		const result = await response.json();
		loading = false;

		const data = result?.data?.[0] ?? result;

		if (data?.error) {
			errorMessage = data.error;
			return;
		}

		const assignments: AssignmentResponseDto[] = data?.assignments ?? [];
		selectedOrgUnitIds = new Set(assignments.map((a) => a.orgUnitId));
	}

	function toggleOrgUnit(orgUnitId: string, checked: boolean) {
		const next = new Set(selectedOrgUnitIds);
		if (checked) {
			next.add(orgUnitId);
		} else {
			next.delete(orgUnitId);
		}
		selectedOrgUnitIds = next;
	}

	async function handleSubmit() {
		if (!user) return;

		submitting = true;
		errorMessage = '';

		const formData = new FormData();
		formData.set('userId', user.id);
		formData.set('orgUnitIds', JSON.stringify([...selectedOrgUnitIds]));

		const response = await fetch('?/updateAssignments', {
			method: 'POST',
			body: formData
		});

		const result = await response.json();
		submitting = false;

		const data = result?.data?.[0] ?? result;

		if (data?.status && data.status >= 400) {
			errorMessage = data.message || 'Failed to update assignments.';
			return;
		}

		open = false;
		toast.success('Assignments updated successfully.');
		await invalidateAll();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-lg max-h-[80vh] flex flex-col">
		<Dialog.Header>
			<Dialog.Title>Manage Assignments</Dialog.Title>
			<Dialog.Description>
				{#if user}
					Assign organizational units to <strong>{user.displayName || user.email}</strong>
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		{#if isAdminRole}
			<Alert>
				<Info class="size-4" />
				<AlertDescription>
					Admins have tenant-wide access. Assignments have no practical effect on their permissions.
				</AlertDescription>
			</Alert>
		{/if}

		{#if errorMessage}
			<Alert variant="destructive">
				<TriangleAlert class="size-4" />
				<AlertDescription>{errorMessage}</AlertDescription>
			</Alert>
		{/if}

		<div class="flex-1 overflow-y-auto py-4 min-h-0">
			{#if loading}
				<div class="flex flex-col gap-3">
					{#each Array(5) as _}
						<Skeleton class="h-6 w-full" />
					{/each}
				</div>
			{:else if flatOrgUnits.length === 0}
				<p class="text-sm text-muted-foreground text-center py-4">
					No organizational units found. Create org units in the Organizational Tree settings first.
				</p>
			{:else}
				<div class="flex flex-col gap-1">
					{#each flatOrgUnits as orgUnit}
						{@const isChecked = selectedOrgUnitIds.has(orgUnit.id)}
						<label
							class="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted cursor-pointer transition-colors"
							style="padding-left: {12 + orgUnit.depth * 20}px"
						>
							<Checkbox
								checked={isChecked}
								onCheckedChange={(checked) => toggleOrgUnit(orgUnit.id, !!checked)}
							/>
							<span class="text-sm">{orgUnit.name}</span>
						</label>
					{/each}
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (open = false)} disabled={submitting}>
				Cancel
			</Button>
			<Button onclick={handleSubmit} disabled={submitting || loading}>
				{submitting ? 'Saving...' : 'Save Assignments'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
```

**Note on `updateAssignments` form action:** The Zod schema expects `orgUnitIds` as an array. Since we're sending via FormData, the server action needs to parse it. Update the `updateAssignments` action in `+page.server.ts` to handle this:

In the `updateAssignments` action, after `superValidate`, if validation fails because FormData doesn't map cleanly to JSON arrays, parse it manually:

```typescript
updateAssignments: async ({ request, locals }) => {
	const session = locals.session!;
	const formData = await request.formData();
	const userId = formData.get('userId') as string;
	const orgUnitIdsRaw = formData.get('orgUnitIds') as string;

	let orgUnitIds: string[];
	try {
		orgUnitIds = JSON.parse(orgUnitIdsRaw);
	} catch {
		const form = await superValidate(zod4(updateAssignmentsSchema));
		return message(form, 'Invalid assignment data.', { status: 400 });
	}

	// Validate manually
	const parsed = updateAssignmentsSchema.safeParse({ userId, orgUnitIds });
	if (!parsed.success) {
		const form = await superValidate(zod4(updateAssignmentsSchema));
		return message(form, 'Invalid assignment data.', { status: 400 });
	}

	try {
		await replaceAssignments(session.idToken, userId, orgUnitIds);
	} catch (err) {
		const form = await superValidate(zod4(updateAssignmentsSchema));
		if (err instanceof ApiError) {
			return message(form, err.body.error || 'Failed to update assignments.', { status: err.status });
		}
		return message(form, 'Something went wrong. Please try again.', { status: 500 });
	}

	const form = await superValidate(zod4(updateAssignmentsSchema));
	return message(form, 'Assignments updated successfully.');
}
```

**Step 2: Commit**

```bash
git add src/routes/(app)/settings/team-members/_components/ManageAssignmentsDialog.svelte
git commit -m "feat: add manage assignments dialog for team members"
```

---

## Task 9: Create the Deactivate Dialog

**Files:**
- Create: `src/routes/(app)/settings/team-members/_components/DeactivateDialog.svelte`

**Step 1: Create the dialog**

Direct adaptation of `DeleteDialog.svelte`:

```svelte
<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import type { UserResponseDto } from '$lib/api/types.js';

	let {
		open = $bindable(false),
		user
	}: {
		open: boolean;
		user: UserResponseDto | null;
	} = $props();

	let submitting = $state(false);
	let errorMessage = $state('');

	$effect(() => {
		if (open) {
			errorMessage = '';
		}
	});

	async function handleDeactivate() {
		if (!user) return;

		submitting = true;
		errorMessage = '';

		const formData = new FormData();
		formData.set('userId', user.id);

		const response = await fetch('?/deactivate', {
			method: 'POST',
			body: formData
		});

		const result = await response.json();
		submitting = false;

		const data = result?.data?.[0] ?? result;

		if (data?.status && data.status >= 400) {
			errorMessage = data.message || 'Failed to deactivate user.';
			return;
		}

		open = false;
		toast.success('User deactivated successfully.');
		await invalidateAll();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<TriangleAlert class="size-5 text-destructive" />
				Deactivate User
			</Dialog.Title>
			<Dialog.Description>
				{#if user}
					Are you sure you want to deactivate <strong>{user.displayName || user.email}</strong>?
					This will revoke their access to the platform. They will no longer be able to sign in.
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		{#if errorMessage}
			<Alert variant="destructive">
				<TriangleAlert class="size-4" />
				<AlertDescription>{errorMessage}</AlertDescription>
			</Alert>
		{/if}

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (open = false)} disabled={submitting}>
				Cancel
			</Button>
			<Button variant="destructive" onclick={handleDeactivate} disabled={submitting}>
				{submitting ? 'Deactivating...' : 'Deactivate'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
```

**Step 2: Commit**

```bash
git add src/routes/(app)/settings/team-members/_components/DeactivateDialog.svelte
git commit -m "feat: add deactivate user confirmation dialog"
```

---

## Task 10: Create the Main Page Component

**Files:**
- Create: `src/routes/(app)/settings/team-members/+page.svelte`

**Step 1: Create the page**

Wire together the data table, search/filter, and all three dialogs:

```svelte
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import Search from '@lucide/svelte/icons/search';
	import type { UserResponseDto, TenantRole } from '$lib/api/types.js';
	import { TENANT_ROLE_LABELS } from '$lib/api/types.js';
	import DataTable from './_components/DataTable.svelte';
	import { createColumns } from './_components/columns.js';
	import ChangeRoleDialog from './_components/ChangeRoleDialog.svelte';
	import ManageAssignmentsDialog from './_components/ManageAssignmentsDialog.svelte';
	import DeactivateDialog from './_components/DeactivateDialog.svelte';

	let { data } = $props();

	const columns = $derived(createColumns(data.currentUserId));

	// Dialog state
	let changeRoleOpen = $state(false);
	let assignmentsOpen = $state(false);
	let deactivateOpen = $state(false);
	let selectedUser = $state<UserResponseDto | null>(null);

	// Search & filter
	let searchValue = $state(data.filters.search);
	let roleFilter = $state(data.filters.role);
	let showInactive = $state(data.filters.includeInactive);
	let searchTimeout: ReturnType<typeof setTimeout>;

	function applyFilters() {
		const params = new URLSearchParams();
		if (searchValue) params.set('search', searchValue);
		if (roleFilter) params.set('role', roleFilter);
		if (showInactive) params.set('includeInactive', 'true');
		const query = params.toString();
		goto(`/settings/team-members${query ? `?${query}` : ''}`, { replaceState: true });
	}

	function handleSearchInput(e: Event) {
		searchValue = (e.target as HTMLInputElement).value;
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(applyFilters, 300);
	}

	function handleRoleFilter(value: string | undefined) {
		roleFilter = value ?? '';
		applyFilters();
	}

	function handleInactiveToggle(checked: boolean) {
		showInactive = !!checked;
		applyFilters();
	}

	// Dialog handlers
	function openChangeRole(user: UserResponseDto) {
		selectedUser = user;
		changeRoleOpen = true;
	}

	function openManageAssignments(user: UserResponseDto) {
		selectedUser = user;
		assignmentsOpen = true;
	}

	function openDeactivate(user: UserResponseDto) {
		selectedUser = user;
		deactivateOpen = true;
	}

	const roles: TenantRole[] = ['viewer', 'data_entry', 'data_approver', 'tenant_admin', 'super_admin'];
</script>

<svelte:head>
	<title>Team Members | Settings | Akriva</title>
</svelte:head>

<div class="flex flex-col gap-6 p-7 px-8">
	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div class="flex flex-col gap-1">
			<div class="flex items-center gap-3">
				<h1 class="text-2xl font-semibold">Team Members</h1>
				<Badge variant="secondary">{data.users.length}</Badge>
			</div>
			<p class="text-sm text-muted-foreground">
				Manage user roles and organizational unit assignments
			</p>
		</div>
	</div>

	<!-- Filters + Table -->
	<Card.Root>
		<Card.Content class="p-0">
			<!-- Filter Bar -->
			<div class="flex items-center gap-4 border-b border-border px-4 py-3">
				<div class="relative flex-1 max-w-sm">
					<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search by name or email..."
						class="pl-9"
						value={searchValue}
						oninput={handleSearchInput}
					/>
				</div>

				<Select.Root
					type="single"
					value={roleFilter || undefined}
					onValueChange={handleRoleFilter}
				>
					<Select.Trigger class="w-48">
						{roleFilter ? TENANT_ROLE_LABELS[roleFilter as TenantRole] : 'All roles'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">All roles</Select.Item>
						{#each roles as role}
							<Select.Item value={role}>{TENANT_ROLE_LABELS[role]}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				<label class="flex items-center gap-2 cursor-pointer">
					<Checkbox checked={showInactive} onCheckedChange={handleInactiveToggle} />
					<span class="text-sm text-muted-foreground">Show inactive</span>
				</label>
			</div>

			<!-- Data Table -->
			<div class="p-4">
				<DataTable
					{columns}
					data={data.users}
					currentUserId={data.currentUserId}
					onChangeRole={openChangeRole}
					onManageAssignments={openManageAssignments}
					onDeactivate={openDeactivate}
				/>
			</div>
		</Card.Content>
	</Card.Root>
</div>

<!-- Dialogs -->
<ChangeRoleDialog bind:open={changeRoleOpen} user={selectedUser} />
<ManageAssignmentsDialog bind:open={assignmentsOpen} user={selectedUser} orgTree={data.orgTree} />
<DeactivateDialog bind:open={deactivateOpen} user={selectedUser} />
```

**Step 2: Verify the page renders**

Run: `npm run dev`
Navigate to: `http://localhost:5173/settings/team-members`
Expected: The page loads (may show empty table if no API connection).

**Step 3: Commit**

```bash
git add src/routes/(app)/settings/team-members/+page.svelte
git commit -m "feat: add team members page with table, filters, and dialogs"
```

---

## Task 11: Wire Up Navigation

**Files:**
- Modify: `src/routes/(app)/settings/+layout.svelte`
- Modify: `src/components/app-sidebar.svelte`

**Step 1: Add Team Members to settings sidebar**

In `src/routes/(app)/settings/+layout.svelte`:

Add the import:
```typescript
import UsersRound from "@lucide/svelte/icons/users-round";
```

Add the nav item between "Organizational Tree" and "Security" in the `navItems` array:

```typescript
{
  href: "/settings/team-members",
  label: "Team Members",
  icon: UsersRound,
},
```

To make it role-gated, the layout needs the user role. Access it via `$page.data.user`:

Add to script:
```typescript
import { page } from "$app/state";
```

Add a derived check:
```typescript
let isAdmin = $derived(
  page.data?.user?.role === 'tenant_admin' || page.data?.user?.role === 'super_admin'
);
```

Then conditionally include Team Members in the rendered list:
```typescript
let visibleNavItems = $derived(
  navItems.filter((item) => {
    if (item.href === '/settings/team-members') return isAdmin;
    return true;
  })
);
```

Use `visibleNavItems` in the `{#each}` block instead of `navItems`.

**Step 2: Wire up the app sidebar link**

In `src/components/app-sidebar.svelte`, update the "Team Members" URL:

Change:
```typescript
{ title: "Team Members", url: "/#", icon: UsersRound },
```
To:
```typescript
{ title: "Team Members", url: "/settings/team-members", icon: UsersRound },
```

Also gate admin items by role. Add to the script:

```typescript
let isAdmin = $derived(
  user.role === 'tenant_admin' || user.role === 'super_admin'
);
```

Wrap the Admin group with `{#if isAdmin}`.

**Step 3: Commit**

```bash
git add src/routes/(app)/settings/+layout.svelte src/components/app-sidebar.svelte
git commit -m "feat: wire team members navigation in settings and app sidebar"
```

---

## Task 12: Handle apiFetchAuth for 204 No Content

**Files:**
- Modify: `src/lib/api/client.ts`

The `removeAssignment` endpoint returns `204 No Content` with no body. The current `apiFetchAuth` calls `response.json()` unconditionally, which will fail on 204. Fix this.

**Step 1: Update apiFetch to handle empty responses**

In `src/lib/api/client.ts`, update the success path of `apiFetch`:

```typescript
// After the !response.ok check:
if (response.status === 204 || response.headers.get('content-length') === '0') {
  return undefined as T;
}

return response.json() as Promise<T>;
```

**Step 2: Commit**

```bash
git add src/lib/api/client.ts
git commit -m "fix: handle 204 No Content responses in API client"
```

---

## Task 13: Final Integration Verification

**Step 1: Run type checking**

Run: `npx svelte-check --tsconfig ./tsconfig.json`
Expected: No errors.

**Step 2: Run dev server and manually test**

Run: `npm run dev`

Verify:
1. Navigate to Settings — "Team Members" appears in sidebar (only for admin users)
2. Team Members page loads with user table
3. Search filters users by name/email
4. Role filter shows only matching users
5. "Show inactive" toggle works
6. Row actions dropdown appears for non-self users
7. Change Role dialog opens, shows current role, allows selection, submits
8. Manage Assignments dialog opens, loads assignments, shows org unit checkboxes
9. Deactivate dialog opens with warning, confirms deactivation
10. All toast messages appear correctly

**Step 3: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address integration issues in team members feature"
```
