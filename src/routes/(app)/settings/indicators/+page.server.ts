import { error, fail } from "@sveltejs/kit";
import { message, superValidate, type ErrorStatus } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import type { Actions, PageServerLoad } from "./$types.js";
import {
  listIndicators,
  createIndicator,
  updateIndicator,
  deleteIndicator,
} from "$lib/api/indicators.js";
import { ApiError } from "$lib/api/client.js";
import { requireAdmin } from "$lib/server/auth.js";
import {
  createIndicatorSchema,
  updateIndicatorSchema,
} from "$lib/schemas/indicator.js";

export const load: PageServerLoad = async ({ locals }) => {
  requireAdmin(locals);
  const session = locals.session!;

  try {
    const [indicators, createForm, updateForm] = await Promise.all([
      listIndicators(session.idToken),
      superValidate(zod4(createIndicatorSchema)),
      superValidate(zod4(updateIndicatorSchema)),
    ]);

    return {
      indicators,
      createForm,
      updateForm,
    };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 403) {
        error(403, "You do not have permission to view indicators.");
      }
    }
    error(500, "Failed to load indicators.");
  }
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    requireAdmin(locals);
    const session = locals.session!;
    const form = await superValidate(request, zod4(createIndicatorSchema));

    if (!form.valid) {
      return message(form, "Please check the indicator details.", {
        status: 400,
      });
    }

    try {
      await createIndicator(session.idToken, {
        name: form.data.name,
        emissionCategory: form.data.emissionCategory,
        methodVariant: form.data.methodVariant ?? null,
      });
    } catch (err) {
      console.error('[indicators/create] Error:', err);
      if (err instanceof ApiError) {
        return message(
          form,
          err.body.error || "Something went wrong. Please try again.",
          { status: err.status as ErrorStatus }
        );
      }
      const errMsg = err instanceof Error ? err.message : String(err);
      return message(form, errMsg || "Something went wrong. Please try again.", {
        status: 500,
      });
    }

    return message(form, "Indicator created successfully.");
  },

  update: async ({ request, locals }) => {
    requireAdmin(locals);
    const session = locals.session!;
    const formData = await request.formData();
    const id = formData.get("id") as string;

    if (!id) {
      const form = await superValidate(zod4(updateIndicatorSchema));
      return message(form, "Invalid request.", { status: 400 });
    }

    const form = await superValidate(formData, zod4(updateIndicatorSchema));

    if (!form.valid) {
      return message(form, "Please check the indicator details.", {
        status: 400,
      });
    }

    try {
      await updateIndicator(session.idToken, id, {
        name: form.data.name,
        isActive: form.data.isActive,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          return message(form, "Indicator not found.", { status: 404 });
        }
        if (err.status === 409) {
          return message(
            form,
            err.body.error || "An indicator with this name already exists.",
            { status: 409 }
          );
        }
        if (err.status === 403) {
          return message(
            form,
            "You do not have permission to update indicators.",
            {
              status: 403,
            }
          );
        }
      }
      return message(form, "Something went wrong. Please try again.", {
        status: 500,
      });
    }

    return message(form, "Indicator updated successfully.");
  },

  delete: async ({ request, locals }) => {
    requireAdmin(locals);
    const session = locals.session!;
    const formData = await request.formData();
    const id = formData.get("id") as string;

    if (!id) {
      return fail(400, { message: "Invalid request." });
    }

    try {
      await deleteIndicator(session.idToken, id);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          return fail(404, { message: "Indicator not found." });
        }
        if (err.status === 409) {
          return fail(409, {
            message: err.body.error || "This indicator cannot be deleted.",
          });
        }
        if (err.status === 403) {
          return fail(403, {
            message: "You do not have permission to delete indicators.",
          });
        }
      }
      return fail(500, { message: "Something went wrong. Please try again." });
    }

    return { success: true };
  },
};
