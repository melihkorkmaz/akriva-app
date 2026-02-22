import { error } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import {
	listIndicators,
	createIndicator,
	updateIndicator,
	deleteIndicator
} from '$lib/api/indicators.js';
import { ApiError } from '$lib/api/client.js';
import { createIndicatorSchema, updateIndicatorSchema } from '$lib/schemas/indicator.js';
import type { TenantRole } from '$lib/api/types.js';

const ADMIN_ROLES: TenantRole[] = ['tenant_admin', 'super_admin'];

function requireAdmin(locals: App.Locals) {
	const session = locals.session!;
	if (!ADMIN_ROLES.includes(session.user.role)) {
		error(403, 'Forbidden');
	}
	return session;
}

export const load: PageServerLoad = async ({ locals }) => {
	const session = requireAdmin(locals);

	try {
		const [indicators, createForm, updateForm] = await Promise.all([
			listIndicators(session.idToken),
			superValidate(zod4(createIndicatorSchema)),
			superValidate(zod4(updateIndicatorSchema))
		]);

		return {
			indicators,
			createForm,
			updateForm
		};
	} catch (err) {
		if (err instanceof ApiError) {
			if (err.status === 403) {
				error(403, 'You do not have permission to view indicators.');
			}
		}
		error(500, 'Failed to load indicators.');
	}
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const session = requireAdmin(locals);
		const form = await superValidate(request, zod4(createIndicatorSchema));

		if (!form.valid) {
			return message(form, 'Please check the indicator details.', { status: 400 });
		}

		try {
			await createIndicator(session.idToken, {
				name: form.data.name,
				emissionCategory: form.data.emissionCategory,
				calculationMethod: form.data.calculationMethod,
				defaultFuelType: form.data.defaultFuelType || null,
				defaultGasType: form.data.defaultGasType || null
			});
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 409) {
					return message(
						form,
						err.body.error || 'An indicator with this name already exists.',
						{ status: 409 }
					);
				}
				if (err.status === 403) {
					return message(form, 'You do not have permission to create indicators.', {
						status: 403
					});
				}
			}
			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		return message(form, 'Indicator created successfully.');
	},

	update: async ({ request, locals }) => {
		const session = requireAdmin(locals);
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			const form = await superValidate(zod4(updateIndicatorSchema));
			return message(form, 'Invalid request.', { status: 400 });
		}

		const form = await superValidate(formData, zod4(updateIndicatorSchema));

		if (!form.valid) {
			return message(form, 'Please check the indicator details.', { status: 400 });
		}

		try {
			await updateIndicator(session.idToken, id, {
				name: form.data.name,
				defaultFuelType: form.data.defaultFuelType || null,
				defaultGasType: form.data.defaultGasType || null,
				isActive: form.data.isActive
			});
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 404) {
					return message(form, 'Indicator not found.', { status: 404 });
				}
				if (err.status === 409) {
					return message(
						form,
						err.body.error || 'An indicator with this name already exists.',
						{ status: 409 }
					);
				}
				if (err.status === 403) {
					return message(form, 'You do not have permission to update indicators.', {
						status: 403
					});
				}
			}
			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		return message(form, 'Indicator updated successfully.');
	},

	delete: async ({ request, locals }) => {
		const session = requireAdmin(locals);
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			const form = await superValidate(zod4(updateIndicatorSchema));
			return message(form, 'Invalid request.', { status: 400 });
		}

		const form = await superValidate(zod4(updateIndicatorSchema));

		try {
			await deleteIndicator(session.idToken, id);
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 404) {
					return message(form, 'Indicator not found.', { status: 404 });
				}
				if (err.status === 409) {
					return message(
						form,
						err.body.error || 'This indicator cannot be deleted.',
						{ status: 409 }
					);
				}
				if (err.status === 403) {
					return message(form, 'You do not have permission to delete indicators.', {
						status: 403
					});
				}
			}
			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		return message(form, 'Indicator deleted successfully.');
	}
};
