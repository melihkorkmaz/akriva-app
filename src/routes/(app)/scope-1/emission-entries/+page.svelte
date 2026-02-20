<script lang="ts">
  import OrgTree from "../../settings/organizational-tree/_components/OrgTree.svelte";
  import { Button } from "$lib/components/ui/button";
  import * as Popover from "$lib/components/ui/popover";
  import * as Card from "$lib/components/ui/card";
  import * as Tabs from "$lib/components/ui/tabs";
  import { RangeCalendar } from "$lib/components/ui/range-calendar";
  import DataTable from "./data-table.svelte";
  import { columns, type EmissionEntry } from "./columns";
  import NewEntrySheet from "./NewEntrySheet.svelte";
  import Plus from "@lucide/svelte/icons/plus";
  import Calendar from "@lucide/svelte/icons/calendar";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import Building2 from "@lucide/svelte/icons/building-2";
  import Flame from "@lucide/svelte/icons/flame";
  import Truck from "@lucide/svelte/icons/truck";
  import Wind from "@lucide/svelte/icons/wind";
  import Settings from "@lucide/svelte/icons/settings";
  import { CalendarDate, DateFormatter } from "@internationalized/date";
  import type { Component } from "svelte";
  import type { DateRange } from "bits-ui";
  import type { OrgUnitTreeResponseDto } from "$lib/api";

  const categories: { id: string; label: string; icon: Component }[] = [
    { id: "stationary", label: "Stationary", icon: Flame },
    { id: "mobile", label: "Mobile", icon: Truck },
    { id: "fugitive", label: "Fugitive", icon: Wind },
    { id: "process", label: "Process", icon: Settings },
  ];

  let { data } = $props();

  let selectedNode = $state<OrgUnitTreeResponseDto | null>(null);
  let activeTab = $state("stationary");
  let newEntryOpen = $state(false);

  let dateRange = $state<DateRange>({
    start: new CalendarDate(2025, 1, 1),
    end: new CalendarDate(2025, 12, 31),
  });

  const df = new DateFormatter("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  let dateRangeLabel = $derived.by(() => {
    if (dateRange.start && dateRange.end) {
      return `${df.format(dateRange.start.toDate("UTC"))} \u2013 ${df.format(dateRange.end.toDate("UTC"))}`;
    }
    return "Select date range";
  });

  // Mock emission entries
  const mockEntries: EmissionEntry[] = [
    {
      id: "1",
      source: "Main Office Boiler",
      fuelType: "Natural Gas",
      amount: "1,250.00 m\u00B3",
      period: "Jan 1 \u2013 Jan 31, 2025",
      emissions: "2.51 tCO\u2082e",
      status: "verified",
    },
    {
      id: "2",
      source: "Warehouse Generator",
      fuelType: "Diesel",
      amount: "430.00 L",
      period: "Jan 1 \u2013 Jan 31, 2025",
      emissions: "1.14 tCO\u2082e",
      status: "verified",
    },
    {
      id: "3",
      source: "Lab Furnace A",
      fuelType: "Propane",
      amount: "85.50 kg",
      period: "Feb 1 \u2013 Feb 28, 2025",
      emissions: "0.26 tCO\u2082e",
      status: "pending",
    },
    {
      id: "4",
      source: "Main Office Boiler",
      fuelType: "Natural Gas",
      amount: "1,180.00 m\u00B3",
      period: "Feb 1 \u2013 Feb 28, 2025",
      emissions: "2.37 tCO\u2082e",
      status: "verified",
    },
    {
      id: "5",
      source: "Warehouse Generator",
      fuelType: "Diesel",
      amount: "510.00 L",
      period: "Feb 1 \u2013 Feb 28, 2025",
      emissions: "1.35 tCO\u2082e",
      status: "draft",
    },
    {
      id: "6",
      source: "Backup Generator",
      fuelType: "Diesel",
      amount: "120.00 L",
      period: "Mar 1 \u2013 Mar 31, 2025",
      emissions: "0.32 tCO\u2082e",
      status: "draft",
    },
    {
      id: "7",
      source: "Lab Furnace A",
      fuelType: "Propane",
      amount: "92.00 kg",
      period: "Mar 1 \u2013 Mar 31, 2025",
      emissions: "0.28 tCO\u2082e",
      status: "pending",
    },
    {
      id: "8",
      source: "Main Office Boiler",
      fuelType: "Natural Gas",
      amount: "1,100.00 m\u00B3",
      period: "Mar 1 \u2013 Mar 31, 2025",
      emissions: "2.21 tCO\u2082e",
      status: "verified",
    },
    {
      id: "9",
      source: "Fleet Vehicle A",
      fuelType: "Petrol",
      amount: "340.00 L",
      period: "Jan 1 \u2013 Jan 31, 2025",
      emissions: "0.79 tCO\u2082e",
      status: "verified",
    },
    {
      id: "10",
      source: "Fleet Vehicle B",
      fuelType: "Diesel",
      amount: "280.00 L",
      period: "Jan 1 \u2013 Jan 31, 2025",
      emissions: "0.74 tCO\u2082e",
      status: "pending",
    },
    {
      id: "11",
      source: "Warehouse Generator",
      fuelType: "Diesel",
      amount: "475.00 L",
      period: "Mar 1 \u2013 Mar 31, 2025",
      emissions: "1.26 tCO\u2082e",
      status: "draft",
    },
    {
      id: "12",
      source: "Main Office Boiler",
      fuelType: "Natural Gas",
      amount: "1,320.00 m\u00B3",
      period: "Apr 1 \u2013 Apr 30, 2025",
      emissions: "2.65 tCO\u2082e",
      status: "pending",
    },
  ];

  function handleSelect(node: OrgUnitTreeResponseDto) {
    selectedNode = node;
  }
