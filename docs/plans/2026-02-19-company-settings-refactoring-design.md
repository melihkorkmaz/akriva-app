# Design: Company Settings Page Refactoring

**Date:** 2026-02-19
**Goal:** Refactor the monolithic company settings page into a clean, component-based architecture that serves as the reference pattern for all future settings pages.

## Key Decisions

- **Approach:** Section components with explicit props (no context, no barrel file)
- **Data flow:** Pass `superform` object and `form` store as props to each section
- **File location:** Route-local `_components/` directory (underscore prefix = SvelteKit ignores as route)
- **Scope:** Company page only; other settings pages follow later using this pattern

## File Structure

```
src/routes/(app)/settings/company/
  +page.svelte                              (~60 lines, orchestrator)
  +page.server.ts                           (unchanged, 81 lines)
  _components/
    CompanyIdentificationSection.svelte     (~40 lines)
    LocalizationSection.svelte              (~75 lines)
    TemporalLogicSection.svelte             (~75 lines)
    SectorSection.svelte                    (~45 lines)
    BoundaryRulesSection.svelte             (~70 lines)
```

## Component Interface Pattern

Every section component follows the same interface:

```svelte
<script lang="ts">
  import type { SuperForm } from 'sveltekit-superforms';
  import type { Writable } from 'svelte/store';
  import { z } from 'zod';
  import { tenantSettingsSchema } from '$lib/schemas/tenant-settings';

  type FormData = z.infer<typeof tenantSettingsSchema>;

  let {
    superform,
    form,
  }: {
    superform: SuperForm<FormData>;
    form: Writable<FormData>;
  } = $props();
</script>
```

Props:
- `superform` — the full SuperForm return object (for `<Form.Field form={superform}>`)
- `form` — the `$form` writable store (for `bind:value={$form.fieldName}`)

## Page Orchestrator (+page.svelte)

Responsibilities:
- Superforms setup (superForm call, destructure stores)
- Alert/error display
- `<form>` wrapper with `use:enhance`
- Renders section components inside Card shells
- Action buttons (Cancel / Save)

## Section Breakdown

### CompanyIdentificationSection
- Fields: `name`, `slug`
- Layout: 2-col grid
- Wrapped in `<Field.Set>` with legend

### LocalizationSection
- Fields: `hqCountry`, `stateProvince`, `city`, `reportingCurrency`
- Layout: 3-col grid + single field with max-width
- Includes `<Field.Separator />` at top

### TemporalLogicSection
- Fields: `fiscalYearStartMonth`, `fiscalYearStartDay`, `baseYear`
- Layout: 4-col grid
- Contains derived state for `fiscalDayLabel`
- Includes `<Field.Separator />` at top

### SectorSection
- Fields: `sector`, `subSector`
- Layout: 2-col grid
- Contains cascade reset logic (clear subSector when sector changes)
- Includes `<Field.Separator />` at top

### BoundaryRulesSection
- Fields: `consolidationApproach` (radio group)
- Layout: Standalone Card (not inside Company Master Settings card)
- Contains derived state for `consolidationApproach`
- Contains info alert about equity share

## What Stays, What Moves

| Element | Location |
|---|---|
| Superforms setup | Stays in `+page.svelte` |
| Derived state | Moves to respective section components |
| Alert/error display | Stays in `+page.svelte` |
| Company Identification fields | → `CompanyIdentificationSection.svelte` |
| Localization fields | → `LocalizationSection.svelte` |
| Temporal Logic fields | → `TemporalLogicSection.svelte` |
| Sector fields | → `SectorSection.svelte` |
| Boundary Rules radio group | → `BoundaryRulesSection.svelte` |
| Action buttons | Stays in `+page.svelte` |
| `+page.server.ts` | **No changes** |
| `tenantSettingsSchema` | **No changes** |

## Dependencies

- No new packages required
- No schema changes
- No server-side changes
- No API changes

## Implementation Steps

1. Create `_components/` directory
2. Extract `CompanyIdentificationSection.svelte`
3. Extract `LocalizationSection.svelte`
4. Extract `TemporalLogicSection.svelte`
5. Extract `SectorSection.svelte`
6. Extract `BoundaryRulesSection.svelte`
7. Refactor `+page.svelte` to orchestrator
8. Verify build passes and form behavior is unchanged
