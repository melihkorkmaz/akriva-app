<script lang="ts">
  import { page } from "$app/state";

  let { children } = $props();

  const navItems = [
    {
      href: "/settings/company",
      label: "Company",
      icon: "adjustments-horizontal",
    },
    {
      href: "/settings/methodology-calculation",
      label: "Methodology & Calculation",
      icon: "calculator",
    },
    {
      href: "/settings/organizational-tree",
      label: "Organizational Tree",
      icon: "building-office-2",
    },
    { href: "/settings/security", label: "Security", icon: "shield-check" },
    {
      href: "/settings/integrations",
      label: "Integrations",
      icon: "puzzle-piece",
    },
    { href: "/settings/notifications", label: "Notifications", icon: "bell" },
    { href: "/settings/api", label: "API & Webhooks", icon: "command-line" },
  ];

  let currentPath = $derived(page.url.pathname);
</script>

<div class="settings-shell">
  <nav class="settings-nav">
    <span class="nav-title">SETTINGS</span>
    <div class="nav-items">
      {#each navItems as item}
        <a
          href={item.href}
          class="nav-item"
          class:active={currentPath.startsWith(item.href)}
        >
          <wa-icon library="heroicons" name={item.icon}></wa-icon>
          <span>{item.label}</span>
        </a>
      {/each}
    </div>
  </nav>
  <div class="settings-content">
    {@render children()}
  </div>
</div>

<style>
  .settings-shell {
    display: flex;
    height: 100%;
    min-height: 0;
  }

  .settings-nav {
    width: 270px;
    flex-shrink: 0;
    background: var(--akriva-surface-tertiary);
    border-right: var(--akriva-border-thin) solid var(--akriva-border-default);
    padding: var(--akriva-space-5) var(--akriva-space-4);
    overflow-y: auto;
  }

  .settings-content {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  .nav-title {
    font-size: 10px;
    font-weight: var(--akriva-weight-semibold);
    color: var(--akriva-text-secondary);
    letter-spacing: 1.2px;
  }

  .nav-items {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: var(--akriva-space-2) 0;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: var(--akriva-space-2);
    border-radius: var(--akriva-radius-sm);
    height: 40px;
    padding: var(--akriva-space-2) var(--akriva-space-3);
    color: var(--akriva-text-tertiary);
    text-decoration: none;
    font-size: var(--akriva-size-body);
    font-weight: var(--akriva-weight-medium);
    position: relative;
  }

  .nav-item:hover {
    background: var(--akriva-surface-secondary);
  }

  .nav-item.active {
    background: color-mix(
      in srgb,
      var(--akriva-action-primary) 10%,
      transparent
    );
    color: var(--akriva-action-primary);
    padding-right: 0;
    position: relative;
  }

  .nav-item.active:after {
    border-radius: 0 var(--akriva-radius-sm) var(--akriva-radius-sm) 0;
    content: "";
    position: absolute;
    top: 0;
    right: 0px;
    bottom: 0;
    width: 4px;
    background: var(--akriva-action-primary);
  }
</style>
