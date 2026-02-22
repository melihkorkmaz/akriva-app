<script lang="ts">
  import { page } from "$app/state";

  import LayoutGrid from "@lucide/svelte/icons/layout-grid";
  import Globe from "@lucide/svelte/icons/globe";
  import Archive from "@lucide/svelte/icons/archive";
  import FileText from "@lucide/svelte/icons/file-text";
  import Box from "@lucide/svelte/icons/box";
  import Users from "@lucide/svelte/icons/users";
  import ClipboardList from "@lucide/svelte/icons/clipboard-list";
  import FileCheck from "@lucide/svelte/icons/file-check";
  import ListChecks from "@lucide/svelte/icons/list-checks";
  import Megaphone from "@lucide/svelte/icons/megaphone";
  import Settings from "@lucide/svelte/icons/settings";
  import UsersRound from "@lucide/svelte/icons/users-round";

  import * as Sidebar from "$lib/components/ui/sidebar";

  import AkrivaLogo from "$components/AkrivaLogo.svelte";
  import NavUser from "$components/nav-user.svelte";

  import type { SessionUser } from "$lib/server/auth";

  interface Props {
    user: SessionUser;
  }

  let { user }: Props = $props();

  let isAdmin = $derived(
    user.role === 'tenant_admin' || user.role === 'super_admin'
  );

  const dataItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutGrid },
    { title: "Scope 1-3", url: "/scope-1/emission-entries", icon: Globe },
    { title: "Evidence Vault", url: "/#", icon: Archive },
    { title: "Reports", url: "/#", icon: FileText },
    { title: "Assets", url: "/#", icon: Box },
    { title: "Team", url: "/#", icon: Users },
    { title: "Inventory", url: "/#", icon: ClipboardList },
    { title: "Evidence", url: "/#", icon: FileCheck },
    { title: "My Tasks", url: "/tasks", icon: ListChecks },
  ];

  const adminItems = [
    { title: "Campaigns", url: "/campaigns", icon: Megaphone },
    { title: "Settings", url: "/settings", icon: Settings },
    { title: "Team Members", url: "/settings/team-members", icon: UsersRound },
  ];
</script>

<Sidebar.Root collapsible="icon">
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton size="lg" class="hover:bg-transparent active:bg-transparent">
          {#snippet child({ props })}
            <a href="/dashboard" {...props}>
              <div class="sidebar-logo-icon flex aspect-square size-8 items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 44L24 4L44 44L36 44L24 20L12 44Z" fill="var(--sidebar-primary)" />
                  <rect x="18" y="28" width="12" height="3" fill="var(--sidebar-foreground)" />
                </svg>
              </div>
              <span class="text-lg font-semibold tracking-tight text-sidebar-foreground">AKRIVA</span>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>

  <Sidebar.Content>
    <!-- Data Group -->
    <Sidebar.Group>
      <Sidebar.GroupLabel>Data</Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {#each dataItems as item}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                tooltipContent={item.title}
                isActive={page.url.pathname === item.url || page.url.pathname.startsWith(item.url + "/")}
              >
                {#snippet child({ props })}
                  <a href={item.url} {...props}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          {/each}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>

    <!-- Admin Group -->
    {#if isAdmin}
      <Sidebar.Group>
        <Sidebar.GroupLabel>Admin</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            {#each adminItems as item}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton
                  tooltipContent={item.title}
                  isActive={page.url.pathname === item.url || page.url.pathname.startsWith(item.url + "/")}
                >
                  {#snippet child({ props })}
                    <a href={item.url} {...props}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  {/snippet}
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            {/each}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    {/if}
  </Sidebar.Content>

  <Sidebar.Footer>
    <NavUser {user} />
  </Sidebar.Footer>

  <Sidebar.Rail />
</Sidebar.Root>
