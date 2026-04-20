import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types.js";
import { listTasks } from "$lib/api/data-collection.js";
import type { DataCollectionTaskStatus } from "$lib/api/types.js";

const VALID_STATUSES: DataCollectionTaskStatus[] = [
  "pending",
  "in_progress",
  "submitted",
  "approved",
  "revision_needed",
  "cancelled",
];

export const load: PageServerLoad = async ({ locals, url }) => {
  const session = locals.session!;

  const statusParam = url.searchParams.get("status") || undefined;
  const status =
    statusParam &&
    VALID_STATUSES.includes(statusParam as DataCollectionTaskStatus)
      ? statusParam
      : undefined;
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("pageSize")) || 20)
  );

  try {
    const response = await listTasks(session.idToken, {
      status,
      page,
      pageSize,
    });

    return {
      tasks: response.items,
      total: response.total,
      filters: { status: statusParam || "", page, pageSize },
    };
  } catch (err) {
    console.error("Failed to load tasks:", err);
    throw error(500, "Failed to load data collection tasks");
  }
};
