import { apiFetchAuth } from './client.js';
import type { EvidenceFileResponseDto, EvidenceUploadUrlResponse } from './types.js';

export async function listEvidenceByEntry(
	accessToken: string,
	entryId: string
): Promise<EvidenceFileResponseDto[]> {
	return apiFetchAuth<EvidenceFileResponseDto[]>(
		`/emission/evidence?entryId=${entryId}`,
		accessToken
	);
}

export async function requestUploadUrl(
	accessToken: string,
	data: { originalFilename: string; contentType: string }
): Promise<EvidenceUploadUrlResponse> {
	return apiFetchAuth<EvidenceUploadUrlResponse>('/emission/evidence/upload-url', accessToken, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function confirmUpload(
	accessToken: string,
	evidenceId: string
): Promise<EvidenceFileResponseDto> {
	return apiFetchAuth<EvidenceFileResponseDto>(
		`/emission/evidence/${evidenceId}/confirm`, accessToken, { method: 'POST' }
	);
}

export async function getDownloadUrl(
	accessToken: string,
	evidenceId: string
): Promise<string> {
	return apiFetchAuth<string>(`/emission/evidence/${evidenceId}/download-url`, accessToken);
}

export async function deleteEvidence(
	accessToken: string,
	evidenceId: string
): Promise<void> {
	await apiFetchAuth<void>(`/emission/evidence/${evidenceId}`, accessToken, { method: 'DELETE' });
}
