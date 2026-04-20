<script lang="ts">
  import { onDestroy } from "svelte";
  import { fade } from "svelte/transition";
  import ShieldCheck from "@lucide/svelte/icons/shield-check";
  import { useWizard } from "$lib/signup/wizard.svelte.js";
  import IdentityPanel from "./cockpit/IdentityPanel.svelte";
  import OrganizationPanel from "./cockpit/OrganizationPanel.svelte";
  import CredentialsPanel from "./cockpit/CredentialsPanel.svelte";
  import VerifyPanel from "./cockpit/VerifyPanel.svelte";
  import FinishPanel from "./cockpit/FinishPanel.svelte";

  const wizard = useWizard();

  let now = $state(new Date());
  const tick = setInterval(() => (now = new Date()), 1000);
  onDestroy(() => clearInterval(tick));

  const liveTime = $derived(
    `${now.getUTCHours().toString().padStart(2, "0")}:${now
      .getUTCMinutes()
      .toString()
      .padStart(2, "0")} UTC`
  );

  const eyebrow = $derived.by(() => {
    if (wizard.finished) return "Tenant provisioned";
    return [
      "Primary signatory",
      "Tenant provisioning",
      "Security posture",
      "Email verification",
    ][wizard.step];
  });

  const panelKey = $derived(wizard.finished ? "finish" : `step-${wizard.step}`);
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
      LIVE · <span class="tabular-nums text-slate-300">{liveTime}</span>
    </div>
  </div>

  <!-- Panel-level eyebrow -->
  <p class="mb-4 font-mono text-[11px] uppercase tracking-[0.1em] text-slate-500">
    {eyebrow}
  </p>

  <!-- Panel content -->
  <div class="flex-1 min-h-0">
    {#key panelKey}
      <div in:fade={{ duration: 180, delay: 180 }} out:fade={{ duration: 180 }}>
        {#if wizard.finished}
          <FinishPanel />
        {:else if wizard.step === 0}
          <IdentityPanel />
        {:else if wizard.step === 1}
          <OrganizationPanel />
        {:else if wizard.step === 2}
          <CredentialsPanel />
        {:else}
          <VerifyPanel />
        {/if}
      </div>
    {/key}
  </div>

  <!-- Dark footer -->
  <div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/60 pt-4 text-[11px] font-mono text-slate-500">
    <span class="inline-flex items-center gap-1.5">
      <ShieldCheck class="size-3.5 text-slate-500" />
      SOC 2 · ISO 27001 · TLS 1.3
    </span>
    <span class="inline-flex items-center gap-1.5">
      <span class="size-1.5 rounded-full bg-emerald-400"></span>
      Production · EU & US
    </span>
  </div>
</div>
