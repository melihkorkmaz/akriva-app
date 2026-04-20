<script lang="ts">
  import { fade } from "svelte/transition";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { cn } from "$lib/utils.js";
  import { useWizard } from "$lib/signup/wizard.svelte.js";
  import CountrySelect from "$components/CountrySelect.svelte";
  import SectorSelect from "$components/SectorSelect.svelte";
  import SubSectorSelect from "$components/SubSectorSelect.svelte";

  const wizard = useWizard();

  const showSubdomain = $derived(wizard.data.companyName.trim().length >= 2);

  function err(field: "companyName"): string | undefined {
    return wizard.stepErrors[field];
  }

  function onSectorChange() {
    if (wizard.data.subSector) wizard.update({ subSector: "" });
  }
</script>

<div class="flex flex-col gap-5">
  <div class="flex flex-col gap-1.5">
    <span class="font-mono text-[11px] uppercase tracking-[0.05em] text-blue-600">
      Step 02 · Organization
    </span>
    <h2 class="text-[22px] font-semibold tracking-tight text-foreground">
      Declare the reporting entity
    </h2>
    <p class="text-sm leading-relaxed text-muted-foreground">
      Your organization is the legal boundary for all Scope 1, 2 and 3 emissions
      recorded in this tenant.
    </p>
  </div>

  <div class="flex flex-col gap-1.5">
    <Label for="companyName">Company name</Label>
    <Input
      id="companyName"
      bind:value={wizard.data.companyName}
      onblur={() => wizard.touch("companyName")}
      aria-invalid={!!err("companyName") || undefined}
      aria-describedby={err("companyName") ? "companyName-error" : undefined}
      placeholder="Northwind Energy"
      autocomplete="organization"
      class={cn(err("companyName") && "border-destructive")}
    />
    {#if err("companyName")}
      <p id="companyName-error" class="text-xs text-destructive">
        {err("companyName")}
      </p>
    {/if}
  </div>

  {#if showSubdomain}
    <div
      transition:fade={{ duration: 160 }}
      class="rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3"
    >
      <p class="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
        Workspace
      </p>
      <div class="mt-1 flex flex-wrap items-center justify-between gap-2">
        <p class="font-mono text-sm font-semibold text-foreground break-all">
          {wizard.slug}<span class="text-muted-foreground">.akriva.app</span>
        </p>
        <span class="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
          available
        </span>
      </div>
    </div>
  {/if}

  <div class="grid grid-cols-2 gap-4">
    <div class="flex flex-col gap-1.5">
      <Label for="country">Country</Label>
      <CountrySelect bind:value={wizard.data.country} placeholder="United States" />
    </div>
    <div class="flex flex-col gap-1.5">
      <Label for="city">City</Label>
      <Input id="city" bind:value={wizard.data.city} placeholder="Optional" />
    </div>
  </div>

  <div class="grid grid-cols-2 gap-4">
    <div class="flex flex-col gap-1.5">
      <Label for="sector">Sector</Label>
      <SectorSelect bind:value={wizard.data.sector} onValueChange={onSectorChange} />
    </div>
    <div class="flex flex-col gap-1.5">
      <Label for="subSector">Sub-sector</Label>
      <SubSectorSelect
        bind:value={wizard.data.subSector}
        sector={wizard.data.sector}
      />
    </div>
  </div>
</div>
