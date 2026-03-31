import { z } from "zod";

export const createDataCollectionRequestSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  message: z.string().max(2000).nullish().default(null),
  deadline: z.string().min(1, "Deadline is required"),
  emissionSourceIds: z
    .array(z.string().uuid())
    .min(1, "Select at least one emission source"),
});
