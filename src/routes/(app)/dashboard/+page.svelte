<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Progress } from "$lib/components/ui/progress";
  import { Separator } from "$lib/components/ui/separator";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import FileCheck from "@lucide/svelte/icons/file-check";
</script>

<svelte:head>
  <title>Dashboard | Akriva</title>
</svelte:head>

<div class="flex flex-col gap-5 items-center justify-center p-12 h-full">
  <!-- Empty State Icon -->
  <div class="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
    <BookOpen class="size-10 text-muted-foreground" />
  </div>

  <!-- Welcome Text -->
  <div class="flex flex-col gap-2 items-center">
    <h2 class="text-2xl font-semibold">Welcome to Akriva</h2>
    <p class="text-base text-muted-foreground text-center">
      Complete these steps to start your carbon accounting journey
    </p>
  </div>

  <!-- Success Checklist -->
  <Card.Root class="w-full max-w-[600px]">
    <Card.Content class="pt-6">
      <div class="flex flex-col gap-5">
        <!-- Header -->
        <div class="flex gap-3 items-center">
          <FileCheck class="size-6 text-primary" />
          <h3 class="text-xl font-semibold">Success Checklist</h3>
        </div>

        <!-- Progress -->
        <div class="flex flex-col gap-2 bg-muted p-3 px-4 rounded-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs text-muted-foreground">Setup Progress</span>
            <span class="font-semibold text-primary text-sm">0/3 Completed</span>
          </div>
          <Progress value={0} max={100} class="h-1" />
        </div>

        <Separator />

        <!-- Tasks -->
        <div class="flex flex-col gap-4">
          <div class="flex items-start gap-3 rounded-md border p-4">
            <Checkbox class="mt-0.5" />
            <div class="flex flex-col gap-1">
              <strong>Task 1: Define Boundary</strong>
              <span class="text-sm text-muted-foreground">Set up organizational boundaries and reporting scope</span>
              <span class="text-xs text-muted-foreground">Status: Incomplete</span>
            </div>
          </div>

          <div class="flex items-start gap-3 rounded-md border p-4">
            <Checkbox class="mt-0.5" />
            <div class="flex flex-col gap-1">
              <strong>Task 2: Configure Company Master</strong>
              <span class="text-sm text-muted-foreground">Add company details, locations, and operational units</span>
              <span class="text-xs text-muted-foreground">Status: Incomplete</span>
            </div>
          </div>

          <div class="flex items-start gap-3 rounded-md border p-4">
            <Checkbox class="mt-0.5" />
            <div class="flex flex-col gap-1">
              <strong>Task 3: Set Calculation Engine</strong>
              <span class="text-sm text-muted-foreground">Configure emission factors and calculation methodology</span>
              <span class="text-xs text-muted-foreground">Status: Incomplete</span>
            </div>
          </div>
        </div>
      </div>
    </Card.Content>
  </Card.Root>
</div>
