// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: {
				accessToken: string;
				user: {
					id: string;
					email: string;
					tenantId: string;
					role: 'owner' | 'admin' | 'user';
					givenName: string;
					familyName: string;
				};
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
