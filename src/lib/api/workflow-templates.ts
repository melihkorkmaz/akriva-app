import { apiFetchAuth } from './client.js';
import type {
	WorkflowTemplateResponseDto,
	WorkflowTemplateListResponse,
	WorkflowTemplateStatus
} from './types.js';

export async function listWorkflowTemplates(
	accessToken: string
): Promise<WorkflowTemplateListResponse> {
	return apiFetchAuth<WorkflowTemplateListResponse>('/workflow-templates', accessToken);
}

export async function getWorkflowTemplate(
	accessToken: string,
	id: string
): Promise<WorkflowTemplateResponseDto> {
	return apiFetchAuth<WorkflowTemplateResponseDto>(`/workflow-templates/${id}`, accessToken);
}

export async function createWorkflowTemplate(
	accessToken: string,
	data: {
		name: string;
		description?: string | null;
		steps: Array<{
			name: string;
			type: 'submit' | 'review' | 'approve';
			assignedRole: string;
			gateType?: string;
			stepOrder: number;
		}>;
		transitions?: Array<{
			fromStepOrder: number;
			toStepOrder: number;
			trigger: string;
			rejectionTargetStepOrder?: number | null;
		}>;
	}
): Promise<WorkflowTemplateResponseDto> {
	return apiFetchAuth<WorkflowTemplateResponseDto>('/workflow-templates', accessToken, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function updateWorkflowTemplate(
	accessToken: string,
	id: string,
	data: {
		name?: string;
		description?: string | null;
		status?: WorkflowTemplateStatus;
		steps?: Array<{
			name: string;
			type: string;
			assignedRole: string;
			gateType?: string;
			stepOrder: number;
		}>;
		transitions?: Array<{
			fromStepOrder: number;
			toStepOrder: number;
			trigger: string;
			rejectionTargetStepOrder?: number | null;
		}>;
	}
): Promise<WorkflowTemplateResponseDto> {
	return apiFetchAuth<WorkflowTemplateResponseDto>(`/workflow-templates/${id}`, accessToken, {
		method: 'PATCH',
		body: JSON.stringify(data)
	});
}

export async function deleteWorkflowTemplate(
	accessToken: string,
	id: string
): Promise<WorkflowTemplateResponseDto> {
	return apiFetchAuth<WorkflowTemplateResponseDto>(`/workflow-templates/${id}`, accessToken, {
		method: 'DELETE'
	});
}
