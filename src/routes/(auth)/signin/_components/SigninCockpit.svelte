<script lang="ts">
  import { onDestroy } from "svelte";
  import ShieldCheck from "@lucide/svelte/icons/shield-check";
  import Lock from "@lucide/svelte/icons/lock";

  interface Props {
    email?: string;
  }

  let { email = "" }: Props = $props();

  let now = $state(new Date());
  const tick = setInterval(() => (now = new Date()), 1000);
  onDestroy(() => clearInterval(tick));

  const liveTime = $derived(
    `${now.getUTCHours().toString().padStart(2, "0")}:${now
      .getUTCMinutes()
      .toString()
      .padStart(2, "0")} UTC`
  );

  // Derive the tenant subdomain from the email domain so it tracks what the
  // user is typing. `melih@aquatolia.store` → `aquatolia.akriva.app`.
  const subdomain = $derived.by(() => {
    const at = email.lastIndexOf("@");
    if (at < 0) return "awaiting";
    const first = email.slice(at + 1).split(".")[0] ?? "";
    const slug = first
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32);
    return slug || "awaiting";
  });

  // Pre-signin we don't know the user's actual tenant — use representative
  // numbers that re-anchor the ledger metaphor.
  const tenant = {
    facilities: 248,
    openReviews: 12,
    dataCoverage: "97%",
  };

  const activity = [
    {
      ts: "09:12:04",
      kind: "SIGN",
      title: "disclosure Q1-2026 · scope 2 electricity",
      actor: "j.ortega",
    },
    {
      ts: "09:04:51",
      kind: "COMMIT",
      title: "14 facilities · kWh ledger reconciled",
      actor: "f.shah",
    },
    {
      ts: "08:58:17",
      kind: "REVIEW",
      title: "flagged variance on diesel · 3.2σ",
      actor: "a.tanaka",
    },
    {
      ts: "08:41:22",
      kind: "IMPORT",
      title: "utility invoices · 82 rows · OK",
      actor: "system",
    },
    {
      ts: "08:30:00",
      kind: "SEAL",
      title: "audit window opened · FY25 final",
      actor: "—",
    },
  ];
</script>

<div class="flex h-full flex-col px-7 py-6 lg:px-9">
  <!-- Header -->
  <div class="mb-5 flex items-center justify-between">
    <div class="flex items-center gap-2.5">
      <svg
        width="28"
        height="28"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M4 44L24 4L44 44L36 44L24 20L12 44Z" fill="#3b82f6" />
        <rect x="18" y="28" width="12" height="3" fill="#ffffff" />
      </svg>
      <span class="text-lg font-semibold tracking-wide text-white">AKRIVA</span>
    </div>
    <div class="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.05em] text-slate-400">
      <span class="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
      Ledger · LIVE · <span class="tabular-nums text-slate-300">{liveTime}</span>
    </div>
  </div>

  <p class="mb-4 font-mono text-[11px] uppercase tracking-[0.1em] text-slate-500">
    Your tenant
  </p>

  <!-- Tenant card -->
  <div class="rounded-xl border border-slate-800/80 bg-slate-900/30 p-5">
    <p class="font-mono text-xs text-slate-500">https://</p>
    <p class="mt-0.5 font-mono text-2xl font-semibold tracking-tight text-white break-all">
      {subdomain}<span class="text-slate-500">.akriva.app</span>
    </p>

    <dl class="mt-5 grid grid-cols-3 gap-4">
      <div>
        <dd class="text-2xl font-semibold text-white tabular-nums">{tenant.facilities}</dd>
        <dt class="mt-1 font-mono text-[10px] uppercase tracking-wide text-slate-500">
          Facilities
        </dt>
      </div>
      <div>
        <dd class="text-2xl font-semibold text-white tabular-nums">{tenant.openReviews}</dd>
        <dt class="mt-1 font-mono text-[10px] uppercase tracking-wide text-slate-500">
          Open reviews
        </dt>
      </div>
      <div>
        <dd class="text-2xl font-semibold text-white tabular-nums">{tenant.dataCoverage}</dd>
        <dt class="mt-1 font-mono text-[10px] uppercase tracking-wide text-slate-500">
          Data coverage
        </dt>
      </div>
    </dl>
  </div>

  <!-- Activity feed -->
  <div class="mt-6 mb-3 flex items-baseline justify-between">
    <p class="font-mono text-[11px] uppercase tracking-[0.1em] text-slate-500">
      Recent activity
    </p>
    <span class="font-mono text-[10px] uppercase tracking-wide text-slate-500">
      last 24h
    </span>
  </div>

  <div class="rounded-xl border border-slate-800/80 bg-slate-900/20 p-4">
    <ul class="flex flex-col gap-3.5 text-xs">
      {#each activity as { ts, kind, title, actor } (ts)}
        <li class="flex items-start gap-3">
          <span class="font-mono text-[10px] tabular-nums text-slate-500 shrink-0 pt-0.5">
            {ts}
          </span>
          <span class="font-mono text-[10px] uppercase tracking-wide text-blue-300 bg-blue-500/10 rounded px-1.5 py-0.5 shrink-0">
            {kind}
          </span>
          <div class="flex-1 min-w-0">
            <p class="text-slate-200 truncate">{title}</p>
            <p class="font-mono text-[10px] text-slate-500 truncate">{actor}</p>
          </div>
        </li>
      {/each}
    </ul>
  </div>

  <div class="flex-1"></div>

  <div class="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-800/60 pt-4 text-[11px] font-mono text-slate-500">
    <span class="inline-flex items-center gap-1.5">
      <ShieldCheck class="size-3.5 text-slate-500" /> SOC 2 Type II
    </span>
    <span class="text-slate-700">·</span>
    <span class="inline-flex items-center gap-1.5">
      <Lock class="size-3.5 text-slate-500" /> TLS 1.3 · AES-256
    </span>
  </div>
</div>
