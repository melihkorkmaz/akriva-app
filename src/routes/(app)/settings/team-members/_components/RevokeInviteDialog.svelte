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
