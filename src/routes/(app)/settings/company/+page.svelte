<script lang="ts">
  import { superForm } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import * as Card from "$lib/components/ui/card";
  import * as Form from "$lib/components/ui/form";
  import * as Field from "$lib/components/ui/field";
  import * as Select from "$lib/components/ui/select";
  import * as RadioGroup from "$lib/components/ui/radio-group";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { Alert, AlertDescription } from "$lib/components/ui/alert";
  import Info from "@lucide/svelte/icons/info";
  import CountrySelect from "$components/CountrySelect.svelte";
  import MonthSelect from "$components/MonthSelect.svelte";
  import SectorSelect from "$components/SectorSelect.svelte";
  import SubSectorSelect from "$components/SubSectorSelect.svelte";
  import { getSubSectors } from "$lib/data/sectors.js";
  import { tenantSettingsSchema } from "$lib/schemas/tenant-settings";
  import type { ConsolidationApproach } from "$lib/api/types";

  let { data } = $props();

  const superform = superForm(data.form, {
    validators: zod4Client(tenantSettingsSchema),
    dataType: "json",
    resetForm: false,
    onError({ result }) {
      $message =
        typeof result.error === "string"
          ? result.error
          : "An unexpected error occurred. Please try again.";
    },
  });
  const { form, allErrors, enhance, message, submitting } = superform;

  let consolidationApproach = $derived(
    $form.consolidationApproach ?? "operational_control",
  );

  let fiscalDayLabel = $derived(
    $form.fiscalYearStartDay != null ? String($form.fiscalYearStartDay) : "",
  );
</script>

<svelte:head>
  <title>Company Settings | Akriva</title>
</svelte:head>

