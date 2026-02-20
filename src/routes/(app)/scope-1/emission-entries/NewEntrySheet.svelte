<script lang="ts">
  import * as Sheet from "$lib/components/ui/sheet";
  import * as Select from "$lib/components/ui/select";
  import * as RadioGroup from "$lib/components/ui/radio-group";
  import * as Field from "$lib/components/ui/field";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import DatePicker from "$components/DatePicker.svelte";
  import { cn } from "$lib/utils";
  import Upload from "@lucide/svelte/icons/upload";
  import Info from "@lucide/svelte/icons/info";

  let { open = $bindable(false) }: { open: boolean } = $props();

  let sourceMode = $state<"saved" | "adhoc">("saved");
  let selectedSource = $state("Main Office Boiler");
  let sourceName = $state("Main Office Boiler");
  let meterNumber = $state("MTR-2024-001");
  let fuelType = $state("Natural Gas");
  let amount = $state("");
  let unit = $state("m³");
  let startDate = $state("2025-01-01");
  let endDate = $state("2025-01-31");

  const sources = ["Main Office Boiler", "Warehouse Generator", "Lab Furnace A", "Backup Generator"];
  const fuelTypes = ["Natural Gas", "Diesel", "Propane", "Petrol", "Coal", "Biomass"];
  const units = ["m³", "L", "kg", "MWh", "GJ", "t"];

  function handleSourceChange(v: string | undefined) {
    selectedSource = v ?? "";
    sourceName = v ?? "";
  }

  function handleSourceModeChange(v: string) {
    sourceMode = v as "saved" | "adhoc";
    if (v === "adhoc") {
      sourceName = "";
      meterNumber = "";
    } else {
      sourceName = selectedSource;
      meterNumber = "MTR-2024-001";
    }
  }
</script>

