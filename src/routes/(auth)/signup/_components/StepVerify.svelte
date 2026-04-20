<script lang="ts">
  import { onDestroy } from "svelte";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import { Button } from "$lib/components/ui/button";
  import { useWizard } from "$lib/signup/wizard.svelte.js";
  import VerifyCodeInput from "$components/VerifyCodeInput.svelte";

  interface Props {
    onSubmit: () => void;
  }

  let { onSubmit }: Props = $props();

  const wizard = useWizard();

  const COOLDOWN_SECONDS = 30;
  let secondsLeft = $state(COOLDOWN_SECONDS);
  let timer: ReturnType<typeof setInterval> | null = null;

  function startCooldown() {
    secondsLeft = COOLDOWN_SECONDS;
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    }, 1000);
  }

  $effect(() => {
    // Restart cooldown whenever a new resend is issued.
    void wizard.data.verifyResends;
    startCooldown();
  });

  onDestroy(() => {
    if (timer) clearInterval(timer);
  });

  function handleResend() {
    if (secondsLeft > 0) return;
    wizard.resendVerifyCode();
  }

  function handleChangeEmail() {
    wizard.changeEmail();
  }
</script>

<div class="flex flex-col gap-5">
  <div class="flex flex-col gap-1.5">
    <span class="font-mono text-[11px] uppercase tracking-[0.05em] text-blue-600">
      Step 04 · Verify
    </span>
    <h2 class="text-[22px] font-semibold tracking-tight text-foreground">
      Confirm your email
    </h2>
    <p class="text-sm leading-relaxed text-muted-foreground">
      We sent a 6-digit code to <span class="font-mono text-foreground">{wizard.data.email}</span>.
      Enter it below to activate your tenant.
    </p>
  </div>

  <VerifyCodeInput
    bind:value={wizard.data.verifyCode}
    onComplete={() => onSubmit()}
    class="my-2"
  />

  <div class="flex flex-wrap items-center justify-between gap-3 text-xs">
    <button
      type="button"
      onclick={handleResend}
      disabled={secondsLeft > 0}
      class="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-blue-600 disabled:cursor-not-allowed disabled:text-muted-foreground"
    >
      <RefreshCw class="size-3.5" />
      {#if secondsLeft > 0}
        Resend in <span class="font-mono tabular-nums">{secondsLeft}s</span>
      {:else}
        Resend code
      {/if}
    </button>
    <button
      type="button"
      onclick={handleChangeEmail}
      class="font-medium text-muted-foreground hover:text-foreground"
    >
      Change email
    </button>
  </div>
</div>
