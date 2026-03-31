<script lang="ts">
	import {
		type ColumnDef,
		getCoreRowModel
	} from '@tanstack/table-core';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table';
	import * as Table from '$lib/components/ui/table';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import Eye from '@lucide/svelte/icons/eye';
	import XCircle from '@lucide/svelte/icons/x-circle';
	import type { DataCollectionRequestResponseDto } from '$lib/api/types.js';
	import { goto } from '$app/navigation';

	interface Props {
		columns: ColumnDef<DataCollectionRequestResponseDto, unknown>[];
		data: DataCollectionRequestResponseDto[];
		onCancel: (request: DataCollectionRequestResponseDto) => void;
	}

	let { columns, data, onCancel }: Props = $props();

	const table = createSvelteTable({
		get data() {
			return data;
		},
		columns,
		getCoreRowModel: getCoreRowModel()
	});
</script>

<div class="flex flex-col gap-4">
	<div class="rounded-xl border border-border bg-background">
		<Table.Root>
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup}
					<Table.Row class="hover:bg-transparent">
						{#each headerGroup.headers as header}
							<Table.Head class="text-xs font-medium text-muted-foreground">
								{#if !header.isPlaceholder}
									<FlexRender
										content={header.column.columnDef.header}
										context={header.getContext()}
									/>
								{/if}
							</Table.Head>
						{/each}
						<Table.Head class="w-12"></Table.Head>
					</Table.Row>
				{/each}
			</Table.Header>
			<Table.Body>
				{#each table.getRowModel().rows as row}
					{@const request = row.original}
					{@const canCancel = request.status === 'open' || request.status === 'in_progress'}
					<Table.Row
						class="cursor-pointer"
						onclick={() => goto(`/requests/${request.id}`)}
					>
						{#each row.getVisibleCells() as cell}
							<Table.Cell class="text-sm">
								<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
							</Table.Cell>
						{/each}
						<Table.Cell class="text-sm">
							<DropdownMenu.Root>
								<DropdownMenu.Trigger>
									{#snippet child({ props })}
										<Button
											variant="ghost"
											size="icon"
											class="size-8"
											{...props}
											onclick={(e: MouseEvent) => e.stopPropagation()}
										>
											<Ellipsis class="size-4" />
										</Button>
									{/snippet}
								</DropdownMenu.Trigger>
								<DropdownMenu.Content align="end">
									<DropdownMenu.Item onclick={() => goto(`/requests/${request.id}`)}>
										<Eye class="size-4 mr-2" />
										View Details
									</DropdownMenu.Item>
									{#if canCancel}
										<DropdownMenu.Separator />
										<DropdownMenu.Item
											class="text-destructive focus:text-destructive"
											onclick={(e: Event) => {
												e.stopPropagation();
												onCancel(request);
											}}
										>
											<XCircle class="size-4 mr-2" />
											Cancel Request
										</DropdownMenu.Item>
									{/if}
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell
							colspan={columns.length + 1}
							class="h-24 text-center text-sm text-muted-foreground"
						>
							No requests found.
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>
