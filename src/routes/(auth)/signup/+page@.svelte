<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { applyAction, enhance } from "$app/forms";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import { Alert, AlertDescription } from "$lib/components/ui/alert";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";

  import { provideWizard, SignupWizard, STORAGE_KEY } from "$lib/signup/wizard.svelte.js";
  import WizardLayout from "./_components/WizardLayout.svelte";
  import Stepper from "./_components/Stepper.svelte";
  import Cockpit from "./_components/Cockpit.svelte";
  import StepIdentity from "./_components/StepIdentity.svelte";
  import StepOrganization from "./_components/StepOrganization.svelte";
  import StepCredentials from "./_components/StepCredentials.svelte";
  import StepVerify from "./_components/StepVerify.svelte";
  import StepFinish from "./_components/StepFinish.svelte";

  const wizard = provideWizard(new SignupWizard());

  let formEl: HTMLFormElement | null = $state(null);
  let submitting = $state(false);
  let serverMessage = $state<string | null>(null);
  let hydrated = $state(false);

  onMount(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) wizard.hydrate(raw);
    } catch {
      // localStorage disabled or corrupted — defaults remain.
    }
    hydrated = true;
  });

  $effect(() => {
    if (!hydrated) return;
    // Read all reactive state via serialize() so this effect re-runs on every change.
    const snapshot = wizard.serialize();
    untrack(() => {
      try {
        localStorage.setItem(STORAGE_KEY, snapshot);
      } catch {
        // Quota exceeded or disabled — silently skip.
      }
    });
  });

  function handleBack() {
    serverMessage = null;
    wizard.back();
  }

  function handleContinue() {
    serverMessage = null;
    if (!wizard.validateStep()) return;

    if (wizard.step === 2) {
      // Submit credentials → backend signup.
      formEl?.requestSubmit();
      return;
    }

    if (wizard.step === 3) {
      // Cosmetic verify: backend support not yet wired.
      wizard.finish();
      return;
    }

    wizard.next();
  }

  function handleVerifyAutoComplete() {
    // Auto-submit when all 6 digits entered (called by VerifyCodeInput).
    handleContinue();
  }

  const ctaLabel = $derived.by(() => {
    if (wizard.step === 2) return submitting ? "Creating tenant…" : "Create account";
    if (wizard.step === 3) return "Verify & open workspace";
    return "Continue";
  });
</script>

<svelte:head>
  <title>Create your tenant · Akriva</title>
</svelte:head>

<WizardLayout>
  {#snippet main()}
    {#if wizard.finished}
      <Card.Root class="rounded-xl shadow-sm">
        <Card.Content class="p-7">
          <StepFinish />
        </Card.Content>
      </Card.Root>
    {:else}
      <div class="mb-6">
        <Stepper />
      </div>

      <Card.Root class="rounded-xl shadow-sm">
        <Card.Content class="p-7">
          <form
            bind:this={formEl}
            method="POST"
            action="?/register"
            use:enhance={() => {
              submitting = true;
              return async ({ result }) => {
                submitting = false;
                if (result.type === "success") {
                  const data = result.data as { registered?: boolean } | undefined;
                  if (data?.registered) {
                    wizard.advance();
                  }
                  return;
                }
                if (result.type === "failure") {
                  const data = result.data as { form?: { message?: string } } | undefined;
                  serverMessage = data?.form?.message ?? "Could not create your account. Please review your details.";
                  return;
                }
                if (result.type === "error") {
                  serverMessage = result.error?.message ?? "Network error. Please try again.";
                  return;
                }
                await applyAction(result);
              };
            }}
            class="flex min-h-[460px] flex-col"
          >
            <!-- Hidden inputs serialise wizard state for the register action. -->
            <input type="hidden" name="firstName" value={wizard.data.firstName} />
            <input type="hidden" name="lastName" value={wizard.data.lastName} />
            <input type="hidden" name="email" value={wizard.data.email} />
            <input type="hidden" name="companyName" value={wizard.data.companyName} />
            <input type="hidden" name="country" value={wizard.data.country} />
            <input type="hidden" name="city" value={wizard.data.city} />
            <input type="hidden" name="sector" value={wizard.data.sector} />
            <input type="hidden" name="subSector" value={wizard.data.subSector} />
            <input type="hidden" name="password" value={wizard.data.password} />
            {#if wizard.data.acceptTerms}
              <input type="hidden" name="acceptTerms" value="on" />
            {/if}

            {#if serverMessage}
              <Alert variant="destructive" class="mb-4">
                <AlertDescription>{serverMessage}</AlertDescription>
              </Alert>
            {/if}

            <div class="flex-1">
              {#if wizard.step === 0}
                <StepIdentity />
              {:else if wizard.step === 1}
                <StepOrganization />
              {:else if wizard.step === 2}
                <StepCredentials />
              {:else}
                <StepVerify onSubmit={handleVerifyAutoComplete} />
              {/if}
            </div>

            <div class="mt-8 flex items-center justify-between">
              {#if wizard.step > 0}
                <Button
                  type="button"
                  variant="ghost"
                  onclick={handleBack}
                  disabled={submitting}
                >
                  <ArrowLeft class="size-4" /> Back
                </Button>
              {:else}
                <span></span>
              {/if}

              <div class="flex items-center gap-4">
                <span class="font-mono text-xs text-muted-foreground tabular-nums">
                  {wizard.step + 1} / 4
                </span>
                <Button type="button" onclick={handleContinue} disabled={submitting}>
                  {ctaLabel}
                  <ArrowRight class="ml-1 size-4" />
                </Button>
              </div>
            </div>
          </form>
        </Card.Content>
      </Card.Root>
    {/if}
  {/snippet}

  {#snippet aside()}
    <Cockpit />
  {/snippet}
</WizardLayout>
