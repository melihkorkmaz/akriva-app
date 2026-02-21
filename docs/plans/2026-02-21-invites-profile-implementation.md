# Invite System, Invite Signup & Profile Self-Service — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add invite management (create/list/revoke) to the team members page, build the invite signup flow for invitees, and create a profile self-service page for display name editing.

**Architecture:** Extends the existing team members page with tabs (Members/Invitations). New invite API client module mirrors the existing `users.ts` pattern. Invite signup rewrites the existing stub at `/signup/invited`. Profile page is a standalone Superforms page under `/settings/profile`.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, shadcn-svelte (Tabs, Dialog, Select, Form), Superforms + Zod 4, TanStack Table, svelte-sonner toasts

---

## Task 1: Add Invite Types to API Types

**Files:**
- Modify: `src/lib/api/types.ts`

**Step 1: Add InviteStatus type and InviteResponseDto**

Add these types after the `AssignmentResponseDto` interface (after line 358):

```typescript
/** Invite statuses */
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

/** Display labels for invite statuses */
export const INVITE_STATUS_LABELS: Record<InviteStatus, string> = {
	pending: 'Pending',
	accepted: 'Accepted',
	expired: 'Expired',
	revoked: 'Revoked'
};

/** Returned by invite endpoints (POST/GET/DELETE /v1/users/invites) */
export interface InviteResponseDto {
	id: string;
	email: string;
	role: TenantRole;
	status: InviteStatus;
	invitedBy: string | null;
	expiresAt: string | null;
	createdAt: string;
}

/** Returned by GET /v1/users/invites */
export interface InviteListResponse {
	invites: InviteResponseDto[];
}

/** Returned by GET /v1/auth/invites/{token}/validate (public) */
export interface ValidateInviteTokenResponseDto {
	valid: boolean;
	email?: string;
	role?: string;
	tenantName?: string;
	expiresAt?: string;
	reason?: string;
}
```

**Step 2: Verify the build**

Run: `npm run check`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/lib/api/types.ts
git commit -m "feat: add invite DTOs and status types"
```

---

## Task 2: Create Invite API Client

**Files:**
- Create: `src/lib/api/invites.ts`

**Step 1: Create the invite API module**

Create `src/lib/api/invites.ts` following the exact pattern from `src/lib/api/users.ts`:

```typescript
import { apiFetch, apiFetchAuth } from './client';
import type {
	InviteResponseDto,
	InviteListResponse,
	InviteStatus,
	TenantRole,
	ValidateInviteTokenResponseDto
} from './types';

/** Query params for GET /v1/users/invites */
export interface FetchInvitesParams {
	status?: InviteStatus;
	email?: string;
	limit?: number;
	offset?: number;
}

