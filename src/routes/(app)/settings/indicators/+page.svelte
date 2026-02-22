<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import Plus from '@lucide/svelte/icons/plus';
	import Gauge from '@lucide/svelte/icons/gauge';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import type { IndicatorResponseDto } from '$lib/api/types.js';
	import {
		EMISSION_CATEGORY_LABELS,
		CALCULATION_METHOD_LABELS
	} from '$lib/api/types.js';
	import type { EmissionCategory, CalculationMethod } from '$lib/api/types.js';
	import IndicatorDialog from './_components/IndicatorDialog.svelte';

	let { data } = $props();

	// Dialog state
	let dialogOpen = $state(false);
	let dialogMode = $state<'create' | 'edit'>('create');
	let editingIndicator = $state<IndicatorResponseDto | null>(null);

	// Delete confirmation state
	let deleteDialogOpen = $state(false);
	let deletingIndicator = $state<IndicatorResponseDto | null>(null);
	let deleteSubmitting = $state(false);
	let deleteError = $state('');

	function openCreateDialog() {
		editingIndicator = null;
		dialogMode = 'create';
		dialogOpen = true;
	}

	function openEditDialog(indicator: IndicatorResponseDto) {
		editingIndicator = indicator;
		dialogMode = 'edit';
		dialogOpen = true;
	}

	function openDeleteDialog(indicator: IndicatorResponseDto) {
		deletingIndicator = indicator;
		deleteError = '';
		deleteDialogOpen = true;
	}

	async function handleDelete() {
		if (!deletingIndicator) return;

		deleteSubmitting = true;
		deleteError = '';

		const formData = new FormData();
		formData.set('id', deletingIndicator.id);

		const response = await fetch('?/delete', {
			method: 'POST',
			body: formData
		});

		const result = await response.json();
		deleteSubmitting = false;

		const responseData = result?.data?.[0] ?? result;

		if (responseData?.status && responseData.status >= 400) {
			deleteError = responseData.message || 'Failed to delete indicator.';
			return;
		}

		deleteDialogOpen = false;
		toast.success('Indicator deleted successfully.');
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Indicators | Settings | Akriva</title>
</svelte:head>

<div class="flex flex-col gap-6 p-7 px-8">
	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div class="flex flex-col gap-1">
			<h1 class="text-2xl font-semibold">Indicators</h1>
			<p class="text-sm text-muted-foreground">
				Manage emission indicators used in data collection campaigns
			</p>
		</div>
		<Button onclick={openCreateDialog}>
			<Plus class="size-4 mr-2" />
			New Indicator
		</Button>
	</div>

	<!-- Table or Empty State -->
	{#if data.indicators.length > 0}
		<Card.Root>
			<Card.Content class="p-0">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Name</Table.Head>
							<Table.Head>Category</Table.Head>
							<Table.Head>Method</Table.Head>
							<Table.Head>Fuel Type</Table.Head>
							<Table.Head>Gas Type</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head class="w-[100px]">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.indicators as indicator (indicator.id)}
							<Table.Row>
								<Table.Cell class="font-medium">{indicator.name}</Table.Cell>
								<Table.Cell>
									{EMISSION_CATEGORY_LABELS[indicator.emissionCategory as EmissionCategory] ?? indicator.emissionCategory}
								</Table.Cell>
								<Table.Cell>
									{CALCULATION_METHOD_LABELS[indicator.calculationMethod as CalculationMethod] ?? indicator.calculationMethod}
								</Table.Cell>
								<Table.Cell class="text-muted-foreground">
									{indicator.defaultFuelType ?? '—'}
								</Table.Cell>
								<Table.Cell class="text-muted-foreground">
									{indicator.defaultGasType ?? '—'}
								</Table.Cell>
								<Table.Cell>
									{#if indicator.isActive}
										<Badge variant="default">Active</Badge>
									{:else}
										<Badge variant="secondary">Inactive</Badge>
									{/if}
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-1">
										{#if !indicator.isGlobal}
											<Button
												variant="ghost"
												size="icon"
												class="size-8"
												onclick={() => openEditDialog(indicator)}
											>
												<Pencil class="size-3.5" />
												<span class="sr-only">Edit</span>
											</Button>
											<Button
												variant="ghost"
												size="icon"
												class="size-8 text-destructive hover:text-destructive"
												onclick={() => openDeleteDialog(indicator)}
											>
												<Trash2 class="size-3.5" />
												<span class="sr-only">Delete</span>
											</Button>
										{/if}
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
			<div class="flex size-12 items-center justify-center rounded-full bg-muted">
				<Gauge class="size-6 text-muted-foreground" />
			</div>
			<h3 class="mt-4 text-lg font-semibold">No indicators yet</h3>
			<p class="mt-1 text-sm text-muted-foreground">
				Create your first indicator to define emission measurement parameters.
			</p>
			<Button class="mt-4" onclick={openCreateDialog}>
				<Plus class="size-4 mr-2" />
				New Indicator
			</Button>
		</div>
	{/if}
</div>

<!-- Create/Edit Dialog -->
<IndicatorDialog
	bind:open={dialogOpen}
	mode={dialogMode}
	indicator={editingIndicator}
/>

<!-- Delete Confirmation Dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<TriangleAlert class="size-5 text-destructive" />
				Delete Indicator
			</Dialog.Title>
			<Dialog.Description>
				{#if deletingIndicator}
					Are you sure you want to delete <strong>{deletingIndicator.name}</strong>?
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
