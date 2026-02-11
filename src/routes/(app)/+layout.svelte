<script lang="ts">
  import "@awesome.me/webawesome/dist/components/icon/icon.js";
  import "@awesome.me/webawesome/dist/components/button/button.js";
  import "@awesome.me/webawesome/dist/components/divider/divider.js";
  import "@awesome.me/webawesome/dist/components/breadcrumb/breadcrumb.js";
  import "@awesome.me/webawesome/dist/components/breadcrumb-item/breadcrumb-item.js";
  import "@awesome.me/webawesome/dist/components/avatar/avatar.js";
  import "@awesome.me/webawesome/dist/components/dropdown/dropdown.js";
  import "@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js";
  import "@awesome.me/webawesome/dist/components/badge/badge.js";
  import "@awesome.me/webawesome/dist/components/card/card.js";
  import "@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js";
  import "@awesome.me/webawesome/dist/components/copy-button/copy-button.js";
  import "@awesome.me/webawesome/dist/components/checkbox/checkbox.js";
  import { registerIconLibrary } from "@awesome.me/webawesome/dist/components/icon/library.js";

  import AkrivaLogo from "$components/AkrivaLogo.svelte";

  registerIconLibrary("heroicons", {
    resolver: (name) =>
      `https://cdn.jsdelivr.net/npm/heroicons@2.1.5/24/outline/${name}.svg`,
    mutator: (svg) =>
      svg.querySelectorAll("path").forEach((path) => {
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "currentColor");
      }),
  });

  let { data, children } = $props();

  let logoutForm: HTMLFormElement;
  const userInitial = $derived(data.user.givenName.charAt(0).toUpperCase());
</script>

<div class="app-shell">
  <!-- Sidebar -->
  <aside class="sidebar wa-dark">
    <div class="sidebar-top wa-stack wa-gap-m">
      <!-- Logo -->
      <div class="sidebar-logo">
        <AkrivaLogo />
      </div>

      <wa-divider></wa-divider>

      <!-- Navigation -->
      <div class="wa-stack wa-gap-l">
        <!-- Data Section -->
        <nav class="wa-stack wa-gap-3xs">
          <a href="/dashboard" class="active">
            <wa-icon library="heroicons" name="squares-2x2"></wa-icon>
            Dashboard
          </a>
          <a href="/#">
            <wa-icon library="heroicons" name="globe-alt"></wa-icon>
            Scope 1-3
          </a>
          <a href="/#">
            <wa-icon library="heroicons" name="archive-box"></wa-icon>
            Evidence Vault
          </a>
          <a href="/#">
            <wa-icon library="heroicons" name="document-text"></wa-icon>
            Reports
          </a>
          <a href="/#">
            <wa-icon library="heroicons" name="cube"></wa-icon>
            Assets
          </a>
          <a href="/#">
            <wa-icon library="heroicons" name="user-group"></wa-icon>
            Team
          </a>
          <a href="/#">
            <wa-icon library="heroicons" name="clipboard-document-list"
            ></wa-icon>
            Inventory
          </a>
          <a href="/#">
            <wa-icon library="heroicons" name="document-check"></wa-icon>
            Evidence
          </a>
        </nav>

        <!-- Admin Section -->
        <nav class="wa-stack wa-gap-3xs">
          <a href="/#">
            <wa-icon library="heroicons" name="cog-6-tooth"></wa-icon>
            Settings
          </a>
          <a href="/#">
            <wa-icon library="heroicons" name="users"></wa-icon>
            Team Members
          </a>
        </nav>
      </div>
    </div>

    <div class="sidebar-bottom wa-stack wa-gap-m">
      <wa-divider></wa-divider>
      <!-- Audit Score -->
      <div class="audit-score wa-cluster wa-gap-xs wa-align-items-center">
        <span class="audit-dot"></span>
        <span class="audit-label">Audit Ready</span>
        <span class="audit-value">0%</span>
      </div>
    </div>
  </aside>

  <!-- Main Area -->
  <div class="main-area">
    <!-- Header -->
    <header class="app-header wa-cluster wa-gap-m wa-align-items-center">
      <wa-button appearance="outlined" size="small">
        <wa-icon library="heroicons" name="view-columns" style="font-size: 16px"
        ></wa-icon>
      </wa-button>
      <wa-breadcrumb>
        <wa-breadcrumb-item href="/dashboard">Dashboard</wa-breadcrumb-item>
        <wa-breadcrumb-item>Overview</wa-breadcrumb-item>
      </wa-breadcrumb>
      <div class="header-end wa-cluster wa-gap-m wa-align-items-center">
        <wa-dropdown placement="bottom-end" distance="4">
          <wa-avatar
            slot="trigger"
            initials={userInitial}
            shape="circle"
            style="--size: 32px; cursor: pointer;"
          ></wa-avatar>
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
          <wa-dropdown-item
            onclick={() => (window.location.href = "/settings/profile")}
          >
            <wa-icon slot="icon" library="heroicons" name="user"></wa-icon>
            Profile
          </wa-dropdown-item>
          <wa-divider></wa-divider>
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
          <wa-dropdown-item onclick={() => logoutForm.requestSubmit()}>
            <wa-icon
              slot="icon"
              library="heroicons"
              name="arrow-right-start-on-rectangle"
            ></wa-icon>
            Logout
          </wa-dropdown-item>
        </wa-dropdown>
        <wa-button appearance="plain" size="small">
          <wa-icon library="heroicons" name="bell" style="font-size: 20px"
          ></wa-icon>
        </wa-button>
      </div>
    </header>

    <!-- Content -->
    <main class="app-content">
      {@render children()}
    </main>

    <!-- Status Bar -->
    <footer class="status-bar wa-cluster wa-align-items-center">
      <div class="wa-cluster wa-gap-xs wa-align-items-center">
        <span class="wa-caption-xs wa-color-text-quiet">Tenant ID:</span>
        <code class="tenant-id">TENANT-XXXX-XXXX</code>
        <wa-copy-button value="TENANT-XXXX-XXXX"></wa-copy-button>
      </div>
      <div class="wa-cluster wa-gap-xs wa-align-items-center">
        <span class="status-dot"></span>
        <span class="wa-caption-xs wa-color-text-quiet">Production</span>
      </div>
    </footer>
  </div>
