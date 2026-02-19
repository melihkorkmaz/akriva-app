<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Button } from "$lib/components/ui/button/index.js";

  let gwpVersion = $state("ar6");
</script>

<svelte:head>
  <title>Methodology & Calculation | Akriva</title>
</svelte:head>

<div class="p-8 px-10">
  <h1 class="text-2xl font-semibold">Methodology & Calculation Engine</h1>
  <p class="text-base text-muted-foreground">
    Configure calculation methodology, localization settings, and scientific
    standards for emissions tracking
  </p>

  <div class="flex flex-col gap-6 mt-6">
    <!-- Localization (Numbers) Card -->
    <Card.Root>
      <Card.Content class="pt-6">
        <Field.Set>
          <Field.Legend>Localization (Numbers)</Field.Legend>
          <Field.Description>
            Configure number formatting preferences for your organization
          </Field.Description>

          <Field.Group>
            <div class="flex gap-8">
              <Field.Field class="w-[280px]">
                <Field.Label for="decimalSeparator">Decimal Separator</Field.Label>
                <Select.Root type="single" value="point">
                  <Select.Trigger id="decimalSeparator" class="w-full"
                    >Point (.)</Select.Trigger
                  >
                  <Select.Content>
                    <Select.Item value="point">Point (.)</Select.Item>
                    <Select.Item value="comma">Comma (,)</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Field.Field>

              <Field.Field class="w-[280px]">
                <Field.Label for="thousandsSeparator"
                  >Thousands Separator</Field.Label
                >
                <Select.Root type="single" value="comma">
                  <Select.Trigger id="thousandsSeparator" class="w-full"
                    >Comma (,)</Select.Trigger
                  >
                  <Select.Content>
                    <Select.Item value="comma">Comma (,)</Select.Item>
                    <Select.Item value="point">Point (.)</Select.Item>
                    <Select.Item value="space">Space ( )</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Field.Field>

              <Field.Field class="w-[200px]">
                <Field.Label for="decimalPrecision"
                  >Decimal Precision</Field.Label
                >
                <Input
                  id="decimalPrecision"
                  type="number"
                  value="2"
                  class="w-20"
                />
              </Field.Field>
            </div>
          </Field.Group>

          <!-- Format Examples -->
          <div class="flex flex-col gap-3 pt-4 border-t border-border">
            <span
              class="text-xs font-semibold text-muted-foreground tracking-wide"
              >Format Examples</span
            >
            <div class="flex flex-wrap gap-6">
              <div class="flex flex-col gap-1">
                <span class="text-xs text-muted-foreground"
                  >Carbon Emissions (tCO₂e)</span
                >
                <span class="font-mono text-base font-medium">12,345.67</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs text-muted-foreground">Energy (MWh)</span>
                <span class="font-mono text-base font-medium">987,654.32</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs text-muted-foreground">Reduction %</span>
                <span class="font-mono text-base font-medium text-emerald-500"
                  >45.89</span
                >
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs text-muted-foreground"
                  >Total Emissions</span
                >
                <span class="font-mono text-base font-medium"
                  >1,234,567,890.12</span
                >
              </div>
            </div>
          </div>
        </Field.Set>
      </Card.Content>
    </Card.Root>

    <!-- Scientific Authority Card -->
    <Card.Root>
      <Card.Content class="pt-6">
        <Field.Set>
          <Field.Legend>Scientific Authority</Field.Legend>
          <Field.Description>
            Select authoritative sources for emissions calculations and global
            warming potentials
          </Field.Description>

          <Field.Group>
            <!-- GWP Version -->
            <Field.Field class="max-w-[400px]">
              <Field.Content>
                <Field.Label>GWP Version</Field.Label>
                <Field.Description>
                  Global Warming Potential values for CH₄ and N₂O
                </Field.Description>
              </Field.Content>
              <RadioGroup.Root
                value={gwpVersion}
                onValueChange={(val) => {
                  gwpVersion = val;
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

            <!-- Standard Mapping -->
            <div class="flex flex-col gap-3">
              <Field.Content>
                <span class="font-semibold">Standard Mapping</span>
                <Field.Description>
                  Assigning authorities for emission scopes
                </Field.Description>
              </Field.Content>
              <div class="flex gap-4">
                <Field.Field class="w-[240px]">
                  <Field.Label for="scope1">Scope 1 - Direct</Field.Label>
                  <Select.Root type="single" value="ipcc">
                    <Select.Trigger id="scope1" class="w-full"
                      >IPCC Guidelines</Select.Trigger
                    >
                    <Select.Content>
                      <Select.Item value="ipcc">IPCC Guidelines</Select.Item>
                      <Select.Item value="epa">EPA</Select.Item>
                      <Select.Item value="defra">DEFRA</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Field.Field>
                <Field.Field class="w-[240px]">
                  <Field.Label for="scope2">Scope 2 - Energy</Field.Label>
                  <Select.Root type="single" value="defra-iea">
                    <Select.Trigger id="scope2" class="w-full"
                      >DEFRA / IEA</Select.Trigger
                    >
                    <Select.Content>
                      <Select.Item value="defra-iea">DEFRA / IEA</Select.Item>
                      <Select.Item value="epa">EPA eGRID</Select.Item>
                      <Select.Item value="ipcc">IPCC Guidelines</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Field.Field>
              </div>
            </div>
          </Field.Group>
        </Field.Set>
      </Card.Content>
    </Card.Root>

    <!-- Action Buttons -->
    <div class="flex gap-3 justify-end py-4">
      <Button variant="outline">Cancel</Button>
      <Button>Save Changes</Button>
    </div>
  </div>
</div>
