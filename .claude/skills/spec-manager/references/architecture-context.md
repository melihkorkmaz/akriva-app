# Architecture Context for Spec Generation

Reference material for grounding specs in akriva-app's actual architecture.
Consult this when generating specs that touch specific routes or cross-cutting concerns.

## Core Principle

**This frontend contains NO business logic.** It is a lightweight presentational layer only.
All validation, authorization, data processing, and business rules live in the backend API.
The frontend's sole responsibilities are:

- Rendering UI from data received via API
- Collecting user input and forwarding it to the backend
- Displaying errors/feedback returned by the backend
- Client-side UI state (loading spinners, toggling visibility, form field state)

## Route Inventory

### (auth) — Guest-Only Pages

| Route | Purpose |
|-------|---------|
| `/signin` | Email/password login form |
| `/signup` | New tenant registration |
| `/signup/invited` | Invited user registration (with invite token) |
| `/verify-email` | Email verification instructions |

### (app) — Protected Pages

#### Dashboard
- **Route**: `/dashboard`
- **Purpose**: Welcome/onboarding landing page
- **Auth**: Any authenticated user

#### Campaigns
- **Routes**: `/campaigns`, `/campaigns/new`, `/campaigns/[id]`, `/campaigns/[id]/edit`
- **Purpose**: Campaign CRUD (list, create, detail, edit)
- **Auth**: `tenant_admin` for create/edit
- **Key patterns**: CampaignForm shared between create/edit, OrgUnitSelector tree, TaskOverviewTable
- **API**: `/campaign/campaigns/*`

#### Tasks
- **Routes**: `/tasks`, `/tasks/[taskId]`
- **Purpose**: Task list and detail with approval workflow
- **Auth**: Role-based (data_entry, data_approver, tenant_admin)
- **Key patterns**: TaskCard, ActivityDataSection, ApprovalSection, EvidenceSection, RejectDialog
- **API**: `/campaign/tasks/*`

#### Emission Entries
- **Routes**: `/scope-1/emission-entries`
- **Purpose**: Data table of emission entries with new entry sheet
- **Key patterns**: TanStack Table (data-table.svelte + columns.ts), NewEntrySheet side panel
- **API**: `/campaign/emission-entries/*`

#### Settings
- **Routes**: `/settings/profile`, `/settings/company`, `/settings/application-settings`, `/settings/team-members`, `/settings/organizational-tree`, `/settings/indicators`
- **Purpose**: App configuration pages
- **Layout**: Shared settings layout with sidebar navigation
- **Auth**: `tenant_admin` for most settings

#### Settings — Profile
- **Route**: `/settings/profile`
- **Purpose**: User profile editing
- **API**: `/auth/me`, `/user/users/me`

#### Settings — Company
- **Route**: `/settings/company`
- **Purpose**: Tenant company info (name, sector, country, boundary rules)
- **Key patterns**: Multi-section form (CompanyIdentificationSection, SectorSection, LocalizationSection, BoundaryRulesSection, TemporalLogicSection)
- **API**: `/tenant/tenant`, `/tenant/settings`

#### Settings — Application Settings
- **Route**: `/settings/application-settings`
- **Purpose**: System-wide preferences (units, scientific authority)
- **Key patterns**: Section-based form (LocalizationSection, UnitsSection, ScientificAuthoritySection)
- **API**: `/tenant/settings`

#### Settings — Team Members
- **Route**: `/settings/team-members`
- **Purpose**: User management, invites, role assignment
- **Key patterns**: TanStack Table, InviteDialog, ChangeRoleDialog, DeactivateDialog, ManageAssignmentsDialog
- **API**: `/user/users/*`, `/user/invites/*`

#### Settings — Organizational Tree
- **Route**: `/settings/organizational-tree`
- **Purpose**: Hierarchical org unit management with tree view
- **Key patterns**: Recursive OrgTree component, OrgNodeForm, EmissionSourceDialog, move action
- **API**: `/org-unit/org-units/*`

#### Settings — Indicators
- **Route**: `/settings/indicators`
- **Purpose**: Emission indicator management
- **Key patterns**: IndicatorDialog for create/edit
- **API**: `/campaign/indicators/*`

## Component Library

