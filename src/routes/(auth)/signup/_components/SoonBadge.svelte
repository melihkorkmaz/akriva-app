<script lang="ts">
  import { cn } from "$lib/utils.js";

  interface Props {
    class?: string;
  }

  let { class: className = "" }: Props = $props();
</script>

<span
  class={cn(
    "inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 shadow-sm",
    className
  )}
>
  Soon
</span>
