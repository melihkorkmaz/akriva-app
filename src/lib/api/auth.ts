import { apiFetch, apiFetchAuth } from './client.js';
import type {
	SignupRequest,
	SignupResponse,
	SigninRequest,
	SigninResponse,
	MfaVerifyRequest,
	MfaVerifyResponse,
	RefreshRequest,
	RefreshResponse,
	ForgotPasswordRequest,
	ConfirmForgotPasswordRequest,
	ChangePasswordRequest,
	MessageResponse
} from './types.js';

/** POST /auth/signup */
export async function signup(data: SignupRequest): Promise<SignupResponse> {
	return apiFetch<SignupResponse>('/auth/signup', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

/** POST /auth/signin */
export async function signin(data: SigninRequest): Promise<SigninResponse> {
	return apiFetch<SigninResponse>('/auth/signin', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

/** POST /auth/mfa/verify */
export async function verifyMfa(data: MfaVerifyRequest): Promise<MfaVerifyResponse> {
	return apiFetch<MfaVerifyResponse>('/auth/mfa/verify', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

/** POST /auth/refresh */
export async function refreshTokens(data: RefreshRequest): Promise<RefreshResponse> {
	return apiFetch<RefreshResponse>('/auth/refresh', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

/** POST /auth/forgot-password */
export async function forgotPassword(data: ForgotPasswordRequest): Promise<MessageResponse> {
	return apiFetch<MessageResponse>('/auth/forgot-password', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

/** POST /auth/confirm-forgot-password */
export async function confirmForgotPassword(
	data: ConfirmForgotPasswordRequest
): Promise<MessageResponse> {
	return apiFetch<MessageResponse>('/auth/confirm-forgot-password', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

/** POST /auth/change-password (authenticated) */
export async function changePassword(
	accessToken: string,
	data: ChangePasswordRequest
): Promise<MessageResponse> {
	return apiFetchAuth<MessageResponse>('/auth/change-password', accessToken, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}
