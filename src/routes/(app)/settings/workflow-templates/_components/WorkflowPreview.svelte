<script lang="ts">
	import { cn } from '$lib/utils.js';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Send from '@lucide/svelte/icons/send';
	import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import Lock from '@lucide/svelte/icons/lock';

	let { tiers = 1 }: { tiers: number } = $props();

	type StepDef = {
		label: string;
		type: 'submit' | 'review' | 'approve' | 'locked';
		icon: typeof Send;
	};

	const steps = $derived.by((): StepDef[] => {
		const result: StepDef[] = [
			{ label: 'Submit Data', type: 'submit', icon: Send }
		];

		if (tiers === 1) {
			result.push({ label: 'Approval', type: 'approve', icon: ShieldCheck });
		} else if (tiers === 2) {
			result.push({ label: 'Tier 1 Review', type: 'review', icon: ClipboardCheck });
			result.push({ label: 'Tier 2 Approval', type: 'approve', icon: ShieldCheck });
		} else {
			result.push({ label: 'Tier 1 Review', type: 'review', icon: ClipboardCheck });
			result.push({ label: 'Tier 2 Review', type: 'review', icon: ClipboardCheck });
			result.push({ label: 'Final Approval', type: 'approve', icon: ShieldCheck });
		}

		result.push({ label: 'Locked', type: 'locked', icon: Lock });

		return result;
	});

	const stepColorMap: Record<string, string> = {
		submit: 'border-blue-200 bg-blue-50 text-blue-700',
		review: 'border-amber-200 bg-amber-50 text-amber-700',
		approve: 'border-emerald-200 bg-emerald-50 text-emerald-700',
		locked: 'border-gray-200 bg-gray-50 text-gray-500'
	};
</script>

<div class="flex flex-col gap-2">
	<span class="text-sm font-medium text-muted-foreground">Workflow Preview</span>
	<div class="flex flex-wrap items-center gap-2">
		{#each steps as step, i}
			<div
				class={cn(
					'flex items-center gap-2 rounded-lg border px-3 py-2',
					stepColorMap[step.type]
				)}
			>
				<step.icon class="size-4" />
				<span class="text-sm font-medium">{step.label}</span>
			</div>
			{#if i < steps.length - 1}
				<ArrowRight class="size-4 text-muted-foreground shrink-0" />
			{/if}
		{/each}
	</div>
</div>
