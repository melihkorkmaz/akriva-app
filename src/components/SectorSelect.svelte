<script lang="ts">
  import * as Select from "$lib/components/ui/select/index.js";
  import { SECTORS } from "$lib/data/sectors.js";

  interface Props {
    value?: string | null;
    placeholder?: string;
    disabled?: boolean;
    onValueChange?: (value: string | null) => void;
    [key: string]: unknown;
  }

  let {
    value = $bindable(null),
    placeholder = "Select sector",
    disabled = false,
    onValueChange,
    ...restProps
  }: Props = $props();

  let selectedLabel = $derived(value ?? "");

  function handleValueChange(val: string | undefined) {
    value = val || null;
    onValueChange?.(value);
  }
</script>

<Select.Root
  type="single"
  value={value ?? undefined}
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
    {#each SECTORS as sector}
      <Select.Item value={sector}>{sector}</Select.Item>
    {/each}
  </Select.Content>
</Select.Root>
