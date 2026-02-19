<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
  import { Alert, AlertDescription } from "$lib/components/ui/alert/index.js";
  import Info from "@lucide/svelte/icons/info";
  import { cn } from "$lib/utils.js";
  import type { Writable } from "svelte/store";
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
    form: Writable<FormData>;
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
