import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types.js";
import { cancelRequest } from "$lib/api/data-collection.js";
import { requireCoordinator } from "$lib/server/auth.js";
import { ApiError } from "$lib/api/client.js";

export const PATCH: RequestHandler = async ({ params, locals }) => {
  requireCoordinator(locals);
  const session = locals.session!;

  try {
    await cancelRequest(session.idToken, params.id);
    return json({ success: true });
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 400) {
        return json(
          {
            success: false,
            error:
              err.body.error ||
              "This request cannot be cancelled in its current state.",
          },
          { status: 400 }
        );
      }
      if (err.status === 403) {
        return json(
          {
            success: false,
            error: "You don't have permission to cancel this request.",
          },
          { status: 403 }
        );
      }
      if (err.status === 404) {
        return json(
          { success: false, error: "Request not found." },
          { status: 404 }
        );
      }
    }
    return json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
};
