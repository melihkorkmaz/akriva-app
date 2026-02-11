import { apiFetchAuth } from './client.js';
import type { TenantResponseDto, UpdateTenantSettingsRequest } from './types.js';

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
