<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button";
  import { toast } from "svelte-sonner";
  import { invalidateAll } from "$app/navigation";
  import TriangleAlert from "@lucide/svelte/icons/triangle-alert";

  let {
    open = $bindable(false),
    nodeId,
    nodeName,
    onDeleted,
  }: {
    open: boolean;
    nodeId: string;
    nodeName: string;
    onDeleted: () => void;
  } = $props();

  let deleting = $state(false);

  async function handleDelete() {
    deleting = true;

    const response = await fetch(
      `/settings/organizational-tree/org-units/${nodeId}`,
      { method: "DELETE" }
    );

    const data = await response.json();
    deleting = false;

    if (data?.success) {
      open = false;
      await invalidateAll();
      onDeleted();
    } else {
      toast.error(data?.error || "Failed to delete org unit.");
      open = false;
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <TriangleAlert class="size-5 text-destructive" />
        Delete Organizational Unit
      </Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete <strong>{nodeName}</strong>? This action
        cannot be undone. The node will be removed from the organizational tree.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (open = false)} disabled={deleting}>
        Cancel
      </Button>
      <Button variant="destructive" onclick={handleDelete} disabled={deleting}>
        {deleting ? "Deleting..." : "Delete"}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
