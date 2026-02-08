<script lang="ts">
  import AkrivaLogo from "$components/AkrivaLogo.svelte";
  let { children } = $props();
</script>

<div
  class="wa-stack wa-gap-m wa-align-items-center wa-justify-content-center"
  style="height:100vh"
>
  <AkrivaLogo />
  {@render children()}
</div>
