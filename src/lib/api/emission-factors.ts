import { apiFetchAuth } from './client.js';
import type { EmissionFactorLibraryResponseDto } from './types.js';

export async function listEmissionFactorLibraries(
	accessToken: string,
	params?: { authority?: string; releaseYear?: number }
): Promise<EmissionFactorLibraryResponseDto[]> {
	const qs = new URLSearchParams();
	if (params?.authority) qs.set('authority', params.authority);
	if (params?.releaseYear) qs.set('releaseYear', String(params.releaseYear));
	const query = qs.toString();
	return apiFetchAuth<EmissionFactorLibraryResponseDto[]>(
		`/emission-factors/emission-factor-libraries${query ? `?${query}` : ''}`, accessToken
	);
}

export async function listFuelProperties(
	accessToken: string,
	params: { libraryId: string; fuelType?: string; propertyType?: string }
): Promise<unknown[]> {
	const qs = new URLSearchParams({ libraryId: params.libraryId });
	if (params.fuelType) qs.set('fuelType', params.fuelType);
	if (params.propertyType) qs.set('propertyType', params.propertyType);
	return apiFetchAuth<unknown[]>(`/emission-factors/fuel-properties?${qs}`, accessToken);
}

export async function listGwpValues(
	accessToken: string,
	params?: { version?: string }
): Promise<unknown[]> {
	const qs = new URLSearchParams();
	if (params?.version) qs.set('version', params.version);
	const query = qs.toString();
	return apiFetchAuth<unknown[]>(
		`/emission-factors/gwp-values${query ? `?${query}` : ''}`, accessToken
	);
}