</div>

<form bind:this={logoutForm} method="POST" action="/logout" hidden></form>

<style>
  .app-shell {
    display: flex;
    height: 100vh;
  }

  /* Sidebar */
  .sidebar {
    width: 240px;
    background: var(--akriva-brand-primary);
    display: flex;
    flex-direction: column;
    padding: var(--akriva-space-5) var(--akriva-space-4);
    flex-shrink: 0;
  }

  .sidebar-top {
    flex: 1;
    overflow: auto;
  }

  .sidebar-bottom {
    flex-shrink: 0;
  }

  /* Dark logo override */
  .sidebar-logo {
    --akriva-brand-primary: #ffffff;
    --akriva-size-display: 28px;
  }

  .sidebar-logo :global(svg) {
    width: 32px;
    height: 32px;
  }

  /* Audit score */
  .audit-score {
    padding: var(--akriva-space-2) var(--akriva-space-3);
    background: #431407;
    border: var(--akriva-border-thin) solid var(--akriva-status-risk);
    border-radius: var(--akriva-radius-xs);
  }

  .audit-dot {
    width: 6px;
    height: 6px;
    border-radius: var(--akriva-radius-full);
    background: var(--akriva-status-risk);
  }

  .audit-label {
    font-size: var(--akriva-size-body-sm);
    color: var(--akriva-status-risk-light);
  }

  .audit-value {
    font-family: var(--akriva-font-mono);
    font-size: var(--akriva-size-body);
    font-weight: var(--akriva-weight-semibold);
    color: var(--akriva-status-risk);
    margin-inline-start: auto;
  }

  /* Main area */
  .main-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .app-header {
    height: 56px;
    padding: 0 var(--akriva-space-6);
    background: var(--akriva-surface-primary);
    border-bottom: var(--akriva-border-thin) solid var(--akriva-border-default);
    flex-shrink: 0;
  }

  .app-header wa-button[appearance="outlined"]::part(base) {
    background: var(--akriva-surface-secondary);
    border-color: var(--akriva-border-default);
  }

  .header-end {
    margin-inline-start: auto;
  }

  .app-content {
    flex: 1;
    overflow: auto;
    background: var(--akriva-surface-secondary);
  }

  .status-bar {
    height: 32px;
    padding: 0 var(--akriva-space-6);
    background: var(--akriva-surface-primary);
    border-top: var(--akriva-border-thin) solid var(--akriva-border-default);
    flex-shrink: 0;
    justify-content: space-between;
  }

  .tenant-id {
    font-family: var(--akriva-font-mono);
    font-size: var(--akriva-size-body-sm);
    color: var(--akriva-text-tertiary);
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: var(--akriva-radius-full);
    background: var(--akriva-status-verified);
  }

  /* Breadcrumb: gray parent, dark current */
  wa-breadcrumb-item::part(label) {
    color: var(--akriva-text-secondary);
  }
  wa-breadcrumb-item:last-child::part(label) {
    color: var(--akriva-text-primary);
    font-weight: var(--akriva-weight-medium);
  }

  nav a {
    width: 100%;
    padding: var(--akriva-space-2) var(--akriva-space-3);
    border-radius: var(--akriva-radius-sm);
    display: flex;
    align-items: center;
    gap: var(--akriva-space-2);
    text-decoration: none;
    font-size: var(--akriva-size-body-lg);
    position: relative;
    color: hsl(from var(--akriva-text-tertiary) h s 80%);
  }

  nav wa-icon {
    font-size: 20px;
  }

  nav .active {
    background-color: hsl(from var(--akriva-action-primary) h s 32%);
    color: var(--akriva-text-inverse);
  }

  nav .active:after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 4px;
    border-radius: 0 var(--akriva-radius-sm) var(--akriva-radius-sm) 0;
    background: var(--akriva-action-primary);
  }
</style>
