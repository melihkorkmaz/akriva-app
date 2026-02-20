import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { getOrgUnitsTree, createOrgUnit, updateOrgUnit, deleteOrgUnit } from '$lib/api/org-units.js';
import { getApplicationSettings } from '$lib/api/tenant.js';
import { ApiError } from '$lib/api/client.js';
import { createOrgUnitSchema, updateOrgUnitSchema } from '$lib/schemas/org-unit.js';
import type { CreateOrgUnitRequest, UpdateOrgUnitRequest, GwpVersion } from '$lib/api/types.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session!;
	const [treeResponse, tenantSettings] = await Promise.all([
		getOrgUnitsTree(session.idToken),
		getApplicationSettings(session.idToken)
	]);

	const createForm = await superValidate(zod4(createOrgUnitSchema));
	const updateForm = await superValidate(zod4(updateOrgUnitSchema));

	return {
		tree: treeResponse.data,
		total: treeResponse.total,
		tenantSettings,
		createForm,
		updateForm
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const session = locals.session!;
		const form = await superValidate(request, zod4(createOrgUnitSchema));

		if (!form.valid) {
			return message(form, 'Please check your information and try again.', { status: 400 });
		}

		try {
			const payload: CreateOrgUnitRequest = {
				parentId: form.data.parentId ?? null,
				name: form.data.name,
				type: form.data.type,
				code: form.data.code,
				description: form.data.description ?? null,
				equitySharePercentage: form.data.equitySharePercentage ?? null,
				country: form.data.country,
				stateProvince: form.data.stateProvince ?? null,
				city: form.data.city
			};

			const created = await createOrgUnit(session.idToken, payload);
			return message(form, JSON.stringify({ success: true, id: created.id }));
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 400 && err.body.code === 'VALIDATION_FAILED') {
					return message(form, err.body.error || 'Validation failed.', { status: 400 });
				}
				if (err.status === 404) {
					return message(form, 'Parent org unit not found.', { status: 404 });
				}
				if (err.status === 409) {
					return message(form, 'This code is already in use.', { status: 409 });
				}
				if (err.status === 403) {
					return message(form, "You don't have permission to perform this action.", { status: 403 });
				}
			}
			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}
	},

	update: async ({ request, locals }) => {
		const session = locals.session!;
		const formData = await request.formData();
		const id = formData.get('id');

		const form = await superValidate(formData, zod4(updateOrgUnitSchema));

		if (!id || typeof id !== 'string') {
			return message(form, 'Missing org unit ID.', { status: 400 });
		}

		if (!form.valid) {
			return message(form, 'Please check your information and try again.', { status: 400 });
		}

		try {
			// When overriding scientific authority, copy global GWP version since
			// the UI locks GWP as global-only but the API requires all 3 fields
			let gwpVersion: GwpVersion | null = null;
			if (form.data.overrideScientificAuthority) {
				const rawGwp = formData.get('effectiveGwpVersion');
				if (rawGwp !== 'ar5' && rawGwp !== 'ar6') {
					return message(form, 'GWP version is missing or invalid.', { status: 400 });
				}
				gwpVersion = rawGwp;
			}

			const payload: UpdateOrgUnitRequest = {
				name: form.data.name,
				description: form.data.description ?? null,
				equitySharePercentage: form.data.equitySharePercentage ?? null,
				status: form.data.status,
				country: form.data.country,
				stateProvince: form.data.stateProvince ?? null,
				city: form.data.city,
				overrideScientificAuthority: form.data.overrideScientificAuthority,
				gwpVersion,
				scope1Authority: form.data.overrideScientificAuthority
					? form.data.scope1Authority
					: null,
				scope2Authority: form.data.overrideScientificAuthority
					? form.data.scope2Authority
					: null
			};

			await updateOrgUnit(session.idToken, id, payload);
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 400 && err.body.code === 'VALIDATION_FAILED') {
					return message(form, err.body.error || 'Validation failed.', { status: 400 });
				}
				if (err.status === 404) {
					return message(form, 'Org unit not found.', { status: 404 });
				}
				if (err.status === 403) {
					return message(form, "You don't have permission to perform this action.", {
						status: 403
					});
				}
			}
			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		return message(form, 'Changes saved successfully.');
	},

	delete: async ({ request, locals }) => {
		const session = locals.session!;
		const formData = await request.formData();
		const id = formData.get('id');

		if (!id || typeof id !== 'string') {
			return { success: false, error: 'Missing org unit ID.' };
		}

		try {
			await deleteOrgUnit(session.idToken, id);
			return { success: true };
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 409) {
					return {
						success: false,
						error: 'This node has active children. Move or delete them first.'
					};
				}
				if (err.status === 404) {
					return { success: false, error: 'Org unit not found.' };
				}
				if (err.status === 403) {
					return {
						success: false,
						error: "You don't have permission to perform this action."
					};
				}
			}
			return { success: false, error: 'Something went wrong. Please try again.' };
		}
	}
};
