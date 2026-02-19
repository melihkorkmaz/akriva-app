<script lang="ts">
  import { superForm } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Alert, AlertDescription } from "$lib/components/ui/alert/index.js";
  import Eye from "@lucide/svelte/icons/eye";
  import EyeOff from "@lucide/svelte/icons/eye-off";

  import TextDivider from "$components/TextDivider.svelte";
  import { signupSchema } from "$lib/schemas/signup.js";

  let { data } = $props();

  let showPassword = $state(false);

  const superform = superForm(data.form, {
    validators: zod4Client(signupSchema),
  });
  const { form, enhance, message, submitting } = superform;
</script>

<svelte:head>
  <title>Sign Up | Akriva</title>
</svelte:head>

<Card.Root class="w-full max-w-[490px]">
  <Card.Content class="pt-6">
    <div class="flex flex-col gap-5">
      <div class="flex flex-col gap-2 items-center">
        <h2 class="text-2xl font-semibold">Create Your Organization</h2>
        <p class="text-base text-muted-foreground">
          Set up your institutional ledger environment
        </p>
      </div>

      {#if $message}
        <Alert variant="destructive">
          <AlertDescription>{$message}</AlertDescription>
        </Alert>
      {/if}

      <form method="POST" use:enhance class="flex flex-col gap-5">
        <div class="grid grid-cols-2 gap-4">
          <Form.Field form={superform} name="firstName">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>First Name</Form.Label>
                <Input
                  {...props}
                  placeholder="Jane"
                  bind:value={$form.firstName}
                />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field form={superform} name="lastName">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Last Name</Form.Label>
                <Input
                  {...props}
                  placeholder="Doe"
                  bind:value={$form.lastName}
                />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>
        </div>

        <Form.Field form={superform} name="companyName">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Company Name</Form.Label>
              <Input
                {...props}
                placeholder="Acme Corporation"
                bind:value={$form.companyName}
              />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Field form={superform} name="email">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Email Address</Form.Label>
              <Input
                {...props}
                type="email"
                placeholder="john.doe@company.com"
                bind:value={$form.email}
              />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Field form={superform} name="password">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Password</Form.Label>
              <div class="relative">
                <Input
                  {...props}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  bind:value={$form.password}
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onclick={() => (showPassword = !showPassword)}
                  tabindex={-1}
                >
                  {#if showPassword}
                    <EyeOff class="size-4" />
                  {:else}
                    <Eye class="size-4" />
                  {/if}
                </button>
              </div>
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Button class="w-full" disabled={$submitting}>
          {$submitting ? "Creating..." : "Create Organization"}
        </Form.Button>
      </form>

      <TextDivider />

      <div class="flex flex-wrap gap-2 justify-center">
        <span class="text-sm text-muted-foreground"
          >Already have an account?</span
        >
        <a href="/signin" class="text-sm font-bold text-primary hover:underline"
          >Sign in</a
        >
      </div>
    </div>
  </Card.Content>
</Card.Root>
