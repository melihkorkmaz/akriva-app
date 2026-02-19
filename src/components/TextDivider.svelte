<script lang="ts">
  interface Props {
    text?: string;
  }

  let { text = 'OR' }: Props = $props();
</script>

<div class="flex items-center gap-4">
  <div class="flex-1 h-px bg-border"></div>
  <span class="text-xs text-muted-foreground">{text}</span>
  <div class="flex-1 h-px bg-border"></div>
</div>
