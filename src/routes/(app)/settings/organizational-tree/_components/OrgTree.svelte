<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { toast } from "svelte-sonner";
  import { invalidateAll } from "$app/navigation";
  import Building2 from "@lucide/svelte/icons/building-2";
  import Building from "@lucide/svelte/icons/building";
  import Warehouse from "@lucide/svelte/icons/warehouse";
  import Plus from "@lucide/svelte/icons/plus";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import type { Component } from "svelte";
  import type { OrgUnitTreeResponseDto } from "$lib/api/types";

  let {
    tree,
    selectedId = null,
    onSelect,
    onAddRoot,
    onAddChild,
  }: {
    tree: OrgUnitTreeResponseDto[];
    selectedId: string | null;
    onSelect: (node: OrgUnitTreeResponseDto) => void;
    onAddRoot: () => void;
    onAddChild: (parentId: string) => void;
  } = $props();

  // Type icon mapping
  const typeIcons: Record<string, Component> = {
    subsidiary: Building2,
    division: Building,
    facility: Warehouse,
  };

  // Track expanded state by node ID
  let expanded = $state<Record<string, boolean>>({});

  // Auto-expand root nodes on first render
  $effect(() => {
    for (const node of tree) {
      if (!(node.id in expanded)) {
        expanded[node.id] = true;
      }
    }
  });

  function toggleExpand(nodeId: string, e: Event) {
    e.stopPropagation();
    expanded[nodeId] = !expanded[nodeId];
  }

  // --- Drag and Drop ---
  let draggedNodeId = $state<string | null>(null);
  let dropTargetId = $state<string | null>(null);

  // Collect all descendant IDs for a node (to prevent dropping onto self/descendants)
  function getDescendantIds(
    nodes: OrgUnitTreeResponseDto[],
    targetId: string,
  ): Set<string> {
    const result = new Set<string>();
    function collect(children: OrgUnitTreeResponseDto[]) {
      for (const child of children) {
        result.add(child.id);
        if (child.children.length > 0) collect(child.children);
      }
    }
    // Find the target node in the tree
    function find(
      nodes: OrgUnitTreeResponseDto[],
    ): OrgUnitTreeResponseDto | null {
      for (const n of nodes) {
        if (n.id === targetId) return n;
        const found = find(n.children);
        if (found) return found;
      }
      return null;
    }
    const node = find(nodes);
    if (node) collect(node.children);
    return result;
  }

  function handleDragStart(nodeId: string, e: DragEvent) {
    draggedNodeId = nodeId;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", nodeId);
    }
  }

  function handleDragOver(nodeId: string, e: DragEvent) {
    e.preventDefault();
    if (!draggedNodeId || draggedNodeId === nodeId) return;

    // Prevent dropping onto self or descendants
    const descendants = getDescendantIds(tree, draggedNodeId);
    if (descendants.has(nodeId)) return;

    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    dropTargetId = nodeId;
  }

  function handleDragLeave() {
    dropTargetId = null;
  }

  function handleDragEnd() {
    draggedNodeId = null;
    dropTargetId = null;
  }

  async function handleDrop(targetParentId: string | null, e: DragEvent) {
    e.preventDefault();
    dropTargetId = null;

    if (!draggedNodeId || draggedNodeId === targetParentId) return;

    // Prevent dropping onto descendants
    if (targetParentId) {
      const descendants = getDescendantIds(tree, draggedNodeId);
      if (descendants.has(targetParentId)) {
        toast.error("Cannot move a node under its own descendant.");
        draggedNodeId = null;
        return;
      }
    }

    try {
      const response = await fetch("/settings/organizational-tree/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draggedNodeId,
          parentId: targetParentId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to move node.");
      } else {
        toast.success("Node moved successfully.");
        await invalidateAll();
      }
    } catch {
      toast.error("Failed to move node.");
    }

    draggedNodeId = null;
  }
</script>

