<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { toast } from 'svelte-sonner';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Zap from '@lucide/svelte/icons/zap';
	import CampaignForm from '../../_components/CampaignForm.svelte';

	let { data } = $props();

	let activating = $state(false);

	async function handleActivate() {
		activating = true;

		try {
			const response = await fetch('?/activate', {
				method: 'POST',
				body: new FormData()
			});

			if (response.redirected) {
				window.location.href = response.url;
				return;
			}

			const result = await response.json();

			if (!response.ok) {
				toast.error(result?.error || 'Failed to activate campaign.');
			}
		} catch {
			toast.error('Failed to activate campaign.');
		}

		activating = false;
	}
</script>

<svelte:head>
	<title>Edit Campaign | Akriva</title>
</svelte:head>

<div class="flex flex-col gap-6 p-7 px-8">
	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<Button variant="ghost" size="icon" href="/campaigns/{data.campaign.id}">
				<ArrowLeft class="size-4" />
			</Button>
			<div class="flex flex-col gap-1">
				<h1 class="text-2xl font-semibold">Edit Campaign</h1>
				<p class="text-sm text-muted-foreground">
					Update campaign settings before activation
				</p>
			</div>
		</div>

		{#if data.campaign.status === 'draft'}
			<Button onclick={handleActivate} disabled={activating}>
				<Zap class="size-4 mr-2" />
				{activating ? 'Activating...' : 'Activate Campaign'}
			</Button>
		{/if}
	</div>

	<CampaignForm
		formData={data.form}
		indicators={data.indicators}
		workflowTemplates={data.workflowTemplates}
		orgTree={data.orgTree}
		users={data.users}
		mode="edit"
		campaignStatus={data.campaign.status}
	/>
</div>
