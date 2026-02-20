# Application Settings Page — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire the application settings page to the backend API with all 11 fields, Superforms integration, Zod validation, and extracted section components.

**Architecture:** Server load fetches settings via `GET /v1/tenants/settings/application`, populates Superforms. Form action validates with Zod then calls `PATCH /v1/tenants/settings/application`. Page is a thin orchestrator passing superform to 3 section components (Localization, Units, Scientific Authority).

**Tech Stack:** SvelteKit 2, Svelte 5 runes, Superforms + formsnap, Zod 4, shadcn-svelte components, Tailwind CSS

---

## Task 1: Add API Types

**Files:**
- Modify: `src/lib/api/types.ts` (append after line 165)

**Step 1: Add the `TenantSettingsResponseDto` and `UpdateApplicationSettingsRequest` types**

Add the following after the existing `UpdateTenantSettingsRequest` interface (line 165):

```typescript
/** Decimal separator options */
export type DecimalSeparator = 'point' | 'comma';

/** Thousands separator options */
export type ThousandsSeparator = 'comma' | 'point' | 'space' | 'none';

/** Date format options */
export type DateFormat = 'dd_mm_yyyy' | 'mm_dd_yyyy' | 'yyyy_mm_dd';

/** Time format options */
export type TimeFormat = '24h' | '12h';

/** Unit system options */
export type UnitSystem = 'metric' | 'imperial' | 'custom';

/** Emission display unit options */
export type EmissionDisplayUnit = 'tco2e' | 'kgco2e';

/** GWP version options */
export type GwpVersion = 'ar5' | 'ar6';

/** Emission factor authority options */
export type EmissionAuthority = 'ipcc' | 'defra' | 'epa' | 'iea' | 'egrid';

/** Application settings response DTO — returned by GET/PATCH /v1/tenants/settings/application */
export interface TenantSettingsResponseDto {
	id: string;
	tenantId: string;
	decimalSeparator: DecimalSeparator;
	thousandsSeparator: ThousandsSeparator;
	decimalPrecision: number;
	dateFormat: DateFormat;
	timeFormat: TimeFormat;
	timezone: string;
	unitSystem: UnitSystem;
	emissionDisplayUnit: EmissionDisplayUnit;
	gwpVersion: GwpVersion;
	scope1Authority: EmissionAuthority;
	scope2Authority: EmissionAuthority;
	createdAt: string;
	updatedAt: string;
}

/** Update application settings request — PATCH /v1/tenants/settings/application (all fields optional) */
export interface UpdateApplicationSettingsRequest {
	decimalSeparator?: DecimalSeparator;
	thousandsSeparator?: ThousandsSeparator;
	decimalPrecision?: number;
	dateFormat?: DateFormat;
	timeFormat?: TimeFormat;
	timezone?: string;
	unitSystem?: UnitSystem;
	emissionDisplayUnit?: EmissionDisplayUnit;
	gwpVersion?: GwpVersion;
	scope1Authority?: EmissionAuthority;
	scope2Authority?: EmissionAuthority;
}
```

**Step 2: Commit**

```bash
git add src/lib/api/types.ts
git commit -m "feat: add application settings API types"
```

---

## Task 2: Add API Functions

**Files:**
- Modify: `src/lib/api/tenant.ts` (append after line 18)

**Step 1: Add `getApplicationSettings` and `updateApplicationSettings` functions**

Add the following after the existing `updateTenantSettings` function, and update the import to include the new types:

Update the import line at the top:

```typescript
import type { TenantResponseDto, UpdateTenantSettingsRequest, TenantSettingsResponseDto, UpdateApplicationSettingsRequest } from './types.js';
```

Then add after line 18:

```typescript
/** GET /v1/tenants/settings/application */
export async function getApplicationSettings(
	accessToken: string
): Promise<TenantSettingsResponseDto> {
	return apiFetchAuth<TenantSettingsResponseDto>('/tenants/settings/application', accessToken);
}

/** PATCH /v1/tenants/settings/application */
export async function updateApplicationSettings(
	accessToken: string,
	data: UpdateApplicationSettingsRequest
): Promise<TenantSettingsResponseDto> {
	return apiFetchAuth<TenantSettingsResponseDto>('/tenants/settings/application', accessToken, {
		method: 'PATCH',
		body: JSON.stringify(data)
	});
}
```

