<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { Alert, AlertDescription } from "$lib/components/ui/alert/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import Building2 from "@lucide/svelte/icons/building-2";
  import Building from "@lucide/svelte/icons/building";
  import Wrench from "@lucide/svelte/icons/wrench";
  import Cpu from "@lucide/svelte/icons/cpu";
  import Warehouse from "@lucide/svelte/icons/warehouse";
  import Plus from "@lucide/svelte/icons/plus";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import Lock from "@lucide/svelte/icons/lock";
  import Info from "@lucide/svelte/icons/info";
  import AlertTriangle from "@lucide/svelte/icons/triangle-alert";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import type { Component } from "svelte";

  let nodeActive = $state(true);
  let overrideEquity = $state(true);
  let overrideMapping = $state(false);

  // Tree state
  interface TreeNode {
    id: string;
    name: string;
    icon: Component;
    expanded?: boolean;
    selected?: boolean;
    children?: TreeNode[];
  }

  let treeData = $state<TreeNode[]>([
    {
      id: "acme",
      name: "Acme Corporation",
      icon: Building2,
      expanded: true,
      children: [
        { id: "chicago", name: "Chicago HQ", icon: Building },
        {
          id: "detroit",
          name: "Detroit Factory",
          icon: Wrench,
          expanded: true,
          selected: true,
          children: [
            { id: "line-a", name: "Production Line A", icon: Cpu },
            { id: "line-b", name: "Production Line B", icon: Cpu },
          ],
        },
        { id: "texas", name: "Texas Warehouse", icon: Warehouse },
      ],
    },
  ]);

  function toggleExpand(node: TreeNode) {
    node.expanded = !node.expanded;
  }

  function selectNode(node: TreeNode) {
    // Deselect all
    function deselect(nodes: TreeNode[]) {
      for (const n of nodes) {
        n.selected = false;
        if (n.children) deselect(n.children);
      }
    }
    deselect(treeData);
    node.selected = true;
  }
</script>

<svelte:head>
  <title>Organizational Tree | Akriva</title>
</svelte:head>

