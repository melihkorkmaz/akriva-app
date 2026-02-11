<script lang="ts">
  import { superForm } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import "@awesome.me/webawesome/dist/components/button/button.js";
  import "@awesome.me/webawesome/dist/components/input/input.js";
  import "@awesome.me/webawesome/dist/components/card/card.js";
  import "@awesome.me/webawesome/dist/components/callout/callout.js";

  import TextDivider from "$components/TextDivider.svelte";
  import { signupSchema } from "$lib/schemas/signup.js";

  let { data } = $props();

  const { form, errors, enhance, message, submitting } = superForm(data.form, {
    validators: zod4Client(signupSchema),
  });
</script>

<svelte:head>
  <title>Sign Up | Akriva</title>
</svelte:head>

<wa-card>
  <div class="wa-stack wa-gap-l">
    <div class="wa-stack wa-gap-xs wa-align-items-center">
      <h2>Create Your Organization</h2>
      <p class="wa-body-l wa-color-text-quiet">
        Set up your institutional ledger environment
      </p>
    </div>

    <!-- API error message -->
    {#if $message}
      <wa-callout variant="danger">
        {$message}
      </wa-callout>
    {/if}

    <form method="POST" use:enhance class="wa-stack wa-gap-l">
      <div class="wa-grid wa-gap-m">
        <div class="field">
          <wa-input
            id="firstName"
            name="firstName"
            placeholder="Jane"
            label="First Name"
            value={$form.firstName}
            oninput={(e: Event) => {
              $form.firstName = (e.target as HTMLInputElement).value;
            }}
            data-invalid={$errors.firstName ? "" : undefined}
          ></wa-input>
          {#if $errors.firstName}
            <small class="error-message">{$errors.firstName[0]}</small>
          {/if}
        </div>

        <div class="field">
          <wa-input
            id="lastName"
            name="lastName"
            placeholder="Doe"
            label="Last Name"
            value={$form.lastName}
            oninput={(e: Event) => {
              $form.lastName = (e.target as HTMLInputElement).value;
            }}
            data-invalid={$errors.lastName ? "" : undefined}
          ></wa-input>
          {#if $errors.lastName}
            <small class="error-message">{$errors.lastName[0]}</small>
          {/if}
        </div>
      </div>

      <div class="field">
        <wa-input
          id="companyName"
          name="companyName"
          placeholder="Acme Corporation"
          label="Company Name"
          value={$form.companyName}
          oninput={(e: Event) => {
            $form.companyName = (e.target as HTMLInputElement).value;
          }}
          data-invalid={$errors.companyName ? "" : undefined}
        ></wa-input>
        {#if $errors.companyName}
          <small class="error-message">{$errors.companyName[0]}</small>
        {/if}
      </div>

      <div class="field">
        <wa-input
          id="email"
          name="email"
          placeholder="john.doe@company.com"
          label="Email Address"
          value={$form.email}
          oninput={(e: Event) => {
            $form.email = (e.target as HTMLInputElement).value;
          }}
          data-invalid={$errors.email ? "" : undefined}
        ></wa-input>
        {#if $errors.email}
          <small class="error-message">{$errors.email[0]}</small>
        {/if}
      </div>

      <div class="field">
        <wa-input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          label="Password"
          password-toggle
          value={$form.password}
          oninput={(e: Event) => {
            $form.password = (e.target as HTMLInputElement).value;
          }}
          data-invalid={$errors.password ? "" : undefined}
        ></wa-input>
        {#if $errors.password}
          <small class="error-message">{$errors.password[0]}</small>
        {/if}
      </div>

      {#if $submitting}
        <wa-button type="submit" variant="brand" loading disabled>
          Create Organization
        </wa-button>
      {:else}
        <wa-button type="submit" variant="brand">
          Create Organization
        </wa-button>
      {/if}
    </form>

    <TextDivider />

    <div class="wa-cluster wa-gap-xs wa-justify-content-center">
      <span class="wa-body-s wa-color-text-quiet">Already have an account?</span
      >
      <a href="/signin" class="wa-link wa-font-size-s wa-font-weight-bold"
        >Sign in</a
      >
    </div>
  </div>
</wa-card>

<style>
  wa-card {
    width: 100%;
    max-width: 490px;
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
</style>
