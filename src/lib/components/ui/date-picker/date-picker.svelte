<script lang="ts">
  import { Calendar } from "$lib/components/ui/calendar/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import CalendarIcon from "@lucide/svelte/icons/calendar";
  import {
    CalendarDate,
    DateFormatter,
    getLocalTimeZone,
    parseDate,
    type DateValue,
  } from "@internationalized/date";
  import { cn } from "$lib/utils.js";

  interface Props {
    value?: string;
    label?: string;
    placeholder?: string;
    minDate?: string;
    maxDate?: string;
    disabled?: boolean;
  }

  let {
    value = $bindable(""),
    label = "",
    placeholder = "Select date",
    minDate = undefined,
    maxDate = undefined,
    disabled = false,
  }: Props = $props();

  const df = new DateFormatter("en-US", { dateStyle: "medium" });

  let open = $state(false);

  let calendarValue = $derived.by(() => {
    if (!value) return undefined;
    try {
      return parseDate(value);
    } catch {
      return undefined;
    }
  });

  let minValue = $derived.by(() => {
    if (!minDate) return undefined;
    try {
      return parseDate(minDate);
    } catch {
      return undefined;
    }
  });

  let maxValue = $derived.by(() => {
    if (!maxDate) return undefined;
    try {
      return parseDate(maxDate);
    } catch {
      return undefined;
    }
  });

  function handleValueChange(date: DateValue | undefined) {
    if (date) {
      value = date.toString();
    } else {
      value = "";
    }
    open = false;
  }

  let displayValue = $derived(
    calendarValue
      ? df.format(calendarValue.toDate(getLocalTimeZone()))
      : ""
  );
</script>

{#snippet trigger()}
  <Popover.Root bind:open>
    <Popover.Trigger {disabled}>
      {#snippet child({ props })}
        <button
          {...props}
          type="button"
          {disabled}
          class={cn(
            "border-input placeholder:text-muted-foreground flex h-9 w-full items-center gap-2 rounded-md border px-3 py-1 text-base outline-none transition-[color] md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !calendarValue && "text-muted-foreground"
          )}
        >
          <CalendarIcon class="size-4 shrink-0" />
          <span class="flex-1 text-start">{displayValue || placeholder}</span>
        </button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content class="w-auto p-0" align="start">
      <Calendar
        type="single"
        value={calendarValue}
        onValueChange={handleValueChange}
        minValue={minValue}
        maxValue={maxValue}
        captionLayout="dropdown"
      />
    </Popover.Content>
  </Popover.Root>
{/snippet}

{#if label}
  <div class="flex flex-col gap-2" class:opacity-50={disabled}>
    <span class="text-sm font-medium text-foreground">{label}</span>
    {@render trigger()}
  </div>
{:else}
  {@render trigger()}
{/if}