**Step 2: Commit**

```bash
git add src/lib/api/tenant.ts
git commit -m "feat: add application settings API functions"
```

---

## Task 3: Create Zod Schema

**Files:**
- Create: `src/lib/schemas/application-settings.ts`

**Step 1: Create the application settings Zod schema**

```typescript
import { z } from 'zod';

/** Application settings form schema — matches backend PATCH /v1/tenants/settings/application */
export const applicationSettingsSchema = z
	.object({
		decimalSeparator: z.enum(['point', 'comma']),
		thousandsSeparator: z.enum(['comma', 'point', 'space', 'none']),
		decimalPrecision: z.coerce.number().int().min(0, 'Precision must be at least 0').max(10, 'Precision must be at most 10'),
		dateFormat: z.enum(['dd_mm_yyyy', 'mm_dd_yyyy', 'yyyy_mm_dd']),
		timeFormat: z.enum(['24h', '12h']),
		timezone: z.string().min(1, 'Timezone is required'),
		unitSystem: z.enum(['metric', 'imperial', 'custom']),
		emissionDisplayUnit: z.enum(['tco2e', 'kgco2e']),
		gwpVersion: z.enum(['ar5', 'ar6']),
		scope1Authority: z.enum(['ipcc', 'defra', 'epa', 'iea', 'egrid']),
		scope2Authority: z.enum(['ipcc', 'defra', 'epa', 'iea', 'egrid'])
	})
	.superRefine((data, ctx) => {
		if (
			data.decimalSeparator === data.thousandsSeparator
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Decimal separator and thousands separator cannot be the same',
				path: ['thousandsSeparator']
			});
		}
	});
```

**Step 2: Commit**

```bash
git add src/lib/schemas/application-settings.ts
git commit -m "feat: add application settings Zod schema with separator conflict validation"
```

---

## Task 4: Create Server Load + Action

**Files:**
- Create: `src/routes/(app)/settings/application-settings/+page.server.ts`

**Reference:** Follow the exact pattern from `src/routes/(app)/settings/company/+page.server.ts`.

**Step 1: Create the server file**

```typescript
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { getApplicationSettings, updateApplicationSettings } from '$lib/api/tenant.js';
import { ApiError } from '$lib/api/client.js';
import { applicationSettingsSchema } from '$lib/schemas/application-settings.js';
import type { UpdateApplicationSettingsRequest } from '$lib/api/types.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session!;
	const settings = await getApplicationSettings(session.idToken);

	const form = await superValidate(
		{
			decimalSeparator: settings.decimalSeparator,
			thousandsSeparator: settings.thousandsSeparator,
			decimalPrecision: settings.decimalPrecision,
			dateFormat: settings.dateFormat,
			timeFormat: settings.timeFormat,
			timezone: settings.timezone,
			unitSystem: settings.unitSystem,
			emissionDisplayUnit: settings.emissionDisplayUnit,
			gwpVersion: settings.gwpVersion,
			scope1Authority: settings.scope1Authority,
			scope2Authority: settings.scope2Authority
		},
		zod4(applicationSettingsSchema)
	);

	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const session = locals.session!;
		const form = await superValidate(request, zod4(applicationSettingsSchema));

		if (!form.valid) {
			return message(form, 'Please check your settings and try again.', { status: 400 });
		}

		try {
			const payload: UpdateApplicationSettingsRequest = {
				decimalSeparator: form.data.decimalSeparator,
				thousandsSeparator: form.data.thousandsSeparator,
				decimalPrecision: form.data.decimalPrecision,
				dateFormat: form.data.dateFormat,
				timeFormat: form.data.timeFormat,
				timezone: form.data.timezone,
				unitSystem: form.data.unitSystem,
				emissionDisplayUnit: form.data.emissionDisplayUnit,
				gwpVersion: form.data.gwpVersion,
				scope1Authority: form.data.scope1Authority,
				scope2Authority: form.data.scope2Authority
			};

			await updateApplicationSettings(session.idToken, payload);
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 400 && err.body.code === 'VALIDATION_FAILED') {
					return message(
						form,
						err.body.error || 'Please check your settings and try again.',
						{ status: 400 }
					);
				}

				if (err.status === 404) {
					return message(form, 'Settings not found.', { status: 404 });
				}
			}

			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		return message(form, 'Settings saved successfully.');
	}
};
```

