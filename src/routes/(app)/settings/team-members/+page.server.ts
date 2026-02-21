import { error, redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import type { Actions, PageServerLoad } from "./$types.js";
import {
  fetchUsers,
  updateUserRole,
  deactivateUser,
  fetchAssignments,
  replaceAssignments,
} from "$lib/api/users.js";
import { fetchInvites, createInvite, revokeInvite } from "$lib/api/invites.js";
import { getOrgUnitsTree } from "$lib/api/org-units.js";
import { ApiError } from "$lib/api/client.js";
import {
  changeRoleSchema,
  updateAssignmentsSchema,
  deactivateUserSchema,
} from "$lib/schemas/user-management.js";
import { createInviteSchema, revokeInviteSchema } from "$lib/schemas/invite.js";
import type { TenantRole } from "$lib/api/types.js";

const VALID_ROLES: TenantRole[] = [
  "viewer",
  "data_entry",
  "data_approver",
  "tenant_admin",
  "super_admin",
];
const ADMIN_ROLES: TenantRole[] = ["tenant_admin", "super_admin"];

function requireAdmin(locals: App.Locals) {
  const session = locals.session!;
  if (!ADMIN_ROLES.includes(session.user.role)) {
    error(403, "Forbidden");
  }
  return session;
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const session = requireAdmin(locals);

  // Parse query params for search/filter
  const search = url.searchParams.get("search") || undefined;
  const roleParam = url.searchParams.get("role") || undefined;
  const role =
    roleParam && VALID_ROLES.includes(roleParam as TenantRole)
      ? (roleParam as TenantRole)
      : undefined;
  const includeInactive = url.searchParams.get("includeInactive") === "true";

  try {
    const [usersResponse, invitesResponse, orgTree] = await Promise.all([
      fetchUsers(session.idToken, {
        search,
        role,
        includeInactive,
        limit: 200,
      }),
      fetchInvites(session.idToken, { limit: 200 }),
      getOrgUnitsTree(session.idToken),
    ]);

    const [
      changeRoleForm,
      deactivateForm,
      assignmentsForm,
      createInviteForm,
      revokeInviteForm,
    ] = await Promise.all([
      superValidate(zod4(changeRoleSchema)),
      superValidate(zod4(deactivateUserSchema)),
      superValidate(zod4(updateAssignmentsSchema)),
      superValidate(zod4(createInviteSchema)),
      superValidate(zod4(revokeInviteSchema)),
    ]);

    return {
      users: usersResponse.users,
      invites: invitesResponse.invites,
      orgTree: orgTree.data,
      currentUserId: session.user.id,
      currentUserRole: session.user.role,
      changeRoleForm,
      deactivateForm,
      assignmentsForm,
      createInviteForm,
      revokeInviteForm,
      filters: { search: search || "", role: roleParam || "", includeInactive },
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const actions: Actions = {
  changeRole: async ({ request, locals }) => {
    const session = requireAdmin(locals);
    const form = await superValidate(request, zod4(changeRoleSchema));

    if (!form.valid) {
      return message(form, "Please select a valid role.", { status: 400 });
    }

    try {
      await updateUserRole(session.idToken, form.data.userId, form.data.role);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          return message(
            form,
            err.body.error || "Cannot demote the last Super Admin.",
            { status: 409 }
          );
        }
        if (err.status === 403) {
          return message(
            form,
            "You do not have permission to change this role.",
            { status: 403 }
          );
        }
        if (err.status === 404) {
          return message(form, "User not found.", { status: 404 });
        }
      }
      return message(form, "Something went wrong. Please try again.", {
        status: 500,
      });
    }

    return message(form, "Role updated successfully.");
  },

  deactivate: async ({ request, locals }) => {
    const session = requireAdmin(locals);
    const form = await superValidate(request, zod4(deactivateUserSchema));

    if (!form.valid) {
      return message(form, "Invalid request.", { status: 400 });
    }

    try {
      await deactivateUser(session.idToken, form.data.userId);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          return message(
            form,
            err.body.error || "Cannot deactivate the last Super Admin.",
            { status: 409 }
          );
        }
        if (err.status === 403) {
          return message(
            form,
            err.body.error || "You cannot deactivate this user.",
            { status: 403 }
          );
        }
        if (err.status === 404) {
          return message(form, "User not found.", { status: 404 });
        }
      }
      return message(form, "Something went wrong. Please try again.", {
        status: 500,
      });
    }

    return message(form, "User deactivated successfully.");
  },

  updateAssignments: async ({ request, locals }) => {
    const session = requireAdmin(locals);
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const orgUnitIdsRaw = formData.get("orgUnitIds") as string;

    let orgUnitIds: string[];
    try {
      orgUnitIds = JSON.parse(orgUnitIdsRaw);
    } catch {
      const form = await superValidate(zod4(updateAssignmentsSchema));
      return message(form, "Invalid assignment data.", { status: 400 });
    }

    const parsed = updateAssignmentsSchema.safeParse({ userId, orgUnitIds });
    if (!parsed.success) {
      const form = await superValidate(zod4(updateAssignmentsSchema));
      return message(form, "Invalid assignment data.", { status: 400 });
    }

    try {
      await replaceAssignments(session.idToken, userId, orgUnitIds);
    } catch (err) {
      const form = await superValidate(zod4(updateAssignmentsSchema));
      if (err instanceof ApiError) {
        return message(
          form,
          err.body.error || "Failed to update assignments.",
          { status: err.status as any }
        );
      }
      return message(form, "Something went wrong. Please try again.", {
        status: 500,
      });
    }

    const form = await superValidate(zod4(updateAssignmentsSchema));
    return message(form, "Assignments updated successfully.");
  },

  createInvite: async ({ request, locals }) => {
    const session = requireAdmin(locals);
    const form = await superValidate(request, zod4(createInviteSchema));

    if (!form.valid) {
      return message(form, "Please check the invite details.", { status: 400 });
    }

    try {
      await createInvite(session.idToken, {
        email: form.data.email,
        role: form.data.role,
        expiresInDays: form.data.expiresInDays,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          return message(
            form,
            "Cannot invite a user with a role equal to or above your own.",
            { status: 403 }
          );
        }
        if (err.status === 409) {
          return message(
            form,
            "A pending invitation already exists for this email.",
            { status: 409 }
          );
        }
        if (err.status === 422) {
          return message(
            form,
            "This user already exists in your organization.",
            { status: 422 }
          );
        }
        if (err.status === 502) {
          return message(
            form,
            "Invite created but the email could not be sent. You can revoke and re-create the invite, or ask the recipient to check their spam folder.",
            { status: 502 }
          );
        }
      }
      return message(form, "Something went wrong. Please try again.", {
        status: 500,
      });
    }

    return message(form, "Invitation sent successfully.");
  },

  revokeInvite: async ({ request, locals }) => {
    const session = requireAdmin(locals);
    const form = await superValidate(request, zod4(revokeInviteSchema));

    if (!form.valid) {
      return message(form, "Invalid request.", { status: 400 });
    }

    try {
      await revokeInvite(session.idToken, form.data.inviteId);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          return message(form, "Invitation not found.", { status: 404 });
        }
        if (err.status === 409) {
          return message(
            form,
            err.body.error || "This invitation can no longer be revoked.",
            { status: 409 }
          );
        }
      }
      return message(form, "Something went wrong. Please try again.", {
        status: 500,
      });
    }

    return message(form, "Invitation revoked successfully.");
  },

  fetchAssignments: async ({ request, locals }) => {
    const session = requireAdmin(locals);
    const formData = await request.formData();
    const userId = formData.get("userId") as string;

    try {
      const assignments = await fetchAssignments(session.idToken, userId);
      return { assignments };
    } catch (err) {
      if (err instanceof ApiError) {
        return { assignments: [], error: err.body.error };
      }
      return { assignments: [], error: "Failed to load assignments." };
    }
  },
};
