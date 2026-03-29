import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { OrgUnitTreeResponseDto } from "$lib/api/types.js";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** Recursively flatten org tree into an id → name lookup map */
export function flattenOrgTree(
	nodes: OrgUnitTreeResponseDto[],
	map: Record<string, string> = {}
): Record<string, string> {
	for (const node of nodes) {
		map[node.id] = node.name;
		if (node.children?.length) flattenOrgTree(node.children, map);
	}
	return map;
}

export type {
	WithoutChild,
	WithoutChildrenOrChild,
	WithoutChildren,
	WithElementRef,
} from "bits-ui";
