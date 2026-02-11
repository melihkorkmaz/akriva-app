import type { Action } from 'svelte/action';

/**
 * Svelte action: imperative `change` listener for Web Awesome custom elements.
 * WA 3.2 dispatches native `change` events (not `wa-change`).
 * Svelte 5 doesn't reliably wire `onchange` on custom elements, so we use addEventListener.
 */
export const waChange: Action<HTMLElement, (value: string) => void> = (node, handler) => {
	let current = handler;
	const listener = () => current((node as unknown as { value: string }).value);
	node.addEventListener('change', listener);
	return {
		update(h) { current = h; },
		destroy() { node.removeEventListener('change', listener); }
	};
};
