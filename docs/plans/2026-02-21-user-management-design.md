# Design: User Management (Team Members)

**Date**: 2026-02-21
**Status**: Approved
**API Handoff**: `docs/handoffs/user-management.md`

---

## Goal

Build a User Management page under Settings that lets tenant admins view users, change roles, manage org-unit assignments, and deactivate users. Simultaneously migrate the frontend from the legacy 3-role system to the 5-role system defined in the backend API.

## Key Decisions

1. **Single page + dialogs** at `/settings/team-members/` — no separate detail pages
2. **Full role migration** from `owner | admin | user` to `viewer | data_entry | data_approver | tenant_admin | super_admin`
3. **Admin-only access** — only `tenant_admin` and `super_admin` can see or access the page
4. **Full assignment UI** — checkbox list of org units with bulk replace via `PUT`
5. **Inline table actions** — row dropdown menu opens focused dialogs for each action

---

## 1. Data Layer & Role Migration

### Role type migration

Replace `UserRole = 'owner' | 'admin' | 'user'` with `TenantRole`:

```typescript
type TenantRole = 'viewer' | 'data_entry' | 'data_approver' | 'tenant_admin' | 'super_admin';
```

Updated across:
- `src/lib/api/types.ts` — new `TenantRole` type, new `UserResponseDto`, `UserMeResponseDto`, `AssignmentResponseDto`
- `src/lib/server/auth.ts` — update `SessionUser.role`, `VALID_ROLES` array, JWT claim extraction
- `src/components/app-sidebar.svelte` — gate admin nav items by new role values
- `src/routes/(app)/settings/+layout.svelte` — conditionally show Team Members nav item

### New API module: `src/lib/api/users.ts`

| Function | Endpoint |
|---|---|
| `fetchCurrentUser(token)` | `GET /v1/users/me` |
| `fetchUsers(token, params?)` | `GET /v1/users` (search, role, pagination, includeInactive) |
| `updateProfile(token, data)` | `PATCH /v1/users/profile` |
| `updateUserRole(token, userId, role)` | `PATCH /v1/users/{userId}/role` |
| `deactivateUser(token, userId)` | `DELETE /v1/users/{userId}` |
| `fetchAssignments(token, userId)` | `GET /v1/users/{userId}/assignments` |
| `replaceAssignments(token, userId, orgUnitIds)` | `PUT /v1/users/{userId}/assignments` |
| `addAssignment(token, userId, orgUnitId)` | `POST /v1/users/{userId}/assignments` |
| `removeAssignment(token, userId, orgUnitId)` | `DELETE /v1/users/{userId}/assignments/{orgUnitId}` |

### Zod schemas: `src/lib/schemas/user-management.ts`

Validation schemas for role change form and assignment form.

---

## 2. Page Structure & User List

### Route: `/settings/team-members/`

### Settings sidebar

Add "Team Members" nav item with `UsersRound` icon between "Organizational Tree" and "Security". Conditionally rendered — only visible to `tenant_admin` and `super_admin`.

### `+page.server.ts` load function

- Fetches user list via `GET /v1/users` (default: active only, limit 50)
- Fetches org tree via `GET /v1/org-units?view=tree` (needed for assignment dialogs)
- Returns both datasets plus current user info (for self-action guards)
- Route guard: redirects non-admin roles away

### `+page.svelte` layout

- Page header: "Team Members" title + description + user count badge
- Search bar (Input) + role filter (Select) above the table
- No "Add User" button — user creation handled through invitation flow (separate feature)

### Data table columns (TanStack Table)

| Column | Details |
|---|---|
| Name | `displayName` (bold) with email below in muted text |
| Role | Badge with role display label |
| Status | Green/gray dot for active/inactive |
| Actions | DropdownMenu: Change Role, Manage Assignments, Deactivate |

### Search & filter

Debounced search input + role select trigger server-side re-fetch via `goto()` with updated query params.

### Self-action guards (UI-only)

- Hide "Change Role" and "Deactivate" on the current user's row
- "Manage Assignments" still available (even if meaningless for admins)

---

## 3. Action Dialogs

### Change Role Dialog (`ChangeRoleDialog.svelte`)

