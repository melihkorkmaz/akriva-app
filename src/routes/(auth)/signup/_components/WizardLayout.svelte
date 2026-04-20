<script lang="ts">
  import type { Snippet } from "svelte";
  import AkrivaLogo from "$components/AkrivaLogo.svelte";
  import ShieldCheck from "@lucide/svelte/icons/shield-check";
  import Globe from "@lucide/svelte/icons/globe";
  import Lock from "@lucide/svelte/icons/lock";

  interface Props {
    main: Snippet;
    aside: Snippet;
  }

  let { main, aside }: Props = $props();
</script>

<div class="grid min-h-screen grid-cols-1 md:grid-cols-[1fr_380px] lg:grid-cols-[1fr_460px] xl:grid-cols-[1fr_520px]">
  <main class="relative bg-[var(--surface-2,theme(colors.slate.50))] signup-grid-bg">
    <div class="mx-auto flex min-h-screen w-full max-w-[520px] flex-col justify-center gap-6 px-4 py-10">
      <header class="flex items-center justify-between">
        <a href="/" class="flex items-center gap-2" aria-label="Akriva home">
          <span class="scale-50 origin-left">
            <AkrivaLogo />
          </span>
        </a>
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <span class="hidden sm:inline">Have an account?</span>
          <a href="/signin" class="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            Sign in
          </a>
        </div>
      </header>

      <div class="w-full">
        {@render main()}
      </div>

      <footer class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span class="inline-flex items-center gap-1.5">
          <ShieldCheck class="size-3.5" /> SOC 2 Type II
        </span>
        <span class="inline-flex items-center gap-1.5">
          <Lock class="size-3.5" /> TLS 1.3 · AES-256
        </span>
        <span class="inline-flex items-center gap-1.5">
          <Globe class="size-3.5" /> EU & US data residency
        </span>
      </footer>
    </div>
  </main>

  <aside class="hidden md:flex flex-col bg-slate-900 text-white signup-grid-bg-dark">
    {@render aside()}
  </aside>
</div>

<style>
  .signup-grid-bg {
    background-image:
      linear-gradient(to right, rgba(15, 23, 42, 0.04) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(15, 23, 42, 0.04) 1px, transparent 1px);
    background-size: 24px 24px;
  }
  .signup-grid-bg-dark {
    background-image:
      linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
    background-size: 24px 24px;
  }
</style>
