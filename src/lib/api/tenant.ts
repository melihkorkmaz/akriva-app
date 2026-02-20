import { apiFetchAuth } from './client.js';
import type {
	TenantResponseDto,
	UpdateTenantSettingsRequest,
	TenantSettingsResponseDto,
	UpdateApplicationSettingsRequest
} from './types.js';

/** GET /v1/tenants/{id} */
export async function getTenant(accessToken: string, tenantId: string): Promise<TenantResponseDto> {
	return apiFetchAuth<TenantResponseDto>(`/tenants/${tenantId}`, accessToken);
}

/** PATCH /v1/tenants/settings */
export async function updateTenantSettings(
	accessToken: string,
	data: UpdateTenantSettingsRequest
): Promise<TenantResponseDto> {
	return apiFetchAuth<TenantResponseDto>('/tenants/settings', accessToken, {
		method: 'PATCH',
		body: JSON.stringify(data)
	});
}

/** GET /v1/tenants/settings/application */
export async function getApplicationSettings(
	accessToken: string
): Promise<TenantSettingsResponseDto> {
	return apiFetchAuth<TenantSettingsResponseDto>('/tenants/settings/application', accessToken);
}

/** PATCH /v1/tenants/settings/application */
export async function updateApplicationSettings(
	accessToken: string,
	data: UpdateApplicationSettingsRequest
): Promise<TenantSettingsResponseDto> {
	return apiFetchAuth<TenantSettingsResponseDto>('/tenants/settings/application', accessToken, {
		method: 'PATCH',
		body: JSON.stringify(data)
	});
}
