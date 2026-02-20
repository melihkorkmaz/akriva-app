import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { moveOrgUnit } from '$lib/api/org-units.js';
import { ApiError } from '$lib/api/client.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = locals.session!;
	const { id, parentId, orderIndex } = await request.json();

	if (!id || typeof id !== 'string') {
		return json({ error: 'Missing required field: id' }, { status: 400 });
	}

	try {
		const result = await moveOrgUnit(session.idToken, id, {
			parentId: parentId ?? null,
			orderIndex: orderIndex ?? 0
		});
		return json(result);
	} catch (err) {
		if (err instanceof ApiError) {
			return json({ error: err.body.error, code: err.body.code }, { status: err.status });
		}
		return json({ error: 'Something went wrong.' }, { status: 500 });
	}
};
