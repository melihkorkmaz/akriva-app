import { error, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { getTask, startTask, submitTask, approveTask, rejectTask } from '$lib/api/tasks.js';
import { getCampaign } from '$lib/api/campaigns.js';
import { listIndicators } from '$lib/api/indicators.js';
import { getEmissionEntry, updateEmissionEntry } from '$lib/api/emission-entries.js';
import { listEmissionSources } from '$lib/api/emission-sources.js';
import { getOrgUnitsTree } from '$lib/api/org-units.js';
import { emissionEntrySchema } from '$lib/schemas/emission-entry.js';
import { taskRejectSchema } from '$lib/schemas/task-reject.js';
import { ApiError } from '$lib/api/client.js';
import type { OrgUnitTreeResponseDto } from '$lib/api/types.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const session = locals.session!;

	try {
		const task = await getTask(session.idToken, params.taskId);
		const [campaign, indicators, orgTree] = await Promise.all([
			getCampaign(session.idToken, task.campaignId),
			listIndicators(session.idToken),
			getOrgUnitsTree(session.idToken)
		]);

		const indicator = indicators.find((ind) => ind.id === campaign.indicatorId);

		// Flatten org tree for name lookup
		function findOrgUnitName(nodes: OrgUnitTreeResponseDto[], id: string): string {
			for (const node of nodes) {
				if (node.id === id) return node.name;
				if (node.children?.length) {
					const found = findOrgUnitName(node.children, id);
					if (found) return found;
				}
			}
			return '';
		}
		const orgUnitName = findOrgUnitName(orgTree.data, task.orgUnitId) || 'Unknown';

		// Load emission entry if exists
		let emissionEntry = null;
		if (task.emissionEntryId) {
			try {
				emissionEntry = await getEmissionEntry(session.idToken, task.emissionEntryId);
			} catch {
				// Entry may not exist yet
			}
		}

		// Load emission sources for this org unit
		let emissionSources: Awaited<ReturnType<typeof listEmissionSources>> = [];
		try {
			emissionSources = await listEmissionSources(session.idToken, {
				orgUnitId: task.orgUnitId
			});
		} catch {
			// Not critical
		}

		// Initialize forms
		const [entryForm, rejectForm] = await Promise.all([
			superValidate(
				emissionEntry
					? {
							sourceId: emissionEntry.sourceId,
							fuelType: emissionEntry.fuelType,
							activityAmount: emissionEntry.activityAmount,
							activityUnit: emissionEntry.activityUnit,
							distance: emissionEntry.distance,
							distanceUnit: emissionEntry.distanceUnit,
							vehicleType: emissionEntry.vehicleType,
							technology: emissionEntry.technology,
							gasType: emissionEntry.gasType,
							refrigerantInventoryStart: emissionEntry.refrigerantInventoryStart,
							refrigerantInventoryEnd: emissionEntry.refrigerantInventoryEnd,
							refrigerantPurchased: emissionEntry.refrigerantPurchased,
							refrigerantRecovered: emissionEntry.refrigerantRecovered,
							productionVolume: emissionEntry.productionVolume,
							productionUnit: emissionEntry.productionUnit,
							abatementEfficiency: emissionEntry.abatementEfficiency,
							notes: emissionEntry.notes
						}
					: {},
				zod4(emissionEntrySchema)
			),
			superValidate(zod4(taskRejectSchema))
		]);

		return {
			task,
			campaign,
			indicator,
			orgUnitName,
			emissionEntry,
			emissionSources,
			entryForm,
			rejectForm
		};
	} catch (err) {
		if (err instanceof ApiError && err.status === 404) {
			error(404, 'Task not found');
		}
		throw err;
	}
};

export const actions: Actions = {
	start: async ({ params, locals }) => {
		const session = locals.session!;
		try {
			await startTask(session.idToken, params.taskId);
		} catch (err) {
			if (err instanceof ApiError) {
				error(err.status, err.body.error || 'Failed to start task');
			}
			error(500, 'Something went wrong');
		}
		redirect(303, `/tasks/${params.taskId}`);
	},

	saveDraft: async ({ request, params, locals }) => {
		const session = locals.session!;
		const form = await superValidate(request, zod4(emissionEntrySchema));

		if (!form.valid) {
			return message(form, 'Please check your entries.', { status: 400 });
		}

		try {
			const task = await getTask(session.idToken, params.taskId);
			if (!task.emissionEntryId) {
				return message(form, 'No emission entry found for this task.', {
					status: 400
				});
			}
			await updateEmissionEntry(session.idToken, task.emissionEntryId, form.data);
		} catch (err) {
			if (err instanceof ApiError) {
				return message(form, err.body.error || 'Failed to save draft.', {
					status: err.status as 400 | 500
				});
			}
			return message(form, 'Something went wrong.', { status: 500 });
		}

		return message(form, 'Draft saved successfully.');
	},

	submit: async ({ params, locals }) => {
		const session = locals.session!;
		try {
			await submitTask(session.idToken, params.taskId);
		} catch (err) {
			if (err instanceof ApiError) {
				error(err.status, err.body.error || 'Failed to submit task');
			}
			error(500, 'Something went wrong');
		}
		redirect(303, `/tasks/${params.taskId}`);
	},

	approve: async ({ params, locals }) => {
		const session = locals.session!;
		try {
			await approveTask(session.idToken, params.taskId);
		} catch (err) {
			if (err instanceof ApiError) {
				error(err.status, err.body.error || 'Failed to approve task');
			}
			error(500, 'Something went wrong');
		}
		redirect(303, `/tasks/${params.taskId}`);
	},

	reject: async ({ request, params, locals }) => {
		const session = locals.session!;
		const form = await superValidate(request, zod4(taskRejectSchema));

		if (!form.valid) {
			return message(form, 'Please provide revision notes.', { status: 400 });
		}

		try {
			await rejectTask(session.idToken, params.taskId, {
				notes: form.data.notes
			});
		} catch (err) {
			if (err instanceof ApiError) {
				return message(form, err.body.error || 'Failed to reject task.', {
					status: err.status as 400 | 500
				});
			}
			return message(form, 'Something went wrong.', { status: 500 });
		}

		redirect(303, `/tasks/${params.taskId}`);
	}
};
