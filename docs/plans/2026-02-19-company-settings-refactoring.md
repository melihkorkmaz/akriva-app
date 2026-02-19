# Company Settings Refactoring — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the 456-line monolithic `+page.svelte` into 5 section components + a thin orchestrator page, establishing the reference pattern for all future settings pages.

**Architecture:** Extract each form section (Company ID, Localization, Temporal Logic, Sector, Boundary Rules) into a dedicated Svelte component under a route-local `_components/` directory. Each component receives the Superforms `superform` object and `form` store as explicit props. The page becomes a ~60-line orchestrator handling form setup, alerts, and layout.

**Tech Stack:** SvelteKit 2, Svelte 5 (runes), Superforms + formsnap, shadcn-svelte, Zod 4, TypeScript

**Design doc:** `docs/plans/2026-02-19-company-settings-refactoring-design.md`

---

### Task 1: Create `_components/` directory and `CompanyIdentificationSection.svelte`

**Files:**
- Create: `src/routes/(app)/settings/company/_components/CompanyIdentificationSection.svelte`

**Step 1: Create the component file**

```svelte
<script lang="ts">
  import * as Form from "$lib/components/ui/form/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import type { SuperForm } from "sveltekit-superforms";
  import type { tenantSettingsSchema } from "$lib/schemas/tenant-settings";
  import type { z } from "zod";

  type FormData = z.infer<typeof tenantSettingsSchema>;

  let {
    superform,
    form,
  }: {
    superform: SuperForm<FormData>;
    form: import("svelte/store").Writable<FormData>;
  } = $props();
</script>

<Field.Set>
  <Field.Legend>Company Identification</Field.Legend>
  <Field.Group>
    <div class="grid grid-cols-2 gap-4">
      <Form.Field form={superform} name="name">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Company Name</Form.Label>
            <Input
              {...props}
              placeholder="Acme Corporation"
              bind:value={$form.name}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field form={superform} name="slug">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Company Slug</Form.Label>
            <Input
              {...props}
              placeholder="acme-corp"
              bind:value={$form.slug}
            />
          {/snippet}
        </Form.Control>
        <Form.Description>
          Unique identifier used in URLs and API references (e.g., 'acme-corp')
        </Form.Description>
        <Form.FieldErrors />
      </Form.Field>
    </div>
  </Field.Group>
</Field.Set>
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds (component not yet used, but should compile without errors)

**Step 3: Commit**

```bash
git add src/routes/\(app\)/settings/company/_components/CompanyIdentificationSection.svelte
git commit -m "refactor: extract CompanyIdentificationSection from company settings"
```

---

### Task 2: Create `LocalizationSection.svelte`

**Files:**
- Create: `src/routes/(app)/settings/company/_components/LocalizationSection.svelte`

**Step 1: Create the component file**

```svelte
<script lang="ts">
  import * as Form from "$lib/components/ui/form/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import CountrySelect from "$components/CountrySelect.svelte";
  import type { SuperForm } from "sveltekit-superforms";
  import type { tenantSettingsSchema } from "$lib/schemas/tenant-settings";
  import type { z } from "zod";

  type FormData = z.infer<typeof tenantSettingsSchema>;

  let {
    superform,
    form,
  }: {
    superform: SuperForm<FormData>;
    form: import("svelte/store").Writable<FormData>;
  } = $props();
</script>

<Field.Separator />

<Field.Set>
  <Field.Legend>Localization</Field.Legend>
  <Field.Description>
    Location determines default Grid Factors for emissions calculations
  </Field.Description>
  <Field.Group>
    <div class="grid grid-cols-3 gap-4">
      <Form.Field form={superform} name="hqCountry">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>HQ Country</Form.Label>
            <CountrySelect {...props} bind:value={$form.hqCountry} />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field form={superform} name="stateProvince">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>State/Province</Form.Label>
            <Input
              {...props}
              placeholder="California"
              value={$form.stateProvince ?? ""}
              oninput={(e: Event) => {
                const val = (e.target as HTMLInputElement).value;
                $form.stateProvince = val || null;
              }}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field form={superform} name="city">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>City</Form.Label>
            <Input
              {...props}
              placeholder="San Francisco"
              value={$form.city ?? ""}
              oninput={(e: Event) => {
                const val = (e.target as HTMLInputElement).value;
                $form.city = val || null;
              }}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
    </div>

    <div class="max-w-[400px]">
      <Form.Field form={superform} name="reportingCurrency">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Reporting Currency (ISO)</Form.Label>
            <Input
              {...props}
              placeholder="USD"
              value={$form.reportingCurrency ?? ""}
              oninput={(e: Event) => {
                const val = (e.target as HTMLInputElement).value;
                $form.reportingCurrency = val || null;
              }}
            />
          {/snippet}
        </Form.Control>
        <Form.Description>
          Master currency for all spend-based data
        </Form.Description>
        <Form.FieldErrors />
      </Form.Field>
    </div>
  </Field.Group>
