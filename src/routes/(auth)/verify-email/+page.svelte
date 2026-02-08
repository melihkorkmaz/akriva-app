<script lang="ts">
  import "@awesome.me/webawesome/dist/components/button/button.js";
  import "@awesome.me/webawesome/dist/components/input/input.js";
  import "@awesome.me/webawesome/dist/components/card/card.js";
  import "@awesome.me/webawesome/dist/components/callout/callout.js";
  import "@awesome.me/webawesome/dist/components/icon/icon.js";

  import TextDivider from "$components/TextDivider.svelte";
</script>

<svelte:head>
  <title>Verify Email | Akriva</title>
</svelte:head>

<wa-card>
  <div class="wa-stack wa-gap-2xl">
    <!-- Title -->
    <div class="wa-stack wa-gap-s wa-align-items-center">
      <h2>Verify Your Email</h2>
      <p class="wa-body-l wa-color-text-quiet">
        Enter the 6-digit verification code sent to your email
      </p>
    </div>

    <!-- Code Input -->
    <div class="wa-stack wa-gap-xl wa-align-items-center">
      <div class="wa-cluster">
        {#each Array(6) as _, i}
          <wa-input
            type="text"
            maxlength="1"
            inputmode="numeric"
            no-spin-buttons
            size="large"
          ></wa-input>
        {/each}
      </div>
      <span class="wa-body-s" style="color: var(--akriva-text-tertiary);">
        Didn't receive a code? Check your spam folder
      </span>
    </div>

    <!-- Verify Button -->
    <wa-button type="submit" style="width: 100%;">Verify Email</wa-button>

    <!-- Resend -->
    <div class="wa-cluster wa-gap-xs wa-justify-content-center">
      <span class="wa-body-s wa-color-text-quiet">Didn't receive the code?</span
      >
      <a href="/verify-email" class="wa-link wa-font-size-s wa-font-weight-bold"
        >Resend code</a
      >
    </div>

    <TextDivider />

    <!-- Back to signup -->
    <div class="wa-cluster wa-gap-xs wa-justify-content-center">
      <span class="wa-body-s wa-color-text-quiet">Changed your mind?</span>
      <a href="/signup" class="wa-link wa-font-size-s wa-font-weight-bold"
        >Go back to signup</a
      >
    </div>

    <!-- Security Note -->
    <wa-callout variant="success">
      <wa-icon
        slot="icon"
        name="circle-check"
        variant="regular"
        style="margin-right: 20px"
      ></wa-icon>
      <strong> Identity Chain Verification:</strong>
      This code establishes your cryptographic identity for all future audit entries
    </wa-callout>
  </div>
</wa-card>

<style>
  wa-input {
    max-width: 56px;
    --wa-form-control-background-color: var(--akriva-surface-secondary);
  }
  wa-callout {
    --wa-form-control-padding-inline: var(--akriva-space-5) !important;
  }
  wa-card {
    width: 100%;
    max-width: 490px;
  }
</style>