<div class="org-layout">
  <!-- Left: Tree Panel -->
  <div class="tree-panel flex flex-col gap-3">
    <div class="flex justify-between items-center">
      <span class="text-lg font-semibold">Organization</span>
      <Button size="sm">
        <Plus class="size-4 mr-1" />
        Add
      </Button>
    </div>

    <Separator />

    <!-- Custom Tree -->
    <div class="flex flex-col">
      {#snippet renderTree(nodes: TreeNode[], depth: number)}
        {#each nodes as node}
          <div>
            <button
              type="button"
              class="tree-node"
              class:selected={node.selected}
              style:padding-left="{depth * 20 + 8}px"
              onclick={() => {
                selectNode(node);
                if (node.children) toggleExpand(node);
              }}
            >
              {#if node.children}
                {#if node.expanded}
                  <ChevronDown class="size-4 shrink-0 text-muted-foreground" />
                {:else}
                  <ChevronRight class="size-4 shrink-0 text-muted-foreground" />
                {/if}
              {:else}
                <span class="w-4"></span>
              {/if}
              <node.icon class="size-4 shrink-0" />
              <span class="truncate">{node.name}</span>
            </button>
            {#if node.children && node.expanded}
              {@render renderTree(node.children, depth + 1)}
            {/if}
          </div>
        {/each}
      {/snippet}
      {@render renderTree(treeData, 0)}
    </div>
  </div>

  <!-- Right: Details Panel -->
  <div class="details-panel flex flex-col gap-6">
    <h1 class="text-xl font-semibold">Facility Details</h1>

    <!-- Basic Information Card -->
    <Card.Root>
      <Card.Content class="pt-6">
        <div class="flex flex-col gap-5">
          <h2 class="text-lg font-semibold">Basic Information</h2>

          <div class="flex flex-col gap-4">
            <!-- Name + Type -->
            <div class="flex gap-4">
              <div class="flex-1 flex flex-col gap-1.5">
                <Label>Node Name</Label>
                <Input placeholder="Detroit Factory" />
              </div>
              <div class="flex flex-col gap-1.5 w-[280px]">
                <Label>Type</Label>
                <Select.Root type="single" value="factory">
                  <Select.Trigger class="w-full">Factory</Select.Trigger>
                  <Select.Content>
                    <Select.Item value="factory">Factory</Select.Item>
                    <Select.Item value="office">Office</Select.Item>
                    <Select.Item value="warehouse">Warehouse</Select.Item>
                    <Select.Item value="production-line"
                      >Production Line</Select.Item
                    >
                  </Select.Content>
                </Select.Root>
              </div>
            </div>

            <!-- Status -->
            <div class="flex flex-col gap-2">
              <span class="font-semibold">Status</span>
              <div class="flex gap-3 items-center">
                <span class="text-muted-foreground">Passive</span>
                <Switch
                  checked={nodeActive}
                  onCheckedChange={(checked) => {
                    nodeActive = checked;
                  }}
                />
                <span class="font-bold">Active</span>
              </div>
              <span class="text-xs text-muted-foreground">
                Active nodes are included in calculations
              </span>
            </div>

            <!-- Location -->
            <div class="grid grid-cols-3 gap-4">
              <div class="flex flex-col gap-1.5">
                <Label>Country</Label>
                <Select.Root type="single" value="us">
                  <Select.Trigger class="w-full">United States</Select.Trigger>
                  <Select.Content>
                    <Select.Item value="us">United States</Select.Item>
                    <Select.Item value="gb">United Kingdom</Select.Item>
                    <Select.Item value="de">Germany</Select.Item>
                  </Select.Content>
                </Select.Root>
              </div>
              <div class="flex flex-col gap-1.5">
                <Label>State</Label>
                <Select.Root type="single" value="mi">
                  <Select.Trigger class="w-full">Michigan</Select.Trigger>
                  <Select.Content>
                    <Select.Item value="mi">Michigan</Select.Item>
                    <Select.Item value="ca">California</Select.Item>
                    <Select.Item value="ny">New York</Select.Item>
                  </Select.Content>
                </Select.Root>
              </div>
              <div class="flex flex-col gap-1.5">
                <Label>City</Label>
                <Input placeholder="Detroit" />
              </div>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Boundary & Inheritance Card -->
    <Card.Root>
      <Card.Content class="pt-6">
        <div class="flex flex-col gap-5">
          <div class="flex flex-col gap-1">
            <h2 class="text-lg font-semibold">Boundary & Inheritance</h2>
            <p class="text-sm text-muted-foreground">
              Configure equity share and boundary rules for this node
            </p>
          </div>

          <div class="flex flex-col gap-4">
            <div class="flex gap-6 items-center">
              <div class="flex items-center gap-2">
                <Checkbox
                  checked={overrideEquity}
                  onCheckedChange={(checked) => {
                    overrideEquity = checked === true;
                  }}
                />
                <Label>Override Equity Share</Label>
              </div>
              <div class="flex gap-2 items-center">
                <Input type="number" value="40" class="w-[100px]" />
                <span class="font-semibold">%</span>
              </div>
            </div>

            <Alert class="border-emerald-200 bg-emerald-50 text-emerald-800">
              <Info class="size-4 text-emerald-600" />
              <AlertDescription>
                This factory is 40% owned by Acme Corporation. Emissions will be
                calculated based on this equity share.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Scientific Authority Override Card -->
    <Card.Root>
      <Card.Content class="pt-6">
        <div class="flex flex-col gap-5">
          <div class="flex flex-col gap-1">
            <h2 class="text-lg font-semibold">Scientific Authority Override</h2>
            <p class="text-sm text-muted-foreground">
              Override standard mapping for this specific node. GWP Version is
              inherited from global settings.
            </p>
          </div>

          <div class="flex flex-col gap-5">
            <!-- GWP Version (locked/inherited) -->
            <div class="flex flex-col gap-2">
              <span class="font-semibold">GWP Version (Global Setting)</span>
              <div class="flex gap-3 p-3 bg-muted rounded-sm opacity-70">
                <Lock class="size-4 text-muted-foreground" />
                <span class="text-muted-foreground">IPCC AR6 (Latest)</span>
              </div>
              <div class="flex gap-2 items-start">
                <Info class="size-3 text-muted-foreground shrink-0 mt-0.5" />
                <span class="text-xs text-muted-foreground">
                  GWP Version cannot be overridden at node level. Change in
                  global settings to apply organization-wide.
                </span>
              </div>
            </div>

            <!-- Override Standard Mapping -->
            <div class="flex flex-col gap-3">
              <div class="flex items-center gap-2">
                <Checkbox
                  checked={overrideMapping}
                  onCheckedChange={(checked) => {
                    overrideMapping = checked === true;
                  }}
                />
                <Label>Override Standard Mapping for this node</Label>
              </div>
              <div
                class="flex gap-4"
                style:opacity={overrideMapping ? "1" : "0.5"}
                style:pointer-events={overrideMapping ? "auto" : "none"}
              >
                <div class="flex-1 flex flex-col gap-1">
                  <Label>Scope 1 - Direct Emissions</Label>
                  <Select.Root type="single" value="ipcc">
                    <Select.Trigger class="w-full"
                      >IPCC Guidelines (Global)</Select.Trigger
                    >
                    <Select.Content>
                      <Select.Item value="ipcc"
                        >IPCC Guidelines (Global)</Select.Item
                      >
                      <Select.Item value="epa">EPA</Select.Item>
                      <Select.Item value="defra">DEFRA</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </div>
                <div class="flex-1 flex flex-col gap-1">
                  <Label>Scope 2 - Energy Indirect</Label>
                  <Select.Root type="single" value="defra-iea">
                    <Select.Trigger class="w-full"
                      >DEFRA / IEA (Global)</Select.Trigger
                    >
                    <Select.Content>
                      <Select.Item value="defra-iea"
                        >DEFRA / IEA (Global)</Select.Item
                      >
                      <Select.Item value="epa">EPA eGRID</Select.Item>
                      <Select.Item value="ipcc">IPCC Guidelines</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Danger Zone Card -->
    <Card.Root class="border-destructive">
      <Card.Content class="pt-6">
        <div class="flex flex-col gap-4">
          <div class="flex gap-2 items-center">
            <AlertTriangle class="size-5 text-destructive" />
            <span class="text-lg font-semibold text-destructive"
              >Danger Zone</span
            >
          </div>

          <Alert variant="destructive">
            <Info class="size-4" />
            <AlertDescription>
              <span class="font-bold">This action cannot be undone</span><br />
              <span class="text-xs">
                Deleting this node will permanently remove it and all its child
                nodes from the organizational tree. Historical data will be
                preserved in the audit trail, but the node will no longer be
                available for active calculations.
              </span>
            </AlertDescription>
          </Alert>

          <div class="flex justify-between items-center">
            <div class="flex flex-col gap-1">
              <span class="font-semibold">Delete this node</span>
              <span class="text-xs text-muted-foreground">
                Remove Detroit Factory and all associated data
              </span>
            </div>
            <Button variant="destructive">
              <Trash2 class="size-4 mr-1" />
              Delete Node
            </Button>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Action Buttons -->
    <div class="flex gap-3 justify-end py-4">
      <Button variant="outline">Cancel</Button>
      <Button>Save Changes</Button>
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
    background: var(--card);
    border-right: 1px solid var(--border);
    padding: 24px;
    overflow-y: auto;
  }

  .details-panel {
    flex: 1;
    overflow-y: auto;
    padding: 24px 32px;
  }

  .tree-node {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 4px 8px;
    border-radius: 4px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 14px;
    color: var(--muted-foreground);
    text-align: left;
  }

  .tree-node:hover {
    background: var(--secondary);
  }

  .tree-node.selected {
    color: var(--primary);
    font-weight: 600;
    background: transparent;
  }
</style>
