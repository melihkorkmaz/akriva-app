<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { toast } from 'svelte-sonner';
	import Plus from '@lucide/svelte/icons/plus';
	import Megaphone from '@lucide/svelte/icons/megaphone';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Eye from '@lucide/svelte/icons/eye';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import type { IndicatorResponseDto, CampaignStatus, EmissionCategory } from '$lib/api/types.js';
	import { CAMPAIGN_STATUS_LABELS, EMISSION_CATEGORY_LABELS } from '$lib/api/types.js';

	let { data } = $props();

	// Build indicator lookup map
	let indicatorMap = $derived(
		new Map<string, IndicatorResponseDto>(data.indicators.map((ind: IndicatorResponseDto) => [ind.id, ind]))
	);

	// Build available reporting years from campaigns
	let availableYears = $derived.by((): number[] => {
		const years = new Set<number>(data.campaigns.map((c: { reportingYear: number }) => c.reportingYear));
		const currentYear = new Date().getFullYear();
		years.add(currentYear);
		return [...years].sort((a: number, b: number) => b - a);
	});

	// Filter state from server data
	let statusFilter = $state(data.filters.status);
	let yearFilter = $state(data.filters.reportingYear);

	// Delete confirmation state
	let deleteDialogOpen = $state(false);
	let deletingCampaign = $state<{ id: string; name: string } | null>(null);
	let deleteSubmitting = $state(false);
	let deleteError = $state('');

	function applyFilters() {
		const params = new URLSearchParams();
		if (statusFilter) params.set('status', statusFilter);
		if (yearFilter) params.set('reportingYear', yearFilter);
		const query = params.toString();
		goto(`/campaigns${query ? `?${query}` : ''}`, { replaceState: true });
	}

	function handleStatusFilter(value: string | undefined) {
		statusFilter = value === '__all__' ? '' : (value ?? '');
		applyFilters();
	}

	function handleYearFilter(value: string | undefined) {
		yearFilter = value === '__all__' ? '' : (value ?? '');
		applyFilters();
	}

	let statusFilterLabel = $derived(
		statusFilter
			? CAMPAIGN_STATUS_LABELS[statusFilter as CampaignStatus]
			: 'All statuses'
	);

	let yearFilterLabel = $derived(yearFilter || 'All years');

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function openDeleteDialog(campaign: { id: string; name: string }) {
		deletingCampaign = campaign;
		deleteError = '';
		deleteDialogOpen = true;
	}

	async function handleDelete() {
		if (!deletingCampaign) return;

		deleteSubmitting = true;
		deleteError = '';

		const formData = new FormData();
		formData.set('id', deletingCampaign.id);

		const response = await fetch('?/delete', {
			method: 'POST',
			body: formData
		});

		const result = await response.json();
		deleteSubmitting = false;

		// Parse SvelteKit action response
		const actionData = result?.data?.[0] ?? result;

		if (actionData?.success === false) {
			deleteError = actionData.error || 'Failed to delete campaign.';
			return;
		}

		deleteDialogOpen = false;
		toast.success('Campaign deleted successfully.');
		await invalidateAll();
	}

	const statuses: CampaignStatus[] = ['draft', 'active', 'closed'];
</script>

<svelte:head>
	<title>Campaigns | Akriva</title>
</svelte:head>

