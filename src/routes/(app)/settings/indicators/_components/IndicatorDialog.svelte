<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import type {
		IndicatorResponseDto,
		EmissionCategory,
		CalculationMethod
	} from '$lib/api/types.js';
	import {
		EMISSION_CATEGORY_LABELS,
		CALCULATION_METHOD_LABELS,
		CATEGORY_METHOD_MAP
	} from '$lib/api/types.js';

	let {
		open = $bindable(false),
		mode,
		indicator
	}: {
		open: boolean;
		mode: 'create' | 'edit';
		indicator: IndicatorResponseDto | null;
	} = $props();

	let submitting = $state(false);
	let errorMessage = $state('');

	// Form fields
	let name = $state('');
	let emissionCategory = $state<EmissionCategory | ''>('');
	let calculationMethod = $state<CalculationMethod | ''>('');
	let defaultFuelType = $state('');
	let defaultGasType = $state('');
	let isActive = $state(true);

	// Derived: available methods based on selected category
	let availableMethods = $derived(
		emissionCategory ? (CATEGORY_METHOD_MAP[emissionCategory as EmissionCategory] ?? []) : []
	);

	// Derived: display labels for selects
	let categoryLabel = $derived(
		emissionCategory
			? EMISSION_CATEGORY_LABELS[emissionCategory as EmissionCategory]
			: 'Select category'
	);

	let methodLabel = $derived(
		calculationMethod
			? CALCULATION_METHOD_LABELS[calculationMethod as CalculationMethod]
			: 'Select method'
	);

	// Reset state when dialog opens
	$effect(() => {
		if (open) {
			errorMessage = '';
			if (mode === 'edit' && indicator) {
				name = indicator.name;
				emissionCategory = indicator.emissionCategory;
				calculationMethod = indicator.calculationMethod;
				defaultFuelType = indicator.defaultFuelType ?? '';
				defaultGasType = indicator.defaultGasType ?? '';
				isActive = indicator.isActive;
			} else {
				name = '';
				emissionCategory = '';
				calculationMethod = '';
				defaultFuelType = '';
				defaultGasType = '';
				isActive = true;
			}
		}
	});

	function handleCategoryChange(value: string | undefined) {
		if (!value) return;
		emissionCategory = value as EmissionCategory;
		// Reset calculation method when category changes (only in create mode)
		if (mode === 'create') {
			calculationMethod = '';
		}
	}

	async function handleSubmit() {
		if (!name) return;

		submitting = true;
		errorMessage = '';

		const formData = new FormData();

		if (mode === 'create') {
			if (!emissionCategory || !calculationMethod) return;

			formData.set('name', name);
			formData.set('emissionCategory', emissionCategory);
			formData.set('calculationMethod', calculationMethod);
			if (defaultFuelType) formData.set('defaultFuelType', defaultFuelType);
			if (defaultGasType) formData.set('defaultGasType', defaultGasType);
		} else if (mode === 'edit' && indicator) {
			formData.set('id', indicator.id);
			formData.set('name', name);
			if (defaultFuelType) formData.set('defaultFuelType', defaultFuelType);
			if (defaultGasType) formData.set('defaultGasType', defaultGasType);
			formData.set('isActive', String(isActive));
		}

		const action = mode === 'create' ? '?/create' : '?/update';
		const response = await fetch(action, {
			method: 'POST',
			body: formData
		});

		const result = await response.json();
		submitting = false;

		// SvelteKit form action responses are wrapped in a data array
		const data = result?.data?.[0] ?? result;

		if (data?.status && data.status >= 400) {
			errorMessage = data.message || `Failed to ${mode} indicator.`;
			return;
		}

		open = false;
		toast.success(
			mode === 'create' ? 'Indicator created successfully.' : 'Indicator updated successfully.'
		);
		await invalidateAll();
	}

	let isCreateDisabled = $derived(
		submitting || !name || !emissionCategory || !calculationMethod
	);

	let isEditDisabled = $derived(submitting || !name);
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

		{#if errorMessage}
			<Alert variant="destructive">
				<TriangleAlert class="size-4" />
				<AlertDescription>{errorMessage}</AlertDescription>
			</Alert>
		{/if}

		<div class="flex flex-col gap-4 py-4">
			<!-- Name -->
			<div class="flex flex-col gap-2">
				<Label for="indicator-name">Name</Label>
				<Input
					id="indicator-name"
					placeholder="e.g. Natural Gas Boiler"
					bind:value={name}
				/>
			</div>

			<!-- Emission Category -->
			<div class="flex flex-col gap-2">
				<Label>Emission Category</Label>
				{#if mode === 'edit'}
					<Input
						value={emissionCategory ? EMISSION_CATEGORY_LABELS[emissionCategory as EmissionCategory] : ''}
						disabled
					/>
				{:else}
					<Select.Root
						type="single"
						value={emissionCategory}
						onValueChange={handleCategoryChange}
					>
						<Select.Trigger class="w-full">
							{categoryLabel}
						</Select.Trigger>
						<Select.Content>
							{#each Object.entries(EMISSION_CATEGORY_LABELS) as [value, label]}
								<Select.Item {value}>{label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				{/if}
			</div>

			<!-- Calculation Method -->
			<div class="flex flex-col gap-2">
				<Label>Calculation Method</Label>
				{#if mode === 'edit'}
					<Input
						value={calculationMethod ? CALCULATION_METHOD_LABELS[calculationMethod as CalculationMethod] : ''}
						disabled
					/>
				{:else}
					<Select.Root
						type="single"
						value={calculationMethod}
						onValueChange={(val) => {
							if (val) calculationMethod = val as CalculationMethod;
						}}
						disabled={!emissionCategory}
					>
						<Select.Trigger class="w-full">
							{methodLabel}
						</Select.Trigger>
						<Select.Content>
							{#each availableMethods as method}
								<Select.Item value={method}>
									{CALCULATION_METHOD_LABELS[method]}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				{/if}
			</div>

			<!-- Default Fuel Type -->
			<div class="flex flex-col gap-2">
				<Label for="indicator-fuel-type">Default Fuel Type</Label>
				<Input
					id="indicator-fuel-type"
					placeholder="e.g. Natural Gas"
					bind:value={defaultFuelType}
				/>
			</div>

			<!-- Default Gas Type -->
			<div class="flex flex-col gap-2">
				<Label for="indicator-gas-type">Default Gas Type</Label>
				<Input
					id="indicator-gas-type"
					placeholder="e.g. CO2"
					bind:value={defaultGasType}
				/>
			</div>

			<!-- Status (edit mode only) -->
			{#if mode === 'edit'}
				<div class="flex items-center justify-between">
					<div class="flex flex-col gap-0.5">
						<Label for="indicator-active">Active</Label>
						<p class="text-xs text-muted-foreground">
							Inactive indicators cannot be used in new campaigns
						</p>
					</div>
					<Switch
						id="indicator-active"
						checked={isActive}
						onCheckedChange={(checked) => {
							isActive = !!checked;
						}}
					/>
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (open = false)} disabled={submitting}>
				Cancel
			</Button>
			<Button
				onclick={handleSubmit}
				disabled={mode === 'create' ? isCreateDisabled : isEditDisabled}
			>
				{#if submitting}
					{mode === 'create' ? 'Creating...' : 'Saving...'}
				{:else}
					{mode === 'create' ? 'Create Indicator' : 'Save Changes'}
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