<div class="p-8 px-10">
  <h1 class="text-2xl font-semibold">Company Settings</h1>
  <p class="text-base text-muted-foreground">
    Configure your organization's emissions accounting methodology and master
    settings
  </p>

  {#if $message}
    <Alert
      variant={$message === "Settings saved successfully."
        ? "default"
        : "destructive"}
      class="mt-4"
    >
      <AlertDescription>{$message}</AlertDescription>
    </Alert>
  {/if}

  {#if $allErrors.length > 0}
    <Alert variant="destructive" class="mt-4">
      <AlertDescription>
        <strong>Please fix the following errors:</strong>
        <ul class="mt-2 pl-4 list-disc">
          {#each $allErrors as error}
            <li>{error.messages.join(", ")}</li>
          {/each}
        </ul>
      </AlertDescription>
    </Alert>
  {/if}

  <form method="POST" use:enhance>
    <div class="flex flex-col gap-6 mt-6">
      <!-- Company Master Settings Card -->
      <Card.Root>
        <Card.Header>
          <Card.Title>
            <h2 class="text-lg font-semibold">Company Master Settings</h2>
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <Field.Group>
            <!-- Company Identification -->
            <Field.Set>
              <Field.Legend>Company Identification</Field.Legend>
              <Field.Group>
                <div class="grid grid-cols-2 gap-4">
                  <Form.Field form={superform} name="name">
                    <Form.Control>
                      {#snippet children({ props })}
                        <Form.Label>Company Name</Form.Label>
                        <Input
                          {...props}
                          placeholder="Acme Corporation"
                          bind:value={$form.name}
                        />
                      {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                  </Form.Field>

                  <Form.Field form={superform} name="slug">
                    <Form.Control>
                      {#snippet children({ props })}
                        <Form.Label>Company Slug</Form.Label>
                        <Input
                          {...props}
                          placeholder="acme-corp"
                          bind:value={$form.slug}
                        />
                      {/snippet}
                    </Form.Control>
                    <Form.Description>
                      Unique identifier used in URLs and API references (e.g.,
                      'acme-corp')
                    </Form.Description>
                    <Form.FieldErrors />
                  </Form.Field>
                </div>
              </Field.Group>
            </Field.Set>

            <Field.Separator />

            <!-- Localization -->
            <Field.Set>
              <Field.Legend>Localization</Field.Legend>
              <Field.Description>
                Location determines default Grid Factors for emissions
                calculations
              </Field.Description>
              <Field.Group>
                <div class="grid grid-cols-3 gap-4">
                  <Form.Field form={superform} name="hqCountry">
                    <Form.Control>
                      {#snippet children({ props })}
                        <Form.Label>HQ Country</Form.Label>
                        <CountrySelect
                          {...props}
                          bind:value={$form.hqCountry}
                        />
                      {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                  </Form.Field>

                  <Form.Field form={superform} name="stateProvince">
                    <Form.Control>
                      {#snippet children({ props })}
                        <Form.Label>State/Province</Form.Label>
                        <Input
                          {...props}
                          placeholder="California"
                          value={$form.stateProvince ?? ""}
                          oninput={(e: Event) => {
                            const val = (e.target as HTMLInputElement).value;
                            $form.stateProvince = val || null;
                          }}
                        />
                      {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                  </Form.Field>

                  <Form.Field form={superform} name="city">
                    <Form.Control>
                      {#snippet children({ props })}
                        <Form.Label>City</Form.Label>
                        <Input
                          {...props}
                          placeholder="San Francisco"
                          value={$form.city ?? ""}
                          oninput={(e: Event) => {
                            const val = (e.target as HTMLInputElement).value;
                            $form.city = val || null;
                          }}
                        />
                      {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                  </Form.Field>
                </div>

                <div class="max-w-[400px]">
                  <Form.Field form={superform} name="reportingCurrency">
                    <Form.Control>
                      {#snippet children({ props })}
                        <Form.Label>Reporting Currency (ISO)</Form.Label>
                        <Input
                          {...props}
                          placeholder="USD"
                          value={$form.reportingCurrency ?? ""}
                          oninput={(e: Event) => {
                            const val = (e.target as HTMLInputElement).value;
                            $form.reportingCurrency = val || null;
                          }}
                        />
                      {/snippet}
                    </Form.Control>
                    <Form.Description>
                      Master currency for all spend-based data
                    </Form.Description>
                    <Form.FieldErrors />
                  </Form.Field>
                </div>
              </Field.Group>
            </Field.Set>

            <Field.Separator />

            <!-- Temporal Logic -->
            <Field.Set>
              <Field.Legend>Temporal Logic</Field.Legend>
              <Field.Group>
                <div class="grid grid-cols-4 gap-4">
                  <Form.Field form={superform} name="fiscalYearStartMonth">
                    <Form.Control>
                      {#snippet children({ props })}
                        <Form.Label>Fiscal Year (Month)</Form.Label>
                        <MonthSelect
                          {...props}
                          bind:value={$form.fiscalYearStartMonth}
                        />
                      {/snippet}
                    </Form.Control>
                    <Form.Description>
                      Essential for aligning with financial reports
                    </Form.Description>
                    <Form.FieldErrors />
                  </Form.Field>

                  <Form.Field form={superform} name="fiscalYearStartDay">
                    <Form.Control>
                      {#snippet children({ props })}
                        <Form.Label>Fiscal Year (Day)</Form.Label>
                        <Select.Root
                          type="single"
                          value={$form.fiscalYearStartDay != null
                            ? String($form.fiscalYearStartDay)
                            : undefined}
                          onValueChange={(val) => {
                            $form.fiscalYearStartDay = val
                              ? Number(val)
                              : null;
                          }}
                        >
                          <Select.Trigger class="w-full" {...props}>
                            {#if fiscalDayLabel}
                              {fiscalDayLabel}
                            {:else}
                              <span class="text-muted-foreground"
                                >Select day</span
                              >
                            {/if}
                          </Select.Trigger>
                          <Select.Content>
                            {#each Array.from({ length: 31 }, (_, i) => i + 1) as day}
                              <Select.Item value={String(day)}
                                >{day}</Select.Item
                              >
                            {/each}
                          </Select.Content>
                        </Select.Root>
                      {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                  </Form.Field>

                  <div class="col-span-2">
                    <Form.Field form={superform} name="baseYear">
                      <Form.Control>
                        {#snippet children({ props })}
                          <Form.Label>Base Year</Form.Label>
                          <Input
                            {...props}
                            type="number"
                            placeholder="2024"
                            value={$form.baseYear ?? ""}
                            oninput={(e: Event) => {
                              const val = (e.target as HTMLInputElement).value;
                              $form.baseYear = val ? Number(val) : null;
                            }}
                          />
                        {/snippet}
                      </Form.Control>
                      <Form.Description>
                        Benchmark year for measuring reduction targets
                      </Form.Description>
                      <Form.FieldErrors />
                    </Form.Field>
                  </div>
                </div>
              </Field.Group>
            </Field.Set>

            <Field.Separator />

            <!-- Future-Proofing -->
            <Field.Set>
              <Field.Legend>Future-Proofing</Field.Legend>
              <Field.Description>
                Sector selection filters the Process Emissions library for
                relevant emission factors
              </Field.Description>
              <Field.Group>
                <div class="grid grid-cols-2 gap-4">
                  <Form.Field form={superform} name="sector">
                    <Form.Control>
                      {#snippet children({ props })}
                        <Form.Label>Sector</Form.Label>
                        <SectorSelect
                          {...props}
                          bind:value={$form.sector}
                          onValueChange={(newSector) => {
                            if (
                              !newSector ||
                              !getSubSectors(newSector).includes(
                                $form.subSector ?? "",
                              )
                            ) {
                              $form.subSector = null;
                            }
                          }}
                        />
                      {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                  </Form.Field>

                  <Form.Field form={superform} name="subSector">
                    <Form.Control>
                      {#snippet children({ props })}
                        <Form.Label>Sub-sector</Form.Label>
                        <SubSectorSelect
                          {...props}
                          bind:value={$form.subSector}
                          sector={$form.sector}
                        />
                      {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                  </Form.Field>
                </div>
              </Field.Group>
            </Field.Set>
          </Field.Group>
        </Card.Content>
      </Card.Root>

      <!-- Boundary Rules Card -->
      <Card.Root>
        <Card.Content class="pt-6">
          <Field.Set>
            <Field.Legend>Boundary Rules (Consolidation Approach)</Field.Legend>
            <Field.Description>
              Determine which emissions belong to your company based on the GHG
              Protocol
            </Field.Description>

            <RadioGroup.Root
              value={consolidationApproach}
              onValueChange={(val) => {
                $form.consolidationApproach =
                  (val as ConsolidationApproach) || null;
              }}
            >
              <div class="flex flex-col gap-3">
                <label
                  class="flex items-start gap-3 rounded-md border p-4 cursor-pointer transition-colors"
                  class:border-primary={consolidationApproach ===
                    "operational_control"}
                  class:bg-blue-50={consolidationApproach ===
                    "operational_control"}
                >
                  <RadioGroup.Item value="operational_control" />
                  <div class="flex flex-col gap-1">
                    <span class="text-base font-semibold"
                      >Operational Control</span
                    >
                    <span class="text-sm text-muted-foreground">
                      100% accounting if you have full authority to
                      introduce/implement operating policies
                    </span>
                  </div>
                </label>

                <label
                  class="flex items-start gap-3 rounded-md border p-4 cursor-pointer transition-colors"
                  class:border-primary={consolidationApproach ===
                    "financial_control"}
                  class:bg-blue-50={consolidationApproach ===
                    "financial_control"}
                >
                  <RadioGroup.Item value="financial_control" />
                  <div class="flex flex-col gap-1">
                    <span class="text-base font-semibold"
                      >Financial Control</span
                    >
                    <span class="text-sm text-muted-foreground">
                      100% accounting if you have the power to direct financial
                      and operating policies for economic benefit
                    </span>
                  </div>
                </label>

                <label
                  class="flex items-start gap-3 rounded-md border p-4 cursor-pointer transition-colors"
                  class:border-primary={consolidationApproach ===
                    "equity_share"}
                  class:bg-blue-50={consolidationApproach === "equity_share"}
                >
                  <RadioGroup.Item value="equity_share" />
                  <div class="flex flex-col gap-1">
                    <span class="text-base font-semibold">Equity Share</span>
                    <span class="text-sm text-muted-foreground">
                      Accounting based on your % of ownership interest
                    </span>
                  </div>
                </label>
              </div>
            </RadioGroup.Root>

            <Alert>
              <Info class="size-4" />
              <AlertDescription>
                If Equity Share is selected, an Ownership Percentage field will
                be enabled in all Asset/Entry forms
              </AlertDescription>
            </Alert>
          </Field.Set>
        </Card.Content>
      </Card.Root>

      <!-- Action Buttons -->
      <div class="flex gap-3 justify-end py-4">
        <Button variant="outline" type="button" href="/settings/company"
          >Cancel</Button
        >
        <Form.Button disabled={$submitting}>
          {$submitting ? "Saving..." : "Save Changes"}
        </Form.Button>
      </div>
    </div>
  </form>
</div>
