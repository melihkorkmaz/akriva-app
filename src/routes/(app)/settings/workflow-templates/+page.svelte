<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Plus from '@lucide/svelte/icons/plus';
	import GitBranch from '@lucide/svelte/icons/git-branch';
	import WorkflowCard from './_components/WorkflowCard.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Workflow Templates | Settings | Akriva</title>
</svelte:head>

<div class="flex flex-col gap-6 p-7 px-8">
	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div class="flex flex-col gap-1">
			<h1 class="text-2xl font-semibold">Workflow Templates</h1>
			<p class="text-sm text-muted-foreground">
				Define approval workflows for data collection campaigns
			</p>
		</div>
		<Button href="/settings/workflow-templates/new">
			<Plus class="size-4 mr-2" />
			New Template
		</Button>
	</div>

	<!-- Template grid or empty state -->
	{#if data.templates.length > 0}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.templates as template (template.id)}
				<WorkflowCard {template} />
			{/each}
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
			<div class="flex size-12 items-center justify-center rounded-full bg-muted">
				<GitBranch class="size-6 text-muted-foreground" />
			</div>
			<h3 class="mt-4 text-lg font-semibold">No workflow templates</h3>
			<p class="mt-1 text-sm text-muted-foreground">
				Create your first workflow template to define approval processes.
			</p>
			<Button class="mt-4" href="/settings/workflow-templates/new">
				<Plus class="size-4 mr-2" />
				New Template
			</Button>
		</div>
	{/if}
</div>
