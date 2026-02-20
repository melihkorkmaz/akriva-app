# shadcn-svelte Component Reference

> Comprehensive API reference for all shadcn-svelte components used in the Akriva frontend.
> Source: https://shadcn-svelte.com/docs/components

---

## Table of Contents

### Core Form & Input
1. [Button](#1-button)
2. [Input](#2-input)
3. [Label](#3-label)
4. [Select](#4-select)
5. [Checkbox](#5-checkbox)
6. [Radio Group](#6-radio-group)
7. [Switch](#7-switch)
8. [Textarea](#8-textarea)
9. [Form (Formsnap)](#9-form-formsnap)
10. [Field](#10-field)
11. [Input Group](#11-input-group)
12. [Combobox](#12-combobox)
13. [Date Picker](#13-date-picker)

### Layout & Navigation
14. [Card](#14-card)
15. [Dialog](#15-dialog)
16. [Tabs](#16-tabs)
17. [Separator](#17-separator)
18. [Breadcrumb](#18-breadcrumb)
19. [Sidebar](#19-sidebar)
20. [Dropdown Menu](#20-dropdown-menu)

### Feedback
21. [Alert](#21-alert)
22. [Badge](#22-badge)
23. [Skeleton](#23-skeleton)
24. [Progress](#24-progress)
25. [Sonner (Toast)](#25-sonner-toast)

### Display
26. [Avatar](#26-avatar)
27. [Table](#27-table)
28. [Tooltip](#28-tooltip)
29. [Popover](#29-popover)
30. [Sheet](#30-sheet)

---

## Core Form & Input Components

---

### 1. Button

**Description:** A versatile button component that renders as `<button>` or `<a>`, supporting multiple variants and sizes with full accessibility.

**Import:**
```svelte
<script>
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
</script>
```

**Sub-components:** None (single component). Also exports `buttonVariants` utility function.

**Key Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "destructive" \| "outline" \| "secondary" \| "ghost" \| "link"` | `"default"` | Visual style |
| `size` | `"default" \| "sm" \| "lg" \| "icon" \| "icon-sm" \| "icon-lg"` | `"default"` | Button size |
| `href` | `string` | `undefined` | Converts to `<a>` when provided |
| `disabled` | `boolean` | `false` | Disables interaction |
| `type` | `string` | `"button"` | HTML button type |
| `ref` | `HTMLButtonElement \| HTMLAnchorElement` | `null` | Element reference (bindable) |
| `class` | `string` | `undefined` | Additional CSS classes |

**Usage:**
```svelte
<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import Settings from "@lucide/svelte/icons/settings";
</script>

<!-- Variants -->
<Button>Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

<!-- With icon -->
<Button variant="outline" size="sm">
  <Settings /> Settings
</Button>

<!-- Icon-only -->
<Button variant="outline" size="icon" aria-label="Settings">
  <Settings />
</Button>

<!-- As link -->
<Button href="/dashboard">Go to Dashboard</Button>

<!-- Disabled / loading -->
<Button disabled>
  <Spinner /> Submitting...
</Button>
```

---

### 2. Input

**Description:** A form input field component supporting multiple input types including file uploads.

**Import:**
```svelte
<script>
  import { Input } from "$lib/components/ui/input/index.js";
</script>
```

**Sub-components:** None.

**Key Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `ref` | `HTMLInputElement \| null` | `null` | Bindable element reference |
| `value` | `string` | `undefined` | Bindable input value |
| `type` | `InputType \| "file"` | `undefined` | HTML input type |
| `files` | `FileList \| undefined` | `undefined` | Bindable file list (file inputs) |
| `class` | `string` | `undefined` | Additional CSS classes |
| `disabled` | `boolean` | `false` | Disables the input |
| `placeholder` | `string` | `undefined` | Placeholder text |
| `...restProps` | `HTMLInputAttributes` | -- | All standard HTML input attributes |

**Usage:**
```svelte
<script lang="ts">
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
</script>

<!-- Basic -->
<Input type="email" placeholder="Email" class="max-w-xs" />

<!-- With label -->
<div class="flex w-full max-w-sm flex-col gap-1.5">
  <Label for="email">Email</Label>
  <Input type="email" id="email" placeholder="you@example.com" />
</div>

<!-- File input -->
<div class="grid w-full max-w-sm items-center gap-1.5">
  <Label for="picture">Picture</Label>
  <Input id="picture" type="file" />
</div>

<!-- Disabled -->
<Input disabled type="email" placeholder="Email" />

<!-- With button -->
<div class="flex w-full max-w-sm items-center gap-2">
  <Input type="email" placeholder="Email" />
  <Button type="submit" variant="outline">Subscribe</Button>
</div>
```

---

### 3. Label

**Description:** Renders an accessible label associated with form controls.

**Import:**
```svelte
<script>
  import { Label } from "$lib/components/ui/label/index.js";
</script>
```

**Sub-components:** None.

**Key Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `ref` | `HTMLLabelElement \| null` | `null` | Bindable element reference |
| `for` | `string` | `undefined` | Associates label with form control by ID |
| `class` | `string` | `undefined` | Additional CSS classes |

**Default styling:** `flex items-center gap-2 text-sm leading-none font-medium select-none`

**Usage:**
```svelte
<script lang="ts">
  import { Label } from "$lib/components/ui/label/index.js";
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
</script>

<Label for="email">Your email address</Label>

<!-- With checkbox -->
<div class="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label for="terms">Accept terms and conditions</Label>
</div>
```

---

### 4. Select

**Description:** A dropdown component displaying a list of options for selection, built on bits-ui Select primitive.

**Import:**
```svelte
<script>
  import * as Select from "$lib/components/ui/select/index.js";
</script>
```

**Sub-components:**

| Component | Purpose |
|-----------|---------|
| `Select.Root` | Main wrapper; manages state |
| `Select.Trigger` | Button that opens the dropdown |
| `Select.Content` | Container for dropdown items |
| `Select.Item` | Individual selectable option |
| `Select.Group` | Groups related items |
| `Select.GroupHeading` | Heading for grouped items |
| `Select.Label` | Label for item groups |
| `Select.Separator` | Visual divider between items |
| `Select.ScrollUpButton` | Scroll up control |
| `Select.ScrollDownButton` | Scroll down control |
| `Select.Portal` | Portal wrapper for dropdown content |

**Key Props:**

| Component | Prop | Type | Description |
|-----------|------|------|-------------|
| `Root` | `type` | `"single" \| "multiple"` | Selection mode |
| `Root` | `name` | `string` | Form field name |
| `Root` | `value` | `string \| string[]` | Selected value (bindable) |
| `Trigger` | `class` | `string` | Custom styling |
| `Content` | `sideOffset` | `number` | Offset from trigger (default: 4) |
| `Content` | `preventScroll` | `boolean` | Prevent scroll (default: true) |
| `Item` | `value` | `string` | Item value (required) |
| `Item` | `label` | `string` | Display text |
| `Item` | `disabled` | `boolean` | Disables item |

**Usage:**
```svelte
<script lang="ts">
  import * as Select from "$lib/components/ui/select/index.js";

  const fruits = [
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
    { value: "blueberry", label: "Blueberry" },
  ];

  let value = $state("");
  const triggerContent = $derived(
    fruits.find((f) => f.value === value)?.label ?? "Select a fruit"
  );
</script>

<Select.Root type="single" name="favoriteFruit" bind:value>
  <Select.Trigger class="w-[180px]">
    {triggerContent}
  </Select.Trigger>
  <Select.Content>
    <Select.Group>
      <Select.GroupHeading>Fruits</Select.GroupHeading>
      {#each fruits as fruit (fruit.value)}
        <Select.Item value={fruit.value} label={fruit.label}>
          {fruit.label}
        </Select.Item>
      {/each}
    </Select.Group>
  </Select.Content>
</Select.Root>
```

---

### 5. Checkbox

**Description:** A control that allows toggling between checked, unchecked, and indeterminate states.

**Import:**
```svelte
<script>
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
</script>
```

**Sub-components:** None.

**Key Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `ref` | `HTMLElement \| null` | `null` | Bindable element reference |
| `checked` | `boolean` | `false` | Checked state (bindable) |
| `indeterminate` | `boolean` | `false` | Indeterminate state (bindable) |
| `class` | `string` | `undefined` | Additional CSS classes |

**Usage:**
```svelte
<script lang="ts">
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
</script>

<!-- Basic -->
<div class="flex items-center gap-3">
  <Checkbox id="terms" />
  <Label for="terms">Accept terms and conditions</Label>
</div>

<!-- Pre-checked with description -->
<div class="flex items-start gap-3">
  <Checkbox id="terms-2" checked />
  <div class="grid gap-2">
    <Label for="terms-2">Accept terms and conditions</Label>
    <p class="text-muted-foreground text-sm">
      By clicking this checkbox, you agree to the terms and conditions.
    </p>
  </div>
</div>
```

---

### 6. Radio Group

**Description:** A set of checkable buttons where no more than one can be checked at a time.

**Import:**
```svelte
<script>
  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
</script>
```

**Sub-components:**

| Component | Purpose |
|-----------|---------|
| `RadioGroup.Root` | Container wrapping all radio options |
| `RadioGroup.Item` | Individual radio button |

**Key Props:**

| Component | Prop | Type | Description |
|-----------|------|------|-------------|
| `Root` | `value` | `string` | Currently selected value (bindable) |
| `Root` | `class` | `string` | Custom CSS classes |
| `Item` | `value` | `string` | Unique identifier for this option |
| `Item` | `id` | `string` | HTML id (links to Label) |
| `Item` | `disabled` | `boolean` | Disables the radio button |

**Usage:**
```svelte
<script lang="ts">
  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
</script>

<RadioGroup.Root value="comfortable">
  <div class="flex items-center space-x-2">
    <RadioGroup.Item value="default" id="r1" />
    <Label for="r1">Default</Label>
  </div>
  <div class="flex items-center space-x-2">
    <RadioGroup.Item value="comfortable" id="r2" />
    <Label for="r2">Comfortable</Label>
  </div>
  <div class="flex items-center space-x-2">
    <RadioGroup.Item value="compact" id="r3" />
    <Label for="r3">Compact</Label>
  </div>
</RadioGroup.Root>
```

---

### 7. Switch

**Description:** A toggle control that allows switching between checked and unchecked states.

**Import:**
```svelte
<script>
  import { Switch } from "$lib/components/ui/switch/index.js";
</script>
```

**Sub-components:** None (wraps `SwitchPrimitive.Root` + `SwitchPrimitive.Thumb` internally).

**Key Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `ref` | `HTMLElement \| null` | `null` | Bindable element reference |
| `checked` | `boolean` | `false` | Toggle state (bindable) |
| `class` | `string` | `undefined` | Additional CSS classes |

**Usage:**
```svelte
<script lang="ts">
  import { Label } from "$lib/components/ui/label/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
</script>

<div class="flex items-center space-x-2">
  <Switch id="airplane-mode" />
  <Label for="airplane-mode">Airplane Mode</Label>
</div>
```

---

### 8. Textarea

**Description:** A form textarea component for multi-line text input.

**Import:**
```svelte
<script>
  import { Textarea } from "$lib/components/ui/textarea/index.js";
</script>
```

**Sub-components:** None.

**Key Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `ref` | `HTMLTextareaElement \| null` | `null` | Bindable element reference |
| `value` | `string` | `undefined` | Bindable textarea value |
| `class` | `string` | `undefined` | Additional CSS classes |
| `disabled` | `boolean` | `false` | Disables the textarea |
| `placeholder` | `string` | `undefined` | Placeholder text |
| `...restProps` | `HTMLTextareaAttributes` | -- | All native textarea attributes |

**Usage:**
```svelte
<script lang="ts">
  import { Label } from "$lib/components/ui/label/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
</script>

<!-- Basic -->
<Textarea placeholder="Type your message here." />

<!-- With label and description -->
<div class="grid w-full gap-1.5">
  <Label for="message">Your Message</Label>
  <Textarea placeholder="Type your message here." id="message" />
  <p class="text-muted-foreground text-sm">
    Your message will be copied to the support team.
  </p>
</div>

<!-- With button -->
<div class="grid w-full gap-2">
  <Textarea placeholder="Type your message here." />
  <Button>Send message</Button>
</div>
```

---

### 9. Form (Formsnap)

**Description:** Form building components combining Formsnap, Superforms, and Zod for type-safe, accessible forms with client and server-side validation.

**Import:**
```svelte
<script>
  import * as Form from "$lib/components/ui/form/index.js";
  import { superForm } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";
</script>
```

**Sub-components:**

| Component | Purpose |
|-----------|---------|
| `Form.Field` | Scopes form state for individual fields |
| `Form.Control` | Wraps input controls with accessibility attributes |
| `Form.Label` | Associates labels with inputs (auto `for`) |
| `Form.Description` | Displays field helper text |
| `Form.FieldErrors` | Renders validation error messages |
| `Form.Button` | Styled submit button |
| `Form.Fieldset` | Groups related fields |

**Key Props:**

| Component | Prop | Type | Description |
|-----------|------|------|-------------|
| `Field` | `form` | `SuperForm` | The full superForm return object (NOT `$form`) |
| `Field` | `name` | `string` | Field name matching Zod schema key |
| `Control` | `children` | `Snippet<[{ props }]>` | Renders control with accessibility props |

**Usage:**
```svelte
<script lang="ts">
  import * as Form from "$lib/components/ui/form/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { superForm } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import { formSchema } from "./schema.js";

  let { data } = $props();

  const superform = superForm(data.form, {
    validators: zod4Client(formSchema),
  });
  const { form, errors, enhance, message, submitting } = superform;
</script>

<form method="POST" use:enhance>
  <Form.Field form={superform} name="username">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Username</Form.Label>
        <Input {...props} bind:value={$form.username} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your public display name.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field form={superform} name="email">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Email</Form.Label>
        <Input {...props} type="email" bind:value={$form.email} />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Button disabled={$submitting}>Submit</Form.Button>
</form>
```

**Critical note:** Always pass the full `superForm()` return object to `Form.Field form={superform}`, never the destructured `$form` store.

---

### 10. Field

**Description:** Combine labels, controls, and help text to compose accessible form fields and grouped inputs. A layout-oriented companion to Form (formsnap).

**Import:**
```svelte
<script>
  import * as Field from "$lib/components/ui/field/index.js";
</script>
```

**Sub-components:**

| Component | Purpose |
|-----------|---------|
| `Field.Field` | Core wrapper for individual form fields |
| `Field.Content` | Flex container grouping labels and descriptions |
| `Field.Group` | Container for related fields with semantic grouping |
| `Field.Set` | Wrapper with legend for field groups (`<fieldset>`) |
| `Field.Legend` | Semantic legend for field sets |
| `Field.Label` | Associated label for inputs |
| `Field.Description` | Helper text below controls |
| `Field.Error` | Validation error messages |
| `Field.Separator` | Visual divider between sections |
| `Field.Title` | Title within choice cards |

**Key Props:**

| Component | Prop | Type | Description |
|-----------|------|------|-------------|
| `Field` | `orientation` | `"vertical" \| "horizontal" \| "responsive"` | Layout direction |
| `Field` | `data-invalid` | `boolean` | Error state indicator |
| `Label` | `for` | `string` | Associated input ID |
| `Error` | `errors` | `Array<{ message?: string }>` | Error messages |

**Usage:**
```svelte
<script lang="ts">
  import * as Field from "$lib/components/ui/field/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
</script>

<!-- Basic input field -->
<Field.Set>
  <Field.Group>
    <Field.Field>
      <Field.Label for="username">Username</Field.Label>
      <Input id="username" type="text" placeholder="Max Leiter" />
      <Field.Description>Choose a unique username.</Field.Description>
    </Field.Field>
  </Field.Group>
</Field.Set>

<!-- With validation error -->
<Field.Field data-invalid>
  <Field.Label for="email">Email</Field.Label>
  <Input id="email" type="email" aria-invalid />
  <Field.Error>Enter a valid email address.</Field.Error>
</Field.Field>

<!-- Horizontal layout with switch -->
<Field.Field orientation="horizontal">
  <Field.Content>
    <Field.Label for="2fa">Multi-factor authentication</Field.Label>
    <Field.Description>Enable MFA for added security.</Field.Description>
  </Field.Content>
  <Switch id="2fa" />
</Field.Field>

<!-- Fieldset with legend -->
<Field.Set>
  <Field.Legend>Billing Address</Field.Legend>
  <Field.Description>Associated with your payment method</Field.Description>
  <Field.Group>
    <Field.Field>
      <Field.Label for="street">Street Address</Field.Label>
      <Input id="street" placeholder="123 Main St" />
    </Field.Field>
  </Field.Group>
</Field.Set>

<!-- Responsive layout -->
<Field.Field orientation="responsive">
  <Field.Content>
    <Field.Label for="name">Name</Field.Label>
    <Field.Description>Your full name</Field.Description>
  </Field.Content>
  <Input id="name" placeholder="Jane Doe" required />
</Field.Field>
```

---

### 11. Input Group

**Description:** Displays additional information or actions alongside input/textarea elements -- prefixes, suffixes, icons, and interactive controls.

**Import:**
```svelte
<script>
  import * as InputGroup from "$lib/components/ui/input-group/index.js";
</script>
```

**Sub-components:**

| Component | Purpose |
|-----------|---------|
| `InputGroup.Root` | Container wrapper |
| `InputGroup.Input` | Standard text input |
| `InputGroup.Textarea` | Multi-line text input |
| `InputGroup.Addon` | Container for supplementary elements |
| `InputGroup.Button` | Action button within the group |
| `InputGroup.Text` | Display text/label content |

**Key Props:**

| Component | Prop | Type | Default | Description |
|-----------|------|------|---------|-------------|
| `Input` | `value` | `string` | `undefined` | Bindable input value |
| `Textarea` | `value` | `string` | `undefined` | Bindable textarea value |
| `Addon` | `align` | `"inline-start" \| "inline-end" \| "block-start" \| "block-end"` | `"inline-start"` | Positioning |
| `Button` | `variant` | `string` | `"ghost"` | Button style variant |
| `Button` | `size` | `"xs" \| "sm" \| "icon-xs" \| "icon-sm"` | `"xs"` | Button size |

**Usage:**
```svelte
<script lang="ts">
  import * as InputGroup from "$lib/components/ui/input-group/index.js";
  import SearchIcon from "@lucide/svelte/icons/search";
</script>

<!-- Search input with icon -->
<InputGroup.Root>
  <InputGroup.Input placeholder="Search..." />
  <InputGroup.Addon>
    <SearchIcon />
  </InputGroup.Addon>
</InputGroup.Root>

<!-- Currency input with prefix/suffix -->
<InputGroup.Root>
  <InputGroup.Addon>
    <InputGroup.Text>$</InputGroup.Text>
  </InputGroup.Addon>
  <InputGroup.Input placeholder="0.00" />
  <InputGroup.Addon align="inline-end">
    <InputGroup.Text>USD</InputGroup.Text>
  </InputGroup.Addon>
</InputGroup.Root>

<!-- With copy button -->
<InputGroup.Root>
  <InputGroup.Input value="https://example.com" readonly />
  <InputGroup.Addon align="inline-end">
    <InputGroup.Button size="icon-xs" onclick={copyToClipboard}>
      <CopyIcon />
    </InputGroup.Button>
  </InputGroup.Addon>
</InputGroup.Root>
```

---

### 12. Combobox

**Description:** Autocomplete input and command palette with a filterable list of suggestions. A composed pattern using Popover + Command components.

**Import:**
```svelte
<script>
  import * as Command from "$lib/components/ui/command/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
</script>
```

**Sub-components (composed):**

| Component | Purpose |
|-----------|---------|
| `Popover.Root` | Container managing open/closed state |
| `Popover.Trigger` | Button triggering the dropdown |
| `Popover.Content` | Container for the searchable list |
| `Command.Root` | Search and filtering logic |
| `Command.Input` | Search text field |
| `Command.List` | Scrollable options container |
| `Command.Empty` | Fallback when no results match |
| `Command.Group` | Organized option grouping |
| `Command.Item` | Individual selectable option |

**Key Props:**

| Component | Prop | Type | Description |
|-----------|------|------|-------------|
| `Popover.Root` | `open` | `boolean` | Controls visibility (bindable) |
| `Command.Input` | `placeholder` | `string` | Search hint text |
| `Command.Item` | `value` | `string` | Unique identifier |
| `Command.Item` | `onSelect` | `() => void` | Callback on selection |

**Usage:**
```svelte
<script lang="ts">
  import { tick } from "svelte";
  import * as Command from "$lib/components/ui/command/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import CheckIcon from "@lucide/svelte/icons/check";
  import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
  import { cn } from "$lib/utils.js";

  const frameworks = [
    { value: "sveltekit", label: "SvelteKit" },
    { value: "next.js", label: "Next.js" },
    { value: "nuxt", label: "Nuxt" },
  ];

  let open = $state(false);
  let value = $state("");
  let triggerRef = $state<HTMLButtonElement>(null!);

  const selectedLabel = $derived(
    frameworks.find((f) => f.value === value)?.label ?? "Select framework..."
  );

  function closeAndFocusTrigger() {
    open = false;
    tick().then(() => triggerRef?.focus());
  }
</script>

<Popover.Root bind:open>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button
        bind:ref={triggerRef}
        {...props}
        variant="outline"
        role="combobox"
        aria-expanded={open}
        class="w-[200px] justify-between"
      >
        {selectedLabel}
        <ChevronsUpDownIcon class="ml-2 size-4 shrink-0 opacity-50" />
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="w-[200px] p-0">
    <Command.Root>
      <Command.Input placeholder="Search framework..." />
      <Command.List>
        <Command.Empty>No framework found.</Command.Empty>
        <Command.Group>
          {#each frameworks as fw}
            <Command.Item
              value={fw.value}
              onSelect={() => {
                value = fw.value;
                closeAndFocusTrigger();
              }}
            >
              <CheckIcon
                class={cn("mr-2 size-4", value !== fw.value && "text-transparent")}
              />
              {fw.label}
            </Command.Item>
          {/each}
        </Command.Group>
      </Command.List>
    </Command.Root>
  </Popover.Content>
</Popover.Root>
```

---

### 13. Date Picker

**Description:** A date picker component with range and presets. Composed from Popover + Calendar components.

**Import:**
```svelte
<script>
  import Calendar from "$lib/components/ui/calendar/calendar.svelte";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import CalendarIcon from "@lucide/svelte/icons/calendar";
</script>
```

**Sub-components (composed):**

| Component | Purpose |
|-----------|---------|
| `Popover.Root` | Container managing open/closed state |
| `Popover.Trigger` | Button triggering the calendar |
| `Popover.Content` | Container for the calendar |
| `Calendar` | Date selection interface |
| `RangeCalendar` | Range date selection interface |

**Key Props:**

| Component | Prop | Type | Description |
|-----------|------|------|-------------|
| `Calendar` | `type` | `"single" \| "multiple" \| "range"` | Selection mode |
| `Calendar` | `value` | `DateValue` | Selected date (bindable) |
| `Calendar` | `maxValue` | `CalendarDate` | Upper date limit |
| `Calendar` | `captionLayout` | `"dropdown" \| "label"` | Header display mode |
| `Calendar` | `initialFocus` | `boolean` | Auto-focus on open |
| `Calendar` | `onValueChange` | `() => void` | Callback on selection |

**Usage:**
```svelte
<script lang="ts">
  import Calendar from "$lib/components/ui/calendar/calendar.svelte";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import CalendarIcon from "@lucide/svelte/icons/calendar";
  import { today, getLocalTimeZone } from "@internationalized/date";
  import type { DateValue } from "@internationalized/date";
  import { cn } from "$lib/utils.js";

  let value = $state<DateValue | undefined>(undefined);

  const formatted = $derived(
    value
      ? new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(
          value.toDate(getLocalTimeZone())
        )
      : "Pick a date"
  );
</script>

<Popover.Root>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="outline"
        class={cn("w-[280px] justify-start text-left font-normal", !value && "text-muted-foreground")}
      >
        <CalendarIcon class="mr-2 size-4" />
        {formatted}
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="w-auto p-0">
    <Calendar
      type="single"
      bind:value
      maxValue={today(getLocalTimeZone())}
      initialFocus
    />
  </Popover.Content>
</Popover.Root>
```

---

## Layout & Navigation Components

---

### 14. Card

**Description:** A flexible container for organizing content into header, content, and footer sections.

**Import:**
```svelte
<script>
  import * as Card from "$lib/components/ui/card/index.js";
</script>
```

**Sub-components:**

| Component | Purpose |
|-----------|---------|
| `Card.Root` | Main card container |
| `Card.Header` | Top section for title and metadata |
| `Card.Title` | Heading text within header |
| `Card.Description` | Subtitle or descriptive text |
| `Card.Content` | Primary content area |
| `Card.Footer` | Bottom section for actions |
| `Card.Action` | Optional action element in header |

**Key Props (all components):**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `ref` | `HTMLDivElement \| null` | `null` | Bindable element reference |
| `class` | `string` | `undefined` | Additional CSS classes |

**Usage:**
```svelte
<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
</script>

<Card.Root class="w-full max-w-sm">
  <Card.Header>
    <Card.Title>Login to your account</Card.Title>
    <Card.Description>Enter your email below to login</Card.Description>
    <Card.Action>
      <Button variant="link">Sign Up</Button>
    </Card.Action>
  </Card.Header>
  <Card.Content>
    <div class="flex flex-col gap-6">
      <div class="grid gap-2">
        <Label for="email">Email</Label>
        <Input id="email" type="email" required />
      </div>
      <div class="grid gap-2">
        <Label for="password">Password</Label>
        <Input id="password" type="password" required />
      </div>
    </div>
  </Card.Content>
  <Card.Footer class="flex-col gap-2">
    <Button type="submit" class="w-full">Login</Button>
    <Button variant="outline" class="w-full">Login with Google</Button>
  </Card.Footer>
</Card.Root>
```

---

### 15. Dialog

**Description:** A modal window overlaid on the primary window, rendering content underneath inert. Built on bits-ui Dialog primitive.

**Import:**
```svelte
<script>
  import * as Dialog from "$lib/components/ui/dialog/index.js";
</script>
```

**Sub-components:**

| Component | Purpose |
|-----------|---------|
| `Dialog.Root` | Container managing open/closed state |
| `Dialog.Trigger` | Button that opens the dialog |
| `Dialog.Portal` | Renders content outside DOM hierarchy |
| `Dialog.Overlay` | Semi-transparent backdrop |
| `Dialog.Content` | Main dialog container with animations |
| `Dialog.Header` | Top section for title and description |
| `Dialog.Title` | Dialog heading |
| `Dialog.Description` | Supplementary text |
| `Dialog.Footer` | Bottom section for action buttons |
| `Dialog.Close` | Button that dismisses the dialog |

**Key Props:**

| Component | Prop | Type | Default | Description |
|-----------|------|------|---------|-------------|
| `Root` | `open` | `boolean` | `false` | Open state (bindable) |
| `Content` | `showCloseButton` | `boolean` | `true` | Toggle X button visibility |
| `Content` | `portalProps` | `object` | `undefined` | Portal configuration |
| `Content` | `class` | `string` | `undefined` | Custom CSS classes |

**Usage:**
```svelte
<script lang="ts">
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
</script>

<Dialog.Root>
  <Dialog.Trigger class={buttonVariants({ variant: "outline" })}>
    Edit Profile
  </Dialog.Trigger>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Edit profile</Dialog.Title>
      <Dialog.Description>
        Make changes to your profile here. Click save when done.
      </Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4">
      <div class="grid gap-3">
        <Label for="name">Name</Label>
        <Input id="name" value="Pedro Duarte" />
      </div>
      <div class="grid gap-3">
        <Label for="username">Username</Label>
        <Input id="username" value="@peduarte" />
      </div>
    </div>
    <Dialog.Footer>
      <Dialog.Close class={buttonVariants({ variant: "outline" })}>
        Cancel
      </Dialog.Close>
      <Button type="submit">Save changes</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
```

---

### 16. Tabs

**Description:** Layered sections of content displayed one at a time, controlled by tab triggers.

**Import:**
```svelte
<script>
  import * as Tabs from "$lib/components/ui/tabs/index.js";
</script>
```

**Sub-components:**

| Component | Purpose |
|-----------|---------|
| `Tabs.Root` | Container wrapping all tab elements |
| `Tabs.List` | Container for tab triggers |
| `Tabs.Trigger` | Interactive button to switch tabs |
| `Tabs.Content` | Panel content for the active tab |

**Key Props:**

| Component | Prop | Type | Description |
|-----------|------|------|-------------|
| `Root` | `value` | `string` | Active tab value (bindable) |
| `Root` | `class` | `string` | Custom CSS classes |
| `Trigger` | `value` | `string` | Identifier for this trigger |
| `Content` | `value` | `string` | Identifier matching trigger value |

**Usage:**
```svelte
<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
</script>

<Tabs.Root value="account" class="w-[400px]">
  <Tabs.List>
    <Tabs.Trigger value="account">Account</Tabs.Trigger>
    <Tabs.Trigger value="password">Password</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="account">
    <Card.Root>
      <Card.Header>
        <Card.Title>Account</Card.Title>
        <Card.Description>Make changes to your account here.</Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="grid gap-2">
          <Label for="name">Name</Label>
          <Input id="name" value="Pedro Duarte" />
        </div>
      </Card.Content>
      <Card.Footer>
        <Button>Save changes</Button>
      </Card.Footer>
    </Card.Root>
  </Tabs.Content>
  <Tabs.Content value="password">
    <Card.Root>
      <Card.Header>
        <Card.Title>Password</Card.Title>
        <Card.Description>Change your password here.</Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="grid gap-2">
          <Label for="current">Current password</Label>
          <Input id="current" type="password" />
        </div>
      </Card.Content>
      <Card.Footer>
        <Button>Save password</Button>
      </Card.Footer>
    </Card.Root>
  </Tabs.Content>
</Tabs.Root>
```

---

### 17. Separator

**Description:** Visually or semantically separates content. Supports horizontal and vertical orientations.

**Import:**
```svelte
<script>
  import { Separator } from "$lib/components/ui/separator/index.js";
</script>
```

**Sub-components:** None.

**Key Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `ref` | `HTMLElement \| null` | `null` | Bindable element reference |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Separator direction |
| `class` | `string` | `undefined` | Additional CSS classes |

**Usage:**
```svelte
<script lang="ts">
  import { Separator } from "$lib/components/ui/separator/index.js";
</script>

<!-- Horizontal -->
<Separator class="my-4" />

<!-- Vertical (in a flex row) -->
<div class="flex h-5 items-center space-x-4 text-sm">
  <div>Blog</div>
  <Separator orientation="vertical" />
  <div>Docs</div>
  <Separator orientation="vertical" />
  <div>Source</div>
</div>
```

---

### 18. Breadcrumb

**Description:** Displays the path to the current resource using a hierarchy of links.

**Import:**
```svelte
<script>
  import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
</script>
```

**Sub-components:**

| Component | Purpose |
|-----------|---------|
| `Breadcrumb.Root` | Main navigation wrapper (`<nav>`) |
| `Breadcrumb.List` | Container for items (`<ol>`) |
| `Breadcrumb.Item` | Individual breadcrumb entry (`<li>`) |
| `Breadcrumb.Link` | Navigational link (`<a>`) |
| `Breadcrumb.Page` | Current page indicator (`<span>`) |
| `Breadcrumb.Separator` | Visual divider between items |
| `Breadcrumb.Ellipsis` | Collapsed state indicator |

**Key Props:**

| Component | Prop | Type | Description |
|-----------|------|------|-------------|
| `Link` | `href` | `string` | Navigation URL |
| `Link` | `child` | `Snippet` | Optional snippet for custom rendering |
| `Page` | -- | -- | Implicitly sets `aria-current="page"` |
| `Separator` | `children` | `Snippet` | Custom separator (default: chevron icon) |

**Usage:**
```svelte
<script lang="ts">
  import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
</script>

<Breadcrumb.Root>
  <Breadcrumb.List>
    <Breadcrumb.Item>
      <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
    </Breadcrumb.Item>
    <Breadcrumb.Separator />
    <Breadcrumb.Item>
      <Breadcrumb.Link href="/components">Components</Breadcrumb.Link>
    </Breadcrumb.Item>
    <Breadcrumb.Separator />
    <Breadcrumb.Item>
      <Breadcrumb.Page>Breadcrumb</Breadcrumb.Page>
    </Breadcrumb.Item>
  </Breadcrumb.List>
</Breadcrumb.Root>
```

---

### 19. Sidebar

**Description:** A composable, themeable sidebar component with collapsible states, icon modes, and multiple layout variants.

**Import:**
```svelte
<script>
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { useSidebar } from "$lib/components/ui/sidebar/index.js";
</script>
```

**Sub-components:**

| Component | Purpose |
|-----------|---------|
| `Sidebar.Provider` | Wraps app; manages sidebar context/state |
| `Sidebar.Root` | Main sidebar container |
| `Sidebar.Header` | Sticky header section |
| `Sidebar.Footer` | Sticky footer section |
| `Sidebar.Content` | Scrollable content area |
| `Sidebar.Group` | Organizational sections |
| `Sidebar.GroupLabel` | Label for group sections |
| `Sidebar.GroupContent` | Content wrapper for groups |
| `Sidebar.GroupAction` | Action button for groups |
| `Sidebar.Menu` | Menu list container |
| `Sidebar.MenuItem` | Individual menu item |
| `Sidebar.MenuButton` | Clickable menu button |
| `Sidebar.MenuAction` | Independent action within menu item |
| `Sidebar.MenuSub` | Submenu container |
| `Sidebar.MenuSubItem` | Submenu item |
| `Sidebar.MenuSubButton` | Submenu button |
| `Sidebar.MenuBadge` | Badge display for menu items |
| `Sidebar.MenuSkeleton` | Loading skeleton for menu items |
| `Sidebar.Trigger` | Toggle button for sidebar |
| `Sidebar.Separator` | Divider element |
| `Sidebar.Rail` | Toggle rail component |
| `Sidebar.Inset` | Content wrapper for inset variant |

**Key Props:**

| Component | Prop | Type | Default | Description |
|-----------|------|------|---------|-------------|
| `Provider` | `open` | `boolean` | -- | Open state (bindable) |
| `Provider` | `onOpenChange` | `(open: boolean) => void` | -- | Change callback |
| `Root` | `side` | `"left" \| "right"` | `"left"` | Sidebar position |
| `Root` | `variant` | `"sidebar" \| "floating" \| "inset"` | `"sidebar"` | Layout style |
| `Root` | `collapsible` | `"offcanvas" \| "icon" \| "none"` | `"offcanvas"` | Collapse behavior |
| `MenuButton` | `isActive` | `boolean` | `false` | Active state indicator |

**Hook: `useSidebar()`**
```typescript
sidebar.state          // "expanded" | "collapsed"
sidebar.open           // boolean
sidebar.setOpen()      // (open: boolean) => void
sidebar.openMobile     // boolean
sidebar.setOpenMobile()// (open: boolean) => void
sidebar.isMobile       // boolean
sidebar.toggle()       // () => void
```

**Usage:**
```svelte
<!-- Layout wrapper (+layout.svelte) -->
<script lang="ts">
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import AppSidebar from "$lib/components/app-sidebar.svelte";
  let { children } = $props();
</script>

<Sidebar.Provider>
  <AppSidebar />
  <main>
    <Sidebar.Trigger />
    {@render children?.()}
  </main>
</Sidebar.Provider>

<!-- Sidebar component (app-sidebar.svelte) -->
<script lang="ts">
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import HouseIcon from "@lucide/svelte/icons/house";
  import SettingsIcon from "@lucide/svelte/icons/settings";

  const items = [
    { title: "Home", url: "/", icon: HouseIcon },
    { title: "Settings", url: "/settings", icon: SettingsIcon },
  ];
</script>

<Sidebar.Root>
  <Sidebar.Header />
  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.GroupLabel>Application</Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {#each items as item}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton>
                {#snippet child({ props })}
                  <a href={item.url} {...props}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          {/each}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  </Sidebar.Content>
  <Sidebar.Footer />
</Sidebar.Root>
```

**Constants (`sidebar/constants.ts`):**
```typescript
SIDEBAR_COOKIE_NAME = "sidebar:state"
SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7  // 7 days
SIDEBAR_WIDTH = "16rem"
SIDEBAR_WIDTH_MOBILE = "18rem"
SIDEBAR_WIDTH_ICON = "3rem"
SIDEBAR_KEYBOARD_SHORTCUT = "b"
```

---

### 20. Dropdown Menu

**Description:** Displays a menu of actions or functions triggered by a button. Built on bits-ui primitives.

**Import:**
```svelte
<script>
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
</script>
```

**Sub-components:**

| Component | Purpose |
|-----------|---------|
| `DropdownMenu.Root` | Container wrapping the entire dropdown |
| `DropdownMenu.Trigger` | Button that opens the dropdown |
| `DropdownMenu.Content` | Container for menu items |
| `DropdownMenu.Item` | Individual menu option |
| `DropdownMenu.Label` | Section label/heading |
| `DropdownMenu.Separator` | Visual divider |
| `DropdownMenu.Group` | Grouped collection of items |
| `DropdownMenu.GroupHeading` | Heading for item groups |
| `DropdownMenu.CheckboxItem` | Selectable checkbox item |
| `DropdownMenu.CheckboxGroup` | Container for checkbox items |
| `DropdownMenu.RadioItem` | Radio button option |
| `DropdownMenu.RadioGroup` | Container for radio items |
| `DropdownMenu.Sub` | Nested submenu container |
| `DropdownMenu.SubTrigger` | Button opening submenu |
| `DropdownMenu.SubContent` | Submenu content area |
| `DropdownMenu.Shortcut` | Keyboard shortcut display |
| `DropdownMenu.Portal` | Portal for content rendering |

**Key Props:**

| Component | Prop | Type | Default | Description |
|-----------|------|------|---------|-------------|
| `Content` | `align` | `"start" \| "end" \| "center"` | -- | Positioning |
| `Content` | `sideOffset` | `number` | `4` | Spacing from trigger |
| `Item` | `inset` | `boolean` | `false` | Indentation |
| `Item` | `variant` | `"default" \| "destructive"` | `"default"` | Style |
| `Item` | `disabled` | `boolean` | `false` | Disables item |
| `CheckboxItem` | `checked` | `boolean` | -- | Checked state (bindable) |
| `RadioGroup` | `value` | `string` | -- | Selected value (bindable) |

**Usage:**
```svelte
<script lang="ts">
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { Button } from "$lib/components/ui/button/index.js";

  let showStatusBar = $state(true);
  let position = $state("bottom");
</script>

<!-- Basic menu -->
<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="outline">Open</Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content class="w-56" align="start">
    <DropdownMenu.Label>My Account</DropdownMenu.Label>
    <DropdownMenu.Separator />
    <DropdownMenu.Group>
      <DropdownMenu.Item>
        Profile
        <DropdownMenu.Shortcut>Shift+Cmd+P</DropdownMenu.Shortcut>
      </DropdownMenu.Item>
      <DropdownMenu.Item>Settings</DropdownMenu.Item>
    </DropdownMenu.Group>
    <DropdownMenu.Separator />
    <DropdownMenu.Item variant="destructive">Log out</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>

<!-- With checkbox items -->
<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props}>Options</Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content class="w-56">
    <DropdownMenu.CheckboxItem bind:checked={showStatusBar}>
      Status Bar
    </DropdownMenu.CheckboxItem>
  </DropdownMenu.Content>
</DropdownMenu.Root>

<!-- With radio group -->
<DropdownMenu.RadioGroup bind:value={position}>
  <DropdownMenu.RadioItem value="top">Top</DropdownMenu.RadioItem>
  <DropdownMenu.RadioItem value="bottom">Bottom</DropdownMenu.RadioItem>
</DropdownMenu.RadioGroup>
```

---

## Feedback Components

---

### 21. Alert

**Description:** Displays a callout for user attention with support for icons, titles, and descriptions.

**Import:**
```svelte
<script>
  import * as Alert from "$lib/components/ui/alert/index.js";
</script>
```

**Sub-components:**

| Component | Purpose |
|-----------|---------|
| `Alert.Root` | Main container wrapper |
| `Alert.Title` | Title/heading element |
| `Alert.Description` | Description/content area |

**Key Props:**

| Component | Prop | Type | Default | Description |
|-----------|------|------|---------|-------------|
| `Root` | `variant` | `"default" \| "destructive"` | `"default"` | Alert style |
| `Root` | `class` | `string` | `undefined` | Additional CSS classes |
| `Root` | `ref` | `HTMLDivElement \| null` | `null` | Bindable reference |

**Usage:**
```svelte
<script lang="ts">
  import * as Alert from "$lib/components/ui/alert/index.js";
  import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";
  import CheckCircle2Icon from "@lucide/svelte/icons/check-circle-2";
</script>

<!-- Default alert -->
<Alert.Root>
  <Alert.Title>Heads up!</Alert.Title>
  <Alert.Description>
    You can add components using the CLI.
  </Alert.Description>
</Alert.Root>

<!-- Success with icon -->
<Alert.Root>
  <CheckCircle2Icon />
  <Alert.Title>Success! Changes saved</Alert.Title>
  <Alert.Description>Your settings have been updated.</Alert.Description>
</Alert.Root>

<!-- Destructive variant -->
<Alert.Root variant="destructive">
  <AlertCircleIcon />
  <Alert.Title>Payment Error</Alert.Title>
  <Alert.Description>
    Verify your billing information and try again.
  </Alert.Description>
</Alert.Root>
```

---

### 22. Badge

**Description:** Displays a badge or tag element with multiple visual variants.

**Import:**
```svelte
<script>
  import { Badge, badgeVariants } from "$lib/components/ui/badge/index.js";
</script>
```

**Sub-components:** None.

**Key Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "secondary" \| "destructive" \| "outline"` | `"default"` | Visual style |
| `href` | `string` | `undefined` | Optional link destination |
| `class` | `string` | `undefined` | Additional CSS classes |
| `ref` | `HTMLElement \| null` | `null` | Bindable element reference |

Also exports `badgeVariants` for applying badge styles to custom elements.

**Usage:**
```svelte
<script lang="ts">
  import { Badge, badgeVariants } from "$lib/components/ui/badge/index.js";
  import BadgeCheckIcon from "@lucide/svelte/icons/badge-check";
</script>

<!-- Variants -->
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>

<!-- With icon -->
<Badge variant="secondary" class="bg-blue-500 text-white">
  <BadgeCheckIcon /> Verified
</Badge>

<!-- Numeric badge -->
<Badge class="h-5 min-w-5 rounded-full px-1 font-mono">8</Badge>

<!-- As link using badgeVariants -->
<a href="/dashboard" class={badgeVariants({ variant: "outline" })}>
  Dashboard
</a>
```

---

### 23. Skeleton

**Description:** A placeholder component shown while content is loading, with pulse animation.

**Import:**
```svelte
<script>
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
</script>
```

**Sub-components:** None.

**Key Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `ref` | `HTMLDivElement \| null` | `null` | Bindable element reference |
| `class` | `string` | `undefined` | CSS classes (shape and size) |

**Default styling:** `bg-accent animate-pulse rounded-md`

**Usage:**
```svelte
<script lang="ts">
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
</script>

<!-- Basic text line -->
<Skeleton class="h-[20px] w-[100px] rounded-full" />

<!-- User avatar with text placeholder -->
<div class="flex items-center space-x-4">
  <Skeleton class="size-12 rounded-full" />
  <div class="space-y-2">
    <Skeleton class="h-4 w-[250px]" />
    <Skeleton class="h-4 w-[200px]" />
  </div>
</div>

<!-- Card skeleton -->
<div class="flex flex-col space-y-3">
  <Skeleton class="h-[125px] w-[250px] rounded-xl" />
  <div class="space-y-2">
    <Skeleton class="h-4 w-[250px]" />
    <Skeleton class="h-4 w-[200px]" />
  </div>
</div>
```

---

### 24. Progress

**Description:** Displays a progress bar indicating task completion.

**Import:**
```svelte
<script>
  import { Progress } from "$lib/components/ui/progress/index.js";
</script>
```

**Sub-components:** None.

**Key Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | `undefined` | Current progress value |
| `max` | `number` | `100` | Maximum progress value |
| `ref` | `HTMLElement \| null` | `null` | Bindable element reference |
| `class` | `string` | `undefined` | Additional CSS classes |

**Usage:**
```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { Progress } from "$lib/components/ui/progress/index.js";

  let value = $state(13);

  onMount(() => {
    const timer = setTimeout(() => (value = 66), 500);
    return () => clearTimeout(timer);
  });
</script>

<Progress {value} max={100} class="w-[60%]" />
```

---

### 25. Sonner (Toast)

**Description:** An opinionated toast notification component for Svelte, ported from React Sonner.

**Import:**
```svelte
<script>
  // In layout (once)
  import { Toaster } from "$lib/components/ui/sonner/index.js";
  // In components (to trigger toasts)
  import { toast } from "svelte-sonner";
</script>
```

**Sub-components:**

| Component | Purpose |
|-----------|---------|
| `Toaster` | Container component placed in root layout (renders all toasts) |

**Key Props (Toaster):**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `"light" \| "dark" \| "system"` | `"system"` | Theme mode |
| `class` | `string` | `"toaster group"` | CSS classes |
| `style` | `string` | CSS variables | Custom theme colors |

**Toast API (`svelte-sonner`):**

| Method | Description |
|--------|-------------|
| `toast("message")` | Default toast |
| `toast.success("message")` | Success toast |
| `toast.error("message")` | Error toast |
| `toast.info("message")` | Info toast |
| `toast.warning("message")` | Warning toast |
| `toast.promise(promise, { loading, success, error })` | Async toast |
| `toast("message", { description, action: { label, onClick } })` | With description and action |

**Usage:**
```svelte
<!-- +layout.svelte (place once) -->
<script lang="ts">
  import { Toaster } from "$lib/components/ui/sonner/index.js";
  let { children } = $props();
</script>

<Toaster />
{@render children?.()}

<!-- In any component -->
<script lang="ts">
  import { toast } from "svelte-sonner";
  import { Button } from "$lib/components/ui/button/index.js";
</script>

<!-- Simple toast -->
<Button onclick={() => toast("Event has been created")}>
  Show Toast
</Button>

<!-- With description and action -->
<Button onclick={() =>
  toast("Event has been created", {
    description: "Sunday, December 03, 2023 at 9:00 AM",
    action: {
      label: "Undo",
      onClick: () => console.info("Undo"),
    },
  })
}>
  Show Toast
</Button>

<!-- Toast types -->
<Button onclick={() => toast.success("Profile updated!")}>Success</Button>
<Button onclick={() => toast.error("Something went wrong")}>Error</Button>
<Button onclick={() => toast.warning("Please review your input")}>Warning</Button>
<Button onclick={() => toast.info("New version available")}>Info</Button>
```

---

## Display Components

---

### 26. Avatar

**Description:** An image element with a fallback for representing the user (initials or placeholder).

**Import:**
```svelte
<script>
  import * as Avatar from "$lib/components/ui/avatar/index.js";
</script>
```

**Sub-components:**

| Component | Purpose |
|-----------|---------|
| `Avatar.Root` | Container wrapping the avatar |
| `Avatar.Image` | Image element for the avatar |
| `Avatar.Fallback` | Fallback content when image fails |

**Key Props:**

| Component | Prop | Type | Default | Description |
|-----------|------|------|---------|-------------|
| `Root` | `loadingStatus` | `"loading" \| "loaded" \| "error"` | `"loading"` | Image load state (bindable) |
| `Root` | `class` | `string` | `undefined` | Custom CSS classes |
| `Image` | `src` | `string` | -- | Image source URL |
| `Image` | `alt` | `string` | -- | Alt text for accessibility |
| `Fallback` | `class` | `string` | `undefined` | Custom CSS classes |

**Usage:**
```svelte
<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar/index.js";
</script>

<!-- Basic avatar with fallback -->
<Avatar.Root>
  <Avatar.Image src="https://github.com/shadcn.png" alt="@shadcn" />
  <Avatar.Fallback>CN</Avatar.Fallback>
</Avatar.Root>

<!-- Rounded variant -->
<Avatar.Root class="rounded-lg">
  <Avatar.Image src="https://github.com/evilrabbit.png" alt="@evilrabbit" />
  <Avatar.Fallback>ER</Avatar.Fallback>
</Avatar.Root>

<!-- Fallback only (no image) -->
<Avatar.Root>
  <Avatar.Fallback>JD</Avatar.Fallback>
</Avatar.Root>
```

---

### 27. Table

**Description:** A responsive table component for displaying structured data with headers, bodies, footers, and captions.

**Import:**
```svelte
<script>
  import * as Table from "$lib/components/ui/table/index.js";
</script>
```

**Sub-components:**

| Component | Element | Purpose |
|-----------|---------|---------|
| `Table.Root` | `<table>` | Container wrapping all table content |
| `Table.Header` | `<thead>` | Table header section |
| `Table.Body` | `<tbody>` | Table body |
| `Table.Footer` | `<tfoot>` | Table footer section |
| `Table.Row` | `<tr>` | Individual table row |
| `Table.Head` | `<th>` | Header cell |
| `Table.Cell` | `<td>` | Data cell |
| `Table.Caption` | `<caption>` | Table title/description |

**Key Props (all components):**

| Prop | Type | Description |
|------|------|-------------|
| `ref` | `HTMLElement \| null` | Bindable element reference |
| `class` | `string` | Additional CSS classes |

**Usage:**
```svelte
<script lang="ts">
  import * as Table from "$lib/components/ui/table/index.js";

  const invoices = [
    { invoice: "INV001", status: "Paid", method: "Credit Card", amount: "$250.00" },
    { invoice: "INV002", status: "Pending", method: "PayPal", amount: "$150.00" },
    { invoice: "INV003", status: "Unpaid", method: "Wire", amount: "$350.00" },
  ];
</script>

<Table.Root>
  <Table.Caption>A list of your recent invoices.</Table.Caption>
  <Table.Header>
    <Table.Row>
      <Table.Head class="w-[100px]">Invoice</Table.Head>
      <Table.Head>Status</Table.Head>
      <Table.Head>Method</Table.Head>
      <Table.Head class="text-end">Amount</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each invoices as inv (inv.invoice)}
      <Table.Row>
        <Table.Cell class="font-medium">{inv.invoice}</Table.Cell>
        <Table.Cell>{inv.status}</Table.Cell>
        <Table.Cell>{inv.method}</Table.Cell>
        <Table.Cell class="text-end">{inv.amount}</Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
  <Table.Footer>
    <Table.Row>
      <Table.Cell colspan={3}>Total</Table.Cell>
      <Table.Cell class="text-end">$750.00</Table.Cell>
    </Table.Row>
  </Table.Footer>
</Table.Root>
```

---

### 28. Tooltip

**Description:** A popup displaying information when an element receives keyboard focus or mouse hover.

**Import:**
```svelte
<script>
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
</script>
```

**Sub-components:**

| Component | Purpose |
|-----------|---------|
| `Tooltip.Provider` | Context provider (place once in root layout) |
| `Tooltip.Root` | Main wrapper for a single tooltip |
| `Tooltip.Trigger` | Element that triggers the tooltip |
| `Tooltip.Content` | The tooltip content container |
| `Tooltip.Portal` | Portal for rendering outside DOM hierarchy |

**Key Props:**

| Component | Prop | Type | Default | Description |
|-----------|------|------|---------|-------------|
| `Provider` | `delayDuration` | `number` | -- | Delay before showing |
| `Root` | `open` | `boolean` | `false` | Open state (bindable) |
| `Content` | `sideOffset` | `number` | `0` | Distance from trigger |
| `Content` | `side` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | Tooltip position |
| `Content` | `arrowClasses` | `string` | -- | Custom arrow styling |

**Usage:**
```svelte
<script lang="ts">
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
</script>

<!-- Provider should wrap all tooltip content (typically in layout) -->
<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <Button {...props} variant="outline">Hover me</Button>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content>
      <p>Add to library</p>
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
```

---

### 29. Popover

**Description:** Displays rich content in a floating portal, triggered by a button. Positioned relative to the trigger element.

**Import:**
```svelte
<script>
  import * as Popover from "$lib/components/ui/popover/index.js";
</script>
```

**Sub-components:**

| Component | Purpose |
|-----------|---------|
| `Popover.Root` | Container managing popover state |
| `Popover.Trigger` | Button that opens/closes the popover |
| `Popover.Content` | Floating content container |
| `Popover.Close` | Button to close the popover |
| `Popover.Portal` | Renders content outside DOM hierarchy |

**Key Props:**

| Component | Prop | Type | Default | Description |
|-----------|------|------|---------|-------------|
| `Root` | `open` | `boolean` | `false` | Visibility state (bindable) |
| `Content` | `sideOffset` | `number` | `4` | Distance from trigger |
| `Content` | `align` | `"start" \| "center" \| "end"` | `"center"` | Alignment |
| `Content` | `class` | `string` | `undefined` | Custom CSS classes |

**Usage:**
```svelte
<script lang="ts">
  import * as Popover from "$lib/components/ui/popover/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
</script>

<Popover.Root>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="outline">Open popover</Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="w-80">
    <div class="grid gap-4">
      <div class="space-y-2">
        <h4 class="font-medium leading-none">Dimensions</h4>
        <p class="text-muted-foreground text-sm">
          Set the dimensions for the layer.
        </p>
      </div>
      <div class="grid gap-2">
        <div class="grid grid-cols-3 items-center gap-4">
          <Label for="width">Width</Label>
          <Input id="width" value="100%" class="col-span-2 h-8" />
        </div>
        <div class="grid grid-cols-3 items-center gap-4">
          <Label for="height">Height</Label>
          <Input id="height" value="25px" class="col-span-2 h-8" />
        </div>
      </div>
    </div>
  </Popover.Content>
</Popover.Root>
```

---

### 30. Sheet

**Description:** A panel that slides in from the edge of the screen (top, bottom, left, right). Extends the Dialog component for complementary content.

**Import:**
```svelte
<script>
  import * as Sheet from "$lib/components/ui/sheet/index.js";
</script>
```

**Sub-components:**

| Component | Purpose |
|-----------|---------|
| `Sheet.Root` | Container for the sheet |
| `Sheet.Trigger` | Element that opens the sheet |
| `Sheet.Content` | Main content area with slide-in positioning |
| `Sheet.Portal` | Renders content in portal |
| `Sheet.Overlay` | Semi-transparent backdrop |
| `Sheet.Header` | Top section for titles/descriptions |
| `Sheet.Title` | Heading text |
| `Sheet.Description` | Supporting text |
| `Sheet.Footer` | Bottom section for actions |
| `Sheet.Close` | Close button |

**Key Props:**

| Component | Prop | Type | Default | Description |
|-----------|------|------|---------|-------------|
| `Content` | `side` | `"top" \| "bottom" \| "left" \| "right"` | `"right"` | Slide-in direction |
| `Content` | `class` | `string` | `undefined` | Custom CSS classes |
| `Content` | `portalProps` | `object` | `undefined` | Portal configuration |

**Usage:**
```svelte
<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Sheet from "$lib/components/ui/sheet/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
</script>

<Sheet.Root>
  <Sheet.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="outline">Open</Button>
    {/snippet}
  </Sheet.Trigger>
  <Sheet.Content side="right">
    <Sheet.Header>
      <Sheet.Title>Edit profile</Sheet.Title>
      <Sheet.Description>
        Make changes to your profile here. Click save when done.
      </Sheet.Description>
    </Sheet.Header>
    <div class="grid flex-1 auto-rows-min gap-6 px-4">
      <div class="grid gap-3">
        <Label for="name">Name</Label>
        <Input id="name" value="Pedro Duarte" />
      </div>
      <div class="grid gap-3">
        <Label for="username">Username</Label>
        <Input id="username" value="@peduarte" />
      </div>
    </div>
    <Sheet.Footer>
      <Button type="submit">Save changes</Button>
      <Sheet.Close>Close</Sheet.Close>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>

<!-- Left side sheet -->
<Sheet.Root>
  <Sheet.Trigger>Open Left</Sheet.Trigger>
  <Sheet.Content side="left">
    <Sheet.Header>
      <Sheet.Title>Navigation</Sheet.Title>
    </Sheet.Header>
    <!-- navigation content -->
  </Sheet.Content>
</Sheet.Root>
```

---

## Quick Import Reference

```svelte
<script>
  // Single components (named import)
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import { Progress } from "$lib/components/ui/progress/index.js";
  import { Badge, badgeVariants } from "$lib/components/ui/badge/index.js";
  import { Toaster } from "$lib/components/ui/sonner/index.js";
  import { toast } from "svelte-sonner";

  // Compound components (namespace import)
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as Sheet from "$lib/components/ui/sheet/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import * as Alert from "$lib/components/ui/alert/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import * as InputGroup from "$lib/components/ui/input-group/index.js";
  import * as Command from "$lib/components/ui/command/index.js";

  // Utilities
  import { cn } from "$lib/utils.js";

  // Icons (individual Lucide imports)
  import Settings from "@lucide/svelte/icons/settings";
  import Check from "@lucide/svelte/icons/check";
</script>
```
