import { z } from 'zod';

/** Schema for creating an org unit — POST /v1/org-units */
export const createOrgUnitSchema = z.object({
	parentId: z.string().uuid().nullish().default(null),
	name: z.string().min(1, 'Name is required').max(200, 'Name must be at most 200 characters'),
	type: z.enum(['subsidiary', 'division', 'facility'], {
		message: 'Type is required'
	}),
	code: z
		.string()
		.min(1, 'Code is required')
		.max(50, 'Code must be at most 50 characters')
		.regex(
			/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
			'Code must be lowercase alphanumeric with dashes (e.g., "eu-west-hq")'
		),
	description: z.string().max(1000, 'Description must be at most 1000 characters').nullish().default(null),
	equitySharePercentage: z.coerce
		.number()
		.min(0, 'Equity share must be between 0 and 100')
		.max(100, 'Equity share must be between 0 and 100')
		.nullish()
		.default(null)
});

/** Schema for updating an org unit — PATCH /v1/org-units/{id} */
export const updateOrgUnitSchema = z.object({
	name: z.string().min(1, 'Name is required').max(200, 'Name must be at most 200 characters'),
	description: z.string().max(1000, 'Description must be at most 1000 characters').nullish().default(null),
	equitySharePercentage: z.coerce
		.number()
		.min(0, 'Equity share must be between 0 and 100')
		.max(100, 'Equity share must be between 0 and 100')
		.nullish()
		.default(null),
	status: z.enum(['active', 'inactive'])
});
