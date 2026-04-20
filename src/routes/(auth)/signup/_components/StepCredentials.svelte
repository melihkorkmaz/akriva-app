<script lang="ts">
  import Eye from "@lucide/svelte/icons/eye";
  import EyeOff from "@lucide/svelte/icons/eye-off";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { cn } from "$lib/utils.js";
  import { useWizard } from "$lib/signup/wizard.svelte.js";
  import PasswordStrength from "$components/PasswordStrength.svelte";

  const wizard = useWizard();
  let showPassword = $state(false);

  function err(field: "password" | "acceptTerms"): string | undefined {
    return wizard.stepErrors[field];
  }
</script>

<div class="flex flex-col gap-5">
  <div class="flex flex-col gap-1.5">
    <span
      class="font-mono text-[11px] uppercase tracking-[0.05em] text-blue-600"
    >
      Step 03 · Credentials
    </span>
    <h2 class="text-[22px] font-semibold tracking-tight text-foreground">
      Secure your account
    </h2>
    <p class="text-sm leading-relaxed text-muted-foreground">
      You'll be prompted to enrol multi-factor authentication on your first
      sign-in. Choose a strong password — your password is hashed and never
      visible to Akriva.
    </p>
  </div>

  <div class="flex flex-col gap-1.5">
    <Label for="password">Password</Label>
    <div class="relative">
      <Input
        id="password"
        type={showPassword ? "text" : "password"}
        bind:value={wizard.data.password}
        onblur={() => wizard.touch("password")}
        aria-invalid={!!err("password") || undefined}
        aria-describedby={err("password") ? "password-error" : undefined}
        placeholder="At least 8 characters"
        autocomplete="new-password"
        class={cn("pr-10", err("password") && "border-destructive")}
      />
      <button
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        onclick={() => (showPassword = !showPassword)}
        tabindex={-1}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {#if showPassword}
          <EyeOff class="size-4" />
        {:else}
          <Eye class="size-4" />
        {/if}
      </button>
    </div>
    <PasswordStrength value={wizard.data.password} class="mt-1" />
    {#if err("password")}
      <p id="password-error" class="text-xs text-destructive">
        {err("password")}
      </p>
    {/if}
  </div>

  <div class="flex flex-col gap-1.5">
    <div class="flex items-start gap-2.5">
      <Checkbox
        id="acceptTerms"
        checked={wizard.data.acceptTerms}
        onCheckedChange={(c) => {
          wizard.update({ acceptTerms: c === true });
          wizard.touch("acceptTerms");
        }}
        aria-invalid={!!err("acceptTerms") || undefined}
        aria-describedby={err("acceptTerms") ? "acceptTerms-error" : undefined}
      />
      <Label
        for="acceptTerms"
        class="text-xs leading-relaxed font-normal text-muted-foreground inline"
      >
        I acknowledge that I have authority to register this organization, and I
        accept the
        <a
          href="/legal"
          class="font-semibold text-foreground underline-offset-2 hover:underline"
        >
          Master Services Agreement
        </a>,
        <a
          href="/legal"
          class="font-semibold text-foreground underline-offset-2 hover:underline"
        >
          DPA
        </a>
        and
        <a
          href="/legal"
          class="font-semibold text-foreground underline-offset-2 hover:underline"
        >
          Privacy Policy
        </a>.
      </Label>
    </div>
    {#if err("acceptTerms")}
      <p id="acceptTerms-error" class="text-xs text-destructive">
        {err("acceptTerms")}
      </p>
    {/if}
  </div>
</div>
