<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import TaskCard from './_components/TaskCard.svelte';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import type { CampaignTask, CampaignTaskStatus } from '$lib/api/types.js';
	import { CAMPAIGN_TASK_STATUS_LABELS } from '$lib/api/types.js';

	let { data } = $props();

	// Build lookup maps
	let campaignMap = $derived(
		new Map(data.campaigns.map((c: any) => [c.id, c]))
	);

	let indicatorMap = $derived(
		new Map(data.indicators.map((ind: any) => [ind.id, ind]))
	);

	// Flatten org tree for name lookup
	function flattenOrgTree(nodes: any[]): Map<string, string> {
		const map = new Map<string, string>();
		function walk(nodes: any[]) {
			for (const node of nodes) {
				map.set(node.id, node.name);
				if (node.children?.length) walk(node.children);
			}
		}
		walk(nodes);
		return map;
	}

	let orgUnitMap = $derived(flattenOrgTree(data.orgTree));

	// Status filter
	let activeTab = $state('all');

	const STATUS_PRIORITY: Record<string, number> = {
		revision_requested: 0,
		pending: 1,
		draft: 2,
		in_review: 3,
		submitted: 4,
		approved: 5,
		locked: 6
	};

	const FILTER_TABS: { value: string; label: string }[] = [
		{ value: 'all', label: 'All' },
		{ value: 'pending', label: 'Pending' },
		{ value: 'draft', label: 'Draft' },
		{ value: 'in_review', label: 'In Review' },
		{ value: 'revision_requested', label: 'Revision Requested' },
		{ value: 'locked', label: 'Locked' }
	];

	let filteredTasks = $derived.by(() => {
		let tasks = data.tasks as CampaignTask[];

		// Filter by status
		if (activeTab !== 'all') {
			tasks = tasks.filter((t) => t.status === activeTab);
		}

		// Sort by priority
		return tasks.toSorted((a, b) => {
			const pa = STATUS_PRIORITY[a.status] ?? 99;
			const pb = STATUS_PRIORITY[b.status] ?? 99;
			return pa - pb;
		});
	});

	function getTaskCount(status: string): number {
		if (status === 'all') return data.tasks.length;
		return (data.tasks as CampaignTask[]).filter((t) => t.status === status).length;
	}
</script>

<svelte:head>
	<title>My Tasks | Akriva</title>
</svelte:head>

<div class="flex flex-col gap-6 p-7 px-8">
	<!-- Page Header -->
	<div class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold">My Tasks</h1>
		<p class="text-sm text-muted-foreground">
			View and manage your assigned data collection tasks
		</p>
	</div>

	<!-- Status Filter Tabs -->
	<Tabs.Root bind:value={activeTab}>
		<Tabs.List>
			{#each FILTER_TABS as tab}
				<Tabs.Trigger value={tab.value}>
					{tab.label}
					{@const count = getTaskCount(tab.value)}
					{#if count > 0}
						<span class="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
							{count}
						</span>
					{/if}
				</Tabs.Trigger>
			{/each}
		</Tabs.List>
	</Tabs.Root>

	<!-- Task Cards or Empty State -->
	{#if filteredTasks.length > 0}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each filteredTasks as task (task.id)}
				{@const campaign = campaignMap.get(task.campaignId)}
				{@const indicator = campaign ? indicatorMap.get(campaign.indicatorId) : null}
				{@const orgUnitName = orgUnitMap.get(task.orgUnitId) ?? 'Unknown'}
				<TaskCard
					{task}
					campaignName={campaign?.name ?? 'Unknown Campaign'}
					indicatorName={indicator?.name ?? ''}
					{orgUnitName}
					periodStart={campaign?.periodStart ?? ''}
					periodEnd={campaign?.periodEnd ?? ''}
				/>
			{/each}
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
			<div class="flex size-12 items-center justify-center rounded-full bg-muted">
				<ListChecks class="size-6 text-muted-foreground" />
			</div>
			<h3 class="mt-4 text-lg font-semibold">No tasks found</h3>
			<p class="mt-1 text-sm text-muted-foreground">
				{#if activeTab === 'all'}
					You don't have any tasks assigned yet.
				{:else}
					No tasks with status "{CAMPAIGN_TASK_STATUS_LABELS[activeTab as CampaignTaskStatus] ?? activeTab}".
				{/if}
			</p>
		</div>
	{/if}
</div>
