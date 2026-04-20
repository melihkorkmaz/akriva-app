<script lang="ts">
  import Check from "@lucide/svelte/icons/check";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import { Button } from "$lib/components/ui/button";
  import { useWizard } from "$lib/signup/wizard.svelte.js";

  const wizard = useWizard();
</script>

<div class="flex flex-col gap-5">
  <div class="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
    <Check class="size-7" strokeWidth={3} />
  </div>

  <div class="flex flex-col gap-1.5">
    <h2 class="text-2xl font-semibold tracking-tight text-foreground">
      Welcome to Akriva, {wizard.data.firstName || "there"}.
    </h2>
    <p class="text-sm text-muted-foreground">
      Your tenant is provisioned and your audit ledger is initialised.
    </p>
  </div>

  <div class="rounded-lg border border-border bg-slate-50 p-4">
    <p class="text-sm font-semibold text-foreground">
      {wizard.data.companyName || "Your organization"}
    </p>
    <p class="font-mono text-xs text-muted-foreground break-all">
      {wizard.slug}.akriva.app
    </p>
  </div>

  <Button href="/dashboard" class="self-start">
    Open workspace
    <ArrowRight class="ml-1.5 size-4" />
  </Button>
</div>