**Step 2: Commit**

```bash
git add src/routes/\(app\)/settings/application-settings/+page.server.ts
git commit -m "feat: add application settings server load and form action"
```

---

## Task 5: Create LocalizationSection Component

**Files:**
- Create: `src/routes/(app)/settings/application-settings/_components/LocalizationSection.svelte`

**Reference:** Follow the prop pattern from `src/routes/(app)/settings/company/_components/LocalizationSection.svelte` (the company one) for typing.

**Step 1: Create the component**

```svelte
<script lang="ts">
  import * as Form from "$lib/components/ui/form/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import type { Writable } from "svelte/store";
  import type { SuperForm } from "sveltekit-superforms";
  import type { applicationSettingsSchema } from "$lib/schemas/application-settings";
  import type { z } from "zod";

  type FormData = z.infer<typeof applicationSettingsSchema>;

  let {
    superform,
    form,
  }: {
    superform: SuperForm<FormData>;
    form: Writable<FormData>;
  } = $props();

  const TIMEZONES = [
    { value: "UTC", label: "UTC" },
    { value: "America/New_York", label: "Eastern Time (US)" },
    { value: "America/Chicago", label: "Central Time (US)" },
    { value: "America/Denver", label: "Mountain Time (US)" },
    { value: "America/Los_Angeles", label: "Pacific Time (US)" },
    { value: "America/Sao_Paulo", label: "Brasilia (Brazil)" },
    { value: "Europe/London", label: "London (UK)" },
    { value: "Europe/Paris", label: "Paris (France)" },
    { value: "Europe/Berlin", label: "Berlin (Germany)" },
    { value: "Europe/Istanbul", label: "Istanbul (Turkey)" },
    { value: "Europe/Moscow", label: "Moscow (Russia)" },
    { value: "Asia/Dubai", label: "Dubai (UAE)" },
    { value: "Asia/Kolkata", label: "Kolkata (India)" },
    { value: "Asia/Bangkok", label: "Bangkok (Thailand)" },
    { value: "Asia/Shanghai", label: "Shanghai (China)" },
    { value: "Asia/Tokyo", label: "Tokyo (Japan)" },
    { value: "Asia/Seoul", label: "Seoul (South Korea)" },
    { value: "Asia/Singapore", label: "Singapore" },
    { value: "Australia/Sydney", label: "Sydney (Australia)" },
    { value: "Australia/Melbourne", label: "Melbourne (Australia)" },
    { value: "Pacific/Auckland", label: "Auckland (New Zealand)" },
    { value: "Africa/Johannesburg", label: "Johannesburg (South Africa)" },
    { value: "Africa/Lagos", label: "Lagos (Nigeria)" },
    { value: "Africa/Cairo", label: "Cairo (Egypt)" },
  ];

  const DECIMAL_SEPARATOR_OPTIONS = [
    { value: "point", label: "Point (.)" },
    { value: "comma", label: "Comma (,)" },
  ];

  const THOUSANDS_SEPARATOR_OPTIONS = [
    { value: "comma", label: "Comma (,)" },
    { value: "point", label: "Point (.)" },
    { value: "space", label: "Space ( )" },
    { value: "none", label: "None" },
  ];

  const DATE_FORMAT_OPTIONS = [
    { value: "dd_mm_yyyy", label: "DD/MM/YYYY" },
    { value: "mm_dd_yyyy", label: "MM/DD/YYYY" },
    { value: "yyyy_mm_dd", label: "YYYY-MM-DD" },
  ];

  const TIME_FORMAT_OPTIONS = [
    { value: "24h", label: "24-hour (14:30)" },
    { value: "12h", label: "12-hour (2:30 PM)" },
  ];

  let decimalSepLabel = $derived(
    DECIMAL_SEPARATOR_OPTIONS.find((o) => o.value === $form.decimalSeparator)
      ?.label ?? "",
  );

  let thousandsSepLabel = $derived(
    THOUSANDS_SEPARATOR_OPTIONS.find(
      (o) => o.value === $form.thousandsSeparator,
    )?.label ?? "",
  );

  let dateFormatLabel = $derived(
    DATE_FORMAT_OPTIONS.find((o) => o.value === $form.dateFormat)?.label ?? "",
  );

  let timeFormatLabel = $derived(
    TIME_FORMAT_OPTIONS.find((o) => o.value === $form.timeFormat)?.label ?? "",
  );

  let timezoneLabel = $derived(
    TIMEZONES.find((o) => o.value === $form.timezone)?.label ?? $form.timezone,
  );

  function formatExample(
    value: number,
    decSep: string,
    thousSep: string,
    precision: number,
  ): string {
    const fixed = value.toFixed(precision);
    const [intPart, decPart] = fixed.split(".");
    const decChar = decSep === "comma" ? "," : ".";
    let thousChar = "";
    if (thousSep === "comma") thousChar = ",";
    else if (thousSep === "point") thousChar = ".";
    else if (thousSep === "space") thousChar = " ";

    const formatted = thousChar
      ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousChar)
      : intPart;

    return decPart ? `${formatted}${decChar}${decPart}` : formatted;
  }
</script>

<Card.Root>
  <Card.Content class="pt-6">
    <Field.Set>
      <Field.Legend>Localization</Field.Legend>
      <Field.Description>
        Configure number, date, and time formatting preferences for your
        organization
      </Field.Description>

      <Field.Group>
        <div class="grid grid-cols-3 gap-4">
          <Form.Field form={superform} name="decimalSeparator">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Decimal Separator</Form.Label>
                <Select.Root
                  type="single"
                  value={$form.decimalSeparator}
                  onValueChange={(val) => {
                    if (val) $form.decimalSeparator = val;
                  }}
                >
                  <Select.Trigger class="w-full" {...props}>
                    {decimalSepLabel}
                  </Select.Trigger>
                  <Select.Content>
                    {#each DECIMAL_SEPARATOR_OPTIONS as opt}
                      <Select.Item value={opt.value}>{opt.label}</Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field form={superform} name="thousandsSeparator">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Thousands Separator</Form.Label>
                <Select.Root
                  type="single"
                  value={$form.thousandsSeparator}
                  onValueChange={(val) => {
                    if (val) $form.thousandsSeparator = val;
                  }}
                >
                  <Select.Trigger class="w-full" {...props}>
                    {thousandsSepLabel}
                  </Select.Trigger>
                  <Select.Content>
                    {#each THOUSANDS_SEPARATOR_OPTIONS as opt}
                      <Select.Item value={opt.value}>{opt.label}</Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field form={superform} name="decimalPrecision">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Decimal Precision</Form.Label>
                <Input
                  {...props}
                  type="number"
                  min="0"
                  max="10"
                  class="w-20"
                  bind:value={$form.decimalPrecision}
                />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <Form.Field form={superform} name="dateFormat">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Date Format</Form.Label>
                <Select.Root
                  type="single"
                  value={$form.dateFormat}
                  onValueChange={(val) => {
                    if (val) $form.dateFormat = val;
                  }}
                >
                  <Select.Trigger class="w-full" {...props}>
                    {dateFormatLabel}
                  </Select.Trigger>
                  <Select.Content>
                    {#each DATE_FORMAT_OPTIONS as opt}
                      <Select.Item value={opt.value}>{opt.label}</Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field form={superform} name="timeFormat">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Time Format</Form.Label>
                <Select.Root
                  type="single"
                  value={$form.timeFormat}
                  onValueChange={(val) => {
                    if (val) $form.timeFormat = val;
                  }}
                >
                  <Select.Trigger class="w-full" {...props}>
                    {timeFormatLabel}
                  </Select.Trigger>
                  <Select.Content>
                    {#each TIME_FORMAT_OPTIONS as opt}
                      <Select.Item value={opt.value}>{opt.label}</Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field form={superform} name="timezone">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Timezone</Form.Label>
                <Select.Root
                  type="single"
                  value={$form.timezone}
                  onValueChange={(val) => {
                    if (val) $form.timezone = val;
                  }}
                >
                  <Select.Trigger class="w-full" {...props}>
                    {timezoneLabel}
                  </Select.Trigger>
                  <Select.Content>
                    {#each TIMEZONES as tz}
                      <Select.Item value={tz.value}>{tz.label}</Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>
        </div>
      </Field.Group>

      <!-- Format Examples -->
      <div class="flex flex-col gap-3 pt-4 border-t border-border">
        <span class="text-xs font-semibold text-muted-foreground tracking-wide"
          >Format Examples</span
        >
        <div class="flex flex-wrap gap-6">
          <div class="flex flex-col gap-1">
            <span class="text-xs text-muted-foreground"
              >Carbon Emissions (tCO₂e)</span
            >
            <span class="font-mono text-base font-medium">
              {formatExample(
                12345.67,
                $form.decimalSeparator,
                $form.thousandsSeparator,
                $form.decimalPrecision,
              )}
            </span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-muted-foreground">Energy (MWh)</span>
            <span class="font-mono text-base font-medium">
              {formatExample(
                987654.32,
                $form.decimalSeparator,
                $form.thousandsSeparator,
                $form.decimalPrecision,
              )}
            </span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-muted-foreground">Reduction %</span>
            <span
              class="font-mono text-base font-medium text-emerald-500"
            >
              {formatExample(
                45.89,
                $form.decimalSeparator,
                $form.thousandsSeparator,
                $form.decimalPrecision,
              )}
            </span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-muted-foreground">Total Emissions</span>
            <span class="font-mono text-base font-medium">
              {formatExample(
                1234567890.12,
                $form.decimalSeparator,
                $form.thousandsSeparator,
                $form.decimalPrecision,
              )}
            </span>
          </div>
        </div>
      </div>
    </Field.Set>
  </Card.Content>
</Card.Root>
```

