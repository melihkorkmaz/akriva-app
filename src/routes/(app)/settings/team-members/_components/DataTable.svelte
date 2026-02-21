<script lang="ts">
	import {
		type ColumnDef,
		type PaginationState,
		getCoreRowModel,
		getPaginationRowModel
	} from '@tanstack/table-core';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table';
	import * as Table from '$lib/components/ui/table';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import Shield from '@lucide/svelte/icons/shield';
	import Network from '@lucide/svelte/icons/network';
	import UserX from '@lucide/svelte/icons/user-x';
	import type { UserResponseDto } from '$lib/api/types.js';

	interface Props {
		columns: ColumnDef<UserResponseDto, unknown>[];
		data: UserResponseDto[];
		currentUserId: string;
		onChangeRole: (user: UserResponseDto) => void;
		onManageAssignments: (user: UserResponseDto) => void;
		onDeactivate: (user: UserResponseDto) => void;
	}

	let { columns, data, currentUserId, onChangeRole, onManageAssignments, onDeactivate }: Props =
		$props();

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 20 });

	const table = createSvelteTable({
		get data() {
			return data;
		},
		columns,
		state: {
			get pagination() {
				return pagination;
			}
		},
		onPaginationChange: (updater) => {
			pagination = typeof updater === 'function' ? updater(pagination) : updater;
		},
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel()
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
					{@const user = row.original}
					{@const isSelf = user.id === currentUserId}
					<Table.Row class={user.isActive ? '' : 'opacity-50'}>
						{#each row.getVisibleCells() as cell}
							<Table.Cell class="text-sm">
								<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
							</Table.Cell>
						{/each}
						<Table.Cell class="text-sm">
							{#if !isSelf && user.isActive}
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										{#snippet child({ props })}
											<Button variant="ghost" size="icon" class="size-8" {...props}>
												<Ellipsis class="size-4" />
											</Button>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end">
										<DropdownMenu.Item onclick={() => onChangeRole(user)}>
											<Shield class="size-4 mr-2" />
											Change Role
										</DropdownMenu.Item>
										<DropdownMenu.Item onclick={() => onManageAssignments(user)}>
											<Network class="size-4 mr-2" />
											Manage Assignments
										</DropdownMenu.Item>
										<DropdownMenu.Separator />
										<DropdownMenu.Item
											class="text-destructive focus:text-destructive"
											onclick={() => onDeactivate(user)}
										>
											<UserX class="size-4 mr-2" />
											Deactivate
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							{/if}
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell
							colspan={columns.length + 1}
							class="h-24 text-center text-sm text-muted-foreground"
						>
							No users found.
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	{#if table.getPageCount() > 1}
		<div class="flex items-center justify-between">
			<p class="text-sm text-muted-foreground">
				Page {pagination.pageIndex + 1} of {table.getPageCount()}
			</p>
			<div class="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					onclick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
				>
					Previous
				</Button>
				<Button
					variant="outline"
					size="sm"
					onclick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}
				>
					Next
				</Button>
			</div>
		</div>
	{/if}
</div>
