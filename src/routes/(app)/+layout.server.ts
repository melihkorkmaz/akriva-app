import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.session) {
		redirect(302, '/signin');
	}

	return { user: locals.session.user };
};
