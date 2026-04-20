/** Ported verbatim from design_handoff_signup_flow/mockup/src/primitives.jsx. */

const PERSONAL_EMAIL_DOMAINS = /(gmail|yahoo|hotmail|outlook|icloud|aol|proton)\.com/i;

export function isValidEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isWorkEmail(value: string): boolean {
	return isValidEmail(value) && !PERSONAL_EMAIL_DOMAINS.test(value);
}

export function slugify(input: string): string {
	const cleaned = input
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 32);
	return cleaned || 'workspace';
}

export function isStrongPassword(value: string): boolean {
	if (value.length < 8) return false;
	return (
		/[A-Z]/.test(value) &&
		/[a-z]/.test(value) &&
		/[0-9]/.test(value) &&
		/[^A-Za-z0-9]/.test(value)
	);
}

/** 0–4. Matches the segment count in the password strength meter. */
export function passwordStrength(value: string): number {
	let score = 0;
	if (value.length >= 8) score++;
	if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
	if (/[0-9]/.test(value)) score++;
	if (/[^A-Za-z0-9]/.test(value)) score++;
	return score;
}