### shadcn-svelte (from `$lib/components/ui/`)

Compound (namespace import): Card, Select, Dialog, DropdownMenu, Tooltip, Popover, Breadcrumb, Sidebar, Avatar, RadioGroup, Form, Field, Tabs, Sheet, AlertDialog, Collapsible, Table

Single (named import): Button, Input, Textarea, Label, Checkbox, Switch, Badge, Alert, AlertDescription, Separator, Skeleton, Progress

### Custom Components (from `$components/`)

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `AppSidebar` | Main navigation sidebar | `user` |
| `NavUser` | User dropdown in sidebar | `user` |
| `AkrivaLogo` | Brand logo | — |
| `CountrySelect` | Country picker dropdown | `value` ($bindable), `placeholder`, `disabled` |
| `DatePicker` | Flatpickr date picker | `value`, `mode`, `minDate`, `maxDate` |
| `MonthSelect` | Month/year picker | `value`, `disabled` |
| `SectorSelect` | Sector dropdown | `value` ($bindable), `disabled` |
| `SubSectorSelect` | Sub-sector dropdown (cascading) | `value` ($bindable), `sector`, `disabled` |
| `TextDivider` | "OR" divider between sections | `text` |
| `CopyButton` | Copy-to-clipboard | `value` |

## API Layer

### Client (`src/lib/api/client.ts`)

```typescript
apiFetch<T>(endpoint, options)       // Unauthenticated
apiFetchAuth<T>(endpoint, token, options)  // Bearer token injection
class ApiError { status, body }      // Custom error with status + parsed body
```

### Domain API Modules (`src/lib/api/`)

| Module | Endpoints | Key Functions |
|--------|-----------|---------------|
| `auth.ts` | `/auth/*` | `signup`, `signin`, `refreshTokens`, `changePassword` |
| `tenant.ts` | `/tenant/*` | `getTenant`, `updateTenant`, `getSettings`, `updateSettings` |
| `users.ts` | `/user/users/*` | `fetchUsers`, `getMe`, `updateUser`, `deactivateUser` |
| `invites.ts` | `/user/invites/*` | `createInvite`, `listInvites`, `revokeInvite` |
| `org-units.ts` | `/org-unit/*` | `getOrgUnitsTree`, `createOrgUnit`, `updateOrgUnit`, `moveOrgUnit` |
| `campaigns.ts` | `/campaign/campaigns/*` | `listCampaigns`, `createCampaign`, `getCampaign`, `updateCampaign` |
| `tasks.ts` | `/campaign/tasks/*` | `listTasks`, `getTask`, `approveTask`, `rejectTask` |
| `indicators.ts` | `/campaign/indicators/*` | `listIndicators`, `createIndicator`, `updateIndicator` |
| `emission-entries.ts` | `/campaign/emission-entries/*` | `listEntries`, `createEntry` |
| `emission-sources.ts` | `/campaign/emission-sources/*` | `listSources`, `createSource` |
| `emission-factors.ts` | `/emission-factor/*` | `searchFactors` |
| `evidence.ts` | `/campaign/evidence/*` | `uploadEvidence`, `getEvidenceUrl` |

### Types (`src/lib/api/types.ts`)

All frontend DTOs live here. Key type categories:
- Auth: `SignupRequest`, `SigninResponse`, `AuthTokens`, `JwtCustomClaims`
- Tenant: `TenantResponseDto`, `TenantSettingsResponseDto`, `UpdateTenantSettingsRequest`
- Users: `UserMeResponseDto`, `UserResponseDto`, `InviteResponseDto`
- OrgUnits: `OrgUnitResponseDto`, `OrgUnitTreeResponseDto`
- Campaigns: `CampaignResponseDto`, `CampaignTask`, `CampaignStatus`
- Emission: `EmissionSourceResponseDto`, `EmissionEntryResponseDto`
- Indicators: `IndicatorResponseDto`
- Label maps: `CAMPAIGN_STATUS_LABELS`, `CALCULATION_METHOD_LABELS`, etc.

## Form Handling (Superforms + formsnap + Zod 4)

### Server-Side Setup (`+page.server.ts`)

