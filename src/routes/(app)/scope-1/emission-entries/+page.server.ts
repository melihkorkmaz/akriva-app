import type { PageServerLoad } from './$types.js';
import { getOrgUnitsTree } from '$lib/api/org-units.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session!;
	const treeResponse = await getOrgUnitsTree(session.idToken);

	return {
		tree: treeResponse.data
	};
};
