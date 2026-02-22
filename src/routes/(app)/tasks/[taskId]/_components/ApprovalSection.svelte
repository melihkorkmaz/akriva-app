<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import Check from '@lucide/svelte/icons/check';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import RejectDialog from './RejectDialog.svelte';

	interface Props {
		taskId: string;
		currentTier: number;
		totalTiers: number;
	}

	let { taskId, currentTier, totalTiers }: Props = $props();

	let approving = $state(false);
	let rejectDialogOpen = $state(false);

	let isFinalTier = $derived(currentTier >= totalTiers);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="flex items-center gap-2">
			<ShieldCheck class="size-5" />
			Review & Approve
		</Card.Title>
		<Card.Description>
			You are reviewing this submission as an approver.
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="flex flex-col gap-4">
			<!-- Tier indicator -->
			<div class="flex items-center gap-3">
				<span class="text-sm text-muted-foreground">Current Review Tier:</span>
				<div class="flex items-center gap-1.5">
					{#each Array(totalTiers) as _, i}
						<Badge
							variant={i < currentTier ? 'default' : 'outline'}
							class={i < currentTier ? 'bg-primary' : ''}
						>
							{i + 1}
						</Badge>
					{/each}
				</div>
				<span class="text-sm text-muted-foreground">
					Tier {currentTier} of {totalTiers}
				</span>
			</div>

			{#if isFinalTier}
				<p class="text-sm text-muted-foreground">
					This is the final approval tier. Approving will lock the emission entry and mark
					it as complete.
				</p>
			{/if}

			<!-- Action buttons -->
			<div class="flex items-center gap-3 pt-2">
				<form
					method="POST"
					action="/tasks/{taskId}?/approve"
					use:enhance={() => {
						approving = true;
						return async ({ update }) => {
							approving = false;
							await update();
						};
					}}
				>
					<Button type="submit" disabled={approving}>
						<Check class="mr-2 size-4" />
						{approving ? 'Approving...' : isFinalTier ? 'Approve & Lock' : 'Approve'}
					</Button>
				</form>

				<Button variant="destructive" onclick={() => (rejectDialogOpen = true)}>
					<RotateCcw class="mr-2 size-4" />
					Request Revision
				</Button>
			</div>
		</div>
	</Card.Content>
</Card.Root>

<RejectDialog bind:open={rejectDialogOpen} {taskId} />
