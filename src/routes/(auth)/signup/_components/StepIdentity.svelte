<script lang="ts">
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Button } from "$lib/components/ui/button";
  import { cn } from "$lib/utils.js";
  import GoogleIcon from "@lucide/svelte/icons/chrome";
  import MicrosoftIcon from "@lucide/svelte/icons/grid-2x2";
  import { useWizard } from "$lib/signup/wizard.svelte.js";
  import TextDivider from "$components/TextDivider.svelte";
  import SoonBadge from "$components/SoonBadge.svelte";

  const wizard = useWizard();

  function err(field: "firstName" | "lastName" | "email"): string | undefined {
    return wizard.stepErrors[field];
  }
</script>

<div class="flex flex-col gap-5">
  <div class="flex flex-col gap-1.5">
    <span class="font-mono text-[11px] uppercase tracking-[0.05em] text-blue-600">
      Step 01 · Identity
    </span>
    <h2 class="text-[22px] font-semibold tracking-tight text-foreground">
      Let's get you set up
    </h2>
    <p class="text-sm leading-relaxed text-muted-foreground">
      You'll become the Tenant Admin and first name of record on your
      organization's ledger.
    </p>
  </div>

  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
    <Button
      type="button"
      variant="outline"
      disabled
      aria-disabled="true"
      title="Coming soon"
      class="relative justify-center cursor-not-allowed opacity-80"
    >
      <GoogleIcon class="size-4 opacity-60" />
      <span class="opacity-60">Google</span>
      <SoonBadge class="absolute -top-1.5 -right-1.5" />
    </Button>
    <Button
      type="button"
      variant="outline"
      disabled
      aria-disabled="true"
      title="Coming soon"
      class="relative justify-center cursor-not-allowed opacity-80"
    >
      <MicrosoftIcon class="size-4 opacity-60" />
      <span class="opacity-60">Microsoft</span>
      <SoonBadge class="absolute -top-1.5 -right-1.5" />
    </Button>
  </div>

  <TextDivider text="or continue with email" />

  <div class="grid grid-cols-2 gap-4">
    <div class="flex flex-col gap-1.5">
      <Label for="firstName">First name</Label>
      <Input
        id="firstName"
        bind:value={wizard.data.firstName}
        onblur={() => wizard.touch("firstName")}
        aria-invalid={!!err("firstName") || undefined}
        aria-describedby={err("firstName") ? "firstName-error" : undefined}
        placeholder="Jane"
        autocomplete="given-name"
        class={cn(err("firstName") && "border-destructive")}
      />
      {#if err("firstName")}
        <p id="firstName-error" class="text-xs text-destructive">
          {err("firstName")}
        </p>
      {/if}
    </div>
    <div class="flex flex-col gap-1.5">
      <Label for="lastName">Last name</Label>
      <Input
        id="lastName"
        bind:value={wizard.data.lastName}
        onblur={() => wizard.touch("lastName")}
        aria-invalid={!!err("lastName") || undefined}
        aria-describedby={err("lastName") ? "lastName-error" : undefined}
        placeholder="Osei"
        autocomplete="family-name"
        class={cn(err("lastName") && "border-destructive")}
      />
      {#if err("lastName")}
        <p id="lastName-error" class="text-xs text-destructive">
          {err("lastName")}
        </p>
      {/if}
    </div>
  </div>

  <div class="flex flex-col gap-1.5">
    <Label for="email">Work email</Label>
    <Input
      id="email"
      type="email"
      bind:value={wizard.data.email}
      onblur={() => wizard.touch("email")}
      aria-invalid={!!err("email") || undefined}
      aria-describedby={err("email") ? "email-error" : undefined}
      placeholder="jane@northwind.com"
      autocomplete="email"
      class={cn(err("email") && "border-destructive")}
    />
    {#if err("email")}
      <p id="email-error" class="text-xs text-destructive">{err("email")}</p>
    {/if}
  </div>
</div>
