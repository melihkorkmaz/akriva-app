import { z } from 'zod';

/** Schema for rejecting a task */
export const taskRejectSchema = z.object({
	notes: z.string().min(1, 'Notes are required').max(2000)
});
