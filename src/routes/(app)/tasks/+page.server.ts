import type { PageServerLoad } from './$types.js';
import { getMyTasks } from '$lib/api/tasks.js';
import { listCampaigns } from '$lib/api/campaigns.js';
import { listIndicators } from '$lib/api/indicators.js';
import { getOrgUnitsTree } from '$lib/api/org-units.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session!;

	try {
		const [tasks, campaigns, indicators, orgTree] = await Promise.all([
			getMyTasks(session.idToken),
			listCampaigns(session.idToken),
			listIndicators(session.idToken),
			getOrgUnitsTree(session.idToken)
		]);

		return {
			tasks,
			campaigns,
			indicators,
			orgTree: orgTree.data
		};
	} catch (err) {
		console.error('Failed to load tasks:', err);
		return {
			tasks: [],
			campaigns: [],
			indicators: [],
			orgTree: []
		};
	}
};
