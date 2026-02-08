import type { AuthTokens, UserInfo, JwtCustomClaims } from '$lib/api/types.js';

/** Key for storing auth data in localStorage */
const STORAGE_KEY = 'akriva_auth';

/** Parsed auth state stored in localStorage */
interface StoredAuth {
	tokens: AuthTokens;
	user: UserInfo;
}

/**
 * Auth store using Svelte 5 runes
 * Manages authentication state and persists to localStorage
 */
function createAuthStore() {
	// Initialize from localStorage if available
	let tokens = $state<AuthTokens | null>(null);
	let user = $state<UserInfo | null>(null);

	// Load from localStorage on client-side only
	$effect(() => {
		if (typeof window === 'undefined') return;
		
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				const parsed = JSON.parse(stored) as StoredAuth;
				tokens = parsed.tokens;
				user = parsed.user;
			} catch {
				// Invalid stored data, clear it
				localStorage.removeItem(STORAGE_KEY);
			}
		}
	});

	// Persist to localStorage whenever state changes
	$effect(() => {
		if (typeof window === 'undefined') return;
		
		if (tokens && user) {
			const toStore: StoredAuth = { tokens, user };
			localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
		} else {
			localStorage.removeItem(STORAGE_KEY);
		}
	});

	return {
		/** Get current tokens (null if not authenticated) */
		get tokens() {
			return tokens;
		},

		/** Get current user info (null if not authenticated) */
		get user() {
			return user;
		},

		/** Check if user is authenticated */
		get isAuthenticated() {
			return tokens !== null && user !== null;
		},

		/** Get access token for API Authorization header */
		get accessToken() {
			return tokens?.accessToken ?? null;
		},

		/** Get refresh token for token refresh */
		get refreshToken() {
			return tokens?.refreshToken ?? null;
		},

		/** Set session after successful signup/signin */
		setSession(newTokens: AuthTokens, newUser: UserInfo) {
			tokens = newTokens;
			user = newUser;
		},

		/** Clear session on logout or auth failure */
		clearSession() {
			tokens = null;
			user = null;
		},

		/** Update tokens after refresh */
		updateTokens(newTokens: AuthTokens) {
			if (tokens) {
				tokens = { ...newTokens, refreshToken: tokens.refreshToken };
			}
		},

		/** Get tenant ID from idToken claims (client-side only) */
		getTenantId(): string | null {
			if (!tokens?.idToken) return null;
			try {
				const claims = parseJwt(tokens.idToken) as unknown as JwtCustomClaims;
				return claims['custom:tenant_id'] ?? null;
			} catch {
				return null;
			}
		},

		/** Get user role from idToken claims (client-side only) */
		getRole(): string | null {
			if (!tokens?.idToken) return null;
			try {
				const claims = parseJwt(tokens.idToken) as unknown as JwtCustomClaims;
				return claims['custom:tenant_role'] ?? null;
			} catch {
				return null;
			}
		}
	};
}

/**
 * Parse JWT token without verification (client-side only)
 * Used to read claims from idToken
 */
function parseJwt(token: string): Record<string, unknown> {
	try {
		const base64Url = token.split('.')[1];
		const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		const jsonPayload = decodeURIComponent(
			atob(base64)
				.split('')
				.map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
				.join('')
		);
		return JSON.parse(jsonPayload);
	} catch {
		return {};
	}
}

/** Global auth store instance */
export const auth = createAuthStore();
