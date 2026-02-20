<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import * as Form from "$lib/components/ui/form";
  import * as Field from "$lib/components/ui/field";
  import * as Select from "$lib/components/ui/select";
  import { Input } from "$lib/components/ui/input";
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
            <span class="font-mono text-base font-medium text-emerald-500">
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
