import { z } from 'zod';

/** Schema for updating user display name */
export const profileSchema = z.object({
	displayName: z.string().min(1, 'Display name is required').max(255, 'Display name must be 255 characters or less')
});
