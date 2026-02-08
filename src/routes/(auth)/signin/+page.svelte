<script lang="ts">
  import { superForm } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import "@awesome.me/webawesome/dist/components/button/button.js";
  import "@awesome.me/webawesome/dist/components/input/input.js";
  import "@awesome.me/webawesome/dist/components/card/card.js";
  import "@awesome.me/webawesome/dist/components/checkbox/checkbox.js";
  import "@awesome.me/webawesome/dist/components/callout/callout.js";

  import TextDivider from "$components/TextDivider.svelte";
  import { signinSchema, mfaVerifySchema } from "$lib/schemas/signin.js";

  let { data } = $props();

  let showMfa = $state(false);
  let mfaSession = $state("");

  const {
    form: signinData,
    errors: signinErrors,
    enhance: signinEnhance,
    message: signinMessage,
  } = superForm(data.signinForm, {
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
  });

  const {
    form: mfaData,
    errors: mfaErrors,
    enhance: mfaEnhance,
    message: mfaMessage,
  } = superForm(data.mfaForm, {
    validators: zod4Client(mfaVerifySchema),
  });
</script>

<svelte:head>
  <title>Sign In | Akriva</title>
</svelte:head>

<wa-card>
  <div class="wa-stack wa-gap-l">
    {#if !showMfa}
      <!-- Signin form -->
      <div class="wa-stack wa-gap-xs wa-align-items-center">
        <h2>Welcome Back</h2>
        <p class="wa-body-l wa-color-text-quiet">
          Access your institutional ledger
        </p>
      </div>

      {#if $signinMessage}
        <wa-callout variant="danger">
          {$signinMessage}
        </wa-callout>
      {/if}

      <form
        method="POST"
        action="?/signin"
        use:signinEnhance
        class="wa-stack wa-gap-l"
      >
        <div class="field">
          <wa-input
            id="email"
            name="email"
            type="email"
            placeholder="john.doe@company.com"
            label="Email Address"
            value={$signinData.email}
            oninput={(e: Event) => {
              $signinData.email = (e.target as HTMLInputElement).value;
            }}
            data-invalid={$signinErrors.email ? "" : undefined}
          ></wa-input>
          {#if $signinErrors.email}
            <small class="error-message">{$signinErrors.email[0]}</small>
          {/if}
        </div>

        <div class="wa-stack wa-gap-xs">
          <div class="password-label-row">
            <label for="password">Password</label>
            <a href="/forgot-password" class="forgot-link">Forgot password?</a>
          </div>
          <wa-input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            password-toggle
            value={$signinData.password}
            oninput={(e: Event) => {
              $signinData.password = (e.target as HTMLInputElement).value;
            }}
            data-invalid={$signinErrors.password ? "" : undefined}
          ></wa-input>
          {#if $signinErrors.password}
            <small class="error-message">{$signinErrors.password[0]}</small>
          {/if}
        </div>

        <wa-checkbox name="rememberMe">Remember me for 30 days</wa-checkbox>

        <wa-button type="submit" variant="brand" size="large" style="width:100%">
          Sign In
        </wa-button>
      </form>

      <TextDivider />
      <div class="wa-cluster wa-gap-xs wa-justify-content-center">
        <span class="wa-body-s wa-color-text-quiet"
          >Don't have an account?</span
        >
        <a href="/signup" class="wa-link wa-font-size-s wa-font-weight-bold"
          >Sign up</a
        >
      </div>
    {:else}
      <!-- MFA verification form -->
      <div class="wa-stack wa-gap-xs wa-align-items-center">
        <h2>Two-Factor Authentication</h2>
        <p class="wa-body-l wa-color-text-quiet">
          Enter the code from your authenticator app
        </p>
      </div>

      {#if $mfaMessage}
        <wa-callout variant="danger">
          {$mfaMessage}
        </wa-callout>
      {/if}

      <form
        method="POST"
        action="?/mfa"
        use:mfaEnhance
        class="wa-stack wa-gap-l"
      >
        <input type="hidden" name="session" value={mfaSession} />

        <div class="field">
          <wa-input
            id="code"
            name="code"
            placeholder="000000"
            label="Verification Code"
            value={$mfaData.code}
            oninput={(e: Event) => {
              $mfaData.code = (e.target as HTMLInputElement).value;
            }}
            data-invalid={$mfaErrors.code ? "" : undefined}
          ></wa-input>
          {#if $mfaErrors.code}
            <small class="error-message">{$mfaErrors.code[0]}</small>
          {/if}
        </div>

        <wa-button
          type="submit"
          variant="brand"
          size="large"
          style="width:100%"
        >
          Verify
        </wa-button>
      </form>

      <div class="wa-cluster wa-justify-content-center">
        <button
          type="button"
          class="back-link wa-body-s"
          onclick={() => {
            showMfa = false;
          }}
        >
          Back to sign in
        </button>
      </div>
    {/if}
  </div>
</wa-card>

<style>
  wa-card {
    width: 100%;
    max-width: 420px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--wa-space-xs);
  }

  .error-message {
    color: var(--akriva-status-error);
    font-size: var(--wa-font-size-s);
  }

  .password-label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .forgot-link {
    font-size: var(--akriva-size-caption);
    text-decoration: underline;
  }

  .back-link {
    background: none;
    border: none;
    color: var(--wa-color-text-quiet);
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
  }

  .back-link:hover {
    color: var(--wa-color-text);
  }
</style>
