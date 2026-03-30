<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import { Alert, AlertDescription } from "$lib/components/ui/alert/index.js";
  import { toast } from "svelte-sonner";
  import { invalidateAll } from "$app/navigation";
  import { deserialize } from "$app/forms";
  import TriangleAlert from "@lucide/svelte/icons/triangle-alert";
  import type {
    EmissionSourceResponseDto,
    EmissionCategory,
    FuelTypeDto,
  } from "$lib/api/types.js";
  import { EMISSION_CATEGORY_LABELS } from "$lib/api/types.js";

  let {
    open = $bindable(false),
    mode,
    orgUnitId,
    source,
  }: {
    open: boolean;
    mode: "create" | "edit";
    orgUnitId: string;
    source: EmissionSourceResponseDto | null;
  } = $props();

  let submitting = $state(false);
  let errorMessage = $state("");

  // Form fields
  let name = $state("");
  let category = $state<EmissionCategory | "">("");
  let fuelType = $state("");
  let meterNumber = $state("");
  let vehicleType = $state("");
  let technology = $state("");
  let isActive = $state(true);

  // Fuel types dropdown
  let fuelTypes = $state<FuelTypeDto[]>([]);
  let loadingFuelTypes = $state(false);

  // Categories that use fuel types
  let hasFuelType = $derived(category === "stationary" || category === "mobile");

  // Conditional field visibility
  let isMobile = $derived(category === "mobile");

  // Derived label for category select
  let categoryLabel = $derived(
    category
      ? EMISSION_CATEGORY_LABELS[category as EmissionCategory]
      : "Select category",
  );

  // Reset state when dialog opens
  $effect(() => {
    if (open) {
      errorMessage = "";
      if (mode === "edit" && source) {
        name = source.name;
        category = source.category;
        fuelType = source.fuelType ?? "";
        meterNumber = source.meterNumber ?? "";
        vehicleType = source.vehicleType ?? "";
        technology = source.technology ?? "";
        isActive = source.isActive;
      } else {
        name = "";
        category = "";
        fuelType = "";
        meterNumber = "";
        vehicleType = "";
        technology = "";
        isActive = true;
        fuelTypes = [];
      }
    }
  });

  // Fetch fuel types when category changes
  $effect(() => {
    if (!open || !category || !hasFuelType) return;

    loadingFuelTypes = true;
    fuelTypes = [];

    const qs = new URLSearchParams({ category });
    fetch(`/settings/organizational-tree/fuel-types?${qs}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: FuelTypeDto[]) => {
        fuelTypes = data;
      })
      .catch(() => {
        fuelTypes = [];
      })
      .finally(() => {
        loadingFuelTypes = false;
      });
  });

  async function handleSubmit() {
    if (!name) return;

    submitting = true;
    errorMessage = "";

    const formData = new FormData();

    if (mode === "create") {
      if (!category) return;
      if (hasFuelType && !fuelType) return;

      formData.set("orgUnitId", orgUnitId);
      formData.set("category", category);
      formData.set("name", name);
      if (fuelType) formData.set("fuelType", fuelType);
      if (meterNumber) formData.set("meterNumber", meterNumber);
      if (isMobile && vehicleType) formData.set("vehicleType", vehicleType);
      if (isMobile && technology) formData.set("technology", technology);
    } else if (mode === "edit" && source) {
      formData.set("sourceId", source.id);
      formData.set("name", name);
      if (meterNumber) formData.set("meterNumber", meterNumber);
      if (isMobile && vehicleType) formData.set("vehicleType", vehicleType);
      if (isMobile && technology) formData.set("technology", technology);
      formData.set("isActive", String(isActive));
    }

    const action = mode === "create" ? "?/createSource" : "?/updateSource";
    const response = await fetch(action, {
      method: "POST",
      body: formData,
    });

    const result = deserialize(await response.text());
    submitting = false;

    if (result.type === "failure" || result.type === "error") {
      // superforms message() stores the message inside the form object
      const data = result.type === "failure" ? result.data : undefined;
      const formObj = data ? Object.values(data as Record<string, unknown>).find(
        (v) => typeof v === "object" && v !== null && "message" in v
      ) as { message?: string } | undefined : undefined;
      errorMessage =
        formObj?.message ||
        (result.type === "error" ? result.error?.message : null) ||
        `Failed to ${mode} emission source.`;
      return;
    }

    open = false;
    toast.success(
      mode === "create"
        ? "Emission source created successfully."
        : "Emission source updated successfully.",
    );
    await invalidateAll();
  }

  let isCreateDisabled = $derived(
    submitting || !name || !category || (hasFuelType && !fuelType),
  );
  let isEditDisabled = $derived(submitting || !name);
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>
        {mode === "create" ? "New Emission Source" : "Edit Emission Source"}
      </Dialog.Title>
      <Dialog.Description>
        {mode === "create"
          ? "Add a new emission source to this organizational unit."
          : "Update emission source details."}
      </Dialog.Description>
    </Dialog.Header>

    {#if errorMessage}
      <Alert variant="destructive">
        <TriangleAlert class="size-4" />
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    {/if}

    <div class="flex flex-col gap-4 py-4">
      <!-- Name -->
      <div class="flex flex-col gap-2">
        <Label for="source-name">Name</Label>
        <Input
          id="source-name"
          placeholder="e.g. Main Boiler"
          bind:value={name}
        />
      </div>

      <!-- Category -->
      <div class="flex flex-col gap-2">
        <Label>Category</Label>
        {#if mode === "edit"}
          <Input
            value={category
              ? EMISSION_CATEGORY_LABELS[category as EmissionCategory]
              : ""}
            disabled
          />
        {:else}
          <Select.Root
            type="single"
            value={category}
            onValueChange={(val) => {
              if (val) {
                category = val as EmissionCategory;
                fuelType = "";
              }
            }}
          >
            <Select.Trigger class="w-full">
              {categoryLabel}
            </Select.Trigger>
            <Select.Content>
              {#each Object.entries(EMISSION_CATEGORY_LABELS) as [value, label]}
                <Select.Item {value}>{label}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        {/if}
      </div>

      <!-- Fuel Type (stationary & mobile only) -->
      {#if hasFuelType}
        <div class="flex flex-col gap-2">
          <Label>Fuel Type</Label>
          {#if mode === "edit"}
            <Input value={fuelType} disabled />
          {:else}
            <Select.Root
              type="single"
              value={fuelType}
              onValueChange={(val) => {
                if (val) fuelType = val;
              }}
              disabled={!category || loadingFuelTypes}
            >
              <Select.Trigger class="w-full">
                {#if loadingFuelTypes}
                  Loading fuel types...
                {:else if !category}
                  Select a category first
                {:else}
                  {fuelTypes.find((ft) => ft.id === fuelType)?.label ??
                    "Select fuel type"}
                {/if}
              </Select.Trigger>
              <Select.Content>
                {#each fuelTypes as ft}
                  <Select.Item value={ft.id}>{ft.label}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          {/if}
        </div>
      {/if}

      <!-- Meter Number / Licence -->
      <div class="flex flex-col gap-2">
        <Label for="source-meter"
          >{isMobile ? "Licence (Optional)" : "Meter Number (Optional)"}</Label
        >
        <Input
          id="source-meter"
          placeholder={isMobile ? "e.g. AB-123-CD" : "e.g. MTR-001"}
          bind:value={meterNumber}
        />
      </div>

      <!-- Vehicle Type (mobile only) -->
      {#if isMobile}
        <div class="flex flex-col gap-2">
          <Label for="source-vehicle">Vehicle Type (Optional)</Label>
          <Input
            id="source-vehicle"
            placeholder="e.g. Heavy Duty Truck"
            bind:value={vehicleType}
          />
        </div>

        <!-- Technology (mobile only) -->
        <div class="flex flex-col gap-2">
          <Label for="source-technology">Technology (Optional)</Label>
          <Input
            id="source-technology"
            placeholder="e.g. Gas Turbine"
            bind:value={technology}
          />
        </div>
      {/if}

      <!-- Status (edit mode only) -->
      {#if mode === "edit"}
        <div class="flex items-center justify-between">
          <div class="flex flex-col gap-0.5">
            <Label for="source-active">Active</Label>
            <p class="text-xs text-muted-foreground">
              Inactive sources cannot be used in new emission entries
            </p>
          </div>
          <Switch
            id="source-active"
            checked={isActive}
            onCheckedChange={(checked) => {
              isActive = !!checked;
            }}
          />
        </div>
      {/if}
    </div>

    <Dialog.Footer>
      <Button
        variant="outline"
        onclick={() => (open = false)}
        disabled={submitting}
      >
        Cancel
      </Button>
      <Button
        onclick={handleSubmit}
        disabled={mode === "create" ? isCreateDisabled : isEditDisabled}
      >
        {#if submitting}
          {mode === "create" ? "Creating..." : "Saving..."}
        {:else}
          {mode === "create" ? "Create Source" : "Save Changes"}
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
