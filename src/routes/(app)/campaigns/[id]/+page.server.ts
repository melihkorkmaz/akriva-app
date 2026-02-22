import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { getCampaign, activateCampaign, deleteCampaign, listCampaignTasks } from '$lib/api/campaigns.js';
import { listIndicators } from '$lib/api/indicators.js';
import { getOrgUnitsTree } from '$lib/api/org-units.js';
import { ApiError } from '$lib/api/client.js';
import type { TenantRole, OrgUnitTreeResponseDto, IndicatorResponseDto } from '$lib/api/types.js';

const ADMIN_ROLES: TenantRole[] = ['tenant_admin', 'super_admin'];

function requireAdmin(locals: App.Locals) {
	const session = locals.session!;
	if (!ADMIN_ROLES.includes(session.user.role)) {
		error(403, 'Forbidden');
	}
	return session;
}

/** Recursively flatten org tree into a name lookup map */
function flattenOrgTree(
	nodes: OrgUnitTreeResponseDto[],
	map: Record<string, string> = {}
): Record<string, string> {
	for (const node of nodes) {
		map[node.id] = node.name;
		if (node.children?.length) {
			flattenOrgTree(node.children, map);
		}
	}
	return map;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	const session = requireAdmin(locals);

	let campaign;
	try {
		campaign = await getCampaign(session.idToken, params.id);
	} catch (err) {
		if (err instanceof ApiError && err.status === 404) {
			error(404, 'Campaign not found.');
		}
		throw err;
	}

	// Fetch tasks only for non-draft campaigns
	const shouldFetchTasks = campaign.status !== 'draft';

	const [tasks, indicators, orgTree] = await Promise.all([
		shouldFetchTasks
			? listCampaignTasks(session.idToken, params.id)
			: Promise.resolve([]),
		listIndicators(session.idToken),
		getOrgUnitsTree(session.idToken)
	]);

	// Build lookup maps
	const orgUnitNames = flattenOrgTree(orgTree.data);
	const indicatorMap = new Map<string, IndicatorResponseDto>(
		indicators.map((ind) => [ind.id, ind])
	);
	const indicator = indicatorMap.get(campaign.indicatorId) ?? null;

	return {
		campaign,
		tasks,
		indicator,
		orgUnitNames
	};
};

export const actions: Actions = {
	activate: async ({ locals, params }) => {
		const session = requireAdmin(locals);

		try {
			const result = await activateCampaign(session.idToken, params.id);
			return { success: true, taskCount: result.taskCount };
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 400) {
					return {
						success: false,
						error: err.body.error || 'Campaign cannot be activated.'
					};
				}
				if (err.status === 404) {
					return { success: false, error: 'Campaign not found.' };
				}
				if (err.status === 409) {
					return {
						success: false,
						error: err.body.error || 'Campaign is not in a state that can be activated.'
					};
				}
				if (err.status === 403) {
					return {
						success: false,
						error: 'You do not have permission to activate this campaign.'
					};
				}
			}
			return { success: false, error: 'Something went wrong. Please try again.' };
		}
	},

	delete: async ({ locals, params }) => {
		const session = requireAdmin(locals);

		try {
			await deleteCampaign(session.idToken, params.id);
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

		redirect(303, '/campaigns');
	}
};
