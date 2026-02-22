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
import {
	listEvidenceByEntry as apiListEvidence,
	requestUploadUrl as apiRequestUploadUrl,
	confirmUpload as apiConfirmUpload,
	getDownloadUrl as apiGetDownloadUrl,
	deleteEvidence as apiDeleteEvidence
} from '$lib/api/evidence.js';
import type { OrgUnitTreeResponseDto, EvidenceFileResponseDto } from '$lib/api/types.js';

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

		// Load evidence files for the emission entry
		let evidenceFiles: EvidenceFileResponseDto[] = [];
		if (task.emissionEntryId) {
			try {
				evidenceFiles = await apiListEvidence(session.idToken, task.emissionEntryId);
			} catch {
				// Endpoint may not exist yet — graceful fallback
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

		// Initialize entry form
		const entryForm = await superValidate(
			emissionEntry
				? {
						sourceId: emissionEntry.sourceId,
						fuelType: emissionEntry.fuelType,
						activityAmount: emissionEntry.activityAmount,
						activityUnit: emissionEntry.activityUnit,
						distance: emissionEntry.distance,
						distanceUnit: emissionEntry.distanceUnit as 'km' | 'miles' | null,
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
		);

		return {
			task,
			campaign,
			indicator,
			orgUnitName,
			emissionEntry,
			evidenceFiles,
			emissionSources,
			entryForm
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
	},

	requestUploadUrl: async ({ request, locals }) => {
		const session = locals.session!;
		const formData = await request.formData();
		const originalFilename = formData.get('originalFilename') as string;
		const contentType = formData.get('contentType') as string;

		try {
			const result = await apiRequestUploadUrl(session.idToken, {
				originalFilename,
				contentType
			});
			return { uploadUrl: result.uploadUrl, evidenceId: result.evidenceId };
		} catch (err) {
			if (err instanceof ApiError) {
				return { error: err.body.error || 'Failed to get upload URL.' };
			}
			return { error: 'Something went wrong.' };
		}
	},

	confirmUpload: async ({ request, locals }) => {
		const session = locals.session!;
		const formData = await request.formData();
		const evidenceId = formData.get('evidenceId') as string;

		try {
			const evidence = await apiConfirmUpload(session.idToken, evidenceId);
			return { evidence };
		} catch (err) {
			if (err instanceof ApiError) {
				return { error: err.body.error || 'Failed to confirm upload.' };
			}
			return { error: 'Something went wrong.' };
		}
	},

	downloadEvidence: async ({ request, locals }) => {
		const session = locals.session!;
		const formData = await request.formData();
		const evidenceId = formData.get('evidenceId') as string;

		try {
			const downloadUrl = await apiGetDownloadUrl(session.idToken, evidenceId);
			return { downloadUrl };
		} catch (err) {
			if (err instanceof ApiError) {
				return { error: err.body.error || 'Failed to get download URL.' };
			}
			return { error: 'Something went wrong.' };
		}
	},

	deleteEvidence: async ({ request, locals }) => {
		const session = locals.session!;
		const formData = await request.formData();
		const evidenceId = formData.get('evidenceId') as string;

		try {
			await apiDeleteEvidence(session.idToken, evidenceId);
			return { success: true };
		} catch (err) {
			if (err instanceof ApiError) {
				return { error: err.body.error || 'Failed to delete evidence.' };
			}
			return { error: 'Something went wrong.' };
		}
	}
};