/** POST /v1/users/invites */
export async function createInvite(
	accessToken: string,
	data: { email: string; role: TenantRole; expiresInDays?: number }
): Promise<InviteResponseDto> {
	return apiFetchAuth<InviteResponseDto>('/users/invites', accessToken, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

/** GET /v1/users/invites */
export async function fetchInvites(
	accessToken: string,
	params?: FetchInvitesParams
): Promise<InviteListResponse> {
	const searchParams = new URLSearchParams();
	if (params?.status) searchParams.set('status', params.status);
	if (params?.email) searchParams.set('email', params.email);
	if (params?.limit) searchParams.set('limit', String(params.limit));
	if (params?.offset) searchParams.set('offset', String(params.offset));

	const query = searchParams.toString();
	return apiFetchAuth<InviteListResponse>(
		`/users/invites${query ? `?${query}` : ''}`,
		accessToken
	);
}

/** DELETE /v1/users/invites/{inviteId} — revoke */
export async function revokeInvite(
	accessToken: string,
	inviteId: string
): Promise<InviteResponseDto> {
	return apiFetchAuth<InviteResponseDto>(`/users/invites/${inviteId}`, accessToken, {
		method: 'DELETE'
	});
}

/** GET /v1/auth/invites/{token}/validate (public — no auth) */
export async function validateInviteToken(
	token: string
): Promise<ValidateInviteTokenResponseDto> {
	return apiFetch<ValidateInviteTokenResponseDto>(`/auth/invites/${token}/validate`);
}
```

**Step 2: Verify the build**

Run: `npm run check`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/lib/api/invites.ts
git commit -m "feat: add invite API client module"
```

---

## Task 3: Create Invite Zod Schemas

**Files:**
- Create: `src/lib/schemas/invite.ts`

**Step 1: Create the invite schemas**

Create `src/lib/schemas/invite.ts` following the pattern from `src/lib/schemas/user-management.ts`:

```typescript
import { z } from 'zod';

const tenantRoleEnum = z.enum([
	'viewer',
	'data_entry',
	'data_approver',
	'tenant_admin',
	'super_admin'
]);

/** Schema for creating an invite */
export const createInviteSchema = z.object({
	email: z.string().email('Please enter a valid email').max(255),
	role: tenantRoleEnum,
	expiresInDays: z.coerce.number().int().min(1).max(30).default(7)
});

/** Schema for revoking an invite */
export const revokeInviteSchema = z.object({
	inviteId: z.string().uuid('Invalid invite ID')
});
```

**Step 2: Verify the build**

Run: `npm run check`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/lib/schemas/invite.ts
git commit -m "feat: add Zod schemas for invite forms"
```

---

## Task 4: Add Invite Load + Actions to Team Members Server

**Files:**
- Modify: `src/routes/(app)/settings/team-members/+page.server.ts`

**Step 1: Add invite imports and load**

Add the invite imports to the top of the file alongside existing imports:

```typescript
import { fetchInvites, createInvite, revokeInvite } from '$lib/api/invites.js';
import { createInviteSchema, revokeInviteSchema } from '$lib/schemas/invite.js';
```

Update the `load` function to fetch invites in parallel. Replace the existing `Promise.all` block with:

```typescript
const [usersResponse, invitesResponse, orgTree] = await Promise.all([
	fetchUsers(session.idToken, {
		search,
		role,
		includeInactive,
		limit: 200
	}),
	fetchInvites(session.idToken, { limit: 200 }),
	getOrgUnitsTree(session.idToken)
]);
```

Add invite forms to the superValidate block:

```typescript
const [changeRoleForm, deactivateForm, assignmentsForm, createInviteForm, revokeInviteForm] = await Promise.all([
	superValidate(zod4(changeRoleSchema)),
	superValidate(zod4(deactivateUserSchema)),
	superValidate(zod4(updateAssignmentsSchema)),
	superValidate(zod4(createInviteSchema)),
	superValidate(zod4(revokeInviteSchema))
]);
```

Update the return to include invites:

```typescript
return {
	users: usersResponse.users,
	invites: invitesResponse.invites,
	orgTree: orgTree.data,
	currentUserId: session.user.id,
	currentUserRole: session.user.role,
	changeRoleForm,
	deactivateForm,
	assignmentsForm,
	createInviteForm,
	revokeInviteForm,
	filters: { search: search || '', role: roleParam || '', includeInactive }
};
```

**Step 2: Add createInvite action**

Add to the `actions` object, following the same error handling pattern as `changeRole`:

```typescript
createInvite: async ({ request, locals }) => {
	const session = requireAdmin(locals);
	const form = await superValidate(request, zod4(createInviteSchema));

	if (!form.valid) {
		return message(form, 'Please check the invite details.', { status: 400 });
	}

	try {
		await createInvite(session.idToken, {
			email: form.data.email,
			role: form.data.role,
			expiresInDays: form.data.expiresInDays
		});
	} catch (err) {
		if (err instanceof ApiError) {
			if (err.status === 403) {
				return message(form, 'Cannot invite a user with a role equal to or above your own.', { status: 403 });
			}
			if (err.status === 409) {
				return message(form, 'A pending invitation already exists for this email.', { status: 409 });
			}
			if (err.status === 422) {
				return message(form, 'This user already exists in your organization.', { status: 422 });
			}
			if (err.status === 502) {
				return message(form, 'Invite created but the email could not be sent. You can revoke and re-create the invite, or ask the recipient to check their spam folder.', { status: 502 });
			}
		}
		return message(form, 'Something went wrong. Please try again.', { status: 500 });
	}

	return message(form, 'Invitation sent successfully.');
},
```

**Step 3: Add revokeInvite action**

```typescript
revokeInvite: async ({ request, locals }) => {
	const session = requireAdmin(locals);
	const form = await superValidate(request, zod4(revokeInviteSchema));

	if (!form.valid) {
		return message(form, 'Invalid request.', { status: 400 });
	}

	try {
		await revokeInvite(session.idToken, form.data.inviteId);
	} catch (err) {
		if (err instanceof ApiError) {
			if (err.status === 404) {
				return message(form, 'Invitation not found.', { status: 404 });
			}
			if (err.status === 409) {
				return message(form, err.body.error || 'This invitation can no longer be revoked.', { status: 409 });
			}
		}
		return message(form, 'Something went wrong. Please try again.', { status: 500 });
	}

	return message(form, 'Invitation revoked successfully.');
},
```

**Step 4: Verify the build**

Run: `npm run check`
Expected: No type errors (page.svelte may temporarily error since it doesn't yet use the new data properties — that's OK)

**Step 5: Commit**

```bash
git add src/routes/(app)/settings/team-members/+page.server.ts
git commit -m "feat: add invite load and form actions to team members server"
```

---

## Task 5: Create InviteDialog Component

**Files:**
- Create: `src/routes/(app)/settings/team-members/_components/InviteDialog.svelte`

**Step 1: Create the invite dialog**

Follow the exact pattern from `ChangeRoleDialog.svelte` — `$bindable` open, FormData submission to `?/createInvite`, same error/success handling:

```svelte
<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import type { TenantRole } from '$lib/api/types.js';
	import { TENANT_ROLE_LABELS } from '$lib/api/types.js';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

	let {
		open = $bindable(false),
		currentUserRole
	}: {
		open: boolean;
		currentUserRole: TenantRole;
	} = $props();

	let submitting = $state(false);
	let errorMessage = $state('');
	let email = $state('');
	let selectedRole = $state<TenantRole | ''>('');
	let expiresInDays = $state('7');

	const allRoles: TenantRole[] = ['viewer', 'data_entry', 'data_approver', 'tenant_admin', 'super_admin'];
	const roleHierarchy: Record<TenantRole, number> = {
		viewer: 0,
		data_entry: 1,
		data_approver: 2,
		tenant_admin: 3,
		super_admin: 4
	};

	// Filter roles below current user's role (role cap enforcement)
	let availableRoles = $derived(
		allRoles.filter((r) => roleHierarchy[r] < roleHierarchy[currentUserRole])
	);

	let selectedRoleLabel = $derived(
		selectedRole ? TENANT_ROLE_LABELS[selectedRole as TenantRole] : 'Select a role'
	);

	const expiryOptions = [
		{ value: '1', label: '1 day' },
		{ value: '3', label: '3 days' },
		{ value: '7', label: '7 days' },
		{ value: '14', label: '14 days' },
		{ value: '30', label: '30 days' }
	];

	let expiryLabel = $derived(
		expiryOptions.find((o) => o.value === expiresInDays)?.label ?? '7 days'
	);

	// Reset state when dialog opens
	$effect(() => {
		if (open) {
			email = '';
			selectedRole = '';
			expiresInDays = '7';
			errorMessage = '';
		}
	});

	async function handleSubmit() {
		if (!email || !selectedRole) return;

		submitting = true;
		errorMessage = '';

		const formData = new FormData();
		formData.set('email', email);
		formData.set('role', selectedRole);
		formData.set('expiresInDays', expiresInDays);

		const response = await fetch('?/createInvite', {
			method: 'POST',
			body: formData
		});

		const result = await response.json();
		submitting = false;

		const data = result?.data?.[0] ?? result;

		if (data?.status && data.status >= 400) {
			if (data.status === 502) {
				// Email failure — invite was still created
				open = false;
				toast.warning(data.message || 'Invite created but email could not be sent.');
				await invalidateAll();
				return;
			}
			errorMessage = data.message || 'Failed to send invitation.';
			return;
		}

		open = false;
		toast.success('Invitation sent successfully.');
		await invalidateAll();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Invite Team Member</Dialog.Title>
			<Dialog.Description>
				Send an email invitation to join your organization.
			</Dialog.Description>
		</Dialog.Header>

		{#if errorMessage}
			<Alert variant="destructive">
				<TriangleAlert class="size-4" />
				<AlertDescription>{errorMessage}</AlertDescription>
			</Alert>
		{/if}

		<div class="flex flex-col gap-4 py-4">
			<div class="flex flex-col gap-2">
				<Label for="invite-email">Email address</Label>
				<Input
					id="invite-email"
					type="email"
					placeholder="name@company.com"
					bind:value={email}
				/>
			</div>

			<div class="flex flex-col gap-2">
				<Label>Role</Label>
				<Select.Root
					type="single"
					value={selectedRole}
					onValueChange={(val) => {
						if (val) selectedRole = val as TenantRole;
					}}
				>
					<Select.Trigger class="w-full">
						{selectedRoleLabel}
					</Select.Trigger>
					<Select.Content>
						{#each availableRoles as role}
							<Select.Item value={role}>{TENANT_ROLE_LABELS[role]}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="flex flex-col gap-2">
				<Label>Invite expires in</Label>
				<Select.Root
					type="single"
					value={expiresInDays}
					onValueChange={(val) => {
						if (val) expiresInDays = val;
					}}
				>
					<Select.Trigger class="w-full">
						{expiryLabel}
					</Select.Trigger>
					<Select.Content>
						{#each expiryOptions as option}
							<Select.Item value={option.value}>{option.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (open = false)} disabled={submitting}>
				Cancel
			</Button>
			<Button onclick={handleSubmit} disabled={submitting || !email || !selectedRole}>
				{submitting ? 'Sending...' : 'Send Invitation'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
```

**Step 2: Verify the build**

Run: `npm run check`
Expected: No errors for this component

**Step 3: Commit**

```bash
git add src/routes/(app)/settings/team-members/_components/InviteDialog.svelte
git commit -m "feat: add invite creation dialog component"
```

---

## Task 6: Create RevokeInviteDialog Component

**Files:**
- Create: `src/routes/(app)/settings/team-members/_components/RevokeInviteDialog.svelte`

**Step 1: Create the revoke dialog**

Follow the exact pattern from `DeactivateDialog.svelte`:

```svelte
<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import type { InviteResponseDto } from '$lib/api/types.js';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

	let {
		open = $bindable(false),
		invite
	}: {
		open: boolean;
		invite: InviteResponseDto | null;
	} = $props();

	let submitting = $state(false);
	let errorMessage = $state('');

	// Clear error when dialog opens
	$effect(() => {
		if (open) {
			errorMessage = '';
		}
	});

	async function handleSubmit() {
		if (!invite) return;

		submitting = true;
		errorMessage = '';

		const formData = new FormData();
		formData.set('inviteId', invite.id);

		const response = await fetch('?/revokeInvite', {
			method: 'POST',
			body: formData
		});

		const result = await response.json();
		submitting = false;

		const data = result?.data?.[0] ?? result;

		if (data?.status && data.status >= 400) {
			errorMessage = data.message || 'Failed to revoke invitation.';
			return;
		}

		open = false;
		toast.success('Invitation revoked successfully.');
		await invalidateAll();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Revoke Invitation</Dialog.Title>
			<Dialog.Description>
				{#if invite}
					Are you sure you want to revoke the invitation for <strong>{invite.email}</strong>?
					They will no longer be able to use this invite link to join.
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
			<Button variant="destructive" onclick={handleSubmit} disabled={submitting}>
				{submitting ? 'Revoking...' : 'Revoke Invitation'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
```

**Step 2: Commit**

```bash
git add src/routes/(app)/settings/team-members/_components/RevokeInviteDialog.svelte
git commit -m "feat: add revoke invite confirmation dialog"
```

---

## Task 7: Create InvitesTab Component

**Files:**
- Create: `src/routes/(app)/settings/team-members/_components/InvitesTab.svelte`

**Step 1: Create the invites tab content**

This component renders the invites table with status filter, search, pagination, and row actions. It follows the same patterns as the main `+page.svelte` filters + `DataTable.svelte` table, but simpler since there's only one row action (Revoke).

```svelte
<script lang="ts">
	import {
		createTable,
		createRender,
		type ColumnDef,
		type PaginationState,
		getCoreRowModel,
		getPaginationRowModel
	} from '@tanstack/table-core';
	import { FlexRender, renderSnippet, createRawSnippet } from '$lib/components/ui/data-table';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Search from '@lucide/svelte/icons/search';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import Ban from '@lucide/svelte/icons/ban';
	import type { InviteResponseDto, InviteStatus, TenantRole } from '$lib/api/types.js';
	import { TENANT_ROLE_LABELS, INVITE_STATUS_LABELS } from '$lib/api/types.js';

	interface Props {
		invites: InviteResponseDto[];
		onRevoke: (invite: InviteResponseDto) => void;
	}

	let { invites, onRevoke }: Props = $props();

	// Filters
	let searchValue = $state('');
	let statusFilter = $state('');

	let filteredInvites = $derived(() => {
		let result = invites;
		if (statusFilter) {
			result = result.filter((i) => i.status === statusFilter);
		}
		if (searchValue) {
			const search = searchValue.toLowerCase();
			result = result.filter((i) => i.email.toLowerCase().includes(search));
		}
		return result;
	});

	// Status badge colors
	const statusBadgeConfig: Record<InviteStatus, string> = {
		pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
		accepted: 'bg-green-100 text-green-800 border-green-200',
		expired: 'bg-gray-100 text-gray-600 border-gray-200',
		revoked: 'bg-red-100 text-red-800 border-red-200'
	};

	// Role badge colors (same as columns.ts)
	const roleBadgeConfig: Record<TenantRole, string> = {
		super_admin: 'bg-violet-100 text-violet-700 border-violet-200',
		tenant_admin: 'bg-blue-100 text-blue-700 border-blue-200',
		data_approver: 'bg-emerald-100 text-emerald-700 border-emerald-200',
		data_entry: 'bg-amber-100 text-amber-700 border-amber-200',
		viewer: 'bg-gray-100 text-gray-700 border-gray-200'
	};

	function escapeHtml(str: string): string {
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	function formatDate(isoString: string | null): string {
		if (!isoString) return '—';
		return new Date(isoString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	// Pagination
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 20 });

	const statuses: InviteStatus[] = ['pending', 'accepted', 'expired', 'revoked'];
	let statusFilterLabel = $derived(
		statusFilter ? INVITE_STATUS_LABELS[statusFilter as InviteStatus] : 'All statuses'
	);
</script>

<div class="flex flex-col gap-0">
	<!-- Filter Bar -->
	<div class="flex items-center gap-4 border-b border-border px-4 py-3">
		<div class="relative max-w-sm flex-1">
			<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				placeholder="Search by email..."
				class="pl-9"
				value={searchValue}
				oninput={(e) => {
					searchValue = (e.target as HTMLInputElement).value;
					pagination.pageIndex = 0;
				}}
			/>
		</div>

		<Select.Root
			type="single"
			value={statusFilter || '__all__'}
			onValueChange={(val) => {
				statusFilter = val === '__all__' ? '' : (val ?? '');
				pagination.pageIndex = 0;
			}}
		>
			<Select.Trigger class="w-48">
				{statusFilterLabel}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="__all__">All statuses</Select.Item>
				{#each statuses as status}
					<Select.Item value={status}>{INVITE_STATUS_LABELS[status]}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<!-- Table -->
	<div class="p-4">
		{@const data = filteredInvites()}
		{@const totalPages = Math.ceil(data.length / pagination.pageSize)}
		{@const start = pagination.pageIndex * pagination.pageSize}
		{@const pageData = data.slice(start, start + pagination.pageSize)}

		{#if data.length === 0}
			<div class="py-12 text-center text-sm text-muted-foreground">
				{#if searchValue || statusFilter}
					No invitations match your filters.
				{:else}
					No invitations yet. Click "Invite Member" to add team members.
				{/if}
			</div>
		{:else}
			<table class="w-full">
				<thead>
					<tr class="border-b text-left text-sm text-muted-foreground">
						<th class="pb-3 font-medium">Email</th>
						<th class="pb-3 font-medium">Role</th>
						<th class="pb-3 font-medium">Status</th>
						<th class="pb-3 font-medium">Invited</th>
						<th class="pb-3 font-medium">Expires</th>
						<th class="pb-3 font-medium w-12"></th>
					</tr>
				</thead>
				<tbody>
					{#each pageData as invite (invite.id)}
						<tr class="border-b last:border-0">
							<td class="py-3 text-sm">{escapeHtml(invite.email)}</td>
							<td class="py-3">
								<Badge variant="outline" class={roleBadgeConfig[invite.role]}>
									{TENANT_ROLE_LABELS[invite.role]}
								</Badge>
							</td>
							<td class="py-3">
								<Badge variant="outline" class={statusBadgeConfig[invite.status]}>
									{INVITE_STATUS_LABELS[invite.status]}
								</Badge>
							</td>
							<td class="py-3 text-sm text-muted-foreground">{formatDate(invite.createdAt)}</td>
							<td class="py-3 text-sm text-muted-foreground">{formatDate(invite.expiresAt)}</td>
							<td class="py-3">
								{#if invite.status === 'pending'}
									<DropdownMenu.Root>
										<DropdownMenu.Trigger>
											{#snippet child({ props })}
												<Button variant="ghost" size="icon" class="size-8" {...props}>
													<Ellipsis class="size-4" />
												</Button>
											{/snippet}
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end">
											<DropdownMenu.Item
												class="text-destructive"
												onclick={() => onRevoke(invite)}
											>
												<Ban class="size-4 mr-2" />
												Revoke
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="flex items-center justify-between pt-4">
					<p class="text-sm text-muted-foreground">
						Showing {start + 1}–{Math.min(start + pagination.pageSize, data.length)} of {data.length}
					</p>
					<div class="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={pagination.pageIndex === 0}
							onclick={() => (pagination.pageIndex -= 1)}
						>
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={pagination.pageIndex >= totalPages - 1}
							onclick={() => (pagination.pageIndex += 1)}
						>
							Next
						</Button>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>
```

**Step 2: Commit**

```bash
git add src/routes/(app)/settings/team-members/_components/InvitesTab.svelte
git commit -m "feat: add invitations tab component with table and filters"
```

---

## Task 8: Update Team Members Page with Tabs

**Files:**
- Modify: `src/routes/(app)/settings/team-members/+page.svelte`

**Step 1: Add tab navigation and wire up invite components**

This is the main integration step. The page gets:
- A `Tabs.Root` wrapping the existing card content
- Import for the new components
- The "Invite Member" button in the header
- Tab switching between Members and Invitations

Replace the entire `+page.svelte` content with the updated version that adds tabs, the invite button, and invite dialogs. Key changes:

1. Add imports: `Tabs`, `InvitesTab`, `InviteDialog`, `RevokeInviteDialog`, `Button`, `UserPlus` icon
2. Add state: `activeTab`, `inviteDialogOpen`, `revokeDialogOpen`, `selectedInvite`
3. Wrap the card content in `Tabs.Root` / `Tabs.Content`
4. Add "Invite Member" button to header
5. Add invite-related dialogs

```svelte
<script lang="ts">
	import { goto } from '$app/navigation';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import Search from '@lucide/svelte/icons/search';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import type { UserResponseDto, TenantRole, InviteResponseDto } from '$lib/api/types.js';
	import { TENANT_ROLE_LABELS } from '$lib/api/types.js';
	import DataTable from './_components/DataTable.svelte';
	import { createColumns } from './_components/columns.js';
	import ChangeRoleDialog from './_components/ChangeRoleDialog.svelte';
	import ManageAssignmentsDialog from './_components/ManageAssignmentsDialog.svelte';
	import DeactivateDialog from './_components/DeactivateDialog.svelte';
	import InvitesTab from './_components/InvitesTab.svelte';
	import InviteDialog from './_components/InviteDialog.svelte';
	import RevokeInviteDialog from './_components/RevokeInviteDialog.svelte';

	let { data } = $props();

	const columns = $derived(createColumns(data.currentUserId));

	// Tab state
	let activeTab = $state('members');

	// User dialog state
	let changeRoleOpen = $state(false);
	let assignmentsOpen = $state(false);
	let deactivateOpen = $state(false);
	let selectedUser = $state<UserResponseDto | null>(null);

	// Invite dialog state
	let inviteDialogOpen = $state(false);
	let revokeDialogOpen = $state(false);
	let selectedInvite = $state<InviteResponseDto | null>(null);

	// Search & filter (members tab)
	let searchValue = $state(data.filters.search);
	let roleFilter = $state(data.filters.role);
	let showInactive = $state(data.filters.includeInactive);
	let searchTimeout: ReturnType<typeof setTimeout>;

	function applyFilters() {
		const params = new URLSearchParams();
		if (searchValue) params.set('search', searchValue);
		if (roleFilter) params.set('role', roleFilter);
		if (showInactive) params.set('includeInactive', 'true');
		if (activeTab !== 'members') params.set('tab', activeTab);
		const query = params.toString();
		goto(`/settings/team-members${query ? `?${query}` : ''}`, { replaceState: true });
	}

	function handleSearchInput(e: Event) {
		searchValue = (e.target as HTMLInputElement).value;
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(applyFilters, 300);
	}

	function handleRoleFilter(value: string | undefined) {
		roleFilter = value === '__all__' ? '' : (value ?? '');
		applyFilters();
	}

	function handleInactiveToggle(checked: boolean | 'indeterminate') {
		showInactive = !!checked;
		applyFilters();
	}

	// User dialog handlers
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

	// Invite dialog handlers
	function openRevokeInvite(invite: InviteResponseDto) {
		selectedInvite = invite;
		revokeDialogOpen = true;
	}

	const roles: TenantRole[] = [
		'viewer',
		'data_entry',
		'data_approver',
		'tenant_admin',
		'super_admin'
	];

	let roleFilterLabel = $derived(
		roleFilter ? TENANT_ROLE_LABELS[roleFilter as TenantRole] : 'All roles'
	);

	let pendingInviteCount = $derived(
		data.invites.filter((i) => i.status === 'pending').length
	);
</script>

<svelte:head>
	<title>Team Members | Settings | Akriva</title>
</svelte:head>

<div class="flex flex-col gap-6 p-7 px-8">
	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div class="flex flex-col gap-1">
			<h1 class="text-2xl font-semibold">Team Members</h1>
			<p class="text-sm text-muted-foreground">
				Manage user roles, invitations, and organizational unit assignments
			</p>
		</div>
		<Button onclick={() => (inviteDialogOpen = true)}>
			<UserPlus class="size-4 mr-2" />
			Invite Member
		</Button>
	</div>

	<!-- Tabs + Content -->
	<Tabs.Root bind:value={activeTab}>
		<Tabs.List>
			<Tabs.Trigger value="members">Members ({data.users.length})</Tabs.Trigger>
			<Tabs.Trigger value="invitations">
				Invitations
				{#if pendingInviteCount > 0}
					<Badge variant="secondary" class="ml-1.5">{pendingInviteCount}</Badge>
				{/if}
			</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="members" class="mt-4">
			<Card.Root>
				<Card.Content class="p-0">
					<!-- Members Filter Bar -->
					<div class="flex items-center gap-4 border-b border-border px-4 py-3">
						<div class="relative max-w-sm flex-1">
							<Search
								class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
							/>
							<Input
								placeholder="Search by name or email..."
								class="pl-9"
								value={searchValue}
								oninput={handleSearchInput}
							/>
						</div>

						<Select.Root
							type="single"
							value={roleFilter || '__all__'}
							onValueChange={handleRoleFilter}
						>
							<Select.Trigger class="w-48">
								{roleFilterLabel}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="__all__">All roles</Select.Item>
								{#each roles as role}
									<Select.Item value={role}>{TENANT_ROLE_LABELS[role]}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>

						<label class="flex cursor-pointer items-center gap-2">
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
		</Tabs.Content>

		<Tabs.Content value="invitations" class="mt-4">
			<Card.Root>
				<Card.Content class="p-0">
					<InvitesTab invites={data.invites} onRevoke={openRevokeInvite} />
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</div>

<!-- User Dialogs -->
<ChangeRoleDialog bind:open={changeRoleOpen} user={selectedUser} />
<ManageAssignmentsDialog bind:open={assignmentsOpen} user={selectedUser} orgTree={data.orgTree} />
<DeactivateDialog bind:open={deactivateOpen} user={selectedUser} />

<!-- Invite Dialogs -->
<InviteDialog bind:open={inviteDialogOpen} currentUserRole={data.currentUserRole} />
<RevokeInviteDialog bind:open={revokeDialogOpen} invite={selectedInvite} />
```

**Step 2: Verify the build**

Run: `npm run check`
Expected: No type errors. Page should compile successfully.

**Step 3: Visual verification**

Run: `npm run dev`
Navigate to `/settings/team-members`. Verify:
- Tabs appear ("Members" / "Invitations")
- "Invite Member" button appears in header
- Members tab shows existing user table with filters
- Invitations tab shows empty state message
- Clicking "Invite Member" opens the dialog with email, role, and expiry fields

**Step 4: Commit**

```bash
git add src/routes/(app)/settings/team-members/+page.svelte
git commit -m "feat: add tabs and invite management to team members page"
```

---

## Task 9: Create Profile Schema

**Files:**
- Create: `src/lib/schemas/profile.ts`

**Step 1: Create the profile schema**

```typescript
import { z } from 'zod';

/** Schema for updating user display name */
export const profileSchema = z.object({
	displayName: z.string().min(1, 'Display name is required').max(255, 'Display name must be 255 characters or less')
});
```

**Step 2: Commit**

```bash
git add src/lib/schemas/profile.ts
git commit -m "feat: add Zod schema for profile form"
```

---

## Task 10: Create Profile Page (Server + Client)

**Files:**
- Create: `src/routes/(app)/settings/profile/+page.server.ts`
- Create: `src/routes/(app)/settings/profile/+page.svelte`

**Step 1: Create the server load and action**

Create `src/routes/(app)/settings/profile/+page.server.ts`:

```typescript
import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { fetchCurrentUser, updateProfile } from '$lib/api/users.js';
import { ApiError } from '$lib/api/client.js';
import { profileSchema } from '$lib/schemas/profile.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session!;
	const currentUser = await fetchCurrentUser(session.idToken);

	const form = await superValidate(
		{ displayName: currentUser.displayName ?? '' },
		zod4(profileSchema)
	);

	return {
		currentUser,
		form
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const session = locals.session!;
		const form = await superValidate(request, zod4(profileSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await updateProfile(session.idToken, {
				displayName: form.data.displayName
			});
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 400) {
					return message(form, err.body.error || 'Please check your input.', { status: 400 });
				}
			}
			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		return message(form, 'Profile updated successfully.');
	}
};
```

**Step 2: Create the profile page component**

Create `src/routes/(app)/settings/profile/+page.svelte`:

```svelte
<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { toast } from 'svelte-sonner';
	import { TENANT_ROLE_LABELS } from '$lib/api/types.js';
	import { profileSchema } from '$lib/schemas/profile.js';

	let { data } = $props();

	const superform = superForm(data.form, {
		validators: zod4Client(profileSchema),
		onUpdated({ form }) {
			if (form.valid && form.message && !form.message.includes('wrong')) {
				toast.success(form.message);
			}
		}
	});
	const { form, enhance, message, submitting } = superform;

	const roleBadgeConfig: Record<string, string> = {
		super_admin: 'bg-violet-100 text-violet-700 border-violet-200',
		tenant_admin: 'bg-blue-100 text-blue-700 border-blue-200',
		data_approver: 'bg-emerald-100 text-emerald-700 border-emerald-200',
		data_entry: 'bg-amber-100 text-amber-700 border-amber-200',
		viewer: 'bg-gray-100 text-gray-700 border-gray-200'
	};
</script>

<svelte:head>
	<title>Profile | Settings | Akriva</title>
</svelte:head>

<div class="flex flex-col gap-6 p-7 px-8">
	<div class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold">Profile</h1>
		<p class="text-sm text-muted-foreground">Manage your personal information</p>
	</div>

	<Card.Root class="max-w-2xl">
		<Card.Header>
			<Card.Title>Personal Information</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if $message && ($message.includes('wrong') || $message.includes('check'))}
				<Alert variant="destructive" class="mb-4">
					<AlertDescription>{$message}</AlertDescription>
				</Alert>
			{/if}

			<form method="POST" use:enhance class="flex flex-col gap-5">
				<div class="flex flex-col gap-2">
					<span class="text-sm font-medium">Email</span>
					<p class="text-sm text-muted-foreground">{data.currentUser.email}</p>
				</div>

				<Form.Field form={superform} name="displayName">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Display Name</Form.Label>
							<Input
								{...props}
								placeholder="Your display name"
								bind:value={$form.displayName}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<div class="flex flex-col gap-2">
					<span class="text-sm font-medium">Role</span>
					<div>
						<Badge variant="outline" class={roleBadgeConfig[data.currentUser.role] ?? ''}>
							{TENANT_ROLE_LABELS[data.currentUser.role] ?? data.currentUser.role}
						</Badge>
					</div>
				</div>

				<div class="flex justify-end pt-2">
					<Form.Button disabled={$submitting}>
						{$submitting ? 'Saving...' : 'Save Changes'}
					</Form.Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
```

**Step 3: Verify the build**

Run: `npm run check`
Expected: No type errors

**Step 4: Visual verification**

Run: `npm run dev`
Navigate to `/settings/profile`. Verify:
- Page shows email (read-only), display name input, and role badge
- Form submits and shows toast on success

**Step 5: Commit**

```bash
git add src/routes/(app)/settings/profile/+page.server.ts src/routes/(app)/settings/profile/+page.svelte src/lib/schemas/profile.ts
git commit -m "feat: add profile self-service page with display name editing"
```

---

## Task 11: Add Invite Token Validation to Signup + Build Invited Page

**Files:**
- Modify: `src/routes/(auth)/signup/+page.server.ts`
- Create: `src/routes/(auth)/signup/invited/+page.server.ts`
- Rewrite: `src/routes/(auth)/signup/invited/+page.svelte`

**Step 1: Add token detection redirect to main signup server**

Modify `src/routes/(auth)/signup/+page.server.ts` to detect `?token=` and redirect. Add this at the top of the `load` function, before the existing `superValidate` call:

```typescript
import { validateInviteToken } from '$lib/api/invites.js';
```

Then update the `load` function to detect and validate tokens:

```typescript
export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');

	if (token) {
		try {
			const validation = await validateInviteToken(token);

			if (validation.valid) {
				const params = new URLSearchParams({
					token,
					email: validation.email!,
					tenantName: validation.tenantName!,
					role: validation.role!
				});
				redirect(302, `/signup/invited?${params.toString()}`);
			} else {
				redirect(302, `/signup/invited?error=${validation.reason}`);
			}
		} catch {
			redirect(302, `/signup/invited?error=not_found`);
		}
	}

	const form = await superValidate(zod4(signupSchema));
	return { form };
};
```

**Step 2: Create the invited signup schema**

Create `src/lib/schemas/invited-signup.ts`:

```typescript
import { z } from 'zod';

/** Invited signup form schema — no companyName since joining existing tenant */
export const invitedSignupSchema = z.object({
	firstName: z.string().min(1, 'First name is required').max(255),
	lastName: z.string().min(1, 'Last name is required').max(255),
	email: z.string().email(),
	password: z.string().min(8, 'Password must be at least 8 characters').max(256),
	token: z.string().min(1)
});
```

**Step 3: Create the invited signup server**

Create `src/routes/(auth)/signup/invited/+page.server.ts`:

```typescript
import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { signup } from '$lib/api/auth.js';
import { ApiError } from '$lib/api/client.js';
import { setAuthCookies } from '$lib/server/auth.js';
import { invitedSignupSchema } from '$lib/schemas/invited-signup.js';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');
	const email = url.searchParams.get('email');
	const tenantName = url.searchParams.get('tenantName');
	const role = url.searchParams.get('role');
	const error = url.searchParams.get('error');

	// Error state — invalid token
	if (error) {
		return { inviteError: error, form: null };
	}

	// Valid invite — pre-fill form
	if (token && email) {
		const form = await superValidate(
			{ email, token, firstName: '', lastName: '', password: '' },
			zod4(invitedSignupSchema)
		);
		return {
			inviteError: null,
			form,
			tenantName: tenantName ?? 'your organization',
			role: role ?? 'member'
		};
	}

	// No token or error — redirect to normal signup
	redirect(302, '/signup');
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, zod4(invitedSignupSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const response = await signup({
				email: form.data.email,
				password: form.data.password,
				givenName: form.data.firstName,
				familyName: form.data.lastName,
				companyName: '', // Not needed for invited signup
				invitationToken: form.data.token
			});

			setAuthCookies(cookies, response.tokens);
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 409) {
					return message(form, 'An account with this email already exists.', { status: 409 });
				}
				if (err.status === 400) {
					return message(
						form,
						err.body.error || 'Please check your information and try again.',
						{ status: 400 }
					);
				}
			}
			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		redirect(302, '/dashboard');
	}
};
```

**Step 4: Rewrite the invited signup page**

Rewrite `src/routes/(auth)/signup/invited/+page.svelte`:

```svelte
<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import TextDivider from '$components/TextDivider.svelte';
	import { TENANT_ROLE_LABELS } from '$lib/api/types.js';
	import type { TenantRole } from '$lib/api/types.js';
	import { invitedSignupSchema } from '$lib/schemas/invited-signup.js';

	let { data } = $props();

	let showPassword = $state(false);

	const errorMessages: Record<string, string> = {
		not_found: 'This invite link is invalid.',
		expired: 'This invite has expired. Contact your administrator for a new invitation.',
		accepted: 'This invite has already been used. If you already have an account, sign in below.',
		revoked: 'This invite has been revoked. Contact your administrator for a new invitation.'
	};

	// Only create superform if we have a valid form (not error state)
	const superform = data.form
		? superForm(data.form, {
				validators: zod4Client(invitedSignupSchema),
				onError({ result }) {
					if ($message !== undefined) {
						$message =
							typeof result.error === 'string'
								? result.error
								: 'An unexpected error occurred. Please try again.';
					}
				}
			})
		: null;

	const form = superform ? superform.form : null;
	const enhance = superform ? superform.enhance : null;
	const message = superform ? superform.message : null;
	const submitting = superform ? superform.submitting : null;
</script>

<svelte:head>
	<title>Join Organization | Akriva</title>
</svelte:head>

<Card.Root class="w-full max-w-[490px]">
	<Card.Content class="pt-6">
		<div class="flex flex-col gap-5">
			{#if data.inviteError}
				<!-- Error State -->
				<Alert variant="destructive">
					<TriangleAlert class="size-4" />
					<AlertDescription>
						{errorMessages[data.inviteError] ?? 'This invite link is invalid.'}
					</AlertDescription>
				</Alert>

				<div class="flex flex-col gap-2 items-center">
					<h2 class="text-2xl font-semibold">Unable to Join</h2>
					<p class="text-base text-muted-foreground text-center">
						{errorMessages[data.inviteError] ?? 'This invite link is invalid.'}
					</p>
				</div>

				<div class="flex flex-col gap-3">
					<a
						href="/signin"
						class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
					>
						Sign in instead
					</a>
					<a
						href="/signup"
						class="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
					>
						Back to signup
					</a>
				</div>
			{:else if superform && form && enhance && message && submitting}
				<!-- Valid Invite — Signup Form -->
				<Alert class="border-emerald-200 bg-emerald-50 text-emerald-800">
					<CircleCheck class="size-4 text-emerald-600" />
					<AlertDescription>
						You've been invited to join <strong>{data.tenantName}</strong>
						as
						<Badge variant="outline" class="ml-1">
							{TENANT_ROLE_LABELS[data.role as TenantRole] ?? data.role}
						</Badge>
					</AlertDescription>
				</Alert>

				<div class="flex flex-col gap-2 items-center">
					<h2 class="text-2xl font-semibold">Create Your Account</h2>
					<p class="text-base text-muted-foreground">
						Complete your profile to join {data.tenantName}
					</p>
				</div>

				{#if $message}
					<Alert variant="destructive">
						<AlertDescription>{$message}</AlertDescription>
					</Alert>
				{/if}

				<form method="POST" use:enhance class="flex flex-col gap-5">
					<!-- Hidden fields -->
					<input type="hidden" name="email" value={$form.email} />
					<input type="hidden" name="token" value={$form.token} />

					<div class="flex flex-col gap-2">
						<span class="text-sm font-medium">Email</span>
						<p class="text-sm text-muted-foreground">{$form.email}</p>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<Form.Field form={superform} name="firstName">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>First Name</Form.Label>
									<Input
										{...props}
										placeholder="Jane"
										bind:value={$form.firstName}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field form={superform} name="lastName">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Last Name</Form.Label>
									<Input
										{...props}
										placeholder="Doe"
										bind:value={$form.lastName}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</div>

					<Form.Field form={superform} name="password">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Password</Form.Label>
								<div class="relative">
									<Input
										{...props}
										type={showPassword ? 'text' : 'password'}
										placeholder="••••••••"
										bind:value={$form.password}
									/>
									<button
										type="button"
										class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
										onclick={() => (showPassword = !showPassword)}
										tabindex={-1}
									>
										{#if showPassword}
											<EyeOff class="size-4" />
										{:else}
											<Eye class="size-4" />
										{/if}
									</button>
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Button class="w-full" disabled={$submitting}>
						{$submitting ? 'Creating Account...' : 'Create Account'}
					</Form.Button>
				</form>

				<TextDivider />

				<div class="flex flex-wrap gap-2 justify-center">
					<span class="text-sm text-muted-foreground">Already have an account?</span>
					<a href="/signin" class="text-sm font-bold">Sign in</a>
				</div>
			{/if}
		</div>
	</Card.Content>
</Card.Root>
```

**Step 5: Verify the build**

Run: `npm run check`
Expected: No type errors

**Step 6: Commit**

```bash
git add src/routes/(auth)/signup/+page.server.ts src/routes/(auth)/signup/invited/+page.server.ts src/routes/(auth)/signup/invited/+page.svelte src/lib/schemas/invited-signup.ts
git commit -m "feat: add invite signup flow with token validation and pre-filled form"
```

---

## Task 12: Final Verification & Cleanup

**Files:** All created/modified files

**Step 1: Full type check**

Run: `npm run check`
Expected: 0 errors

**Step 2: Build verification**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Manual testing checklist**

Run `npm run dev` and verify:

1. **Team members page** — `/settings/team-members`
   - [ ] Tabs appear: "Members (N)" and "Invitations"
   - [ ] "Invite Member" button in header
   - [ ] Members tab has existing filters and table
   - [ ] Invitations tab shows empty state or invite list
   - [ ] Invite dialog opens with email, role (filtered by cap), and expiry
   - [ ] Revoke button appears only for pending invites

2. **Profile page** — `/settings/profile`
   - [ ] Accessible from user dropdown in sidebar
   - [ ] Shows email (read-only), display name (editable), and role (badge)
   - [ ] Save triggers PATCH /v1/users/profile
   - [ ] Success toast appears

3. **Invite signup** — `/signup?token=test`
   - [ ] Redirects to `/signup/invited?error=not_found` for invalid tokens
   - [ ] Error state shows appropriate message
   - [ ] "Sign in" and "Back to signup" links work

**Step 4: Commit any fixes**

If any issues found, fix and commit with descriptive messages.

**Step 5: Final commit (if needed)**

```bash
git add -A
git commit -m "fix: address any issues from final verification"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add invite types to API types | `types.ts` |
| 2 | Create invite API client | `invites.ts` (new) |
| 3 | Create invite Zod schemas | `invite.ts` (new) |
| 4 | Add invite load + actions to server | `+page.server.ts` (modify) |
| 5 | Create InviteDialog component | `InviteDialog.svelte` (new) |
| 6 | Create RevokeInviteDialog component | `RevokeInviteDialog.svelte` (new) |
| 7 | Create InvitesTab component | `InvitesTab.svelte` (new) |
| 8 | Update team members page with tabs | `+page.svelte` (rewrite) |
| 9 | Create profile schema | `profile.ts` (new) |
| 10 | Create profile page | `+page.server.ts` + `+page.svelte` (new) |
| 11 | Build invite signup flow | `+page.server.ts` (modify) + invited route (new) |
| 12 | Final verification & cleanup | All files |
