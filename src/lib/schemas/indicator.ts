import { z } from 'zod';

/** Schema for creating an indicator — POST /v1/indicators */
export const createIndicatorSchema = z.object({
	name: z.string().min(1, 'Name is required').max(200),
	emissionCategory: z.enum(['stationary', 'mobile', 'fugitive', 'process'], {
		message: 'Category is required'
	})
});

/** Schema for updating an indicator — PATCH /v1/indicators/{id} */
export const updateIndicatorSchema = z.object({
	name: z.string().min(1, 'Name is required').max(200).optional(),
	isActive: z.boolean().optional()
});
