import { error, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import {
	getWorkflowTemplate,
	updateWorkflowTemplate,
	deleteWorkflowTemplate
} from '$lib/api/workflow-templates.js';
import { ApiError } from '$lib/api/client.js';
import { updateWorkflowTemplateSchema } from '$lib/schemas/workflow-template.js';
import type { TenantRole } from '$lib/api/types.js';

const ADMIN_ROLES: TenantRole[] = ['tenant_admin', 'super_admin'];

function requireAdmin(locals: App.Locals) {
	const session = locals.session!;
	if (!ADMIN_ROLES.includes(session.user.role)) {
		error(403, 'Forbidden');
	}
	return session;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	const session = requireAdmin(locals);

	try {
		const template = await getWorkflowTemplate(session.idToken, params.id);

		const form = await superValidate(
			{
				name: template.name,
				description: template.description
			},
			zod4(updateWorkflowTemplateSchema)
		);

		return {
			template,
			form
		};
	} catch (err) {
		if (err instanceof ApiError) {
			if (err.status === 404) {
				error(404, 'Workflow template not found.');
			}
		}
		error(500, 'Failed to load workflow template.');
	}
};

export const actions: Actions = {
	update: async ({ request, locals, params }) => {
		const session = requireAdmin(locals);
		const form = await superValidate(request, zod4(updateWorkflowTemplateSchema));

		if (!form.valid) {
			return message(form, 'Please check your input.', { status: 400 });
		}

		try {
			await updateWorkflowTemplate(session.idToken, params.id, {
				name: form.data.name,
				description: form.data.description ?? null
			});
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 400) {
					return message(
						form,
						err.body.error || 'Please check your input.',
						{ status: 400 }
					);
				}
				if (err.status === 404) {
					return message(form, 'Template not found.', { status: 404 });
				}
				if (err.status === 409) {
					return message(
						form,
						err.body.error || 'Template cannot be updated.',
						{ status: 409 }
					);
				}
			}
			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		return message(form, 'Template updated successfully.');
	},

	activate: async ({ request, locals, params }) => {
		const session = requireAdmin(locals);
		const form = await superValidate(request, zod4(updateWorkflowTemplateSchema));

		try {
			await updateWorkflowTemplate(session.idToken, params.id, { status: 'active' });
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 404) {
					return message(form, 'Template not found.', { status: 404 });
				}
				if (err.status === 409) {
					return message(
						form,
						err.body.error || 'Template cannot be activated.',
						{ status: 409 }
					);
				}
			}
			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		return message(form, 'Template activated successfully.');
	},

	archive: async ({ request, locals, params }) => {
		const session = requireAdmin(locals);
		const form = await superValidate(request, zod4(updateWorkflowTemplateSchema));

		try {
			await updateWorkflowTemplate(session.idToken, params.id, { status: 'archived' });
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 404) {
					return message(form, 'Template not found.', { status: 404 });
				}
				if (err.status === 409) {
					return message(
						form,
						err.body.error || 'Template cannot be archived.',
						{ status: 409 }
					);
				}
			}
			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		return message(form, 'Template archived successfully.');
	},

	delete: async ({ locals, params }) => {
		const session = requireAdmin(locals);

		try {
			await deleteWorkflowTemplate(session.idToken, params.id);
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 404) {
					error(404, 'Template not found.');
				}
				if (err.status === 409) {
					error(409, err.body.error || 'Only draft templates can be deleted.');
				}
			}
			error(500, 'Something went wrong. Please try again.');
		}

		redirect(302, '/settings/workflow-templates');
	}
};
