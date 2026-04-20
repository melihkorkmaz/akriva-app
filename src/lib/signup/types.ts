export type StepIndex = 0 | 1 | 2 | 3;

export const LAST_STEP: StepIndex = 3;

export type SsoProvider = 'google' | 'microsoft' | null;

export interface WizardData {
	firstName: string;
	lastName: string;
	email: string;
	companyName: string;
	country: string;
	city: string;
	sector: string;
	subSector: string;
	password: string;
	acceptTerms: boolean;
	verifyCode: string;
	verifyResends: number;
}

export type WizardField = keyof WizardData;

export type WizardErrors = Partial<Record<WizardField, string>>;

export interface TrailEntry {
	id: string;
	ts: string;
	action: string;
	field: string;
	value: string;
}

export interface PersistedWizardState {
	step: StepIndex;
	data: Omit<WizardData, 'password' | 'verifyCode'>;
	visited: StepIndex[];
	touched: Partial<Record<WizardField, boolean>>;
	submitted: Partial<Record<StepIndex, boolean>>;
	trail: TrailEntry[];
	ssoProvider: SsoProvider;
	finished: boolean;
}
