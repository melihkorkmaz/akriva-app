<script lang="ts">
  import Check from "@lucide/svelte/icons/check";
  import ShieldCheck from "@lucide/svelte/icons/shield-check";
  import { useWizard } from "$lib/signup/wizard.svelte.js";
  import { passwordStrength } from "$lib/signup/validators.js";
  import { strengthLabel } from "$lib/signup/cockpit-data.js";
  import { cn } from "$lib/utils.js";

  const wizard = useWizard();

  const score = $derived(passwordStrength(wizard.data.password));
  const strength = $derived(strengthLabel(score));
  const hasInput = $derived(wizard.data.password.length > 0);

  const checks = $derived([
    { label: "TLS 1.3 in transit", done: true },
    { label: "bcrypt @ cost 12", done: true },
    { label: "MFA enforced on admin", done: true },
    { label: "Audit log sealed to tenant", done: true },
    { label: "Terms acknowledged", done: wizard.data.acceptTerms },
  ]);

  function barTone(tone: typeof strength.tone): string {
    switch (tone) {
      case "weak":
        return "bg-rose-500";
      case "fair":
        return "bg-amber-400";
      case "good":
        return "bg-emerald-400";
      case "strong":
        return "bg-emerald-400";
      default:
        return "bg-slate-700";
    }
  }
</script>

<div class="flex flex-col gap-4">
  <!-- Credential seal -->
  <div class="rounded-xl border border-slate-800/80 bg-slate-900/30 p-5">
    <div class="flex items-start gap-3">
      <ShieldCheck class="mt-0.5 size-5 shrink-0 text-slate-300" />
      <div class="flex flex-col">
        <p class="text-sm font-semibold text-white">Credential seal</p>
        <p class="text-xs leading-relaxed text-slate-400">
          Your chosen password will be hashed with bcrypt.
        </p>
      </div>
    </div>

    <p class="mt-4 font-mono text-[11px] uppercase tracking-[0.05em] text-slate-500">
      Password strength
    </p>
    <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
      <div
        class={cn("h-full rounded-full transition-all duration-200", barTone(strength.tone))}
        style="width: {strength.ratio * 100}%"
      ></div>
    </div>
    <p class={cn(
      "mt-2 text-xs",
      hasInput ? "text-slate-300" : "text-slate-500 italic"
    )}>
      {strength.label}
    </p>
  </div>

  <!-- Security posture checklist -->
  <div class="rounded-xl border border-slate-800/80 bg-slate-900/20 p-5">
    <p class="font-mono text-[11px] uppercase tracking-[0.05em] text-slate-500">
      Security posture
    </p>
    <ul class="mt-4 flex flex-col gap-3 text-sm">
      {#each checks as { label, done } (label)}
        <li class="flex items-center gap-2.5">
          <span
            class={done
              ? "flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white"
              : "flex size-4 items-center justify-center rounded-full border border-slate-700 bg-slate-800"}
          >
            {#if done}
              <Check class="size-2.5" strokeWidth={3} />
            {/if}
          </span>
          <span class={done ? "text-slate-200" : "text-slate-500"}>{label}</span>
        </li>
      {/each}
    </ul>
  </div>
</div>
