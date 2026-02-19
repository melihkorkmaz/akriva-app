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

## Second Brain

All project knowledge - architecture decisions, error patterns, dependency choices, discussions, and context - lives in the **NotebookLM notebook**. This file does NOT store knowledge.
The notebook is the single source of truth. Always use nlm-cli-skill to interact with notebooklm.

### Notebooks

#### 1. Project Knowledge (Second Brain)

- **Notebook Name**: Akriva Frontend - Second Brain
- **Notebook ID**: `f0188b2a-2b42-4db1-9421-d5f4df9b17e6`
- **Alias**: `fe-akriva`
- **Contents**: Frontend project knowledge — architecture, codebase structure, coding patterns, API integration, authentication system, UI components, design system, company settings feature, and Product Requirement Document

#### 2. Tech Documentation

- **Notebook Name**: Akriva - Tech Documentation
- **Notebook ID**: `07cbc727-79f2-48e5-be8e-d35144178637`
- **Alias**: `techdocs`
- **Contents**: Frontend tech stack documentation — Svelte 5 runes ($state, $derived, $effect, $props, $bindable, snippets), SvelteKit 2 (routing, load, form actions, hooks), Superforms (setup, validation, events, error handling), Zod 4 (types, refinements, coercion, transforms), Web Awesome 3.2 (input, select, radio, dialog, tabs, tokens), Vite 7 (config, proxy, env vars, plugins). Also includes backend references: Zod v3, Vitest, Drizzle ORM, AWS CDK/DynamoDB/Cognito, tsyringe, Stripe, Neon

#### 3. Full Codebase (Repomix)

- **Notebook Name**: Akriva - Repomix Codebase
- **Notebook ID**: `905dbd90-acd9-4870-ae4d-c5aedebbe654`
- **Alias**: `akriva-repomix`
- **Contents**: Complete frontend and backend codebases packed as XML via Repomix (2 sources: Akriva Frontend, Akriva Backend)

#### 4. GHG Domain Knowledge

- **Notebook Name**: Akriva - GHG Domain Knowledge
- **Notebook ID**: `03d2f415-5cb6-4922-a6d8-3dd7c34d2463`
- **Alias**: `ghg-domain`
- **Contents**: Deep research on GHG reporting business domain — GHG Protocol (Scope 1/2/3), ISO 14064, CSRD, SEC climate disclosure, emission factor management (DEFRA/EPA/IPCC), consolidation approaches, audit/verification standards, data quality frameworks, multi-entity reporting structures

### Search-First Rule

**When you need to search for anything related to this project — ALWAYS query the appropriate NotebookLM notebook FIRST before searching the codebase or web.**

Use the nlm CLI:

```bash
# Project architecture, patterns, decisions, codebase knowledge
nlm notebook query fe-akriva "your question here"

# Library/framework API usage, syntax, examples
nlm notebook query techdocs "your question here"

# Full codebase context / cross-domain search
nlm notebook query akriva-repomix "your question here"

# GHG business domain knowledge (emissions, compliance, audit standards)
nlm notebook query ghg-domain "your question here"
```

The Second Brain notebook (`fe-akriva`) contains these source documents:

1. **Product Requirement Document** — GHG reporting platform vision, product pillars, personas, functional requirements, compliance, success metrics, roadmap
2. **Project Overview & Architecture** — Tech stack, project structure, package dependencies, architecture flow, backend API overview
3. **API Layer — Client, Types & Domain APIs** — ApiError class, fetch wrappers, all TypeScript interfaces (auth, tenant, shared types), auth API functions, tenant API functions
4. **Authentication System** — Server auth utilities, JWT handling, session types, hooks.server.ts middleware, route guards, auth store, signin/signup/logout flows
5. **Company Settings Page** — Tenant settings feature: server load/action, Superforms configuration, form sections, sector cascade, Zod schema, error handling
6. **UI Components, Layouts & Design System** — Reusable components (CountrySelect, DatePicker, TextDivider, AkrivaLogo), app shell layout, settings layout, waChange action, design token system
7. **Coding Patterns & Conventions** — Svelte 5 runes usage, Superforms+Zod patterns, WA event handling, nullable field patterns, error handling, cascading select, file organization, CSS conventions

### When to Search — Tool & Notebook Reference

**Available tools:**

