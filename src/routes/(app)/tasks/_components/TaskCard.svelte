<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Play from '@lucide/svelte/icons/play';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Eye from '@lucide/svelte/icons/eye';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import type { CampaignTask, CampaignTaskStatus } from '$lib/api/types.js';
	import { CAMPAIGN_TASK_STATUS_LABELS } from '$lib/api/types.js';

	interface Props {
		task: CampaignTask;
		campaignName: string;
		indicatorName: string;
		orgUnitName: string;
		periodStart: string;
		periodEnd: string;
	}

	let { task, campaignName, indicatorName, orgUnitName, periodStart, periodEnd }: Props = $props();

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
		task.status === 'pending'
			? ('secondary' as const)
			: task.status === 'revision_requested'
				? ('destructive' as const)
				: ('default' as const)
	);

	let badgeClass = $derived(STATUS_BADGE_CLASSES[task.status]);

	interface ActionConfig {
		label: string;
		icon: typeof Play;
		variant: 'default' | 'outline' | 'secondary';
	}

	let actionConfig = $derived.by((): ActionConfig => {
		switch (task.status) {
			case 'pending':
				return { label: 'Start', icon: Play, variant: 'default' };
			case 'draft':
				return { label: 'Continue', icon: Pencil, variant: 'default' };
			case 'revision_requested':
				return { label: 'Revise', icon: RotateCcw, variant: 'default' };
			default:
				return { label: 'View', icon: Eye, variant: 'outline' };
		}
	});

	function formatDate(dateString: string) {
		if (!dateString) return '';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<Card.Root class="transition-shadow hover:shadow-md">
	<Card.Header class="pb-3">
		<div class="flex items-start justify-between gap-2">
			<div class="min-w-0">
				<Card.Title class="truncate text-base font-semibold">
					{orgUnitName}
				</Card.Title>
				<p class="mt-0.5 truncate text-sm text-muted-foreground">
					{campaignName}
				</p>
			</div>
			<Badge variant={badgeVariant} class={badgeClass}>
				{CAMPAIGN_TASK_STATUS_LABELS[task.status]}
			</Badge>
		</div>
	</Card.Header>

	<Card.Content class="pt-0">
		<div class="flex flex-col gap-2">
			{#if indicatorName}
				<div class="flex items-center gap-2 text-sm">
					<span class="text-muted-foreground">Indicator:</span>
					<span class="truncate font-medium">{indicatorName}</span>
				</div>
			{/if}
			{#if periodStart && periodEnd}
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
					<Calendar class="size-3.5" />
					<span>{formatDate(periodStart)} - {formatDate(periodEnd)}</span>
				</div>
			{/if}
			{#if task.submittedAt}
				<div class="text-xs text-muted-foreground">
					Submitted: {formatDate(task.submittedAt)}
				</div>
			{/if}
		</div>
	</Card.Content>

	<Card.Footer class="border-t border-border pt-4">
		<Button
			variant={actionConfig.variant}
			size="sm"
			href="/tasks/{task.id}"
		>
			<actionConfig.icon class="mr-1.5 size-3.5" />
			{actionConfig.label}
		</Button>
	</Card.Footer>
</Card.Root>
