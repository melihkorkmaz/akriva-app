import { z } from 'zod';

const tenantRoleEnum = z.enum([
	'viewer',
	'data_entry',
	'data_approver',
	'tenant_admin',
	'super_admin'
]);

/** Schema for changing a user's role */
export const changeRoleSchema = z.object({
	userId: z.string().uuid('Invalid user ID'),
	role: tenantRoleEnum
});

/** Schema for updating org-unit assignments (full replace) */
export const updateAssignmentsSchema = z.object({
	userId: z.string().uuid('Invalid user ID'),
	orgUnitIds: z
		.array(z.string().uuid('Invalid org unit ID'))
		.max(100, 'Maximum 100 assignments allowed')
		.refine(
			(ids) => new Set(ids).size === ids.length,
			'Duplicate org unit IDs are not allowed'
		)
});

/** Schema for deactivating a user */
export const deactivateUserSchema = z.object({
	userId: z.string().uuid('Invalid user ID')
});
