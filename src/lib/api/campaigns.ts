import { apiFetchAuth } from './client.js';
import type {
	CampaignResponseDto,
	CampaignWithDetails,
	CampaignTask,
	CampaignActivationResponse
} from './types.js';

interface CampaignListItem {
	id: string;
	tenantId: string;
	name: string;
	indicatorId: string;
	workflowTemplateId: string;
	approvalTiers: number;
	reportingYear: number;
	periodStart: string;
	periodEnd: string;
	status: string;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
}

export async function listCampaigns(
	accessToken: string,
	params?: { status?: string; reportingYear?: string }
): Promise<CampaignListItem[]> {
	const qs = new URLSearchParams();
	if (params?.status) qs.set('status', params.status);
	if (params?.reportingYear) qs.set('reportingYear', params.reportingYear);
	const query = qs.toString();
	return apiFetchAuth<CampaignListItem[]>(`/campaigns${query ? `?${query}` : ''}`, accessToken);
}

export async function getCampaign(
	accessToken: string,
	id: string
): Promise<CampaignWithDetails> {
	return apiFetchAuth<CampaignWithDetails>(`/campaigns/${id}`, accessToken);
}

export async function createCampaign(
	accessToken: string,
	data: {
		name: string;
		indicatorId: string;
		workflowTemplateId: string;
		approvalTiers: number;
		reportingYear: number;
		periodStart: string;
		periodEnd: string;
		orgUnitIds: string[];
		approverOverrides?: Array<{ orgUnitId: string; tier: number; userId: string }>;
	}
): Promise<CampaignResponseDto> {
	return apiFetchAuth<CampaignResponseDto>('/campaigns', accessToken, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function updateCampaign(
	accessToken: string,
	id: string,
	data: Record<string, unknown>
): Promise<CampaignWithDetails> {
	return apiFetchAuth<CampaignWithDetails>(`/campaigns/${id}`, accessToken, {
		method: 'PATCH',
		body: JSON.stringify(data)
	});
}

export async function deleteCampaign(
	accessToken: string,
	id: string
): Promise<void> {
	await apiFetchAuth<void>(`/campaigns/${id}`, accessToken, { method: 'DELETE' });
}

export async function activateCampaign(
	accessToken: string,
	id: string
): Promise<CampaignActivationResponse> {
	return apiFetchAuth<CampaignActivationResponse>(`/campaigns/${id}/activate`, accessToken, {
		method: 'POST'
	});
}

export async function listCampaignTasks(
	accessToken: string,
	campaignId: string,
	params?: { status?: string; orgUnitId?: string }
): Promise<CampaignTask[]> {
	const qs = new URLSearchParams();
	if (params?.status) qs.set('status', params.status);
	if (params?.orgUnitId) qs.set('orgUnitId', params.orgUnitId);
	const query = qs.toString();
	return apiFetchAuth<CampaignTask[]>(
		`/campaigns/${campaignId}/tasks${query ? `?${query}` : ''}`, accessToken
	);
}
