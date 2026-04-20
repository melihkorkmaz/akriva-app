<script lang="ts">
  import { superForm } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import * as Form from "$lib/components/ui/form/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { toast } from "svelte-sonner";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import { DatePicker } from "$lib/components/ui/date-picker/index.js";
  import { createDataCollectionRequestSchema } from "$lib/schemas/data-collection-request.js";
  import { EMISSION_CATEGORY_LABELS } from "$lib/api/types.js";
  import type {
    OrgUnitTreeResponseDto,
    EmissionSourceResponseDto,
  } from "$lib/api/types.js";
  import WizardStepper from "./_components/WizardStepper.svelte";
  import EmissionSourceTree from "./_components/EmissionSourceTree.svelte";

  let { data } = $props();

  const superform = superForm(data.form, {
    validators: zod4Client(createDataCollectionRequestSchema),
    dataType: "json",
    onUpdated({ form: f }) {
      if (!f.valid && f.message) {
        toast.error(f.message);
      }
    },
  });

  const { form, enhance, submitting } = superform;

  // Wizard step state
  let step = $state<1 | 2 | 3>(1);
  const stepLabels = ["Details", "Sources", "Review"];

  // Step 1 validation before advancing
  function goToStep2() {
    if (!$form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!$form.deadline) {
      toast.error("Deadline is required.");
      return;
    }
    // Check deadline is in the future
    if (new Date($form.deadline) <= new Date()) {
      toast.error("Deadline must be in the future.");
      return;
    }
    step = 2;
  }

  // Step 2 validation
  function goToStep3() {
    if ($form.emissionSourceIds.length === 0) {
      toast.error("Select at least one emission source.");
      return;
    }
    step = 3;
  }

  function handleSelectionChange(ids: string[]) {
    $form.emissionSourceIds = ids;
  }

  // Build review data: group selected sources by org unit
  let reviewGroups = $derived(() => {
    const sourceMap = new Map<string, EmissionSourceResponseDto>();
    for (const s of data.emissionSources) {
      sourceMap.set(s.id, s);
    }

    const groups = new Map<
      string,
      { orgUnitName: string; sources: EmissionSourceResponseDto[] }
    >();

    for (const id of $form.emissionSourceIds) {
      const source = sourceMap.get(id);
      if (!source) continue;
      const orgUnitName =
        findOrgUnitName(data.orgTree, source.orgUnitId) || "Unknown";
      if (!groups.has(source.orgUnitId)) {
        groups.set(source.orgUnitId, { orgUnitName, sources: [] });
      }
      groups.get(source.orgUnitId)!.sources.push(source);
    }

    return [...groups.values()];
  });

  function findOrgUnitName(
    tree: OrgUnitTreeResponseDto[],
    id: string,
  ): string | null {
    for (const node of tree) {
      if (node.id === id) return node.name;
      const found = findOrgUnitName(node.children, id);
      if (found) return found;
    }
    return null;
  }

  function formatDeadline(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
</script>

<svelte:head>
  <title>New Request | Akriva</title>
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
  <div class="flex flex-col gap-1">
    <h1 class="text-2xl font-semibold">New Data Collection Request</h1>
    <p class="text-sm text-muted-foreground">
      Create a request to collect emission data from your organization
    </p>
  </div>

  <!-- Stepper -->
  <WizardStepper currentStep={step} steps={stepLabels} />

  <!-- Form wraps all steps -->
  <form method="POST" use:enhance>
    <Card.Root>
      <Card.Content class="p-6">
        <!-- Step 1: Details -->
        {#if step === 1}
          <div class="flex flex-col gap-5 max-w-lg">
            <Form.Field form={superform} name="title">
              <Form.Control>
                {#snippet children({ props })}
                  <Form.Label>Title</Form.Label>
                  <Input
                    {...props}
                    bind:value={$form.title}
                    placeholder="e.g. Q1 2026 Data Collection"
                  />
                {/snippet}
              </Form.Control>
              <Form.FieldErrors />
            </Form.Field>

            <Form.Field form={superform} name="message">
              <Form.Control>
                {#snippet children({ props })}
                  <Form.Label>Message (optional)</Form.Label>
                  <Textarea
                    {...props}
                    bind:value={$form.message}
                    placeholder="Instructions or notes for data entry users..."
                    rows={3}
                  />
                {/snippet}
              </Form.Control>
              <Form.Description>
                This message will be visible to data entry users assigned to the
                tasks.
              </Form.Description>
              <Form.FieldErrors />
            </Form.Field>

            <Form.Field form={superform} name="deadline">
              <Form.Control>
                {#snippet children({ props: _props })}
                  <Form.Label>Deadline</Form.Label>
                  <DatePicker
                    bind:value={$form.deadline}
                    placeholder="Select deadline"
                    minDate={new Date().toISOString().split("T")[0]}
                  />
                {/snippet}
              </Form.Control>
              <Form.FieldErrors />
            </Form.Field>
          </div>
        {/if}

        <!-- Step 2: Select Emission Sources -->
        {#if step === 2}
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-1">
              <h3 class="text-lg font-semibold">Select Emission Sources</h3>
              <p class="text-sm text-muted-foreground">
                Choose the emission sources you want to collect data for. One
                task will be created per source.
              </p>
            </div>

            <EmissionSourceTree
              orgTree={data.orgTree}
              emissionSources={data.emissionSources}
              selectedIds={$form.emissionSourceIds}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        {/if}

        <!-- Step 3: Review & Confirm -->
        {#if step === 3}
          <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-1">
              <h3 class="text-lg font-semibold">Review & Confirm</h3>
              <p class="text-sm text-muted-foreground">
                Review the details before creating the request.
              </p>
            </div>

            <div
              class="grid grid-cols-2 gap-4 rounded-lg border border-border p-4"
            >
              <div class="flex flex-col gap-1">
                <span class="text-xs font-medium text-muted-foreground"
                  >Title</span
                >
                <span class="text-sm font-medium">{$form.title}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-medium text-muted-foreground"
                  >Deadline</span
                >
                <span class="text-sm">{formatDeadline($form.deadline)}</span>
              </div>
              {#if $form.message}
                <div class="col-span-2 flex flex-col gap-1">
                  <span class="text-xs font-medium text-muted-foreground"
                    >Message</span
                  >
                  <span class="text-sm text-muted-foreground"
                    >{$form.message}</span
                  >
                </div>
              {/if}
            </div>

            <div class="flex flex-col gap-3">
              <span class="text-sm font-medium">
                Selected Sources ({$form.emissionSourceIds.length})
              </span>
              {#each reviewGroups() as group}
                <div class="rounded-lg border border-border p-3">
                  <span class="text-sm font-medium text-foreground"
                    >{group.orgUnitName}</span
                  >
                  <div class="mt-2 flex flex-col gap-1">
                    {#each group.sources as source}
                      <div class="flex items-center gap-2 pl-3">
                        <span class="size-1.5 rounded-full bg-muted-foreground"
                        ></span>
                        <span class="text-sm text-muted-foreground"
                          >{source.name}</span
                        >
                        <Badge
                          variant="outline"
                          class="text-[10px] px-1.5 py-0"
                        >
                          {EMISSION_CATEGORY_LABELS[source.category]}
                        </Badge>
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </Card.Content>
    </Card.Root>

    <!-- Navigation -->
    <div class="flex items-center justify-between mt-6">
      <div>
        {#if step > 1}
          <Button
            type="button"
            variant="outline"
            onclick={() => (step = (step - 1) as 1 | 2)}
          >
            Back
          </Button>
        {/if}
      </div>

      <div class="flex gap-2">
        <Button type="button" variant="ghost" href="/requests">Cancel</Button>

        {#if step === 1}
          <Button type="button" onclick={goToStep2}>Next</Button>
        {:else if step === 2}
          <Button type="button" onclick={goToStep3}>Next</Button>
        {:else}
          <Button type="submit" disabled={$submitting}>
            {$submitting ? "Creating..." : "Create Request"}
          </Button>
        {/if}
      </div>
    </div>
  </form>
</div>
