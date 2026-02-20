<script lang="ts">
  import { untrack } from "svelte";
  import { superForm } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import { toast } from "svelte-sonner";
  import { invalidateAll } from "$app/navigation";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import TriangleAlert from "@lucide/svelte/icons/triangle-alert";
  import Lock from "@lucide/svelte/icons/lock";
  import Info from "@lucide/svelte/icons/info";
  import CountrySelect from "$components/CountrySelect.svelte";
  import {
    createOrgUnitSchema,
    updateOrgUnitSchema,
  } from "$lib/schemas/org-unit.js";
  import DeleteDialog from "./DeleteDialog.svelte";
  import type {
    OrgUnitTreeResponseDto,
    TenantSettingsResponseDto,
  } from "$lib/api/types.js";

  let {
    mode,
    node = null,
    parentId = null,
    createFormData,
    updateFormData,
    tenantSettings,
    allNodes,
    onCreated,
    onDeleted,
    onCancel,
  }: {
    mode: "create" | "edit";
    node: OrgUnitTreeResponseDto | null;
    parentId: string | null;
    createFormData: any;
    updateFormData: any;
    tenantSettings: TenantSettingsResponseDto;
    allNodes: { id: string; name: string }[];
    onCreated: (id: string) => void;
    onDeleted: () => void;
    onCancel: () => void;
  } = $props();

  // --- Constants ---
  const typeLabels: Record<string, string> = {
    subsidiary: "Subsidiary",
    division: "Division",
    facility: "Facility",
  };

  const AUTHORITY_OPTIONS = [
    { value: "ipcc", label: "IPCC Guidelines" },
    { value: "defra", label: "DEFRA" },
    { value: "epa", label: "EPA" },
    { value: "iea", label: "IEA" },
    { value: "egrid", label: "eGRID" },
  ];

  const GWP_LABELS: Record<string, string> = {
    ar5: "IPCC AR5",
    ar6: "IPCC AR6 (Latest)",
  };

  // --- Create form ---
  const createSuperform = superForm(createFormData, {
    id: "create-org-unit",
    validators: zod4Client(createOrgUnitSchema),
    dataType: "json",
    resetForm: true,
    onUpdated({ form }) {
      if (form.message) {
        if (form.valid) {
          try {
            const parsed = JSON.parse(form.message);
            if (parsed.success && parsed.id) {
              toast.success("Organizational unit created successfully.");
              invalidateAll().then(() => onCreated(parsed.id));
              return;
            }
          } catch {
            // Not JSON — treat as plain message
          }
          toast.success(form.message);
        } else {
          toast.error(form.message);
        }
      }
    },
    onError({ result }) {
      const msg =
        typeof result.error === "string"
          ? result.error
          : "An unexpected error occurred.";
      toast.error(msg);
    },
  });
  const {
    form: createForm,
    enhance: createEnhance,
    submitting: createSubmitting,
  } = createSuperform;

  // Set parentId when entering create mode.
  $effect(() => {
    if (mode === "create") {
      const pid = parentId;
      untrack(() => {
        $createForm.parentId = pid;
      });
    }
  });

  // --- Update form ---
  const updateSuperform = superForm(updateFormData, {
    id: "update-org-unit",
    validators: zod4Client(updateOrgUnitSchema),
    dataType: "json",
    resetForm: false,
    onUpdated({ form }) {
      if (form.message) {
        if (form.valid) {
          toast.success(form.message);
          invalidateAll();
        } else {
          toast.error(form.message);
        }
      }
    },
    onError({ result }) {
      const msg =
        typeof result.error === "string"
          ? result.error
          : "An unexpected error occurred.";
      toast.error(msg);
    },
  });
  const {
    form: updateForm,
    enhance: updateEnhance,
    submitting: updateSubmitting,
  } = updateSuperform;

  // Local UI state for equity share override checkbox (not a form field)
  let overrideEquity = $state(false);

  // Populate update form when node changes.
  $effect(() => {
    if (mode === "edit") {
      const n = node;
      untrack(() => {
        if (!n) {
          overrideEquity = false;
          return;
        }
        $updateForm.name = n.name;
        $updateForm.description = n.description;
        $updateForm.equitySharePercentage = n.equitySharePercentage;
        $updateForm.status = n.status;
        $updateForm.country = n.country;
        $updateForm.stateProvince = n.stateProvince;
        $updateForm.city = n.city;
        $updateForm.overrideScientificAuthority =
          n.overrideScientificAuthority;
        $updateForm.scope1Authority = n.overrideScientificAuthority
          ? n.effectiveScope1Authority
          : null;
        $updateForm.scope2Authority = n.overrideScientificAuthority
          ? n.effectiveScope2Authority
          : null;
        overrideEquity = n.equitySharePercentage !== null;
      });
    }
  });

  // Derived labels for authority dropdowns
  let scope1Label = $derived(
    AUTHORITY_OPTIONS.find((o) => o.value === $updateForm.scope1Authority)
      ?.label ?? "",
  );
  let scope2Label = $derived(
    AUTHORITY_OPTIONS.find((o) => o.value === $updateForm.scope2Authority)
      ?.label ?? "",
  );

  // Delete dialog state
  let deleteDialogOpen = $state(false);
