<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import * as Form from "$lib/components/ui/form";
  import * as Field from "$lib/components/ui/field";
  import * as Select from "$lib/components/ui/select";
  import * as RadioGroup from "$lib/components/ui/radio-group";
  import { cn } from "$lib/utils";
  import type { Writable } from "svelte/store";
  import type { SuperForm } from "sveltekit-superforms";
  import type { applicationSettingsSchema } from "$lib/schemas/application-settings";
  import type { z } from "zod";

  type FormData = z.infer<typeof applicationSettingsSchema>;

  let {
    superform,
    form,
  }: {
    superform: SuperForm<FormData>;
    form: Writable<FormData>;
  } = $props();

  const EMISSION_UNIT_OPTIONS = [
    { value: "tco2e", label: "tCO\u2082e (Tonnes)" },
    { value: "kgco2e", label: "kgCO\u2082e (Kilograms)" },
  ];

  let emissionUnitLabel = $derived(
    EMISSION_UNIT_OPTIONS.find((o) => o.value === $form.emissionDisplayUnit)
      ?.label ?? "",
  );
</script>

<Card.Root>
  <Card.Content class="pt-6">
    <Field.Set>
      <Field.Legend>Units & Display</Field.Legend>
      <Field.Description>
        Configure measurement units and emission display preferences
      </Field.Description>

      <Field.Group>
        <Field.Field>
          <Field.Label>Unit System</Field.Label>
          <RadioGroup.Root
            value={$form.unitSystem}
            onValueChange={(val) => {
              if (val) $form.unitSystem = val;
            }}
          >
            <div class="flex gap-3">
              <label
                class={cn(
                  "flex items-center gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors",
                  $form.unitSystem === "metric" &&
                    "border-primary bg-primary/10",
                )}
              >
                <RadioGroup.Item value="metric" />
                <span class="text-sm font-medium">Metric</span>
              </label>

              <label
                class={cn(
                  "flex items-center gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors",
                  $form.unitSystem === "imperial" &&
                    "border-primary bg-primary/10",
                )}
              >
                <RadioGroup.Item value="imperial" />
                <span class="text-sm font-medium">Imperial</span>
              </label>

              <label
                class={cn(
                  "flex items-center gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors",
                  $form.unitSystem === "custom" &&
                    "border-primary bg-primary/10",
                )}
              >
                <RadioGroup.Item value="custom" />
                <span class="text-sm font-medium">Custom</span>
              </label>
            </div>
          </RadioGroup.Root>
        </Field.Field>

        <div class="max-w-[280px]">
          <Form.Field form={superform} name="emissionDisplayUnit">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Emission Display Unit</Form.Label>
                <Select.Root
                  type="single"
                  value={$form.emissionDisplayUnit}
                  onValueChange={(val) => {
                    if (val) $form.emissionDisplayUnit = val;
                  }}
                >
                  <Select.Trigger class="w-full" {...props}>
                    {emissionUnitLabel}
                  </Select.Trigger>
                  <Select.Content>
                    {#each EMISSION_UNIT_OPTIONS as opt}
                      <Select.Item value={opt.value}>{opt.label}</Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>
        </div>
      </Field.Group>
    </Field.Set>
  </Card.Content>
</Card.Root>
