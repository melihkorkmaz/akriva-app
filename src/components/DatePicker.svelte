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

<div class="datepicker" class:disabled>
  {#if label}
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label class="datepicker__label">{label}</label>
  {/if}
  <div class="datepicker__wrapper">
    <input
      bind:this={inputEl}
      type="text"
      readonly
      {placeholder}
      {disabled}
      class="datepicker__input"
    />
    <svg
      class="datepicker__icon"
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

<style>
  .datepicker {
    display: flex;
    flex-direction: column;
    gap: var(--akriva-space-1);
  }

  .datepicker__label {
    font-family: var(--akriva-font-primary);
    font-size: var(--akriva-size-body);
    font-weight: var(--akriva-weight-medium);
    color: var(--akriva-text-primary);
  }

  .datepicker__wrapper {
    position: relative;
  }

  .datepicker__input {
    width: 100%;
    height: var(--wa-form-control-height, 38px);
    padding: 0 var(--akriva-space-10) 0 var(--akriva-space-3);
    font-family: var(--akriva-font-primary);
    font-size: var(--akriva-size-body);
    font-weight: var(--akriva-weight-regular);
    color: var(--akriva-text-primary);
    background: var(--akriva-surface-primary);
    border: var(--akriva-border-thin) solid var(--akriva-border-default);
    border-radius: var(--akriva-radius-xs);
    outline: none;
    cursor: pointer;
    box-sizing: border-box;
  }

  .datepicker__input::placeholder {
    color: var(--akriva-text-tertiary);
  }

  .datepicker__input:focus {
    border-color: var(--akriva-border-focus);
    box-shadow: 0 0 0 1px var(--akriva-border-focus);
  }

  .datepicker__input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .datepicker__icon {
    position: absolute;
    right: var(--akriva-space-3);
    top: 50%;
    transform: translateY(-50%);
    color: var(--akriva-text-tertiary);
    pointer-events: none;
  }

  .disabled .datepicker__icon {
    opacity: 0.5;
  }
</style>
