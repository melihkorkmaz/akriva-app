<script lang="ts">
  import { superForm } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import Eye from "@lucide/svelte/icons/eye";
  import EyeOff from "@lucide/svelte/icons/eye-off";
  import Mail from "@lucide/svelte/icons/mail";
  import Lock from "@lucide/svelte/icons/lock";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import GoogleIcon from "@lucide/svelte/icons/chrome";
  import MicrosoftIcon from "@lucide/svelte/icons/grid-2x2";
  import * as Card from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Button } from "$lib/components/ui/button";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Alert, AlertDescription } from "$lib/components/ui/alert";

  import SoonBadge from "$components/SoonBadge.svelte";
  import VerifyCodeInput from "$components/VerifyCodeInput.svelte";
  import { signinSchema, mfaVerifySchema } from "$lib/schemas/signin";

  import SigninLayout from "./_components/SigninLayout.svelte";
  import SigninCockpit from "./_components/SigninCockpit.svelte";

  let { data } = $props();

  let showMfa = $state(false);
  let mfaSession = $state("");
  let showPassword = $state(false);
  let mfaCode = $state("");

  const signinSF = superForm(data.signinForm, {
    validators: zod4Client(signinSchema),
    onResult({ result }) {
      if (result.type === "success") {
        const d = result.data as Record<string, unknown> | undefined;
        if (d?.mfaRequired) {
          mfaSession = d.mfaSession as string;
          showMfa = true;
        }
      }
    },
    onError({ result }) {
      $signinMessage =
        typeof result.error === "string"
          ? result.error
          : "An unexpected error occurred. Please try again.";
    },
  });
  const {
    form: signinData,
    enhance: signinEnhance,
    message: signinMessage,
    submitting: signinSubmitting,
  } = signinSF;

  const mfaSF = superForm(data.mfaForm, {
    validators: zod4Client(mfaVerifySchema),
    onError({ result }) {
      $mfaMessage =
        typeof result.error === "string"
          ? result.error
          : "An unexpected error occurred. Please try again.";
    },
  });
  const {
    form: mfaData,
    enhance: mfaEnhance,
    message: mfaMessage,
    submitting: mfaSubmitting,
  } = mfaSF;

  let mfaFormEl: HTMLFormElement | null = $state(null);

  $effect(() => {
    $mfaData.code = mfaCode;
  });

  function handleMfaComplete() {
    mfaFormEl?.requestSubmit();
  }
</script>

<svelte:head>
  <title>Sign in · Akriva</title>
</svelte:head>

