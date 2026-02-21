import { z } from 'zod';

/** Invited signup form schema — no companyName since joining existing tenant */
export const invitedSignupSchema = z.object({
	firstName: z.string().min(1, 'First name is required').max(255),
	lastName: z.string().min(1, 'Last name is required').max(255),
	email: z.string().email(),
	password: z.string().min(8, 'Password must be at least 8 characters').max(256),
	token: z.string().min(1)
});
