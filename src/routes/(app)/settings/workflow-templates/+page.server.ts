import { error } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import {
	listWorkflowTemplates,
	deleteWorkflowTemplate,
	updateWorkflowTemplate
} from '$lib/api/workflow-templates.js';
import { ApiError } from '$lib/api/client.js';
import { requireAdmin } from '$lib/server/auth.js';
import { z } from 'zod';

/** Minimal schema just to carry the template id for actions */
const templateActionSchema = z.object({
	id: z.string().min(1)
});

export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals);
	const session = locals.session!;

	try {
		const response = await listWorkflowTemplates(session.idToken);
		const actionForm = await superValidate(zod4(templateActionSchema));

		return {
			templates: response.data,
			total: response.total,
			actionForm
		};
	} catch (err) {
		if (err instanceof ApiError) {
			if (err.status === 403) {
				error(403, 'You do not have permission to view workflow templates.');
			}
		}
		error(500, 'Failed to load workflow templates.');
	}
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		requireAdmin(locals);
		const session = locals.session!;
		const form = await superValidate(request, zod4(templateActionSchema));

		if (!form.valid) {
			return message(form, 'Invalid request.', { status: 400 });
		}

		try {
			await deleteWorkflowTemplate(session.idToken, form.data.id);
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 404) {
					return message(form, 'Template not found.', { status: 404 });
				}
				if (err.status === 409) {
					return message(
						form,
						err.body.error || 'Only draft templates can be deleted.',
						{ status: 409 }
					);
				}
			}
			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		return message(form, 'Template deleted successfully.');
	},

	activate: async ({ request, locals }) => {
		requireAdmin(locals);
		const session = locals.session!;
		const form = await superValidate(request, zod4(templateActionSchema));

		if (!form.valid) {
			return message(form, 'Invalid request.', { status: 400 });
		}

		try {
			await updateWorkflowTemplate(session.idToken, form.data.id, { status: 'active' });
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

	archive: async ({ request, locals }) => {
		requireAdmin(locals);
		const session = locals.session!;
		const form = await superValidate(request, zod4(templateActionSchema));

		if (!form.valid) {
			return message(form, 'Invalid request.', { status: 400 });
		}

		try {
			await updateWorkflowTemplate(session.idToken, form.data.id, { status: 'archived' });
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
	}
};
