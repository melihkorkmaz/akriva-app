<script lang="ts">
  import Check from "@lucide/svelte/icons/check";
  import { cn } from "$lib/utils.js";
  import { useWizard } from "$lib/signup/wizard.svelte.js";
  import type { StepIndex } from "$lib/signup/types.js";

  const wizard = useWizard();

  const STEPS: { index: StepIndex; label: string }[] = [
    { index: 0, label: "You" },
    { index: 1, label: "Company" },
    { index: 2, label: "Secure" },
    { index: 3, label: "Verify" },
  ];

  function isCompleted(i: StepIndex): boolean {
    if (wizard.finished) return true;
    return i < wizard.step;
  }
</script>

<div role="tablist" aria-label="Signup progress" class="flex items-center gap-2">
  {#each STEPS as { index, label }, i (index)}
    {@const completed = isCompleted(index)}
    {@const active = index === wizard.step && !wizard.finished}
    {@const upcoming = !completed && !active}
    {@const visited = wizard.visited.includes(index)}
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-label={`Step ${String(index + 1).padStart(2, "0")} ${label}`}
      disabled={!visited && !active}
      onclick={() => wizard.jumpTo(index)}
      class={cn(
        "group inline-flex shrink-0 items-center gap-2 transition-colors",
        visited && !active && "cursor-pointer",
        !visited && !active && "cursor-not-allowed"
      )}
    >
      <span
        class={cn(
          "flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-semibold transition-colors",
          completed && "bg-emerald-500 text-white",
          active && "bg-blue-600 text-white",
          upcoming && "bg-muted text-muted-foreground/60"
        )}
      >
        {#if completed}
          <Check class="size-4" strokeWidth={3} />
        {:else}
          {String(index + 1).padStart(2, "0")}
        {/if}
      </span>
      <span
        class={cn(
          "hidden text-sm font-medium sm:inline",
          active && "text-foreground",
          completed && "text-muted-foreground",
          upcoming && "text-muted-foreground/60"
        )}
      >
        {label}
      </span>
    </button>
    {#if i < STEPS.length - 1}
      <div
        class={cn(
          "h-px flex-1 transition-colors",
          completed ? "bg-emerald-500" : "bg-border"
        )}
      ></div>
    {/if}
  {/each}
</div>
