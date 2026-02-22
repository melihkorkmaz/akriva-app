import { error, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { createCampaign } from '$lib/api/campaigns.js';
import { listIndicators } from '$lib/api/indicators.js';
import { listWorkflowTemplates } from '$lib/api/workflow-templates.js';
import { getOrgUnitsTree } from '$lib/api/org-units.js';
import { fetchUsers } from '$lib/api/users.js';
import { ApiError } from '$lib/api/client.js';
import { createCampaignSchema } from '$lib/schemas/campaign.js';
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

	const [indicators, templates, orgTree, userList] = await Promise.all([
		listIndicators(session.idToken),
		listWorkflowTemplates(session.idToken),
		getOrgUnitsTree(session.idToken),
		fetchUsers(session.idToken)
	]);

	const activeTemplates = templates.data.filter((t) => t.status === 'active');

	const form = await superValidate(
		{ reportingYear: new Date().getFullYear(), approvalTiers: 1 },
		zod4(createCampaignSchema)
	);

	return {
		form,
		indicators,
		workflowTemplates: activeTemplates,
		orgTree: orgTree.data,
		users: userList.users
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const session = requireAdmin(locals);
		const form = await superValidate(request, zod4(createCampaignSchema));

		if (!form.valid) {
			return message(form, 'Please check your input.', { status: 400 });
		}

		try {
			const created = await createCampaign(session.idToken, {
				name: form.data.name,
				indicatorId: form.data.indicatorId,
				workflowTemplateId: form.data.workflowTemplateId,
				approvalTiers: form.data.approvalTiers,
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
