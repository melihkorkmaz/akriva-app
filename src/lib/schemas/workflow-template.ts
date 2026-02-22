import { z } from 'zod';

/** Schema for creating a workflow template — POST /v1/workflow-templates */
export const createWorkflowTemplateSchema = z.object({
	name: z.string().min(1, 'Name is required').max(200),
	description: z.string().max(1000).nullish().default(null),
	approvalTiers: z.coerce.number().int().min(1).max(3)
});

/** Schema for updating a workflow template — PATCH /v1/workflow-templates/{id} */
export const updateWorkflowTemplateSchema = z.object({
	name: z.string().min(1, 'Name is required').max(200).optional(),
	description: z.string().max(1000).nullish()
});
