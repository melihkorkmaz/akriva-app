<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	interface Props {
		open: boolean;
		taskId: string;
	}

	let { open = $bindable(), taskId }: Props = $props();

	let notes = $state('');
	let submitting = $state(false);
	let error = $state('');

	async function handleReject() {
		if (!notes.trim()) {
			error = 'Please provide notes explaining what needs to be revised.';
			return;
		}
		if (notes.length > 2000) {
			error = 'Notes must be 2000 characters or fewer.';
			return;
		}

		submitting = true;
		error = '';

		try {
			const formData = new FormData();
			formData.set('notes', notes);

			const response = await fetch(`/tasks/${taskId}?/reject`, {
				method: 'POST',
				body: formData
			});

			if (response.redirected) {
				window.location.href = response.url;
				return;
			}

			const result = await response.json();
			if (result?.type === 'error') {
				error = result.error?.message || 'Failed to send back for revision.';
				submitting = false;
				return;
			}

			// Success - reload the page
			window.location.reload();
		} catch {
			error = 'Something went wrong. Please try again.';
			submitting = false;
		}
	}

	function handleCancel() {
		notes = '';
		error = '';
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Request Revision</Dialog.Title>
			<Dialog.Description>
				Provide notes explaining what needs to be corrected. The data entry person will see
				these notes.
			</Dialog.Description>
		</Dialog.Header>

		<div class="flex flex-col gap-4 py-4">
			<div class="flex flex-col gap-2">
				<Label for="reject-notes">Revision Notes</Label>
				<Textarea
					id="reject-notes"
					bind:value={notes}
					placeholder="Explain what needs to be corrected..."
					rows={5}
					disabled={submitting}
				/>
				<p class="text-xs text-muted-foreground">
					{notes.length}/2000 characters
				</p>
			</div>

			{#if error}
				<p class="text-sm text-destructive">{error}</p>
			{/if}
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={handleCancel} disabled={submitting}>Cancel</Button>
			<Button
				variant="destructive"
				onclick={handleReject}
				disabled={submitting || !notes.trim()}
			>
				{submitting ? 'Sending...' : 'Send Back for Revision'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
