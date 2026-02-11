import type { Handle } from '@sveltejs/kit';
import { refreshTokens } from '$lib/api/auth.js';
import { ApiError } from '$lib/api/client.js';
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
		// Both tokens present and access token not expired — establish session from claims
		event.locals.session = getSessionFromTokens(accessToken, idToken);
	} else if (refreshToken) {
		// Access token missing or expired — attempt refresh
		try {
			const newTokens = await refreshTokens({ refreshToken });
			setAuthCookies(event.cookies, newTokens);
			event.locals.session = getSessionFromTokens(newTokens.accessToken, newTokens.idToken);
		} catch (error) {
			clearAuthCookies(event.cookies);
			event.locals.session = null;

			if (error instanceof ApiError && error.status === 401) {
				console.info('[auth] Refresh token expired or revoked, session cleared');
			} else {
				console.error('[auth] Token refresh failed:', error instanceof Error ? error.message : error);
			}
		}
	} else {
		// No tokens present — unauthenticated request
		event.locals.session = null;
	}

	return resolve(event);
};
