import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { fetchCurrentUser, updateProfile } from '$lib/api/users.js';
import { ApiError } from '$lib/api/client.js';
import { profileSchema } from '$lib/schemas/profile.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session!;
	const currentUser = await fetchCurrentUser(session.idToken);

	const form = await superValidate(
		{ displayName: currentUser.displayName ?? '' },
		zod4(profileSchema)
	);

	return {
		currentUser,
		form
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const session = locals.session!;
		const form = await superValidate(request, zod4(profileSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await updateProfile(session.idToken, {
				displayName: form.data.displayName
			});
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 400) {
					return message(form, err.body.error || 'Please check your input.', { status: 400 });
				}
			}
			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		return message(form, 'Profile updated successfully.');
	}
};
