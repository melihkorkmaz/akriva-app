<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import type {
		EmissionCategory,
		CalculationMethod,
		EmissionSourceResponseDto
	} from '$lib/api/types.js';
	import type { SuperForm } from 'sveltekit-superforms';

	interface Props {
		superform: SuperForm<any>;
		form: any;
		category: EmissionCategory;
		calculationMethod: CalculationMethod;
		sources: EmissionSourceResponseDto[];
		readonly?: boolean;
	}

	let { superform, form, category, calculationMethod, sources, readonly = false }: Props =
		$props();

	let isMobileFuel = $derived(calculationMethod === 'ipcc_mobile_fuel');
	let isMobileDistance = $derived(calculationMethod === 'ipcc_mobile_distance');
	let isProcessProduction = $derived(calculationMethod === 'process_production');
	let isProcessAbatement = $derived(calculationMethod === 'process_gas_abatement');

	let selectedSourceName = $derived(
		$form.sourceId
			? (sources.find((s) => s.id === $form.sourceId)?.name ?? 'Select source')
			: 'Select source (optional)'
	);

	const ACTIVITY_UNITS = [
		{ value: 'm3', label: 'm\u00B3' },
		{ value: 'litres', label: 'Litres' },
		{ value: 'kg', label: 'kg' },
		{ value: 'tonnes', label: 'Tonnes' },
		{ value: 'kWh', label: 'kWh' },
		{ value: 'MWh', label: 'MWh' },
		{ value: 'GJ', label: 'GJ' }
	];

	let selectedUnitLabel = $derived(
		ACTIVITY_UNITS.find((u) => u.value === $form.activityUnit)?.label ?? 'Select unit'
	);

	let selectedDistanceUnitLabel = $derived(
		$form.distanceUnit === 'km'
			? 'Kilometers'
			: $form.distanceUnit === 'miles'
				? 'Miles'
				: 'Select unit'
	);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Activity Data</Card.Title>
		<Card.Description>
			Enter the emission activity data for this reporting period.
		</Card.Description>
	</Card.Header>
	<Card.Content class="flex flex-col gap-5">
		{#if category === 'stationary'}
			<!-- Stationary: fuelType, activityAmount, activityUnit -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Form.Field form={superform} name="fuelType">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Fuel Type</Form.Label>
							<Input
								{...props}
								bind:value={$form.fuelType}
								disabled={readonly}
								placeholder="e.g. Natural Gas"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={superform} name="activityAmount">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Amount</Form.Label>
							<Input
								{...props}
								type="number"
								step="any"
								bind:value={$form.activityAmount}
								disabled={readonly}
								placeholder="0.00"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={superform} name="activityUnit">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Unit</Form.Label>
							<Select.Root
								type="single"
								value={$form.activityUnit ?? undefined}
								onValueChange={(v) => {
									$form.activityUnit = v ?? null;
								}}
								disabled={readonly}
							>
								<Select.Trigger {...props}>
									{selectedUnitLabel}
								</Select.Trigger>
								<Select.Content>
									{#each ACTIVITY_UNITS as unit}
										<Select.Item value={unit.value}>{unit.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>
		{:else if category === 'mobile' && isMobileFuel}
			<!-- Mobile (fuel): fuelType, activityAmount -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Form.Field form={superform} name="fuelType">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Fuel Type</Form.Label>
							<Input
								{...props}
								bind:value={$form.fuelType}
								disabled={readonly}
								placeholder="e.g. Diesel"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={superform} name="activityAmount">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Amount (kg)</Form.Label>
							<Input
								{...props}
								type="number"
								step="any"
								bind:value={$form.activityAmount}
								disabled={readonly}
								placeholder="0.00"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>
		{:else if category === 'mobile' && isMobileDistance}
			<!-- Mobile (distance): distance, distanceUnit, vehicleType -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Form.Field form={superform} name="distance">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Distance</Form.Label>
							<Input
								{...props}
								type="number"
								step="any"
								bind:value={$form.distance}
								disabled={readonly}
								placeholder="0.00"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={superform} name="distanceUnit">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Unit</Form.Label>
							<Select.Root
								type="single"
								value={$form.distanceUnit ?? undefined}
								onValueChange={(v) => {
									$form.distanceUnit = v ?? null;
								}}
								disabled={readonly}
							>
								<Select.Trigger {...props}>
									{selectedDistanceUnitLabel}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="km">Kilometers</Select.Item>
									<Select.Item value="miles">Miles</Select.Item>
								</Select.Content>
							</Select.Root>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={superform} name="vehicleType">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Vehicle Type</Form.Label>
							<Input
								{...props}
								bind:value={$form.vehicleType}
								disabled={readonly}
								placeholder="e.g. Passenger Car"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>
		{:else if category === 'fugitive'}
			<!-- Fugitive: gasType, refrigerant fields -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Form.Field form={superform} name="gasType">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Gas Type</Form.Label>
							<Input
								{...props}
								bind:value={$form.gasType}
								disabled={readonly}
								placeholder="e.g. R-410A"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Form.Field form={superform} name="refrigerantInventoryStart">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Inventory Start (kg)</Form.Label>
							<Input
								{...props}
								type="number"
								step="any"
								bind:value={$form.refrigerantInventoryStart}
								disabled={readonly}
								placeholder="0.00"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={superform} name="refrigerantInventoryEnd">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Inventory End (kg)</Form.Label>
							<Input
								{...props}
								type="number"
								step="any"
								bind:value={$form.refrigerantInventoryEnd}
								disabled={readonly}
								placeholder="0.00"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Form.Field form={superform} name="refrigerantPurchased">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Purchased (kg)</Form.Label>
							<Input
								{...props}
								type="number"
								step="any"
								bind:value={$form.refrigerantPurchased}
								disabled={readonly}
								placeholder="0.00"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={superform} name="refrigerantRecovered">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Recovered (kg)</Form.Label>
							<Input
								{...props}
								type="number"
								step="any"
								bind:value={$form.refrigerantRecovered}
								disabled={readonly}
								placeholder="0.00"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>
		{:else if category === 'process' && isProcessProduction}
			<!-- Process (production): productionVolume, productionUnit -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Form.Field form={superform} name="productionVolume">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Production Volume</Form.Label>
							<Input
								{...props}
								type="number"
								step="any"
								bind:value={$form.productionVolume}
								disabled={readonly}
								placeholder="0.00"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={superform} name="productionUnit">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Production Unit</Form.Label>
							<Input
								{...props}
								bind:value={$form.productionUnit}
								disabled={readonly}
								placeholder="e.g. tonnes"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>
		{:else if category === 'process' && isProcessAbatement}
			<!-- Process (abatement): activityAmount, abatementEfficiency -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Form.Field form={superform} name="activityAmount">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Activity Amount</Form.Label>
							<Input
								{...props}
								type="number"
								step="any"
								bind:value={$form.activityAmount}
								disabled={readonly}
								placeholder="0.00"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={superform} name="abatementEfficiency">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Abatement Efficiency (0-1)</Form.Label>
							<Input
								{...props}
								type="number"
								step="0.01"
								min="0"
								max="1"
								bind:value={$form.abatementEfficiency}
								disabled={readonly}
								placeholder="0.00"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>
		{/if}

		<!-- Shared fields: Emission Source and Notes -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<Form.Field form={superform} name="sourceId">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Emission Source</Form.Label>
						<Select.Root
							type="single"
							value={$form.sourceId ?? undefined}
							onValueChange={(v) => {
								$form.sourceId = v ?? null;
							}}
							disabled={readonly || sources.length === 0}
						>
							<Select.Trigger {...props}>
								{selectedSourceName}
							</Select.Trigger>
							<Select.Content>
								{#each sources as source}
									<Select.Item value={source.id}>{source.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<Form.Field form={superform} name="notes">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Notes</Form.Label>
					<Textarea
						{...props}
						bind:value={$form.notes}
						disabled={readonly}
						placeholder="Additional notes or context..."
						rows={3}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</Card.Content>
</Card.Root>