**Important:** This component needs `import * as Card from "$lib/components/ui/card/index.js";` added to the script tag.

**Step 2: Commit**

```bash
git add src/routes/\(app\)/settings/application-settings/_components/LocalizationSection.svelte
git commit -m "feat: add LocalizationSection component for application settings"
```

---

## Task 6: Create UnitsSection Component

**Files:**
- Create: `src/routes/(app)/settings/application-settings/_components/UnitsSection.svelte`

**Reference:** Follow the RadioGroup card pattern from `src/routes/(app)/settings/company/_components/BoundaryRulesSection.svelte`.

**Step 1: Create the component**

```svelte
<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
  import { cn } from "$lib/utils.js";
  import type { Writable } from "svelte/store";
  import type { SuperForm } from "sveltekit-superforms";
  import type { applicationSettingsSchema } from "$lib/schemas/application-settings";
  import type { z } from "zod";

  type FormData = z.infer<typeof applicationSettingsSchema>;

  let {
    superform,
    form,
  }: {
    superform: SuperForm<FormData>;
    form: Writable<FormData>;
  } = $props();

  const EMISSION_UNIT_OPTIONS = [
    { value: "tco2e", label: "tCO₂e (Tonnes)" },
    { value: "kgco2e", label: "kgCO₂e (Kilograms)" },
  ];

  let emissionUnitLabel = $derived(
    EMISSION_UNIT_OPTIONS.find((o) => o.value === $form.emissionDisplayUnit)
      ?.label ?? "",
  );
</script>

<Card.Root>
  <Card.Content class="pt-6">
    <Field.Set>
      <Field.Legend>Units & Display</Field.Legend>
      <Field.Description>
        Configure measurement units and emission display preferences
      </Field.Description>

      <Field.Group>
        <Field.Field>
          <Field.Label>Unit System</Field.Label>
          <RadioGroup.Root
            value={$form.unitSystem}
            onValueChange={(val) => {
              if (val) $form.unitSystem = val;
            }}
          >
            <div class="flex gap-3">
              <label
                class={cn(
                  "flex items-center gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors",
                  $form.unitSystem === "metric" &&
                    "border-primary bg-primary/10",
                )}
              >
                <RadioGroup.Item value="metric" />
                <span class="text-sm font-medium">Metric</span>
              </label>

              <label
                class={cn(
                  "flex items-center gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors",
                  $form.unitSystem === "imperial" &&
                    "border-primary bg-primary/10",
                )}
              >
                <RadioGroup.Item value="imperial" />
                <span class="text-sm font-medium">Imperial</span>
              </label>

              <label
                class={cn(
                  "flex items-center gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors",
                  $form.unitSystem === "custom" &&
                    "border-primary bg-primary/10",
                )}
              >
                <RadioGroup.Item value="custom" />
                <span class="text-sm font-medium">Custom</span>
              </label>
            </div>
          </RadioGroup.Root>
        </Field.Field>

        <div class="max-w-[280px]">
          <Form.Field form={superform} name="emissionDisplayUnit">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Emission Display Unit</Form.Label>
                <Select.Root
                  type="single"
                  value={$form.emissionDisplayUnit}
                  onValueChange={(val) => {
                    if (val) $form.emissionDisplayUnit = val;
                  }}
                >
                  <Select.Trigger class="w-full" {...props}>
                    {emissionUnitLabel}
                  </Select.Trigger>
                  <Select.Content>
                    {#each EMISSION_UNIT_OPTIONS as opt}
                      <Select.Item value={opt.value}>{opt.label}</Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>
        </div>
      </Field.Group>
    </Field.Set>
  </Card.Content>
</Card.Root>
```

