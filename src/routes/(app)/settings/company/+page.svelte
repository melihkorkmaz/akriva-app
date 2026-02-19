<script lang="ts">
  import { superForm } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Alert, AlertDescription } from "$lib/components/ui/alert/index.js";
  import { tenantSettingsSchema } from "$lib/schemas/tenant-settings";

  import CompanyIdentificationSection from "./_components/CompanyIdentificationSection.svelte";
  import LocalizationSection from "./_components/LocalizationSection.svelte";
  import TemporalLogicSection from "./_components/TemporalLogicSection.svelte";
  import SectorSection from "./_components/SectorSection.svelte";
  import BoundaryRulesSection from "./_components/BoundaryRulesSection.svelte";

  let { data } = $props();

  const sf = superForm(data.form, {
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
  const { form, allErrors, enhance, message, submitting } = sf;
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
      <Card.Root>
        <Card.Header>
          <Card.Title>
            <h2 class="text-lg font-semibold">Company Master Settings</h2>
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <Field.Group>
            <CompanyIdentificationSection superform={sf} {form} />
            <LocalizationSection superform={sf} {form} />
            <TemporalLogicSection superform={sf} {form} />
            <SectorSection superform={sf} {form} />
          </Field.Group>
        </Card.Content>
      </Card.Root>

      <BoundaryRulesSection superform={sf} {form} />

      <div class="flex gap-3 justify-end py-4">
        <Button variant="outline" type="button" href="/settings/company">
          Cancel
        </Button>
        <Form.Button disabled={$submitting}>
          {$submitting ? "Saving..." : "Save Changes"}
        </Form.Button>
      </div>
    </div>
  </form>
</div>
