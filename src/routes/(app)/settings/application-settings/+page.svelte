<script lang="ts">
  import { superForm } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import { toast } from "svelte-sonner";
  import * as Form from "$lib/components/ui/form/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Alert, AlertDescription } from "$lib/components/ui/alert/index.js";
  import { applicationSettingsSchema } from "$lib/schemas/application-settings";

  import LocalizationSection from "./_components/LocalizationSection.svelte";
  import UnitsSection from "./_components/UnitsSection.svelte";
  import ScientificAuthoritySection from "./_components/ScientificAuthoritySection.svelte";

  let { data } = $props();

  const superform = superForm(data.form, {
    validators: zod4Client(applicationSettingsSchema),
    dataType: "json",
    resetForm: false,
    onUpdated({ form }) {
      if (form.message) {
        if (form.valid) {
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
          : "An unexpected error occurred. Please try again.";
      toast.error(msg);
    },
  });
  const { form, allErrors, enhance, submitting } = superform;
</script>

<svelte:head>
  <title>Application Settings | Akriva</title>
</svelte:head>

<div class="p-8 px-10">
  <h1 class="text-2xl font-semibold">Application Settings</h1>
  <p class="text-base text-muted-foreground">
    Configure calculation methodology, localization settings, and scientific
    standards for emissions tracking
  </p>

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
      <LocalizationSection {superform} {form} />
      <UnitsSection {superform} {form} />
      <ScientificAuthoritySection {superform} {form} />

      <div class="flex gap-3 justify-end py-4">
        <Button
          variant="outline"
          type="button"
          href="/settings/application-settings"
        >
          Cancel
        </Button>
        <Form.Button disabled={$submitting}>
          {$submitting ? "Saving..." : "Save Changes"}
        </Form.Button>
      </div>
    </div>
  </form>
</div>
