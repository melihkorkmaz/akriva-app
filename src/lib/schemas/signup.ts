import { z } from 'zod';

/** Signup form schema — shared between server validation and client-side validation */
export const signupSchema = z.object({
	firstName: z.string().min(1, 'First name is required').max(255),
	lastName: z.string().min(1, 'Last name is required').max(255),
	companyName: z.string().min(1, 'Company name is required').max(255),
	email: z.string().email('Please enter a valid email').max(255),
	password: z.string().min(8, 'Password must be at least 8 characters').max(256)
});
