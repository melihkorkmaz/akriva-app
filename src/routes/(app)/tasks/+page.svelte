<script lang="ts">
  import { goto } from "$app/navigation";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import type {
    DataCollectionTaskResponseDto,
    DataCollectionTaskStatus,
    EmissionCategory,
  } from "$lib/api/types.js";
  import {
    DATA_COLLECTION_TASK_STATUS_LABELS,
    EMISSION_CATEGORY_LABELS,
  } from "$lib/api/types.js";
  import TaskStatusBadge from "./_components/TaskStatusBadge.svelte";
  import TaskEntrySheet from "./_components/TaskEntrySheet.svelte";

  let { data } = $props();

  // Sheet state
  let sheetOpen = $state(false);
  let selectedTask = $state<DataCollectionTaskResponseDto | null>(null);

  // Status filter
  let statusFilter = $state(data.filters.status);

  const statuses: DataCollectionTaskStatus[] = [
    "pending",
    "in_progress",
    "submitted",
    "approved",
    "revision_needed",
    "cancelled",
  ];

  let statusFilterLabel = $derived(
    statusFilter
      ? DATA_COLLECTION_TASK_STATUS_LABELS[
          statusFilter as DataCollectionTaskStatus
        ]
      : "All statuses",
  );

  function handleStatusFilter(value: string | undefined) {
    statusFilter = value === "__all__" ? "" : (value ?? "");
    applyFilters();
  }

  function applyFilters() {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const query = params.toString();
    goto(`/tasks${query ? `?${query}` : ""}`, { replaceState: true });
  }

  const editableStatuses: DataCollectionTaskStatus[] = [
    "pending",
    "in_progress",
    "revision_needed",
  ];

  function isTaskActionable(task: DataCollectionTaskResponseDto): boolean {
    return (
      editableStatuses.includes(task.status) &&
      task.emissionSourceCategory === "stationary"
    );
  }

  function handleRowClick(task: DataCollectionTaskResponseDto) {
    if (isTaskActionable(task)) {
      selectedTask = task;
      sheetOpen = true;
    }
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Pagination
  let totalPages = $derived(Math.ceil(data.total / data.filters.pageSize));

  function goToPage(page: number) {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    goto(`/tasks${query ? `?${query}` : ""}`, { replaceState: true });
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
      View and process your assigned data collection tasks
    </p>
  </div>

  <!-- Content -->
  <Card.Root>
    <Card.Content class="p-0">
      <!-- Filter Bar -->
      <div class="flex items-center gap-4 border-b border-border px-4 py-3">
        <Select.Root
          type="single"
          value={statusFilter || "__all__"}
          onValueChange={handleStatusFilter}
        >
          <Select.Trigger class="w-48">
            {statusFilterLabel}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__all__">All statuses</Select.Item>
            {#each statuses as status}
              <Select.Item value={status}>
                {DATA_COLLECTION_TASK_STATUS_LABELS[status]}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>

        <span class="ml-auto text-sm text-muted-foreground">
          {data.total} task{data.total !== 1 ? "s" : ""}
        </span>
      </div>

      <!-- Table -->
      <div class="rounded-b-xl">
        <Table.Root>
          <Table.Header>
            <Table.Row class="hover:bg-transparent">
              <Table.Head class="text-xs font-medium text-muted-foreground">
                Emission Source
              </Table.Head>
              <Table.Head class="text-xs font-medium text-muted-foreground">
                Category
              </Table.Head>
              <Table.Head class="text-xs font-medium text-muted-foreground">
                Facility
              </Table.Head>
              <Table.Head class="text-xs font-medium text-muted-foreground">
                Status
              </Table.Head>
              <Table.Head class="text-xs font-medium text-muted-foreground">
                Created
              </Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each data.tasks as task (task.id)}
              <Table.Row
                class={isTaskActionable(task)
                  ? "cursor-pointer hover:bg-muted/50"
                  : ""}
                onclick={() => handleRowClick(task)}
              >
                <Table.Cell class="text-sm font-medium">
                  {task.emissionSourceName || task.emissionSourceId}
                </Table.Cell>
                <Table.Cell class="text-sm text-muted-foreground">
                  {task.emissionSourceCategory
                    ? EMISSION_CATEGORY_LABELS[
                        task.emissionSourceCategory as EmissionCategory
                      ]
                    : "—"}
                </Table.Cell>
                <Table.Cell class="text-sm text-muted-foreground">
                  {task.orgUnitName || task.orgUnitId}
                </Table.Cell>
                <Table.Cell>
                  <TaskStatusBadge status={task.status} />
                </Table.Cell>
                <Table.Cell class="text-sm text-muted-foreground">
                  {formatDate(task.createdAt)}
                </Table.Cell>
              </Table.Row>
            {:else}
              <Table.Row>
                <Table.Cell
                  colspan={5}
                  class="h-24 text-center text-sm text-muted-foreground"
                >
                  No tasks found.
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div
          class="flex items-center justify-between border-t border-border px-4 py-3"
        >
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

<!-- Task Entry Sheet -->
<TaskEntrySheet bind:open={sheetOpen} task={selectedTask} />
