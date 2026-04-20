import { getContext, setContext } from 'svelte';
import { isStrongPassword, isValidEmail, isWorkEmail, slugify } from './validators.js';
import {
	LAST_STEP,
	type SsoProvider,
	type StepIndex,
	type TrailEntry,
	type WizardData,
	type WizardErrors,
	type WizardField
} from './types.js';

export const STORAGE_KEY = 'akriva.signup.v2';

const STEP_FIELDS: ReadonlyArray<readonly WizardField[]> = [
	['firstName', 'lastName', 'email'],
	['companyName'],
	['password', 'acceptTerms'],
	['verifyCode']
];

const STEP_FIELDS_SSO: ReadonlyArray<readonly WizardField[]> = [
	['firstName', 'lastName', 'email'],
	['companyName'],
	['acceptTerms'],
	['verifyCode']
];

function defaultData(): WizardData {
	return {
		firstName: '',
		lastName: '',
		email: '',
		companyName: '',
		country: 'US',
		city: '',
		sector: '',
		subSector: '',
		password: '',
		acceptTerms: false,
		verifyCode: '',
		verifyResends: 0
	};
}

/**
 * Idiomatic Svelte 5 port of the React `useReducer` wizard hook from
 * `mockup/src/wizard-state.jsx`. State + actions live on the class; derived
 * selectors use `$derived.by`. Persistence is handled by the consumer via
 * `serialize()` / `hydrate()` so we don't need `$effect.root` here.
 */
export class SignupWizard {
	step: StepIndex = $state(0);
	data: WizardData = $state(defaultData());
	visited: StepIndex[] = $state([0]);
	touched: Partial<Record<WizardField, boolean>> = $state({});
	submitted: Partial<Record<StepIndex, boolean>> = $state({});
	trail: TrailEntry[] = $state([]);
	ssoProvider: SsoProvider = $state(null);
	finished: boolean = $state(false);

	readonly LAST_STEP = LAST_STEP;

	private readonly stepFields = $derived(this.ssoProvider ? STEP_FIELDS_SSO : STEP_FIELDS);

	readonly errors: WizardErrors = $derived.by(() => {
		const d = this.data;
		const e: WizardErrors = {};

		if (!d.firstName.trim()) e.firstName = 'Required';
		if (!d.lastName.trim()) e.lastName = 'Required';

		if (!d.email.trim()) e.email = 'Required';
		else if (!isValidEmail(d.email)) e.email = 'Not a valid email address';
		else if (!isWorkEmail(d.email)) e.email = 'Please use your work email';

		if (!d.companyName.trim()) e.companyName = 'Required';
		else if (d.companyName.length < 2) e.companyName = 'Must be at least 2 characters';

		if (!this.ssoProvider) {
			if (!d.password) e.password = 'Required';
			else if (d.password.length < 8) e.password = 'Must be at least 8 characters';
			else if (!isStrongPassword(d.password))
				e.password = 'Must include uppercase, lowercase, number, and symbol';
		}

		if (!d.acceptTerms) e.acceptTerms = 'You must accept the terms to continue';

		if (!/^\d{6}$/.test(d.verifyCode)) e.verifyCode = 'Enter the 6-digit code we emailed you';

		return e;
	});

	readonly stepErrorsRaw: WizardErrors = $derived.by(() => {
		const fields = this.stepFields[this.step] ?? [];
		const out: WizardErrors = {};
		for (const f of fields) if (this.errors[f]) out[f] = this.errors[f];
		return out;
	});

	readonly stepErrors: WizardErrors = $derived.by(() => {
		const fields = this.stepFields[this.step] ?? [];
		const didSubmit = !!this.submitted[this.step];
		const out: WizardErrors = {};
		for (const f of fields) {
			if (this.errors[f] && (didSubmit || this.touched[f])) out[f] = this.errors[f];
		}
		return out;
	});

	readonly canAdvance: boolean = $derived(Object.keys(this.stepErrorsRaw).length === 0);

	readonly slug: string = $derived(slugify(this.data.companyName));

	// ── Actions ──

	update(patch: Partial<WizardData>): void {
		this.data = { ...this.data, ...patch };
	}

	touch(field: WizardField): void {
		if (!this.touched[field]) this.touched = { ...this.touched, [field]: true };
	}

	setSso(provider: SsoProvider): void {
		this.ssoProvider = provider;
	}

	logTrail(action: string, field: string, value: string): void {
		const ts = new Date().toTimeString().slice(0, 8);
		const entry: TrailEntry = {
			id: Math.random().toString(36).slice(2, 8),
			ts,
			action,
			field,
			value
		};
		const next = [...this.trail, entry];
		this.trail = next.length > 40 ? next.slice(-40) : next;
	}

