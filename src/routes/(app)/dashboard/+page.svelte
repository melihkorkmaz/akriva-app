<script lang="ts">
  import "@awesome.me/webawesome/dist/components/callout/callout.js";
</script>

<svelte:head>
  <title>Dashboard | Akriva</title>
</svelte:head>

<div
  class="onboarding wa-stack wa-gap-l wa-align-items-center wa-justify-content-center"
>
  <!-- Empty State Icon -->
  <div class="state-icon">
    <wa-icon
      library="heroicons"
      name="book-open"
      style="font-size: 40px; color: var(--akriva-text-tertiary);"
    ></wa-icon>
  </div>

  <!-- Welcome Text -->
  <div class="wa-stack wa-gap-xs wa-align-items-center">
    <h2>Welcome to Akriva</h2>
    <p class="wa-body-l wa-color-text-quiet" style="text-align: center;">
      Complete these steps to start your carbon accounting journey
    </p>
  </div>

  <!-- Success Checklist -->
  <wa-card style="width: 100%; max-width: 600px;">
    <div class="wa-stack wa-gap-l">
      <!-- Header -->
      <div class="wa-cluster wa-gap-s wa-align-items-center">
        <wa-icon
          library="heroicons"
          name="document-check"
          style="color: var(--akriva-action-primary); font-size: 24px;"
        ></wa-icon>
        <h3>Success Checklist</h3>
      </div>

      <!-- Progress -->
      <div class="progress-section wa-stack wa-gap-xs">
        <div
          class="wa-cluster wa-align-items-center"
          style="justify-content: space-between;"
        >
          <span class="wa-caption-xs wa-color-text-quiet">Setup Progress</span>
          <span
            class="wa-font-weight-semibold"
            style="color: var(--akriva-action-primary); font-size: var(--akriva-size-body);"
            >0/3 Completed</span
          >
        </div>
        <wa-progress-bar value="0" max="100"></wa-progress-bar>
      </div>

      <wa-divider></wa-divider>

      <!-- Tasks -->
      <div class="wa-stack wa-gap-m">
        <wa-callout variant="neutral" appearance="filled-outlined">
          <wa-checkbox slot="icon"></wa-checkbox>
          <strong>Task 1: Define Boundary</strong><br />
          <span class="wa-body-s wa-color-text-quiet"
            >Set up organizational boundaries and reporting scope</span
          ><br />
          <span
            class="wa-caption-xs"
            style="color: var(--akriva-text-tertiary);">Status: Incomplete</span
          >
        </wa-callout>

        <wa-callout variant="neutral" appearance="filled-outlined">
          <wa-checkbox slot="icon"></wa-checkbox>
          <strong>Task 2: Configure Company Master</strong><br />
          <span class="wa-body-s wa-color-text-quiet"
            >Add company details, locations, and operational units</span
          ><br />
          <span
            class="wa-caption-xs"
            style="color: var(--akriva-text-tertiary);">Status: Incomplete</span
          >
        </wa-callout>

        <wa-callout variant="neutral" appearance="filled-outlined">
          <wa-checkbox slot="icon"></wa-checkbox>
          <strong>Task 3: Set Calculation Engine</strong><br />
          <span class="wa-body-s wa-color-text-quiet"
            >Configure emission factors and calculation methodology</span
          ><br />
          <span
            class="wa-caption-xs"
            style="color: var(--akriva-text-tertiary);">Status: Incomplete</span
          >
        </wa-callout>
      </div>
    </div>
  </wa-card>
</div>

<style>
  .onboarding {
    padding: var(--akriva-space-12);
    height: 100%;
  }

  .state-icon {
    width: 80px;
    height: 80px;
    border-radius: var(--akriva-radius-full);
    background: var(--akriva-surface-tertiary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .progress-section {
    background: var(--akriva-surface-tertiary);
    padding: var(--akriva-space-3) var(--akriva-space-4);
    border-radius: var(--akriva-radius-xs);
  }

  wa-checkbox {
    --wa-form-control-toggle-size: 24px;
  }

  wa-progress-bar {
    --track-height: 4px;
  }
</style>
