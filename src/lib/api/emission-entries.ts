import { apiFetchAuth } from './client.js';
import type { EmissionEntryResponseDto, EmissionEntryListResponse } from './types.js';

export async function listEmissionEntries(
	accessToken: string,
	params?: { orgUnitId?: string; reportingYear?: number; category?: string; page?: number; pageSize?: number }
): Promise<EmissionEntryListResponse> {
	const qs = new URLSearchParams();
	if (params?.orgUnitId) qs.set('orgUnitId', params.orgUnitId);
	if (params?.reportingYear) qs.set('reportingYear', String(params.reportingYear));
	if (params?.category) qs.set('category', params.category);
	if (params?.page) qs.set('page', String(params.page));
	if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
	const query = qs.toString();
	return apiFetchAuth<EmissionEntryListResponse>(
		`/emission/emission-entries${query ? `?${query}` : ''}`, accessToken
	);
}

export async function getEmissionEntry(
	accessToken: string,
	id: string
): Promise<EmissionEntryResponseDto> {
	return apiFetchAuth<EmissionEntryResponseDto>(`/emission/emission-entries/${id}`, accessToken);
}

export async function createEmissionEntry(
	accessToken: string,
	data: Record<string, unknown>,
	dryRun = false
): Promise<EmissionEntryResponseDto> {
	const query = dryRun ? '?dryRun=true' : '';
	return apiFetchAuth<EmissionEntryResponseDto>(`/emission/emission-entries${query}`, accessToken, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function updateEmissionEntry(
	accessToken: string,
	id: string,
	data: Record<string, unknown>
): Promise<EmissionEntryResponseDto> {
	return apiFetchAuth<EmissionEntryResponseDto>(`/emission/emission-entries/${id}`, accessToken, {
		method: 'PATCH',
		body: JSON.stringify(data)
	});
}

export async function deleteEmissionEntry(
	accessToken: string,
	id: string
): Promise<void> {
	await apiFetchAuth<void>(`/emission/emission-entries/${id}`, accessToken, { method: 'DELETE' });
}

export async function getEmissionEntryTraces(
	accessToken: string,
	entryId: string
): Promise<unknown[]> {
	return apiFetchAuth<unknown[]>(`/emission/emission-entries/${entryId}/traces`, accessToken);
}
