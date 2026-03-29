import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types.js";
import { listActivityUnits } from "$lib/api/emission-sources.js";

export const GET: RequestHandler = async ({ url, locals }) => {
  const session = locals.session!;
  const category = url.searchParams.get("category");

  if (!category) {
    return json([], { status: 400 });
  }

  try {
    const units = await listActivityUnits(session.idToken, category);
    return json(units);
  } catch {
    return json([], { status: 500 });
  }
};
