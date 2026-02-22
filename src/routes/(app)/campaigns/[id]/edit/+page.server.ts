import { error, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { getCampaign, updateCampaign, activateCampaign } from '$lib/api/campaigns.js';
import { listIndicators } from '$lib/api/indicators.js';
import { listWorkflowTemplates } from '$lib/api/workflow-templates.js';
import { getOrgUnitsTree } from '$lib/api/org-units.js';
import { fetchUsers } from '$lib/api/users.js';
import { ApiError } from '$lib/api/client.js';
import { requireAdmin } from '$lib/server/auth.js';
import { createCampaignSchema } from '$lib/schemas/campaign.js';

export const load: PageServerLoad = async ({ locals, params }) => {
	requireAdmin(locals);
	const session = locals.session!;

	const [campaign, indicators, templates, orgTree, userList] = await Promise.all([
		getCampaign(session.idToken, params.id),
		listIndicators(session.idToken),
		listWorkflowTemplates(session.idToken),
		getOrgUnitsTree(session.idToken),
		fetchUsers(session.idToken)
	]);

	// Only draft campaigns can be edited
	if (campaign.status !== 'draft') {
		redirect(303, `/campaigns/${params.id}`);
	}

	const activeTemplates = templates.data.filter((t) => t.status === 'active');

	const form = await superValidate(
		{
			name: campaign.name,
			indicatorId: campaign.indicatorId,
			workflowTemplateId: campaign.workflowTemplateId,
			approvalTiers: campaign.approvalTiers,
			reportingYear: campaign.reportingYear,
			periodStart: campaign.periodStart,
			periodEnd: campaign.periodEnd,
			orgUnitIds: campaign.orgUnits.map((ou) => ou.orgUnitId)
		},
		zod4(createCampaignSchema)
	);

	return {
		campaign,
		form,
		indicators,
		workflowTemplates: activeTemplates,
		orgTree: orgTree.data,
		users: userList.users
	};
};

export const actions: Actions = {
	default: async ({ request, locals, params }) => {
		requireAdmin(locals);
		const session = locals.session!;
		const form = await superValidate(request, zod4(createCampaignSchema));

		if (!form.valid) {
			return message(form, 'Please check your input.', { status: 400 });
		}

		try {
			await updateCampaign(session.idToken, params.id, {
				name: form.data.name,
				indicatorId: form.data.indicatorId,
				workflowTemplateId: form.data.workflowTemplateId,
				approvalTiers: form.data.approvalTiers,
				reportingYear: form.data.reportingYear,
				periodStart: form.data.periodStart,
				periodEnd: form.data.periodEnd,
				orgUnitIds: form.data.orgUnitIds
			});

			return message(form, 'Campaign updated successfully.');
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 400) {
					return message(
						form,
						err.body.error || 'Please check your input.',
						{ status: 400 }
					);
				}
				if (err.status === 404) {
					return message(form, 'Campaign not found.', { status: 404 });
				}
				if (err.status === 409) {
					return message(
						form,
						err.body.error || 'Campaign cannot be updated.',
						{ status: 409 }
					);
				}
				if (err.status === 403) {
					return message(
						form,
						'You do not have permission to update this campaign.',
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
			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}
	},

	activate: async ({ locals, params }) => {
		requireAdmin(locals);
		const session = locals.session!;

		try {
			await activateCampaign(session.idToken, params.id);
			redirect(303, `/campaigns/${params.id}`);
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 400) {
					error(400, err.body.error || 'Campaign cannot be activated.');
				}
				if (err.status === 404) {
					error(404, 'Campaign not found.');
				}
				if (err.status === 409) {
					error(409, err.body.error || 'Campaign is not in a state that can be activated.');
				}
			}
			// Re-throw redirect
			throw err;
		}
	}
};
