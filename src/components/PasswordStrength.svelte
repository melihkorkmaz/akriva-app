<script lang="ts">
  import { cn } from "$lib/utils.js";
  import { passwordStrength } from "$lib/signup/validators.js";

  interface Props {
    value: string;
    class?: string;
  }

  let { value, class: className = "" }: Props = $props();

  const SEGMENTS = 4;

  const score = $derived(passwordStrength(value));

  const label = $derived.by(() => {
    if (!value) return "";
    if (score <= 1) return "weak";
    if (score === 2) return "fair";
    if (score === 3) return "strong";
    return "excellent";
  });

  const tone = $derived.by(() => {
    if (score <= 1) return "text-destructive";
    if (score === 2) return "text-amber-600";
    if (score === 3) return "text-blue-600";
    return "text-emerald-600";
  });

  function segmentColor(i: number): string {
    if (i >= score) return "bg-muted";
    if (score === 1) return "bg-destructive";
    if (score === 2) return "bg-amber-500";
    if (score === 3) return "bg-blue-500";
    return "bg-emerald-500";
  }
</script>

<div class={cn("flex flex-col gap-1.5", className)} aria-live="polite">
  <div class="flex gap-1.5">
    {#each Array(SEGMENTS) as _, i (i)}
      <div
        class={cn(
          "h-1.5 flex-1 rounded-full transition-colors",
          segmentColor(i)
        )}
      ></div>
    {/each}
  </div>
  {#if value}
    <span class={cn("text-xs font-medium uppercase tracking-wide", tone)}>
      {label}
    </span>
  {/if}
</div>