	resendVerifyCode(): void {
		this.data = { ...this.data, verifyResends: this.data.verifyResends + 1, verifyCode: '' };
		this.logTrail('SYSTEM', 'verify.resend', 'new 6-digit code dispatched');
	}

	changeEmail(): void {
		this.step = 0;
		this.data = { ...this.data, verifyCode: '' };
		this.touched = { ...this.touched, email: false };
		this.submitted = { ...this.submitted, 0: false };
	}

	/** Mark all fields on the current step as touched + step as submitted. Returns whether the step is valid. */
	validateStep(): boolean {
		const fields = this.stepFields[this.step] ?? [];
		this.submitted = { ...this.submitted, [this.step]: true };
		const next = { ...this.touched };
		for (const f of fields) next[f] = true;
		this.touched = next;
		return this.canAdvance;
	}

	private commitLogForStep(s: StepIndex): string | null {
		const d = this.data;
		switch (s) {
			case 0:
				return `name="${d.firstName} ${d.lastName}", email=${d.email}`;
			case 1: {
				const parts = [`company="${d.companyName}"`];
				if (d.sector) parts.push(`sector=${d.sector}`);
				if (d.subSector) parts.push(`› ${d.subSector}`);
				if (d.city) parts.push(`city=${d.city}`);
				return parts.join(', ');
			}
			case 2:
				return this.ssoProvider
					? `sso=${this.ssoProvider}, terms accepted`
					: 'credentials set, terms accepted';
			case 3:
				return `email verified · code ${d.verifyCode}`;
			default:
				return null;
		}
	}

	/** Advance to the next step (no-op if validation fails). Honours SSO skip from step 1 → 3. */
	next(): boolean {
		if (!this.validateStep()) return false;
		const committed = this.commitLogForStep(this.step);
		if (committed) this.logTrail('COMMIT', `step-${this.step + 1}`, committed);

		let nextStep: StepIndex = (this.step + 1) as StepIndex;
		if (this.ssoProvider && this.step === 1) nextStep = 3;
		if (nextStep > LAST_STEP) nextStep = LAST_STEP;

		const wasLast = this.step === LAST_STEP;
		this.step = nextStep;
		if (!this.visited.includes(nextStep)) this.visited = [...this.visited, nextStep];
		if (wasLast) this.finished = true;
		return true;
	}

	/** Skip validation/logging — used after a successful server action (e.g., register). */
	advance(): void {
		const next: StepIndex = (this.step + 1) as StepIndex;
		const target = next > LAST_STEP ? LAST_STEP : next;
		this.step = target;
		if (!this.visited.includes(target)) this.visited = [...this.visited, target];
	}

	back(): void {
		let prev = this.step - 1;
		if (this.ssoProvider && this.step === 3) prev = 1;
		this.step = (prev < 0 ? 0 : prev) as StepIndex;
	}

	jumpTo(i: StepIndex): void {
		if (this.visited.includes(i)) this.step = i;
	}

	finish(): void {
		this.finished = true;
	}

	reset(): void {
		this.step = 0;
		this.data = defaultData();
		this.visited = [0];
		this.touched = {};
		this.submitted = {};
		this.trail = [];
		this.ssoProvider = null;
		this.finished = false;
	}

	// ── Persistence (consumer drives this) ──

	/** JSON snapshot suitable for localStorage. Strips `password` and `verifyCode`. */
	serialize(): string {
		const { password: _p, verifyCode: _v, ...safeData } = this.data;
		return JSON.stringify({
			step: this.step,
			data: safeData,
			visited: this.visited,
			touched: this.touched,
			submitted: this.submitted,
			trail: this.trail,
			ssoProvider: this.ssoProvider,
			finished: this.finished
		});
	}

	hydrate(json: string): void {
		try {
			const saved = JSON.parse(json);
			this.step = (saved.step ?? 0) as StepIndex;
			this.data = {
				...defaultData(),
				...(saved.data ?? {}),
				password: '',
				verifyCode: ''
			};
			this.visited = saved.visited ?? [0];
			this.touched = saved.touched ?? {};
			this.submitted = saved.submitted ?? {};
			this.trail = saved.trail ?? [];
			this.ssoProvider = saved.ssoProvider ?? null;
			this.finished = saved.finished ?? false;
		} catch {
			// Schema drift or corrupted JSON — keep defaults.
		}
	}
}

const WIZARD_KEY = Symbol('signup-wizard');

export function provideWizard(wizard: SignupWizard): SignupWizard {
	setContext(WIZARD_KEY, wizard);
	return wizard;
}

export function useWizard(): SignupWizard {
	const w = getContext<SignupWizard | undefined>(WIZARD_KEY);
	if (!w) throw new Error('SignupWizard context missing — did you forget provideWizard()?');
	return w;
}
