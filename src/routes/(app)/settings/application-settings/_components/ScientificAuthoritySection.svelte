<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import * as Form from "$lib/components/ui/form";
  import * as Field from "$lib/components/ui/field";
  import * as Select from "$lib/components/ui/select";
  import * as RadioGroup from "$lib/components/ui/radio-group";
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

  const AUTHORITY_OPTIONS = [
    { value: "ipcc", label: "IPCC Guidelines" },
    { value: "defra", label: "DEFRA" },
    { value: "epa", label: "EPA" },
    { value: "iea", label: "IEA" },
    { value: "egrid", label: "eGRID" },
  ];

  let scope1Label = $derived(
    AUTHORITY_OPTIONS.find((o) => o.value === $form.scope1Authority)?.label ??
      "",
  );

  let scope2Label = $derived(
    AUTHORITY_OPTIONS.find((o) => o.value === $form.scope2Authority)?.label ??
      "",
  );
</script>

<Card.Root>
  <Card.Content class="pt-6">
    <Field.Set>
      <Field.Legend>Scientific Authority</Field.Legend>
      <Field.Description>
        Select authoritative sources for emissions calculations and global
        warming potentials
      </Field.Description>

      <Field.Group>
        <Field.Field class="max-w-[400px]">
          <Field.Content>
            <Field.Label>GWP Version</Field.Label>
            <Field.Description>
              Global Warming Potential values for CH₄ and N₂O
            </Field.Description>
          </Field.Content>
          <RadioGroup.Root
            value={$form.gwpVersion}
            onValueChange={(val) => {
              if (val) $form.gwpVersion = val;
            }}
          >
            <div class="flex gap-3">
              <Field.Field orientation="horizontal">
                <RadioGroup.Item value="ar6" id="gwp-ar6" />
                <Field.Label for="gwp-ar6" class="font-normal"
                  >IPCC AR6</Field.Label
                >
              </Field.Field>
              <Field.Field orientation="horizontal">
                <RadioGroup.Item value="ar5" id="gwp-ar5" />
                <Field.Label for="gwp-ar5" class="font-normal"
                  >IPCC AR5</Field.Label
                >
              </Field.Field>
            </div>
          </RadioGroup.Root>
        </Field.Field>

        <div class="flex flex-col gap-3">
          <Field.Content>
            <span class="font-semibold">Standard Mapping</span>
            <Field.Description>
              Assigning authorities for emission scopes
            </Field.Description>
          </Field.Content>
          <div class="flex gap-4">
            <Form.Field form={superform} name="scope1Authority">
              <Form.Control>
                {#snippet children({ props })}
                  <Form.Label>Scope 1 - Direct</Form.Label>
                  <Select.Root
                    type="single"
                    value={$form.scope1Authority}
                    onValueChange={(val) => {
                      if (val) $form.scope1Authority = val;
                    }}
                  >
                    <Select.Trigger class="w-[240px]" {...props}>
                      {scope1Label}
                    </Select.Trigger>
                    <Select.Content>
                      {#each AUTHORITY_OPTIONS as opt}
                        <Select.Item value={opt.value}>{opt.label}</Select.Item>
                      {/each}
                    </Select.Content>
                  </Select.Root>
                {/snippet}
              </Form.Control>
              <Form.FieldErrors />
            </Form.Field>

            <Form.Field form={superform} name="scope2Authority">
              <Form.Control>
                {#snippet children({ props })}
                  <Form.Label>Scope 2 - Energy</Form.Label>
                  <Select.Root
                    type="single"
                    value={$form.scope2Authority}
                    onValueChange={(val) => {
                      if (val) $form.scope2Authority = val;
                    }}
                  >
                    <Select.Trigger class="w-[240px]" {...props}>
                      {scope2Label}
                    </Select.Trigger>
                    <Select.Content>
                      {#each AUTHORITY_OPTIONS as opt}
                        <Select.Item value={opt.value}>{opt.label}</Select.Item>
                      {/each}
                    </Select.Content>
                  </Select.Root>
                {/snippet}
              </Form.Control>
              <Form.FieldErrors />
            </Form.Field>
          </div>
        </div>
      </Field.Group>
    </Field.Set>
  </Card.Content>
</Card.Root>
