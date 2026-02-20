<script lang="ts">
  import * as Select from "$lib/components/ui/select";
  import { getSubSectors } from "$lib/data/sectors";

  interface Props {
    value?: string | null;
    sector?: string | null;
    placeholder?: string;
    disabled?: boolean;
    [key: string]: unknown;
  }

  let {
    value = $bindable(null),
    sector = null,
    placeholder = "Select sub-sector",
    disabled = false,
    ...restProps
  }: Props = $props();

  let options = $derived(getSubSectors(sector));
  let selectedLabel = $derived(value ?? "");

  function handleValueChange(val: string | undefined) {
    value = val || null;
  }
</script>

<Select.Root
  type="single"
  value={value ?? undefined}
  onValueChange={handleValueChange}
  disabled={disabled || options.length === 0}
>
  <Select.Trigger class="w-full" {...restProps}>
    {#if selectedLabel}
      {selectedLabel}
    {:else}
      <span class="text-muted-foreground">
        {options.length > 0 ? placeholder : "Select a sector first"}
      </span>
    {/if}
  </Select.Trigger>
  <Select.Content>
    {#each options as subSector}
      <Select.Item value={subSector}>{subSector}</Select.Item>
    {/each}
  </Select.Content>
</Select.Root>
