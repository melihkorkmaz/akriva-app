<script lang="ts">
	import { superForm, type SuperValidated, type Infer } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Select from '$lib/components/ui/select/index.js';

	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';

	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';


	import { createCampaignSchema } from '$lib/schemas/campaign.js';
	import {
		EMISSION_CATEGORY_LABELS,
		type IndicatorResponseDto,
		type OrgUnitTreeResponseDto,
		type UserResponseDto,
		type CampaignStatus,
		type EmissionCategory
	} from '$lib/api/types.js';
	import OrgUnitSelector from './OrgUnitSelector.svelte';

	type CampaignFormData = Infer<typeof createCampaignSchema>;

	let {
		formData,
		indicators,
		orgTree,
		users,
		mode,
		campaignStatus
	}: {
		formData: SuperValidated<CampaignFormData>;
		indicators: IndicatorResponseDto[];
		orgTree: OrgUnitTreeResponseDto[];
		users: UserResponseDto[];
		mode: 'create' | 'edit';
		campaignStatus?: CampaignStatus;
	} = $props();

	const superform = superForm(formData, {
		validators: zod4Client(createCampaignSchema),
		dataType: 'json'
	});
	const { form, enhance, message, submitting } = superform;

	// Whether fields should be disabled (edit mode + non-draft)
	let fieldsDisabled = $derived(mode === 'edit' && campaignStatus !== 'draft');

	// Build indicator lookup for label display
	let indicatorMap = $derived(
		new Map<string, IndicatorResponseDto>(indicators.map((ind) => [ind.id, ind]))
	);

	let selectedIndicator = $derived(indicatorMap.get($form.indicatorId));

	// Indicator select label
	let indicatorLabel = $derived(
		selectedIndicator ? selectedIndicator.name : 'Select an indicator'
	);


</script>

<Card.Root class="max-w-3xl">
	<Card.Content class="pt-6">
		{#if $message}
			<Alert variant="destructive" class="mb-4">
				<AlertDescription>{$message}</AlertDescription>
			</Alert>
		{/if}

		<form method="POST" use:enhance class="flex flex-col gap-0">
			<!-- Section 1: Campaign Details -->
			<Field.Set>
				<Field.Legend>Campaign Details</Field.Legend>
				<Field.Description>
					Basic information about the data collection campaign
				</Field.Description>
				<Field.Group>
					<div class="flex flex-col gap-5">
						<!-- Name -->
						<Form.Field form={superform} name="name">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Campaign Name</Form.Label>
									<Input
										{...props}
										placeholder="e.g. Q1 2026 Stationary Combustion"
										bind:value={$form.name}
										disabled={fieldsDisabled}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<!-- Indicator -->
						<Form.Field form={superform} name="indicatorId">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Emission Indicator</Form.Label>
									<input type="hidden" name={props.name} value={$form.indicatorId} />
									<Select.Root
										type="single"
										value={$form.indicatorId}
										onValueChange={(val) => {
											$form.indicatorId = val ?? '';
										}}
										disabled={fieldsDisabled}
									>
										<Select.Trigger class="w-full">
											{indicatorLabel}
										</Select.Trigger>
										<Select.Content>
											{#each indicators as indicator}
												<Select.Item value={indicator.id}>
													<div class="flex items-center gap-2">
														<span>{indicator.name}</span>
														<Badge variant="outline" class="text-xs">
															{EMISSION_CATEGORY_LABELS[indicator.emissionCategory as EmissionCategory] ?? indicator.emissionCategory}
														</Badge>
													</div>
												</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<!-- Reporting Year + Period Dates -->
						<div class="grid grid-cols-3 gap-4">
							<Form.Field form={superform} name="reportingYear">
								<Form.Control>
									{#snippet children({ props })}
										<Form.Label>Reporting Year</Form.Label>
										<Input
											{...props}
											type="number"
											min={2000}
											max={2100}
											bind:value={$form.reportingYear}
											disabled={fieldsDisabled}
										/>
									{/snippet}
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>

							<Form.Field form={superform} name="periodStart">
								<Form.Control>
									{#snippet children({ props })}
										<Form.Label>Period Start</Form.Label>
										<Input
											{...props}
											type="date"
											bind:value={$form.periodStart}
											disabled={fieldsDisabled}
										/>
									{/snippet}
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>

							<Form.Field form={superform} name="periodEnd">
								<Form.Control>
									{#snippet children({ props })}
										<Form.Label>Period End</Form.Label>
										<Input
											{...props}
											type="date"
											bind:value={$form.periodEnd}
											disabled={fieldsDisabled}
										/>
									{/snippet}
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
						</div>
					</div>
				</Field.Group>
			</Field.Set>

			<Field.Separator />

			<!-- Section 2: Organizational Units -->
			<Field.Set>
				<Field.Legend>Organizational Units</Field.Legend>
				<Field.Description>
					Select which org units are included in this campaign
				</Field.Description>
				<Field.Group>
					<Form.Field form={superform} name="orgUnitIds">
						<Form.Control>
							{#snippet children({ props })}
								<OrgUnitSelector
									tree={orgTree}
									bind:selectedIds={$form.orgUnitIds}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</Field.Group>
			</Field.Set>

			<Field.Separator />

			<!-- Section 3: Approver Overrides (placeholder) -->
			<Field.Set>
				<Field.Legend>Approver Overrides</Field.Legend>
				<Field.Description>
					Optionally override the default approvers for specific org units
				</Field.Description>
				<Field.Group>
					<p class="text-sm text-muted-foreground italic">
						Approver overrides can be configured after campaign creation.
					</p>
				</Field.Group>
			</Field.Set>

			<!-- Footer -->
			<div class="flex justify-end gap-3 pt-6">
				<Button variant="outline" href="/campaigns">
					Cancel
				</Button>
				<Form.Button disabled={$submitting || fieldsDisabled}>
					{#if $submitting}
						{mode === 'create' ? 'Creating...' : 'Saving...'}
					{:else}
						{mode === 'create' ? 'Save Draft' : 'Save Changes'}
					{/if}
				</Form.Button>
			</div>
		</form>
	</Card.Content>
</Card.Root>