<div class="tree-panel flex flex-col gap-3">
  <div class="flex justify-between items-center">
    <span class="text-lg font-semibold">Organization</span>
    <Button size="sm" onclick={onAddRoot}>
      <Plus class="size-4 mr-1" />
      Add
    </Button>
  </div>

  <Separator />

  {#if tree.length === 0}
    <div class="flex flex-col items-center gap-2 py-8 text-center">
      <p class="text-sm text-muted-foreground">No organizational units yet.</p>
      <Button size="sm" variant="outline" onclick={onAddRoot}>
        Create your first unit
      </Button>
    </div>
  {:else}
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <div
      class="flex flex-col"
      role="tree"
      ondragover={(e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      }}
      ondrop={(e) => handleDrop(null, e)}
    >
      {#snippet renderTree(nodes: OrgUnitTreeResponseDto[], depth: number)}
        {#each nodes as node}
          {@const Icon = typeIcons[node.type] ?? Building2}
          {@const isExpanded = expanded[node.id] ?? false}
          {@const hasChildren = node.children.length > 0}
          {@const isSelected = node.id === selectedId}
          {@const isDropTarget = node.id === dropTargetId}
          <div role="treeitem" aria-selected={isSelected} aria-expanded={hasChildren ? isExpanded : undefined}>
            <div class="relative group">
              <button
                type="button"
                class="tree-node"
                class:selected={isSelected}
                class:drop-target={isDropTarget}
                style:padding-left="{depth * 20 + 8}px"
                draggable="true"
                ondragstart={(e) => handleDragStart(node.id, e)}
                ondragover={(e) => handleDragOver(node.id, e)}
                ondragleave={handleDragLeave}
                ondragend={handleDragEnd}
                ondrop={(e) => handleDrop(node.id, e)}
                onclick={() => onSelect(node)}
              >
                {#if hasChildren}
                  <span
                    role="button"
                    tabindex="-1"
                    class="chevron-toggle shrink-0"
                    onclick={(e) => toggleExpand(node.id, e)}
                    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleExpand(node.id, e); }}
                  >
                    {#if isExpanded}
                      <ChevronDown
                        class="size-4 text-muted-foreground"
                      />
                    {:else}
                      <ChevronRight
                        class="size-4 text-muted-foreground"
                      />
                    {/if}
                  </span>
                {:else}
                  <span class="w-4 shrink-0"></span>
                {/if}
                <Icon class="size-4 shrink-0" />
                <span class="truncate">{node.name}</span>
              </button>
              <!-- Hover add-child button -->
              <button
                type="button"
                class="add-child-btn"
                title="Add child"
                onclick={(e) => {
                  e.stopPropagation();
                  onAddChild(node.id);
                }}
              >
                <Plus class="size-3" />
              </button>
            </div>
            {#if hasChildren && isExpanded}
              {@render renderTree(node.children, depth + 1)}
            {/if}
          </div>
        {/each}
      {/snippet}
      {@render renderTree(tree, 0)}
    </div>
  {/if}
</div>

<style>
  .tree-panel {
    width: 300px;
    flex-shrink: 0;
    background: var(--card);
    border-right: 1px solid var(--border);
    padding: 24px;
    overflow-y: auto;
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
    transition: background-color 0.15s;
  }

  .tree-node:hover {
    background: var(--secondary);
  }

  .tree-node.selected {
    color: var(--primary);
    font-weight: 600;
    background: transparent;
  }

  .tree-node.drop-target {
    background: color-mix(in oklch, var(--primary) 10%, transparent);
    outline: 2px dashed color-mix(in oklch, var(--primary) 40%, transparent);
    outline-offset: -2px;
  }

  .chevron-toggle {
    display: inline-flex;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
  }

  .add-child-btn {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    display: none;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--muted-foreground);
    cursor: pointer;
    padding: 0;
  }

  .add-child-btn:hover {
    background: var(--secondary);
    color: var(--foreground);
  }

  .group:hover .add-child-btn {
    display: flex;
  }
</style>
