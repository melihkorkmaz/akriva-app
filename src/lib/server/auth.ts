import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';

/** Set httpOnly auth cookies after successful authentication */
export function setAuthCookies(
	cookies: Cookies,
	tokens: { accessToken: string; refreshToken: string; expiresIn: number }
) {
	cookies.set('accessToken', tokens.accessToken, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: !dev,
		maxAge: tokens.expiresIn
	});

	cookies.set('refreshToken', tokens.refreshToken, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: !dev,
		maxAge: 60 * 60 * 24 * 30
	});
}
