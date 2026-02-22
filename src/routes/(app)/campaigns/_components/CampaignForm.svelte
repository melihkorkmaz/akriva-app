<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { cn } from '$lib/utils.js';
	import { createCampaignSchema } from '$lib/schemas/campaign.js';
	import {
		EMISSION_CATEGORY_LABELS,
		type IndicatorResponseDto,
		type WorkflowTemplateResponseDto,
		type OrgUnitTreeResponseDto,
		type UserResponseDto,
		type CampaignStatus,
		type EmissionCategory
	} from '$lib/api/types.js';
	import OrgUnitSelector from './OrgUnitSelector.svelte';

	let {
		formData,
		indicators,
		workflowTemplates,
		orgTree,
		users,
		mode,
		campaignStatus
	}: {
		formData: any;
		indicators: IndicatorResponseDto[];
		workflowTemplates: WorkflowTemplateResponseDto[];
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

	let selectedTiers = $derived($form.approvalTiers || 1);

	// Build indicator lookup for label display
	let indicatorMap = $derived(
		new Map<string, IndicatorResponseDto>(indicators.map((ind) => [ind.id, ind]))
	);

	let selectedIndicator = $derived(indicatorMap.get($form.indicatorId));

	// Template lookup
	let templateMap = $derived(
		new Map<string, WorkflowTemplateResponseDto>(
			workflowTemplates.map((t) => [t.id, t])
		)
	);

	let selectedTemplate = $derived(templateMap.get($form.workflowTemplateId));

	// Indicator select label
	let indicatorLabel = $derived(
		selectedIndicator ? selectedIndicator.name : 'Select an indicator'
	);

	// Template select label
	let templateLabel = $derived(
		selectedTemplate ? selectedTemplate.name : 'Select a workflow template'
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

			<!-- Section 2: Workflow & Approval -->
			<Field.Set>
				<Field.Legend>Workflow & Approval</Field.Legend>
				<Field.Description>
					Select the workflow template and number of approval tiers
				</Field.Description>
				<Field.Group>
					<div class="flex flex-col gap-5">
						<!-- Workflow Template -->
						<Form.Field form={superform} name="workflowTemplateId">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Workflow Template</Form.Label>
									<input type="hidden" name={props.name} value={$form.workflowTemplateId} />
									<Select.Root
										type="single"
										value={$form.workflowTemplateId}
										onValueChange={(val) => {
											$form.workflowTemplateId = val ?? '';
										}}
										disabled={fieldsDisabled}
									>
										<Select.Trigger class="w-full">
											{templateLabel}
										</Select.Trigger>
										<Select.Content>
											{#each workflowTemplates as template}
												<Select.Item value={template.id}>
													{template.name}
												</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								{/snippet}
							</Form.Control>
							{#if workflowTemplates.length === 0}
								<Form.Description>
									No active workflow templates available. Create and activate one in Settings first.
								</Form.Description>
							{/if}
							<Form.FieldErrors />
						</Form.Field>

						<!-- Approval Tiers -->
						<Form.Field form={superform} name="approvalTiers">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Approval Tiers</Form.Label>
									<input type="hidden" name={props.name} value={$form.approvalTiers} />
									<RadioGroup.Root
										value={String($form.approvalTiers)}
										onValueChange={(val) => {
											$form.approvalTiers = Number(val);
										}}
										disabled={fieldsDisabled}
									>
										<div class="flex flex-col gap-3">
											<label
												class={cn(
													'flex items-start gap-3 rounded-md border p-4 cursor-pointer transition-colors',
													selectedTiers === 1 && 'border-primary bg-primary/10'
												)}
											>
												<RadioGroup.Item value="1" />
												<div class="flex flex-col gap-1">
													<span class="text-sm font-semibold">1 Tier</span>
													<span class="text-xs text-muted-foreground">
														Single approval step after data submission
													</span>
												</div>
											</label>

											<label
												class={cn(
													'flex items-start gap-3 rounded-md border p-4 cursor-pointer transition-colors',
													selectedTiers === 2 && 'border-primary bg-primary/10'
												)}
											>
												<RadioGroup.Item value="2" />
												<div class="flex flex-col gap-1">
													<span class="text-sm font-semibold">2 Tiers</span>
													<span class="text-xs text-muted-foreground">
														Review step followed by a final approval
													</span>
												</div>
											</label>

											<label
												class={cn(
													'flex items-start gap-3 rounded-md border p-4 cursor-pointer transition-colors',
													selectedTiers === 3 && 'border-primary bg-primary/10'
												)}
											>
												<RadioGroup.Item value="3" />
												<div class="flex flex-col gap-1">
													<span class="text-sm font-semibold">3 Tiers</span>
													<span class="text-xs text-muted-foreground">
														Two review steps followed by final admin approval
													</span>
												</div>
											</label>
										</div>
									</RadioGroup.Root>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</div>
				</Field.Group>
			</Field.Set>

			<Field.Separator />

			<!-- Section 3: Organizational Units -->
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

			<!-- Section 4: Approver Overrides (placeholder) -->
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