- **`fe-akriva`** (nlm) — Project knowledge, architecture, patterns, PRD, prior plans
- **`techdocs`** (nlm) — Tech stack docs (Svelte 5, SvelteKit 2, Superforms, Zod 4, Web Awesome 3.2, Vite 7)
- **`ghg-domain`** (nlm) — GHG reporting domain (protocols, standards, methodologies)
- **`akriva-repomix`** (nlm) — Full frontend + backend codebase snapshot (Repomix XML)
- **Code** — Direct codebase search (Glob, Grep, Read tools)
- **Context7** — Live library/framework documentation lookup (context7 MCP plugin)
- **claude-mem** — Cross-session memory (past work, decisions, debugging insights)
- **Web Search** — General web search for current information

| Question Type                                           | Search First               | Fallback        |
| ------------------------------------------------------- | -------------------------- | --------------- |
| Product requirements and features                       | `fe-akriva`                | —               |
| Business logic and domain rules                         | `fe-akriva`                | Code            |
| User stories and acceptance criteria                    | `fe-akriva`                | —               |
| Architecture decisions and patterns                     | `fe-akriva`                | Code            |
| Prior plans and decisions                               | `fe-akriva`                | claude-mem      |
| GHG/emissions/sustainability scope                      | `ghg-domain`               | `fe-akriva`     |
| Emission factor databases / versioning                  | `ghg-domain`               | Web Search      |
| GHG Protocol / ISO 14064 / CSRD / SEC rules             | `ghg-domain`               | Web Search      |
| Audit/verification standards for GHG                    | `ghg-domain`               | Web Search      |
| Scope 1/2/3 calculation methodologies                   | `ghg-domain`               | Web Search      |
| Consolidation approaches (operational/financial/equity) | `ghg-domain`               | `fe-akriva`     |
| Library/framework API usage (SvelteKit, Zod, etc.)      | `techdocs`                 | Context7        |
| Web Awesome component usage                             | `techdocs`                 | Context7        |
| Full codebase context / cross-domain search             | `akriva-repomix`           | Code            |
| Specific implementation details                         | Code                       | `fe-akriva`     |
| Runtime debugging                                       | Code                       | `fe-akriva`     |
| Cross-session work history                              | claude-mem                 | `fe-akriva`     |

### Planning Rules (STRICT)

These rules are **mandatory** for every planning session. No exceptions.

#### Before Planning: Search First

Before creating ANY implementation plan, you MUST query NotebookLM to gather context:

1. **Query `fe-akriva`** for architecture decisions, domain patterns, existing conventions, and related prior plans
2. **Query `techdocs`** if the plan involves library/framework usage (SvelteKit, Superforms, Zod, Web Awesome, etc.)
3. **Query `ghg-domain`** if the plan involves emissions, GHG calculations, compliance frameworks, emission factors, audit/verification, or any sustainability business logic
4. **Query `akriva-repomix`** if you need to understand full codebase context or cross-file interactions

```bash
# Example: before planning a new "emissions" feature
nlm notebook query fe-akriva "emissions module architecture plans existing decisions"
nlm notebook query fe-akriva "what patterns are used for new page creation"
nlm notebook query ghg-domain "scope 1 emission calculation methodology data requirements"
nlm notebook query techdocs "superforms zod validation patterns"
```

Do NOT skip this step. Do NOT rely solely on codebase search or your own knowledge. The notebooks contain decisions and context that may not be visible in the code.

#### After Plan Approval: Save to Second Brain

When the user **accepts** an implementation plan, you MUST save it to the Second Brain notebook (`fe-akriva`) as a source:

```bash
nlm source add fe-akriva --text "PLAN CONTENT HERE" --title "Plan: [Feature/Task Name] - [Date]"
```

The saved plan must include:

- **Goal**: What the plan aims to achieve
- **Key decisions**: Architecture choices and trade-offs made
- **Files to create/modify**: Full list of affected files
- **Implementation steps**: The ordered steps from the plan
- **Dependencies**: Any blockers or prerequisites

This ensures all accepted plans are searchable for future planning sessions, preventing contradictory decisions and enabling plan continuity across sessions.

### Updating the Notebooks

When significant changes are made to the codebase (new domains, API changes, architectural decisions), update the notebook sources:

```bash
# List current sources
nlm source list fe-akriva
nlm source list techdocs
nlm source list akriva-repomix

# Add a new source to Second Brain
nlm source add fe-akriva --text "content" --title "Title"

# Add a new tech doc URL
nlm source add techdocs --url "https://docs.example.com/guide" --title "Library - Guide"

# Regenerate repomix codebase snapshot (run from project root)
repomix --style xml --output repomix-output.xml
# Then upsert via Python to bypass ARG_MAX (file > 1MB)

# Query to verify
nlm notebook query fe-akriva "question about the change"
nlm notebook query techdocs "how to use X in library Y"
nlm notebook query akriva-repomix "cross-file question about codebase"
```