```typescript
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

export const load = async ({ locals }) => {
  const form = await superValidate(zod4(schema));
  return { form };
};

export const actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(request, zod4(schema));
    if (!form.valid) return message(form, 'Check input.', { status: 400 });
    try {
      await apiFetchAuth('/endpoint', session.idToken, { method: 'POST', body: JSON.stringify(form.data) });
      redirect(303, '/success-path');
    } catch (err) {
      if (err instanceof ApiError) {
        return message(form, err.body.error || 'Error.', { status: err.status });
      }
      throw err;
    }
  }
};
```

### Client-Side Setup (`+page.svelte` or Form component)

```svelte
<script>
  const superform = superForm(data.form, { validators: zod4Client(schema) });
  const { form, errors, enhance, message, submitting } = superform;
</script>

<form method="POST" use:enhance>
  <Form.Field form={superform} name="fieldName">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Label</Form.Label>
        <Input {...props} bind:value={$form.fieldName} />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>
</form>
```

**CRITICAL**: Pass `superform` (full object) to `Form.Field`, NOT `form` (destructured store).

### Zod Schemas (`src/lib/schemas/`)

```typescript
import { z } from 'zod/v4';

export const mySchema = z.object({
  name: z.string().min(1, 'Required').max(200),
  email: z.email('Invalid email'),
  // ...
}).superRefine((data, ctx) => {
  // Cross-field validation
});
```

## Authentication & Authorization

### Session (`src/lib/server/auth.ts`)

```typescript
interface Session {
  idToken: string;           // JWT for backend API calls
  user: {
    id: string;              // UUID
    email: string;
    tenantId: string;        // UUID
    role: TenantRole;        // 'viewer' | 'data_entry' | 'data_approver' | 'tenant_admin' | 'super_admin'
    givenName: string;
    familyName: string;
  };
}
```

### Guards

```typescript
requireAdmin(locals)    // Throws 403 if not tenant_admin or super_admin
locals.session!         // Available after (app) layout guard
```

## Design Tokens

All tokens defined in `src/styles/app.css` as CSS variables, accessed via Tailwind utilities:

- **Surfaces**: `bg-background`, `bg-card`, `bg-popover`, `bg-sidebar`
- **Text**: `text-foreground`, `text-muted-foreground`, `text-primary`, `text-destructive`
- **Borders**: `border-border`, `border-input`
- **Focus**: `ring-ring`
- **Shadows**: `shadow-2xs` through `shadow-2xl`
- **Radius**: Base `--radius: 0.125rem`, cards use `rounded-xl`
- **Spacing**: Standard Tailwind 4px scale
- **Typography**: `font-sans` (Inter), sizes: `text-2xl` (page), `text-xl` (section), `text-lg` (card), `text-sm` (body), `text-xs` (helper)

## File Conventions

| Purpose | Location |
|---------|----------|
| New pages | `src/routes/(app)/<route>/+page.svelte` + `+page.server.ts` |
| Auth pages | `src/routes/(auth)/<route>/+page.svelte` |
| Page-local components | `src/routes/(app)/<route>/_components/` |
| Reusable app components | `src/components/` |
| UI primitives | `src/lib/components/ui/<name>/` |
| Zod schemas | `src/lib/schemas/` |
| API client functions | `src/lib/api/<domain>.ts` |
| API types | `src/lib/api/types.ts` |
| Global styles | `src/styles/app.css` |

## Cross-Cutting Patterns

### Layout
- `(auth)` group: centered card layout, guest-only
- `(app)` group: sidebar + header + content area, requires session
- Settings: nested layout with sidebar nav

### Error Handling
- API errors caught as `ApiError`, mapped to form messages via `message(form, msg, { status })`
- 400 = validation, 403 = forbidden, 409 = conflict
- Unexpected errors re-thrown for SvelteKit error page

### Loading Data
- Parallel `Promise.all()` in `load` functions
- Session token from `locals.session!.idToken`

### Icons
- Lucide from `@lucide/svelte/icons/{name}` (tree-shakeable)
- Standard sizes: `size-4` (default), `size-3.5` (small), `size-6` (large)

### Toasts
- `svelte-sonner` via `toast.success()` / `toast.error()` in Superforms `onUpdated` / `onError` callbacks
