<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import CampaignForm from '../_components/CampaignForm.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>New Campaign | Akriva</title>
</svelte:head>

<div class="flex flex-col gap-6 p-7 px-8">
	<!-- Page Header -->
	<div class="flex items-center gap-3">
		<Button variant="ghost" size="icon" href="/campaigns">
			<ArrowLeft class="size-4" />
		</Button>
		<div class="flex flex-col gap-1">
			<h1 class="text-2xl font-semibold">New Campaign</h1>
			<p class="text-sm text-muted-foreground">
				Create a new data collection campaign for emission reporting
			</p>
		</div>
	</div>

	<CampaignForm
		formData={data.form}
		indicators={data.indicators}
		workflowTemplates={data.workflowTemplates}
		orgTree={data.orgTree}
		users={data.users}
		mode="create"
	/>
</div>