- User name/email at top, Select dropdown with 5 roles, pre-selected to current
- Submits via named form action `?/changeRole` calling `PATCH /v1/users/{userId}/role`
- 409 (last super_admin demotion): inline Alert inside dialog
- On success: toast "Role updated", dialog closes, page reloads

### Manage Assignments Dialog (`ManageAssignmentsDialog.svelte`)

- User name/email at top
- Checklist of all org units (flat list with indentation by tree depth), each with Checkbox
- Pre-checked based on `GET /v1/users/{userId}/assignments` (fetched on dialog open, Skeleton while loading)
- For `tenant_admin`/`super_admin` users: Alert banner "Admins have tenant-wide access. Assignments have no practical effect."
- Submits via `?/updateAssignments` calling `PUT /v1/users/{userId}/assignments` (full replace)
- On success: toast "Assignments updated", dialog closes

### Deactivate Dialog (`DeactivateDialog.svelte`)

- Confirmation dialog with destructive styling
- Shows user name/email + warning text about access removal
- Red "Deactivate" button (variant="destructive")
- 409 (last super_admin): inline Alert inside dialog
- On success: toast "User deactivated", dialog closes, row updates

### Shared dialog patterns

- All use shadcn `Dialog.Root` / `Dialog.Content` / `Dialog.Header` / `Dialog.Footer`
- Form submissions via SvelteKit named form actions in `+page.server.ts`
- Each action validates with Zod, calls API, returns result
- Dialogs receive target user as prop, controlled by `$state` booleans

---

## 4. Access Guards & Sidebar Integration

### Route guard

`+page.server.ts` load checks session role. Non-admin roles get `redirect(302, '/settings/company')`.

### Settings layout role access

Settings `+layout.svelte` needs role data to conditionally render the "Team Members" nav item. Accessed via `$page.data` from the parent `(app)/+layout.server.ts` which already returns `data.user`.

### App sidebar gating

The main app sidebar gates "Settings" and "Team Members" links to `tenant_admin` / `super_admin` roles.

---

## 5. Error Handling & Edge Cases

### Error mapping

| API Error | UI Response |
|---|---|
| 400 (validation) | Field-level errors on the form |
| 403 (forbidden) | Toast: "You don't have permission for this action" |
| 404 (not found / cross-tenant) | Toast: "User not found" |
| 409 (last super_admin / duplicate assignment) | Inline Alert inside dialog with API message |

### Edge cases

- **Last super_admin protection**: Dialog stays open with error on 409. No optimistic UI.
- **Self-actions hidden**: Current user's row has no Change Role or Deactivate actions.
- **Stale data**: `invalidateAll()` after every mutation to reload page data.
- **Empty state**: Centered empty state when no users match search/filter.
- **Inactive users**: Toggle "Show inactive users" adds `includeInactive=true` to query. Inactive rows render with muted styling.

---

## File Inventory

### New files

| File | Purpose |
|---|---|
| `src/lib/api/users.ts` | API wrapper functions (9 endpoints) |
| `src/lib/schemas/user-management.ts` | Zod schemas for role change + assignments |
| `src/routes/(app)/settings/team-members/+page.server.ts` | Load + 3 named form actions |
| `src/routes/(app)/settings/team-members/+page.svelte` | Page: table + search/filter + dialogs |
| `src/routes/(app)/settings/team-members/_components/columns.ts` | TanStack Table column definitions |
| `src/routes/(app)/settings/team-members/_components/DataTable.svelte` | Data table component |
| `src/routes/(app)/settings/team-members/_components/ChangeRoleDialog.svelte` | Role change dialog |
| `src/routes/(app)/settings/team-members/_components/ManageAssignmentsDialog.svelte` | Assignment management dialog |
| `src/routes/(app)/settings/team-members/_components/DeactivateDialog.svelte` | Deactivation confirmation |

### Modified files

| File | Change |
|---|---|
| `src/lib/api/types.ts` | Add `TenantRole`, user DTOs, assignment DTOs; replace `UserRole` |
| `src/lib/server/auth.ts` | Update `SessionUser`, `VALID_ROLES`, role type |
| `src/components/app-sidebar.svelte` | Gate admin nav items by role, wire Team Members link |
| `src/routes/(app)/settings/+layout.svelte` | Add Team Members nav item (role-gated) |
