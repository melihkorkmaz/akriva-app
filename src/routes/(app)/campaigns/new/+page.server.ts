import { error, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { createCampaign } from '$lib/api/campaigns.js';
import { listIndicators } from '$lib/api/indicators.js';

import { getOrgUnitsTree } from '$lib/api/org-units.js';
import { fetchUsers } from '$lib/api/users.js';
import { ApiError } from '$lib/api/client.js';
import { requireAdmin } from '$lib/server/auth.js';
import { createCampaignSchema } from '$lib/schemas/campaign.js';

export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals);
	const session = locals.session!;

	const [indicators, orgTree, userList] = await Promise.all([
		listIndicators(session.idToken),
		getOrgUnitsTree(session.idToken),
		fetchUsers(session.idToken)
	]);

	const form = await superValidate(
		{ reportingYear: new Date().getFullYear() },
		zod4(createCampaignSchema)
	);

	return {
		form,
		indicators,
		orgTree: orgTree.data,
		users: userList.users
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		requireAdmin(locals);
		const session = locals.session!;
		const form = await superValidate(request, zod4(createCampaignSchema));

		if (!form.valid) {
			return message(form, 'Please check your input.', { status: 400 });
		}

		try {
			const created = await createCampaign(session.idToken, {
				name: form.data.name,
				indicatorId: form.data.indicatorId,
				reportingYear: form.data.reportingYear,
				periodStart: form.data.periodStart,
				periodEnd: form.data.periodEnd,
				orgUnitIds: form.data.orgUnitIds
			});

			redirect(303, `/campaigns/${created.id}`);
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 400) {
					return message(
						form,
						err.body.error || 'Please check your input.',
						{ status: 400 }
					);
				}
				if (err.status === 409) {
					return message(
						form,
						err.body.error || 'A campaign with this name already exists.',
						{ status: 409 }
					);
				}
				if (err.status === 403) {
					return message(
						form,
						'You do not have permission to create campaigns.',
						{ status: 403 }
					);
				}
				if (err.status === 422) {
					return message(
						form,
						err.body.error || 'Validation failed. Please check your input.',
						{ status: 422 }
					);
				}
			}
			// Re-throw redirect
			throw err;
		}
	}
};
