<script lang="ts">
  import { untrack } from "svelte";
  import OrgTree from "./_components/OrgTree.svelte";
  import OrgNodeForm from "./_components/OrgNodeForm.svelte";
  import EmptyState from "./_components/EmptyState.svelte";
  import type { OrgUnitTreeResponseDto } from "$lib/api/types.js";

  let { data } = $props();

  // Panel state
  let mode = $state<"empty" | "create" | "edit">("empty");
  let selectedNode = $state<OrgUnitTreeResponseDto | null>(null);
  let createParentId = $state<string | null>(null);

  // Flatten tree into a list of { id, name } for the parent dropdown in create form
  function flattenTree(
    nodes: OrgUnitTreeResponseDto[],
  ): { id: string; name: string }[] {
    const result: { id: string; name: string }[] = [];
    function walk(nodes: OrgUnitTreeResponseDto[]) {
      for (const node of nodes) {
        result.push({ id: node.id, name: node.name });
        if (node.children.length > 0) walk(node.children);
      }
    }
    walk(nodes);
    return result;
  }

  let allNodes = $derived(flattenTree(data.tree));

  // Find a node by ID in the tree (needed to re-select after invalidateAll)
  function findNode(
    nodes: OrgUnitTreeResponseDto[],
    id: string,
  ): OrgUnitTreeResponseDto | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = findNode(node.children, id);
      if (found) return found;
    }
    return null;
  }

  // Re-sync selectedNode when tree data changes (after invalidateAll).
  // Use untrack for selectedNode/mode reads to avoid infinite loop
  // (this effect writes selectedNode, which it also reads).
  $effect(() => {
    const tree = data.tree;
    const currentNode = untrack(() => selectedNode);
    const currentMode = untrack(() => mode);

    if (currentNode && currentMode === "edit") {
      const updated = findNode(tree, currentNode.id);
      if (updated) {
        selectedNode = updated;
      } else {
        // Node was deleted or no longer exists
        selectedNode = null;
        mode = "empty";
      }
    }
  });

  function handleSelect(node: OrgUnitTreeResponseDto) {
    selectedNode = node;
    mode = "edit";
  }

  function handleAddRoot() {
    createParentId = null;
    selectedNode = null;
    mode = "create";
  }

  function handleAddChild(parentId: string) {
    createParentId = parentId;
    selectedNode = null;
    mode = "create";
  }

  function handleCreated(id: string) {
    const newNode = findNode(data.tree, id);
    if (newNode) {
      selectedNode = newNode;
      mode = "edit";
    } else {
      mode = "empty";
    }
  }

  function handleDeleted() {
    selectedNode = null;
    mode = "empty";
  }

  function handleCancel() {
    mode = selectedNode ? "edit" : "empty";
  }
</script>

<svelte:head>
  <title>Organizational Tree | Akriva</title>
</svelte:head>

<div class="org-layout">
  <OrgTree
    tree={data.tree}
    selectedId={selectedNode?.id ?? null}
    onSelect={handleSelect}
    onAddRoot={handleAddRoot}
    onAddChild={handleAddChild}
  />

  <div class="details-panel">
    {#if mode === "empty"}
      <EmptyState />
    {:else if mode === "create"}
      <OrgNodeForm
        mode="create"
        node={null}
        parentId={createParentId}
        createFormData={data.createForm}
        updateFormData={data.updateForm}
        tenantSettings={data.tenantSettings}
        {allNodes}
        onCreated={handleCreated}
        onDeleted={handleDeleted}
        onCancel={handleCancel}
      />
    {:else if mode === "edit" && selectedNode}
      <OrgNodeForm
        mode="edit"
        node={selectedNode}
        parentId={null}
        createFormData={data.createForm}
        updateFormData={data.updateForm}
        tenantSettings={data.tenantSettings}
        {allNodes}
        onCreated={handleCreated}
        onDeleted={handleDeleted}
        onCancel={handleCancel}
      />
    {/if}
  </div>
</div>

<style>
  .org-layout {
    display: flex;
    height: 100%;
  }

  .details-panel {
    flex: 1;
    overflow-y: auto;
    padding: 24px 32px;
  }
</style>
