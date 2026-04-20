<script lang="ts">
  import { cn } from "$lib/utils.js";

  interface Props {
    value?: string;
    onComplete?: (code: string) => void;
    disabled?: boolean;
    class?: string;
  }

  let {
    value = $bindable(""),
    onComplete,
    disabled = false,
    class: className = "",
  }: Props = $props();

  const LENGTH = 6;
  let inputs: (HTMLInputElement | null)[] = $state(Array(LENGTH).fill(null));

  function digits(): string[] {
    const out = Array<string>(LENGTH).fill("");
    for (let i = 0; i < LENGTH && i < value.length; i++) {
      const ch = value[i];
      if (/\d/.test(ch)) out[i] = ch;
    }
    return out;
  }

  const cells = $derived(digits());

  function setAt(index: number, ch: string) {
    const arr = digits();
    arr[index] = ch;
    value = arr.join("").slice(0, LENGTH);
  }

  function focus(i: number) {
    const el = inputs[i];
    if (el) {
      el.focus();
      el.select();
    }
  }

  function maybeComplete() {
    if (value.length === LENGTH && /^\d{6}$/.test(value)) {
      onComplete?.(value);
    }
  }

  function handleInput(i: number, e: Event) {
    const target = e.target as HTMLInputElement;
    const raw = target.value;
    // If user pasted multiple digits into one box, fall through to paste handling.
    if (raw.length > 1) {
      const cleaned = raw.replace(/\D/g, "").slice(0, LENGTH);
      value = cleaned.padEnd(LENGTH, "").slice(0, LENGTH).replace(/\s/g, "");
      // Reset the input element value to just its slot
      target.value = cleaned[i] ?? "";
      const next = Math.min(LENGTH - 1, cleaned.length);
      focus(next);
      maybeComplete();
      return;
    }
    if (!/\d/.test(raw)) {
      target.value = cells[i] ?? "";
      return;
    }
    setAt(i, raw);
    if (i < LENGTH - 1) focus(i + 1);
    maybeComplete();
  }

  function handleKeydown(i: number, e: KeyboardEvent) {
    if (e.key === "Backspace") {
      if (cells[i]) {
        setAt(i, "");
      } else if (i > 0) {
        setAt(i - 1, "");
        focus(i - 1);
      }
      e.preventDefault();
      return;
    }
    if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      focus(i - 1);
      return;
    }
    if (e.key === "ArrowRight" && i < LENGTH - 1) {
      e.preventDefault();
      focus(i + 1);
      return;
    }
  }

  function handlePaste(i: number, e: ClipboardEvent) {
    const raw = e.clipboardData?.getData("text") ?? "";
    const cleaned = raw.replace(/\D/g, "").slice(0, LENGTH);
    if (!cleaned) return;
    e.preventDefault();
    value = cleaned;
    const lastFilled = Math.min(LENGTH - 1, cleaned.length);
    focus(lastFilled);
    if (cleaned.length === LENGTH) {
      setTimeout(maybeComplete, 250);
    }
  }
</script>

<div
  class={cn("flex items-center justify-center gap-2", className)}
  role="group"
  aria-label="6-digit verification code"
>
  {#each Array(LENGTH) as _, i (i)}
    <input
      bind:this={inputs[i]}
      type="text"
      inputmode="numeric"
      autocomplete="one-time-code"
      maxlength={1}
      aria-label={`Digit ${i + 1}`}
      value={cells[i]}
      {disabled}
      oninput={(e) => handleInput(i, e)}
      onkeydown={(e) => handleKeydown(i, e)}
      onpaste={(e) => handlePaste(i, e)}
      class="w-11 h-13 md:w-12 md:h-14 rounded-md border border-input bg-background text-center text-xl font-semibold font-mono tabular-nums focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:opacity-50"
    />
    {#if i === 2}
      <span aria-hidden="true" class="text-muted-foreground text-2xl">—</span>
    {/if}
  {/each}
</div>
