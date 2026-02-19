<script lang="ts">
  import Bell from "@lucide/svelte/icons/bell";

  import { Button } from "$lib/components/ui/button/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";

  import AppSidebar from "$components/app-sidebar.svelte";
  import CopyButton from "$components/CopyButton.svelte";

  let { data, children } = $props();
</script>

<Sidebar.Provider>
  <AppSidebar user={data.user} />
  <Sidebar.Inset class="max-h-svh overflow-hidden">
    <!-- Header -->
    <header
      class="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-card transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
    >
      <div class="flex items-center gap-2 px-4">
        <Sidebar.Trigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 !h-4" />
        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Item class="hidden md:block">
              <Breadcrumb.Link href="/dashboard">Dashboard</Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator class="hidden md:block" />
            <Breadcrumb.Item>
              <Breadcrumb.Page>Overview</Breadcrumb.Page>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>
      </div>
      <div class="ml-auto px-4">
        <Button variant="ghost" size="icon" class="size-7">
          <Bell class="size-4" />
        </Button>
      </div>
    </header>

    <!-- Content -->
    <div class="flex-1 overflow-auto">
      {@render children()}
    </div>

    <!-- Status Bar -->
    <footer class="sticky bottom-0 z-10 flex h-8 shrink-0 items-center justify-between border-t bg-card px-4">
      <div class="flex items-center gap-2">
        <span class="text-xs text-muted-foreground">Tenant ID:</span>
        <code class="font-mono text-xs text-muted-foreground">TENANT-XXXX-XXXX</code>
        <CopyButton value="TENANT-XXXX-XXXX" />
      </div>
      <div class="flex items-center gap-2">
        <span class="size-1.5 rounded-full bg-chart-3"></span>
        <span class="text-xs text-muted-foreground">Production</span>
      </div>
    </footer>
  </Sidebar.Inset>
</Sidebar.Provider>
