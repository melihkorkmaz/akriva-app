<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import type { DataCollectionRequestResponseDto } from '$lib/api/types.js';

	let {
		open = $bindable(false),
		request
	}: {
		open: boolean;
		request: DataCollectionRequestResponseDto | null;
	} = $props();

	let submitting = $state(false);
	let errorMessage = $state('');

	$effect(() => {
		if (open) {
			errorMessage = '';
		}
	});

	async function handleCancel() {
		if (!request) return;

		submitting = true;
		errorMessage = '';

		const response = await fetch(`/requests/${request.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'cancelled' })
		});

		const data = await response.json();
		submitting = false;

		if (data?.success) {
			open = false;
			toast.success('Request cancelled successfully.');
			await invalidateAll();
		} else {
			errorMessage = data?.error || 'Failed to cancel request.';
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<TriangleAlert class="size-5 text-destructive" />
				Cancel Request
			</Dialog.Title>
			<Dialog.Description>
				{#if request}
					Are you sure you want to cancel <strong>{request.title}</strong>? All pending and
					in-progress tasks will also be cancelled. This action cannot be undone.
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
				Keep Open
			</Button>
			<Button variant="destructive" onclick={handleCancel} disabled={submitting}>
				{submitting ? 'Cancelling...' : 'Cancel Request'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
