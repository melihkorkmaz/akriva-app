<script lang="ts">
  import Check from "@lucide/svelte/icons/check";
  import { useWizard } from "$lib/signup/wizard.svelte.js";
  import { mintTenantId } from "$lib/signup/cockpit-data.js";

  const wizard = useWizard();
  const tenantId = $derived(mintTenantId(wizard.data.companyName));

  const checks = [
    "Tenant provisioned",
    "MFA enrollment available",
    "TLS 1.3 in transit & at rest",
    "SOC 2 Type II controls",
    "Audit ledger initialised",
  ];
</script>

<div class="flex flex-col gap-4">
  <div class="flex flex-col items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/30 px-5 py-7 text-center">
    <div class="flex size-12 items-center justify-center rounded-full bg-emerald-500 text-white">
      <Check class="size-6" strokeWidth={3} />
    </div>
    <p class="text-base font-semibold text-white">Tenant is live</p>
    <p class="font-mono text-[11px] text-slate-400 break-all">{tenantId}</p>
    <p class="font-mono text-xs text-slate-300 break-all">
      <span class="text-slate-500">https://</span>{wizard.slug}<span class="text-slate-500">.akriva.app</span>
    </p>
  </div>

  <div class="rounded-xl border border-slate-800/80 bg-slate-900/20 p-5">
    <p class="font-mono text-[11px] uppercase tracking-[0.05em] text-slate-500">
      Provisioned
    </p>
    <ul class="mt-4 flex flex-col gap-3 text-sm">
      {#each checks as label (label)}
        <li class="flex items-center gap-2.5">
          <span class="flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check class="size-2.5" strokeWidth={3} />
          </span>
          <span class="text-slate-200">{label}</span>
        </li>
      {/each}
    </ul>
  </div>
</div>
