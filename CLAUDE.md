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
- **shadcn-svelte** — UI component library (bits-ui headless primitives, `$lib/components/ui/`)
- **Tailwind CSS 4** — utility-first CSS (`@tailwindcss/vite` plugin)
- **Lucide** — icon library (`@lucide/svelte`)
- **Zod 4** — schema validation for API response types
- **Superforms** — form handling with client-side Zod validation (`sveltekit-superforms`)
- **TypeScript strict** mode
- **Vite 7** — build tool
- npm package manager

## Knowledge Management

Project knowledge (architecture decisions, patterns, debugging insights) is stored in **Claude Code memory** (`~/.claude/` auto-memory). Use memory files and codebase search (Glob, Grep, Read) as primary sources. Use **Context7** MCP plugin for library/framework documentation lookup.

### Planning Rules

Before creating implementation plans:
1. Search the codebase for existing patterns and conventions
2. Check Claude Code memory for prior decisions
3. Use Context7 for library API reference when needed

After plan approval: save key decisions to Claude Code memory for future sessions.

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
