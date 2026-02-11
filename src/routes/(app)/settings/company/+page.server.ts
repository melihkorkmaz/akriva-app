import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { getTenant, updateTenantSettings } from '$lib/api/tenant.js';
import { ApiError } from '$lib/api/client.js';
import { tenantSettingsSchema } from '$lib/schemas/tenant-settings.js';
import type { UpdateTenantSettingsRequest } from '$lib/api/types.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session!; // App layout guard ensures session exists
	const tenant = await getTenant(session.idToken, session.user.tenantId);

	const form = await superValidate(
		{
			name: tenant.name,
			slug: tenant.slug,
			hqCountry: tenant.hqCountry,
			stateProvince: tenant.stateProvince,
			city: tenant.city,
			reportingCurrency: tenant.reportingCurrency,
			fiscalYearStartMonth: tenant.fiscalYearStartMonth,
			fiscalYearStartDay: tenant.fiscalYearStartDay,
			baseYear: tenant.baseYear,
			sector: tenant.sector,
			subSector: tenant.subSector,
			consolidationApproach: tenant.consolidationApproach
		},
		zod4(tenantSettingsSchema)
	);

	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const session = locals.session!;
		const form = await superValidate(request, zod4(tenantSettingsSchema));

		if (!form.valid) {
			return message(form, 'Please check your information and try again.', { status: 400 });
		}

		try {
			const payload: UpdateTenantSettingsRequest = {
				name: form.data.name,
				slug: form.data.slug,
				hqCountry: form.data.hqCountry ?? null,
				stateProvince: form.data.stateProvince ?? null,
				city: form.data.city ?? null,
				reportingCurrency: form.data.reportingCurrency ?? null,
				fiscalYearStartMonth: form.data.fiscalYearStartMonth ?? null,
				fiscalYearStartDay: form.data.fiscalYearStartDay ?? null,
				baseYear: form.data.baseYear ?? null,
				sector: form.data.sector ?? null,
				subSector: form.data.subSector ?? null,
				consolidationApproach: form.data.consolidationApproach ?? null
			};

			await updateTenantSettings(session.idToken, payload);
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 400 && err.body.code === 'VALIDATION_FAILED') {
					return message(
						form,
						err.body.error || 'Please check your information and try again.',
						{ status: 400 }
					);
				}

				if (err.status === 404) {
					return message(form, 'Tenant not found.', { status: 404 });
				}
			}

			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		return message(form, 'Settings saved successfully.');
	}
};
