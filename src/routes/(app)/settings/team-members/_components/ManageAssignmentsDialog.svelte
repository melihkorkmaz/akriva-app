<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Button } from '$lib/components/ui/button';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import Info from '@lucide/svelte/icons/info';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import type {
		UserResponseDto,
		OrgUnitTreeResponseDto,
		AssignmentResponseDto
	} from '$lib/api/types.js';

	let {
		open = $bindable(false),
		user,
		orgTree
	}: {
		open: boolean;
		user: UserResponseDto | null;
		orgTree: OrgUnitTreeResponseDto[];
	} = $props();

	let loading = $state(false);
	let submitting = $state(false);
	let errorMessage = $state('');
	let selectedOrgUnitIds = $state<Set<string>>(new Set());

	interface FlatOrgUnit {
		id: string;
		name: string;
		depth: number;
	}

	function flattenTree(nodes: OrgUnitTreeResponseDto[], depth: number = 0): FlatOrgUnit[] {
		const result: FlatOrgUnit[] = [];
		for (const node of nodes) {
			result.push({ id: node.id, name: node.name, depth });
			if (node.children?.length) {
				result.push(...flattenTree(node.children, depth + 1));
			}
		}
		return result;
	}

	let flatOrgUnits = $derived(flattenTree(orgTree));

	let isAdminRole = $derived(user?.role === 'tenant_admin' || user?.role === 'super_admin');

	$effect(() => {
		if (open && user) {
			errorMessage = '';
			loadAssignments();
		}
	});

	async function loadAssignments() {
		if (!user) return;
		loading = true;

		const formData = new FormData();
		formData.set('userId', user.id);

		const response = await fetch('?/fetchAssignments', {
			method: 'POST',
			body: formData
		});

		const result = await response.json();
		loading = false;

		// SvelteKit form action responses are wrapped in a data array
		const data = result?.data?.[0] ?? result;

		if (data?.error) {
			errorMessage = data.error;
			return;
		}

		const assignments: AssignmentResponseDto[] = data?.assignments ?? [];
		selectedOrgUnitIds = new Set(assignments.map((a) => a.orgUnitId));
	}

	function toggleOrgUnit(orgUnitId: string, checked: boolean | 'indeterminate') {
		const next = new Set(selectedOrgUnitIds);
		if (checked === true) {
			next.add(orgUnitId);
		} else {
			next.delete(orgUnitId);
		}
		selectedOrgUnitIds = next;
	}

	async function handleSubmit() {
		if (!user) return;

		submitting = true;
		errorMessage = '';

		const formData = new FormData();
		formData.set('userId', user.id);
		formData.set('orgUnitIds', JSON.stringify([...selectedOrgUnitIds]));

		const response = await fetch('?/updateAssignments', {
			method: 'POST',
			body: formData
		});

		const result = await response.json();
		submitting = false;

		// SvelteKit form action responses are wrapped in a data array
		const data = result?.data?.[0] ?? result;

		if (data?.status && data.status >= 400) {
			errorMessage = data.message || 'Failed to update assignments.';
			return;
		}

		open = false;
		toast.success('Assignments updated successfully.');
		await invalidateAll();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-lg max-h-[80vh] flex flex-col">
		<Dialog.Header>
			<Dialog.Title>Manage Assignments</Dialog.Title>
			<Dialog.Description>
				{#if user}
					Assign organizational units to <strong>{user.displayName || user.email}</strong>
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		{#if isAdminRole}
			<Alert>
				<Info class="size-4" />
				<AlertDescription>
					Admins have tenant-wide access. Assignments have no practical effect on their
					permissions.
				</AlertDescription>
			</Alert>
		{/if}

		{#if errorMessage}
			<Alert variant="destructive">
				<TriangleAlert class="size-4" />
				<AlertDescription>{errorMessage}</AlertDescription>
			</Alert>
		{/if}

		<div class="flex-1 overflow-y-auto py-4 min-h-0">
			{#if loading}
				<div class="flex flex-col gap-3">
					{#each Array(5) as _}
						<Skeleton class="h-6 w-full" />
					{/each}
				</div>
			{:else if flatOrgUnits.length === 0}
				<p class="text-sm text-muted-foreground text-center py-4">
					No organizational units found.
				</p>
			{:else}
				<div class="flex flex-col gap-1">
					{#each flatOrgUnits as orgUnit}
						{@const isChecked = selectedOrgUnitIds.has(orgUnit.id)}
						<label
							class="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted cursor-pointer transition-colors"
							style="padding-left: {12 + orgUnit.depth * 20}px"
						>
							<Checkbox
								checked={isChecked}
								onCheckedChange={(checked) => toggleOrgUnit(orgUnit.id, checked)}
							/>
							<span class="text-sm">{orgUnit.name}</span>
						</label>
					{/each}
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (open = false)} disabled={submitting}>
				Cancel
			</Button>
			<Button onclick={handleSubmit} disabled={submitting || loading}>
				{submitting ? 'Saving...' : 'Save Assignments'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
