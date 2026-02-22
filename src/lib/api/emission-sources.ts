import { apiFetchAuth } from './client.js';
import type { EmissionSourceResponseDto } from './types.js';

export async function listEmissionSources(
	accessToken: string,
	params?: { orgUnitId?: string; category?: string; isActive?: string }
): Promise<EmissionSourceResponseDto[]> {
	const qs = new URLSearchParams();
	if (params?.orgUnitId) qs.set('orgUnitId', params.orgUnitId);
	if (params?.category) qs.set('category', params.category);
	if (params?.isActive) qs.set('isActive', params.isActive);
	const query = qs.toString();
	return apiFetchAuth<EmissionSourceResponseDto[]>(
		`/emission/emission-sources${query ? `?${query}` : ''}`, accessToken
	);
}

export async function getEmissionSource(
	accessToken: string,
	id: string
): Promise<EmissionSourceResponseDto> {
	return apiFetchAuth<EmissionSourceResponseDto>(`/emission/emission-sources/${id}`, accessToken);
}

export async function createEmissionSource(
	accessToken: string,
	data: {
		orgUnitId: string;
		category: string;
		name: string;
		meterNumber?: string | null;
		vehicleType?: string | null;
		technology?: string | null;
		defaultFuelType?: string | null;
		defaultGasType?: string | null;
	}
): Promise<EmissionSourceResponseDto> {
	return apiFetchAuth<EmissionSourceResponseDto>('/emission/emission-sources', accessToken, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function updateEmissionSource(
	accessToken: string,
	id: string,
	data: {
		name?: string;
		meterNumber?: string | null;
		vehicleType?: string | null;
		technology?: string | null;
		defaultFuelType?: string | null;
		defaultGasType?: string | null;
		isActive?: boolean;
	}
): Promise<EmissionSourceResponseDto> {
	return apiFetchAuth<EmissionSourceResponseDto>(`/emission/emission-sources/${id}`, accessToken, {
		method: 'PATCH',
		body: JSON.stringify(data)
	});
}

export async function deleteEmissionSource(
	accessToken: string,
	id: string
): Promise<EmissionSourceResponseDto> {
	return apiFetchAuth<EmissionSourceResponseDto>(`/emission/emission-sources/${id}`, accessToken, {
		method: 'DELETE'
	});
}
