# shadcn-svelte Extended Components & Core Docs Reference

## Core Documentation

### Theming

The theming system uses **CSS variables** with a "background/foreground" naming convention.

**Usage:** `<div class="bg-primary text-primary-foreground">Hello</div>`

**Adding Custom Colors:**
```css
:root {
  --warning: oklch(0.84 0.16 84);
  --warning-foreground: oklch(0.28 0.07 46);
}
.dark {
  --warning: oklch(0.41 0.11 46);
  --warning-foreground: oklch(0.99 0.02 95);
}
@theme inline {
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
}
```

### CLI Commands

```bash
# Initialize project
npx shadcn-svelte@latest init

# Add a component
npx shadcn-svelte@latest add [component]

# Add all components
npx shadcn-svelte@latest add -a
```

### Tailwind v4 Setup

- Uses `@tailwindcss/vite` plugin (not PostCSS)
- Uses `tw-animate-css` (not `tailwindcss-animate`)
- Custom variant: `@custom-variant dark (&:is(.dark *))`
- Theme via `@theme inline` directive in CSS
- Colors in OKLCH format

---

## Extended Components

### Accordion

```ts
import * as Accordion from "$lib/components/ui/accordion/index.js";
```
Sub-components: `Root`, `Item`, `Trigger`, `Content`

| Prop | Type | Component |
|------|------|-----------|
| `type` | `"single" \| "multiple"` | Root |
| `value` | `string \| string[]` | Root |

```svelte
<Accordion.Root type="single" value="item-1">
  <Accordion.Item value="item-1">
    <Accordion.Trigger>Question?</Accordion.Trigger>
    <Accordion.Content>Answer here.</Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
```

### Alert Dialog

```ts
import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
```
Sub-components: `Root`, `Trigger`, `Content`, `Header`, `Title`, `Description`, `Footer`, `Action`, `Cancel`, `Portal`, `Overlay`

```svelte
<AlertDialog.Root>
  <AlertDialog.Trigger>Show Dialog</AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Confirm Action</AlertDialog.Title>
      <AlertDialog.Description>This action cannot be undone.</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action>Continue</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
```

### Calendar

```ts
import { Calendar } from "$lib/components/ui/calendar/index.js";
```

| Prop | Type |
|------|------|
| `type` | `"single" \| "range"` |
| `value` | `CalendarDate` |
| `captionLayout` | `"dropdown" \| "dropdown-months" \| "dropdown-years"` |
| `numberOfMonths` | `number` |

```svelte
<script>
  import { today, getLocalTimeZone } from "@internationalized/date";
  let value = today(getLocalTimeZone());
</script>
<Calendar type="single" bind:value class="rounded-md border" />
```

### Range Calendar

```ts
import { RangeCalendar } from "$lib/components/ui/range-calendar/index.js";
```

| Prop | Type |
|------|------|
| `value` | `{ start: DateValue; end: DateValue }` |

```svelte
<script>
  import { getLocalTimeZone, today } from "@internationalized/date";
  const start = today(getLocalTimeZone());
  const end = start.add({ days: 7 });
  let value = $state({ start, end });
</script>
<RangeCalendar bind:value class="rounded-md border" />
```

### Carousel

```ts
import * as Carousel from "$lib/components/ui/carousel/index.js";
```
Sub-components: `Root`, `Content`, `Item`, `Previous`, `Next`

| Prop | Type | Component |
|------|------|-----------|
| `opts` | `CarouselOptions` | Root |
| `orientation` | `"horizontal" \| "vertical"` | Root |
| `plugins` | `EmblaPlugin[]` | Root |

```svelte
<Carousel.Root class="w-full max-w-xs">
  <Carousel.Content>
    {#each Array(5) as _, i}
      <Carousel.Item>
        <Card.Root><Card.Content class="flex aspect-square items-center justify-center p-6">
          <span>{i + 1}</span>
        </Card.Content></Card.Root>
      </Carousel.Item>
    {/each}
  </Carousel.Content>
  <Carousel.Previous />
  <Carousel.Next />
</Carousel.Root>
```

### Chart

Built on **LayerChart**.

