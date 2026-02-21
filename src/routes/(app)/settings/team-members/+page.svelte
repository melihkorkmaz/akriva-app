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
