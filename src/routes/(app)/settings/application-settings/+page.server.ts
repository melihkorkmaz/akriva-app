import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { getApplicationSettings, updateApplicationSettings } from '$lib/api/tenant.js';
import { ApiError } from '$lib/api/client.js';
import { applicationSettingsSchema } from '$lib/schemas/application-settings.js';
import type { UpdateApplicationSettingsRequest } from '$lib/api/types.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session!;
	const settings = await getApplicationSettings(session.idToken);

	const form = await superValidate(
		{
			decimalSeparator: settings.decimalSeparator,
			thousandsSeparator: settings.thousandsSeparator,
			decimalPrecision: settings.decimalPrecision,
			dateFormat: settings.dateFormat,
			timeFormat: settings.timeFormat,
			timezone: settings.timezone,
			unitSystem: settings.unitSystem,
			emissionDisplayUnit: settings.emissionDisplayUnit,
			gwpVersion: settings.gwpVersion,
			scope1Authority: settings.scope1Authority,
			scope2Authority: settings.scope2Authority
		},
		zod4(applicationSettingsSchema)
	);

	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const session = locals.session!;
		const form = await superValidate(request, zod4(applicationSettingsSchema));

		if (!form.valid) {
			return message(form, 'Please check your settings and try again.', { status: 400 });
		}

		try {
			const payload: UpdateApplicationSettingsRequest = {
				decimalSeparator: form.data.decimalSeparator,
				thousandsSeparator: form.data.thousandsSeparator,
				decimalPrecision: form.data.decimalPrecision,
				dateFormat: form.data.dateFormat,
				timeFormat: form.data.timeFormat,
				timezone: form.data.timezone,
				unitSystem: form.data.unitSystem,
				emissionDisplayUnit: form.data.emissionDisplayUnit,
				gwpVersion: form.data.gwpVersion,
				scope1Authority: form.data.scope1Authority,
				scope2Authority: form.data.scope2Authority
			};

			await updateApplicationSettings(session.idToken, payload);
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 400 && err.body.code === 'VALIDATION_FAILED') {
					return message(
						form,
						err.body.error || 'Please check your settings and try again.',
						{ status: 400 }
					);
				}

				if (err.status === 404) {
					return message(form, 'Settings not found.', { status: 404 });
				}
			}

			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		return message(form, 'Settings saved successfully.');
	}
};