```ts
import * as Chart from "$lib/components/ui/chart/index.js";
```
Sub-components: `Container`, `Tooltip`, `ChartStyle`

```svelte
<Chart.Container config={chartConfig}>
  <BarChart data={chartData} x="month" legend>
    {#snippet tooltip()}
      <Chart.Tooltip />
    {/snippet}
  </BarChart>
</Chart.Container>
```

### Collapsible

```ts
import * as Collapsible from "$lib/components/ui/collapsible/index.js";
```
Sub-components: `Root`, `Trigger`, `Content`

```svelte
<Collapsible.Root>
  <Collapsible.Trigger>Toggle</Collapsible.Trigger>
  <Collapsible.Content>Expandable content.</Collapsible.Content>
</Collapsible.Root>
```

### Command

```ts
import * as Command from "$lib/components/ui/command/index.js";
```
Sub-components: `Root`, `Input`, `List`, `Empty`, `Group`, `Item`, `Shortcut`, `Separator`, `Dialog`

```svelte
<Command.Root>
  <Command.Input placeholder="Search commands..." />
  <Command.List>
    <Command.Group heading="Actions">
      <Command.Item>Calendar</Command.Item>
      <Command.Item>Settings</Command.Item>
    </Command.Group>
  </Command.List>
</Command.Root>
```

### Context Menu

```ts
import * as ContextMenu from "$lib/components/ui/context-menu/index.js";
```
Sub-components: `Root`, `Trigger`, `Content`, `Item`, `CheckboxItem`, `RadioItem`, `RadioGroup`, `Group`, `GroupHeading`, `Separator`, `Sub`, `SubTrigger`, `SubContent`

```svelte
<ContextMenu.Root>
  <ContextMenu.Trigger>Right click here</ContextMenu.Trigger>
  <ContextMenu.Content class="w-52">
    <ContextMenu.Item inset>Back</ContextMenu.Item>
    <ContextMenu.Separator />
    <ContextMenu.CheckboxItem bind:checked={showBookmarks}>
      Show Bookmarks
    </ContextMenu.CheckboxItem>
  </ContextMenu.Content>
</ContextMenu.Root>
```

### Data Table

Built on **TanStack Table v8**.

```ts
import { createSvelteTable, FlexRender, renderComponent, renderSnippet } from "$lib/components/ui/data-table/index.js";
import * as Table from "$lib/components/ui/table/index.js";
```

```svelte
<script>
  const table = createSvelteTable({
    get data() { return payments; },
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
</script>
<Table.Root>
  <Table.Header>
    {#each table.getHeaderGroups() as headerGroup}
      <Table.Row>
        {#each headerGroup.headers as header}
          <Table.Head>
            <FlexRender content={header.column.columnDef.header} context={header.getContext()} />
          </Table.Head>
        {/each}
      </Table.Row>
    {/each}
  </Table.Header>
  <Table.Body>
    {#each table.getRowModel().rows as row}
      <Table.Row>
        {#each row.getVisibleCells() as cell}
          <Table.Cell>
            <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
          </Table.Cell>
        {/each}
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
```

### Drawer

```ts
import * as Drawer from "$lib/components/ui/drawer/index.js";
```
Sub-components: `Root`, `Trigger`, `Content`, `Header`, `Title`, `Description`, `Footer`, `Close`, `NestedRoot`

| Prop | Type | Component |
|------|------|-----------|
| `shouldScaleBackground` | `boolean` | Root |
| `direction` | `"top" \| "bottom" \| "left" \| "right"` | Root |

```svelte
<Drawer.Root>
  <Drawer.Trigger>Open Drawer</Drawer.Trigger>
  <Drawer.Content>
    <Drawer.Header>
      <Drawer.Title>Title</Drawer.Title>
      <Drawer.Description>Description</Drawer.Description>
    </Drawer.Header>
    <Drawer.Footer>
      <Button>Submit</Button>
      <Drawer.Close>Cancel</Drawer.Close>
    </Drawer.Footer>
  </Drawer.Content>
</Drawer.Root>
```

### Empty

```ts
import * as Empty from "$lib/components/ui/empty/index.js";
```
Sub-components: `Root`, `Header`, `Media`, `Title`, `Description`, `Content`

