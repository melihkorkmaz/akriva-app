import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types.js";
import { getRequest } from "$lib/api/data-collection.js";
import { requireCoordinator } from "$lib/server/auth.js";
import { ApiError } from "$lib/api/client.js";

export const load: PageServerLoad = async ({ params, locals }) => {
  requireCoordinator(locals);
  const session = locals.session!;

  try {
    const request = await getRequest(session.idToken, params.id);
    return { request };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      throw error(404, "Request not found");
    }
    console.error("Failed to load request:", err);
    throw error(500, "Failed to load request details");
  }
};
