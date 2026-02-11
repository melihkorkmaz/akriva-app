import { redirect } from '@sveltejs/kit';
import { clearAuthCookies } from '$lib/server/auth.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ cookies }) => {
	clearAuthCookies(cookies);
	redirect(302, '/signin');
};
