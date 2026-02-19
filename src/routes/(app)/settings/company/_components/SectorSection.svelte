<script lang="ts">
  import * as Form from "$lib/components/ui/form/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import SectorSelect from "$components/SectorSelect.svelte";
  import SubSectorSelect from "$components/SubSectorSelect.svelte";
  import { getSubSectors } from "$lib/data/sectors.js";
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
</script>

<Field.Separator />

<Field.Set>
  <Field.Legend>Future-Proofing</Field.Legend>
  <Field.Description>
    Sector selection filters the Process Emissions library for relevant emission
    factors
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
                  !getSubSectors(newSector).includes($form.subSector ?? "")
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
