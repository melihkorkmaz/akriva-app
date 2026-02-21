import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { signup } from '$lib/api/auth.js';
import { ApiError } from '$lib/api/client.js';
import { setAuthCookies } from '$lib/server/auth.js';
import { invitedSignupSchema } from '$lib/schemas/invited-signup.js';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');
	const email = url.searchParams.get('email');
	const tenantName = url.searchParams.get('tenantName');
	const role = url.searchParams.get('role');
	const error = url.searchParams.get('error');

	// Error state — invalid token
	if (error) {
		return { inviteError: error, form: null };
	}

	// Valid invite — pre-fill form
	if (token && email) {
		const form = await superValidate(
			{ email, token, firstName: '', lastName: '', password: '' },
			zod4(invitedSignupSchema)
		);
		return {
			inviteError: null,
			form,
			tenantName: tenantName ?? 'your organization',
			role: role ?? 'member'
		};
	}

	// No token or error — redirect to normal signup
	redirect(302, '/signup');
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, zod4(invitedSignupSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const response = await signup({
				email: form.data.email,
				password: form.data.password,
				givenName: form.data.firstName,
				familyName: form.data.lastName,
				companyName: '', // Not needed for invited signup
				invitationToken: form.data.token
			});

			setAuthCookies(cookies, response.tokens);
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 409) {
					return message(form, 'An account with this email already exists.', { status: 409 });
				}
				if (err.status === 400) {
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
