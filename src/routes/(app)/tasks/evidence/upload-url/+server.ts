import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types.js";
import { requestUploadUrl } from "$lib/api/evidence.js";
import { ApiError } from "$lib/api/client.js";

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = locals.session!;
  const { originalFilename, contentType } = await request.json();

  try {
    const result = await requestUploadUrl(session.idToken, {
      originalFilename,
      contentType,
    });
    return json(result);
  } catch (err) {
    if (err instanceof ApiError) {
      return json(
        { error: err.body.error || "Failed to get upload URL." },
        { status: err.status }
      );
    }
    console.error("Failed to get upload URL:", err);
    return json({ error: "Something went wrong." }, { status: 500 });
  }
};