</Field.Set>
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/routes/\(app\)/settings/company/_components/LocalizationSection.svelte
git commit -m "refactor: extract LocalizationSection from company settings"
```

---

### Task 3: Create `TemporalLogicSection.svelte`

**Files:**
- Create: `src/routes/(app)/settings/company/_components/TemporalLogicSection.svelte`

**Step 1: Create the component file**

Note: This component owns the `fiscalDayLabel` derived state (moved from `+page.svelte`).

```svelte
<script lang="ts">
  import * as Form from "$lib/components/ui/form/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import MonthSelect from "$components/MonthSelect.svelte";
  import type { SuperForm } from "sveltekit-superforms";
  import type { tenantSettingsSchema } from "$lib/schemas/tenant-settings";
  import type { z } from "zod";

  type FormData = z.infer<typeof tenantSettingsSchema>;

  let {
    superform,
    form,
  }: {
    superform: SuperForm<FormData>;
    form: import("svelte/store").Writable<FormData>;
  } = $props();

  let fiscalDayLabel = $derived(
    $form.fiscalYearStartDay != null ? String($form.fiscalYearStartDay) : "",
  );
</script>

<Field.Separator />

<Field.Set>
  <Field.Legend>Temporal Logic</Field.Legend>
  <Field.Group>
    <div class="grid grid-cols-4 gap-4">
      <Form.Field form={superform} name="fiscalYearStartMonth">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Fiscal Year (Month)</Form.Label>
            <MonthSelect {...props} bind:value={$form.fiscalYearStartMonth} />
          {/snippet}
        </Form.Control>
        <Form.Description>
          Essential for aligning with financial reports
        </Form.Description>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field form={superform} name="fiscalYearStartDay">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Fiscal Year (Day)</Form.Label>
            <Select.Root
              type="single"
              value={$form.fiscalYearStartDay != null
                ? String($form.fiscalYearStartDay)
                : undefined}
              onValueChange={(val) => {
                $form.fiscalYearStartDay = val ? Number(val) : null;
              }}
            >
              <Select.Trigger class="w-full" {...props}>
                {#if fiscalDayLabel}
                  {fiscalDayLabel}
                {:else}
                  <span class="text-muted-foreground">Select day</span>
                {/if}
              </Select.Trigger>
              <Select.Content>
                {#each Array.from({ length: 31 }, (_, i) => i + 1) as day}
                  <Select.Item value={String(day)}>{day}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <div class="col-span-2">
        <Form.Field form={superform} name="baseYear">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Base Year</Form.Label>
              <Input
                {...props}
                type="number"
                placeholder="2024"
                value={$form.baseYear ?? ""}
                oninput={(e: Event) => {
                  const val = (e.target as HTMLInputElement).value;
                  $form.baseYear = val ? Number(val) : null;
                }}
              />
            {/snippet}
          </Form.Control>
          <Form.Description>
            Benchmark year for measuring reduction targets
          </Form.Description>
          <Form.FieldErrors />
        </Form.Field>
      </div>
    </div>
  </Field.Group>
</Field.Set>
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/routes/\(app\)/settings/company/_components/TemporalLogicSection.svelte
git commit -m "refactor: extract TemporalLogicSection from company settings"
```

---

### Task 4: Create `SectorSection.svelte`

**Files:**
- Create: `src/routes/(app)/settings/company/_components/SectorSection.svelte`

**Step 1: Create the component file**

Note: This component owns the cascade reset logic (clear subSector when sector changes).

```svelte
<script lang="ts">
  import * as Form from "$lib/components/ui/form/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import SectorSelect from "$components/SectorSelect.svelte";
  import SubSectorSelect from "$components/SubSectorSelect.svelte";
  import { getSubSectors } from "$lib/data/sectors.js";
  import type { SuperForm } from "sveltekit-superforms";
  import type { tenantSettingsSchema } from "$lib/schemas/tenant-settings";
  import type { z } from "zod";

  type FormData = z.infer<typeof tenantSettingsSchema>;

  let {
    superform,
    form,
  }: {
    superform: SuperForm<FormData>;
    form: import("svelte/store").Writable<FormData>;
  } = $props();
</script>

<Field.Separator />

<Field.Set>
  <Field.Legend>Future-Proofing</Field.Legend>
  <Field.Description>
    Sector selection filters the Process Emissions library for relevant emission
    factors
  </Field.Description>
  <Field.Group>
    <div class="grid grid-cols-2 gap-4">
      <Form.Field form={superform} name="sector">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Sector</Form.Label>
            <SectorSelect
              {...props}
              bind:value={$form.sector}
              onValueChange={(newSector) => {
                if (
                  !newSector ||
                  !getSubSectors(newSector).includes($form.subSector ?? "")
                ) {
                  $form.subSector = null;
                }
              }}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field form={superform} name="subSector">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Sub-sector</Form.Label>
            <SubSectorSelect
              {...props}
              bind:value={$form.subSector}
              sector={$form.sector}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
    </div>
  </Field.Group>
</Field.Set>
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/routes/\(app\)/settings/company/_components/SectorSection.svelte
git commit -m "refactor: extract SectorSection from company settings"
```

---

### Task 5: Create `BoundaryRulesSection.svelte`

**Files:**
- Create: `src/routes/(app)/settings/company/_components/BoundaryRulesSection.svelte`

**Step 1: Create the component file**

Note: This component is rendered as a standalone Card (not inside the Company Master Settings card). It owns the `consolidationApproach` derived state.

```svelte
<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
  import { Alert, AlertDescription } from "$lib/components/ui/alert/index.js";
  import Info from "@lucide/svelte/icons/info";
  import { cn } from "$lib/utils.js";
  import type { SuperForm } from "sveltekit-superforms";
  import type { tenantSettingsSchema } from "$lib/schemas/tenant-settings";
  import type { z } from "zod";
  import type { ConsolidationApproach } from "$lib/api/types";

  type FormData = z.infer<typeof tenantSettingsSchema>;

  let {
    superform,
    form,
  }: {
    superform: SuperForm<FormData>;
    form: import("svelte/store").Writable<FormData>;
  } = $props();

  let consolidationApproach = $derived(
    $form.consolidationApproach ?? "operational_control",
  );
</script>

<Card.Root>
  <Card.Content class="pt-6">
    <Field.Set>
      <Field.Legend>Boundary Rules (Consolidation Approach)</Field.Legend>
      <Field.Description>
        Determine which emissions belong to your company based on the GHG
        Protocol
      </Field.Description>

      <RadioGroup.Root
        value={consolidationApproach}
        onValueChange={(val) => {
          $form.consolidationApproach =
            (val as ConsolidationApproach) || null;
        }}
      >
        <div class="flex flex-col gap-3">
          <label
            class={cn(
              "flex items-start gap-3 rounded-md border p-4 cursor-pointer transition-colors",
              consolidationApproach === "operational_control" &&
                "border-primary bg-primary/10",
            )}
          >
            <RadioGroup.Item value="operational_control" />
            <div class="flex flex-col gap-1">
              <span class="text-base font-semibold">Operational Control</span>
              <span class="text-sm text-muted-foreground">
                100% accounting if you have full authority to
                introduce/implement operating policies
              </span>
            </div>
          </label>

          <label
            class={cn(
              "flex items-start gap-3 rounded-md border p-4 cursor-pointer transition-colors",
              consolidationApproach === "financial_control" &&
                "border-primary bg-primary/10",
            )}
          >
            <RadioGroup.Item value="financial_control" />
            <div class="flex flex-col gap-1">
              <span class="text-base font-semibold">Financial Control</span>
              <span class="text-sm text-muted-foreground">
                100% accounting if you have the power to direct financial and
                operating policies for economic benefit
              </span>
            </div>
          </label>

          <label
            class={cn(
              "flex items-start gap-3 rounded-md border p-4 cursor-pointer transition-colors",
              consolidationApproach === "equity_share" &&
                "border-primary bg-primary/10",
            )}
          >
            <RadioGroup.Item value="equity_share" />
            <div class="flex flex-col gap-1">
              <span class="text-base font-semibold">Equity Share</span>
              <span class="text-sm text-muted-foreground">
                Accounting based on your % of ownership interest
              </span>
            </div>
          </label>
        </div>
      </RadioGroup.Root>

      <Alert>
        <Info class="size-4" />
        <AlertDescription>
          If Equity Share is selected, an Ownership Percentage field will be
          enabled in all Asset/Entry forms
        </AlertDescription>
      </Alert>
    </Field.Set>
  </Card.Content>
</Card.Root>
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/routes/\(app\)/settings/company/_components/BoundaryRulesSection.svelte
git commit -m "refactor: extract BoundaryRulesSection from company settings"
```

---

### Task 6: Refactor `+page.svelte` to orchestrator

**Files:**
- Modify: `src/routes/(app)/settings/company/+page.svelte` (replace entire content)

**Step 1: Replace `+page.svelte` with the thin orchestrator**

The page drops from 456 lines to ~75 lines. It keeps: Superforms setup, alerts/errors, form wrapper, Card shells, action buttons. It delegates all field rendering to section components.

```svelte
<script lang="ts">
  import { superForm } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Alert, AlertDescription } from "$lib/components/ui/alert/index.js";
  import { tenantSettingsSchema } from "$lib/schemas/tenant-settings";

  import CompanyIdentificationSection from "./_components/CompanyIdentificationSection.svelte";
  import LocalizationSection from "./_components/LocalizationSection.svelte";
  import TemporalLogicSection from "./_components/TemporalLogicSection.svelte";
  import SectorSection from "./_components/SectorSection.svelte";
  import BoundaryRulesSection from "./_components/BoundaryRulesSection.svelte";

  let { data } = $props();

  const sf = superForm(data.form, {
    validators: zod4Client(tenantSettingsSchema),
    dataType: "json",
    resetForm: false,
    onError({ result }) {
      $message =
        typeof result.error === "string"
          ? result.error
          : "An unexpected error occurred. Please try again.";
    },
  });
  const { form, allErrors, enhance, message, submitting } = sf;
</script>

<svelte:head>
  <title>Company Settings | Akriva</title>
</svelte:head>

<div class="p-8 px-10">
  <h1 class="text-2xl font-semibold">Company Settings</h1>
  <p class="text-base text-muted-foreground">
    Configure your organization's emissions accounting methodology and master
    settings
  </p>

  {#if $message}
    <Alert
      variant={$message === "Settings saved successfully."
        ? "default"
        : "destructive"}
      class="mt-4"
    >
      <AlertDescription>{$message}</AlertDescription>
    </Alert>
  {/if}

  {#if $allErrors.length > 0}
    <Alert variant="destructive" class="mt-4">
      <AlertDescription>
        <strong>Please fix the following errors:</strong>
        <ul class="mt-2 pl-4 list-disc">
          {#each $allErrors as error}
            <li>{error.messages.join(", ")}</li>
          {/each}
        </ul>
      </AlertDescription>
    </Alert>
  {/if}

  <form method="POST" use:enhance>
    <div class="flex flex-col gap-6 mt-6">
      <Card.Root>
        <Card.Header>
          <Card.Title>
            <h2 class="text-lg font-semibold">Company Master Settings</h2>
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <Field.Group>
            <CompanyIdentificationSection superform={sf} {form} />
            <LocalizationSection superform={sf} {form} />
            <TemporalLogicSection superform={sf} {form} />
            <SectorSection superform={sf} {form} />
          </Field.Group>
        </Card.Content>
      </Card.Root>

      <BoundaryRulesSection superform={sf} {form} />

      <div class="flex gap-3 justify-end py-4">
        <Button variant="outline" type="button" href="/settings/company">
          Cancel
        </Button>
        <Form.Button disabled={$submitting}>
          {$submitting ? "Saving..." : "Save Changes"}
        </Form.Button>
      </div>
    </div>
  </form>
</div>
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors or warnings

**Step 3: Verify dev server**

Run: `npm run dev`
Navigate to `/settings/company` and verify:
- All 5 sections render correctly
- Form fields are populated from server data
- Validation errors display correctly
- Submit works and shows success/error messages
- Sector → Sub-sector cascade works
- Consolidation approach radio cards highlight correctly

**Step 4: Commit**

```bash
git add src/routes/\(app\)/settings/company/+page.svelte
git commit -m "refactor: slim +page.svelte to orchestrator using section components

Reduces company settings page from 456 to ~75 lines by delegating
field rendering to 5 section components in _components/."
```

---

### Task 7: Final verification and cleanup

**Step 1: Run full build**

Run: `npm run build`
Expected: Clean build, no errors, no warnings

**Step 2: Verify file structure**

Run: `ls -la src/routes/\(app\)/settings/company/_components/`
Expected: 5 `.svelte` files

**Step 3: Verify line counts**

Run: `wc -l src/routes/\(app\)/settings/company/+page.svelte src/routes/\(app\)/settings/company/_components/*.svelte`
Expected: `+page.svelte` ~75 lines, each section component 35-100 lines

**Step 4: Verify `+page.server.ts` is unchanged**

Run: `git diff src/routes/\(app\)/settings/company/+page.server.ts`
Expected: No changes

**Step 5: Commit (if any cleanup was needed)**

Only commit if adjustments were made during verification.
