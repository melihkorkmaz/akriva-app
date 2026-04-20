/** Deterministic tenant ID, format `TNT-NNNN-NNNN` (4-digit segments). */
export function mintTenantId(company: string): string {
	if (!company.trim()) return 'TNT-PENDING';
	let hash = 5381;
	for (let i = 0; i < company.length; i++) {
		hash = ((hash << 5) + hash + company.charCodeAt(i)) >>> 0;
	}
	const a = (hash & 0xffff).toString().padStart(4, '0').slice(-4);
	const b = ((hash >> 16) & 0xffff).toString().padStart(4, '0').slice(-4);
	return `TNT-${a}-${b}`;
}

/** Approximate Scope 1 / 2 / 3 mix (percent) by sector. Defaults to a neutral split. */
const SCOPE_MIX: Record<string, [number, number, number]> = {
	Energy: [70, 15, 15],
	Materials: [55, 20, 25],
	Industrials: [50, 25, 25],
	Manufacturing: [45, 25, 30],
	'Transportation & Logistics': [60, 10, 30],
	Technology: [5, 40, 55],
	'Financial Services': [5, 30, 65],
	'Construction & Real Estate': [15, 25, 60],
	'Agriculture & Forestry': [55, 10, 35],
	Utilities: [60, 20, 20],
	Healthcare: [10, 30, 60],
	'Consumer Goods & Retail': [20, 20, 60]
};

const DEFAULT_MIX: [number, number, number] = [40, 25, 35];

export function getScopeMix(sector: string): [number, number, number] {
	return SCOPE_MIX[sector] ?? DEFAULT_MIX;
}

/** Returns 0–4 maps to a fill ratio + label for the cockpit's single-bar meter. */
export function strengthLabel(score: number): { ratio: number; label: string; tone: 'weak' | 'fair' | 'good' | 'strong' | 'idle' } {
	if (score === 0) return { ratio: 0, label: 'Awaiting input', tone: 'idle' };
	if (score === 1) return { ratio: 0.25, label: 'Too weak — keep going.', tone: 'weak' };
	if (score === 2) return { ratio: 0.5, label: 'Fair — add variety.', tone: 'fair' };
	if (score === 3) return { ratio: 0.8, label: 'Good — meets our policy.', tone: 'good' };
	return { ratio: 1, label: 'Excellent — well above policy.', tone: 'strong' };
}
