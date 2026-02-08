import { z } from 'zod';

/** Signin form schema */
export const signinSchema = z.object({
	email: z.string().email('Please enter a valid email').max(255),
	password: z.string().min(8, 'Password must be at least 8 characters').max(256)
});

/** MFA verification form schema */
export const mfaVerifySchema = z.object({
	session: z.string().min(1, 'Session is required'),
	code: z.string().min(1, 'Please enter your verification code')
});
