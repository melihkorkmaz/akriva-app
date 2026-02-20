<script lang="ts">
  import * as Form from "$lib/components/ui/form";
  import * as Field from "$lib/components/ui/field";
  import { Input } from "$lib/components/ui/input";
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
          Unique identifier used in URLs and API references (e.g., 'acme-corp')
        </Form.Description>
        <Form.FieldErrors />
      </Form.Field>
    </div>
  </Field.Group>
</Field.Set>
