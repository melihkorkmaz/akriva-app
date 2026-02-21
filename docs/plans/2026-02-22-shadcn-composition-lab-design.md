# Shadcn Component Composition Lab — Design

## Overview

A single-file HTML playground for browsing, composing, and configuring shadcn-svelte components using Akriva's exact design tokens. Outputs copy-paste Svelte 5 code that follows the project's import conventions.

## Layout

Three-panel layout:

- **Left sidebar (~240px):** Component palette organized by category. Click to add to canvas.
- **Center canvas (flexible):** Live visual preview rendered with Akriva design tokens. Click a component to select it (blue ring highlight).
- **Right panel (~320px):** Two tabs — Props (configure selected component) and Code (generated Svelte 5 code with copy button).

## Component Palette

| Category | Components |
|---|---|
| Layout | Card (Root/Header/Title/Description/Content/Footer), Separator, Field.Group/Set/Legend |
| Form | Input, Textarea, Select, Checkbox, Switch, RadioGroup, Button, Label |
| Data Display | Badge, Avatar, Progress, Skeleton, Table (basic) |
| Feedback | Alert + AlertDescription, Dialog |
| Navigation | Breadcrumb, Tabs, DropdownMenu |

## Interaction Model

1. **Click to add** — component appends as last child of the currently selected container (or canvas root)
2. **Select** — click any component on canvas to select it (blue ring highlight)
3. **Nest** — layout components (Card, Field.Group) act as containers; adding while one is selected inserts inside it
4. **Reorder** — up/down arrow buttons on selected component
5. **Delete** — trash button removes selected component
6. **Props panel** — updates preview in real-time

## Code Output

- Namespace imports for compound components (`import * as Card from "$lib/components/ui/card/index.js"`)
- Named imports for singles (`import { Button } from "$lib/components/ui/button/index.js"`)
- Svelte 5 syntax (`class` not `className`)
- Copy button with "Copied!" feedback

## Theming

Embeds Akriva CSS variables: primary blue (oklch(0.546 0.222 264)), background/card/border/muted colors, Inter font, shadow scale, radius values. Light mode only.

## Out of Scope

- No save/load to localStorage
- No export to file
- No undo/redo
- No drag-and-drop
- No responsive preview breakpoints
- No dark mode toggle
