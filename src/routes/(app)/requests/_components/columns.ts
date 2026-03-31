import type { ColumnDef } from "@tanstack/table-core";
import { createRawSnippet } from "svelte";
import {
  renderSnippet,
  renderComponent,
} from "$lib/components/ui/data-table";
import type { DataCollectionRequestResponseDto } from "$lib/api/types.js";
import StatusBadge from "./StatusBadge.svelte";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const columns: ColumnDef<DataCollectionRequestResponseDto>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const title = escapeHtml(row.original.title);
      const snippet = createRawSnippet<[{ value: string }]>((getData) => {
        const d = getData();
        return {
          render: () =>
            `<span class="font-medium text-foreground">${d.value}</span>`,
        };
      });
      return renderSnippet(snippet, { value: title });
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) =>
      renderComponent(StatusBadge, { status: row.original.status }),
  },
  {
    id: "progress",
    header: "Progress",
    cell: ({ row }) => {
      const { taskCount, completedTaskCount } = row.original;
      const snippet = createRawSnippet<
        [{ completed: number; total: number }]
      >((getData) => {
        const d = getData();
        return {
          render: () =>
            `<span class="text-sm text-muted-foreground">${d.completed}/${d.total} completed</span>`,
        };
      });
      return renderSnippet(snippet, {
        completed: completedTaskCount,
        total: taskCount,
      });
    },
  },
  {
    accessorKey: "deadline",
    header: "Deadline",
    cell: ({ row }) => {
      const date = formatDate(row.original.deadline);
      const snippet = createRawSnippet<[{ value: string }]>((getData) => {
        const d = getData();
        return {
          render: () =>
            `<span class="text-sm text-muted-foreground">${d.value}</span>`,
        };
      });
      return renderSnippet(snippet, { value: date });
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const date = formatDate(row.original.createdAt);
      const snippet = createRawSnippet<[{ value: string }]>((getData) => {
        const d = getData();
        return {
          render: () =>
            `<span class="text-sm text-muted-foreground">${d.value}</span>`,
        };
      });
      return renderSnippet(snippet, { value: date });
    },
  },
];