</script>

{#if mode === "create"}
  <!-- CREATE MODE -->
  <h1 class="text-xl font-semibold">New Organizational Unit</h1>

  <form method="POST" action="?/create" use:createEnhance>
    <div class="flex flex-col gap-6 mt-4">
      <Card.Root>
        <Card.Content class="pt-6">
          <div class="flex flex-col gap-5">
            <!-- Parent -->
            <Form.Field form={createSuperform} name="parentId">
              <Form.Control>
                {#snippet children({ props })}
                  <Form.Label>Parent</Form.Label>
                  <Select.Root
                    type="single"
                    value={$createForm.parentId ?? "__root__"}
                    onValueChange={(val) => {
                      $createForm.parentId =
                        val === "__root__" ? null : (val ?? null);
                    }}
                  >
                    <Select.Trigger {...props} class="w-full">
                      {$createForm.parentId
                        ? (allNodes.find((n) => n.id === $createForm.parentId)
                            ?.name ?? "Unknown")
                        : "None (root node)"}
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="__root__"
                        >None (root node)</Select.Item
                      >
                      {#each allNodes as orgNode}
                        <Select.Item value={orgNode.id}
                          >{orgNode.name}</Select.Item
                        >
                      {/each}
                    </Select.Content>
                  </Select.Root>
                {/snippet}
              </Form.Control>
              <Form.FieldErrors />
            </Form.Field>

            <div class="grid grid-cols-2 gap-4">
              <!-- Name -->
              <Form.Field form={createSuperform} name="name">
                <Form.Control>
                  {#snippet children({ props })}
                    <Form.Label>Name</Form.Label>
                    <Input
                      {...props}
                      placeholder="e.g., Chicago HQ"
                      bind:value={$createForm.name}
                    />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>

              <!-- Type -->
              <Form.Field form={createSuperform} name="type">
                <Form.Control>
                  {#snippet children({ props })}
                    <Form.Label>Type</Form.Label>
                    <Select.Root
                      type="single"
                      value={$createForm.type}
                      onValueChange={(val) => {
                        if (val) $createForm.type = val as any;
                      }}
                    >
                      <Select.Trigger {...props} class="w-full">
                        {$createForm.type
                          ? typeLabels[$createForm.type]
                          : "Select type..."}
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="subsidiary"
                          >Subsidiary</Select.Item
                        >
                        <Select.Item value="division">Division</Select.Item>
                        <Select.Item value="facility">Facility</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>
            </div>

            <!-- Code -->
            <Form.Field form={createSuperform} name="code">
              <Form.Control>
                {#snippet children({ props })}
                  <Form.Label>Code</Form.Label>
                  <Input
                    {...props}
                    placeholder="e.g., eu-west-hq"
                    bind:value={$createForm.code}
                  />
                {/snippet}
              </Form.Control>
              <Form.Description>
                Unique identifier: lowercase letters, numbers, and dashes
              </Form.Description>
              <Form.FieldErrors />
            </Form.Field>

            <!-- Location: Country / State / City -->
            <div class="grid grid-cols-3 gap-4">
              <Form.Field form={createSuperform} name="country">
                <Form.Control>
                  {#snippet children({ props })}
                    <Form.Label>Country</Form.Label>
                    <CountrySelect
                      bind:value={$createForm.country}
                      {...props}
                    />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>

              <Form.Field form={createSuperform} name="stateProvince">
                <Form.Control>
                  {#snippet children({ props })}
                    <Form.Label>State</Form.Label>
                    <Input
                      {...props}
                      placeholder="e.g., California"
                      value={$createForm.stateProvince ?? ""}
                      oninput={(e) => {
                        const val = (e.target as HTMLInputElement).value;
                        $createForm.stateProvince = val || null;
                      }}
                    />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>

              <Form.Field form={createSuperform} name="city">
                <Form.Control>
                  {#snippet children({ props })}
                    <Form.Label>City</Form.Label>
                    <Input
                      {...props}
                      placeholder="e.g., San Francisco"
                      bind:value={$createForm.city}
                    />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>
            </div>

            <!-- Description -->
            <Form.Field form={createSuperform} name="description">
              <Form.Control>
                {#snippet children({ props })}
                  <Form.Label>Description</Form.Label>
                  <Textarea
                    {...props}
                    placeholder="Optional description..."
                    rows={3}
                    value={$createForm.description ?? ""}
                    oninput={(e) => {
                      const val = (e.target as HTMLTextAreaElement).value;
                      $createForm.description = val || null;
                    }}
                  />
                {/snippet}
              </Form.Control>
              <Form.FieldErrors />
            </Form.Field>

            <!-- Equity Share -->
            <Form.Field form={createSuperform} name="equitySharePercentage">
              <Form.Control>
                {#snippet children({ props })}
                  <Form.Label>Equity Share (%)</Form.Label>
                  <div class="flex items-center gap-2">
                    <Input
                      {...props}
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      placeholder="e.g., 100"
                      class="w-[150px]"
                      value={$createForm.equitySharePercentage ?? ""}
                      oninput={(e) => {
                        const val = (e.target as HTMLInputElement).value;
                        $createForm.equitySharePercentage = val
                          ? Number(val)
                          : null;
                      }}
                    />
                    <span class="text-sm text-muted-foreground">%</span>
                  </div>
                {/snippet}
              </Form.Control>
              <Form.Description>
                Used for equity-based consolidation. Leave empty if not
                applicable.
              </Form.Description>
              <Form.FieldErrors />
            </Form.Field>
          </div>
        </Card.Content>
      </Card.Root>

      <div class="flex gap-3 justify-end">
        <Button variant="outline" type="button" onclick={onCancel}>
          Cancel
        </Button>
        <Form.Button disabled={$createSubmitting}>
          {$createSubmitting ? "Creating..." : "Create"}
        </Form.Button>
      </div>
    </div>
  </form>
{:else if mode === "edit" && node}
  <!-- EDIT MODE -->
  <h1 class="text-xl font-semibold">{typeLabels[node.type]} Details</h1>

  <form method="POST" action="?/update" use:updateEnhance>
    <input type="hidden" name="id" value={node.id} />
    <input
      type="hidden"
      name="effectiveGwpVersion"
      value={tenantSettings.gwpVersion}
    />

    <div class="flex flex-col gap-6 mt-4">
      <!-- Basic Information -->
      <Card.Root>
        <Card.Content class="pt-6">
          <h2 class="text-lg font-semibold mb-5">Basic Information</h2>
          <div class="flex flex-col gap-5">
            <div class="grid grid-cols-2 gap-4">
              <!-- Name -->
              <Form.Field form={updateSuperform} name="name">
                <Form.Control>
                  {#snippet children({ props })}
                    <Form.Label>Node Name</Form.Label>
                    <Input {...props} bind:value={$updateForm.name} />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>

              <!-- Type (read-only) -->
              <div class="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Input value={typeLabels[node.type]} disabled />
              </div>
            </div>

            <!-- Status -->
            <Form.Field form={updateSuperform} name="status">
              <Form.Control>
                {#snippet children({ props })}
                  <div class="flex flex-col gap-2">
                    <Form.Label>Status</Form.Label>
                    <div class="flex gap-3 items-center">
                      <span class="text-sm text-muted-foreground">
                        Passive
                      </span>
                      <Switch
                        {...props}
                        checked={$updateForm.status === "active"}
                        onCheckedChange={(checked) => {
                          $updateForm.status = checked ? "active" : "inactive";
                        }}
                      />
                      <span class="text-sm font-semibold">Active</span>
                    </div>
                    <p class="text-xs text-muted-foreground">
                      Active nodes are included in calculations
                    </p>
                  </div>
                {/snippet}
              </Form.Control>
            </Form.Field>

            <!-- Location: Country / State / City -->
            <div class="grid grid-cols-3 gap-4">
              <Form.Field form={updateSuperform} name="country">
                <Form.Control>
                  {#snippet children({ props })}
                    <Form.Label>Country</Form.Label>
                    <CountrySelect
                      bind:value={$updateForm.country}
                      {...props}
                    />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>

              <Form.Field form={updateSuperform} name="stateProvince">
                <Form.Control>
                  {#snippet children({ props })}
                    <Form.Label>State</Form.Label>
                    <Input
                      {...props}
                      placeholder="e.g., California"
                      value={$updateForm.stateProvince ?? ""}
                      oninput={(e) => {
                        const val = (e.target as HTMLInputElement).value;
                        $updateForm.stateProvince = val || null;
                      }}
                    />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>

              <Form.Field form={updateSuperform} name="city">
                <Form.Control>
                  {#snippet children({ props })}
                    <Form.Label>City</Form.Label>
                    <Input
                      {...props}
                      placeholder="e.g., Detroit"
                      bind:value={$updateForm.city}
                    />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Boundary & Inheritance -->
      <Card.Root>
        <Card.Content class="pt-6">
          <h2 class="text-lg font-semibold">Boundary & Inheritance</h2>
          <p class="text-sm text-muted-foreground mb-5">
            Configure equity share and boundary rules for this node
          </p>

          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-6">
              <div class="flex items-center gap-3">
                <Checkbox
                  checked={overrideEquity}
                  onCheckedChange={(val) => {
                    overrideEquity = val === true;
                    if (!overrideEquity) {
                      $updateForm.equitySharePercentage = null;
                    }
                  }}
                />
                <Label class="font-medium">Override Equity Share</Label>
              </div>

              {#if overrideEquity}
                <Form.Field form={updateSuperform} name="equitySharePercentage">
                  <Form.Control>
                    {#snippet children({ props })}
                      <div class="flex items-center gap-2">
                        <Input
                          {...props}
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          class="w-[100px]"
                          value={$updateForm.equitySharePercentage ?? ""}
                          oninput={(e) => {
                            const val = (e.target as HTMLInputElement).value;
                            $updateForm.equitySharePercentage = val
                              ? Number(val)
                              : null;
                          }}
                        />
                        <span class="text-sm text-muted-foreground">%</span>
                      </div>
                    {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>
              {/if}
            </div>

            {#if overrideEquity && $updateForm.equitySharePercentage != null}
              <div
                class="flex items-start gap-3 rounded-md bg-muted p-4"
              >
                <Info class="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <p class="text-sm">
                  This node is {$updateForm.equitySharePercentage}% equity
                  owned. Emissions will be calculated based on this equity
                  share.
                </p>
              </div>
            {/if}
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Scientific Authority Override -->
      <Card.Root>
        <Card.Content class="pt-6">
          <h2 class="text-lg font-semibold">Scientific Authority Override</h2>
          <p class="text-sm text-muted-foreground mb-5">
            Override standard mapping for this specific node. GWP Version is
            inherited from global settings.
          </p>

          <div class="flex flex-col gap-5">
            <!-- GWP Version (Inherited / Locked) -->
            <div class="flex flex-col gap-2">
              <Label class="font-medium">GWP Version (Global Setting)</Label>
              <div
                class="flex items-center gap-3 rounded-md bg-muted/70 p-3 opacity-70"
              >
                <Lock class="size-4 text-muted-foreground shrink-0" />
                <span class="text-sm text-muted-foreground">
                  {GWP_LABELS[tenantSettings.gwpVersion] ??
                    tenantSettings.gwpVersion}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <Info class="size-3 text-muted-foreground shrink-0" />
                <p class="text-xs text-muted-foreground">
                  GWP Version cannot be overridden at node level. Change in
                  global settings to apply organization-wide.
                </p>
              </div>
            </div>

            <Separator />

            <!-- Override Standard Mapping -->
            <div class="flex flex-col gap-4">
              <Form.Field
                form={updateSuperform}
                name="overrideScientificAuthority"
              >
                <Form.Control>
                  {#snippet children({ props })}
                    <div class="flex items-center gap-3">
                      <Checkbox
                        {...props}
                        checked={$updateForm.overrideScientificAuthority}
                        onCheckedChange={(val) => {
                          $updateForm.overrideScientificAuthority =
                            val === true;
                          if (val !== true) {
                            $updateForm.scope1Authority = null;
                            $updateForm.scope2Authority = null;
                          }
                        }}
                      />
                      <Form.Label class="font-medium">
                        Override Standard Mapping for this node
                      </Form.Label>
                    </div>
                  {/snippet}
                </Form.Control>
              </Form.Field>

              <div
                class="grid grid-cols-2 gap-4"
                class:opacity-50={!$updateForm.overrideScientificAuthority}
              >
                <!-- Scope 1 -->
                <Form.Field form={updateSuperform} name="scope1Authority">
                  <Form.Control>
                    {#snippet children({ props })}
                      <Form.Label class="text-xs font-medium text-muted-foreground">
                        Scope 1 - Direct Emissions
                      </Form.Label>
                      <Select.Root
                        type="single"
                        value={$updateForm.scope1Authority ?? undefined}
                        onValueChange={(val) => {
                          if (val) $updateForm.scope1Authority = val;
                        }}
                        disabled={!$updateForm.overrideScientificAuthority}
                      >
                        <Select.Trigger {...props} class="w-full">
                          {scope1Label || "Select authority..."}
                        </Select.Trigger>
                        <Select.Content>
                          {#each AUTHORITY_OPTIONS as opt}
                            <Select.Item value={opt.value}
                              >{opt.label}</Select.Item
                            >
                          {/each}
                        </Select.Content>
                      </Select.Root>
                    {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>

                <!-- Scope 2 -->
                <Form.Field form={updateSuperform} name="scope2Authority">
                  <Form.Control>
                    {#snippet children({ props })}
                      <Form.Label class="text-xs font-medium text-muted-foreground">
                        Scope 2 - Energy Indirect
                      </Form.Label>
                      <Select.Root
                        type="single"
                        value={$updateForm.scope2Authority ?? undefined}
                        onValueChange={(val) => {
                          if (val) $updateForm.scope2Authority = val;
                        }}
                        disabled={!$updateForm.overrideScientificAuthority}
                      >
                        <Select.Trigger {...props} class="w-full">
                          {scope2Label || "Select authority..."}
                        </Select.Trigger>
                        <Select.Content>
                          {#each AUTHORITY_OPTIONS as opt}
                            <Select.Item value={opt.value}
                              >{opt.label}</Select.Item
                            >
                          {/each}
                        </Select.Content>
                      </Select.Root>
                    {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Danger Zone -->
      <Card.Root class="border-destructive/50">
        <Card.Content class="pt-6">
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-2">
              <TriangleAlert class="size-5 text-destructive" />
              <span class="text-lg font-semibold text-destructive">
                Danger Zone
              </span>
            </div>

            <div
              class="rounded-md bg-destructive/10 p-4 flex flex-col gap-2"
            >
              <div class="flex items-center gap-2">
                <TriangleAlert class="size-4 text-destructive shrink-0" />
                <span class="text-sm font-semibold text-destructive">
                  This action cannot be undone
                </span>
              </div>
              <p class="text-sm text-muted-foreground">
                Deleting this node will permanently remove it from your
                organizational structure and all associated data. Make sure to
                move any child nodes before deleting.
              </p>
            </div>

            <div class="flex justify-between items-center">
              <div class="flex flex-col gap-1">
                <span class="font-semibold">Delete this node</span>
                <span class="text-xs text-muted-foreground">
                  Remove {node.name} and all associated data
                </span>
              </div>
              <Button
                variant="destructive"
                type="button"
                onclick={() => (deleteDialogOpen = true)}
              >
                <Trash2 class="size-4 mr-1" />
                Delete Node
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Action Buttons -->
      <div class="flex gap-3 justify-end">
        <Button variant="outline" type="button" onclick={onCancel}>
          Cancel
        </Button>
        <Form.Button disabled={$updateSubmitting}>
          {$updateSubmitting ? "Saving..." : "Save Changes"}
        </Form.Button>
      </div>
    </div>
  </form>

  <DeleteDialog
    bind:open={deleteDialogOpen}
    nodeId={node.id}
    nodeName={node.name}
    {onDeleted}
  />
{/if}
