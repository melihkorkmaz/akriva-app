<script lang="ts">
  import "@awesome.me/webawesome/dist/components/input/input.js";
  import "@awesome.me/webawesome/dist/components/select/select.js";
  import "@awesome.me/webawesome/dist/components/option/option.js";
  import "@awesome.me/webawesome/dist/components/radio-group/radio-group.js";
  import "@awesome.me/webawesome/dist/components/radio/radio.js";

  let gwpVersion = $state("ar6");
</script>

<svelte:head>
  <title>Methodology & Calculation | Akriva</title>
</svelte:head>

<div style="padding: var(--akriva-space-8) var(--akriva-space-10)">
<h1 class="wa-heading-l">Methodology & Calculation Engine</h1>
<p class="wa-body-l wa-color-text-quiet">
  Configure calculation methodology, localization settings, and scientific
  standards for emissions tracking
</p>

<div class="wa-stack wa-gap-xl" style="margin-top: var(--akriva-space-6)">
  <!-- Localization (Numbers) Card -->
  <wa-card style="--spacing: var(--wa-space-xl)">
    <div class="wa-stack wa-gap-l">
      <div class="wa-stack wa-gap-2xs">
        <h2 class="wa-heading-s">Localization (Numbers)</h2>
        <p class="wa-body-s wa-color-text-quiet">
          Configure number formatting preferences for your organization
        </p>
      </div>

      <div class="loc-fields">
        <wa-select label="Decimal Separator" value="point" style="width: 280px">
          <wa-option value="point">Point (.)</wa-option>
          <wa-option value="comma">Comma (,)</wa-option>
        </wa-select>

        <wa-select
          label="Thousands Separator"
          value="comma"
          style="width: 280px"
        >
          <wa-option value="comma">Comma (,)</wa-option>
          <wa-option value="point">Point (.)</wa-option>
          <wa-option value="space">Space ( )</wa-option>
        </wa-select>

        <div class="wa-stack wa-gap-xs" style="width: 200px">
          <span class="wa-font-weight-semibold">Decimal Precision</span>
          <div class="wa-cluster wa-gap-xs" style="align-items: center">
            <wa-input type="number" value="2" style="width: 80px"></wa-input>
          </div>
        </div>
      </div>

      <!-- Format Examples -->
      <div class="examples-section wa-stack wa-gap-s">
        <span class="examples-title">Format Examples</span>
        <div class="wa-cluster wa-gap-xl">
          <div class="wa-stack wa-gap-2xs">
            <span
              style="font-size: var(--akriva-size-body-sm); color: var(--akriva-text-tertiary)"
              >Carbon Emissions (tCO₂e)</span
            >
            <span class="mono-value">12,345.67</span>
          </div>
          <div class="wa-stack wa-gap-2xs">
            <span
              style="font-size: var(--akriva-size-body-sm); color: var(--akriva-text-tertiary)"
              >Energy (MWh)</span
            >
            <span class="mono-value">987,654.32</span>
          </div>
          <div class="wa-stack wa-gap-2xs">
            <span
              style="font-size: var(--akriva-size-body-sm); color: var(--akriva-text-tertiary)"
              >Reduction %</span
            >
            <span
              class="mono-value"
              style="color: var(--akriva-status-verified)">45.89</span
            >
          </div>
          <div class="wa-stack wa-gap-2xs">
            <span
              style="font-size: var(--akriva-size-body-sm); color: var(--akriva-text-tertiary)"
              >Total Emissions</span
            >
            <span class="mono-value">1,234,567,890.12</span>
          </div>
        </div>
      </div>
    </div>
  </wa-card>

  <!-- Scientific Authority Card -->
  <wa-card style="--spacing: var(--wa-space-xl)">
    <div class="wa-stack wa-gap-l">
      <div class="wa-stack wa-gap-2xs">
        <h2 class="wa-heading-s">Scientific Authority</h2>
        <p class="wa-body-s wa-color-text-quiet">
          Select authoritative sources for emissions calculations and global
          warming potentials
        </p>
      </div>

      <div class="wa-stack wa-gap-3xl">
        <!-- GWP Version -->
        <div class="wa-stack wa-gap-s" style="max-width: 400px">
          <div class="wa-stack wa-gap-2xs">
            <span class="wa-font-weight-semibold">GWP Version</span>
            <span
              style="font-size: var(--akriva-size-body-sm); color: var(--akriva-text-tertiary)"
            >
              Global Warming Potential values for CH₄ and N₂O
            </span>
          </div>
          <wa-radio-group
            value={gwpVersion}
            onwa-change={(e: CustomEvent) => {
              gwpVersion = (e.target as HTMLInputElement).value;
            }}
          >
            <div class="wa-cluster wa-gap-s">
              <wa-radio value="ar6">IPCC AR6</wa-radio>
              <wa-radio value="ar5">IPCC AR5</wa-radio>
            </div>
          </wa-radio-group>
        </div>

        <!-- Standard Mapping -->
        <div class="wa-stack wa-gap-s">
          <div class="wa-stack wa-gap-2xs">
            <span class="wa-font-weight-semibold">Standard Mapping</span>
            <span
              style="font-size: var(--akriva-size-body-sm); color: var(--akriva-text-tertiary)"
            >
              Assigning authorities for emission scopes
            </span>
          </div>
          <div class="wa-cluster wa-gap-m">
            <div class="wa-stack wa-gap-2xs" style="width: 240px">
              <wa-select value="ipcc" label="Scope 1 - Direct">
                <wa-option value="ipcc">IPCC Guidelines</wa-option>
                <wa-option value="epa">EPA</wa-option>
                <wa-option value="defra">DEFRA</wa-option>
              </wa-select>
            </div>
            <div class="wa-stack wa-gap-2xs" style="width: 240px">
              <wa-select value="defra-iea" label="Scope 2 - Energy">
                <wa-option value="defra-iea">DEFRA / IEA</wa-option>
                <wa-option value="epa">EPA eGRID</wa-option>
                <wa-option value="ipcc">IPCC Guidelines</wa-option>
              </wa-select>
            </div>
          </div>
        </div>
      </div>
    </div>
  </wa-card>

  <!-- Action Buttons -->
  <div
    class="wa-cluster wa-gap-s"
    style="justify-content: flex-end; padding: var(--akriva-space-4) 0"
  >
    <wa-button appearance="outlined">Cancel</wa-button>
    <wa-button>Save Changes</wa-button>
  </div>
</div>
</div>

<style>
  .loc-fields {
    display: flex;
    gap: var(--akriva-space-8);
    align-items: end;
  }

  .mono-value {
    font-family: var(--akriva-font-mono);
    font-size: var(--akriva-size-body-lg);
    font-weight: var(--akriva-weight-medium);
  }

  .examples-section {
    padding-top: var(--akriva-space-4);
    border-top: var(--akriva-border-thin) solid var(--akriva-border-default);
  }

  .examples-title {
    font-size: var(--akriva-size-body-sm);
    font-weight: var(--akriva-weight-semibold);
    color: var(--akriva-text-secondary);
    letter-spacing: 0.5px;
  }
</style>
