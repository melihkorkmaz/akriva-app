import { error, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { createWorkflowTemplate } from '$lib/api/workflow-templates.js';
import { ApiError } from '$lib/api/client.js';
import { requireAdmin } from '$lib/server/auth.js';
import { createWorkflowTemplateSchema } from '$lib/schemas/workflow-template.js';

/**
 * Auto-generate workflow steps based on the number of approval tiers.
 */
function generateSteps(tiers: number) {
	const steps: Array<{
		name: string;
		type: 'submit' | 'review' | 'approve';
		assignedRole: string;
		stepOrder: number;
	}> = [];

	// Step 1: Submit
	steps.push({
		name: 'Submit Data',
		type: 'submit',
		assignedRole: 'data_entry',
		stepOrder: 1
	});

	if (tiers === 1) {
		// Single tier: step 2 is approve
		steps.push({
			name: 'Approval',
			type: 'approve',
			assignedRole: 'data_approver',
			stepOrder: 2
		});
	} else if (tiers === 2) {
		steps.push({
			name: 'Tier 1 Review',
			type: 'review',
			assignedRole: 'data_approver',
			stepOrder: 2
		});
		steps.push({
			name: 'Tier 2 Approval',
			type: 'approve',
			assignedRole: 'data_approver',
			stepOrder: 3
		});
	} else {
		// 3 tiers
		steps.push({
			name: 'Tier 1 Review',
			type: 'review',
			assignedRole: 'data_approver',
			stepOrder: 2
		});
		steps.push({
			name: 'Tier 2 Review',
			type: 'review',
			assignedRole: 'data_approver',
			stepOrder: 3
		});
		steps.push({
			name: 'Final Approval',
			type: 'approve',
			assignedRole: 'tenant_admin',
			stepOrder: 4
		});
	}

	return steps;
}

/**
 * Auto-generate transitions: each step flows to the next (complete),
 * and each review/approve step can reject back to step 1.
 */
function generateTransitions(
	steps: Array<{ type: string; stepOrder: number }>
) {
	const transitions: Array<{
		fromStepOrder: number;
		toStepOrder: number;
		trigger: string;
		rejectionTargetStepOrder?: number | null;
	}> = [];

	for (let i = 0; i < steps.length - 1; i++) {
		// Forward transition: complete
		transitions.push({
			fromStepOrder: steps[i].stepOrder,
			toStepOrder: steps[i + 1].stepOrder,
			trigger: 'complete'
		});
	}

	// Rejection transitions: review/approve steps reject back to step 1
	for (const step of steps) {
		if (step.type === 'review' || step.type === 'approve') {
			transitions.push({
				fromStepOrder: step.stepOrder,
				toStepOrder: 1,
				trigger: 'reject',
				rejectionTargetStepOrder: 1
			});
		}
	}

	return transitions;
}

export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals);
	const form = await superValidate(zod4(createWorkflowTemplateSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		requireAdmin(locals);
		const session = locals.session!;
		const form = await superValidate(request, zod4(createWorkflowTemplateSchema));

		if (!form.valid) {
			return message(form, 'Please check your input.', { status: 400 });
		}

		const steps = generateSteps(form.data.approvalTiers);
		const transitions = generateTransitions(steps);

		try {
			const created = await createWorkflowTemplate(session.idToken, {
				name: form.data.name,
				description: form.data.description ?? null,
				steps,
				transitions
			});

			redirect(302, `/settings/workflow-templates/${created.id}`);
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 400) {
					return message(
						form,
						err.body.error || 'Please check your input.',
						{ status: 400 }
					);
				}
				if (err.status === 409) {
					return message(
						form,
						err.body.error || 'A template with this name already exists.',
						{ status: 409 }
					);
				}
			}
			// Re-throw redirect
			throw err;
		}
	}
};
