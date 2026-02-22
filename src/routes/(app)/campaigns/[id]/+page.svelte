<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { toast } from 'svelte-sonner';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Zap from '@lucide/svelte/icons/zap';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Gauge from '@lucide/svelte/icons/gauge';
	import Users from '@lucide/svelte/icons/users';
	import Layers from '@lucide/svelte/icons/layers';
	import Clock from '@lucide/svelte/icons/clock';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import type { CampaignTaskStatus, EmissionCategory } from '$lib/api/types.js';
	import { CAMPAIGN_STATUS_LABELS, EMISSION_CATEGORY_LABELS, CAMPAIGN_TASK_STATUS_LABELS } from '$lib/api/types.js';
	import TaskOverviewTable from '../_components/TaskOverviewTable.svelte';

	let { data } = $props();

	let campaign = $derived(data.campaign);
	let isDraft = $derived(campaign.status === 'draft');
	let isActive = $derived(campaign.status === 'active');

	// Activate dialog state
	let activateDialogOpen = $state(false);
	let activateSubmitting = $state(false);
	let activateError = $state('');

	// Delete dialog state
	let deleteDialogOpen = $state(false);
	let deleteSubmitting = $state(false);
	let deleteError = $state('');

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatDateTime(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Task status counts for progress
	let taskStatusCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const task of data.tasks) {
			counts[task.status] = (counts[task.status] || 0) + 1;
		}
		return counts;
	});

	let totalTasks = $derived(data.tasks.length);

	// Status badge for campaign
	function getCampaignStatusBadge(status: string) {
		if (status === 'draft') return { variant: 'secondary' as const, class: '' };
		if (status === 'active') return { variant: 'default' as const, class: 'bg-green-100 text-green-800 hover:bg-green-100' };
		return { variant: 'default' as const, class: 'bg-amber-100 text-amber-800 hover:bg-amber-100' };
	}

	let statusBadge = $derived(getCampaignStatusBadge(campaign.status));

	// Activate handler
	async function handleActivate() {
		activateSubmitting = true;
		activateError = '';

		const formData = new FormData();
		const response = await fetch('?/activate', {
			method: 'POST',
			body: formData
		});

		const result = await response.json();
		activateSubmitting = false;

		const actionData = result?.data?.[0] ?? result;

		if (actionData?.success === false) {
			activateError = actionData.error || 'Failed to activate campaign.';
			return;
		}

		activateDialogOpen = false;
		toast.success(`Campaign activated. ${actionData?.taskCount ?? ''} tasks created.`);
		await invalidateAll();
	}

	// Delete handler
	async function handleDelete() {
		deleteSubmitting = true;
		deleteError = '';

		const formData = new FormData();
		const response = await fetch('?/delete', {
			method: 'POST',
			body: formData
		});

		if (response.redirected) {
			toast.success('Campaign deleted successfully.');
			window.location.href = response.url;
			return;
		}

		const result = await response.json();
		deleteSubmitting = false;

		const actionData = result?.data?.[0] ?? result;

		if (actionData?.success === false) {
			deleteError = actionData.error || 'Failed to delete campaign.';
			return;
		}

		deleteDialogOpen = false;
		toast.success('Campaign deleted successfully.');
	}
</script>

<svelte:head>
	<title>{campaign.name} | Campaigns | Akriva</title>
</svelte:head>