<SigninLayout>
  {#snippet main()}
    {#if !showMfa}
      <!-- ── Sign-in flow ── -->
      <div class="flex flex-col gap-5">
        <div class="flex flex-col gap-1.5">
          <span class="font-mono text-[11px] uppercase tracking-[0.05em] text-blue-600">
            Sign in
          </span>
          <h2 class="text-[22px] font-semibold tracking-tight text-foreground">
            Welcome back
          </h2>
          <p class="text-sm leading-relaxed text-muted-foreground">
            Access your institutional ledger. Every signature, review and
            disclosure is logged.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            disabled
            aria-disabled="true"
            title="Coming soon"
            class="relative justify-center cursor-not-allowed opacity-80"
          >
            <GoogleIcon class="size-4 opacity-60" />
            <span class="opacity-60">Continue with Google</span>
            <SoonBadge class="absolute -top-1.5 -right-1.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled
            aria-disabled="true"
            title="Coming soon"
            class="relative justify-center cursor-not-allowed opacity-80"
          >
            <MicrosoftIcon class="size-4 opacity-60" />
            <span class="opacity-60">Continue with Microsoft</span>
            <SoonBadge class="absolute -top-1.5 -right-1.5" />
          </Button>
        </div>

        <div class="flex items-center gap-3 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
          <div class="h-px flex-1 bg-border"></div>
          <span class="font-mono">or with email</span>
          <div class="h-px flex-1 bg-border"></div>
        </div>

        {#if $signinMessage}
          <Alert variant="destructive">
            <AlertDescription>{$signinMessage}</AlertDescription>
          </Alert>
        {/if}

        <Card.Root class="rounded-xl shadow-sm">
          <Card.Content class="p-6">
            <form
              method="POST"
              action="?/signin"
              use:signinEnhance
              class="flex flex-col gap-5"
            >
              <div class="flex flex-col gap-1.5">
                <Label for="email">Work email <span class="text-destructive">*</span></Label>
                <div class="relative">
                  <Mail class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autocomplete="email"
                    placeholder="jane@company.com"
                    bind:value={$signinData.email}
                    class="pl-10"
                  />
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <div class="flex items-baseline justify-between">
                  <Label for="password">
                    Password <span class="text-destructive">*</span>
                  </Label>
                  <a href="/forgot-password" class="text-xs font-medium text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </a>
                </div>
                <div class="relative">
                  <Lock class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autocomplete="current-password"
                    placeholder="••••••••"
                    bind:value={$signinData.password}
                    class="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onclick={() => (showPassword = !showPassword)}
                    tabindex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {#if showPassword}
                      <EyeOff class="size-4" />
                    {:else}
                      <Eye class="size-4" />
                    {/if}
                  </button>
                </div>
              </div>

              <div class="flex items-center gap-2.5">
                <Checkbox id="rememberMe" name="rememberMe" />
                <Label for="rememberMe" class="text-sm font-normal text-muted-foreground">
                  Keep me signed in for 30 days
                </Label>
              </div>

              <Button type="submit" class="w-full" disabled={$signinSubmitting}>
                {$signinSubmitting ? "Signing in…" : "Sign in"}
                <ArrowRight class="ml-1 size-4" />
              </Button>
            </form>
          </Card.Content>
        </Card.Root>

        <p class="text-center text-sm text-muted-foreground">
          New to Akriva?
          <a href="/signup" class="font-semibold text-blue-600 hover:text-blue-700">
            Create a tenant →
          </a>
        </p>
      </div>
    {:else}
      <!-- ── MFA challenge ── -->
      <div class="flex flex-col gap-5">
        <div class="flex flex-col gap-1.5">
          <span class="font-mono text-[11px] uppercase tracking-[0.05em] text-blue-600">
            Two-factor authentication
          </span>
          <h2 class="text-[22px] font-semibold tracking-tight text-foreground">
            Enter your verification code
          </h2>
          <p class="text-sm leading-relaxed text-muted-foreground">
            Open your authenticator app and enter the 6-digit code for Akriva.
          </p>
        </div>

        {#if $mfaMessage}
          <Alert variant="destructive">
            <AlertDescription>{$mfaMessage}</AlertDescription>
          </Alert>
        {/if}

        <Card.Root class="rounded-xl shadow-sm">
          <Card.Content class="p-6">
            <form
              method="POST"
              action="?/mfa"
              use:mfaEnhance
              bind:this={mfaFormEl}
              class="flex flex-col gap-5"
            >
              <input type="hidden" name="session" value={mfaSession} />
              <input type="hidden" name="code" bind:value={$mfaData.code} />

              <VerifyCodeInput
                bind:value={mfaCode}
                onComplete={handleMfaComplete}
                disabled={$mfaSubmitting}
                class="my-1"
              />

              <Button type="submit" class="w-full" disabled={$mfaSubmitting}>
                {$mfaSubmitting ? "Verifying…" : "Verify & continue"}
                <ArrowRight class="ml-1 size-4" />
              </Button>
            </form>
          </Card.Content>
        </Card.Root>

        <div class="flex justify-center">
          <button
            type="button"
            class="text-sm font-medium text-muted-foreground hover:text-foreground"
            onclick={() => {
              showMfa = false;
              mfaCode = "";
              $mfaData.code = "";
            }}
          >
            ← Back to sign in
          </button>
        </div>
      </div>
    {/if}
  {/snippet}

  {#snippet aside()}
    <SigninCockpit email={$signinData.email} />
  {/snippet}
</SigninLayout>
