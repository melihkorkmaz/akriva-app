<script lang="ts">
  import * as Form from "$lib/components/ui/form/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import CountrySelect from "$components/CountrySelect.svelte";
  import type { Writable } from "svelte/store";
  import type { SuperForm } from "sveltekit-superforms";
  import type { tenantSettingsSchema } from "$lib/schemas/tenant-settings";
  import type { z } from "zod";

  type FormData = z.infer<typeof tenantSettingsSchema>;

  let {
    superform,
    form,
  }: {
    superform: SuperForm<FormData>;
    form: Writable<FormData>;
  } = $props();
</script>

<Field.Separator />

<Field.Set>
  <Field.Legend>Localization</Field.Legend>
  <Field.Description>
    Location determines default Grid Factors for emissions calculations
  </Field.Description>
  <Field.Group>
    <div class="grid grid-cols-3 gap-4">
      <Form.Field form={superform} name="hqCountry">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>HQ Country</Form.Label>
            <CountrySelect {...props} bind:value={$form.hqCountry} />
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
