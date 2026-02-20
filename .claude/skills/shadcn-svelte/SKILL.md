---
name: shadcn-svelte
description: >
  shadcn-svelte component library reference and implementation guide for the Akriva frontend.
  Use this skill whenever building UI components, pages, forms, dialogs, tables, or any visual
  interface in the Akriva app. Also use it when the user mentions shadcn, component library,
  UI components, form fields, dialogs, modals, cards, buttons, selects, or asks how to build
  any UI element. Even if the user just says "add a button" or "create a form" — this skill
  has the exact API, imports, and project-specific patterns needed. Use it proactively whenever
  generating Svelte component code that might use shadcn-svelte primitives.
---

# shadcn-svelte for Akriva

This skill provides component APIs, import conventions, and implementation patterns for
shadcn-svelte in the Akriva frontend project. The project uses Svelte 5 with runes,
Tailwind CSS 4, and bits-ui primitives underneath shadcn-svelte.

## When to Read Reference Files

This SKILL.md contains the most common components and patterns inline. For less common
components or when you need the full prop table, read the reference files:

- **`references/components-core.md`** — Full API for the 30 most-used components (Button, Input, Select, Card, Dialog, Form, Table, etc.) with all props, sub-components, and examples
- **`references/components-extended.md`** — Extended components (Accordion, Calendar, Carousel, Chart, Command, Data Table, Drawer, etc.) plus core docs (theming, CLI, Tailwind v4)

For live documentation beyond what's bundled, use Context7 MCP to fetch from shadcn-svelte.com.

---

## Import Conventions

The project uses two import patterns depending on component complexity:

### Namespace imports (compound components with sub-parts)

```svelte
<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import * as Sheet from "$lib/components/ui/sheet/index.js";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
</script>
```

### Named imports (single components)

```svelte
<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import { Progress } from "$lib/components/ui/progress/index.js";
  import { Alert, AlertDescription } from "$lib/components/ui/alert/index.js";
</script>
```

### Icons — Lucide individual imports (tree-shakeable)

```svelte
<script lang="ts">
  import Settings from "@lucide/svelte/icons/settings";
  import Eye from "@lucide/svelte/icons/eye";
  import Trash from "@lucide/svelte/icons/trash-2";
  import Plus from "@lucide/svelte/icons/plus";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
</script>
<Settings class="size-4" />
```

### Utility

```svelte
<script lang="ts">
  import { cn } from "$lib/utils.js";
</script>
```

---

## Installed Components

These components are already installed in the project (at `src/lib/components/ui/`):

alert, alert-dialog, avatar, badge, breadcrumb, button, card, checkbox, collapsible,
data-table, dialog, dropdown-menu, field, form, input, label, popover, progress,
radio-group, range-calendar, select, separator, sheet, sidebar, skeleton, sonner,
switch, table, tabs, textarea, tooltip

To add a new component:
```bash
npx shadcn-svelte@latest add [component-name]
```

---

## Quick Component Reference

### Button

```svelte
<Button>Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
<Button variant="outline" size="sm"><Settings class="size-4" /> Settings</Button>
<Button variant="outline" size="icon" aria-label="Settings"><Settings class="size-4" /></Button>
<Button disabled={$submitting}>{$submitting ? "Saving..." : "Save"}</Button>
```

Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
Sizes: `default`, `sm`, `lg`, `icon`, `icon-sm`, `icon-lg`

### Input

```svelte
<Input placeholder="Email" bind:value={$form.email} />
<Input type="password" bind:value={$form.password} />
<!-- Nullable field pattern -->
<Input
  value={$form.city ?? ""}
  oninput={(e: Event) => {
    const val = (e.target as HTMLInputElement).value;
    $form.city = val || null;
  }}
/>
```

### Select

```svelte
<Select.Root
  type="single"
  value={$form.country ? { value: $form.country, label: $form.country } : undefined}
  onValueChange={(v) => { $form.country = v ?? ""; }}
>
  <Select.Trigger class="w-full">
    <Select.Value placeholder="Select country" />
  </Select.Trigger>
  <Select.Content>
    <Select.Item value="US" label="United States" />
    <Select.Item value="UK" label="United Kingdom" />
  </Select.Content>
</Select.Root>
```

