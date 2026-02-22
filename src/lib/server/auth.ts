import { error, type Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { AuthTokens, TenantRole } from '$lib/api/types.js';

const ADMIN_ROLES: TenantRole[] = ['tenant_admin', 'super_admin'];

/** Throw 403 if the user is not a tenant or super admin */
export function requireAdmin(locals: App.Locals): void {
	const session = locals.session!;
	if (!ADMIN_ROLES.includes(session.user.role)) {
		error(403, 'Forbidden');
	}
}

const VALID_ROLES: TenantRole[] = ['viewer', 'data_entry', 'data_approver', 'tenant_admin', 'super_admin'];

/** Seconds before actual JWT expiry to treat the token as expired, ensuring it remains valid for the duration of the downstream API request */
const EXPIRY_BUFFER_SECONDS = 60;

/** Session user extracted from JWT claims */
export interface SessionUser {
	id: string;
	email: string;
	tenantId: string;
	role: TenantRole;
	givenName: string;
	familyName: string;
}

/** Authenticated session established by hooks.server.ts */
export interface Session {
	/** ID token (JWT) — contains custom claims needed by backend API (custom:tenant_id, etc.) */
	idToken: string;
	user: SessionUser;
}

/** Set httpOnly auth cookies after successful authentication */
export function setAuthCookies(cookies: Cookies, tokens: AuthTokens): void {
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
		maxAge: 60 * 60 * 24 * 30 // 30 days — matches Cognito refresh token default lifetime
	});
}

/** Remove all auth cookies */
export function clearAuthCookies(cookies: Cookies): void {
	const cookieOptions = { path: '/' };
	cookies.delete('accessToken', cookieOptions);
	cookies.delete('idToken', cookieOptions);
	cookies.delete('refreshToken', cookieOptions);
}

/** Decode a JWT payload without verifying the signature. Safe here because the token was received directly from our API over HTTPS. */
function parseJwtPayload(token: string): Record<string, unknown> {
	const payload = token.split('.')[1];
	return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
}

/** Check if a JWT token is expired (with buffer) */
export function isTokenExpired(token: string): boolean {
	try {
		const payload = parseJwtPayload(token);
		const exp = payload.exp as number | undefined;
		if (!exp) return true;

		const nowSeconds = Math.floor(Date.now() / 1000);
		return nowSeconds >= exp - EXPIRY_BUFFER_SECONDS;
	} catch (error) {
		console.error('[auth] Failed to parse token for expiry check:', error instanceof Error ? error.message : error);
		return true;
	}
}

/** Extract session data from access + id tokens. Returns null if claims are missing or malformed. */
export function getSessionFromTokens(
	accessToken: string,
	idToken: string
): Session | null {
	try {
		const claims = parseJwtPayload(idToken);

		const id = claims['custom:user_id'];
		const email = claims.email;
		const tenantId = claims['custom:tenant_id'];
		const role = claims['custom:tenant_role'];
		const givenName = claims.given_name;
		const familyName = claims.family_name;

		if (
			typeof id !== 'string' ||
			typeof email !== 'string' ||
			typeof tenantId !== 'string' ||
			typeof role !== 'string' ||
			typeof givenName !== 'string' ||
			typeof familyName !== 'string' ||
			!VALID_ROLES.includes(role as TenantRole)
		) {
			console.error('[auth] idToken missing or invalid claims');
			return null;
		}

		return {
			idToken,
			user: {
				id,
				email,
				tenantId,
				role: role as TenantRole,
				givenName,
				familyName
			}
		};
	} catch (error) {
		console.error('[auth] Failed to extract session from tokens:', error instanceof Error ? error.message : error);
		return null;
	}
}
