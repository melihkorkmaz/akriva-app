<script lang="ts">
  import * as Form from "$lib/components/ui/form/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import MonthSelect from "$components/MonthSelect.svelte";
  import type { SuperForm } from "sveltekit-superforms";
  import type { tenantSettingsSchema } from "$lib/schemas/tenant-settings";
  import type { z } from "zod";

  type FormData = z.infer<typeof tenantSettingsSchema>;

  let {
    superform,
    form,
  }: {
    superform: SuperForm<FormData>;
    form: import("svelte/store").Writable<FormData>;
  } = $props();

  let fiscalDayLabel = $derived(
    $form.fiscalYearStartDay != null ? String($form.fiscalYearStartDay) : "",
  );
</script>

<Field.Separator />

<Field.Set>
  <Field.Legend>Temporal Logic</Field.Legend>
  <Field.Group>
    <div class="grid grid-cols-4 gap-4">
      <Form.Field form={superform} name="fiscalYearStartMonth">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Fiscal Year (Month)</Form.Label>
            <MonthSelect {...props} bind:value={$form.fiscalYearStartMonth} />
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
                $form.fiscalYearStartDay = val ? Number(val) : null;
              }}
            >
              <Select.Trigger class="w-full" {...props}>
                {#if fiscalDayLabel}
                  {fiscalDayLabel}
                {:else}
                  <span class="text-muted-foreground">Select day</span>
                {/if}
              </Select.Trigger>
              <Select.Content>
                {#each Array.from({ length: 31 }, (_, i) => i + 1) as day}
                  <Select.Item value={String(day)}>{day}</Select.Item>
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
