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

		// SvelteKit form action responses are wrapped in a data array
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
					Are you sure you want to deactivate <strong>{user.displayName || user.email}</strong
					>? This will revoke their access to the platform. They will no longer be able to sign
					in.
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
