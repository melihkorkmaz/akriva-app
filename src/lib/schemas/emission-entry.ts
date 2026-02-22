import { z } from 'zod';

/** Schema for submitting an emission entry */
export const emissionEntrySchema = z.object({
	sourceId: z.string().uuid().nullish().default(null),
	fuelType: z.string().max(100).nullish().default(null),
	activityAmount: z.coerce.number().positive().nullish().default(null),
	activityUnit: z.string().max(50).nullish().default(null),
	distance: z.coerce.number().positive().nullish().default(null),
	distanceUnit: z.enum(['km', 'miles']).nullish().default(null),
	vehicleType: z.string().max(100).nullish().default(null),
	technology: z.string().max(100).nullish().default(null),
	productionVolume: z.coerce.number().positive().nullish().default(null),
	productionUnit: z.string().max(100).nullish().default(null),
	abatementEfficiency: z.coerce.number().min(0).max(1).nullish().default(null),
	gasType: z.string().max(100).nullish().default(null),
	refrigerantInventoryStart: z.coerce.number().min(0).nullish().default(null),
	refrigerantInventoryEnd: z.coerce.number().min(0).nullish().default(null),
	refrigerantPurchased: z.coerce.number().min(0).nullish().default(null),
	refrigerantRecovered: z.coerce.number().min(0).nullish().default(null),
	notes: z.string().max(2000).nullish().default(null)
});
