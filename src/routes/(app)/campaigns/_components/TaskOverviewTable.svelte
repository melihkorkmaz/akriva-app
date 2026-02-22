<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Eye from '@lucide/svelte/icons/eye';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import type { CampaignTask } from '$lib/api/types.js';
	import { CAMPAIGN_TASK_STATUS_LABELS, CAMPAIGN_TASK_STATUS_BADGE_CLASSES } from '$lib/api/types.js';

	interface Props {
		tasks: CampaignTask[];
		orgUnitNames: Record<string, string>;
	}

	let { tasks, orgUnitNames }: Props = $props();


	function formatDate(dateString: string | null): string {
		if (!dateString) return '\u2014';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

{#if tasks.length > 0}
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Org Unit</Table.Head>
				<Table.Head>Status</Table.Head>
				<Table.Head>Current Tier</Table.Head>
				<Table.Head>Submitted At</Table.Head>
				<Table.Head>Approved At</Table.Head>
				<Table.Head class="text-right">Actions</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each tasks as task (task.id)}
				<Table.Row>
					<Table.Cell class="font-medium">
						{orgUnitNames[task.orgUnitId] ?? task.orgUnitId}
					</Table.Cell>
					<Table.Cell>
						<Badge class={CAMPAIGN_TASK_STATUS_BADGE_CLASSES[task.status]}>
							{CAMPAIGN_TASK_STATUS_LABELS[task.status]}
						</Badge>
					</Table.Cell>
					<Table.Cell>
						{task.currentTier}
					</Table.Cell>
					<Table.Cell>
						{formatDate(task.submittedAt)}
					</Table.Cell>
					<Table.Cell>
						{formatDate(task.approvedAt)}
					</Table.Cell>
					<Table.Cell class="text-right">
						<Button variant="ghost" size="sm" href="/tasks/{task.id}">
							<Eye class="size-3.5 mr-1.5" />
							View
						</Button>
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
{:else}
	<div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12">
		<div class="flex size-12 items-center justify-center rounded-full bg-muted">
			<ClipboardList class="size-6 text-muted-foreground" />
		</div>
		<h3 class="mt-4 text-lg font-semibold">No tasks created yet</h3>
		<p class="mt-1 text-sm text-muted-foreground">
			Activate this campaign to generate tasks.
		</p>
	</div>
{/if}
