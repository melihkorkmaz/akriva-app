<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Alert, AlertDescription } from "$lib/components/ui/alert/index.js";
  import CircleCheck from "@lucide/svelte/icons/circle-check";

  import TextDivider from "$components/TextDivider.svelte";
  import { page } from "$app/state";

  const token = $derived(page.url.searchParams.get("token") ?? "");
  const orgName = $derived(
    page.url.searchParams.get("org") ?? "Organization",
  );
</script>

<svelte:head>
  <title>Join Organization | Akriva</title>
</svelte:head>

<Card.Root class="w-full max-w-[490px]">
  <Card.Content class="pt-6">
    <div class="flex flex-col gap-5">
      <!-- Invitation Badge -->
      <Alert class="border-emerald-200 bg-emerald-50 text-emerald-800">
        <CircleCheck class="size-4 text-emerald-600" />
        <AlertDescription>Valid Invitation</AlertDescription>
      </Alert>

      <!-- Title Section -->
      <div class="flex flex-col gap-2 items-center">
        <h2 class="text-2xl font-semibold">Join Your Organization</h2>
        <p class="text-base text-muted-foreground">
          Joining <strong class="text-foreground">{orgName}</strong>
        </p>
      </div>

      <!-- Form -->
      <form class="flex flex-col gap-5">
        <div class="grid grid-cols-2 gap-4">
          <Field.Field>
            <Field.Label for="firstName">First Name</Field.Label>
            <Input id="firstName" name="firstName" placeholder="Jane" />
          </Field.Field>
          <Field.Field>
            <Field.Label for="lastName">Last Name</Field.Label>
            <Input id="lastName" name="lastName" placeholder="Smith" />
          </Field.Field>
        </div>

        <Field.Field>
          <Field.Label for="email">Email Address</Field.Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="jane.smith@company.com"
          />
        </Field.Field>

        <Field.Field>
          <Field.Label for="password">Password</Field.Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
          />
          <Field.Description>8-256 characters</Field.Description>
        </Field.Field>

        <Field.Field>
          <Field.Label for="token">Invitation Token</Field.Label>
          <Input
            id="token"
            name="token"
            value={token || "INV-XXXX-XXXX-XXXX"}
            disabled
          />
        </Field.Field>

        <Button type="submit" class="w-full">Join Organization</Button>
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
