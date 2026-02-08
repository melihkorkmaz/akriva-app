# Akriva App — Frontend Guidelines

## Architecture — Thin Presentational Layer

**IMPORTANT: This frontend contains NO business logic.** It is a lightweight presentational layer only. All validation, authorization, data processing, and business rules live in the backend API services. The frontend's sole responsibilities are:

- Rendering UI from data received via API
- Collecting user input and forwarding it to the backend
- Displaying errors/feedback returned by the backend
- Client-side UI state (loading spinners, toggling visibility, form field state)

Never implement business logic, data transformation, or decision-making in the frontend. If you're tempted to add an `if` that decides something based on domain rules, it belongs in the backend.

## Stack

- **SvelteKit 2** with Svelte 5 (runes: `$props`, `$state`, `$derived`)
- **Web Awesome 3.2** — UI component library (`<wa-*>` custom elements)
- **Zod 4** — schema validation for API response types
- **Superforms** — form handling with client-side Zod validation (`sveltekit-superforms`)
- **TypeScript strict** mode
- **Vite 7** — build tool
- npm package manager

## Path Aliases

| Alias         | Path              |
| ------------- | ----------------- |
| `$lib`        | `src/lib/`        |
| `$components` | `src/components/` |

## Project Structure

```
src/
  styles/
    theme.css            ← orchestrator: imports WA base + token files
    akriva-tokens.css    ← all --akriva-* design tokens (colors, typography, spacing, etc.)
    wa-overrides.css     ← all --wa-* overrides mapped to akriva tokens
    global.css           ← CSS reset + base element styles + ak-* utility classes
  components/            ← reusable Svelte components
  lib/
    api/                 ← typed API client + DTOs
    schemas/             ← Zod form schemas (shared server + client)
    server/              ← server-only utilities (cookies, auth helpers)
    stores/              ← Svelte stores
  routes/
    +layout.svelte       ← root layout (imports global.css)
    (auth)/              ← auth layout group (no URL segment)
      +layout.svelte     ← centered full-height auth layout
      signup/+page.svelte
      signin/+page.svelte
```

## Design System

### Token Naming Convention

| Prefix       | Scope                                            | Example                                       |
| ------------ | ------------------------------------------------ | --------------------------------------------- |
| `--akriva-*` | App design tokens (source of truth)              | `--akriva-action-primary`, `--akriva-space-4` |
| `--wa-*`     | Web Awesome overrides (references akriva tokens) | `--wa-color-brand-50`, `--wa-space-m`         |

Akriva tokens are defined first in `akriva-tokens.css`. WA overrides in `wa-overrides.css` map `--wa-*` variables to `--akriva-*` values. Never hardcode colors or sizes — always use tokens.

### CSS Class Naming

| Prefix    | Scope                                          | Example                                       |
| --------- | ---------------------------------------------- | --------------------------------------------- |
| `wa-*`    | Web Awesome utility classes (from the library) | `wa-stack`, `wa-gap-m`, `wa-color-text-quiet` |
| No prefix | Scoped component styles (Svelte `<style>`)     | `.text-divider`, `.akriva-logo-text`          |

Use `wa-*` utilities for layout and WA-provided styling. Use `ak-*` for app-specific utilities defined in `global.css`. Component-specific styles go in Svelte scoped `<style>` blocks with descriptive class names.

### Style File Responsibilities

- **`akriva-tokens.css`** — design token definitions only (no selectors, no rules)
- **`wa-overrides.css`** — WA token mappings only (no selectors, no rules)
- **`global.css`** — CSS reset, base element styles (`body`, `h1`-`h6`, `a`), WA element defaults (`wa-card`)
- **`theme.css`** — import orchestrator only (no rules)

### Web Awesome Components

- Components use `<wa-*>` tag names (e.g., `<wa-button>`, `<wa-input>`, `<wa-card>`)
- Cherry-pick JS imports per component: `import '@awesome.me/webawesome/dist/components/button/button.js'`
- Import WA components in layout files so all child pages inherit them
- WA layout utilities: `wa-stack` (vertical), `wa-cluster` (horizontal wrap), `wa-split` (side-by-side)
- WA spacing utilities: `wa-gap-xs`, `wa-gap-s`, `wa-gap-m`, `wa-gap-l`, `wa-gap-xl`

### Component Guidelines

- Props use Svelte 5 `$props()` with TypeScript `interface Props`
- Keep components presentational — no API calls inside components
- Use `--akriva-*` tokens in scoped styles, `wa-*` utilities in markup
- Extract reusable UI into `src/components/` (e.g., `AkrivaLogo.svelte`, `TextDivider.svelte`)

## Forms — Superforms + Zod

Every form uses [sveltekit-superforms](https://superforms.rocks/) with Zod 4 for client-side validation.

### Pattern

1. **Schema** — Define in `src/lib/schemas/<name>.ts` (shared between server and client):

   ```ts
   import { z } from 'zod';
   export const mySchema = z.object({ ... });
   ```

2. **Server** (`+page.server.ts`) — Use `zod4` adapter:

   ```ts
   import { superValidate, message } from "sveltekit-superforms";
   import { zod4 } from "sveltekit-superforms/adapters";
   import { mySchema } from "$lib/schemas/my-schema.js";

   export const load = async () => ({
     form: await superValidate(zod4(mySchema)),
   });

   export const actions = {
     default: async ({ request }) => {
       const form = await superValidate(request, zod4(mySchema));
       if (!form.valid) return fail(400, { form });
       // ... API call ...
       return message(form, "Success");
     },
   };
   ```

3. **Client** (`+page.svelte`) — Use `zod4Client` for client-side validation:

   ```svelte
   <script lang="ts">
     import { superForm } from 'sveltekit-superforms';
     import { zod4Client } from 'sveltekit-superforms/adapters';
     import { mySchema } from '$lib/schemas/my-schema.js';

     let { data } = $props();
     const { form, errors, enhance, message } = superForm(data.form, {
       validators: zod4Client(mySchema),
     });
   </script>
   ```

4. **WA input binding** — Since `<wa-input>` is a custom element, sync values manually:

   ```svelte
   <wa-input
     name="fieldName"
     value={$form.fieldName}
     oninput={(e: Event) => { $form.fieldName = (e.target as HTMLInputElement).value }}
   ></wa-input>
   {#if $errors.fieldName}
     <small class="error-message">{$errors.fieldName[0]}</small>
   {/if}
   ```

5. **API errors** — Use `message(form, 'error text', { status })` on server, display via `$message` on client.

## Code Style

- TypeScript strict mode — no `any`, explicit types for props and API responses
- Svelte 5 runes only (`$props`, `$state`, `$derived`, `$effect`) — no legacy `export let`
- Prefer WA utility classes over custom CSS when a utility exists
- Scoped `<style>` in components — avoid global styles leaking from page/component files

## IMPORTANT

- Always use context7 plugin/skill/mcp to get latest documentation for web development best practices, SvelteKit updates, and Web Awesome usage. This frontend is meant to be a thin layer — any logic or decision-making belongs in the backend API. If you find yourself needing to implement something that feels like business logic, it should be moved to the backend service instead.
- USE ALWAYS CLEAN ARCHITECTURE PRINCIPLES, DO NOT DUPLICATE CODE OR LOGIC
