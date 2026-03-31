import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types.js";
import { listRequests } from "$lib/api/data-collection.js";
import { requireCoordinator } from "$lib/server/auth.js";
import type { DataCollectionRequestStatus } from "$lib/api/types.js";

const VALID_STATUSES: DataCollectionRequestStatus[] = [
  "open",
  "in_progress",
  "completed",
  "cancelled",
];

export const load: PageServerLoad = async ({ locals, url }) => {
  requireCoordinator(locals);
  const session = locals.session!;

  const statusParam = url.searchParams.get("status") || undefined;
  const status =
    statusParam && VALID_STATUSES.includes(statusParam as DataCollectionRequestStatus)
      ? statusParam
      : undefined;
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("pageSize")) || 20)
  );

  try {
    const response = await listRequests(session.idToken, {
      status,
      page,
      pageSize,
    });

    return {
      requests: response.items,
      total: response.total,
      filters: { status: statusParam || "", page, pageSize },
    };
  } catch (err) {
    console.error("Failed to load requests:", err);
    throw error(500, "Failed to load data collection requests");
  }
};