### Card

```svelte
<Card.Root>
  <Card.Header>
    <Card.Title><h2 class="text-lg font-semibold">Title</h2></Card.Title>
    <Card.Description>Optional description</Card.Description>
  </Card.Header>
  <Card.Content>
    <!-- content here -->
  </Card.Content>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card.Root>
```

### Dialog

```svelte
<Dialog.Root bind:open={dialogOpen}>
  <Dialog.Trigger asChild let:builder>
    <Button builders={[builder]}>Open Dialog</Button>
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Dialog Title</Dialog.Title>
      <Dialog.Description>Dialog description text.</Dialog.Description>
    </Dialog.Header>
    <!-- body content -->
    <Dialog.Footer>
      <Button variant="outline" onclick={() => dialogOpen = false}>Cancel</Button>
      <Button>Confirm</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
```

### Table

```svelte
<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head>Name</Table.Head>
      <Table.Head>Status</Table.Head>
      <Table.Head class="text-end">Amount</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each items as item (item.id)}
      <Table.Row>
        <Table.Cell class="font-medium">{item.name}</Table.Cell>
        <Table.Cell>{item.status}</Table.Cell>
        <Table.Cell class="text-end">{item.amount}</Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
```

### Tabs

```svelte
<Tabs.Root value="tab1">
  <Tabs.List>
    <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab1">Content 1</Tabs.Content>
  <Tabs.Content value="tab2">Content 2</Tabs.Content>
</Tabs.Root>
```

### Dropdown Menu

```svelte
<DropdownMenu.Root>
  <DropdownMenu.Trigger asChild let:builder>
    <Button variant="ghost" size="icon" builders={[builder]}>
      <MoreHorizontal class="size-4" />
    </Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.Item>Edit</DropdownMenu.Item>
    <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item variant="destructive">Delete</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
```

### Alert

```svelte
<Alert variant="destructive" class="mt-4">
  <AlertDescription>
    <strong>Error:</strong> Something went wrong.
  </AlertDescription>
</Alert>
```

Variants: `default`, `destructive`

### Badge

```svelte
<Badge>Active</Badge>
<Badge variant="secondary">Pending</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Draft</Badge>
```

### Tooltip

```svelte
<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>Hover me</Tooltip.Trigger>
    <Tooltip.Content><p>Tooltip text</p></Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
```

### Sheet (Side Panel)

```svelte
<Sheet.Root>
  <Sheet.Trigger>Open</Sheet.Trigger>
  <Sheet.Content side="right">
    <Sheet.Header>
      <Sheet.Title>Panel Title</Sheet.Title>
      <Sheet.Description>Description text.</Sheet.Description>
    </Sheet.Header>
    <!-- body -->
    <Sheet.Footer>
      <Button>Save</Button>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>
```

Side options: `top`, `bottom`, `left`, `right` (default: `right`)

### Checkbox

```svelte
<Checkbox bind:checked={$form.agreeTerms} />
```

### Switch

```svelte
<Switch bind:checked={$form.notifications} />
```

### Radio Group

```svelte
<RadioGroup.Root bind:value={$form.plan}>
  <div class="flex items-center space-x-2">
    <RadioGroup.Item value="free" id="free" />
    <Label for="free">Free</Label>
  </div>
  <div class="flex items-center space-x-2">
    <RadioGroup.Item value="pro" id="pro" />
    <Label for="pro">Pro</Label>
  </div>
</RadioGroup.Root>
```

### Skeleton

```svelte
<Skeleton class="h-4 w-[250px]" />
<Skeleton class="size-12 rounded-full" />
```

### Toast (Sonner)

```svelte
<script lang="ts">
  import { toast } from "svelte-sonner";
</script>

<!-- In handlers: -->
toast.success("Saved successfully");
toast.error("Something went wrong");
toast.info("FYI...");
```

Setup: `<Toaster />` in root layout.

---

## Form Implementation Pattern (Superforms + formsnap)

This is the critical pattern for building forms in the project. Getting it wrong causes
type errors that are hard to debug.

### Page Server (load + action)

