# Design Review Checklist

Complete checklist used by the design-reviewer agent to validate design documents against
akriva-app frontend conventions. Each category has specific checks with pass/fail criteria.

---

## 1. Architecture Compliance

- [ ] **No business logic**: Frontend contains zero domain logic — no if/else based on business rules, no data transformations, no authorization decisions beyond route guards
- [ ] **Thin presentational layer**: Components only render API data, collect input, display feedback, and manage UI state
- [ ] **Server-side data loading**: All API calls happen in `+page.server.ts` load functions or actions, never in client-side Svelte components
- [ ] **Redirect pattern**: Successful form submissions redirect with `redirect(303, '/path')`, not client-side navigation
- [ ] **Error delegation**: Backend errors surfaced via `message(form, ...)` — frontend does not interpret error meanings
- [ ] **File placement**: New files follow standard directory conventions (routes, components, schemas, API)

## 2. shadcn-svelte Patterns

- [ ] **Namespace imports**: Compound components use `import * as Card from "$lib/components/ui/card/index.js"`
- [ ] **Named imports**: Single components use `import { Button } from "$lib/components/ui/button/index.js"`
- [ ] **Full path imports**: All UI imports include `/index.js` suffix
- [ ] **Component reuse**: Uses existing shadcn-svelte components instead of creating custom equivalents
- [ ] **No duplicate components**: Does not recreate functionality already in the component library
- [ ] **Custom component convention**: New reusable components go in `src/components/`, page-local in `_components/`
- [ ] **Snippet pattern**: Form controls use `{#snippet children({ props })}` pattern with `{...props}`

## 3. Superforms Pattern

- [ ] **Full superform object**: `const superform = superForm(data.form, { ... })` stored as full object
- [ ] **Destructured stores**: `const { form, errors, enhance, message, submitting } = superform`
- [ ] **Form.Field receives superform**: `<Form.Field form={superform} name="...">` — NOT `form={form}`
- [ ] **use:enhance directive**: Form element has `use:enhance` for progressive enhancement
- [ ] **zod4Client validator**: Client-side validation uses `validators: zod4Client(schema)`
- [ ] **Server-side validation**: `+page.server.ts` uses `superValidate(request, zod4(schema))`
- [ ] **Form message handling**: `onUpdated` callback handles success/error messages with `toast`
- [ ] **Error display**: `<Form.FieldErrors />` present for every field
- [ ] **Message display**: Global form message displayed via Alert component when `$message` is truthy

## 4. Design Token Usage

- [ ] **No hardcoded colors**: All colors use Tailwind utilities mapped to CSS variables (e.g., `bg-primary`, `text-foreground`)
- [ ] **No hardcoded fonts**: Uses `font-sans` (Inter) via design token
- [ ] **No hardcoded radii**: Uses token-based radii (`rounded-xl` for cards, default for others)
- [ ] **No hardcoded shadows**: Uses shadow scale from `app.css` (`shadow-2xs` through `shadow-2xl`)
- [ ] **Typography hierarchy**: Follows standard sizes (page: `text-2xl`, section: `text-xl`, card: `text-lg`, body: `text-sm`, helper: `text-xs`)
- [ ] **Spacing scale**: Uses standard Tailwind 4px scale
- [ ] **Interactive states**: Includes `hover:`, `focus-visible:`, `transition-colors` where appropriate
- [ ] **Error states**: Form inputs have `aria-invalid:border-destructive` styling

## 5. API Integration

- [ ] **apiFetchAuth usage**: All authenticated API calls use `apiFetchAuth<T>(endpoint, token, options)`
- [ ] **Token from session**: Token sourced from `locals.session!.idToken`
- [ ] **Type parameter**: API calls include response type parameter `<ResponseDto>`
- [ ] **ApiError catch**: Try/catch blocks catch `ApiError` and map to form messages
- [ ] **Status code handling**: Handles 400 (validation), 403 (forbidden), 409 (conflict) at minimum
- [ ] **Parallel loading**: Independent API calls use `Promise.all()` in load functions
- [ ] **Error re-throw**: Unexpected errors re-thrown for SvelteKit error handling
- [ ] **Request body**: POST/PATCH use `JSON.stringify()` for request body
- [ ] **Types defined**: All request/response types exist in `src/lib/api/types.ts`