```svelte
<Empty.Root>
  <Empty.Header>
    <Empty.Media variant="icon"><IconComponent /></Empty.Media>
    <Empty.Title>No Projects</Empty.Title>
    <Empty.Description>Create your first project</Empty.Description>
  </Empty.Header>
  <Empty.Content>
    <Button>Create Project</Button>
  </Empty.Content>
</Empty.Root>
```

### Hover Card

```ts
import * as HoverCard from "$lib/components/ui/hover-card/index.js";
```
Sub-components: `Root`, `Trigger`, `Content`, `Portal`

```svelte
<HoverCard.Root>
  <HoverCard.Trigger>Hover here</HoverCard.Trigger>
  <HoverCard.Content>Preview content</HoverCard.Content>
</HoverCard.Root>
```

### Input OTP

```ts
import * as InputOTP from "$lib/components/ui/input-otp/index.js";
```
Sub-components: `Root`, `Group`, `Slot`, `Separator`

```svelte
<InputOTP.Root maxlength={6} bind:value>
  {#snippet children({ cells })}
    <InputOTP.Group>
      {#each cells as cell (cell)}
        <InputOTP.Slot {cell} />
      {/each}
    </InputOTP.Group>
  {/snippet}
</InputOTP.Root>
```

### Item

```ts
import * as Item from "$lib/components/ui/item/index.js";
```
Sub-components: `Root`, `Content`, `Title`, `Description`, `Actions`, `Media`, `Group`, `Header`, `Footer`, `Separator`

```svelte
<Item.Root variant="outline">
  <Item.Media variant="icon"><IconComponent /></Item.Media>
  <Item.Content>
    <Item.Title>Title Text</Item.Title>
    <Item.Description>Description text</Item.Description>
  </Item.Content>
  <Item.Actions><Button>Action</Button></Item.Actions>
</Item.Root>
```

### Kbd

```ts
import * as Kbd from "$lib/components/ui/kbd/index.js";
```
Sub-components: `Root`, `Group`

```svelte
<Kbd.Group>
  <Kbd.Root>Ctrl</Kbd.Root><span>+</span><Kbd.Root>B</Kbd.Root>
</Kbd.Group>
```

### Menubar

```ts
import * as Menubar from "$lib/components/ui/menubar/index.js";
```
Sub-components: `Root`, `Menu`, `Trigger`, `Content`, `Item`, `Separator`, `Shortcut`, `Sub`, `SubTrigger`, `SubContent`, `CheckboxItem`, `RadioGroup`, `RadioItem`, `Label`, `GroupHeading`, `Group`

```svelte
<Menubar.Root>
  <Menubar.Menu>
    <Menubar.Trigger>File</Menubar.Trigger>
    <Menubar.Content>
      <Menubar.Item>New Tab <Menubar.Shortcut>Cmd+T</Menubar.Shortcut></Menubar.Item>
      <Menubar.Separator />
      <Menubar.Item>Print</Menubar.Item>
    </Menubar.Content>
  </Menubar.Menu>
</Menubar.Root>
```

### Native Select

```ts
import * as NativeSelect from "$lib/components/ui/native-select/index.js";
```
Sub-components: `Root`, `Option`, `OptGroup`

```svelte
<NativeSelect.Root>
  <NativeSelect.Option value="">Choose fruit</NativeSelect.Option>
  <NativeSelect.Option value="apple">Apple</NativeSelect.Option>
</NativeSelect.Root>
```

### Navigation Menu

```ts
import * as NavigationMenu from "$lib/components/ui/navigation-menu/index.js";
```
Sub-components: `Root`, `List`, `Item`, `Trigger`, `Content`, `Link`, `Indicator`, `Viewport`

```svelte
<NavigationMenu.Root>
  <NavigationMenu.List>
    <NavigationMenu.Item>
      <NavigationMenu.Trigger>Menu</NavigationMenu.Trigger>
      <NavigationMenu.Content>
        <NavigationMenu.Link href="/docs">Documentation</NavigationMenu.Link>
      </NavigationMenu.Content>
    </NavigationMenu.Item>
  </NavigationMenu.List>
</NavigationMenu.Root>
```

