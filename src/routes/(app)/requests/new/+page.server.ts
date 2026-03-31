import { error, redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import type { Actions, PageServerLoad } from "./$types.js";
import { createRequest } from "$lib/api/data-collection.js";
import { listEmissionSources } from "$lib/api/emission-sources.js";
import { getOrgUnitsTree } from "$lib/api/org-units.js";
import { ApiError } from "$lib/api/client.js";
import { requireCoordinator } from "$lib/server/auth.js";
import { createDataCollectionRequestSchema } from "$lib/schemas/data-collection-request.js";

export const load: PageServerLoad = async ({ locals }) => {
  requireCoordinator(locals);
  const session = locals.session!;

  try {
    const [orgTreeResponse, emissionSources, form] = await Promise.all([
      getOrgUnitsTree(session.idToken),
      listEmissionSources(session.idToken, { isActive: "true" }),
      superValidate(zod4(createDataCollectionRequestSchema)),
    ]);

    return {
      orgTree: orgTreeResponse.data,
      emissionSources,
      form,
    };
  } catch (err) {
    console.error("Failed to load create request data:", err);
    throw error(500, "Failed to load data for creating a request");
  }
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    requireCoordinator(locals);
    const session = locals.session!;
    const form = await superValidate(
      request,
      zod4(createDataCollectionRequestSchema)
    );

    if (!form.valid) {
      return message(form, "Please check your information and try again.", {
        status: 400,
      });
    }

    try {
      const payload = {
        title: form.data.title,
        message: form.data.message || null,
        deadline: new Date(form.data.deadline).toISOString(),
        emissionSourceIds: form.data.emissionSourceIds,
      };

      await createRequest(session.idToken, payload);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          return message(
            form,
            err.body.error || "Validation failed. Please check your input.",
            { status: 400 }
          );
        }
        if (err.status === 403) {
          return message(
            form,
            "You don't have permission to create requests.",
            { status: 403 }
          );
        }
      }
      return message(form, "Something went wrong. Please try again.", {
        status: 500,
      });
    }

    redirect(303, "/requests");
  },
};
