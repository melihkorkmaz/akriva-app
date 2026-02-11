/**
 * Authentication API types
 * Mirrors the API handoff document exactly
 */

/** Signup request - POST /auth/signup */
export interface SignupRequest {
	email: string;
	password: string;
	givenName: string;
	familyName: string;
	companyName: string;
	invitationToken?: string;
}

/** Signin request - POST /auth/signin */
export interface SigninRequest {
	email: string;
	password: string;
}

/** MFA verify request - POST /auth/mfa/verify */
export interface MfaVerifyRequest {
	session: string;
	code: string;
}

/** Refresh token request - POST /auth/refresh */
export interface RefreshRequest {
	refreshToken: string;
}

/** Forgot password request - POST /auth/forgot-password */
export interface ForgotPasswordRequest {
	email: string;
}

/** Confirm forgot password request - POST /auth/confirm-forgot-password */
export interface ConfirmForgotPasswordRequest {
	email: string;
	confirmationCode: string;
	newPassword: string;
}

/** Change password request - POST /auth/change-password (authenticated) */
export interface ChangePasswordRequest {
	previousPassword: string;
	proposedPassword: string;
}

/** Shared token shape */
export interface AuthTokens {
	accessToken: string; // JWT — use for Authorization header
	idToken: string; // JWT — contains user claims
	refreshToken: string; // Opaque — use for token refresh
	expiresIn: number; // Seconds until accessToken expires (typically 3600)
}

/** Valid user roles */
export type UserRole = 'owner' | 'admin' | 'user';

/** User info returned by signup */
export interface UserInfo {
	id: string; // UUID
	email: string;
	tenantId: string; // UUID
	role: UserRole;
}

/** Signup response - 201 Created */
export interface SignupResponse {
	tokens: AuthTokens;
	user: UserInfo;
}

/** MFA challenge from signin */
export interface MfaChallenge {
	challengeName: string; // e.g., "SOFTWARE_TOKEN_MFA"
	session: string; // Pass to /auth/mfa/verify
	challengeParameters: Record<string, string>;
}

/** Signin response - discriminated union */
export type SigninResponse =
	| { type: 'tokens'; tokens: AuthTokens }
	| { type: 'mfa_challenge'; challenge: MfaChallenge };

/** MFA verify response — same shape as AuthTokens */
export type MfaVerifyResponse = AuthTokens;

/** Refresh token response — same shape as AuthTokens */
export type RefreshResponse = AuthTokens;

/** Standard success message response */
export interface MessageResponse {
	message: string;
}

/** Standard error response */
export interface ApiErrorResponse {
	error: string; // Human-readable message
	code: string; // Machine-readable code
	details?: {
		// Present for Zod validation errors
		issues: Array<{
			code: string;
			path: string[];
			message: string;
			[key: string]: unknown;
		}>;
	};
}

/** Error codes from API */
export type ErrorCode =
	| 'VALIDATION_FAILED'
	| 'UNAUTHORIZED'
	| 'FORBIDDEN'
	| 'NOT_FOUND'
	| 'CONFLICT'
	| 'MFA_CHALLENGE_REQUIRED'
	| 'COGNITO_OPERATION_FAILED';

/** Tenant status */
export type TenantStatus = 'init' | 'active' | 'inactive' | 'removed';

/** Consolidation approach (GHG Protocol) */
export type ConsolidationApproach = 'operational_control' | 'financial_control' | 'equity_share';

/** Tenant response DTO — returned by GET /v1/tenants/{id} and PATCH /v1/tenants/settings */
export interface TenantResponseDto {
	id: string;
	name: string;
	slug: string;
	status: TenantStatus;
	hqCountry: string | null;
	stateProvince: string | null;
	city: string | null;
	reportingCurrency: string | null;
	fiscalYearStartMonth: number | null;
	fiscalYearStartDay: number | null;
	baseYear: number | null;
	sector: string | null;
	subSector: string | null;
	consolidationApproach: ConsolidationApproach | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}

/** Update tenant settings request — PATCH /v1/tenants/settings (all fields optional) */
export interface UpdateTenantSettingsRequest {
	name?: string;
	slug?: string;
	hqCountry?: string | null;
	stateProvince?: string | null;
	city?: string | null;
	reportingCurrency?: string | null;
	fiscalYearStartMonth?: number | null;
	fiscalYearStartDay?: number | null;
	baseYear?: number | null;
	sector?: string | null;
	subSector?: string | null;
	consolidationApproach?: ConsolidationApproach | null;
}

/** JWT Claims (from idToken) */
export interface JwtCustomClaims {
	sub: string; // Cognito user sub (UUID)
	email: string;
	given_name: string;
	family_name: string;
	'custom:tenant_id': string; // UUID — snake_case, NOT camelCase
	'custom:user_id': string; // UUID
	'custom:tenant_role': UserRole;
}
