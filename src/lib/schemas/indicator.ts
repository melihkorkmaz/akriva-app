import { z } from 'zod';

/** Schema for creating an indicator — POST /v1/indicators */
export const createIndicatorSchema = z
	.object({
		name: z.string().min(1, 'Name is required').max(200),
		emissionCategory: z.enum(['stationary', 'mobile', 'fugitive', 'process'], {
			message: 'Category is required'
		}),
		methodVariant: z
			.enum(['fuel', 'distance', 'production', 'gas_abatement'])
			.nullable()
			.default(null)
	})
	.superRefine((data, ctx) => {
		const cat = data.emissionCategory;
		const variant = data.methodVariant;

		if (cat === 'mobile' && !variant) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Method variant is required for Mobile Combustion',
				path: ['methodVariant']
			});
		} else if (cat === 'mobile' && variant && !['fuel', 'distance'].includes(variant)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Mobile Combustion requires Fuel-based or Distance-based',
				path: ['methodVariant']
			});
		}

		if (cat === 'process' && !variant) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Method variant is required for Process Emissions',
				path: ['methodVariant']
			});
		} else if (
			cat === 'process' &&
			variant &&
			!['production', 'gas_abatement'].includes(variant)
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Process Emissions requires Production-based or Gas Abatement',
				path: ['methodVariant']
			});
		}

		if ((cat === 'stationary' || cat === 'fugitive') && variant) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'This category does not support method variants',
				path: ['methodVariant']
			});
		}
	});

/** Schema for updating an indicator — PATCH /v1/indicators/{id} */
export const updateIndicatorSchema = z.object({
	name: z.string().min(1, 'Name is required').max(200).optional(),
	isActive: z.boolean().optional()
});
