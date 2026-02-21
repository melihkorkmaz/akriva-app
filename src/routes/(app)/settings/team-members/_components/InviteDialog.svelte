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
