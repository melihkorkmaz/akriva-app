<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import Building2 from '@lucide/svelte/icons/building-2';
	import Building from '@lucide/svelte/icons/building';
	import Warehouse from '@lucide/svelte/icons/warehouse';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import type { Component } from 'svelte';
	import type { OrgUnitTreeResponseDto, EmissionSourceResponseDto, EmissionCategory } from '$lib/api/types.js';
	import { EMISSION_CATEGORY_LABELS } from '$lib/api/types.js';

	interface Props {
		orgTree: OrgUnitTreeResponseDto[];
		emissionSources: EmissionSourceResponseDto[];
		selectedIds: string[];
		onSelectionChange: (ids: string[]) => void;
	}

	let { orgTree, emissionSources, selectedIds, onSelectionChange }: Props = $props();

	// Filters
	let categoryFilter = $state('');
	let searchQuery = $state('');

	// Type icon mapping
	const typeIcons: Record<string, Component> = {
		subsidiary: Building2,
		division: Building,
		facility: Warehouse
	};

	// Track expanded state
	let expanded = $state<Record<string, boolean>>({});

	// Auto-expand root nodes
	$effect(() => {
		for (const node of orgTree) {
			if (!(node.id in expanded)) {
				expanded[node.id] = true;
			}
		}
	});

	function toggleExpand(nodeId: string) {
		expanded[nodeId] = !expanded[nodeId];
	}

	// Group sources by org unit
	let sourcesByOrgUnit = $derived(() => {
		const map = new Map<string, EmissionSourceResponseDto[]>();
		for (const source of emissionSources) {
			if (!source.isActive) continue;
			const list = map.get(source.orgUnitId) || [];
			list.push(source);
			map.set(source.orgUnitId, list);
		}
		return map;
	});

	// Filter sources
	function getFilteredSources(orgUnitId: string): EmissionSourceResponseDto[] {
		const sources = sourcesByOrgUnit().get(orgUnitId) || [];
		return sources.filter((s) => {
			if (categoryFilter && s.category !== categoryFilter) return false;
			if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
			return true;
		});
	}

	// Check if any descendant org unit has matching sources
	function hasMatchingSources(node: OrgUnitTreeResponseDto): boolean {
		if (getFilteredSources(node.id).length > 0) return true;
		return node.children.some((child) => hasMatchingSources(child));
	}

	// Toggle selection
	function toggleSource(sourceId: string) {
		const current = new Set(selectedIds);
		if (current.has(sourceId)) {
			current.delete(sourceId);
		} else {
			current.add(sourceId);
		}
		onSelectionChange([...current]);
	}

	const categories: EmissionCategory[] = ['stationary', 'mobile', 'fugitive', 'process'];

	let categoryLabel = $derived(
		categoryFilter
			? EMISSION_CATEGORY_LABELS[categoryFilter as EmissionCategory]
			: 'All categories'
	);
</script>

<div class="flex flex-col gap-3">
	<!-- Filters -->
	<div class="flex items-center gap-3">
		<Select.Root
			type="single"
			value={categoryFilter || '__all__'}
			onValueChange={(v) => (categoryFilter = v === '__all__' ? '' : (v ?? ''))}
		>
			<Select.Trigger class="w-48">
				{categoryLabel}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="__all__">All categories</Select.Item>
				{#each categories as cat}
					<Select.Item value={cat}>{EMISSION_CATEGORY_LABELS[cat]}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>

		<Input
			placeholder="Search sources..."
			class="max-w-xs"
			value={searchQuery}
			oninput={(e) => (searchQuery = (e.target as HTMLInputElement).value)}
		/>
	</div>

	<!-- Tree -->
	<div class="max-h-[400px] overflow-y-auto rounded-lg border border-border bg-card p-2">
		{#if orgTree.length === 0}
			<p class="py-8 text-center text-sm text-muted-foreground">
				No organizational units found.
			</p>
		{:else}
			<div class="flex flex-col" role="tree">
				{#snippet renderTree(nodes: OrgUnitTreeResponseDto[], depth: number)}
					{#each nodes as node}
						{@const Icon = typeIcons[node.type] ?? Building2}
						{@const isExpanded = expanded[node.id] ?? false}
						{@const hasChildren = node.children.length > 0}
						{@const filteredSources = getFilteredSources(node.id)}
						{@const hasMatching = hasMatchingSources(node)}

						{#if hasMatching}
							<div role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
								<!-- Org unit row -->
								<button
									type="button"
									class="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-secondary transition-colors"
									style:padding-left="{depth * 20 + 8}px"
									onclick={() => toggleExpand(node.id)}
								>
									{#if hasChildren || filteredSources.length > 0}
										{#if isExpanded}
											<ChevronDown class="size-4 shrink-0 text-muted-foreground" />
										{:else}
											<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
										{/if}
									{:else}
										<span class="w-4 shrink-0"></span>
									{/if}
									<Icon class="size-4 shrink-0" />
									<span class="font-medium">{node.name}</span>
									<span class="text-xs text-muted-foreground">({node.type})</span>
								</button>

								{#if isExpanded}
									<!-- Emission sources under this org unit -->
									{#each filteredSources as source (source.id)}
										{@const isSelected = selectedIds.includes(source.id)}
										<label
											class="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-secondary transition-colors"
											style:padding-left="{(depth + 1) * 20 + 8}px"
										>
											<Checkbox
												checked={isSelected}
												onCheckedChange={() => toggleSource(source.id)}
											/>
											<span class="text-sm {isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}">
												{source.name}
											</span>
											<Badge variant="outline" class="text-[10px] px-1.5 py-0">
												{EMISSION_CATEGORY_LABELS[source.category]}
											</Badge>
											{#if source.fuelType}
												<span class="text-xs text-muted-foreground">{source.fuelType}</span>
											{/if}
										</label>
									{/each}

									<!-- Child org units -->
									{@render renderTree(node.children, depth + 1)}
								{/if}
							</div>
						{/if}
					{/each}
				{/snippet}
				{@render renderTree(orgTree, 0)}
			</div>
		{/if}
	</div>

	<!-- Selection count -->
	<p class="text-sm text-muted-foreground">
		{selectedIds.length} source{selectedIds.length !== 1 ? 's' : ''} selected
	</p>
</div>
