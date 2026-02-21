import { z } from 'zod';

const tenantRoleEnum = z.enum([
	'viewer',
	'data_entry',
	'data_approver',
	'tenant_admin',
	'super_admin'
]);

/** Schema for creating an invite */
export const createInviteSchema = z.object({
	email: z.string().email('Please enter a valid email').max(255),
	role: tenantRoleEnum,
	expiresInDays: z.coerce.number().int().min(1).max(30).default(7)
});

/** Schema for revoking an invite */
export const revokeInviteSchema = z.object({
	inviteId: z.string().uuid('Invalid invite ID')
});