## 6. Type Safety

- [ ] **TypeScript strict**: All files comply with strict mode — no `any` types unless justified
- [ ] **Zod inference**: Form data types use `Infer<typeof schema>` for type inference
- [ ] **Props typing**: Component props use Svelte 5 `$props()` with explicit types
- [ ] **State typing**: `$state()` and `$derived()` have correct type annotations where needed
- [ ] **API response types**: All API responses typed in `src/lib/api/types.ts`
- [ ] **Schema completeness**: Zod schemas cover all form fields with appropriate constraints

## 7. Accessibility

- [ ] **Semantic HTML**: Uses appropriate elements (button, nav, main, section, h1-h6)
- [ ] **Form labels**: Every form input has an associated `<Form.Label>`
- [ ] **Error association**: Form errors linked to inputs via `aria-invalid` and `aria-describedby`
- [ ] **Keyboard navigation**: Interactive elements accessible via keyboard (Tab, Enter, Escape)
- [ ] **Focus management**: Focus moves appropriately after actions (dialog open/close, form submit)
- [ ] **Alt text**: Images have meaningful alt attributes
- [ ] **ARIA attributes**: Dynamic UI (dialogs, dropdowns, tooltips) uses proper ARIA roles

## 8. Routing Conventions

- [ ] **Layout groups**: Uses `(auth)/` for guest pages, `(app)/` for protected pages
- [ ] **Dynamic routes**: Uses `[param]` for dynamic segments
- [ ] **Load function**: `+page.server.ts` exports `load` for data fetching
- [ ] **Actions**: Form submissions use SvelteKit `actions` in `+page.server.ts`
- [ ] **Auth guards**: Protected routes check session via `locals.session!` or `requireAdmin()`
- [ ] **Page titles**: `<svelte:head><title>Page | Akriva</title></svelte:head>`
- [ ] **Breadcrumbs**: Page includes appropriate breadcrumb navigation
- [ ] **Back navigation**: Detail/edit pages have back button or breadcrumb to parent

## 9. Component Design

- [ ] **Svelte 5 runes**: Uses `$props()`, `$state()`, `$derived()`, `$bindable()` — no legacy `export let`
- [ ] **Props interface**: Explicit destructured props with defaults where appropriate
- [ ] **Reactive derivations**: Computed values use `$derived()` or `$derived.by()`, not reactive statements
- [ ] **Event handling**: Uses `onclick`, `onchange` attributes (not `on:click`, `on:change`)
- [ ] **cn() for conditional classes**: Dynamic class merging uses `cn()` from `$lib/utils.js`
- [ ] **Icon imports**: Lucide icons from `@lucide/svelte/icons/{name}`, not barrel imports
- [ ] **Icon sizing**: Standard sizes used (`size-4` default, `size-3.5` small, `size-6` large)

## 10. Spec Alignment

- [ ] **All pages covered**: Every route from spec has corresponding route files in design
- [ ] **Acceptance criteria mapped**: Each spec criterion has corresponding implementation detail
- [ ] **Out of scope respected**: Design does not include spec's "Out of Scope" items
- [ ] **API endpoints exist**: All API endpoints referenced in design exist in backend or have approved backend specs
- [ ] **Figma alignment**: If Figma design provided, design matches visual layout and component choices
- [ ] **User roles respected**: Authorization checks match spec's role requirements

---

## Severity Guide

| Severity | Criteria | Action Required |
|----------|----------|-----------------|
| **Blocker** | Violates architecture (business logic in frontend), breaks Superforms pattern, causes type errors, missing API integration, security issue | Must fix before approval |
| **Warning** | Pattern deviation (wrong import style), missing error handling, incomplete accessibility, inconsistent styling | Should fix, can proceed with justification |
| **Suggestion** | Style improvement, additional loading states, optional UX enhancement | Nice to have, not blocking |
