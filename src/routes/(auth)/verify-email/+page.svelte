<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Alert, AlertDescription } from "$lib/components/ui/alert/index.js";
  import CircleCheck from "@lucide/svelte/icons/circle-check";

  import TextDivider from "$components/TextDivider.svelte";
</script>

<svelte:head>
  <title>Verify Email | Akriva</title>
</svelte:head>

<Card.Root class="w-full max-w-[490px]">
  <Card.Content class="pt-6">
    <div class="flex flex-col gap-8">
      <!-- Title -->
      <div class="flex flex-col gap-3 items-center">
        <h2 class="text-2xl font-semibold">Verify Your Email</h2>
        <p class="text-base text-muted-foreground">
          Enter the 6-digit verification code sent to your email
        </p>
      </div>

      <!-- Code Input -->
      <div class="flex flex-col gap-6 items-center">
        <div class="flex flex-row flex-wrap gap-2">
          {#each Array(6) as _, i}
            <Input
              type="text"
              maxlength={1}
              inputmode="numeric"
              class="w-14 h-12 text-center text-lg bg-muted"
            />
          {/each}
        </div>
        <span class="text-sm text-muted-foreground">
          Didn't receive a code? Check your spam folder
        </span>
      </div>

      <!-- Verify Button -->
      <Button type="submit" class="w-full">Verify Email</Button>

      <!-- Resend -->
      <div class="flex flex-wrap gap-2 justify-center">
        <span class="text-sm text-muted-foreground">Didn't receive the code?</span>
        <a href="/verify-email" class="text-sm font-bold text-primary hover:underline">Resend code</a>
      </div>

      <TextDivider />

      <!-- Back to signup -->
      <div class="flex flex-wrap gap-2 justify-center">
        <span class="text-sm text-muted-foreground">Changed your mind?</span>
        <a href="/signup" class="text-sm font-bold text-primary hover:underline">Go back to signup</a>
      </div>

      <!-- Security Note -->
      <Alert class="border-emerald-200 bg-emerald-50 text-emerald-800">
        <CircleCheck class="size-4 text-emerald-600" />
        <AlertDescription>
          <strong>Identity Chain Verification:</strong>
          This code establishes your cryptographic identity for all future audit entries
        </AlertDescription>
      </Alert>
    </div>
  </Card.Content>
</Card.Root>
