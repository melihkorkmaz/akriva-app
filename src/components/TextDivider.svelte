<script lang="ts">
  interface Props {
    text?: string;
  }

  let { text = 'OR' }: Props = $props();
</script>

<div class="text-divider">
  <div class="text-divider__line"></div>
  <span class="wa-caption-xs wa-color-text-quiet">{text}</span>
  <div class="text-divider__line"></div>
</div>

<style>
  .text-divider {
    display: flex;
    align-items: center;
    gap: var(--akriva-space-4);
  }

  .text-divider__line {
    flex: 1;
    height: var(--akriva-border-thin);
    background: var(--akriva-border-default);
  }
</style>
