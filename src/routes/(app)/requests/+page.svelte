<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import Plus from '@lucide/svelte/icons/plus';
	import type {
		DataCollectionRequestResponseDto,
		DataCollectionRequestStatus
	} from '$lib/api/types.js';
	import { DATA_COLLECTION_REQUEST_STATUS_LABELS } from '$lib/api/types.js';
	import DataTable from './_components/DataTable.svelte';
	import { columns } from './_components/columns.js';
	import CancelRequestDialog from './_components/CancelRequestDialog.svelte';

	let { data } = $props();

	// Cancel dialog state
	let cancelDialogOpen = $state(false);
	let selectedRequest = $state<DataCollectionRequestResponseDto | null>(null);

	// Status filter
	let statusFilter = $state(data.filters.status);

	const statuses: DataCollectionRequestStatus[] = [
		'open',
		'in_progress',
		'completed',
		'cancelled'
	];

	let statusFilterLabel = $derived(
		statusFilter
			? DATA_COLLECTION_REQUEST_STATUS_LABELS[statusFilter as DataCollectionRequestStatus]
			: 'All statuses'
	);

	function handleStatusFilter(value: string | undefined) {
		statusFilter = value === '__all__' ? '' : (value ?? '');
		applyFilters();
	}

	function applyFilters() {
		const params = new URLSearchParams();
		if (statusFilter) params.set('status', statusFilter);
		const query = params.toString();
		goto(`/requests${query ? `?${query}` : ''}`, { replaceState: true });
	}

	function openCancelDialog(request: DataCollectionRequestResponseDto) {
		selectedRequest = request;
		cancelDialogOpen = true;
	}

	// Pagination
	let totalPages = $derived(Math.ceil(data.total / data.filters.pageSize));

	function goToPage(page: number) {
		const params = new URLSearchParams();
		if (statusFilter) params.set('status', statusFilter);
		if (page > 1) params.set('page', String(page));
		const query = params.toString();
		goto(`/requests${query ? `?${query}` : ''}`, { replaceState: true });
	}
</script>

<svelte:head>
	<title>Data Collection Requests | Akriva</title>
</svelte:head>

<div class="flex flex-col gap-6 p-7 px-8">
	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div class="flex flex-col gap-1">
			<h1 class="text-2xl font-semibold">Data Collection Requests</h1>
			<p class="text-sm text-muted-foreground">
				Create and manage requests for emission data collection
			</p>
		</div>
		<Button href="/requests/new">
			<Plus class="size-4 mr-2" />
			New Request
		</Button>
	</div>

	<!-- Content -->
	<Card.Root>
		<Card.Content class="p-0">
			<!-- Filter Bar -->
			<div class="flex items-center gap-4 border-b border-border px-4 py-3">
				<Select.Root
					type="single"
					value={statusFilter || '__all__'}
					onValueChange={handleStatusFilter}
				>
					<Select.Trigger class="w-48">
						{statusFilterLabel}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="__all__">All statuses</Select.Item>
						{#each statuses as status}
							<Select.Item value={status}>
								{DATA_COLLECTION_REQUEST_STATUS_LABELS[status]}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				<span class="ml-auto text-sm text-muted-foreground">
					{data.total} request{data.total !== 1 ? 's' : ''}
				</span>
			</div>

			<!-- Data Table -->
			<div class="p-4">
				<DataTable {columns} data={data.requests} onCancel={openCancelDialog} />
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="flex items-center justify-between border-t border-border px-4 py-3">
					<p class="text-sm text-muted-foreground">
						Page {data.filters.page} of {totalPages}
					</p>
					<div class="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onclick={() => goToPage(data.filters.page - 1)}
							disabled={data.filters.page <= 1}
						>
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							onclick={() => goToPage(data.filters.page + 1)}
							disabled={data.filters.page >= totalPages}
						>
							Next
						</Button>
					</div>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>

<!-- Cancel Dialog -->
<CancelRequestDialog bind:open={cancelDialogOpen} request={selectedRequest} />
