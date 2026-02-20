<script lang="ts">
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
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import TriangleAlert from "@lucide/svelte/icons/triangle-alert";
  import {
    createOrgUnitSchema,
    updateOrgUnitSchema,
  } from "$lib/schemas/org-unit";
  import DeleteDialog from "./DeleteDialog.svelte";
  import type { OrgUnitTreeResponseDto } from "$lib/api/types";

  let {
    mode,
    node = null,
    parentId = null,
    createFormData,
    updateFormData,
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
    allNodes: { id: string; name: string }[];
    onCreated: (id: string) => void;
    onDeleted: () => void;
    onCancel: () => void;
  } = $props();

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

  // Set parentId when entering create mode
  $effect(() => {
    if (mode === "create") {
      $createForm.parentId = parentId;
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

  // Populate update form when node changes
  $effect(() => {
    if (mode === "edit" && node) {
      $updateForm.name = node.name;
      $updateForm.description = node.description;
      $updateForm.equitySharePercentage = node.equitySharePercentage;
      $updateForm.status = node.status;
    }
  });

  // Delete dialog state
  let deleteDialogOpen = $state(false);

  // Type display labels
  const typeLabels: Record<string, string> = {
    subsidiary: "Subsidiary",
    division: "Division",
    facility: "Facility",
  };
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
  <div class="flex items-center gap-3">
    <h1 class="text-xl font-semibold">{node.name}</h1>
    <Badge variant="secondary">{typeLabels[node.type]}</Badge>
  </div>

  <form method="POST" action="?/update" use:updateEnhance>
    <input type="hidden" name="id" value={node.id} />
    <div class="flex flex-col gap-6 mt-4">
      <Card.Root>
        <Card.Content class="pt-6">
          <div class="flex flex-col gap-5">
            <div class="grid grid-cols-2 gap-4">
              <!-- Name -->
              <Form.Field form={updateSuperform} name="name">
                <Form.Control>
                  {#snippet children({ props })}
                    <Form.Label>Name</Form.Label>
                    <Input {...props} bind:value={$updateForm.name} />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>

              <!-- Code (read-only) -->
              <div class="flex flex-col gap-1.5">
                <Label>Code</Label>
                <Input value={node.code} disabled />
                <p class="text-xs text-muted-foreground">
                  Immutable after creation
                </p>
              </div>
            </div>

            <!-- Description -->
            <Form.Field form={updateSuperform} name="description">
              <Form.Control>
                {#snippet children({ props })}
                  <Form.Label>Description</Form.Label>
                  <Textarea
                    {...props}
                    rows={3}
                    value={$updateForm.description ?? ""}
                    oninput={(e) => {
                      const val = (e.target as HTMLTextAreaElement).value;
                      $updateForm.description = val || null;
                    }}
                  />
                {/snippet}
              </Form.Control>
              <Form.FieldErrors />
            </Form.Field>

            <!-- Equity Share -->
            <Form.Field form={updateSuperform} name="equitySharePercentage">
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
                      class="w-[150px]"
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

            <Separator />

            <!-- Status -->
            <Form.Field form={updateSuperform} name="status">
              <Form.Control>
                {#snippet children({ props })}
                  <div class="flex flex-col gap-2">
                    <Form.Label>Status</Form.Label>
                    <div class="flex gap-3 items-center">
                      <span class="text-sm text-muted-foreground">
                        Inactive
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
                      Active nodes are included in emissions calculations
                    </p>
                  </div>
                {/snippet}
              </Form.Control>
            </Form.Field>
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
            <div class="flex justify-between items-center">
              <div class="flex flex-col gap-1">
                <span class="font-semibold">Delete this node</span>
                <span class="text-xs text-muted-foreground">
                  Remove {node.name} from the organizational tree
                </span>
              </div>
              <Button
                variant="destructive"
                type="button"
                onclick={() => (deleteDialogOpen = true)}
              >
                <Trash2 class="size-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <div class="flex gap-3 justify-end">
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
