<script lang="ts">
  import "@awesome.me/webawesome/dist/components/button/button.js";
  import "@awesome.me/webawesome/dist/components/input/input.js";
  import "@awesome.me/webawesome/dist/components/card/card.js";
  import "@awesome.me/webawesome/dist/components/icon/icon.js";
  import "@awesome.me/webawesome/dist/components/callout/callout.js";

  import TextDivider from "$components/TextDivider.svelte";
  import { page } from "$app/state";

  const token = $derived(page.url.searchParams.get("token") ?? "");
  const orgName = $derived(page.url.searchParams.get("org") ?? "Organization");
</script>

<svelte:head>
  <title>Join Organization | Akriva</title>
</svelte:head>

<wa-card>
  <div class="wa-stack wa-gap-l">
    <!-- Invitation Badge -->
    <wa-callout variant="success">
      <wa-icon slot="icon" name="circle-check" variant="regular"></wa-icon>
      Valid Invitation
    </wa-callout>

    <!-- Title Section -->
    <div class="wa-stack wa-gap-xs wa-align-items-center">
      <h2>Join Your Organization</h2>
      <p class="wa-body-l wa-color-text-quiet">
        Joining <strong class="org-name">{orgName}</strong>
      </p>
    </div>

    <!-- Form -->
    <form class="wa-stack wa-gap-l">
      <div class="wa-grid">
        <wa-input
          id="firstName"
          name="firstName"
          placeholder="Jane"
          label="First Name"
        ></wa-input>
        <wa-input
          id="lastName"
          name="lastName"
          placeholder="Smith"
          label="Last Name"
        ></wa-input>
      </div>
      <wa-input
        id="email"
        name="email"
        type="email"
        placeholder="jane.smith@company.com"
        label="Email Address"
      ></wa-input>
      <div class="wa-stack wa-gap-xs">
        <wa-input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          label="Password"
          help-text="8-256 characters"
          password-toggle
        ></wa-input>
      </div>

      <!-- Invitation Token Display -->
      <wa-input
        id="token"
        name="token"
        label="Invitation Token"
        value={token || "INV-XXXX-XXXX-XXXX"}
        disabled
      ></wa-input>

      <wa-button type="submit">Join Organization</wa-button>
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

  .org-name {
    color: var(--akriva-text-primary);
  }

  wa-callout {
    --wa-form-control-padding-inline: var(--akriva-space-5) !important;
  }
</style>
