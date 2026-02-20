import type { ColumnDef } from "@tanstack/table-core";
import { createRawSnippet } from "svelte";
import { renderSnippet } from "$lib/components/ui/data-table";

export interface EmissionEntry {
	id: string;
	source: string;
	fuelType: string;
	amount: string;
	period: string;
	emissions: string;
	status: "verified" | "pending" | "draft";
}

const statusConfig: Record<EmissionEntry["status"], { cls: string; label: string }> = {
	verified: {
		cls: "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20",
		label: "Verified",
	},
	pending: {
		cls: "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-500/20",
		label: "Pending",
	},
	draft: {
		cls: "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 ring-1 ring-slate-300/60",
		label: "Draft",
	},
};

export const columns: ColumnDef<EmissionEntry>[] = [
	{
		accessorKey: "source",
		header: "Source",
		cell: ({ row }) => {
			const snippet = createRawSnippet<[string]>((getValue) => ({
				render: () => `<span class="font-medium text-foreground">${getValue()}</span>`,
			}));
			return renderSnippet(snippet, row.getValue("source"));
		},
	},
	{
		accessorKey: "fuelType",
		header: "Fuel Type",
	},
	{
		accessorKey: "amount",
		header: "Amount",
	},
	{
		accessorKey: "period",
		header: "Period",
	},
	{
		accessorKey: "emissions",
		header: () => {
			const snippet = createRawSnippet(() => ({
				render: () => `<span class="font-medium">Emissions</span>`,
			}));
			return renderSnippet(snippet);
		},
		cell: ({ row }) => {
			const snippet = createRawSnippet<[string]>((getValue) => ({
				render: () => `<span class="font-medium text-foreground">${getValue()}</span>`,
			}));
			return renderSnippet(snippet, row.getValue("emissions"));
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const config = statusConfig[row.getValue("status") as EmissionEntry["status"]];
			const snippet = createRawSnippet<[typeof config]>((getConfig) => {
				const { cls, label } = getConfig();
				return { render: () => `<span class="${cls}">${label}</span>` };
			});
			return renderSnippet(snippet, config);
		},
	},
];
