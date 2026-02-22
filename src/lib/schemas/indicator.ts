import { z } from 'zod';

/** Schema for creating an indicator — POST /v1/indicators */
export const createIndicatorSchema = z.object({
	name: z.string().min(1, 'Name is required').max(200),
	emissionCategory: z.enum(['stationary', 'mobile', 'fugitive', 'process'], {
		message: 'Category is required'
	}),
	calculationMethod: z.string().min(1, 'Calculation method is required'),
	defaultFuelType: z.string().max(100).nullish().default(null),
	defaultGasType: z.string().max(100).nullish().default(null)
});

/** Schema for updating an indicator — PATCH /v1/indicators/{id} */
export const updateIndicatorSchema = z.object({
	name: z.string().min(1, 'Name is required').max(200).optional(),
	defaultFuelType: z.string().max(100).nullish(),
	defaultGasType: z.string().max(100).nullish(),
	isActive: z.boolean().optional()
});