Reference documents are stored in `.claude/docs/ai/` for regeneration if needed.

## Figma MCP Integration Rules

These rules define how to translate Figma designs into code for this project. Follow them for every Figma-driven change.

### Required Flow (do not skip)

1. Run `get_design_context` first to fetch the structured representation for the exact node(s) — pass `fileKey` and `nodeId` extracted from the Figma URL
2. If the response is too large or truncated, run `get_metadata` for the high-level node map, then re-fetch only the required node(s)
3. Run `get_screenshot` for a visual reference of the node being implemented
4. Only after you have both `get_design_context` and `get_screenshot`, download any assets and start implementation
5. Translate the Figma MCP output (React + Tailwind) into this project's Svelte 5 + shadcn-svelte + Tailwind conventions
6. Validate against the Figma screenshot for 1:1 visual parity before marking complete

### Framework Translation Rules

IMPORTANT: Figma MCP returns React + Tailwind code. Always translate to:

- **React JSX** → **Svelte 5** `.svelte` files with runes (`$props`, `$state`, `$derived`)
- **React components** → shadcn-svelte equivalents from `$lib/components/ui/`
- **React hooks** → Svelte runes or SvelteKit load functions
- **className** → `class` attribute
- **onClick** → `onclick`
- **onChange** → `onchange` or component-specific callbacks (`onValueChange` for Select)

### Component Mapping

IMPORTANT: Always use existing components instead of creating new ones. Map Figma elements to these:

| Figma Element | Use This Component | Import |
|---|---|---|
| Button | `Button` | `$lib/components/ui/button/index.js` |
| Text input | `Input` | `$lib/components/ui/input/index.js` |
| Textarea | `Textarea` | `$lib/components/ui/textarea/index.js` |
| Label | `Label` | `$lib/components/ui/label/index.js` |
| Card / Panel | `* as Card` (namespace) | `$lib/components/ui/card/index.js` |
| Dropdown / Select | `* as Select` (namespace) | `$lib/components/ui/select/index.js` |
| Checkbox | `Checkbox` | `$lib/components/ui/checkbox/index.js` |
| Radio buttons | `* as RadioGroup` (namespace) | `$lib/components/ui/radio-group/index.js` |
| Toggle / Switch | `Switch` | `$lib/components/ui/switch/index.js` |
| Badge / Tag | `Badge` | `$lib/components/ui/badge/index.js` |
| Alert / Banner | `Alert`, `AlertDescription` | `$lib/components/ui/alert/index.js` |
| Dialog / Modal | `* as Dialog` (namespace) | `$lib/components/ui/dialog/index.js` |
| Dropdown menu | `* as DropdownMenu` (namespace) | `$lib/components/ui/dropdown-menu/index.js` |
| Tooltip | `* as Tooltip` (namespace) | `$lib/components/ui/tooltip/index.js` |
| Popover | `* as Popover` (namespace) | `$lib/components/ui/popover/index.js` |
| Breadcrumb | `* as Breadcrumb` (namespace) | `$lib/components/ui/breadcrumb/index.js` |
| Separator / Divider | `Separator` | `$lib/components/ui/separator/index.js` |
| Skeleton loader | `Skeleton` | `$lib/components/ui/skeleton/index.js` |
| Progress bar | `Progress` | `$lib/components/ui/progress/index.js` |
| Avatar | `* as Avatar` (namespace) | `$lib/components/ui/avatar/index.js` |
| Sidebar | `* as Sidebar` (namespace) | `$lib/components/ui/sidebar/index.js` |
| Country picker | `CountrySelect` | `$components/CountrySelect.svelte` |
| Date picker | `DatePicker` | `$components/DatePicker.svelte` |
| Month picker | `MonthSelect` | `$components/MonthSelect.svelte` |
| Sector picker | `SectorSelect` | `$components/SectorSelect.svelte` |
| Sub-sector picker | `SubSectorSelect` | `$components/SubSectorSelect.svelte` |
| "OR" divider | `TextDivider` | `$components/TextDivider.svelte` |
| Copy button | `CopyButton` | `$components/CopyButton.svelte` |
| Logo | `AkrivaLogo` | `$components/AkrivaLogo.svelte` |

### Import Conventions

