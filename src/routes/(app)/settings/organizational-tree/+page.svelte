<script lang="ts">
  import "@awesome.me/webawesome/dist/components/tree/tree.js";
  import "@awesome.me/webawesome/dist/components/tree-item/tree-item.js";
  import "@awesome.me/webawesome/dist/components/input/input.js";
  import "@awesome.me/webawesome/dist/components/select/select.js";
  import "@awesome.me/webawesome/dist/components/option/option.js";
  import "@awesome.me/webawesome/dist/components/switch/switch.js";
  import "@awesome.me/webawesome/dist/components/callout/callout.js";

  let nodeActive = $state(true);
  let overrideEquity = $state(true);
  let overrideMapping = $state(false);
</script>

<svelte:head>
  <title>Organizational Tree | Akriva</title>
</svelte:head>

<div class="org-layout">
  <!-- Left: Tree Panel -->
  <div class="tree-panel wa-stack wa-gap-s">
    <div
      class="wa-cluster"
      style="justify-content: space-between; align-items: center"
    >
      <span class="wa-heading-s">Organization</span>
      <wa-button size="small">
        <wa-icon slot="start" library="heroicons" name="plus"></wa-icon>
        Add
      </wa-button>
    </div>

    <wa-divider></wa-divider>

    <wa-tree selection="single">
      <wa-tree-item expanded>
        <wa-icon library="heroicons" name="building-office-2" slot="expand-icon"
        ></wa-icon>
        Acme Corporation

        <wa-tree-item>
          <wa-icon library="heroicons" name="building-office"></wa-icon>
          Chicago HQ
        </wa-tree-item>

        <wa-tree-item selected expanded>
          <wa-icon library="heroicons" name="wrench-screwdriver"></wa-icon>
          Detroit Factory

          <wa-tree-item>
            <wa-icon library="heroicons" name="cpu-chip"></wa-icon>
            Production Line A
          </wa-tree-item>
          <wa-tree-item>
            <wa-icon library="heroicons" name="cpu-chip"></wa-icon>
            Production Line B
          </wa-tree-item>
        </wa-tree-item>

        <wa-tree-item>
          <wa-icon library="heroicons" name="archive-box"></wa-icon>
          Texas Warehouse
        </wa-tree-item>
      </wa-tree-item>
    </wa-tree>
  </div>

  <!-- Right: Details Panel -->
  <div class="details-panel wa-stack wa-gap-xl">
    <h1 class="wa-heading-m">Facility Details</h1>

    <!-- Basic Information Card -->
    <wa-card style="--spacing: var(--wa-space-xl)">
      <div class="wa-stack wa-gap-l">
        <h2 class="wa-heading-s">Basic Information</h2>

        <div class="wa-stack wa-gap-m">
          <!-- Name + Type -->
          <div class="wa-cluster wa-gap-m" style="align-items: end">
            <wa-input
              label="Node Name"
              placeholder="Detroit Factory"
              style="flex: 1"
            ></wa-input>
            <wa-select label="Type" value="factory" style="width: 280px">
              <wa-option value="factory">Factory</wa-option>
              <wa-option value="office">Office</wa-option>
              <wa-option value="warehouse">Warehouse</wa-option>
              <wa-option value="production-line">Production Line</wa-option>
            </wa-select>
          </div>

          <!-- Status -->
          <div class="wa-stack wa-gap-xs">
            <span class="wa-font-weight-semibold">Status</span>
            <div class="wa-cluster wa-gap-s" style="align-items: center">
              <span style="color: var(--akriva-text-tertiary)">Passive</span>
              <wa-switch
                checked={nodeActive}
                onchange={(e: Event) => {
                  nodeActive = (e.target as HTMLInputElement).checked;
                }}
              ></wa-switch>
              <span class="wa-font-weight-bold">Active</span>
            </div>
            <span
              style="font-size: var(--akriva-size-body-sm); color: var(--akriva-text-tertiary)"
            >
              Active nodes are included in calculations
            </span>
          </div>

          <!-- Location -->
          <div
            style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--akriva-space-4); align-items: end"
          >
            <wa-select label="Country" value="us">
              <wa-option value="us">United States</wa-option>
              <wa-option value="gb">United Kingdom</wa-option>
              <wa-option value="de">Germany</wa-option>
            </wa-select>
            <wa-select label="State" value="mi">
              <wa-option value="mi">Michigan</wa-option>
              <wa-option value="ca">California</wa-option>
              <wa-option value="ny">New York</wa-option>
            </wa-select>
            <wa-input label="City" placeholder="Detroit"></wa-input>
          </div>
        </div>
      </div>
    </wa-card>

    <!-- Boundary & Inheritance Card -->
    <wa-card style="--spacing: var(--wa-space-xl)">
      <div class="wa-stack wa-gap-l">
        <div class="wa-stack wa-gap-2xs">
          <h2 class="wa-heading-s">Boundary & Inheritance</h2>
          <p class="wa-body-s wa-color-text-quiet">
            Configure equity share and boundary rules for this node
          </p>
        </div>

        <div class="wa-stack wa-gap-m">
          <div class="wa-cluster wa-gap-xl" style="align-items: center">
            <wa-checkbox
              checked={overrideEquity}
              onchange={(e: Event) => {
                overrideEquity = (e.target as HTMLInputElement).checked;
              }}
            >
              Override Equity Share
            </wa-checkbox>
            <div class="wa-cluster wa-gap-xs" style="align-items: center">
              <wa-input type="number" value="40" style="width: 100px"
              ></wa-input>
              <span class="wa-font-weight-semibold">%</span>
            </div>
          </div>

          <wa-callout variant="success">
            <wa-icon slot="icon" library="heroicons" name="information-circle"
            ></wa-icon>
            This factory is 40% owned by Acme Corporation. Emissions will be calculated
            based on this equity share.
          </wa-callout>
        </div>
      </div>
    </wa-card>

    <!-- Scientific Authority Override Card -->
    <wa-card style="--spacing: var(--wa-space-xl)">
      <div class="wa-stack wa-gap-l">
        <div class="wa-stack wa-gap-2xs">
          <h2 class="wa-heading-s">Scientific Authority Override</h2>
          <p class="wa-body-s wa-color-text-quiet">
            Override standard mapping for this specific node. GWP Version is
            inherited from global settings.
          </p>
        </div>

        <div class="wa-stack wa-gap-l">
          <!-- GWP Version (locked/inherited) -->
          <div class="wa-stack wa-gap-xs">
            <span class="wa-font-weight-semibold"
              >GWP Version (Global Setting)</span
            >
            <div
              class="wa-cluster wa-gap-s"
              style="padding: var(--akriva-space-3); background: var(--akriva-surface-tertiary); border-radius: var(--akriva-radius-xs); opacity: 0.7"
            >
              <wa-icon
                library="heroicons"
                name="lock-closed"
                style="font-size: 16px; color: var(--akriva-text-tertiary)"
              ></wa-icon>
              <span class="wa-color-text-quiet">IPCC AR6 (Latest)</span>
            </div>
            <div class="wa-cluster wa-gap-xs" style="align-items: start">
              <wa-icon
                library="heroicons"
                name="information-circle"
                style="font-size: 12px; color: var(--akriva-text-tertiary); flex-shrink: 0; margin-top: 2px"
              ></wa-icon>
              <span
                style="font-size: var(--akriva-size-body-sm); color: var(--akriva-text-tertiary)"
              >
                GWP Version cannot be overridden at node level. Change in global
                settings to apply organization-wide.
              </span>
            </div>
          </div>

          <!-- Override Standard Mapping -->
          <div class="wa-stack wa-gap-s">
            <wa-checkbox
              checked={overrideMapping}
              onchange={(e: Event) => {
                overrideMapping = (e.target as HTMLInputElement).checked;
              }}
            >
              Override Standard Mapping for this node
            </wa-checkbox>
            <div
              class="wa-cluster wa-gap-m"
              style:opacity={overrideMapping ? "1" : "0.5"}
              style:pointer-events={overrideMapping ? "auto" : "none"}
            >
              <div class="wa-stack wa-gap-2xs" style="flex: 1">
                <wa-select label="Scope 1 - Direct Emissions" value="ipcc">
                  <wa-option value="ipcc">IPCC Guidelines (Global)</wa-option>
                  <wa-option value="epa">EPA</wa-option>
                  <wa-option value="defra">DEFRA</wa-option>
                </wa-select>
              </div>
              <div class="wa-stack wa-gap-2xs" style="flex: 1">
                <wa-select label="Scope 2 - Energy Indirect" value="defra-iea">
                  <wa-option value="defra-iea">DEFRA / IEA (Global)</wa-option>
                  <wa-option value="epa">EPA eGRID</wa-option>
                  <wa-option value="ipcc">IPCC Guidelines</wa-option>
                </wa-select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </wa-card>

    <!-- Danger Zone Card -->
    <wa-card class="danger-zone" style="--spacing: var(--wa-space-xl)">
      <div class="wa-stack wa-gap-m">
        <div class="wa-cluster wa-gap-xs" style="align-items: center">
          <wa-icon
            library="heroicons"
            name="exclamation-triangle"
            style="font-size: 20px; color: var(--akriva-status-error)"
          ></wa-icon>
          <span class="wa-heading-s" style="color: var(--akriva-status-error)">
            Danger Zone
          </span>
        </div>

        <wa-callout variant="danger">
          <wa-icon slot="icon" library="heroicons" name="information-circle"
          ></wa-icon>
          <span class="wa-font-weight-bold">This action cannot be undone</span
          ><br />
          <span
            class="wa-color-text-quiet"
            style="font-size: var(--akriva-size-body-sm)"
          >
            Deleting this node will permanently remove it and all its child
            nodes from the organizational tree. Historical data will be
            preserved in the audit trail, but the node will no longer be
            available for active calculations.
          </span>
        </wa-callout>

        <div
          class="wa-cluster"
          style="justify-content: space-between; align-items: center"
        >
          <div class="wa-stack wa-gap-2xs">
            <span class="wa-font-weight-semibold">Delete this node</span>
            <span
              style="font-size: var(--akriva-size-body-sm); color: var(--akriva-text-tertiary)"
            >
              Remove Detroit Factory and all associated data
            </span>
          </div>
          <wa-button variant="danger">
            <wa-icon slot="start" library="heroicons" name="trash"></wa-icon>
            Delete Node
          </wa-button>
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
  .org-layout {
    display: flex;
    height: 100%;
  }

  .tree-panel {
    width: 300px;
    flex-shrink: 0;
    background: var(--akriva-surface-primary);
    border-right: var(--akriva-border-thin) solid var(--akriva-border-default);
    padding: var(--akriva-space-6);
    overflow-y: auto;
  }

  .details-panel {
    flex: 1;
    overflow-y: auto;
    padding: var(--akriva-space-6) var(--akriva-space-8);
  }

  .danger-zone {
    border-color: var(--akriva-status-error);
  }

  /* Tree item spacing */
  wa-tree-item::part(item) {
    padding-block: 2px;
  }

  wa-tree-item {
    --wa-color-brand-fill-loud: transparent;
    --wa-color-text-quiet: var(--akriva-text-tertiary);
  }

  /* Selected node: primary text, bold, left border accent, no background */
  wa-tree-item[selected]::part(item) {
    background-color: transparent;
  }

  wa-tree-item[selected]::part(label) {
    color: var(--akriva-action-primary);
    font-weight: var(--akriva-weight-semibold);
  }

  wa-tree-item[selected]::part(expand-button) {
    color: var(--akriva-action-primary);
  }
</style>
