import { z } from 'zod';

/** Application settings form schema — matches backend PATCH /v1/tenants/settings/application */
export const applicationSettingsSchema = z
	.object({
		decimalSeparator: z.enum(['point', 'comma']),
		thousandsSeparator: z.enum(['comma', 'point', 'space', 'none']),
		decimalPrecision: z.coerce
			.number()
			.int()
			.min(0, 'Precision must be at least 0')
			.max(10, 'Precision must be at most 10'),
		dateFormat: z.enum(['dd_mm_yyyy', 'mm_dd_yyyy', 'yyyy_mm_dd']),
		timeFormat: z.enum(['24h', '12h']),
		timezone: z.string().min(1, 'Timezone is required'),
		unitSystem: z.enum(['metric', 'imperial', 'custom']),
		emissionDisplayUnit: z.enum(['tco2e', 'kgco2e']),
		gwpVersion: z.enum(['ar5', 'ar6']),
		scope1Authority: z.enum(['ipcc', 'defra', 'epa', 'iea', 'egrid']),
		scope2Authority: z.enum(['ipcc', 'defra', 'epa', 'iea', 'egrid'])
	})
	.superRefine((data, ctx) => {
		if (data.decimalSeparator === data.thousandsSeparator) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Decimal separator and thousands separator cannot be the same',
				path: ['thousandsSeparator']
			});
		}
	});
