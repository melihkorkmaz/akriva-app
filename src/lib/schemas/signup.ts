import { z } from 'zod';
import { isValidEmail, isWorkEmail, isStrongPassword } from '$lib/signup/validators.js';

const passwordField = z
	.string()
	.min(8, 'Must be at least 8 characters')
	.max(256)
	.refine(isStrongPassword, 'Must include uppercase, lowercase, number, and symbol');

const emailField = z
	.string()
	.min(1, 'Required')
	.max(255)
	.refine(isValidEmail, 'Not a valid email address')
	.refine(isWorkEmail, 'Please use your work email');

/** Used by `?/register` action — fields collected over wizard steps 1–3. */
export const signupSchema = z.object({
	firstName: z.string().min(1, 'Required').max(255),
	lastName: z.string().min(1, 'Required').max(255),
	email: emailField,
	companyName: z.string().min(2, 'Must be at least 2 characters').max(255),
	country: z.string().max(2).default('US'),
	city: z.string().max(255).default(''),
	sector: z.string().max(255).default(''),
	subSector: z.string().max(255).default(''),
	password: passwordField,
	acceptTerms: z.boolean().refine((v) => v === true, 'You must accept the terms to continue'),
	// Step-4 field — empty during registration, validated separately on `?/verify`.
	verifyCode: z.string().default('')
});

export type SignupSchema = typeof signupSchema;

export const verifyCodeSchema = z.object({
	verifyCode: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code we emailed you')
});