<div class="flex flex-col gap-6 p-7 px-8">
	<!-- Breadcrumb -->
	<Breadcrumb.Root>
		<Breadcrumb.List>
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/campaigns">Campaigns</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Page>{campaign.name}</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>

	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<Button variant="ghost" size="icon" href="/campaigns">
				<ArrowLeft class="size-4" />
			</Button>
			<div class="flex items-center gap-3">
				<h1 class="text-2xl font-semibold">{campaign.name}</h1>
				<Badge variant={statusBadge.variant} class={statusBadge.class}>
					{CAMPAIGN_STATUS_LABELS[campaign.status]}
				</Badge>
			</div>
		</div>

		<div class="flex items-center gap-2">
			{#if isDraft}
				<Button variant="outline" href="/campaigns/{campaign.id}/edit">
					<Pencil class="size-4 mr-2" />
					Edit
				</Button>
				<Button onclick={() => (activateDialogOpen = true)}>
					<Zap class="size-4 mr-2" />
					Activate
				</Button>
				<Button
					variant="outline"
					class="text-destructive hover:text-destructive"
					onclick={() => {
						deleteError = '';
						deleteDialogOpen = true;
					}}
				>
					<Trash2 class="size-4 mr-2" />
					Delete
				</Button>
			{/if}
		</div>
	</div>

	<!-- Summary Cards Row -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
		<!-- Indicator -->
		<Card.Root>
			<Card.Content class="flex flex-col gap-2 p-4">
				<div class="flex items-center gap-2 text-xs text-muted-foreground">
					<Gauge class="size-3.5" />
					Indicator
				</div>
				{#if data.indicator}
					<p class="text-sm font-medium">{data.indicator.name}</p>
					<Badge variant="outline" class="w-fit text-xs">
						{EMISSION_CATEGORY_LABELS[data.indicator.emissionCategory as EmissionCategory] ?? data.indicator.emissionCategory}
					</Badge>
				{:else}
					<p class="text-sm text-muted-foreground">Unknown</p>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Period -->
		<Card.Root>
			<Card.Content class="flex flex-col gap-2 p-4">
				<div class="flex items-center gap-2 text-xs text-muted-foreground">
					<Calendar class="size-3.5" />
					Period
				</div>
				<p class="text-sm font-medium">
					{formatDate(campaign.periodStart)}
				</p>
				<p class="text-xs text-muted-foreground">
					to {formatDate(campaign.periodEnd)}
				</p>
			</Card.Content>
		</Card.Root>

		<!-- Approval Tiers -->
		<Card.Root>
			<Card.Content class="flex flex-col gap-2 p-4">
				<div class="flex items-center gap-2 text-xs text-muted-foreground">
					<Layers class="size-3.5" />
					Approval Tiers
				</div>
				<p class="text-2xl font-semibold">{campaign.approvalTiers}</p>
			</Card.Content>
		</Card.Root>

		<!-- Reporting Year -->
		<Card.Root>
			<Card.Content class="flex flex-col gap-2 p-4">
				<div class="flex items-center gap-2 text-xs text-muted-foreground">
					<Calendar class="size-3.5" />
					Reporting Year
				</div>
				<p class="text-2xl font-semibold">{campaign.reportingYear}</p>
			</Card.Content>
		</Card.Root>

		<!-- Org Units -->
		<Card.Root>
			<Card.Content class="flex flex-col gap-2 p-4">
				<div class="flex items-center gap-2 text-xs text-muted-foreground">
					<Users class="size-3.5" />
					Org Units
				</div>
				<p class="text-2xl font-semibold">{campaign.orgUnits.length}</p>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Created info -->
	<div class="flex items-center gap-4 text-xs text-muted-foreground">
		<div class="flex items-center gap-1.5">
			<Clock class="size-3.5" />
			Created {formatDateTime(campaign.createdAt)}
		</div>
	</div>

	<Separator />

	<!-- Task Overview Section -->
	{#if !isDraft}
		<div class="flex flex-col gap-4">
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-semibold">Task Overview</h2>
				{#if totalTasks > 0}
					<p class="text-sm text-muted-foreground">{totalTasks} total tasks</p>
				{/if}
			</div>

			<!-- Progress Stats -->
			{#if totalTasks > 0}
				<div class="flex flex-wrap items-center gap-3">
					{#each (['locked', 'approved', 'in_review', 'submitted', 'draft', 'pending', 'revision_requested'] as const) as status}
						{@const count = taskStatusCounts[status] || 0}
						{#if count > 0}
							<div class="flex items-center gap-1.5 text-sm">
								<span class="font-medium">{count}</span>
								<span class="text-muted-foreground">{CAMPAIGN_TASK_STATUS_LABELS[status]}</span>
							</div>
						{/if}
					{/each}
				</div>
			{/if}

			<TaskOverviewTable tasks={data.tasks} orgUnitNames={data.orgUnitNames} />
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12">
			<div class="flex size-12 items-center justify-center rounded-full bg-muted">
				<Zap class="size-6 text-muted-foreground" />
			</div>
			<h3 class="mt-4 text-lg font-semibold">Campaign not yet activated</h3>
			<p class="mt-1 text-sm text-muted-foreground">
				Activate this campaign to generate tasks for {campaign.orgUnits.length} org units.
			</p>
			<Button class="mt-4" onclick={() => (activateDialogOpen = true)}>
				<Zap class="size-4 mr-2" />
				Activate Campaign
			</Button>
		</div>
	{/if}
</div>

<!-- Activate Confirmation Dialog -->
<Dialog.Root bind:open={activateDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Zap class="size-5 text-primary" />
				Activate Campaign
			</Dialog.Title>
			<Dialog.Description>
				This will create tasks for <strong>{campaign.orgUnits.length}</strong> org units.
				Once activated, the campaign cannot be edited. Continue?
			</Dialog.Description>
		</Dialog.Header>

		{#if activateError}
			<Alert variant="destructive">
				<TriangleAlert class="size-4" />
				<AlertDescription>{activateError}</AlertDescription>
			</Alert>
		{/if}

		<Dialog.Footer>
			<Button
				variant="outline"
				onclick={() => (activateDialogOpen = false)}
				disabled={activateSubmitting}
			>
				Cancel
			</Button>
			<Button onclick={handleActivate} disabled={activateSubmitting}>
				{activateSubmitting ? 'Activating...' : 'Activate'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<TriangleAlert class="size-5 text-destructive" />
				Delete Campaign
			</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete <strong>{campaign.name}</strong>?
				This action cannot be undone.
			</Dialog.Description>
		</Dialog.Header>

		{#if deleteError}
			<Alert variant="destructive">
				<TriangleAlert class="size-4" />
				<AlertDescription>{deleteError}</AlertDescription>
			</Alert>
		{/if}

		<Dialog.Footer>
			<Button
				variant="outline"
				onclick={() => (deleteDialogOpen = false)}
				disabled={deleteSubmitting}
			>
				Cancel
			</Button>
			<Button variant="destructive" onclick={handleDelete} disabled={deleteSubmitting}>
				{deleteSubmitting ? 'Deleting...' : 'Delete'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
