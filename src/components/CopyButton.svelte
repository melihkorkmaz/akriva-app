<script lang="ts">
  import Copy from "@lucide/svelte/icons/copy";
  import Check from "@lucide/svelte/icons/check";

  interface Props {
    value: string;
  }

  let { value }: Props = $props();
  let copied = $state(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      // Clipboard API unavailable or permission denied
    }
  }
</script>

<button
  type="button"
  class="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
  onclick={handleCopy}
  title="Copy to clipboard"
>
  {#if copied}
    <Check class="size-3.5 text-emerald-500" />
  {:else}
    <Copy class="size-3.5" />
  {/if}
</button>
