<script lang="ts">
  import TreePine from "@lucide/svelte/icons/tree-pine";
</script>

<div class="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
  <TreePine class="size-12 text-muted-foreground" />
  <div class="flex flex-col gap-1">
    <h2 class="text-lg font-semibold text-muted-foreground">No node selected</h2>
    <p class="text-sm text-muted-foreground max-w-sm">
      Select a node from the tree to view its details, or click Add to create a
      new organizational unit.
    </p>
  </div>
</div>