```svelte
<!-- Compound components: namespace import -->
<script>
import * as Card from "$lib/components/ui/card/index.js";
import * as Form from "$lib/components/ui/form/index.js";
import * as Select from "$lib/components/ui/select/index.js";
</script>
<Card.Root><Card.Header><Card.Title>...</Card.Title></Card.Header></Card.Root>

<!-- Single components: named import -->
<script>
import { Button } from "$lib/components/ui/button/index.js";
import { Input } from "$lib/components/ui/input/index.js";
</script>

<!-- Icons: individual Lucide imports (tree-shakeable) -->
<script>
import Settings from "@lucide/svelte/icons/settings";
import Eye from "@lucide/svelte/icons/eye";
</script>
<Settings class="size-4" />

<!-- Utility -->
<script>
import { cn } from "$lib/utils.js";
</script>
```

### Design Token Rules

IMPORTANT: Never hardcode colors, fonts, shadows, or radii. Always use the Akriva design tokens defined in `src/styles/app.css`.

**Colors** — Use Tailwind utilities mapped to CSS variables:
- Surfaces: `bg-background`, `bg-card`, `bg-popover`, `bg-sidebar`
- Text: `text-foreground`, `text-muted-foreground`, `text-card-foreground`
- Brand: `bg-primary`, `text-primary`, `text-primary-foreground`
- Danger: `bg-destructive`, `text-destructive`
- Borders: `border-border`, `border-input`
- Focus: `ring-ring`
- Charts: `bg-chart-1` through `bg-chart-5`

**Typography** — Font family: `font-sans` (Inter). Hierarchy:
- Page title: `text-2xl font-semibold`
- Section heading: `text-xl font-semibold`
- Card title: `text-lg font-semibold`
- Body: `text-base` or `text-sm`
- Helper/meta: `text-xs text-muted-foreground`

**Icons** — Lucide from `@lucide/svelte/icons/{name}`. Sizes: `size-4` (default), `size-3.5` (small), `size-6` (section headers).

**Shadows** — `shadow-2xs` through `shadow-2xl` (custom scale in app.css).

**Radius** — Base `--radius: 0.125rem`. Cards use `rounded-xl` explicitly.

**Spacing** — Standard Tailwind 4px scale (`--spacing: 0.25rem`).

### Layout Patterns

```
flex flex-col gap-5           — vertical stack (forms, card content)
flex items-center gap-2       — horizontal row (labels, badges)
grid grid-cols-2 gap-4        — two-column form layout
grid grid-cols-3 gap-4        — three-column form layout
```

### Form Implementation Pattern

IMPORTANT: Forms use Superforms + formsnap. Always pass the full `superForm` return object to `Form.Field`, never the destructured `form` store.

```svelte
<script>
const superform = superForm(data.form, { validators: zod4Client(schema) });
const { form, errors, enhance, message, submitting } = superform;
</script>

<form method="POST" use:enhance>
  <Form.Field form={superform} name="email">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Email</Form.Label>
        <Input {...props} bind:value={$form.email} />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>
</form>
```

Form sections use `Field.*` components for grouping:
```svelte
<Field.Group>
  <Field.Set>
    <Field.Legend>Section Name</Field.Legend>
    <Field.Description>Helper text</Field.Description>
    <Field.Group>
      <div class="grid grid-cols-2 gap-4">
        <!-- Form.Field components here -->
      </div>
    </Field.Group>
  </Field.Set>
  <Field.Separator />
</Field.Group>
```

### Asset Handling

- IMPORTANT: If the Figma MCP server returns a localhost source for an image or SVG, use that source directly
- IMPORTANT: DO NOT import new icon packages — use Lucide (`@lucide/svelte`) for all icons
- IMPORTANT: DO NOT create placeholders if a localhost source is provided
- Store downloaded image assets in `static/` directory
- SVG icons should use Lucide components, not raw SVGs

### Styling Rules

- Use Tailwind utility classes via `class` attribute, merged with `cn()` when conditional
- Use `cn()` from `$lib/utils.js` for conditional/dynamic classes
- Interactive states: `hover:text-foreground`, `hover:bg-accent`, `transition-colors`
- Focus rings: `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]`
- Error states: `aria-invalid:border-destructive aria-invalid:ring-destructive/20`
- For CSS custom property values outside Tailwind (SVG fills, third-party libs): use `var(--primary)`, `var(--foreground)`, etc.

### File Placement

- New UI primitives → `src/lib/components/ui/{name}/`
- New reusable app components → `src/components/`
- New pages → `src/routes/(app)/{route}/+page.svelte` + `+page.server.ts`
- New auth pages → `src/routes/(auth)/{route}/+page.svelte`
- Zod schemas → `src/lib/schemas/`
- API types → `src/lib/api/types.ts`
- Global styles → `src/styles/app.css`
