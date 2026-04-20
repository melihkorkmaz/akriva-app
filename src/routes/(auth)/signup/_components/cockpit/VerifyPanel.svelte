<script lang="ts">
  import Mail from "@lucide/svelte/icons/mail";
  import Lock from "@lucide/svelte/icons/lock";
  import Info from "@lucide/svelte/icons/info";
  import { useWizard } from "$lib/signup/wizard.svelte.js";

  const wizard = useWizard();

  const filled = $derived(wizard.data.verifyCode.length);
  const dots = $derived(Array.from({ length: 6 }, (_, i) => i < filled));
</script>

<div class="flex flex-col gap-4">
  <!-- Envelope illustration card -->
  <div class="flex flex-col items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/30 px-5 py-7 text-center">
    <div class="relative">
      <Mail class="size-12 text-slate-300" strokeWidth={1.5} />
      <span class="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-blue-600 ring-2 ring-slate-900">
        <Lock class="size-3 text-white" strokeWidth={2.5} />
      </span>
    </div>

    <p class="text-base font-semibold text-white">A code was dispatched</p>
    <p class="font-mono text-xs text-slate-400 break-all">
      <span class="text-slate-500">to:</span> {wizard.data.email || "you@company.com"}
    </p>

    <div class="mt-1 flex items-center gap-2 text-[11px]">
      <div class="flex items-center gap-1.5">
        {#each dots as filled, i (i)}
          <span
            class={filled
              ? "size-1.5 rounded-full bg-slate-200"
              : "size-1.5 rounded-full bg-slate-700"}
          ></span>
        {/each}
      </div>
      <span class="font-mono tabular-nums text-slate-400">{filled}/6</span>
    </div>
  </div>

  <!-- Why we verify card -->
  <div class="rounded-xl border border-slate-800/80 bg-slate-900/20 p-5">
    <div class="flex items-start gap-3">
      <Info class="mt-0.5 size-4 shrink-0 text-blue-400" />
      <div class="flex flex-col gap-1.5">
        <p class="text-sm font-semibold text-white">Why we verify</p>
        <p class="text-xs leading-relaxed text-slate-400">
          Verified emails keep bad actors from minting tenants under your domain,
          and let us send you audit-log anomaly alerts.
        </p>
      </div>
    </div>
  </div>
</div>
