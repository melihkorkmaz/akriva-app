import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { signup } from '$lib/api/auth.js';
import { ApiError } from '$lib/api/client.js';
import { setAuthCookies } from '$lib/server/auth.js';
import { signupSchema } from '$lib/schemas/signup.js';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(signupSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, zod4(signupSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const response = await signup({
				email: form.data.email,
				password: form.data.password,
				givenName: form.data.firstName,
				familyName: form.data.lastName,
				companyName: form.data.companyName
			});

			setAuthCookies(cookies, response.tokens);
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 409) {
					return message(form, 'An account with this email already exists.', { status: 409 });
				}

				if (err.status === 400 && err.body.code === 'VALIDATION_FAILED') {
					return message(
						form,
						err.body.error || 'Please check your information and try again.',
						{ status: 400 }
					);
				}
			}

			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		redirect(302, '/dashboard');
	}
};
