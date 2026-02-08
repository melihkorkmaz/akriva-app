import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { signin, verifyMfa } from '$lib/api/auth.js';
import { ApiError } from '$lib/api/client.js';
import { setAuthCookies } from '$lib/server/auth.js';
import { signinSchema, mfaVerifySchema } from '$lib/schemas/signin.js';

export const load: PageServerLoad = async () => {
	const signinForm = await superValidate(zod4(signinSchema), { id: 'signin' });
	const mfaForm = await superValidate(zod4(mfaVerifySchema), { id: 'mfa' });
	return { signinForm, mfaForm };
};

export const actions: Actions = {
	signin: async ({ request, cookies }) => {
		const form = await superValidate(request, zod4(signinSchema), { id: 'signin' });

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const response = await signin({
				email: form.data.email,
				password: form.data.password
			});

			if (response.type === 'mfa_challenge') {
				return { form, mfaRequired: true as const, mfaSession: response.challenge.session };
			}

			setAuthCookies(cookies, response.tokens);
		} catch (err) {
			if (err instanceof ApiError && err.status === 401) {
				return message(form, 'Invalid email or password.', { status: 401 });
			}

			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		redirect(302, '/dashboard');
	},

	mfa: async ({ request, cookies }) => {
		const form = await superValidate(request, zod4(mfaVerifySchema), { id: 'mfa' });

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const tokens = await verifyMfa({
				session: form.data.session,
				code: form.data.code
			});

			setAuthCookies(cookies, tokens);
		} catch (err) {
			if (err instanceof ApiError && err.status === 401) {
				return message(form, 'Invalid verification code. Please try again.', { status: 401 });
			}

			return message(form, 'Something went wrong. Please try again.', { status: 500 });
		}

		redirect(302, '/dashboard');
	}
};