**Step 2: Commit**

```bash
git add src/routes/\(app\)/settings/application-settings/_components/UnitsSection.svelte
git commit -m "feat: add UnitsSection component for application settings"
```

---

## Task 7: Create ScientificAuthoritySection Component

**Files:**
- Create: `src/routes/(app)/settings/application-settings/_components/ScientificAuthoritySection.svelte`

**Step 1: Create the component**

```svelte
<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
  import type { Writable } from "svelte/store";
  import type { SuperForm } from "sveltekit-superforms";
  import type { applicationSettingsSchema } from "$lib/schemas/application-settings";
  import type { z } from "zod";

  type FormData = z.infer<typeof applicationSettingsSchema>;

  let {
    superform,
    form,
  }: {
    superform: SuperForm<FormData>;
    form: Writable<FormData>;
  } = $props();

  const AUTHORITY_OPTIONS = [
    { value: "ipcc", label: "IPCC Guidelines" },
    { value: "defra", label: "DEFRA" },
    { value: "epa", label: "EPA" },
    { value: "iea", label: "IEA" },
    { value: "egrid", label: "eGRID" },
  ];

  let scope1Label = $derived(
    AUTHORITY_OPTIONS.find((o) => o.value === $form.scope1Authority)?.label ??
      "",
  );

  let scope2Label = $derived(
    AUTHORITY_OPTIONS.find((o) => o.value === $form.scope2Authority)?.label ??
      "",
  );
</script>

<Card.Root>
  <Card.Content class="pt-6">
    <Field.Set>
      <Field.Legend>Scientific Authority</Field.Legend>
      <Field.Description>
        Select authoritative sources for emissions calculations and global
        warming potentials
      </Field.Description>

      <Field.Group>
        <Field.Field class="max-w-[400px]">
          <Field.Content>
            <Field.Label>GWP Version</Field.Label>
            <Field.Description>
              Global Warming Potential values for CH₄ and N₂O
            </Field.Description>
          </Field.Content>
          <RadioGroup.Root
            value={$form.gwpVersion}
            onValueChange={(val) => {
              if (val) $form.gwpVersion = val;
            }}
          >
            <div class="flex gap-3">
              <Field.Field orientation="horizontal">
                <RadioGroup.Item value="ar6" id="gwp-ar6" />
                <Field.Label for="gwp-ar6" class="font-normal"
                  >IPCC AR6</Field.Label
                >
              </Field.Field>
              <Field.Field orientation="horizontal">
                <RadioGroup.Item value="ar5" id="gwp-ar5" />
                <Field.Label for="gwp-ar5" class="font-normal"
                  >IPCC AR5</Field.Label
                >
              </Field.Field>
            </div>
          </RadioGroup.Root>
        </Field.Field>

        <div class="flex flex-col gap-3">
          <Field.Content>
            <span class="font-semibold">Standard Mapping</span>
            <Field.Description>
              Assigning authorities for emission scopes
            </Field.Description>
          </Field.Content>
          <div class="flex gap-4">
            <Form.Field form={superform} name="scope1Authority">
              <Form.Control>
                {#snippet children({ props })}
                  <Form.Label>Scope 1 - Direct</Form.Label>
                  <Select.Root
                    type="single"
                    value={$form.scope1Authority}
                    onValueChange={(val) => {
                      if (val) $form.scope1Authority = val;
                    }}
                  >
                    <Select.Trigger class="w-[240px]" {...props}>
                      {scope1Label}
                    </Select.Trigger>
                    <Select.Content>
                      {#each AUTHORITY_OPTIONS as opt}
                        <Select.Item value={opt.value}>{opt.label}</Select.Item>
                      {/each}
                    </Select.Content>
                  </Select.Root>
                {/snippet}
              </Form.Control>
              <Form.FieldErrors />
            </Form.Field>

            <Form.Field form={superform} name="scope2Authority">
              <Form.Control>
                {#snippet children({ props })}
                  <Form.Label>Scope 2 - Energy</Form.Label>
                  <Select.Root
                    type="single"
                    value={$form.scope2Authority}
                    onValueChange={(val) => {
                      if (val) $form.scope2Authority = val;
                    }}
                  >
                    <Select.Trigger class="w-[240px]" {...props}>
                      {scope2Label}
                    </Select.Trigger>
                    <Select.Content>
                      {#each AUTHORITY_OPTIONS as opt}
                        <Select.Item value={opt.value}>{opt.label}</Select.Item>
                      {/each}
                    </Select.Content>
                  </Select.Root>
                {/snippet}
              </Form.Control>
              <Form.FieldErrors />
            </Form.Field>
          </div>
        </div>
      </Field.Group>
    </Field.Set>
  </Card.Content>
</Card.Root>
```

