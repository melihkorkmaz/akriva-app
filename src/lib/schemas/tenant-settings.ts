import { z } from 'zod';

/** Max days per month (using 29 for February to allow leap years) */
const MAX_DAYS_PER_MONTH: Record<number, number> = {
	1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30,
	7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31
};

/** Company settings form schema — matches backend PATCH /v1/tenants/settings validation */
export const tenantSettingsSchema = z
	.object({
		name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters'),
		slug: z
			.string()
			.min(3, 'Slug must be at least 3 characters')
			.max(50, 'Slug must be at most 50 characters')
			.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
		hqCountry: z
			.string()
			.regex(/^[A-Z]{2}$/, 'Country code must be uppercase ISO 3166-1 alpha-2')
			.nullish()
			.default(null),
		stateProvince: z.string().min(1, 'State/province must not be empty').max(255).nullish().default(null),
		city: z.string().min(1, 'City must not be empty').max(255).nullish().default(null),
		reportingCurrency: z
			.string()
			.regex(/^[A-Z]{3}$/, 'Currency code must be uppercase ISO 4217')
			.nullish()
			.default(null),
		fiscalYearStartMonth: z.coerce
			.number()
			.int()
			.min(1, 'Month must be between 1 and 12')
			.max(12, 'Month must be between 1 and 12')
			.nullish()
			.default(null),
		fiscalYearStartDay: z.coerce
			.number()
			.int()
			.min(1, 'Day must be at least 1')
			.max(31, 'Day must be at most 31')
			.nullish()
			.default(null),
		baseYear: z.coerce
			.number()
			.int()
			.min(1900, 'Base year must be at least 1900')
			.max(2100, 'Base year must be at most 2100')
			.nullish()
			.default(null),
		sector: z.string().min(1, 'Sector must not be empty').max(255).nullish().default(null),
		subSector: z.string().min(1, 'Sub-sector must not be empty').max(255).nullish().default(null),
		consolidationApproach: z
			.enum(['operational_control', 'financial_control', 'equity_share'])
			.nullish()
			.default(null)
	})
	.superRefine((data, ctx) => {
		if (data.fiscalYearStartMonth != null && data.fiscalYearStartDay != null) {
			const maxDay = MAX_DAYS_PER_MONTH[data.fiscalYearStartMonth];
			if (data.fiscalYearStartDay > maxDay) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Day ${data.fiscalYearStartDay} is invalid for month ${data.fiscalYearStartMonth} (max: ${maxDay})`,
					path: ['fiscalYearStartDay']
				});
			}
		}
	});