</script>

<svelte:head>
  <title>Emission Entries | Akriva</title>
</svelte:head>

<div class="flex h-full">
  <OrgTree
    tree={data.tree}
    selectedId={selectedNode?.id ?? null}
    onSelect={handleSelect}
    showActions={false}
  />

  <NewEntrySheet bind:open={newEntryOpen} />

  <div class="flex-1 overflow-y-auto bg-secondary">
    {#if selectedNode}
      <div class="flex flex-col gap-6 p-7 px-8">
        <!-- Page Header -->
        <div class="flex items-center justify-between">
          <div class="flex flex-col gap-1">
            <h1 class="text-2xl font-semibold">Emission Entries</h1>
            <p class="text-sm text-muted-foreground">
              {selectedNode.name} &middot; Scope 1 emissions data
            </p>
          </div>
          <Button onclick={() => (newEntryOpen = true)}>
            <Plus class="size-4" />
            New Entry
          </Button>
        </div>

        <!-- Filter Bar + Data Table -->
        <Card.Root class="overflow-hidden">
          <Card.Content class="p-0">
            <Tabs.Root value={activeTab} onValueChange={(v) => (activeTab = v ?? activeTab)}>
              <!-- Tabs header row -->
              <div class="flex items-center justify-between border-b border-border px-4 py-3">
                <Tabs.List>
                  {#each categories as cat}
                    <Tabs.Trigger value={cat.id} class="gap-1.5">
                      <cat.icon class="size-3.5" />
                      {cat.label}
                    </Tabs.Trigger>
                  {/each}
                </Tabs.List>

                <Popover.Root>
                  <Popover.Trigger>
                    {#snippet child({ props })}
                      <Button
                        variant="outline"
                        size="sm"
                        class="gap-2 text-[13px] font-normal"
                        {...props}
                      >
                        <Calendar class="size-3.5 text-muted-foreground" />
                        <span>{dateRangeLabel}</span>
                        <ChevronDown class="size-3.5 text-muted-foreground" />
                      </Button>
                    {/snippet}
                  </Popover.Trigger>
                  <Popover.Content align="end" class="w-auto p-0">
                    <RangeCalendar bind:value={dateRange} numberOfMonths={2} />
                  </Popover.Content>
                </Popover.Root>
              </div>

              <!-- Table per tab -->
              {#each categories as cat}
                <Tabs.Content value={cat.id} class="mt-0 overflow-x-auto p-4">
                  <DataTable data={mockEntries} {columns} />
                </Tabs.Content>
              {/each}
            </Tabs.Root>
          </Card.Content>
        </Card.Root>
      </div>
    {:else}
      <!-- Empty State: No organization selected -->
      <div class="flex h-full items-center justify-center">
        <div class="flex flex-col items-center gap-4">
          <div class="flex size-14 items-center justify-center rounded-full bg-muted">
            <Building2 class="size-7 text-muted-foreground" />
          </div>
          <div class="flex flex-col items-center gap-1.5">
            <h2 class="text-base font-semibold">No organization selected</h2>
            <p class="max-w-[320px] text-center text-sm text-muted-foreground">
              Select an organizational unit from the tree to view its Scope 1 emission entries
            </p>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