### Pagination

```ts
import * as Pagination from "$lib/components/ui/pagination/index.js";
```
Sub-components: `Root`, `Content`, `Item`, `Link`, `Previous`, `Next`, `Ellipsis`

```svelte
<Pagination.Root count={100} perPage={10}>
  {#snippet children({ pages, currentPage })}
    <Pagination.Content>
      <Pagination.Item><Pagination.Previous /></Pagination.Item>
      {#each pages as page}
        <Pagination.Item>
          <Pagination.Link {page} isActive={currentPage === page.value}>
            {page.value}
          </Pagination.Link>
        </Pagination.Item>
      {/each}
      <Pagination.Item><Pagination.Next /></Pagination.Item>
    </Pagination.Content>
  {/snippet}
</Pagination.Root>
```

### Resizable

Built on **PaneForge**.

```ts
import * as Resizable from "$lib/components/ui/resizable/index.js";
```
Sub-components: `PaneGroup`, `Pane`, `Handle`

```svelte
<Resizable.PaneGroup direction="horizontal">
  <Resizable.Pane defaultSize={50}>Panel One</Resizable.Pane>
  <Resizable.Handle />
  <Resizable.Pane defaultSize={50}>Panel Two</Resizable.Pane>
</Resizable.PaneGroup>
```

### Scroll Area

```ts
import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
```

```svelte
<ScrollArea class="h-72 w-48 rounded-md border">
  <div class="p-4">Scrollable content here</div>
</ScrollArea>
```

### Slider

```ts
import { Slider } from "$lib/components/ui/slider/index.js";
```

| Prop | Type |
|------|------|
| `value` | bindable |
| `type` | `"single" \| "range"` |
| `max` | `number` (default: 100) |
| `step` | `number` |

```svelte
<Slider type="single" bind:value max={100} step={1} />
```

### Spinner

```ts
import { Spinner } from "$lib/components/ui/spinner/index.js";
```

```svelte
<Spinner />
<Spinner class="size-6 text-blue-500" />
```

### Toggle

```ts
import { Toggle } from "$lib/components/ui/toggle/index.js";
```

| Prop | Type | Default |
|------|------|---------|
| `pressed` | `boolean` | `false` |
| `variant` | `"default" \| "outline"` | `"default"` |
| `size` | `"sm" \| "default" \| "lg"` | `"default"` |

```svelte
<Toggle aria-label="Toggle italic">Toggle</Toggle>
```

### Toggle Group

```ts
import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
```
Sub-components: `Root`, `Item`

```svelte
<ToggleGroup.Root type="single" variant="outline">
  <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
  <ToggleGroup.Item value="italic">Italic</ToggleGroup.Item>
</ToggleGroup.Root>
```

### Button Group

```ts
import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
```
Sub-components: `Root`, `Text`, `Separator`

```svelte
<ButtonGroup.Root>
  <Button variant="outline">Save</Button>
  <Button variant="outline">Cancel</Button>
</ButtonGroup.Root>
```

### Typography

No components - use Tailwind utility classes directly:

| Element | Classes |
|---------|---------|
| h1 | `scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl` |
| h2 | `scroll-m-20 text-3xl font-semibold tracking-tight` |
| h3 | `scroll-m-20 text-2xl font-semibold tracking-tight` |
| h4 | `scroll-m-20 text-xl font-semibold tracking-tight` |
| p | `leading-7 [&:not(:first-child)]:mt-6` |
| blockquote | `mt-6 border-s-2 ps-6 italic` |
| list | `my-6 ms-6 list-disc [&>li]:mt-2` |
| inline code | `relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold` |
| lead | `text-xl text-muted-foreground` |
| muted | `text-sm text-muted-foreground` |

### Aspect Ratio

```ts
import { AspectRatio } from "$lib/components/ui/aspect-ratio/index.js";
```

```svelte
<AspectRatio ratio={16 / 9} class="bg-muted rounded-lg">
  <img src="image.jpg" alt="Photo" class="h-full w-full rounded-lg object-cover" />
</AspectRatio>
```
