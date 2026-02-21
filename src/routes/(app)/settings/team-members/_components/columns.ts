import type { ColumnDef } from '@tanstack/table-core';
import { createRawSnippet } from 'svelte';
import { renderSnippet } from '$lib/components/ui/data-table';
import type { UserResponseDto, TenantRole } from '$lib/api/types.js';
import { TENANT_ROLE_LABELS } from '$lib/api/types.js';

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

const roleBadgeConfig: Record<TenantRole, { cls: string }> = {
	super_admin: {
		cls: 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-violet-50 text-violet-700 ring-1 ring-violet-500/20'
	},
	tenant_admin: {
		cls: 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-500/20'
	},
	data_approver: {
		cls: 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-500/20'
	},
	data_entry: {
		cls: 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20'
	},
	viewer: {
		cls: 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 ring-1 ring-slate-300/60'
	}
};

export function createColumns(currentUserId: string): ColumnDef<UserResponseDto>[] {
	return [
		{
			accessorKey: 'displayName',
			header: 'Name',
			cell: ({ row }) => {
				const name = escapeHtml(row.original.displayName || 'No name set');
				const email = escapeHtml(row.original.email);
				const isCurrentUser = row.original.id === currentUserId;
				const snippet = createRawSnippet<
					[{ name: string; email: string; isCurrentUser: boolean }]
				>((getData) => {
					const d = getData();
					return {
						render: () =>
							`<div class="flex flex-col gap-0.5">
								<span class="font-medium text-foreground">${d.name}${d.isCurrentUser ? ' <span class="text-xs text-muted-foreground">(you)</span>' : ''}</span>
								<span class="text-xs text-muted-foreground">${d.email}</span>
							</div>`
					};
				});
				return renderSnippet(snippet, { name, email, isCurrentUser });
			}
		},
		{
			accessorKey: 'role',
			header: 'Role',
			cell: ({ row }) => {
				const role = row.getValue('role') as TenantRole;
				const config = roleBadgeConfig[role];
				const label = TENANT_ROLE_LABELS[role];
				const snippet = createRawSnippet<[{ cls: string; label: string }]>((getData) => {
					const d = getData();
					return { render: () => `<span class="${d.cls}">${d.label}</span>` };
				});
				return renderSnippet(snippet, { cls: config.cls, label });
			}
		},
		{
			accessorKey: 'isActive',
			header: 'Status',
			cell: ({ row }) => {
				const isActive = row.getValue('isActive') as boolean;
				const snippet = createRawSnippet<[boolean]>((getActive) => {
					const active = getActive();
					return {
						render: () =>
							`<div class="flex items-center gap-2">
								<span class="size-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-300'}"></span>
								<span class="text-sm ${active ? 'text-foreground' : 'text-muted-foreground'}">${active ? 'Active' : 'Inactive'}</span>
							</div>`
					};
				});
				return renderSnippet(snippet, isActive);
			}
		}
	];
}
