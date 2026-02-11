import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { JwtCustomClaims } from '$lib/api/types.js';

/** Seconds before actual expiry to consider a token expired (prevents race conditions) */
const EXPIRY_BUFFER_SECONDS = 60;

/** Set httpOnly auth cookies after successful authentication */
export function setAuthCookies(
	cookies: Cookies,
	tokens: { accessToken: string; idToken: string; refreshToken: string; expiresIn: number }
) {
	const cookieOptions = {
		path: '/',
		httpOnly: true,
		sameSite: 'strict' as const,
		secure: !dev
	};

	cookies.set('accessToken', tokens.accessToken, {
		...cookieOptions,
		maxAge: tokens.expiresIn
	});

	cookies.set('idToken', tokens.idToken, {
		...cookieOptions,
		maxAge: tokens.expiresIn
	});

	cookies.set('refreshToken', tokens.refreshToken, {
		...cookieOptions,
		maxAge: 60 * 60 * 24 * 30
	});
}

/** Remove all auth cookies */
export function clearAuthCookies(cookies: Cookies) {
	const cookieOptions = { path: '/' };
	cookies.delete('accessToken', cookieOptions);
	cookies.delete('idToken', cookieOptions);
	cookies.delete('refreshToken', cookieOptions);
}

/** Decode a JWT payload without signature verification (server-side only) */
function parseJwtPayload(token: string): Record<string, unknown> {
	const parts = token.split('.');
	if (parts.length !== 3) return {};

	const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
	const json = atob(base64);
	return JSON.parse(json);
}

/** Check if a JWT token is expired (with buffer) */
export function isTokenExpired(token: string): boolean {
	try {
		const payload = parseJwtPayload(token);
		const exp = payload.exp as number | undefined;
		if (!exp) return true;

		const nowSeconds = Math.floor(Date.now() / 1000);
		return nowSeconds >= exp - EXPIRY_BUFFER_SECONDS;
	} catch {
		return true;
	}
}

/** Extract session data from access + id tokens */
export function getSessionFromTokens(
	accessToken: string,
	idToken: string
): App.Locals['session'] {
	try {
		const claims = parseJwtPayload(idToken) as unknown as JwtCustomClaims;

		return {
			accessToken,
			user: {
				id: claims['custom:user_id'],
				email: claims.email,
				tenantId: claims['custom:tenant_id'],
				role: claims['custom:tenant_role'] as 'owner' | 'admin' | 'user',
				givenName: claims.given_name,
				familyName: claims.family_name
			}
		};
	} catch {
		return null;
	}
}
