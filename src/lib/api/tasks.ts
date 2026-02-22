import { apiFetchAuth } from './client.js';
import type { CampaignTask } from './types.js';

export async function getMyTasks(accessToken: string): Promise<CampaignTask[]> {
	return apiFetchAuth<CampaignTask[]>('/tasks/my', accessToken);
}

export async function getTask(accessToken: string, taskId: string): Promise<CampaignTask> {
	return apiFetchAuth<CampaignTask>(`/tasks/${taskId}`, accessToken);
}

export async function startTask(accessToken: string, taskId: string): Promise<CampaignTask> {
	return apiFetchAuth<CampaignTask>(`/tasks/${taskId}/start`, accessToken, { method: 'POST' });
}

export async function submitTask(accessToken: string, taskId: string): Promise<CampaignTask> {
	return apiFetchAuth<CampaignTask>(`/tasks/${taskId}/submit`, accessToken, { method: 'POST' });
}

export async function approveTask(accessToken: string, taskId: string): Promise<CampaignTask> {
	return apiFetchAuth<CampaignTask>(`/tasks/${taskId}/approve`, accessToken, { method: 'POST' });
}

export async function rejectTask(
	accessToken: string,
	taskId: string,
	data: { notes: string }
): Promise<CampaignTask> {
	return apiFetchAuth<CampaignTask>(`/tasks/${taskId}/reject`, accessToken, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}
