<script lang="ts">
	import Check from '@lucide/svelte/icons/check';

	interface Props {
		currentStep: number;
		steps: string[];
	}

	let { currentStep, steps }: Props = $props();
</script>

<nav class="flex items-center justify-center gap-2">
	{#each steps as label, i}
		{@const stepNum = i + 1}
		{@const isCompleted = stepNum < currentStep}
		{@const isActive = stepNum === currentStep}
		{@const isFuture = stepNum > currentStep}

		{#if i > 0}
			<div
				class="h-px w-12 {isCompleted || isActive ? 'bg-primary' : 'bg-border'}"
			></div>
		{/if}

		<div class="flex items-center gap-2">
			<div
				class="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors
					{isCompleted
					? 'bg-primary text-primary-foreground'
					: isActive
						? 'bg-primary text-primary-foreground'
						: 'border border-border bg-background text-muted-foreground'}"
			>
				{#if isCompleted}
					<Check class="size-4" />
				{:else}
					{stepNum}
				{/if}
			</div>
			<span
				class="text-sm font-medium {isFuture ? 'text-muted-foreground' : 'text-foreground'}"
			>
				{label}
			</span>
		</div>
	{/each}
</nav>
