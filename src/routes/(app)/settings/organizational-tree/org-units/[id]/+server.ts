import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types.js";
import { deleteOrgUnit } from "$lib/api/org-units.js";
import { ApiError } from "$lib/api/client.js";

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const session = locals.session!;

  try {
    await deleteOrgUnit(session.idToken, params.id);
    return json({ success: true });
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 409) {
        return json(
          { success: false, error: "This node has active children. Move or delete them first." },
          { status: 409 }
        );
      }
      if (err.status === 404) {
        return json({ success: false, error: "Org unit not found." }, { status: 404 });
      }
      if (err.status === 403) {
        return json(
          { success: false, error: "You don't have permission to perform this action." },
          { status: 403 }
        );
      }
    }
    return json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
};
