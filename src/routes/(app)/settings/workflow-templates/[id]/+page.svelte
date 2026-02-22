<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { toast } from 'svelte-sonner';
	import { invalidateAll, goto } from '$app/navigation';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Play from '@lucide/svelte/icons/play';
	import Archive from '@lucide/svelte/icons/archive';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import { WORKFLOW_STATUS_LABELS } from '$lib/api/types.js';
	import type { WorkflowTemplateStatus } from '$lib/api/types.js';
	import { cn } from '$lib/utils.js';
	import { updateWorkflowTemplateSchema } from '$lib/schemas/workflow-template.js';
	import WorkflowPreview from '../_components/WorkflowPreview.svelte';

	let { data } = $props();

	const superform = superForm(data.form, {
		validators: zod4Client(updateWorkflowTemplateSchema),
		onUpdated({ form }) {
			if (form.valid && form.message && !form.message.includes('wrong') && !form.message.includes('check')) {
				toast.success(form.message);
				invalidateAll();
			}
		}
	});
	const { form, enhance, message, submitting } = superform;

	const template = $derived(data.template);
	const isDraft = $derived(template.status === 'draft');
	const isActive = $derived(template.status === 'active');
	const isReadOnly = $derived(template.status !== 'draft');

	const statusBadgeClass: Record<WorkflowTemplateStatus, string> = {
		draft: 'bg-gray-100 text-gray-700 border-gray-200',
		active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
		archived: 'bg-amber-100 text-amber-700 border-amber-200'
	};

	const tierCount = $derived(
		template.steps.filter((s) => s.type === 'review' || s.type === 'approve').length
	);

	let deleteDialogOpen = $state(false);
	let actionLoading = $state(false);

	async function handleAction(action: string) {
		actionLoading = true;
		const formData = new FormData();

		try {
			const response = await fetch(`?/${action}`, {
				method: 'POST',
				body: formData
			});

			if (action === 'delete') {
				// Delete redirects server-side
				await goto('/settings/workflow-templates');
				toast.success('Template deleted successfully.');
				return;
			}

			const result = await response.json();
			const responseData = result?.data?.[0] ?? result;

			if (response.ok && !responseData?.status) {
				toast.success(responseData?.message || `Template ${action}d successfully.`);
				await invalidateAll();
			} else {
				toast.error(responseData?.message || `Failed to ${action} template.`);
			}
		} catch {
			toast.error('Something went wrong. Please try again.');
		} finally {
			actionLoading = false;
		}
	}

	async function handleDelete() {
		deleteDialogOpen = false;
		await handleAction('delete');
	}
</script>

<svelte:head>
	<title>{template.name} | Workflow Templates | Akriva</title>
</svelte:head>

<div class="flex flex-col gap-6 p-7 px-8">
	<!-- Page Header -->
	<div class="flex items-start justify-between">
		<div class="flex items-center gap-3">
			<Button variant="ghost" size="icon" href="/settings/workflow-templates">
				<ArrowLeft class="size-4" />
			</Button>
			<div class="flex flex-col gap-1">
				<div class="flex items-center gap-3">
					<h1 class="text-2xl font-semibold">{template.name}</h1>
					<Badge variant="outline" class={statusBadgeClass[template.status]}>
						{WORKFLOW_STATUS_LABELS[template.status]}
					</Badge>
				</div>
				<p class="text-sm text-muted-foreground">
					Version {template.version} &middot; {tierCount} approval {tierCount === 1 ? 'tier' : 'tiers'}
				</p>
			</div>
		</div>

		<!-- Action buttons -->
		<div class="flex items-center gap-2">
			{#if isDraft}
				<Button
					variant="outline"
					size="sm"
					onclick={() => handleAction('activate')}
					disabled={actionLoading}
				>
					<Play class="size-3.5 mr-1.5" />
					Activate
				</Button>
				<Button
					variant="outline"
					size="sm"
					class="text-destructive hover:text-destructive"
					onclick={() => (deleteDialogOpen = true)}
					disabled={actionLoading}
				>
					<Trash2 class="size-3.5 mr-1.5" />
					Delete
				</Button>
			{/if}

			{#if isActive}
				<Button
					variant="outline"
					size="sm"
					onclick={() => handleAction('archive')}
					disabled={actionLoading}
				>
					<Archive class="size-3.5 mr-1.5" />
					Archive
				</Button>
			{/if}
		</div>
	</div>

	<!-- Form Card -->
	<Card.Root class="max-w-2xl">
		<Card.Header>
			<Card.Title>Template Details</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if $message && ($message.includes('wrong') || $message.includes('check') || $message.includes('cannot'))}
				<Alert variant="destructive" class="mb-4">
					<AlertDescription>{$message}</AlertDescription>
				</Alert>
			{/if}

			<form method="POST" action="?/update" use:enhance class="flex flex-col gap-6">
				<!-- Name -->
				<Form.Field form={superform} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Template Name</Form.Label>
							<Input
								{...props}
								placeholder="e.g. Standard 2-Tier Approval"
								bind:value={$form.name}
								disabled={isReadOnly}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Description -->
				<Form.Field form={superform} name="description">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Description <span class="text-muted-foreground font-normal">(optional)</span></Form.Label>
							<Textarea
								{...props}
								placeholder="Describe the purpose of this workflow..."
								rows={3}
								bind:value={$form.description}
								disabled={isReadOnly}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				{#if isDraft}
					<div class="flex justify-end gap-3 pt-2">
						<Button variant="outline" href="/settings/workflow-templates">
							Cancel
						</Button>
						<Form.Button disabled={$submitting}>
							{$submitting ? 'Saving...' : 'Save Changes'}
						</Form.Button>
					</div>
				{/if}
			</form>
		</Card.Content>
	</Card.Root>

	<!-- Workflow Steps Preview -->
	<Card.Root class="max-w-2xl">
		<Card.Header>
			<Card.Title>Workflow Steps</Card.Title>
		</Card.Header>
		<Card.Content>
			<WorkflowPreview tiers={tierCount} />

			<!-- Step detail list -->
			<div class="mt-6 flex flex-col gap-3">
				{#each template.steps.toSorted((a, b) => a.stepOrder - b.stepOrder) as step}
					<div class="flex items-center justify-between rounded-lg border border-border px-4 py-3">
						<div class="flex items-center gap-3">
							<span class="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
								{step.stepOrder}
							</span>
							<div class="flex flex-col">
								<span class="text-sm font-medium">{step.name}</span>
								<span class="text-xs text-muted-foreground capitalize">
									{step.type} &middot; {step.assignedRole.replace('_', ' ')}
								</span>
							</div>
						</div>
						<Badge variant="outline" class="text-xs capitalize">
							{step.gateType.replace('_', ' ')}
						</Badge>
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
</div>

<!-- Delete confirmation dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<TriangleAlert class="size-5 text-destructive" />
				Delete Workflow Template
			</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete <strong>{template.name}</strong>? This action
				cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (deleteDialogOpen = false)} disabled={actionLoading}>
				Cancel
			</Button>
			<Button variant="destructive" onclick={handleDelete} disabled={actionLoading}>
				{actionLoading ? 'Deleting...' : 'Delete'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
