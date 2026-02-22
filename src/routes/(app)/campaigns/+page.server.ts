import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { listCampaigns, deleteCampaign } from '$lib/api/campaigns.js';
import { listIndicators } from '$lib/api/indicators.js';
import { ApiError } from '$lib/api/client.js';
import type { TenantRole, CampaignStatus } from '$lib/api/types.js';

const ADMIN_ROLES: TenantRole[] = ['tenant_admin', 'super_admin'];
const VALID_STATUSES: CampaignStatus[] = ['draft', 'active', 'closed'];

function requireAdmin(locals: App.Locals) {
	const session = locals.session!;
	if (!ADMIN_ROLES.includes(session.user.role)) {
		error(403, 'Forbidden');
	}
	return session;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = requireAdmin(locals);

	// Parse filter params
	const statusParam = url.searchParams.get('status') || undefined;
	const status =
		statusParam && VALID_STATUSES.includes(statusParam as CampaignStatus)
			? statusParam
			: undefined;
	const reportingYear = url.searchParams.get('reportingYear') || undefined;

	try {
		const [campaigns, indicators] = await Promise.all([
			listCampaigns(session.idToken, { status, reportingYear }),
			listIndicators(session.idToken)
		]);

		return {
			campaigns,
			indicators,
			filters: {
				status: statusParam || '',
				reportingYear: reportingYear || ''
			}
		};
	} catch (err) {
		if (err instanceof ApiError) {
			if (err.status === 403) {
				error(403, 'You do not have permission to view campaigns.');
			}
		}
		error(500, 'Failed to load campaigns.');
	}
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		const session = requireAdmin(locals);
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return { success: false, error: 'Invalid request.' };
		}

		try {
			await deleteCampaign(session.idToken, id);
			return { success: true };
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 404) {
					return { success: false, error: 'Campaign not found.' };
				}
				if (err.status === 409) {
					return {
						success: false,
						error: err.body.error || 'Only draft campaigns can be deleted.'
					};
				}
				if (err.status === 403) {
					return {
						success: false,
						error: 'You do not have permission to delete this campaign.'
					};
				}
			}
			return { success: false, error: 'Something went wrong. Please try again.' };
		}
	}
};