<div class="flex flex-col gap-6 p-7 px-8">
	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div class="flex flex-col gap-1">
			<h1 class="text-2xl font-semibold">Campaigns</h1>
			<p class="text-sm text-muted-foreground">
				Manage data collection campaigns for emission reporting
			</p>
		</div>
		<Button href="/campaigns/new">
			<Plus class="size-4 mr-2" />
			New Campaign
		</Button>
	</div>

	<!-- Filter Bar -->
	<div class="flex items-center gap-4">
		<Select.Root
			type="single"
			value={statusFilter || '__all__'}
			onValueChange={handleStatusFilter}
		>
			<Select.Trigger class="w-44">
				{statusFilterLabel}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="__all__">All statuses</Select.Item>
				{#each statuses as status}
					<Select.Item value={status}>{CAMPAIGN_STATUS_LABELS[status]}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>

		<Select.Root
			type="single"
			value={yearFilter || '__all__'}
			onValueChange={handleYearFilter}
		>
			<Select.Trigger class="w-40">
				{yearFilterLabel}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="__all__">All years</Select.Item>
				{#each availableYears as year}
					<Select.Item value={String(year)}>{year}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<!-- Campaign Grid or Empty State -->
	{#if data.campaigns.length > 0}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.campaigns as campaign (campaign.id)}
				{@const indicator = indicatorMap.get(campaign.indicatorId)}
				{@const isDraft = campaign.status === 'draft'}
				<Card.Root class="transition-shadow hover:shadow-md">
					<Card.Header class="pb-3">
						<div class="flex items-start justify-between gap-2">
							<Card.Title class="text-base font-semibold truncate min-w-0">
								{campaign.name}
							</Card.Title>
							{#if campaign.status === 'draft'}
								<Badge variant="secondary" class="shrink-0">Draft</Badge>
							{:else if campaign.status === 'active'}
								<Badge class="shrink-0 bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
							{:else if campaign.status === 'closed'}
								<Badge class="shrink-0 bg-amber-100 text-amber-800 hover:bg-amber-100">Closed</Badge>
							{/if}
						</div>
					</Card.Header>

					<Card.Content class="pt-0">
						<div class="flex flex-col gap-2">
							{#if indicator}
								<div class="flex items-center gap-2 text-sm">
									<span class="text-muted-foreground">Indicator:</span>
									<span class="font-medium truncate">{indicator.name}</span>
								</div>
								<div class="flex items-center gap-2">
									<Badge variant="outline" class="text-xs">
										{EMISSION_CATEGORY_LABELS[indicator.emissionCategory as EmissionCategory] ?? indicator.emissionCategory}
									</Badge>
								</div>
							{/if}
							<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
								<Calendar class="size-3.5" />
								<span>{formatDate(campaign.periodStart)} - {formatDate(campaign.periodEnd)}</span>
							</div>
							<div class="text-xs text-muted-foreground">
								Reporting Year: {campaign.reportingYear}
							</div>
						</div>
					</Card.Content>

					<Card.Footer class="flex items-center gap-2 border-t border-border pt-4">
						<Button variant="outline" size="sm" href="/campaigns/{campaign.id}">
							<Eye class="size-3.5 mr-1.5" />
							View
						</Button>
						{#if isDraft}
							<Button variant="outline" size="sm" href="/campaigns/{campaign.id}/edit">
								<Pencil class="size-3.5 mr-1.5" />
								Edit
							</Button>
							<Button
								variant="outline"
								size="sm"
								class="text-destructive hover:text-destructive"
								onclick={() => openDeleteDialog({ id: campaign.id, name: campaign.name })}
							>
								<Trash2 class="size-3.5 mr-1.5" />
								Delete
							</Button>
						{/if}
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
			<div class="flex size-12 items-center justify-center rounded-full bg-muted">
				<Megaphone class="size-6 text-muted-foreground" />
			</div>
			<h3 class="mt-4 text-lg font-semibold">No campaigns yet</h3>
			<p class="mt-1 text-sm text-muted-foreground">
				Create your first campaign to start collecting emission data.
			</p>
			<Button class="mt-4" href="/campaigns/new">
				<Plus class="size-4 mr-2" />
				New Campaign
			</Button>
		</div>
	{/if}
</div>

<!-- Delete Confirmation Dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<TriangleAlert class="size-5 text-destructive" />
				Delete Campaign
			</Dialog.Title>
			<Dialog.Description>
				{#if deletingCampaign}
					Are you sure you want to delete <strong>{deletingCampaign.name}</strong>?
					This action cannot be undone.
				{/if}
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