```typescript
// +page.server.ts
import { superValidate, message } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { mySchema } from "$lib/schemas/my-schema";

export const load = async ({ locals }) => {
  const form = await superValidate(existingData, zod4(mySchema));
  return { form };
};

export const actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(request, zod4(mySchema));
    if (!form.valid) return message(form, "Please fix the errors.", { status: 400 });

    try {
      await apiCall(form.data);
      return message(form, "Saved successfully!");
    } catch (err) {
      return message(form, "Failed to save.", { status: 500 });
    }
  },
};
```

### Page Component

```svelte
<script lang="ts">
  import { superForm } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import { toast } from "svelte-sonner";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { mySchema } from "$lib/schemas/my-schema";

  let { data } = $props();

  const superform = superForm(data.form, {
    validators: zod4Client(mySchema),
    dataType: "json",
    resetForm: false,
    onUpdated({ form }) {
      if (form.message) {
        form.valid ? toast.success(form.message) : toast.error(form.message);
      }
    },
    onError({ result }) {
      const msg = typeof result.error === "string"
        ? result.error
        : "An unexpected error occurred. Please try again.";
      toast.error(msg);
    },
  });
  const { form, errors, allErrors, enhance, submitting } = superform;
</script>

<form method="POST" use:enhance>
  <Card.Root>
    <Card.Header>
      <Card.Title><h2 class="text-lg font-semibold">Form Title</h2></Card.Title>
    </Card.Header>
    <Card.Content>
      <Field.Group>
        <Field.Set>
          <Field.Legend>Section Name</Field.Legend>
          <Field.Description>Helper text for this section</Field.Description>
          <Field.Group>
            <div class="grid grid-cols-2 gap-4">
              <Form.Field form={superform} name="firstName">
                <Form.Control>
                  {#snippet children({ props })}
                    <Form.Label>First Name</Form.Label>
                    <Input {...props} bind:value={$form.firstName} />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>

              <Form.Field form={superform} name="email">
                <Form.Control>
                  {#snippet children({ props })}
                    <Form.Label>Email</Form.Label>
                    <Input {...props} type="email" bind:value={$form.email} />
                  {/snippet}
                </Form.Control>
                <Form.Description>We'll never share your email.</Form.Description>
                <Form.FieldErrors />
              </Form.Field>
            </div>
          </Field.Group>
        </Field.Set>
        <Field.Separator />
      </Field.Group>
    </Card.Content>
  </Card.Root>

  <div class="flex gap-3 justify-end py-4">
    <Button variant="outline" type="button" href="/cancel-path">Cancel</Button>
    <Form.Button disabled={$submitting}>
      {$submitting ? "Saving..." : "Save Changes"}
    </Form.Button>
  </div>
</form>
```

### Key Rules

1. **Store the full superForm return**: `const superform = superForm(data.form, { ... })`
2. **Pass `superform` (not `$form`) to Form.Field**: `<Form.Field form={superform} name="email">`
3. **Destructure stores separately**: `const { form, errors, enhance, submitting } = superform`
4. **Use `$form.field` with `$` prefix** to access/bind store values
5. **Form.Control uses snippet pattern**: `{#snippet children({ props })} ... {/snippet}`
6. **Spread props on the input**: `<Input {...props} bind:value={$form.email} />`
7. **Server uses `zod4`**, client uses `zod4Client` adapter

### Nullable Field Pattern

For optional fields that should be `null` when empty (not empty string):

```svelte
<Input
  value={$form.city ?? ""}
  oninput={(e: Event) => {
    const val = (e.target as HTMLInputElement).value;
    $form.city = val || null;
  }}
/>
```

### Select in Forms

```svelte
<Form.Field form={superform} name="country">
  <Form.Control>
    {#snippet children({ props })}
      <Form.Label>Country</Form.Label>
      <Select.Root
        type="single"
        value={$form.country ? { value: $form.country, label: $form.country } : undefined}
        onValueChange={(v) => { $form.country = v ?? ""; }}
      >
        <Select.Trigger {...props} class="w-full">
          <Select.Value placeholder="Select country" />
        </Select.Trigger>
        <Select.Content>
          {#each countries as country}
            <Select.Item value={country.code} label={country.name} />
          {/each}
        </Select.Content>
      </Select.Root>
    {/snippet}
  </Form.Control>
  <Form.FieldErrors />
</Form.Field>
```

