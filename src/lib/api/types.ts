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

/** Valid tenant roles (lowest → highest privilege) */
export type TenantRole = 'viewer' | 'data_entry' | 'data_approver' | 'tenant_admin' | 'super_admin';

/** Display labels for tenant roles */
export const TENANT_ROLE_LABELS: Record<TenantRole, string> = {
	viewer: 'Viewer',
	data_entry: 'Data Entry',
	data_approver: 'Data Approver',
	tenant_admin: 'Admin',
	super_admin: 'Super Admin'
};

/** User info returned by signup */
export interface UserInfo {
	id: string; // UUID
	email: string;
	tenantId: string; // UUID
	role: TenantRole;
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

/** Decimal separator options */
export type DecimalSeparator = 'point' | 'comma';

/** Thousands separator options */
export type ThousandsSeparator = 'comma' | 'point' | 'space' | 'none';

/** Date format options */
export type DateFormat = 'dd_mm_yyyy' | 'mm_dd_yyyy' | 'yyyy_mm_dd';

/** Time format options */
export type TimeFormat = '24h' | '12h';

/** Unit system options */
export type UnitSystem = 'metric' | 'imperial' | 'custom';

/** Emission display unit options */
export type EmissionDisplayUnit = 'tco2e' | 'kgco2e';

/** GWP version options */
export type GwpVersion = 'ar5' | 'ar6';

/** Emission factor authority options */
export type EmissionAuthority = 'ipcc' | 'defra' | 'epa' | 'iea' | 'egrid';

/** Application settings response DTO — returned by GET/PATCH /v1/tenants/settings/application */
export interface TenantSettingsResponseDto {
	id: string;
	tenantId: string;
	decimalSeparator: DecimalSeparator;
	thousandsSeparator: ThousandsSeparator;
	decimalPrecision: number;
	dateFormat: DateFormat;
	timeFormat: TimeFormat;
	timezone: string;
	unitSystem: UnitSystem;
	emissionDisplayUnit: EmissionDisplayUnit;
	gwpVersion: GwpVersion;
	scope1Authority: EmissionAuthority;
	scope2Authority: EmissionAuthority;
	createdAt: string;
	updatedAt: string;
}

/** Update application settings request — PATCH /v1/tenants/settings/application (all fields optional) */
export interface UpdateApplicationSettingsRequest {
	decimalSeparator?: DecimalSeparator;
	thousandsSeparator?: ThousandsSeparator;
	decimalPrecision?: number;
	dateFormat?: DateFormat;
	timeFormat?: TimeFormat;
	timezone?: string;
	unitSystem?: UnitSystem;
	emissionDisplayUnit?: EmissionDisplayUnit;
	gwpVersion?: GwpVersion;
	scope1Authority?: EmissionAuthority;
	scope2Authority?: EmissionAuthority;
}

/** JWT Claims (from idToken) */
export interface JwtCustomClaims {
	sub: string; // Cognito user sub (UUID)
	email: string;
	given_name: string;
	family_name: string;
	'custom:tenant_id': string; // UUID — snake_case, NOT camelCase
	'custom:user_id': string; // UUID
	'custom:tenant_role': TenantRole;
}

/** Org unit type */
export type OrgUnitType = 'subsidiary' | 'division' | 'facility';

/** Org unit status */
export type OrgUnitStatus = 'active' | 'inactive';

/** Single org unit (flat) — returned by GET/POST/PATCH/DELETE /v1/org-units */
export interface OrgUnitResponseDto {
	id: string;
	tenantId: string;
	parentId: string | null;
	name: string;
	type: OrgUnitType;
	code: string;
	description: string | null;
	equitySharePercentage: number | null;
	orderIndex: number;
	status: OrgUnitStatus;
	country: string;
	stateProvince: string | null;
	city: string;
	overrideScientificAuthority: boolean;
	effectiveGwpVersion: GwpVersion;
	effectiveScope1Authority: EmissionAuthority;
	effectiveScope2Authority: EmissionAuthority;
	createdAt: string;
	updatedAt: string;
}

/** Tree node (recursive children) — returned by GET /v1/org-units?view=tree */
export interface OrgUnitTreeResponseDto extends OrgUnitResponseDto {
	children: OrgUnitTreeResponseDto[];
}

/** Tree list response — GET /v1/org-units?view=tree */
export interface OrgUnitTreeListResponseDto {
	view: 'tree';
	data: OrgUnitTreeResponseDto[];
	total: number;
}

/** Create org unit request — POST /v1/org-units */
export interface CreateOrgUnitRequest {
	parentId: string | null;
	name: string;
	type: OrgUnitType;
	code: string;
	description: string | null;
	equitySharePercentage: number | null;
	country: string;
	stateProvince: string | null;
	city: string;
	overrideScientificAuthority?: boolean;
	gwpVersion?: GwpVersion | null;
	scope1Authority?: EmissionAuthority | null;
	scope2Authority?: EmissionAuthority | null;
}

/** Update org unit request — PATCH /v1/org-units/{id} */
export interface UpdateOrgUnitRequest {
	name?: string;
	description?: string | null;
	equitySharePercentage?: number | null;
	status?: OrgUnitStatus;
	country?: string;
	stateProvince?: string | null;
	city?: string;
	overrideScientificAuthority?: boolean;
	gwpVersion?: GwpVersion | null;
	scope1Authority?: EmissionAuthority | null;
	scope2Authority?: EmissionAuthority | null;
}

/** Move org unit request — PATCH /v1/org-units/{id}/move */
export interface MoveOrgUnitRequest {
	parentId: string | null;
	orderIndex?: number;
}

/** Returned by GET /v1/users/me */
export interface UserMeResponseDto {
	id: string;
	email: string;
	displayName: string | null;
	role: TenantRole;
	isActive: boolean;
	cognitoSub: string | null;
	createdAt: string;
	updatedAt: string;
}

/** Returned by all other user endpoints (list, update, delete) */
export interface UserResponseDto {
	id: string;
	email: string;
	displayName: string | null;
	role: TenantRole;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

/** Returned by GET /v1/users */
export interface UserListResponse {
	users: UserResponseDto[];
}

/** Returned by assignment endpoints */
export interface AssignmentResponseDto {
	id: string;
	orgUnitId: string;
	assignedBy: string;
	createdAt: string;
}

/** Invite statuses */
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

/** Display labels for invite statuses */
export const INVITE_STATUS_LABELS: Record<InviteStatus, string> = {
	pending: 'Pending',
	accepted: 'Accepted',
	expired: 'Expired',
	revoked: 'Revoked'
};

/** Returned by invite endpoints (POST/GET/DELETE /v1/users/invites) */
export interface InviteResponseDto {
	id: string;
	email: string;
	role: TenantRole;
	status: InviteStatus;
	invitedBy: string | null;
	expiresAt: string | null;
	createdAt: string;
}

/** Returned by GET /v1/users/invites */
export interface InviteListResponse {
	invites: InviteResponseDto[];
}

/** Returned by GET /v1/auth/invites/{token}/validate (public) */
export interface ValidateInviteTokenResponseDto {
	valid: boolean;
	email?: string;
	role?: string;
	tenantName?: string;
	expiresAt?: string;
	reason?: string;
}
