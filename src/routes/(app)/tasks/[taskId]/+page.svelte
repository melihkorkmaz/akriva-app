<script lang="ts">
	import { enhance } from '$app/forms';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Play from '@lucide/svelte/icons/play';
	import Lock from '@lucide/svelte/icons/lock';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Calendar from '@lucide/svelte/icons/calendar';
	import type { CampaignTaskStatus } from '$lib/api/types.js';
	import { CAMPAIGN_TASK_STATUS_LABELS } from '$lib/api/types.js';
	import { emissionEntrySchema } from '$lib/schemas/emission-entry.js';
	import ActivityDataSection from './_components/ActivityDataSection.svelte';
	import EvidenceSection from './_components/EvidenceSection.svelte';

	let { data } = $props();

	const entryFormObj = superForm(data.entryForm, {
		validators: zod4Client(emissionEntrySchema),
		dataType: 'json'
	});
	const { form: entryForm } = entryFormObj;

	let starting = $state(false);

	const STATUS_BADGE_CLASSES: Record<CampaignTaskStatus, string> = {
		pending: '',
		draft: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
		submitted: 'bg-sky-100 text-sky-800 hover:bg-sky-100',
		in_review: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
		revision_requested: '',
		approved: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
		locked: 'bg-green-100 text-green-800 hover:bg-green-100'
	};

	let badgeVariant = $derived(
		data.task.status === 'pending'
			? ('secondary' as const)
			: data.task.status === 'revision_requested'
				? ('destructive' as const)
				: ('default' as const)
	);

	let isEditable = $derived(
		data.task.status === 'draft' || data.task.status === 'revision_requested'
	);

	function formatDate(dateString: string) {
		if (!dateString) return '';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{data.orgUnitName} - {data.campaign.name} | Akriva</title>
</svelte:head>

<div class="flex max-w-4xl flex-col gap-6 p-7 px-8">
	<!-- Back link -->
	<a
		href="/tasks"
		class="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
	>
		<ArrowLeft class="size-4" />
		Back to My Tasks
	</a>

	<!-- Header -->
	<div class="flex flex-col gap-4">
		<div class="flex items-start justify-between gap-4">
			<div class="flex flex-col gap-1">
				<h1 class="text-2xl font-semibold">{data.orgUnitName}</h1>
				<p class="text-sm text-muted-foreground">{data.campaign.name}</p>
			</div>
			<Badge variant={badgeVariant} class={STATUS_BADGE_CLASSES[data.task.status]}>
				{CAMPAIGN_TASK_STATUS_LABELS[data.task.status]}
			</Badge>
		</div>

		<!-- Summary info -->
		<div class="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
			{#if data.indicator}
				<div>
					<span class="font-medium text-foreground">Indicator:</span>
					{data.indicator.name}
				</div>
			{/if}
			<div class="flex items-center gap-1.5">
				<Calendar class="size-3.5" />
				<span
					>{formatDate(data.campaign.periodStart)} - {formatDate(
						data.campaign.periodEnd
					)}</span
				>
			</div>
			{#if data.campaign.approvalTiers}
				<div>
					<span class="font-medium text-foreground">Approval Tiers:</span>
					{data.campaign.approvalTiers}
				</div>
			{/if}
		</div>
	</div>

	<Separator />

	<!-- Status-based content -->
	{#if data.task.status === 'pending'}
		<!-- Pending: Start button -->
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12">
				<div class="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
					<Play class="size-8 text-primary" />
				</div>
				<h3 class="text-lg font-semibold">Ready to start</h3>
				<p class="mt-1 mb-6 max-w-md text-center text-sm text-muted-foreground">
					Click the button below to begin data entry for this task. This will create a
					draft emission entry.
				</p>
				<form
					method="POST"
					action="?/start"
					use:enhance={() => {
						starting = true;
						return async ({ update }) => {
							starting = false;
							await update();
						};
					}}
				>
					<Button type="submit" disabled={starting}>
						<Play class="mr-2 size-4" />
						{starting ? 'Starting...' : 'Start Task'}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>
	{:else if data.task.status === 'locked'}
		<!-- Locked: read-only banner -->
		<Alert>
			<Lock class="size-4" />
			<AlertDescription>
				This task has been locked and approved. All data is read-only.
				{#if data.task.lockedAt}
					Locked on {formatDate(data.task.lockedAt)}.
				{/if}
			</AlertDescription>
		</Alert>

		{#if data.indicator}
			<ActivityDataSection
				superform={entryFormObj}
				form={entryForm}
				category={data.indicator.emissionCategory}
				calculationMethod={data.indicator.calculationMethod}
				sources={data.emissionSources}
				readonly={true}
			/>
		{/if}

		<EvidenceSection taskId={data.task.id} existingEvidence={[]} readonly={true} />
	{:else if data.task.status === 'in_review' || data.task.status === 'submitted' || data.task.status === 'approved'}
		<!-- In Review: read-only data + approval -->
		<Alert>
			<AlertDescription>
				This task is currently under review. Data is read-only during the approval process.
				{#if data.task.currentTier}
					Currently at approval tier {data.task.currentTier} of {data.campaign
						.approvalTiers}.
				{/if}
			</AlertDescription>
		</Alert>

		{#if data.indicator}
			<ActivityDataSection
				superform={entryFormObj}
				form={entryForm}
				category={data.indicator.emissionCategory}
				calculationMethod={data.indicator.calculationMethod}
				sources={data.emissionSources}
				readonly={true}
			/>
		{/if}

		<EvidenceSection taskId={data.task.id} existingEvidence={[]} readonly={true} />

		<!-- Placeholder for approval section (Task 16) -->
	{:else if isEditable}
		<!-- Draft / Revision Requested: editable -->
		{#if data.task.status === 'revision_requested'}
			<Alert variant="destructive">
				<TriangleAlert class="size-4" />
				<AlertDescription>
					Changes have been requested. Please review the feedback and update your data
					before resubmitting.
				</AlertDescription>
			</Alert>
		{/if}

		{#if data.indicator}
			<ActivityDataSection
				superform={entryFormObj}
				form={entryForm}
				category={data.indicator.emissionCategory}
				calculationMethod={data.indicator.calculationMethod}
				sources={data.emissionSources}
			/>
		{/if}

		<EvidenceSection taskId={data.task.id} existingEvidence={[]} />

		<!-- Placeholder for CalculationPreview (Task 15) -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Calculation Preview</Card.Title>
			</Card.Header>
			<Card.Content>
				<p class="text-sm text-muted-foreground">
					Calculation results will be displayed here.
				</p>
			</Card.Content>
		</Card.Root>

		<!-- Placeholder for sticky footer (Task 17) -->
	{/if}
</div>
