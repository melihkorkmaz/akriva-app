import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { fetchUsers, updateUserRole, deactivateUser, fetchAssignments, replaceAssignments } from '$lib/api/users.js';
import { getOrgUnitsTree } from '$lib/api/org-units.js';
import { ApiError } from '$lib/api/client.js';
import { changeRoleSchema, updateAssignmentsSchema, deactivateUserSchema } from '$lib/schemas/user-management.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals.session!;

	// Route guard: admin-only
	if (session.user.role !== 'tenant_admin' && session.user.role !== 'super_admin') {
		redirect(302, '/settings/company');
	}

	// Parse query params for search/filter
	const search = url.searchParams.get('search') || undefined;
	const role = url.searchParams.get('role') || undefined;
	const includeInactive = url.searchParams.get('includeInactive') === 'true';

	const [usersResponse, orgTree] = await Promise.all([
		fetchUsers(session.idToken, {
			search,
			role: role as any,
			includeInactive,
			limit: 200
		}),
		getOrgUnitsTree(session.idToken)
	]);

	const [changeRoleForm, deactivateForm, assignmentsForm] = await Promise.all([
		superValidate(zod4(changeRoleSchema)),
		superValidate(zod4(deactivateUserSchema)),
		superValidate(zod4(updateAssignmentsSchema))
	]);

	return {
		users: usersResponse.users,
		orgTree: orgTree.data,
		currentUserId: session.user.id,
		changeRoleForm,
		deactivateForm,
		assignmentsForm,
		filters: { search: search || '', role: role || '', includeInactive }
	};
};

export const actions: Actions = {
	changeRole: async ({ request, locals }) => {
		const session = locals.session!;
		const form = await superValidate(request, zod4(changeRoleSchema));

		if (!form.valid) {
			return message(form, 'Please select a valid role.', { status: 400 });
		}

		try {
			await updateUserRole(session.idToken, form.data.userId, form.data.role);
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 409) {
					return message(form, err.body.error || 'Cannot demote the last Super Admin.', { status: 409 });
				}
				if (err.status === 403) {
					return message(form, 'You do not have permission to change this role.', { status: 403 });
				}
				if (err.status === 404) {
					return message(form, 'User not found.', { status: 404 });
				}
			}
			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		return message(form, 'Role updated successfully.');
	},

	deactivate: async ({ request, locals }) => {
		const session = locals.session!;
		const form = await superValidate(request, zod4(deactivateUserSchema));

		if (!form.valid) {
			return message(form, 'Invalid request.', { status: 400 });
		}

		try {
			await deactivateUser(session.idToken, form.data.userId);
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 409) {
					return message(form, err.body.error || 'Cannot deactivate the last Super Admin.', { status: 409 });
				}
				if (err.status === 403) {
					return message(form, err.body.error || 'You cannot deactivate this user.', { status: 403 });
				}
				if (err.status === 404) {
					return message(form, 'User not found.', { status: 404 });
				}
			}
			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		return message(form, 'User deactivated successfully.');
	},

	updateAssignments: async ({ request, locals }) => {
		const session = locals.session!;
		const formData = await request.formData();
		const userId = formData.get('userId') as string;
		const orgUnitIdsRaw = formData.get('orgUnitIds') as string;

		let orgUnitIds: string[];
		try {
			orgUnitIds = JSON.parse(orgUnitIdsRaw);
		} catch {
			const form = await superValidate(zod4(updateAssignmentsSchema));
			return message(form, 'Invalid assignment data.', { status: 400 });
		}

		const parsed = updateAssignmentsSchema.safeParse({ userId, orgUnitIds });
		if (!parsed.success) {
			const form = await superValidate(zod4(updateAssignmentsSchema));
			return message(form, 'Invalid assignment data.', { status: 400 });
		}

		try {
			await replaceAssignments(session.idToken, userId, orgUnitIds);
		} catch (err) {
			const form = await superValidate(zod4(updateAssignmentsSchema));
			if (err instanceof ApiError) {
				return message(form, err.body.error || 'Failed to update assignments.', { status: err.status as any });
			}
			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		const form = await superValidate(zod4(updateAssignmentsSchema));
		return message(form, 'Assignments updated successfully.');
	},

	fetchAssignments: async ({ request, locals }) => {
		const session = locals.session!;
		const formData = await request.formData();
		const userId = formData.get('userId') as string;

		try {
			const assignments = await fetchAssignments(session.idToken, userId);
			return { assignments };
		} catch (err) {
			if (err instanceof ApiError) {
				return { assignments: [], error: err.body.error };
			}
			return { assignments: [], error: 'Failed to load assignments.' };
		}
	}
};