**Step 2: Commit**

```bash
git add src/routes/\(app\)/settings/application-settings/_components/ScientificAuthoritySection.svelte
git commit -m "feat: add ScientificAuthoritySection component for application settings"
```

---

## Task 8: Rewrite Page Orchestrator

**Files:**
- Modify: `src/routes/(app)/settings/application-settings/+page.svelte` (full rewrite)

**Reference:** Follow the exact pattern from `src/routes/(app)/settings/company/+page.svelte`.

**Step 1: Rewrite the page**

```svelte
<script lang="ts">
  import { superForm } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import * as Form from "$lib/components/ui/form/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Alert, AlertDescription } from "$lib/components/ui/alert/index.js";
  import { applicationSettingsSchema } from "$lib/schemas/application-settings";

  import LocalizationSection from "./_components/LocalizationSection.svelte";
  import UnitsSection from "./_components/UnitsSection.svelte";
  import ScientificAuthoritySection from "./_components/ScientificAuthoritySection.svelte";

  let { data } = $props();

  const superform = superForm(data.form, {
    validators: zod4Client(applicationSettingsSchema),
    dataType: "json",
    resetForm: false,
    onError({ result }) {
      $message =
        typeof result.error === "string"
          ? result.error
          : "An unexpected error occurred. Please try again.";
    },
  });
  const { form, allErrors, enhance, message, submitting } = superform;
</script>

<svelte:head>
  <title>Application Settings | Akriva</title>
</svelte:head>

<div class="p-8 px-10">
  <h1 class="text-2xl font-semibold">Application Settings</h1>
  <p class="text-base text-muted-foreground">
    Configure calculation methodology, localization settings, and scientific
    standards for emissions tracking
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
      <LocalizationSection {superform} {form} />
      <UnitsSection {superform} {form} />
      <ScientificAuthoritySection {superform} {form} />

      <div class="flex gap-3 justify-end py-4">
        <Button
          variant="outline"
          type="button"
          href="/settings/application-settings"
        >
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

**Step 2: Commit**

```bash
git add src/routes/\(app\)/settings/application-settings/+page.svelte
git commit -m "feat: rewrite application settings page as Superforms orchestrator with section components"
```

---

## Task 9: Build Verification

**Step 1: Run the build to check for TypeScript errors**

```bash
npm run build
```

Expected: Build passes with no errors.

**Step 2: Fix any issues if build fails**

Common issues to watch for:
- Import paths (`.js` extension required for SvelteKit)
- Type mismatches between Zod schema inference and SuperForm generics
- Missing Card import in LocalizationSection (already included in the code above)

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build issues for application settings page"
```
