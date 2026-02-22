import { z } from 'zod';

/** Schema for creating an emission source — POST /v1/emission-sources */
export const createEmissionSourceSchema = z.object({
	orgUnitId: z.string().uuid('Invalid org unit'),
	category: z.enum(['stationary', 'mobile', 'fugitive', 'process'], {
		message: 'Category is required'
	}),
	name: z.string().min(1, 'Name is required').max(255),
	meterNumber: z.string().max(100).nullish().default(null),
	vehicleType: z.string().max(100).nullish().default(null),
	technology: z.string().max(100).nullish().default(null),
	defaultFuelType: z.string().max(100).nullish().default(null),
	defaultGasType: z.string().max(100).nullish().default(null)
});

/** Schema for updating an emission source — PATCH /v1/emission-sources/{id} */
export const updateEmissionSourceSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	meterNumber: z.string().max(100).nullish(),
	vehicleType: z.string().max(100).nullish(),
	technology: z.string().max(100).nullish(),
	defaultFuelType: z.string().max(100).nullish(),
	defaultGasType: z.string().max(100).nullish(),
	isActive: z.boolean().optional()
});
