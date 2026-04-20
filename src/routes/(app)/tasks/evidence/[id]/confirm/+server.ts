import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types.js";
import { confirmUpload } from "$lib/api/evidence.js";
import { ApiError } from "$lib/api/client.js";

export const POST: RequestHandler = async ({ params, locals }) => {
  const session = locals.session!;

  try {
    const result = await confirmUpload(session.idToken, params.id);
    return json(result);
  } catch (err) {
    if (err instanceof ApiError) {
      return json(
        { error: err.body.error || "Failed to confirm upload." },
        { status: err.status }
      );
    }
    console.error("Failed to confirm upload:", err);
    return json({ error: "Something went wrong." }, { status: 500 });
  }
};
