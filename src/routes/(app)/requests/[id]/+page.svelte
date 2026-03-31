<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import XCircle from "@lucide/svelte/icons/x-circle";
  import type { DataCollectionRequestResponseDto } from "$lib/api/types.js";
  import {
    DATA_COLLECTION_REQUEST_STATUS_LABELS,
    DATA_COLLECTION_TASK_STATUS_LABELS,
  } from "$lib/api/types.js";
  import type {
    DataCollectionRequestStatus,
    DataCollectionTaskStatus,
  } from "$lib/api/types.js";
  import CancelRequestDialog from "../_components/CancelRequestDialog.svelte";

  let { data } = $props();
  let request = $derived(data.request);

  // Cancel dialog state
  let cancelDialogOpen = $state(false);

  const requestStatusClasses: Record<DataCollectionRequestStatus, string> = {
    open: "bg-blue-50 text-blue-700 border-blue-200",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-slate-100 text-slate-600 border-slate-300",
  };

  const taskStatusClasses: Record<DataCollectionTaskStatus, string> = {
    pending: "bg-slate-100 text-slate-600 border-slate-300",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-slate-100 text-slate-600 border-slate-300",
  };

  let canCancel = $derived(
    request.status === "open" || request.status === "in_progress",
  );

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
</script>

<svelte:head>
  <title>{request.title} | Requests | Akriva</title>
</svelte:head>

<div class="flex flex-col gap-6 p-7 px-8">
  <!-- Back link -->
  <a
    href="/requests"
    class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
  >
    <ArrowLeft class="size-4" />
    Back to Requests
  </a>

  <!-- Page Header -->
  <div class="flex items-center justify-between">
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-semibold">{request.title}</h1>
        <Badge variant="outline" class={requestStatusClasses[request.status]}>
          {DATA_COLLECTION_REQUEST_STATUS_LABELS[request.status]}
        </Badge>
      </div>
    </div>
    {#if canCancel}
      <Button variant="destructive" onclick={() => (cancelDialogOpen = true)}>
        <XCircle class="size-4 mr-2" />
        Cancel Request
      </Button>
    {/if}
  </div>

  <!-- Request Info -->
  <Card.Root>
    <Card.Content class="p-4">
      <div class="grid grid-cols-4 gap-4">
        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium text-muted-foreground">Deadline</span
          >
          <span class="text-sm">{formatDate(request.deadline)}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium text-muted-foreground">Progress</span
          >
          <span class="text-sm"
            >{request.completedTaskCount}/{request.taskCount} completed</span
          >
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium text-muted-foreground">Created</span>
          <span class="text-sm">{formatDateTime(request.createdAt)}</span>
        </div>
        {#if request.cancelledAt}
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-muted-foreground"
              >Cancelled</span
            >
            <span class="text-sm">{formatDateTime(request.cancelledAt)}</span>
          </div>
        {/if}
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Tasks -->
  <Card.Root>
    <Card.Header>
      <Card.Title>Tasks</Card.Title>
      <Card.Description>
        {request.completedTaskCount} of {request.taskCount} tasks completed
      </Card.Description>
    </Card.Header>
    <Card.Content class="p-0">
      <div class="rounded-b-xl border-t border-border">
        <Table.Root>
          <Table.Header>
            <Table.Row class="hover:bg-transparent">
              <Table.Head class="text-xs font-medium text-muted-foreground">
                Emission Source
              </Table.Head>
              <Table.Head class="text-xs font-medium text-muted-foreground">
                Facility
              </Table.Head>
              <Table.Head class="text-xs font-medium text-muted-foreground">
                Status
              </Table.Head>
              <Table.Head class="text-xs font-medium text-muted-foreground">
                Completed
              </Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each request.tasks as task (task.id)}
              <Table.Row>
                <Table.Cell class="text-sm font-medium">
                  {task.emissionSourceName || task.emissionSourceId}
                </Table.Cell>
                <Table.Cell class="text-sm text-muted-foreground">
                  {task.orgUnitName || task.orgUnitId}
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="outline" class={taskStatusClasses[task.status]}>
                    {DATA_COLLECTION_TASK_STATUS_LABELS[task.status]}
                  </Badge>
                </Table.Cell>
                <Table.Cell class="text-sm text-muted-foreground">
                  {task.completedAt ? formatDateTime(task.completedAt) : "—"}
                </Table.Cell>
              </Table.Row>
            {:else}
              <Table.Row>
                <Table.Cell
                  colspan={4}
                  class="h-24 text-center text-sm text-muted-foreground"
                >
                  No tasks found.
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>
    </Card.Content>
  </Card.Root>
</div>

<!-- Cancel Dialog -->
<CancelRequestDialog bind:open={cancelDialogOpen} {request} />
