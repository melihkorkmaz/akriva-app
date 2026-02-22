<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import Calculator from '@lucide/svelte/icons/calculator';
	import type { CalculationTraceResponseDto } from '$lib/api/types.js';

	interface Props {
		trace: CalculationTraceResponseDto | null;
		co2eTonnes: number | null;
	}

	let { trace, co2eTonnes }: Props = $props();

	function formatNumber(value: number | null, decimals: number = 2): string {
		if (value === null || value === undefined) return '—';
		return value.toLocaleString('en-US', {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals
		});
	}

	function formatKgToDisplay(kg: number | null): string {
		if (kg === null || kg === undefined) return '—';
		if (Math.abs(kg) >= 1000) {
			return `${(kg / 1000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} t`;
		}
		return `${kg.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="flex items-center gap-2">
			<Calculator class="size-5" />
			Calculation Preview
		</Card.Title>
		<Card.Description>
			Emission calculation results based on your activity data.
		</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if trace}
			<div class="flex flex-col gap-6">
				<!-- Total CO2e highlight -->
				<div class="rounded-lg bg-primary/5 border border-primary/20 p-6 text-center">
					<p class="text-sm font-medium text-muted-foreground">Total CO2 Equivalent</p>
					<p class="text-4xl font-bold text-primary mt-1">
						{formatNumber(trace.totalCo2eTonnes, 4)}
					</p>
					<p class="text-sm text-muted-foreground mt-1">tonnes CO2e</p>
				</div>

				<!-- Gas breakdown -->
				<div>
					<h4 class="text-sm font-semibold mb-3">Gas Breakdown</h4>
					<div class="grid grid-cols-1 gap-3 md:grid-cols-3">
						<div class="rounded-md border p-3">
							<p class="text-xs font-medium text-muted-foreground">CO2</p>
							<p class="text-lg font-semibold mt-1">{formatKgToDisplay(trace.co2Kg)}</p>
							<p class="text-xs text-muted-foreground">
								CO2e: {formatKgToDisplay(trace.co2Co2eKg)}
							</p>
						</div>
						<div class="rounded-md border p-3">
							<p class="text-xs font-medium text-muted-foreground">CH4</p>
							<p class="text-lg font-semibold mt-1">{formatKgToDisplay(trace.ch4Kg)}</p>
							<p class="text-xs text-muted-foreground">
								CO2e: {formatKgToDisplay(trace.ch4Co2eKg)}
							</p>
						</div>
						<div class="rounded-md border p-3">
							<p class="text-xs font-medium text-muted-foreground">N2O</p>
							<p class="text-lg font-semibold mt-1">{formatKgToDisplay(trace.n2oKg)}</p>
							<p class="text-xs text-muted-foreground">
								CO2e: {formatKgToDisplay(trace.n2oCo2eKg)}
							</p>
						</div>
					</div>
				</div>

				<!-- Metadata -->
				<div>
					<h4 class="text-sm font-semibold mb-3">Calculation Details</h4>
					<div class="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
						{#if trace.formulaText}
							<div class="col-span-full">
								<span class="text-muted-foreground">Formula:</span>
								<span class="ml-2 font-mono text-xs">{trace.formulaText}</span>
							</div>
						{/if}
						<div>
							<span class="text-muted-foreground">Method:</span>
							<span class="ml-2">{trace.calculationMethod}</span>
						</div>
						<div>
							<span class="text-muted-foreground">Authority:</span>
							<span class="ml-2">{trace.authority}</span>
						</div>
						{#if trace.factorLibraryVersion}
							<div>
								<span class="text-muted-foreground">Factor Library:</span>
								<span class="ml-2">{trace.factorLibraryVersion}</span>
							</div>
						{/if}
						{#if trace.factorResolutionTier}
							<div>
								<span class="text-muted-foreground">Resolution Tier:</span>
								<span class="ml-2 capitalize">{trace.factorResolutionTier}</span>
							</div>
						{/if}
						{#if trace.gwpBasis}
							<div>
								<span class="text-muted-foreground">GWP Basis:</span>
								<span class="ml-2">{trace.gwpBasis}</span>
								{#if trace.gwpCh4 !== null}
									<span class="text-xs text-muted-foreground ml-1"
										>(CH4: {trace.gwpCh4}, N2O: {trace.gwpN2o})</span
									>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</div>
		{:else}
			<!-- No trace available -->
			<div class="flex flex-col items-center justify-center py-8 text-center">
				<Calculator class="size-8 text-muted-foreground" />
				<p class="mt-3 text-sm text-muted-foreground">
					{#if co2eTonnes !== null}
						Calculation complete. Total: {formatNumber(co2eTonnes, 4)} tonnes CO2e.
					{:else}
						Save your data to see calculation results.
					{/if}
				</p>
			</div>
		{/if}
	</Card.Content>
</Card.Root>
