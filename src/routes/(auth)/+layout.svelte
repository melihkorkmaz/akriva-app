<script lang="ts">
  import AkrivaLogo from "$components/AkrivaLogo.svelte";
  let { children } = $props();
</script>

<div class="flex flex-col gap-4 items-center justify-center h-screen">
  <AkrivaLogo />
  {@render children()}
</div>
