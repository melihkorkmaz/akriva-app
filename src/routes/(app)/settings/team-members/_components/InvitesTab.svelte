<script lang="ts">
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

	let filteredInvites = $derived.by(() => {
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

	function formatDate(isoString: string | null): string {
		if (!isoString) return '\u2014';
		return new Date(isoString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	// Pagination
	let pageIndex = $state(0);
	const pageSize = 20;

	const statuses: InviteStatus[] = ['pending', 'accepted', 'expired', 'revoked'];
	let statusFilterLabel = $derived(
		statusFilter ? INVITE_STATUS_LABELS[statusFilter as InviteStatus] : 'All statuses'
	);

	let totalPages = $derived(Math.ceil(filteredInvites.length / pageSize));
	let start = $derived(pageIndex * pageSize);
	let pageData = $derived(filteredInvites.slice(start, start + pageSize));
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
					pageIndex = 0;
				}}
			/>
		</div>

		<Select.Root
			type="single"
			value={statusFilter || '__all__'}
			onValueChange={(val) => {
				statusFilter = val === '__all__' ? '' : (val ?? '');
				pageIndex = 0;
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
		{#if filteredInvites.length === 0}
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
							<td class="py-3 text-sm">{invite.email}</td>
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
						Showing {start + 1}&ndash;{Math.min(start + pageSize, filteredInvites.length)} of {filteredInvites.length}
					</p>
					<div class="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={pageIndex === 0}
							onclick={() => (pageIndex -= 1)}
						>
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={pageIndex >= totalPages - 1}
							onclick={() => (pageIndex += 1)}
						>
							Next
						</Button>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>
