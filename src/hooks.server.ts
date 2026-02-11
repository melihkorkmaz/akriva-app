import type { Handle } from '@sveltejs/kit';
import { refreshTokens } from '$lib/api/auth.js';
import {
	setAuthCookies,
	clearAuthCookies,
	isTokenExpired,
	getSessionFromTokens
} from '$lib/server/auth.js';

export const handle: Handle = async ({ event, resolve }) => {
	const accessToken = event.cookies.get('accessToken');
	const idToken = event.cookies.get('idToken');
	const refreshToken = event.cookies.get('refreshToken');

	if (accessToken && idToken && !isTokenExpired(accessToken)) {
		// Valid, non-expired tokens — establish session
		event.locals.session = getSessionFromTokens(accessToken, idToken);
	} else if (refreshToken) {
		// Access token missing or expired — attempt refresh
		try {
			const newTokens = await refreshTokens({ refreshToken });
			setAuthCookies(event.cookies, newTokens);
			event.locals.session = getSessionFromTokens(newTokens.accessToken, newTokens.idToken);
		} catch {
			// Refresh failed — clear stale cookies
			clearAuthCookies(event.cookies);
			event.locals.session = null;
		}
	} else {
		event.locals.session = null;
	}

	return resolve(event);
};
