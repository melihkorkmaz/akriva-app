<script lang="ts">
  import { onMount } from "svelte";
  import flatpickr from "flatpickr";
  import type { Instance } from "flatpickr/dist/types/instance";
  import "../styles/flatpickr-akriva.css";

  interface Props {
    mode?: "single" | "range";
    value?: string;
    label?: string;
    placeholder?: string;
    minDate?: string | Date;
    maxDate?: string | Date;
    disabled?: boolean;
    onchange?: (selectedDates: Date[], dateStr: string) => void;
  }

  let {
    mode = "single",
    value = $bindable(""),
    label = "",
    placeholder = "Select date",
    minDate = undefined,
    maxDate = undefined,
    disabled = false,
    onchange,
  }: Props = $props();

  let inputEl: HTMLInputElement;
  let fp: Instance | undefined;

  onMount(() => {
    fp = flatpickr(inputEl, {
      mode,
      defaultDate: value || undefined,
      dateFormat: "Y-m-d",
      minDate: minDate ?? undefined,
      maxDate: maxDate ?? undefined,
      disableMobile: true,
      onChange(selectedDates, dateStr) {
        value = dateStr;
        onchange?.(selectedDates, dateStr);
      },
    });

    return () => fp?.destroy();
  });

  $effect(() => {
    if (!fp) return;
    const opts: Record<string, unknown> = {};
    if (minDate !== undefined) opts.minDate = minDate;
    if (maxDate !== undefined) opts.maxDate = maxDate;
    for (const [key, val] of Object.entries(opts)) {
      fp.set(key as keyof flatpickr.Options.Options, val);
    }
  });

  $effect(() => {
    if (!fp) return;
    if (value !== fp.input.value) {
      fp.setDate(value, false);
    }
  });
</script>

<div class="flex flex-col gap-1" class:opacity-50={disabled}>
  {#if label}
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label class="text-sm font-medium text-foreground">{label}</label>
  {/if}
  <div class="relative">
    <input
      bind:this={inputEl}
      type="text"
      readonly
      {placeholder}
      {disabled}
      class="w-full h-10 px-3 pr-10 text-sm bg-card border border-input rounded-sm outline-none cursor-pointer placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring disabled:cursor-not-allowed"
    />
    <svg
      class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      width="18"
      height="18"
      aria-hidden="true"
    >
      <path
        fill-rule="evenodd"
        d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z"
        clip-rule="evenodd"
      />
    </svg>
  </div>
</div>
