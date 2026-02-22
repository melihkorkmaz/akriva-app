import { z } from 'zod';

/** Base campaign fields (without refinements) */
const campaignBaseSchema = z.object({
	name: z.string().min(1, 'Name is required').max(200),
	indicatorId: z.string().uuid('Indicator is required'),
	workflowTemplateId: z.string().uuid('Workflow template is required'),
	approvalTiers: z.coerce.number().int().min(1).max(3),
	reportingYear: z.coerce.number().int().min(2000).max(2100),
	periodStart: z.string().min(1, 'Start date is required'),
	periodEnd: z.string().min(1, 'End date is required'),
	orgUnitIds: z.array(z.string().uuid()).min(1, 'At least one org unit is required')
});

/** Schema for creating a campaign — POST /v1/campaigns */
export const createCampaignSchema = campaignBaseSchema.superRefine((data, ctx) => {
	if (data.periodStart && data.periodEnd && data.periodStart >= data.periodEnd) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: 'End date must be after start date',
			path: ['periodEnd']
		});
	}
});

/** Schema for updating a campaign — PATCH /v1/campaigns/{id} */
export const updateCampaignSchema = campaignBaseSchema.partial();
