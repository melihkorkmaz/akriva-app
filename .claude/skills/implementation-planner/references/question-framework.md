# Question Framework

This reference defines the question categories, templates, and adaptive scaling logic used in Phase 3 (User Questions).

## Core Principles

1. **Always present concrete options with tradeoffs** — never ask vague questions
2. **Proactively suggest ideas** — offer your recommendation and ask for feedback
3. **Use `AskUserQuestion` tool** with structured options whenever possible
4. **Surface conflicts** from Phase 1 — if prior plans disagree, ask the user to resolve
5. **Scale questions to complexity** — don't overwhelm for simple features

## Question Categories

### A. Scope & Requirements

Use when: feature boundaries are unclear, requirements have ambiguity, or there are prioritization decisions.

**Templates:**

1. **MVP Scope**
   - "What's the MVP scope for this feature? I see three possible boundaries:"
   - Option A: Minimal (just the core UI with static data)
   - Option B: Standard (core UI + API integration + error handling)
   - Option C: Full (standard + loading states + form validation + toast notifications)

2. **Ambiguous Terms**
   - "The requirement mentions '[term]'. In our context, this could mean:"
   - Option A: [interpretation 1 — explain UI implications]
   - Option B: [interpretation 2 — explain UI implications]

3. **Priority Order**
   - "I identified N sub-features. Which order should we implement?"
   - Option A: [ordering 1 — explain dependency chain]
   - Option B: [ordering 2 — explain tradeoffs]

### B. Edge Cases & Error Handling

Use when: the feature involves forms, API calls, or dynamic user interactions.

**Templates:**

1. **Loading States**
   - "How should we handle loading states for this feature?"
   - Option A: Skeleton UI (placeholder shapes while loading)
   - Option B: Spinner/loading indicator (simple, less polished)
   - Option C: Progressive loading (show partial data as it arrives)

2. **API Error Display**
   - "When the API returns an error for this operation, how should we display it?"
   - Option A: Toast notification (non-blocking, auto-dismiss)
   - Option B: Inline error message (near the form field or action)
   - Option C: Page-level error banner (prominent, requires dismissal)

3. **Form Validation UX**
   - "When should form validation errors appear?"
   - Option A: On submit only (less noise, delayed feedback)
   - Option B: On blur (field-level, immediate after leaving field)
   - Option C: Real-time as user types (most responsive, potentially noisy)

4. **Network Failure Handling**
   - "What should happen if the API call fails due to network issues?"
   - Option A: Show error toast with retry button
   - Option B: Show error state in-place with retry option
   - Option C: Silently retry N times, then show error

### C. Architecture & Design

Use when: the feature introduces new UI patterns, requires route decisions, or involves component design.

**Templates:**

1. **Route Placement**
   - "Where should this page live in the route structure?"
   - Option A: Under `(app)/settings/` (grouped with settings pages)
   - Option B: Under `(app)/[new-section]/` (new top-level section)
   - Option C: Under existing route group `(app)/[existing]/` (extend current section)

2. **Component Design**
   - "Should this UI be a reusable component or page-specific?"
   - Option A: Reusable component in `src/components/` (shared across pages)
   - Option B: Page-specific markup in `+page.svelte` (simpler, no abstraction)
   - Option C: Extracted component within the route directory (co-located, single-use but clean)

3. **State Management**
   - "How should state be managed for this feature?"
   - Option A: Superforms (form data with validation, ideal for CRUD)
   - Option B: Svelte store in `src/lib/stores/` (shared reactive state)
   - Option C: Local component state with `$state` rune (page-scoped, simple)

4. **Data Loading**
   - "How should data be loaded for this page?"
   - Option A: Server load function in `+page.server.ts` (SSR, SEO-friendly)
   - Option B: Form action for mutations only, server load for reads
   - Option C: Client-side fetch with loading state (dynamic, no SSR)

### D. Integration & Dependencies

Use when: the feature connects to backend APIs, reuses existing UI, or affects shared components.

**Templates:**

1. **API Contract**
   - "The backend returns [shape]. How should we display this data?"
   - Option A: Direct mapping (render API response as-is)
   - Option B: Transform for display (format dates, map enums to labels)
   - Option C: Aggregate/group the data before rendering

2. **Component Reuse**
   - "Similar UI exists in [page]. Should we extract a shared component?"
   - Option A: Extract shared component to `src/components/` (DRY, shared maintenance)
   - Option B: Copy and adapt (independent evolution, no coupling)
   - Option C: Use the existing component with new props/slots

3. **Design System**
   - "For this UI element, should we use an existing Web Awesome component or build custom?"
   - Option A: Use `<wa-[component]>` directly (consistent, less work)
   - Option B: Wrap `<wa-[component]>` in a custom Svelte component (add app-specific behavior)
   - Option C: Custom implementation (full control, more maintenance)

### E. Testing & Validation

Use when: the feature is complex, involves critical user flows, or has specific quality requirements.

**Templates:**

1. **Test Coverage Depth**
   - "How thorough should testing be for this feature?"
   - Option A: Unit tests for utility logic only (fast, focused)
   - Option B: Unit + component tests with @testing-library/svelte (thorough)
   - Option C: Full coverage including Playwright e2e tests (comprehensive)

2. **Visual Testing**
   - "Should we include visual/screenshot testing?"
   - Option A: No visual tests (rely on manual review)
   - Option B: Playwright screenshot comparisons for key states
   - Option C: Storybook stories for component variations

## Anti-Patterns (AVOID)

| Anti-Pattern | Example | Better Alternative |
|---|---|---|
| Vague question | "How should error handling work?" | "If the API returns 403 when saving company settings, should we show an inline error or redirect to login?" |
| No options | "What component library should we use?" | "For the date picker: use `<wa-input type='date'>` (simple, consistent) or custom DatePicker component (more control)?" |
| Answerable from code | "What form pattern do we use?" | Read the code first, then ask about deviations from the pattern |
| Too many questions | 10 questions for a simple component | Scale to complexity — 3 questions for simple features |
| Leading question | "Should we obviously use Option A?" | Present genuine tradeoffs for each option |

## Adaptive Scaling Logic

### Simple Change (1 route, no new routes, minor UI modification)

- **Questions**: 3
- **Categories**: 2 (usually A + B or A + C)
- **Example**: Adding a new field to an existing form

### Medium Feature (1-2 routes, new forms/pages)

- **Questions**: 4-5
- **Categories**: 3 (usually A + C + D or A + B + C)
- **Example**: Adding a new settings page with form

### Complex Feature (multi-route, new components, new patterns)

- **Questions**: 5+
- **Categories**: 4+ (all categories relevant)
- **Example**: New GHG emissions data entry module with multiple pages

## Using AskUserQuestion Tool

When possible, structure questions for the `AskUserQuestion` tool:

```
Question: "How should we handle form validation for the emissions entry form?"
Header: "Validation"
Options:
  - Label: "On submit only"
    Description: "Validate all fields when user clicks Save. Simpler UX, but errors appear late."
  - Label: "On blur per field"
    Description: "Validate each field when user tabs away. Immediate feedback without being intrusive."
  - Label: "Real-time with debounce"
    Description: "Validate as user types (300ms debounce). Most responsive but potentially noisy for complex fields."
MultiSelect: false
```

For questions with nuanced answers that don't fit structured options, ask in plain text instead.
