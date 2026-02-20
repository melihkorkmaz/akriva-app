<script lang="ts">
  import { superForm } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import * as Card from "$lib/components/ui/card";
  import * as Form from "$lib/components/ui/form";
  import * as Field from "$lib/components/ui/field";
  import { Input } from "$lib/components/ui/input";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Alert, AlertDescription } from "$lib/components/ui/alert";
  import Eye from "@lucide/svelte/icons/eye";
  import EyeOff from "@lucide/svelte/icons/eye-off";

  import TextDivider from "$components/TextDivider.svelte";
  import { signinSchema, mfaVerifySchema } from "$lib/schemas/signin";

  let { data } = $props();

  let showMfa = $state(false);
  let mfaSession = $state("");
  let showPassword = $state(false);

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
</script>

<svelte:head>
  <title>Sign In | Akriva</title>
</svelte:head>

<Card.Root class="w-full max-w-[420px]">
  <Card.Content class="pt-6">
    <div class="flex flex-col gap-5">
      {#if !showMfa}
        <!-- Signin form -->
        <div class="flex flex-col gap-2 items-center">
          <h2 class="text-2xl font-semibold">Welcome Back</h2>
          <p class="text-base text-muted-foreground">
            Access your institutional ledger
          </p>
        </div>

        {#if $signinMessage}
          <Alert variant="destructive">
            <AlertDescription>{$signinMessage}</AlertDescription>
          </Alert>
        {/if}

        <form
          method="POST"
          action="?/signin"
          use:signinEnhance
          class="flex flex-col gap-5"
        >
          <Form.Field form={signinSF} name="email">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Email Address</Form.Label>
                <Input
                  {...props}
                  type="email"
                  placeholder="john.doe@company.com"
                  bind:value={$signinData.email}
                />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field form={signinSF} name="password">
            <Form.Control>
              {#snippet children({ props })}
                <div class="flex justify-between items-center">
                  <Form.Label>Password</Form.Label>
                  <a href="/forgot-password" class="text-xs">Forgot password?</a
                  >
                </div>
                <div class="relative">
                  <Input
                    {...props}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    bind:value={$signinData.password}
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onclick={() => (showPassword = !showPassword)}
                    tabindex={-1}
                  >
                    {#if showPassword}
                      <EyeOff class="size-4" />
                    {:else}
                      <Eye class="size-4" />
                    {/if}
                  </button>
                </div>
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Field.Field orientation="horizontal">
            <Checkbox id="rememberMe" name="rememberMe" />
            <Field.Label for="rememberMe" class="font-normal"
              >Remember me for 30 days</Field.Label
            >
          </Field.Field>

          <Form.Button class="w-full" disabled={$signinSubmitting}>
            {$signinSubmitting ? "Signing in..." : "Sign In"}
          </Form.Button>
        </form>

        <TextDivider />
        <div class="flex flex-wrap gap-2 justify-center">
          <span class="text-sm text-muted-foreground"
            >Don't have an account?</span
          >
          <a href="/signup" class="text-sm font-bold">Sign up</a>
        </div>
      {:else}
        <!-- MFA verification form -->
        <div class="flex flex-col gap-2 items-center">
          <h2 class="text-2xl font-semibold">Two-Factor Authentication</h2>
          <p class="text-base text-muted-foreground">
            Enter the code from your authenticator app
          </p>
        </div>

        {#if $mfaMessage}
          <Alert variant="destructive">
            <AlertDescription>{$mfaMessage}</AlertDescription>
          </Alert>
        {/if}

        <form
          method="POST"
          action="?/mfa"
          use:mfaEnhance
          class="flex flex-col gap-5"
        >
          <input type="hidden" name="session" value={mfaSession} />

          <Form.Field form={mfaSF} name="code">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Verification Code</Form.Label>
                <Input
                  {...props}
                  placeholder="000000"
                  bind:value={$mfaData.code}
                />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Button class="w-full" disabled={$mfaSubmitting}>
            {$mfaSubmitting ? "Verifying..." : "Verify"}
          </Form.Button>
        </form>

        <div class="flex justify-center">
          <button
            type="button"
            class="text-sm bg-transparent border-none cursor-pointer p-0"
            onclick={() => {
              showMfa = false;
            }}
          >
            Back to sign in
          </button>
        </div>
      {/if}
    </div>
  </Card.Content>
</Card.Root>
