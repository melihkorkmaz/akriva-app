<script lang="ts">
  import Shield from "@lucide/svelte/icons/shield";
  import { useWizard } from "$lib/signup/wizard.svelte.js";

  const wizard = useWizard();

  const initials = $derived.by(() => {
    const f = wizard.data.firstName.trim();
    const l = wizard.data.lastName.trim();
    return ((f[0] ?? "") + (l[0] ?? "")).toUpperCase() || "—";
  });

  const fullName = $derived(
    [wizard.data.firstName, wizard.data.lastName].filter(Boolean).join(" ") ||
      "Primary signatory"
  );

  const email = $derived(wizard.data.email || "you@company.com");
</script>

<div class="flex flex-col gap-4">
  <!-- Identity card -->
  <div class="rounded-xl border border-slate-800/80 bg-slate-900/30 p-5">
    <div class="flex items-center gap-4">
      <div
        class="flex size-14 shrink-0 items-center justify-center rounded-full text-base font-semibold tracking-wide text-white"
        style="background-image: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);"
      >
        {initials}
      </div>
      <div class="min-w-0 flex flex-col">
        <span class="text-base font-semibold text-white truncate">{fullName}</span>
        <span class="font-mono text-xs text-slate-400 truncate">{email}</span>
      </div>
    </div>

    <hr class="my-5 border-slate-800/80" />

    <dl class="flex flex-col gap-4 text-[13px]">
      <div class="flex items-center justify-between gap-3">
        <dt class="text-slate-400">Role on this tenant</dt>
        <dd class="flex items-center gap-2">
          <span class="text-white">Tenant Admin</span>
          <span class="rounded-md bg-blue-500/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-blue-300">
            Auto-assigned
          </span>
        </dd>
      </div>
      <div class="flex items-center justify-between gap-3">
        <dt class="text-slate-400">Authentication</dt>
        <dd class="flex items-center gap-2">
          <span class="text-white">Email + password</span>
          <span class="rounded-md bg-blue-500/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-blue-300">
            Email
          </span>
        </dd>
      </div>
      <div class="flex items-center justify-between gap-3">
        <dt class="text-slate-400">MFA</dt>
        <dd class="flex items-center gap-2">
          <span class="text-white">Required after first sign-in</span>
          <span class="rounded-md bg-blue-500/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-blue-300">
            Enforced
          </span>
        </dd>
      </div>
    </dl>
  </div>

  <!-- Audit notice card -->
  <div class="rounded-xl border border-slate-800/80 bg-slate-900/20 p-5">
    <div class="flex items-start gap-3">
      <Shield class="mt-0.5 size-4 shrink-0 text-slate-300" />
      <div class="flex flex-col gap-1.5">
        <p class="text-sm font-semibold text-white">
          Your activity is audited from field #1
        </p>
        <p class="text-xs leading-relaxed text-slate-400">
          Every keystroke on this form is being logged under session
          <span class="font-mono text-slate-300">TNT-PENDING</span> and will be
          attached to your tenant's immutable audit record on submission.
        </p>
      </div>
    </div>
  </div>
</div>
