<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import type { IndicatorResponseDto, EmissionCategory, MethodVariant } from '$lib/api/types.js';
	import { EMISSION_CATEGORY_LABELS, CATEGORY_VARIANT_MAP, METHOD_VARIANT_LABELS } from '$lib/api/types.js';
	import { createIndicatorSchema, updateIndicatorSchema } from '$lib/schemas/indicator.js';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';

	let {
		open = $bindable(false),
		mode,
		indicator,
		createFormData,
		updateFormData
	}: {
		open: boolean;
		mode: 'create' | 'edit';
		indicator: IndicatorResponseDto | null;
		createFormData: SuperValidated<Infer<typeof createIndicatorSchema>>;
		updateFormData: SuperValidated<Infer<typeof updateIndicatorSchema>>;
	} = $props();

	// Create form
	const createSF = superForm(createFormData, {
		validators: zod4Client(createIndicatorSchema),
		dataType: 'json',
		resetForm: false,
		onUpdated({ form }) {
			if (form.valid && form.message) {
				open = false;
				toast.success(form.message);
			} else if (form.message) {
				toast.error(form.message);
			}
		}
	});
	const { form: createForm, enhance: createEnhance, submitting: createSubmitting } = createSF;

	// Update form
	const updateSF = superForm(updateFormData, {
		validators: zod4Client(updateIndicatorSchema),
		resetForm: false,
		onUpdated({ form }) {
			if (form.valid && form.message) {
				open = false;
				toast.success(form.message);
			} else if (form.message) {
				toast.error(form.message);
			}
		}
	});
	const { form: updateForm, enhance: updateEnhance, submitting: updateSubmitting } = updateSF;

	// Derived: display label for category select
	let categoryLabel = $derived(
		$createForm.emissionCategory
			? EMISSION_CATEGORY_LABELS[$createForm.emissionCategory as EmissionCategory]
			: ''
	);

	// Derived: available variants for selected category
	let availableVariants = $derived(
		CATEGORY_VARIANT_MAP[$createForm.emissionCategory as EmissionCategory] ?? null
	);

	// Clear methodVariant when category changes
	function handleCategoryChange(val: string | undefined) {
		if (!val) return;
		$createForm.emissionCategory = val as EmissionCategory;
		const variants = CATEGORY_VARIANT_MAP[val as EmissionCategory];
		if (!variants || !variants.includes($createForm.methodVariant as MethodVariant)) {
			$createForm.methodVariant = null;
		}
	}

	// Reset/populate forms when dialog opens
	$effect(() => {
		if (open) {
			if (mode === 'create') {
				createSF.reset();
			} else if (mode === 'edit' && indicator) {
				$updateForm.name = indicator.name;
				$updateForm.isActive = indicator.isActive;
			}
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>
				{mode === 'create' ? 'New Indicator' : 'Edit Indicator'}
			</Dialog.Title>
			<Dialog.Description>
				{mode === 'create'
					? 'Create a new emission indicator for your organization.'
					: 'Update indicator details.'}
			</Dialog.Description>
		</Dialog.Header>

		{#if mode === 'create'}
			<form method="POST" action="?/create" use:createEnhance>
				<div class="flex flex-col gap-4 py-4">
					<Form.Field form={createSF} name="name">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Name</Form.Label>
								<Input
									{...props}
									placeholder="e.g. Natural Gas Boiler"
									bind:value={$createForm.name}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field form={createSF} name="emissionCategory">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Emission Category</Form.Label>
								<Select.Root
									type="single"
									value={$createForm.emissionCategory}
									onValueChange={handleCategoryChange}
								>
									<Select.Trigger class="w-full" {...props}>
										{#if categoryLabel}
											{categoryLabel}
										{:else}
											<span class="text-muted-foreground">Select category</span>
										{/if}
									</Select.Trigger>
									<Select.Content>
										{#each Object.entries(EMISSION_CATEGORY_LABELS) as [value, label]}
											<Select.Item {value}>{label}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					{#if availableVariants}
						<Form.Field form={createSF} name="methodVariant">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Method Variant</Form.Label>
									<Select.Root
										type="single"
										value={$createForm.methodVariant ?? undefined}
										onValueChange={(val) => {
											$createForm.methodVariant = (val as MethodVariant) ?? null;
										}}
									>
										<Select.Trigger class="w-full" {...props}>
											{#if $createForm.methodVariant}
												{METHOD_VARIANT_LABELS[$createForm.methodVariant as MethodVariant]}
											{:else}
												<span class="text-muted-foreground">Select method variant</span>
											{/if}
										</Select.Trigger>
										<Select.Content>
											{#each availableVariants as variant}
												<Select.Item value={variant}>
													{METHOD_VARIANT_LABELS[variant]}
												</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					{/if}
				</div>

				<Dialog.Footer>
					<Button variant="outline" type="button" onclick={() => (open = false)} disabled={$createSubmitting}>
						Cancel
					</Button>
					<Form.Button disabled={$createSubmitting}>
						{$createSubmitting ? 'Creating...' : 'Create Indicator'}
					</Form.Button>
				</Dialog.Footer>
			</form>
		{:else}
			<form method="POST" action="?/update" use:updateEnhance>
				<input type="hidden" name="id" value={indicator?.id ?? ''} />

				<div class="flex flex-col gap-4 py-4">
					<Form.Field form={updateSF} name="name">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Name</Form.Label>
								<Input
									{...props}
									placeholder="e.g. Natural Gas Boiler"
									bind:value={$updateForm.name}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<!-- Category (read-only display) -->
					{#if indicator}
						<div class="flex flex-col gap-2">
							<Label>Emission Category</Label>
							<Input
								value={EMISSION_CATEGORY_LABELS[indicator.emissionCategory] ?? indicator.emissionCategory}
								disabled
							/>
						</div>
					{/if}

					<!-- Method variant (read-only display) -->
					{#if indicator?.methodVariant}
						<div class="flex flex-col gap-2">
							<Label>Method Variant</Label>
							<Input
								value={METHOD_VARIANT_LABELS[indicator.methodVariant as MethodVariant] ?? indicator.methodVariant}
								disabled
							/>
						</div>
					{/if}

					<Form.Field form={updateSF} name="isActive">
						<Form.Control>
							{#snippet children({ props })}
								<div class="flex items-center justify-between">
									<div class="flex flex-col gap-0.5">
										<Form.Label>Active</Form.Label>
										<p class="text-xs text-muted-foreground">
											Inactive indicators cannot be used in new campaigns
										</p>
									</div>
									<Switch
										{...props}
										checked={$updateForm.isActive ?? true}
										onCheckedChange={(checked) => {
											$updateForm.isActive = !!checked;
										}}
									/>
								</div>
							{/snippet}
						</Form.Control>
					</Form.Field>
				</div>

				<Dialog.Footer>
					<Button variant="outline" type="button" onclick={() => (open = false)} disabled={$updateSubmitting}>
						Cancel
					</Button>
					<Form.Button disabled={$updateSubmitting}>
						{$updateSubmitting ? 'Saving...' : 'Save Changes'}
					</Form.Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