<Sheet.Root bind:open>
  <Sheet.Content side="right" class="flex flex-col gap-0 p-0 sm:max-w-[576px] bg-card">

    <Sheet.Header class="border-b border-border px-6 py-5 gap-1 pr-12">
      <Sheet.Title class="text-lg font-semibold leading-tight">
        New Stationary Combustion Entry
      </Sheet.Title>
      <Sheet.Description class="text-sm text-muted-foreground">
        Scope 1 · Stationary Combustion
      </Sheet.Description>
    </Sheet.Header>

    <div class="flex-1 overflow-y-auto">
      <div class="divide-y divide-border">

        <!-- 1. Source Selection -->
        <div class="p-6">
          <Field.Set class="gap-4">
            <Field.Legend>Source Selection</Field.Legend>
            <Field.Description class="-mt-2">Choose how to identify this emission source</Field.Description>

            <RadioGroup.Root
              value={sourceMode}
              onValueChange={handleSourceModeChange}
              class="grid grid-cols-2 gap-3"
            >
              <label
                for="mode-saved"
                class={cn(
                  "flex flex-col gap-1.5 rounded-md p-4 cursor-pointer transition-all",
                  sourceMode === "saved"
                    ? "border-2 border-primary bg-primary/5"
                    : "border border-border bg-card hover:bg-muted/40",
                )}
              >
                <div class="flex items-center gap-2">
                  <RadioGroup.Item value="saved" id="mode-saved" class="shrink-0" />
                  <span class={cn("text-sm", sourceMode === "saved" ? "font-semibold" : "font-medium")}>
                    Saved Source
                  </span>
                </div>
                <p class="text-xs text-muted-foreground pl-[26px]">
                  Select from previously saved emission sources
                </p>
              </label>

              <label
                for="mode-adhoc"
                class={cn(
                  "flex flex-col gap-1.5 rounded-md p-4 cursor-pointer transition-all",
                  sourceMode === "adhoc"
                    ? "border-2 border-primary bg-primary/5"
                    : "border border-border bg-card hover:bg-muted/40",
                )}
              >
                <div class="flex items-center gap-2">
                  <RadioGroup.Item value="adhoc" id="mode-adhoc" class="shrink-0" />
                  <span class={cn("text-sm", sourceMode === "adhoc" ? "font-semibold" : "font-medium")}>
                    Ad-hoc Entry
                  </span>
                </div>
                <p class="text-xs text-muted-foreground pl-[26px]">
                  Enter source details manually for this entry
                </p>
              </label>
            </RadioGroup.Root>

            {#if sourceMode === "saved"}
              <div class="flex flex-col gap-2">
                <Label class="text-sm font-medium">Emission Source</Label>
                <Select.Root
                  type="single"
                  value={selectedSource ? { value: selectedSource, label: selectedSource } : undefined}
                  onValueChange={handleSourceChange}
                >
                  <Select.Trigger class="w-full">
                    <Select.Value placeholder="Select emission source" />
                  </Select.Trigger>
                  <Select.Content>
                    {#each sources as source}
                      <Select.Item value={source} label={source} />
                    {/each}
                  </Select.Content>
                </Select.Root>
              </div>
            {/if}
          </Field.Set>
        </div>

        <!-- 2. Asset Information -->
        <div class="p-6">
          <Field.Set class="gap-4">
            <Field.Legend>Asset Information</Field.Legend>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <Label class="text-sm font-medium">Source Name</Label>
                <Input
                  value={sourceName}
                  disabled={sourceMode === "saved"}
                  placeholder="Enter source name"
                  oninput={(e) => (sourceName = (e.target as HTMLInputElement).value)}
                />
              </div>
              <div class="flex flex-col gap-2">
                <Label class="text-sm font-medium">Meter Number</Label>
                <Input
                  value={meterNumber}
                  disabled={sourceMode === "saved"}
                  placeholder="MTR-XXXX-XXX"
                  oninput={(e) => (meterNumber = (e.target as HTMLInputElement).value)}
                />
                <p class="text-xs text-muted-foreground">Physical meter identifier (optional)</p>
              </div>
            </div>
          </Field.Set>
        </div>

        <!-- 3. Activity Data -->
        <div class="p-6">
          <Field.Set class="gap-4">
            <Field.Legend>Activity Data</Field.Legend>
            <Field.Description class="-mt-2">Fuel &amp; Consumption</Field.Description>
            <div class="grid grid-cols-3 gap-3">
              <div class="flex flex-col gap-2">
                <Label class="text-sm font-medium">Fuel Type</Label>
                <Select.Root
                  type="single"
                  value={fuelType ? { value: fuelType, label: fuelType } : undefined}
                  onValueChange={(v) => (fuelType = v ?? "")}
                >
                  <Select.Trigger class="w-full">
                    <Select.Value placeholder="Select fuel" />
                  </Select.Trigger>
                  <Select.Content>
                    {#each fuelTypes as fuel}
                      <Select.Item value={fuel} label={fuel} />
                    {/each}
                  </Select.Content>
                </Select.Root>
              </div>
              <div class="flex flex-col gap-2">
                <Label class="text-sm font-medium">Amount</Label>
                <Input
                  type="number"
                  bind:value={amount}
                  placeholder="0.00"
                  class="tabular-nums"
                  min="0"
                  step="0.01"
                />
              </div>
              <div class="flex flex-col gap-2">
                <Label class="text-sm font-medium">Unit</Label>
                <Select.Root
                  type="single"
                  value={unit ? { value: unit, label: unit } : undefined}
                  onValueChange={(v) => (unit = v ?? "")}
                >
                  <Select.Trigger class="w-full">
                    <Select.Value placeholder="Unit" />
                  </Select.Trigger>
                  <Select.Content>
                    {#each units as u}
                      <Select.Item value={u} label={u} />
                    {/each}
                  </Select.Content>
                </Select.Root>
              </div>
            </div>
          </Field.Set>
        </div>

        <!-- 4. Reporting Period -->
        <div class="p-6">
          <Field.Set class="gap-4">
            <Field.Legend>Reporting Period</Field.Legend>
            <div class="grid grid-cols-2 gap-4">
              <DatePicker label="Start Date" bind:value={startDate} placeholder="YYYY-MM-DD" />
              <DatePicker label="End Date" bind:value={endDate} placeholder="YYYY-MM-DD" />
            </div>
          </Field.Set>
        </div>

        <!-- 5. Evidence & Documentation -->
        <div class="p-6">
          <Field.Set class="gap-4">
            <Field.Legend>Evidence &amp; Documentation</Field.Legend>
            <Field.Description class="-mt-2">
              At least one evidence document is required for audit compliance
            </Field.Description>

            <div
              class="flex flex-col items-center justify-center gap-3 h-[120px] rounded-md border border-dashed border-border bg-muted/40 cursor-pointer transition-colors hover:bg-muted/60"
            >
              <Upload class="size-6 text-muted-foreground" />
              <div class="flex flex-col items-center gap-0.5 text-center">
                <span class="text-sm font-medium">Upload evidence document</span>
                <span class="text-xs text-muted-foreground">PDF, PNG, JPG up to 10MB</span>
              </div>
            </div>

            <div class="flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
              <Info class="size-4 text-primary mt-0.5 shrink-0" />
              <p class="text-xs text-primary leading-relaxed">
                File upload will be available in a future release. Evidence can be attached after the entry is created.
              </p>
            </div>
          </Field.Set>
        </div>

      </div>
    </div>

    <Sheet.Footer class="border-t border-border px-6 py-4">
      <div class="flex items-center justify-end gap-3">
        <Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
        <Button onclick={() => (open = false)}>Save Entry</Button>
      </div>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>
