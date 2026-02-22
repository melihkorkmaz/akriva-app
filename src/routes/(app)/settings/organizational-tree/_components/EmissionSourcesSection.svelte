<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import Plus from '@lucide/svelte/icons/plus';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Flame from '@lucide/svelte/icons/flame';
	import type { EmissionSourceResponseDto } from '$lib/api/types.js';
	import { EMISSION_CATEGORY_LABELS } from '$lib/api/types.js';
	import EmissionSourceDialog from './EmissionSourceDialog.svelte';

	let {
		orgUnitId,
		sources
	}: {
		orgUnitId: string;
		sources: EmissionSourceResponseDto[];
	} = $props();

	// Dialog state
	let dialogOpen = $state(false);
	let dialogMode = $state<'create' | 'edit'>('create');
	let editingSource = $state<EmissionSourceResponseDto | null>(null);

	// Delete confirmation state
	let deleteDialogOpen = $state(false);
	let deletingSource = $state<EmissionSourceResponseDto | null>(null);
	let deleting = $state(false);

	function handleAdd() {
		dialogMode = 'create';
		editingSource = null;
		dialogOpen = true;
	}

	function handleEdit(source: EmissionSourceResponseDto) {
		dialogMode = 'edit';
		editingSource = source;
		dialogOpen = true;
	}

	function handleDeleteClick(source: EmissionSourceResponseDto) {
		deletingSource = source;
		deleteDialogOpen = true;
	}

	async function handleDeleteConfirm() {
		if (!deletingSource) return;

		deleting = true;
		const formData = new FormData();
		formData.set('sourceId', deletingSource.id);

		const response = await fetch('?/deleteSource', {
			method: 'POST',
			body: formData
		});

		const result = await response.json();
		deleting = false;

		// SvelteKit form action responses are wrapped in a data array
		const data = result?.data?.[0] ?? result;

		if (data?.success) {
			deleteDialogOpen = false;
			toast.success('Emission source deleted successfully.');
			await invalidateAll();
		} else {
			toast.error(data?.error || 'Failed to delete emission source.');
			deleteDialogOpen = false;
		}
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between">
		<div class="flex flex-col gap-1">
			<div class="flex items-center gap-2">
				<Flame class="size-5 text-muted-foreground" />
				<h2 class="text-lg font-semibold">Emission Sources</h2>
			</div>
			<p class="text-sm text-muted-foreground">
				Manage emission sources assigned to this organizational unit
			</p>
		</div>
		<Button variant="outline" size="sm" onclick={handleAdd}>
			<Plus class="size-4 mr-1" />
			Add Source
		</Button>
	</div>

	{#if sources.length === 0}
		<div class="rounded-md border border-dashed p-8 text-center">
			<Flame class="size-8 text-muted-foreground mx-auto mb-3" />
			<p class="text-sm font-medium text-muted-foreground">No emission sources</p>
			<p class="text-xs text-muted-foreground mt-1">
				Add emission sources to track emissions for this unit
			</p>
		</div>
	{:else}
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head>Category</Table.Head>
						<Table.Head>Meter #</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each sources as source (source.id)}
						<Table.Row>
							<Table.Cell class="font-medium">{source.name}</Table.Cell>
							<Table.Cell>
								{EMISSION_CATEGORY_LABELS[source.category] ?? source.category}
							</Table.Cell>
							<Table.Cell class="text-muted-foreground">
								{source.meterNumber || '--'}
							</Table.Cell>
							<Table.Cell>
								<Badge variant={source.isActive ? 'default' : 'secondary'}>
									{source.isActive ? 'Active' : 'Inactive'}
								</Badge>
							</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex items-center justify-end gap-1">
									<Button
										variant="ghost"
										size="icon"
										class="size-8"
										onclick={() => handleEdit(source)}
									>
										<Pencil class="size-3.5" />
										<span class="sr-only">Edit</span>
									</Button>
									<Button
										variant="ghost"
										size="icon"
										class="size-8 text-destructive hover:text-destructive"
										onclick={() => handleDeleteClick(source)}
									>
										<Trash2 class="size-3.5" />
										<span class="sr-only">Delete</span>
									</Button>
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>

<EmissionSourceDialog
	bind:open={dialogOpen}
	mode={dialogMode}
	{orgUnitId}
	source={editingSource}
/>

<!-- Delete Confirmation Dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<TriangleAlert class="size-5 text-destructive" />
				Delete Emission Source
			</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete <strong>{deletingSource?.name}</strong>?
				This action cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (deleteDialogOpen = false)} disabled={deleting}>
				Cancel
			</Button>
			<Button variant="destructive" onclick={handleDeleteConfirm} disabled={deleting}>
				{deleting ? 'Deleting...' : 'Delete'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