### Form Section Component Pattern

When splitting forms into sections, pass both `superform` and `form`:

```svelte
<!-- Section component -->
<script lang="ts">
  import * as Form from "$lib/components/ui/form/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import type { Writable } from "svelte/store";
  import type { SuperForm } from "sveltekit-superforms";
  import type { mySchema } from "$lib/schemas/my-schema";
  import type { z } from "zod";

  type FormData = z.infer<typeof mySchema>;

  let {
    superform,
    form,
  }: {
    superform: SuperForm<FormData>;
    form: Writable<FormData>;
  } = $props();
</script>

<Field.Set>
  <Field.Legend>Section Title</Field.Legend>
  <Field.Group>
    <div class="grid grid-cols-2 gap-4">
      <Form.Field form={superform} name="fieldName">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Label</Form.Label>
            <Input {...props} bind:value={$form.fieldName} />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
    </div>
  </Field.Group>
</Field.Set>
```

---

## Design Token System

The project uses Akriva-specific design tokens defined in `src/styles/app.css`.
Never hardcode colors — always use token-based Tailwind utilities.

### Colors (Tailwind classes)

| Purpose | Background | Text |
|---------|-----------|------|
| Page surface | `bg-background` | `text-foreground` |
| Cards | `bg-card` | `text-card-foreground` |
| Popovers | `bg-popover` | `text-popover-foreground` |
| Primary actions | `bg-primary` | `text-primary-foreground` |
| Secondary | `bg-secondary` | `text-secondary-foreground` |
| Muted/disabled | `bg-muted` | `text-muted-foreground` |
| Destructive | `bg-destructive` | `text-destructive-foreground` |
| Borders | `border-border` | — |
| Input borders | `border-input` | — |
| Focus rings | `ring-ring` | — |
| Sidebar | `bg-sidebar` | `text-sidebar-foreground` |
| Charts | `bg-chart-1` to `bg-chart-5` | — |

### Typography

- Page title: `text-2xl font-semibold`
- Section heading: `text-xl font-semibold`
- Card title: `text-lg font-semibold`
- Body: `text-base` or `text-sm`
- Helper/meta: `text-xs text-muted-foreground`
- Font: `font-sans` (Inter)

### Icons — Lucide

```svelte
import Settings from "@lucide/svelte/icons/settings";
```
Sizes: `size-3.5` (small), `size-4` (default), `size-6` (section header)

### Layout Patterns

```
flex flex-col gap-5           — vertical stack (forms, card content)
flex items-center gap-2       — horizontal row (labels, badges)
grid grid-cols-2 gap-4        — two-column form layout
grid grid-cols-3 gap-4        — three-column form layout
```

### Interactive States

```
hover:text-foreground hover:bg-accent transition-colors
focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
aria-invalid:border-destructive aria-invalid:ring-destructive/20
```

---

## File Placement

| Type | Path |
|------|------|
| UI primitives | `src/lib/components/ui/{name}/` |
| Reusable app components | `src/components/` |
| App pages | `src/routes/(app)/{route}/+page.svelte` + `+page.server.ts` |
| Auth pages | `src/routes/(auth)/{route}/+page.svelte` |
| Zod schemas | `src/lib/schemas/` |
| API types | `src/lib/api/types.ts` |
| Global styles | `src/styles/app.css` |

---

## Custom App Components

These project-specific components wrap common patterns:

| Component | Import | Purpose |
|-----------|--------|---------|
| `CountrySelect` | `$components/CountrySelect.svelte` | Country picker with `$bindable()` value |
| `DatePicker` | `$components/DatePicker.svelte` | Date picker (Flatpickr-based) |
| `MonthSelect` | `$components/MonthSelect.svelte` | Month picker |
| `SectorSelect` | `$components/SectorSelect.svelte` | Industry sector picker |
| `SubSectorSelect` | `$components/SubSectorSelect.svelte` | Sub-sector (cascading from sector) |
| `TextDivider` | `$components/TextDivider.svelte` | "OR" divider |
| `CopyButton` | `$components/CopyButton.svelte` | Copy to clipboard button |
| `AkrivaLogo` | `$components/AkrivaLogo.svelte` | Brand logo |
