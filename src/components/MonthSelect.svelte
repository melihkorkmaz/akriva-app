<script lang="ts">
  import * as Select from "$lib/components/ui/select/index.js";

  interface Props {
    value?: number | null;
    placeholder?: string;
    disabled?: boolean;
    [key: string]: unknown;
  }

  let {
    value = $bindable(null),
    placeholder = "Select month",
    disabled = false,
    ...restProps
  }: Props = $props();

  const MONTHS = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ] as const;

  let selectedLabel = $derived(
    MONTHS.find((m) => m.value === value)?.label ?? "",
  );

  function handleValueChange(val: string | undefined) {
    value = val ? Number(val) : null;
  }
</script>

<Select.Root
  type="single"
  value={value != null ? String(value) : undefined}
  onValueChange={handleValueChange}
  {disabled}
>
  <Select.Trigger class="w-full" {...restProps}>
    {#if selectedLabel}
      {selectedLabel}
    {:else}
      <span class="text-muted-foreground">{placeholder}</span>
    {/if}
  </Select.Trigger>
  <Select.Content>
    {#each MONTHS as month}
      <Select.Item value={String(month.value)}>{month.label}</Select.Item>
    {/each}
  </Select.Content>
</Select.Root>
