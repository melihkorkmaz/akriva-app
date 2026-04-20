<script lang="ts">
  import { useWizard } from "$lib/signup/wizard.svelte.js";
  import { mintTenantId, getScopeMix } from "$lib/signup/cockpit-data.js";

  const wizard = useWizard();

  const orgInitials = $derived.by(() => {
    const name = wizard.data.companyName.trim();
    if (!name) return "—";
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  });

  const tenantId = $derived(mintTenantId(wizard.data.companyName));
  const slug = $derived(wizard.slug);
  const sectorLabel = $derived(wizard.data.sector || "—");
  const subSectorLabel = $derived(wizard.data.subSector || "—");
  const cityLabel = $derived(wizard.data.city || "—");
  const countryLabel = $derived(wizard.data.country || "—");

  const scopeMix = $derived(getScopeMix(wizard.data.sector));
  const composition = $derived([
    {
      label: "Scope 1",
      pct: scopeMix[0],
      sub: "direct",
      bar: "bg-blue-500",
      chip: "bg-blue-500",
    },
    {
      label: "Scope 2",
      pct: scopeMix[1],
      sub: "electricity",
      bar: "bg-emerald-400",
      chip: "bg-emerald-400",
    },
    {
      label: "Scope 3",
      pct: scopeMix[2],
      sub: "value chain",
      bar: "bg-orange-400",
      chip: "bg-orange-400",
    },
  ]);
</script>

<div class="flex flex-col gap-4">
  <!-- Tenant card -->
  <div class="rounded-xl border border-slate-800/80 bg-slate-900/30 p-5">
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <div class="flex size-12 shrink-0 items-center justify-center rounded-md bg-blue-600 text-sm font-semibold text-white">
          {orgInitials}
        </div>
        <div class="flex flex-col min-w-0">
          <span class="text-base font-semibold text-white truncate">
            {wizard.data.companyName || "Your tenant"}
          </span>
          <span class="font-mono text-[11px] text-slate-400 truncate">{tenantId}</span>
        </div>
      </div>
      <span class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-700/50 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-emerald-400">
        <span class="size-1.5 rounded-full bg-emerald-400"></span> Provisioning
      </span>
    </div>

    <p class="mt-3 break-all font-mono text-xs text-slate-300">
      <span class="text-slate-500">https://</span>{slug}<span class="text-slate-500">.akriva.app</span>
    </p>

    <hr class="my-4 border-slate-800/80" />

    <dl class="flex flex-col gap-2.5 text-[13px]">
      <div class="flex items-center justify-between gap-3">
        <dt class="text-slate-400">Country</dt>
        <dd class="text-white">{countryLabel}</dd>
      </div>
      <div class="flex items-center justify-between gap-3">
        <dt class="text-slate-400">City</dt>
        <dd class="text-white">{cityLabel}</dd>
      </div>
      <div class="flex items-center justify-between gap-3">
        <dt class="text-slate-400">Sector</dt>
        <dd class="text-white truncate">{sectorLabel}</dd>
      </div>
      <div class="flex items-center justify-between gap-3">
        <dt class="text-slate-400">Sub-sector</dt>
        <dd class="text-white truncate">{subSectorLabel}</dd>
      </div>
    </dl>
  </div>

  <!-- Scope composition card -->
  <div class="rounded-xl border border-slate-800/80 bg-slate-900/20 p-5">
    <div class="flex items-baseline justify-between gap-3">
      <span class="font-mono text-[11px] uppercase tracking-[0.05em] text-slate-500">
        Predicted scope composition
      </span>
      <span class="text-[11px] text-slate-500">
        {wizard.data.sector ? `based on ${wizard.data.sector}` : "default mix"}
      </span>
    </div>
    <p class="mt-2 text-xs leading-relaxed text-slate-400">
      We tune your setup based on where emissions typically concentrate in your
      sector.
    </p>

    <div class="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-slate-800">
      {#each composition as { pct, bar } (bar)}
        <div class={bar} style="width: {pct}%"></div>
      {/each}
    </div>

    <dl class="mt-4 grid grid-cols-3 gap-3 text-[11px]">
      {#each composition as { label, pct, sub, chip } (label)}
        <div class="flex flex-col gap-0.5">
          <dt class="flex items-center gap-1.5 text-slate-300">
            <span class={`size-2 rounded-sm ${chip}`}></span>
            {label}
          </dt>
          <dd class="text-base font-semibold text-white tabular-nums">{pct}%</dd>
          <span class="text-slate-500">{sub}</span>
        </div>
      {/each}
    </dl>
  </div>
</div>
