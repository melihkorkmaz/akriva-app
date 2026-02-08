<script lang="ts">
  import "@awesome.me/webawesome/dist/components/input/input.js";
  import "@awesome.me/webawesome/dist/components/select/select.js";
  import "@awesome.me/webawesome/dist/components/option/option.js";
  import "@awesome.me/webawesome/dist/components/radio-group/radio-group.js";
  import "@awesome.me/webawesome/dist/components/radio/radio.js";
  import "@awesome.me/webawesome/dist/components/callout/callout.js";
  import DatePicker from "$components/DatePicker.svelte";

  let consolidationApproach = $state("operational");
  let fiscalYearStart = $state("2024-01-01");
</script>

<svelte:head>
  <title>Company Settings | Akriva</title>
</svelte:head>

<div style="padding: var(--akriva-space-8) var(--akriva-space-10)">
<h1 class="wa-heading-l">Company Settings</h1>
<p class="wa-body-l wa-color-text-quiet">
  Configure your organization's emissions accounting methodology and master
  settings
</p>

<div class="wa-stack wa-gap-xl" style="margin-top: var(--akriva-space-6)">
  <!-- Company Master Settings Card -->
  <wa-card style="--spacing: var(--wa-space-xl)">
    <div class="wa-stack wa-gap-m">
    <h2 class="wa-heading-s">Company Master Settings</h2>

    <!-- Company Identification -->
    <div class="section wa-stack wa-gap-m">
      <h3 class="wa-body-l wa-font-weight-bold">Company Identification</h3>
      <div class="field-row">
        <wa-input label="Company Name" placeholder="Acme Corporation"
        ></wa-input>
        <wa-input label="Company Slug" placeholder="acme-corp"></wa-input>
      </div>
      <p class="helper">
        The company slug is a unique identifier used in URLs and API references
        (e.g., 'acme-corp')
      </p>
    </div>

    <!-- Localization -->
    <div class="section wa-stack wa-gap-m">
      <h3 class="wa-body-l wa-font-weight-bold">Localization</h3>
      <div class="field-row field-row--3">
        <wa-select label="HQ Country" placeholder="Select country" value="us">
          <wa-option value="us">United States</wa-option>
          <wa-option value="gb">United Kingdom</wa-option>
          <wa-option value="de">Germany</wa-option>
          <wa-option value="nl">Netherlands</wa-option>
        </wa-select>
        <wa-select label="State/Province" placeholder="Select state" value="ca">
          <wa-option value="ca">California</wa-option>
          <wa-option value="ny">New York</wa-option>
          <wa-option value="tx">Texas</wa-option>
        </wa-select>
        <wa-input label="City" placeholder="San Francisco"></wa-input>
      </div>
      <p class="helper">
        Location determines default Grid Factors for emissions calculations
      </p>

      <div class="wa-stack wa-gap-xs" style="max-width: 400px">
        <wa-select
          label="Reporting Currency"
          placeholder="Select currency"
          value="usd"
        >
          <wa-option value="usd">USD - US Dollar</wa-option>
          <wa-option value="eur">EUR - Euro</wa-option>
          <wa-option value="gbp">GBP - British Pound</wa-option>
        </wa-select>
        <p class="helper">Master currency for all spend-based data</p>
      </div>
    </div>

    <!-- Temporal Logic -->
    <div class="section wa-stack wa-gap-m">
      <h3 class="wa-body-l wa-font-weight-bold">Temporal Logic</h3>
      <div class="field-row">
        <div class="wa-stack wa-gap-xs">
          <DatePicker
            label="Fiscal Year Start Date"
            bind:value={fiscalYearStart}
          />
          <p class="helper">Essential for aligning with financial reports</p>
        </div>
        <div class="wa-stack wa-gap-xs">
          <wa-select label="Base Year" placeholder="Select year" value="2024">
            <wa-option value="2024">2024</wa-option>
            <wa-option value="2023">2023</wa-option>
            <wa-option value="2022">2022</wa-option>
          </wa-select>
          <p class="helper">Benchmark year for measuring reduction targets</p>
        </div>
      </div>
    </div>

    <!-- Future-Proofing -->
    <div class="section wa-stack wa-gap-m">
      <h3 class="wa-body-l wa-font-weight-bold">Future-Proofing</h3>
      <div class="field-row">
        <wa-select label="Sector" placeholder="Select sector" value="mfg">
          <wa-option value="mfg">Manufacturing</wa-option>
          <wa-option value="tech">Technology</wa-option>
          <wa-option value="fin">Financial Services</wa-option>
          <wa-option value="energy">Energy</wa-option>
        </wa-select>
        <wa-select
          label="Sub-sector"
          placeholder="Select sub-sector"
          value="chem"
        >
          <wa-option value="chem">Chemicals</wa-option>
          <wa-option value="auto">Automotive</wa-option>
          <wa-option value="food">Food & Beverage</wa-option>
        </wa-select>
      </div>
      <p class="helper">
        Sector selection filters the Process Emissions library for relevant
        emission factors
      </p>
    </div>
    </div>
  </wa-card>

  <!-- Boundary Rules Card -->
  <wa-card style="--spacing: var(--wa-space-xl)">
    <div class="wa-stack wa-gap-m">
    <h2 class="wa-heading-s">Boundary Rules (Consolidation Approach)</h2>
    <p class="wa-body-s wa-color-text-quiet">
      Determine which emissions belong to your company based on the GHG Protocol
    </p>

    <wa-radio-group
      value={consolidationApproach}
      onwa-change={(e: CustomEvent) => {
        consolidationApproach = (e.target as HTMLInputElement).value;
      }}
    >
      <div class="wa-stack wa-gap-s">
        <wa-callout
          variant={consolidationApproach === "operational"
            ? "brand"
            : "neutral"}
          appearance={consolidationApproach === "operational"
            ? "filled-outlined"
            : "outlined"}
        >
          <wa-radio slot="icon" value="operational"></wa-radio>
          <span class="wa-body-l wa-font-weight-semibold"
            >Operational Control</span
          ><br />
          <span class="wa-body-s wa-color-text-quiet">
            100% accounting if you have full authority to introduce/implement
            operating policies
          </span>
        </wa-callout>

        <wa-callout
          variant={consolidationApproach === "financial" ? "brand" : "neutral"}
          appearance={consolidationApproach === "financial"
            ? "filled-outlined"
            : "outlined"}
        >
          <wa-radio slot="icon" value="financial"></wa-radio>
          <span class="wa-body-l wa-font-weight-semibold"
            >Financial Control</span
          ><br />
          <span class="wa-body-s wa-color-text-quiet">
            100% accounting if you have the power to direct financial and
            operating policies for economic benefit
          </span>
        </wa-callout>

        <wa-callout
          variant={consolidationApproach === "equity" ? "brand" : "neutral"}
          appearance={consolidationApproach === "equity"
            ? "filled-outlined"
            : "outlined"}
        >
          <wa-radio slot="icon" value="equity"></wa-radio>
          <span class="wa-body-l wa-font-weight-semibold">Equity Share</span><br
          />
          <span class="wa-body-s wa-color-text-quiet">
            Accounting based on your % of ownership interest
          </span>
        </wa-callout>
      </div>
    </wa-radio-group>

    <wa-callout size="small">
      <wa-icon slot="icon" library="heroicons" name="information-circle"
      ></wa-icon>
      If Equity Share is selected, an Ownership Percentage field will be enabled
      in all Asset/Entry forms
    </wa-callout>
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
  /* Form sub-sections */
  .section {
    padding: var(--akriva-space-4) 0;
  }

  /* Field grid layouts */
  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--akriva-space-4);
    align-items: end;
  }

  .field-row--3 {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .helper {
    font-size: var(--akriva-size-body-sm);
    font-style: italic;
    color: var(--akriva-text-tertiary);
    margin: 0;
  }
</style>
