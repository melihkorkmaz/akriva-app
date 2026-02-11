<script lang="ts">
  import { superForm } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import "@awesome.me/webawesome/dist/components/input/input.js";
  import "@awesome.me/webawesome/dist/components/select/select.js";
  import "@awesome.me/webawesome/dist/components/option/option.js";
  import "@awesome.me/webawesome/dist/components/radio-group/radio-group.js";
  import "@awesome.me/webawesome/dist/components/radio/radio.js";
  import "@awesome.me/webawesome/dist/components/callout/callout.js";
  import CountrySelect from "$components/CountrySelect.svelte";
  import { tenantSettingsSchema } from "$lib/schemas/tenant-settings.js";
  import { waChange } from "$lib/actions/wa-events.js";
  import type { ConsolidationApproach } from "$lib/api/types.js";

  let { data } = $props();

  const { form, errors, allErrors, enhance, message, submitting } = superForm(
    data.form,
    {
      validators: zod4Client(tenantSettingsSchema),
      dataType: "json",
      resetForm: false,
      onError({ result }) {
        $message =
          typeof result.error === "string"
            ? result.error
            : "An unexpected error occurred. Please try again.";
      },
    },
  );

  let consolidationApproach = $derived(
    $form.consolidationApproach ?? "operational_control",
  );

  const MONTHS = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ] as const;

  const SECTOR_SUB_SECTORS: Record<string, string[]> = {
    Energy: [
      "Oil & Gas Exploration",
      "Oil & Gas Refining",
      "Renewable Energy",
      "Power Generation",
      "Energy Trading & Services",
    ],
    Materials: [
      "Chemicals",
      "Construction Materials",
      "Metals & Mining",
      "Paper & Forest Products",
      "Packaging",
    ],
    Industrials: [
      "Aerospace & Defense",
      "Building Products",
      "Electrical Equipment",
      "Industrial Conglomerates",
      "Machinery",
      "Commercial Services",
    ],
    Manufacturing: [
      "Automotive",
      "Electronics",
      "Food & Beverage Processing",
      "Pharmaceuticals",
      "Textiles & Apparel",
      "Metals & Steel",
    ],
    "Transportation & Logistics": [
      "Air Freight & Airlines",
      "Maritime Shipping",
      "Rail Transport",
      "Road & Trucking",
      "Warehousing & Distribution",
    ],
    Technology: [
      "Software Development",
      "Hardware & Semiconductors",
      "IT Services & Consulting",
      "Data Centers & Cloud",
      "Telecommunications",
    ],
    "Financial Services": [
      "Banking",
      "Insurance",
      "Asset Management",
      "Fintech",
      "Real Estate Investment",
    ],
    "Construction & Real Estate": [
      "Commercial Construction",
      "Residential Construction",
      "Property Management",
      "Infrastructure Development",
    ],
    "Agriculture & Forestry": [
      "Crop Production",
      "Livestock & Dairy",
      "Forestry & Logging",
      "Fisheries & Aquaculture",
      "Agricultural Services",
    ],
    Utilities: [
      "Electric Utilities",
      "Gas Utilities",
      "Water & Wastewater",
      "Waste Management & Recycling",
    ],
    Healthcare: [
      "Hospitals & Health Systems",
      "Pharmaceuticals & Biotech",
      "Medical Devices",
      "Health Services",
    ],
    "Consumer Goods & Retail": [
      "Food & Beverage Retail",
      "Consumer Products",
      "Wholesale & Distribution",
      "E-Commerce",
    ],
    "Hospitality & Tourism": [
      "Hotels & Accommodation",
      "Restaurants & Food Services",
      "Travel & Leisure",
    ],
    "Mining & Extraction": [
      "Coal Mining",
      "Metal Ore Mining",
      "Non-Metallic Mining",
      "Quarrying",
    ],
  };

  const SECTORS = Object.keys(SECTOR_SUB_SECTORS);

  function getSubSectors(sector: string | null | undefined): string[] {
    return sector ? (SECTOR_SUB_SECTORS[sector] ?? []) : [];
  }

  let subSectorOptions = $state(getSubSectors($form.sector));
  let subSectorKey = $state(0);

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

  {#if $message}
    <wa-callout
      variant={$message === "Settings saved successfully."
        ? "success"
        : "danger"}
      style="margin-top: var(--akriva-space-4)"
    >
      {$message}
    </wa-callout>
  {/if}

  {#if $allErrors.length > 0}
    <wa-callout variant="danger" style="margin-top: var(--akriva-space-4)">
      <strong>Please fix the following errors:</strong>
      <ul style="margin: var(--akriva-space-2) 0 0; padding-left: var(--akriva-space-4)">
        {#each $allErrors as error}
          <li>{error.messages.join(", ")}</li>
        {/each}
      </ul>
    </wa-callout>
  {/if}

  <form method="POST" use:enhance>
    <div class="wa-stack wa-gap-xl" style="margin-top: var(--akriva-space-6)">
      <!-- Company Master Settings Card -->
      <wa-card style="--spacing: var(--wa-space-xl)">
        <div class="wa-stack wa-gap-m">
          <h2 class="wa-heading-s">Company Master Settings</h2>

          <!-- Company Identification -->
          <div class="section wa-stack wa-gap-m">
            <h3 class="wa-body-l wa-font-weight-bold">
              Company Identification
            </h3>
            <div class="field-row">
              <div class="field">
                <wa-input
                  name="name"
                  label="Company Name"
                  placeholder="Acme Corporation"
                  value={$form.name}
                  oninput={(e: Event) => {
                    $form.name = (e.target as HTMLInputElement).value;
                  }}
                  data-invalid={$errors.name ? "" : undefined}
                ></wa-input>
                {#if $errors.name}
                  <small class="error-message">{$errors.name[0]}</small>
                {/if}
              </div>
              <div class="field">
                <wa-input
                  name="slug"
                  label="Company Slug"
                  placeholder="acme-corp"
                  value={$form.slug}
                  oninput={(e: Event) => {
                    $form.slug = (e.target as HTMLInputElement).value;
                  }}
                  data-invalid={$errors.slug ? "" : undefined}
                ></wa-input>
                {#if $errors.slug}
                  <small class="error-message">{$errors.slug[0]}</small>
                {/if}
              </div>
            </div>
            <p class="helper">
              The company slug is a unique identifier used in URLs and API
              references (e.g., 'acme-corp')
            </p>
          </div>

          <!-- Localization -->
          <div class="section wa-stack wa-gap-m">
            <h3 class="wa-body-l wa-font-weight-bold">Localization</h3>
            <div class="field-row field-row--3">
              <div class="field">
                <CountrySelect
                  label="HQ Country"
                  name="hqCountry"
                  bind:value={$form.hqCountry}
                  data-invalid={$errors.hqCountry ? "" : undefined}
                />
                {#if $errors.hqCountry}
                  <small class="error-message">{$errors.hqCountry[0]}</small>
                {/if}
              </div>
              <div class="field">
                <wa-input
                  name="stateProvince"
                  label="State/Province"
                  placeholder="California"
                  value={$form.stateProvince ?? ""}
                  oninput={(e: Event) => {
                    const val = (e.target as HTMLInputElement).value;
                    $form.stateProvince = val || null;
                  }}
                  data-invalid={$errors.stateProvince ? "" : undefined}
                ></wa-input>
                {#if $errors.stateProvince}
                  <small class="error-message"
                    >{$errors.stateProvince[0]}</small
                  >
                {/if}
              </div>
              <div class="field">
                <wa-input
                  name="city"
                  label="City"
                  placeholder="San Francisco"
                  value={$form.city ?? ""}
                  oninput={(e: Event) => {
                    const val = (e.target as HTMLInputElement).value;
                    $form.city = val || null;
                  }}
                  data-invalid={$errors.city ? "" : undefined}
                ></wa-input>
                {#if $errors.city}
                  <small class="error-message">{$errors.city[0]}</small>
                {/if}
              </div>
            </div>
            <p class="helper">
              Location determines default Grid Factors for emissions
              calculations
            </p>

            <div class="wa-stack wa-gap-xs" style="max-width: 400px">
              <div class="field">
                <wa-input
                  name="reportingCurrency"
                  label="Reporting Currency (ISO)"
                  placeholder="USD"
                  value={$form.reportingCurrency ?? ""}
                  oninput={(e: Event) => {
                    const val = (e.target as HTMLInputElement).value;
                    $form.reportingCurrency = val || null;
                  }}
                  data-invalid={$errors.reportingCurrency ? "" : undefined}
                ></wa-input>
                {#if $errors.reportingCurrency}
                  <small class="error-message"
                    >{$errors.reportingCurrency[0]}</small
                  >
                {/if}
              </div>
              <p class="helper">Master currency for all spend-based data</p>
            </div>
          </div>

          <!-- Temporal Logic -->
          <div class="section wa-stack wa-gap-m">
            <h3 class="wa-body-l wa-font-weight-bold">Temporal Logic</h3>
            <div class="field-row">
              <div class="wa-stack wa-gap-xs">
                <div class="field-row">
                  <div class="field">
                    <input type="hidden" name="fiscalYearStartMonth" value={$form.fiscalYearStartMonth ?? ""} />
                    <wa-select
                      label="Fiscal Year (Month)"
                      placeholder="Select month"
                      value={$form.fiscalYearStartMonth != null ? String($form.fiscalYearStartMonth) : ""}
                      clearable
                      data-invalid={$errors.fiscalYearStartMonth ? "" : undefined}
                      use:waChange={(val) => { $form.fiscalYearStartMonth = val ? Number(val) : null; }}
                    >
                      {#each MONTHS as month}
                        <wa-option value={String(month.value)}>{month.label}</wa-option>
                      {/each}
                    </wa-select>
                    {#if $errors.fiscalYearStartMonth}
                      <small class="error-message">{$errors.fiscalYearStartMonth[0]}</small>
                    {/if}
                  </div>
                  <div class="field">
                    <input type="hidden" name="fiscalYearStartDay" value={$form.fiscalYearStartDay ?? ""} />
                    <wa-select
                      label="Fiscal Year (Day)"
                      placeholder="Select day"
                      value={$form.fiscalYearStartDay != null ? String($form.fiscalYearStartDay) : ""}
                      clearable
                      data-invalid={$errors.fiscalYearStartDay ? "" : undefined}
                      use:waChange={(val) => { $form.fiscalYearStartDay = val ? Number(val) : null; }}
                    >
                      {#each Array.from({ length: 31 }, (_, i) => i + 1) as day}
                        <wa-option value={String(day)}>{day}</wa-option>
                      {/each}
                    </wa-select>
                    {#if $errors.fiscalYearStartDay}
                      <small class="error-message">{$errors.fiscalYearStartDay[0]}</small>
                    {/if}
                  </div>
                </div>
                <p class="helper">
                  Essential for aligning with financial reports
                </p>
              </div>
              <div class="wa-stack wa-gap-xs">
                <div class="field">
                  <wa-input
                    name="baseYear"
                    label="Base Year"
                    type="number"
                    placeholder="2024"
                    value={$form.baseYear ?? ""}
                    oninput={(e: Event) => {
                      const val = (e.target as HTMLInputElement).value;
                      $form.baseYear = val ? Number(val) : null;
                    }}
                    data-invalid={$errors.baseYear ? "" : undefined}
                  ></wa-input>
                  {#if $errors.baseYear}
                    <small class="error-message">{$errors.baseYear[0]}</small>
                  {/if}
                </div>
                <p class="helper">
                  Benchmark year for measuring reduction targets
                </p>
              </div>
            </div>
          </div>

          <!-- Future-Proofing -->
          <div class="section wa-stack wa-gap-m">
            <h3 class="wa-body-l wa-font-weight-bold">Future-Proofing</h3>
            <div class="field-row">
              <div class="field">
                <input type="hidden" name="sector" value={$form.sector ?? ""} />
                <wa-select
                  label="Sector"
                  placeholder="Select sector"
                  value={$form.sector ?? ""}
                  clearable
                  data-invalid={$errors.sector ? "" : undefined}
                  use:waChange={(val) => {
                    $form.sector = val || null;
                    subSectorOptions = getSubSectors($form.sector);
                    if (!$form.sector || !subSectorOptions.includes($form.subSector ?? "")) {
                      $form.subSector = null;
                    }
                    subSectorKey++;
                  }}
                >
                  {#each SECTORS as sector}
                    <wa-option value={sector}>{sector}</wa-option>
                  {/each}
                </wa-select>
                {#if $errors.sector}
                  <small class="error-message">{$errors.sector[0]}</small>
                {/if}
              </div>
              <div class="field">
                <input type="hidden" name="subSector" value={$form.subSector ?? ""} />
                {#key subSectorKey}
                  <wa-select
                    label="Sub-sector"
                    placeholder={subSectorOptions.length > 0 ? "Select sub-sector" : "Select a sector first"}
                    value={$form.subSector ?? ""}
                    clearable
                    data-invalid={$errors.subSector ? "" : undefined}
                    use:waChange={(val) => { $form.subSector = val || null; }}
                  >
                    {#each subSectorOptions as subSector}
                      <wa-option value={subSector}>{subSector}</wa-option>
                    {/each}
                  </wa-select>
                {/key}
                {#if $errors.subSector}
                  <small class="error-message">{$errors.subSector[0]}</small>
                {/if}
              </div>
            </div>
            <p class="helper">
              Sector selection filters the Process Emissions library for
              relevant emission factors
            </p>
          </div>
        </div>
      </wa-card>

      <!-- Boundary Rules Card -->
      <wa-card style="--spacing: var(--wa-space-xl)">
        <div class="wa-stack wa-gap-m">
          <h2 class="wa-heading-s">Boundary Rules (Consolidation Approach)</h2>
          <p class="wa-body-s wa-color-text-quiet">
            Determine which emissions belong to your company based on the GHG
            Protocol
          </p>

          <input
            type="hidden"
            name="consolidationApproach"
            value={$form.consolidationApproach ?? ""}
          />

          <wa-radio-group
            value={consolidationApproach}
            use:waChange={(val) => { $form.consolidationApproach = (val as ConsolidationApproach) || null; }}
          >
            <div class="wa-stack wa-gap-s">
              <wa-callout
                variant={consolidationApproach === "operational_control"
                  ? "brand"
                  : "neutral"}
                appearance={consolidationApproach === "operational_control"
                  ? "filled-outlined"
                  : "outlined"}
              >
                <wa-radio slot="icon" value="operational_control"></wa-radio>
                <span class="wa-body-l wa-font-weight-semibold"
                  >Operational Control</span
                ><br />
                <span class="wa-body-s wa-color-text-quiet">
                  100% accounting if you have full authority to
                  introduce/implement operating policies
                </span>
              </wa-callout>

              <wa-callout
                variant={consolidationApproach === "financial_control"
                  ? "brand"
                  : "neutral"}
                appearance={consolidationApproach === "financial_control"
                  ? "filled-outlined"
                  : "outlined"}
              >
                <wa-radio slot="icon" value="financial_control"></wa-radio>
                <span class="wa-body-l wa-font-weight-semibold"
                  >Financial Control</span
                ><br />
                <span class="wa-body-s wa-color-text-quiet">
                  100% accounting if you have the power to direct financial and
                  operating policies for economic benefit
                </span>
              </wa-callout>

              <wa-callout
                variant={consolidationApproach === "equity_share"
                  ? "brand"
                  : "neutral"}
                appearance={consolidationApproach === "equity_share"
                  ? "filled-outlined"
                  : "outlined"}
              >
                <wa-radio slot="icon" value="equity_share"></wa-radio>
                <span class="wa-body-l wa-font-weight-semibold"
                  >Equity Share</span
                ><br />
                <span class="wa-body-s wa-color-text-quiet">
                  Accounting based on your % of ownership interest
                </span>
              </wa-callout>
            </div>
          </wa-radio-group>

          <wa-callout size="small">
            <wa-icon slot="icon" library="heroicons" name="information-circle"
            ></wa-icon>
            If Equity Share is selected, an Ownership Percentage field will be
            enabled in all Asset/Entry forms
          </wa-callout>
        </div>
      </wa-card>

      <!-- Action Buttons -->
      <div
        class="wa-cluster wa-gap-s"
        style="justify-content: flex-end; padding: var(--akriva-space-4) 0"
      >
        <wa-button appearance="outlined" type="button" href="/settings/company"
          >Cancel</wa-button
        >
        {#if $submitting}
          <wa-button type="submit" loading disabled>Save Changes</wa-button>
        {:else}
          <wa-button type="submit">Save Changes</wa-button>
        {/if}
      </div>
    </div>
  </form>
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

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--wa-space-xs);
  }

  .helper {
    font-size: var(--akriva-size-body-sm);
    font-style: italic;
    color: var(--akriva-text-tertiary);
    margin: 0;
  }

  .error-message {
    color: var(--akriva-status-error);
    font-size: var(--wa-font-size-s);
  }
</style>
