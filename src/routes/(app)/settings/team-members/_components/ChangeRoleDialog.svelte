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

	let selectedRoleLabel = $derived(
		selectedRole ? TENANT_ROLE_LABELS[selectedRole as TenantRole] : 'Select a role'
	);

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

		// SvelteKit form action responses are wrapped in a data array
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
				onValueChange={(val) => {
					if (val) selectedRole = val as TenantRole;
				}}
			>
				<Select.Trigger class="w-full">
					{selectedRoleLabel}
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
