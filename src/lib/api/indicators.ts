import { apiFetchAuth } from './client.js';
import type { IndicatorResponseDto } from './types.js';

export async function listIndicators(
	accessToken: string,
	params?: { isGlobal?: string; category?: string }
): Promise<IndicatorResponseDto[]> {
	const qs = new URLSearchParams();
	if (params?.isGlobal) qs.set('isGlobal', params.isGlobal);
	if (params?.category) qs.set('category', params.category);
	const query = qs.toString();
	return apiFetchAuth<IndicatorResponseDto[]>(`/indicators${query ? `?${query}` : ''}`, accessToken);
}

export async function createIndicator(
	accessToken: string,
	data: {
		name: string;
		emissionCategory: string;
		calculationMethod: string;
		defaultFuelType?: string | null;
		defaultGasType?: string | null;
	}
): Promise<IndicatorResponseDto> {
	return apiFetchAuth<IndicatorResponseDto>('/indicators', accessToken, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function updateIndicator(
	accessToken: string,
	id: string,
	data: {
		name?: string;
		defaultFuelType?: string | null;
		defaultGasType?: string | null;
		isActive?: boolean;
	}
): Promise<IndicatorResponseDto> {
	return apiFetchAuth<IndicatorResponseDto>(`/indicators/${id}`, accessToken, {
		method: 'PATCH',
		body: JSON.stringify(data)
	});
}

export async function deleteIndicator(
	accessToken: string,
	id: string
): Promise<void> {
	await apiFetchAuth<null>(`/indicators/${id}`, accessToken, { method: 'DELETE' });
}
