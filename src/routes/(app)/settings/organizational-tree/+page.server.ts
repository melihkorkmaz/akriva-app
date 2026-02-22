import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { getOrgUnitsTree, createOrgUnit, updateOrgUnit, deleteOrgUnit } from '$lib/api/org-units.js';
import { getApplicationSettings } from '$lib/api/tenant.js';
import {
	listEmissionSources,
	createEmissionSource,
	updateEmissionSource,
	deleteEmissionSource
} from '$lib/api/emission-sources.js';
import { ApiError } from '$lib/api/client.js';
import { createOrgUnitSchema, updateOrgUnitSchema } from '$lib/schemas/org-unit.js';
import { createEmissionSourceSchema, updateEmissionSourceSchema } from '$lib/schemas/emission-source.js';
import type { CreateOrgUnitRequest, UpdateOrgUnitRequest, GwpVersion } from '$lib/api/types.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session!;
	const [treeResponse, tenantSettings, emissionSources] = await Promise.all([
		getOrgUnitsTree(session.idToken),
		getApplicationSettings(session.idToken),
		listEmissionSources(session.idToken)
	]);

	const [createForm, updateForm] = await Promise.all([
		superValidate(zod4(createOrgUnitSchema)),
		superValidate(zod4(updateOrgUnitSchema))
	]);

	return {
		tree: treeResponse.data,
		total: treeResponse.total,
		tenantSettings,
		createForm,
		updateForm,
		emissionSources
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
	},

	createSource: async ({ request, locals }) => {
		const session = locals.session!;
		const form = await superValidate(request, zod4(createEmissionSourceSchema));

		if (!form.valid) {
			return message(form, 'Please check your information and try again.', { status: 400 });
		}

		try {
			await createEmissionSource(session.idToken, {
				orgUnitId: form.data.orgUnitId,
				category: form.data.category,
				name: form.data.name,
				meterNumber: form.data.meterNumber ?? null,
				vehicleType: form.data.vehicleType ?? null,
				technology: form.data.technology ?? null,
				defaultFuelType: form.data.defaultFuelType ?? null,
				defaultGasType: form.data.defaultGasType ?? null
			});
			return message(form, 'Emission source created successfully.');
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 400 && err.body.code === 'VALIDATION_FAILED') {
					return message(form, err.body.error || 'Validation failed.', { status: 400 });
				}
				if (err.status === 409) {
					return message(form, 'An emission source with this name already exists.', { status: 409 });
				}
				if (err.status === 403) {
					return message(form, "You don't have permission to perform this action.", { status: 403 });
				}
			}
			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}
	},

	updateSource: async ({ request, locals }) => {
		const session = locals.session!;
		const formData = await request.formData();
		const sourceId = formData.get('sourceId');

		const form = await superValidate(formData, zod4(updateEmissionSourceSchema));

		if (!sourceId || typeof sourceId !== 'string') {
			return message(form, 'Missing emission source ID.', { status: 400 });
		}

		if (!form.valid) {
			return message(form, 'Please check your information and try again.', { status: 400 });
		}

		try {
			await updateEmissionSource(session.idToken, sourceId, {
				name: form.data.name,
				meterNumber: form.data.meterNumber ?? null,
				vehicleType: form.data.vehicleType ?? null,
				technology: form.data.technology ?? null,
				defaultFuelType: form.data.defaultFuelType ?? null,
				defaultGasType: form.data.defaultGasType ?? null,
				isActive: form.data.isActive
			});
			return message(form, 'Emission source updated successfully.');
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 400 && err.body.code === 'VALIDATION_FAILED') {
					return message(form, err.body.error || 'Validation failed.', { status: 400 });
				}
				if (err.status === 404) {
					return message(form, 'Emission source not found.', { status: 404 });
				}
				if (err.status === 403) {
					return message(form, "You don't have permission to perform this action.", { status: 403 });
				}
			}
			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}
	},

	deleteSource: async ({ request, locals }) => {
		const session = locals.session!;
		const formData = await request.formData();
		const sourceId = formData.get('sourceId');

		if (!sourceId || typeof sourceId !== 'string') {
			return { success: false, error: 'Missing emission source ID.' };
		}

		try {
			await deleteEmissionSource(session.idToken, sourceId);
			return { success: true };
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 409) {
					return {
						success: false,
						error: 'This source has associated emission entries. Remove them first.'
					};
				}
				if (err.status === 404) {
					return { success: false, error: 'Emission source not found.' };
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
