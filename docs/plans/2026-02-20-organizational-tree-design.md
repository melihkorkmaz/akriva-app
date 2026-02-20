# Design: Organizational Tree Management

## Goal

Implement a fully functional organizational unit management page at `/settings/organizational-tree/` that replaces the existing static mockup. Users can view their tenant's org hierarchy as a tree, create/edit/delete nodes, and rearrange the tree via drag-and-drop.

## Key Decisions

- **Scope**: API-supported fields only (name, code, type, description, equitySharePercentage, status). Location and Scientific Authority Override sections from the mockup are dropped — no backend support.
- **Architecture**: Hybrid — SvelteKit form actions for create/update/delete (consistent with codebase), client-side fetch via server proxy for drag-and-drop move.
- **Create flow**: Inline in the details panel (not a dialog). Click "Add" or hover "+" on a node to create a child.
- **Delete flow**: Confirmation dialog (shadcn Dialog). 409 errors show toast about children.
- **Drag-and-drop**: HTML5 Drag and Drop API, no external library. Server validates cycles and depth.
- **No optimistic UI**: All mutations refetch the tree via `invalidateAll()`.

## Page Architecture

Two-panel layout:
- **Left (300px)**: Tree panel — org hierarchy from `GET /v1/org-units?view=tree`
- **Right (flex-1)**: Details panel — empty state, create form, or edit form depending on selection

### Data Flow

1. `+page.server.ts` load fetches tree + returns two Superforms (create, update)
2. Selecting a node populates the update form
3. Create/update/delete go through named form actions (`?/create`, `?/update`, `?/delete`)
4. Drag-and-drop move calls `/settings/organizational-tree/move` server proxy endpoint
5. After any mutation, `invalidateAll()` refetches the tree

## File Structure

```
src/routes/(app)/settings/organizational-tree/
├── +page.server.ts          (load + create/update/delete actions)
├── +page.svelte             (orchestrator: tree + details panels)
├── move/
│   └── +server.ts           (API proxy for drag-and-drop move)
└── _components/
    ├── OrgTree.svelte        (tree panel with drag-and-drop)
    ├── OrgNodeForm.svelte    (create/edit form for details panel)
    ├── DeleteDialog.svelte   (confirmation dialog)
    └── EmptyState.svelte     (no node selected)

src/lib/api/org-units.ts      (API client functions)
src/lib/api/types.ts          (OrgUnit DTOs added)
src/lib/schemas/org-unit.ts   (Zod schemas for create/update)
```

## Tree Panel (OrgTree.svelte)

- Header: "Organization" title + "Add" button
- Recursive tree rendering with depth-based indentation (20px/level)
- Type icons: subsidiary → Building2, division → Building, facility → Warehouse
- Click node → select (loads in details panel)
- Chevron click → expand/collapse
- Hover "+" icon → add child of that node
- Drag node → reparent via move proxy
- Drop target highlights with `bg-primary/10`
- Client-side check prevents dropping onto self or descendants

## Details Panel (OrgNodeForm.svelte)

### Empty State
"Select a node from the tree to view its details, or click Add to create a new organizational unit."

### Create Mode
- Title: "New Organizational Unit"
- Fields: Parent (dropdown), Name, Code (with format hint), Type (select), Description (textarea), Equity Share % (number)
- Actions: Cancel + Create
- On success: toast, tree refetch, auto-select new node

### Edit Mode
- Title: node name + type badge
- Fields: Name (editable), Code (disabled), Type (badge, read-only), Description (editable), Equity Share % (editable), Status (switch)
- Actions: Save Changes
- Danger Zone card with Delete button → opens DeleteDialog

## Schemas

### createOrgUnitSchema
- parentId: uuid | null
- name: string, 1-200 chars, required
- type: enum(subsidiary, division, facility), required
- code: string, 1-50 chars, regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`, required
- description: string, max 1000 chars, nullable
- equitySharePercentage: number 0-100, nullable

### updateOrgUnitSchema
- name: string, 1-200 chars, required
- description: string, max 1000 chars, nullable
- equitySharePercentage: number 0-100, nullable
- status: enum(active, inactive)

## API Client (src/lib/api/org-units.ts)

1. `getOrgUnitsTree(token)` → GET /v1/org-units?view=tree
2. `createOrgUnit(token, data)` → POST /v1/org-units
3. `updateOrgUnit(token, id, data)` → PATCH /v1/org-units/{id}
4. `deleteOrgUnit(token, id)` → DELETE /v1/org-units/{id}
5. `moveOrgUnit(token, id, data)` → PATCH /v1/org-units/{id}/move

## Error Handling

| Scenario | UI Response |
|----------|-------------|
| 400 Validation failed | Field-level errors via Superforms |
| 403 Forbidden | Toast: "You don't have permission to perform this action" |
| 404 Parent not found | Toast: "Parent org unit not found" |
| 409 Duplicate code | Field error on `code`: "This code is already in use" |
| 409 Delete blocked by children | Toast: "This node has active children. Move or delete them first." |
| 400 Cyclic move | Toast: "Cannot move a node under its own descendant" |
| 400 Max depth exceeded | Toast: "Maximum tree depth (10 levels) exceeded" |

## Edge Cases

- **Empty tree**: Prominent CTA — "Create your first organizational unit"
- **After delete**: Clear selection → empty state
- **No optimistic UI**: Full tree refetch after every mutation
- **Unsaved changes on node switch**: Silently discarded (consistent with other settings pages)
- **Drag onto self/descendant**: Client-side prevention before API call
