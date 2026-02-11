import type { Session } from '$lib/server/auth.js';

declare global {
	namespace App {
		interface Locals {
			session: Session | null;
		}
	}
}

export {};
