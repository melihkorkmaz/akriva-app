<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Building2 from '@lucide/svelte/icons/building-2';
	import Building from '@lucide/svelte/icons/building';
	import Warehouse from '@lucide/svelte/icons/warehouse';
	import type { Component } from 'svelte';
	import type { OrgUnitTreeResponseDto } from '$lib/api/types.js';

	let {
		tree,
		selectedIds = $bindable([])
	}: {
		tree: OrgUnitTreeResponseDto[];
		selectedIds: string[];
	} = $props();

	// Type icon mapping
	const typeIcons: Record<string, Component> = {
		subsidiary: Building2,
		division: Building,
		facility: Warehouse
	};

	// Track expanded state
	let expanded = $state(new Set<string>());

	// Auto-expand root nodes
	$effect(() => {
		for (const node of tree) {
			expanded.add(node.id);
		}
	});

	// Internal Set for fast lookup
	let selectedSet = $derived(new Set(selectedIds));

	function toggleExpand(nodeId: string) {
		if (expanded.has(nodeId)) {
			expanded.delete(nodeId);
		} else {
			expanded.add(nodeId);
		}
		// Trigger reactivity
		expanded = new Set(expanded);
	}

	function toggle(nodeId: string, checked: boolean | 'indeterminate') {
		if (checked === true) {
			selectedIds = [...selectedIds, nodeId];
		} else {
			selectedIds = selectedIds.filter((id) => id !== nodeId);
		}
	}

	// Flatten to get names for selected chips
	function flattenNodes(nodes: OrgUnitTreeResponseDto[]): Map<string, string> {
		const map = new Map<string, string>();
		function walk(nodes: OrgUnitTreeResponseDto[]) {
			for (const node of nodes) {
				map.set(node.id, node.name);
				if (node.children.length > 0) walk(node.children);
			}
		}
		walk(nodes);
		return map;
	}

	let nodeNameMap = $derived(flattenNodes(tree));
</script>

<div class="flex flex-col gap-3">
	<div class="rounded-md border border-border max-h-72 overflow-y-auto p-2">
		{#if tree.length === 0}
			<p class="text-sm text-muted-foreground py-4 text-center">
				No organizational units available.
			</p>
		{:else}
			{#snippet renderNode(node: OrgUnitTreeResponseDto, depth: number)}
				{@const Icon = typeIcons[node.type] ?? Building2}
				{@const hasChildren = node.children.length > 0}
				{@const isExpanded = expanded.has(node.id)}
				<div
					style="padding-left: {depth * 24}px"
					class="flex items-center gap-2 py-1.5 px-1 rounded hover:bg-accent/50 transition-colors"
				>
					{#if hasChildren}
						<button
							type="button"
							class="shrink-0 p-0 border-0 bg-transparent cursor-pointer"
							onclick={() => toggleExpand(node.id)}
						>
							{#if isExpanded}
								<ChevronDown class="size-4 text-muted-foreground" />
							{:else}
								<ChevronRight class="size-4 text-muted-foreground" />
							{/if}
						</button>
					{:else}
						<span class="w-4 shrink-0"></span>
					{/if}
					<Checkbox
						checked={selectedSet.has(node.id)}
						onCheckedChange={(checked) => toggle(node.id, checked)}
					/>
					<Icon class="size-4 shrink-0 text-muted-foreground" />
					<span class="text-sm">{node.name}</span>
					<Badge variant="outline" class="text-xs ml-auto shrink-0">{node.type}</Badge>
				</div>
				{#if hasChildren && isExpanded}
					{#each node.children as child}
						{@render renderNode(child, depth + 1)}
					{/each}
				{/if}
			{/snippet}
			{#each tree as node}
				{@render renderNode(node, 0)}
			{/each}
		{/if}
	</div>

	<!-- Selected count and chips -->
	{#if selectedIds.length > 0}
		<div class="flex flex-wrap items-center gap-2">
			<span class="text-sm text-muted-foreground">
				{selectedIds.length} org unit{selectedIds.length === 1 ? '' : 's'} selected
			</span>
			{#each selectedIds as id}
				{@const name = nodeNameMap.get(id)}
				{#if name}
					<Badge variant="secondary" class="text-xs">
						{name}
						<button
							type="button"
							class="ml-1 hover:text-destructive transition-colors"
							onclick={() => toggle(id, false)}
						>
							&times;
						</button>
					</Badge>
				{/if}
			{/each}
		</div>
	{:else}
		<p class="text-sm text-muted-foreground">No org units selected</p>
	{/if}
</div>
