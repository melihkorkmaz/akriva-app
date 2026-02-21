# Design: Invite System, Invite Signup & Profile Self-Service

**Date**: 2026-02-21
**Status**: Approved

## Goal

Implement the three remaining features from the User Management & Invite API handoff:

1. **Invite management** — Admin UI for creating, listing, and revoking invitations (on the team members page)
2. **Invite signup flow** — Invitee-facing signup experience with token validation and pre-filled form
3. **Profile self-service** — Simple page for any user to edit their display name

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Invite UI location | Tabs on team members page ("Members" / "Invitations") | Keeps user management unified |
| Invite creation UX | Dialog triggered by "Invite Member" button | Consistent with existing dialogs (change role, deactivate) |
| Data loading strategy | Single load, both datasets (users + invites) | Instant tab switching, datasets are small (tenant-scoped) |
| Invite signup route | Separate `/signup/invited` route | Clean separation from organic signup |
| Email failure (502) handling | Warning + suggest revoke & retry | Token not returned in 502, can't construct invite link |
| Profile access point | User menu dropdown in app sidebar | Natural location, accessible to all roles |

## Feature 1: Invite Management

### Tab navigation

The team members page header gains a tab bar: "Members (count)" / "Invitations (count)". URL tracks active tab via `?tab=members` (default) or `?tab=invitations`. The "Invite Member" button sits in the page header, visible regardless of active tab.

### Invitations tab

**Filters**: Status dropdown (All / Pending / Accepted / Expired / Revoked), email search input.

**Table columns**: Email, Role (badge), Status (color-coded badge), Invited date, Expires date, Actions.

**Status badges**: Pending (yellow), Accepted (green), Expired (gray), Revoked (red).

**Row actions**: Revoke (only for `pending` invites).

**Pagination**: Same offset-based pattern as members tab, 20 per page.

**Empty state**: "No invitations yet. Click 'Invite Member' to add team members."

### Create invite dialog

Fields:
- **Email** — text input, required, email validation
- **Role** — select dropdown, 5 roles filtered by role cap (admin can't invite super_admin)
- **Expiry** — select: 1 day, 3 days, 7 days (default), 14 days, 30 days

Error handling:
- 201 success: Close dialog, success toast, refresh invites
- 403 role cap: "Cannot invite a user with a role equal to or above your own"
- 409 duplicate: "A pending invitation already exists for this email"
- 422 existing user: "This user already exists in your organization"
- 502 email failure: Close dialog, show warning alert: "Invite created but the email could not be sent. You can revoke and re-create the invite, or ask the recipient to check their spam folder."

### Revoke invite dialog

Confirmation: "Are you sure you want to revoke the invitation for {email}? They will no longer be able to use this invite link to join."

Error handling:
- 409 (not pending): Show error in dialog

### Data loading

```typescript
// In +page.server.ts load function
const [usersResponse, invitesResponse] = await Promise.all([
  fetchUsers(accessToken, params),
  fetchInvites(accessToken, { status: statusFilter, limit: 200 })
]);
```

### Form actions

- `createInvite` — POST /v1/users/invites
- `revokeInvite` — DELETE /v1/users/invites/{inviteId}

## Feature 2: Invite Signup Flow

### Flow

1. Invitee clicks email link: `/signup?token={uuid}`
2. Main `/signup/+page.server.ts` detects `?token=` param
3. Server calls `GET /v1/auth/invites/{token}/validate`
4. If `valid=true`: redirect to `/signup/invited?token={token}&email={email}&tenantName={name}&role={role}`
5. If `valid=false`: redirect to `/signup/invited?error={reason}`

### Valid invite — signup form

- Banner: "You've been invited to join {tenantName}. You'll be joining as {role}."
- Email pre-filled and read-only
- Fields: First name, Last name, Password (no Company name — joining existing tenant)
- Submit calls existing signup endpoint with `invitationToken` in request body
- On success: redirect to `/dashboard`

### Invalid invite — error states

| Reason | Message |
|--------|---------|
| `not_found` | "This invite link is invalid." |
| `expired` | "This invite has expired. Contact your administrator for a new invitation." |
| `accepted` | "This invite has already been used. If you already have an account, sign in below." |
| `revoked` | "This invite has been revoked. Contact your administrator for a new invitation." |

Links: "Sign in instead" and "Back to signup".

### Server implementation

`/signup/invited/+page.server.ts`:
- Load: Parse query params, return invite data or error state
- Action: Call signup API with `{ email, password, givenName, familyName, invitationToken }`

## Feature 3: Profile Self-Service

### Access

"Profile" link added to the user footer dropdown in `app-sidebar.svelte`. Navigates to `/settings/profile`.

### Page

Accessible to all authenticated users (no admin guard). Card with:
- **Email** — displayed as read-only text
- **Display Name** — text input, 1-255 chars, Superforms + Zod validation
- **Role** — displayed as read-only badge
- **Save Changes** button

### Data loading

`+page.server.ts` calls `GET /v1/users/me`. Returns `UserMeResponseDto`.

### Zod schema

```typescript
const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(255)
});
```

### Behavior

- Save: `PATCH /v1/users/profile` with `{ displayName }`
- Success: success toast
- Error: inline validation errors

## Files to Create

```
src/lib/api/invites.ts                                    — invite API client functions
src/lib/schemas/invite.ts                                 — Zod schemas for invite forms
src/lib/schemas/profile.ts                                — Zod schema for profile form
src/routes/(app)/settings/team-members/_components/InvitesTab.svelte
src/routes/(app)/settings/team-members/_components/InviteDialog.svelte
src/routes/(app)/settings/team-members/_components/RevokeInviteDialog.svelte
src/routes/(auth)/signup/invited/+page.server.ts
src/routes/(auth)/signup/invited/+page.svelte
src/routes/(app)/settings/profile/+page.server.ts
src/routes/(app)/settings/profile/+page.svelte
```

## Files to Modify

```
src/lib/api/types.ts                                      — add invite DTOs
src/routes/(app)/settings/team-members/+page.server.ts    — add invite load + actions
src/routes/(app)/settings/team-members/+page.svelte       — add tab navigation
src/components/app-sidebar.svelte                         — add Profile to user dropdown
src/routes/(auth)/signup/+page.server.ts                  — handle ?token= redirect
```

## Dependencies

- All user management endpoints already exist and are tested (backend complete)
- Team members page is production-ready (base for invite management)
- Existing signup flow works (base for invite signup)
- No new npm dependencies needed
