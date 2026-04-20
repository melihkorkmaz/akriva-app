import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types.js";
import { updateTask } from "$lib/api/data-collection.js";
import { createEmissionEntry } from "$lib/api/emission-entries.js";
import { ApiError } from "$lib/api/client.js";

export const POST: RequestHandler = async ({ params, request, locals }) => {
  const session = locals.session!;

  try {
    const body = await request.json();

    // Create draft emission entry linked to this task
    const entry = await createEmissionEntry(session.idToken, {
      ...body,
      taskId: params.id,
    });

    // Submit the task for review with the new entry
    await updateTask(session.idToken, params.id, {
      status: "submitted",
      emissionEntryId: entry.id,
    });

    return json({ success: true, entry });
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 400) {
        return json(
          {
            success: false,
            error: err.body.error || "Validation failed. Please check your input.",
          },
          { status: 400 }
        );
      }
      if (err.status === 404) {
        return json(
          { success: false, error: "Task or resource not found." },
          { status: 404 }
        );
      }
      if (err.status === 422) {
        return json(
          {
            success: false,
            error: err.body.error || "Could not calculate emissions. Please check your input.",
          },
          { status: 422 }
        );
      }
    }
    console.error("Failed to submit task entry:", err);
    return json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
};
