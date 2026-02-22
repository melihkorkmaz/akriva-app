<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import Eye from '@lucide/svelte/icons/eye';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Play from '@lucide/svelte/icons/play';
	import Archive from '@lucide/svelte/icons/archive';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import GitBranch from '@lucide/svelte/icons/git-branch';
	import type {
		WorkflowTemplateResponseDto,
		WorkflowTemplateStatus
	} from '$lib/api/types.js';
	import { WORKFLOW_STATUS_LABELS } from '$lib/api/types.js';
	import { cn } from '$lib/utils.js';

	let { template }: { template: WorkflowTemplateResponseDto } = $props();

	let deleteDialogOpen = $state(false);
	let actionLoading = $state(false);

	const statusBadgeClass: Record<WorkflowTemplateStatus, string> = {
		draft: 'bg-gray-100 text-gray-700 border-gray-200',
		active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
		archived: 'bg-amber-100 text-amber-700 border-amber-200'
	};

	const isDraft = $derived(template.status === 'draft');
	const isActive = $derived(template.status === 'active');

	const tierCount = $derived(
		template.steps.filter((s) => s.type === 'review' || s.type === 'approve').length
	);

	const createdDate = $derived(
		new Date(template.createdAt).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		})
	);

	async function handleAction(action: string) {
		actionLoading = true;
		const formData = new FormData();
		formData.set('id', template.id);

		try {
			const response = await fetch(`?/${action}`, {
				method: 'POST',
				body: formData
			});

			const result = await response.json();
			const data = result?.data?.[0] ?? result;

			if (response.ok && !data?.status) {
				toast.success(data?.message || `Template ${action}d successfully.`);
				await invalidateAll();
			} else {
				toast.error(data?.message || `Failed to ${action} template.`);
			}
		} catch {
			toast.error(`Something went wrong. Please try again.`);
		} finally {
			actionLoading = false;
		}
	}

	async function handleDelete() {
		deleteDialogOpen = false;
		await handleAction('delete');
	}
</script>

<Card.Root class="transition-shadow hover:shadow-md">
	<Card.Header class="pb-3">
		<div class="flex items-start justify-between gap-2">
			<div class="flex flex-col gap-1.5 min-w-0">
				<Card.Title class="text-base font-semibold truncate">
					{template.name}
				</Card.Title>
				{#if template.description}
					<p class="text-sm text-muted-foreground line-clamp-2">
						{template.description}
					</p>
				{/if}
			</div>
			<Badge variant="outline" class={cn('shrink-0', statusBadgeClass[template.status])}>
				{WORKFLOW_STATUS_LABELS[template.status]}
			</Badge>
		</div>
	</Card.Header>

	<Card.Content class="pt-0">
		<div class="flex items-center gap-4 text-xs text-muted-foreground">
			<span class="flex items-center gap-1">
				<GitBranch class="size-3.5" />
				{tierCount} approval {tierCount === 1 ? 'tier' : 'tiers'}
			</span>
			<span>v{template.version}</span>
			<span>Created {createdDate}</span>
		</div>
	</Card.Content>

	<Card.Footer class="flex items-center gap-2 border-t border-border pt-4">
		<Button variant="outline" size="sm" href="/settings/workflow-templates/{template.id}">
			{#if isDraft}
				<Pencil class="size-3.5 mr-1.5" />
				Edit
			{:else}
				<Eye class="size-3.5 mr-1.5" />
				View
			{/if}
		</Button>

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
	</Card.Footer>
</Card.Root>

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
