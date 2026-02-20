<script lang="ts">
  import { page } from "$app/state";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import SlidersHorizontal from "@lucide/svelte/icons/sliders-horizontal";
  import Calculator from "@lucide/svelte/icons/calculator";
  import Building2 from "@lucide/svelte/icons/building-2";
  import ShieldCheck from "@lucide/svelte/icons/shield-check";
  import Puzzle from "@lucide/svelte/icons/puzzle";
  import BellIcon from "@lucide/svelte/icons/bell";
  import Terminal from "@lucide/svelte/icons/terminal";
  import type { Component } from "svelte";

  let { children } = $props();

  const navItems: { href: string; label: string; icon: Component }[] = [
    { href: "/settings/company", label: "Company", icon: SlidersHorizontal },
    {
      href: "/settings/application-settings",
      label: "Application Settings",
      icon: Calculator,
    },
    {
      href: "/settings/organizational-tree",
      label: "Organizational Tree",
      icon: Building2,
    },
    { href: "/settings/security", label: "Security", icon: ShieldCheck },
    { href: "/settings/integrations", label: "Integrations", icon: Puzzle },
    { href: "/settings/notifications", label: "Notifications", icon: BellIcon },
    { href: "/settings/api", label: "API & Webhooks", icon: Terminal },
  ];

  let currentPath = $derived(page.url.pathname);
</script>

<Sidebar.Provider class="min-h-0 h-full" style="--sidebar-width: 270px;">
  <Sidebar.Root collapsible="none" class="bg-secondary text-foreground border-r">
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Settings</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            {#each navItems as item}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton
                  isActive={currentPath.startsWith(item.href)}
                  class="data-[active=true]:bg-primary/10 data-[active=true]:text-primary hover:bg-muted hover:text-foreground"
                >
                  {#snippet child({ props })}
                    <a href={item.href} {...props}>
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  {/snippet}
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            {/each}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar.Content>
  </Sidebar.Root>
  <div class="flex-1 overflow-y-auto min-h-0">
    {@render children()}
  </div>
</Sidebar.Provider>
