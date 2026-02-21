# API Handoff: User Management

## Business Context

The User Management API lets authenticated users view and manage people within their tenant. Each tenant is fully isolated — users can only see/modify users in their own organization. Users have a role that determines their permissions (viewer → data_entry → data_approver → tenant_admin → super_admin). Separately, lower-privileged users can be scoped to specific **organizational units (org units)**, while tenant_admin and super_admin have tenant-wide access. The assignment endpoints manage this org-unit scoping.

---

## Endpoints

### GET /v1/users/me

- **Purpose**: Returns the current authenticated user's full profile, including their Cognito identity.
- **Auth**: Any authenticated user (JWT required)
- **Request**: No body or query params.
- **Response** (200):

  ```json
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "jane@example.com",
    "displayName": "Jane Doe",
    "role": "data_entry",
    "isActive": true,
    "cognitoSub": "abc123-cognito-sub",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-02-10T12:30:00.000Z"
  }
  ```

- **Response** (error):
  - `401` — Missing or invalid JWT
  - `404` — User record not found (account provisioned but DB row missing — rare)
- **Notes**: This is the only endpoint returning `cognitoSub`. `displayName` can be `null` if never set.

---

### GET /v1/users

- **Purpose**: Lists all active users in the authenticated user's tenant.
- **Auth**: Any authenticated user (JWT required)
- **Request** (query params, all optional):

  ```
  role=data_entry           — filter by role string
  search=jane               — substring match on email or displayName (case-insensitive)
  includeInactive=true      — include soft-deleted/inactive users (default: false)
  limit=50                  — page size, default 50, max 200
  offset=0                  — pagination offset, default 0
  ```

- **Response** (200):

  ```json
  {
    "users": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "jane@example.com",
        "displayName": "Jane Doe",
        "role": "data_entry",
        "isActive": true,
        "createdAt": "2025-01-15T10:00:00.000Z",
        "updatedAt": "2025-02-10T12:30:00.000Z"
      }
    ]
  }
  ```

- **Response** (error):
  - `401` — Missing or invalid JWT
- **Notes**:
  - By default, only active users are returned. Pass `includeInactive=true` to see deactivated users.
  - No total count is returned — use `limit`/`offset` to paginate. If the returned array has fewer items than `limit`, you've reached the last page.
  - `cognitoSub` is NOT included in list responses (only in `/me`).

---

### PATCH /v1/users/profile

- **Purpose**: Updates the current user's own display name (self-service, no admin required).
- **Auth**: Any authenticated user (JWT required)
- **Request**:

  ```json
  {
    "displayName": "Jane Smith"
  }
  ```

- **Response** (200):

  ```json
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "jane@example.com",
    "displayName": "Jane Smith",
    "role": "data_entry",
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-02-20T08:00:00.000Z"
  }
  ```

- **Response** (error):
  - `400` — Validation failure (e.g., empty string, too long)
  - `401` — Missing or invalid JWT
  - `404` — User not found (should not happen in normal flow)
- **Notes**: Only `displayName` is updatable via this endpoint. Email and role changes require separate flows.

---

### PATCH /v1/users/{userId}/role

- **Purpose**: Changes a user's tenant role. Admin-only operation.
- **Auth**: `super_admin` or `tenant_admin` role required
- **Request**:

  ```json
  {
    "role": "data_approver"
  }
  ```

- **Response** (200):

  ```json
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "jane@example.com",
    "displayName": "Jane Doe",
    "role": "data_approver",
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-02-20T09:00:00.000Z"
  }
  ```

- **Response** (error):
  - `400` — Missing or invalid `role` value, or missing `userId` in path
  - `401` — Missing or invalid JWT
  - `403` — Insufficient role (not super_admin or tenant_admin)
  - `404` — Target user not found in tenant
  - `409` — Cannot demote the last `super_admin` of the tenant
- **Notes**:
  - If the new role equals the current role, the operation succeeds immediately (no-op, 200).
  - Demoting the **last** `super_admin` to any other role is blocked with 409.
  - A user cannot change their own role via this endpoint (use the other user's `userId`). There's no explicit self-update block here, but it's an admin action.

---

### DELETE /v1/users/{userId}

- **Purpose**: Soft-deletes a user from the tenant. The user is deactivated (`isActive: false`) but not removed from the DB.
- **Auth**: `super_admin` or `tenant_admin` role required
- **Request**: No body.
- **Response** (200): Returns the deactivated user object (same shape as `UserResponseDto`).

  ```json
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "jane@example.com",
    "displayName": "Jane Doe",
    "role": "data_entry",
    "isActive": false,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-02-20T10:00:00.000Z"
  }
  ```

- **Response** (error):
  - `400` — Missing `userId` path parameter
  - `401` — Missing or invalid JWT
  - `403` — Insufficient role, OR attempting to delete yourself
  - `404` — Target user not found in tenant
  - `409` — Cannot delete the last `super_admin` of the tenant
- **Notes**:
  - **Cannot delete yourself** — the backend checks `userId === requesterId` and returns 403.
  - **Last super_admin protection** — deleting the only super_admin is blocked with 409.
  - Soft delete: the user record is retained for audit trail. They can appear if `includeInactive=true` is passed to `GET /v1/users`.

---

### GET /v1/users/{userId}/assignments

- **Purpose**: Returns all org-unit assignments for the specified user.
- **Auth**: `tenant_admin` or `super_admin` role required
- **Request**: No body.
- **Response** (200):

  ```json
  [
    {
      "id": "aaaaaaaa-0000-0000-0000-000000000001",
      "orgUnitId": "bbbbbbbb-0000-0000-0000-000000000001",
      "assignedBy": "cccccccc-0000-0000-0000-000000000001",
      "createdAt": "2025-01-20T08:00:00.000Z"
    }
  ]
  ```

- **Response** (error):
  - `400` — Missing `userId` path parameter
  - `401` — Missing or invalid JWT
  - `403` — Insufficient role
  - `404` — Target user not found in tenant
- **Notes**: Returns an empty array `[]` if the user has no assignments. Assignments are only meaningful for roles below `tenant_admin` — tenant_admin and super_admin have implicit tenant-wide access regardless of assignments.

---

### PUT /v1/users/{userId}/assignments

- **Purpose**: **Replaces** all org-unit assignments for a user with the provided set (full replace, not partial update).
- **Auth**: `tenant_admin` or `super_admin` role required
- **Request**:

  ```json
  {
    "orgUnitIds": [
      "bbbbbbbb-0000-0000-0000-000000000001",
      "bbbbbbbb-0000-0000-0000-000000000002"
    ]
  }
  ```

- **Response** (200): Returns the new complete set of assignments.

  ```json
  [
    {
      "id": "aaaaaaaa-0000-0000-0000-000000000001",
      "orgUnitId": "bbbbbbbb-0000-0000-0000-000000000001",
      "assignedBy": "cccccccc-0000-0000-0000-000000000001",
      "createdAt": "2025-02-20T11:00:00.000Z"
    }
  ]
  ```

- **Response** (error):
  - `400` — Validation failure (duplicate IDs in array, invalid UUIDs, more than 100 IDs)
  - `401` — Missing or invalid JWT
  - `403` — Insufficient role
  - `404` — Target user not found in tenant
- **Notes**:
  - Sending an empty array `{ "orgUnitIds": [] }` removes all assignments (valid operation, returns `[]`).
  - This is a **destructive replace** — all previous assignments are deleted first, then new ones inserted atomically in a transaction.
  - Duplicate `orgUnitId` values in the array are rejected with 400.
  - Max 100 org unit IDs per call.

---

### POST /v1/users/{userId}/assignments

- **Purpose**: Adds a **single** org-unit assignment to a user (non-destructive, additive).
- **Auth**: `tenant_admin` or `super_admin` role required
- **Request**:

  ```json
  {
    "orgUnitId": "bbbbbbbb-0000-0000-0000-000000000003"
  }
  ```

- **Response** (201):

  ```json
  {
    "id": "aaaaaaaa-0000-0000-0000-000000000002",
    "orgUnitId": "bbbbbbbb-0000-0000-0000-000000000003",
    "assignedBy": "cccccccc-0000-0000-0000-000000000001",
    "createdAt": "2025-02-20T12:00:00.000Z"
  }
  ```

- **Response** (error):
  - `400` — Missing or invalid `orgUnitId`
  - `401` — Missing or invalid JWT
  - `403` — Insufficient role
  - `404` — Target user not found in tenant
  - `409` — User is already assigned to this organizational unit
- **Notes**: Use this for adding one assignment at a time. If you need to set the full assignment list, use `PUT` instead.

---

### DELETE /v1/users/{userId}/assignments/{orgUnitId}

- **Purpose**: Removes a **single** org-unit assignment from a user.
- **Auth**: `tenant_admin` or `super_admin` role required
- **Request**: No body.
- **Response** (204): No body.
- **Response** (error):
  - `400` — Missing `userId` or `orgUnitId` path parameters
  - `401` — Missing or invalid JWT
  - `403` — Insufficient role
  - `404` — Target user not found in tenant, OR the specified assignment does not exist
- **Notes**: Idempotency — calling DELETE on a non-existent assignment returns 404, not a silent success.

---

## Data Models / DTOs

```typescript
// Returned by GET /me
interface UserMeResponseDto {
  id: string; // UUID
  email: string;
  displayName: string | null;
  role: TenantRole; // see Enums section
  isActive: boolean;
  cognitoSub: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// Returned by all other user endpoints (list, update, delete)
interface UserResponseDto {
  id: string;
  email: string;
  displayName: string | null;
  role: TenantRole;
  isActive: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// Returned by assignment endpoints
interface AssignmentResponseDto {
  id: string; // UUID — the assignment record ID
  orgUnitId: string; // UUID — the org unit this user is assigned to
  assignedBy: string; // UUID — userId of the admin who created the assignment
  createdAt: string; // ISO 8601
}

// Error response shape (all error HTTP codes)
interface ErrorResponse {
  error: string; // Human-readable message
  code: string; // Machine-readable error code
  details?: unknown; // Optional additional context (validation issues, conflict metadata)
}
```

---

## Enums & Constants

### TenantRole (role hierarchy, lowest → highest privilege)

| Value           | Meaning                                       | Display Label |
| --------------- | --------------------------------------------- | ------------- |
| `viewer`        | Read-only access                              | Viewer        |
| `data_entry`    | Can submit data                               | Data Entry    |
| `data_approver` | Can approve submitted data                    | Data Approver |
| `tenant_admin`  | Full tenant admin, tenant-wide access         | Admin         |
| `super_admin`   | Highest privilege, can manage tenant settings | Super Admin   |

### Role permission rules

- **Any authenticated user**: `GET /me`, `GET /users`, `PATCH /profile`
- **`tenant_admin` or `super_admin`**: `PATCH /{userId}/role`, `DELETE /{userId}`, all assignment endpoints
- **`tenant_admin` and `super_admin`** have **tenant-wide** org-unit access (not scoped to assignments)
- **`data_approver`, `data_entry`, `viewer`** are org-unit scoped — their data access is determined by their assignments

### Pagination defaults

| Parameter | Default | Max |
| --------- | ------- | --- |
| `limit`   | 50      | 200 |
| `offset`  | 0       | —   |

---

## Validation Rules

| Field              | Rule                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------- |
| `displayName`      | Required, 1–255 characters, non-empty string                                           |
| `role`             | Must be one of: `super_admin`, `tenant_admin`, `data_approver`, `data_entry`, `viewer` |
| `orgUnitId`        | Valid UUID                                                                             |
| `orgUnitIds` (PUT) | Array of valid UUIDs, no duplicates, max 100 items                                     |
| `limit`            | Integer 1–200                                                                          |
| `offset`           | Integer ≥ 0                                                                            |

---

## Business Logic & Edge Cases

- **Last super_admin protection**: Cannot demote or delete the last `super_admin` in a tenant. Returns 409 with a descriptive message.
- **Self-deletion blocked**: An admin cannot delete their own account. Returns 403 with message "Cannot delete your own account".
- **Role change is a no-op if unchanged**: `PATCH /{userId}/role` with the current role returns 200 with the unchanged user — no DB write.
- **Soft delete**: Deleted users are NOT removed from the database. They are marked `isActive: false`. They are hidden from `GET /users` by default but visible with `includeInactive=true`.
- **Tenant isolation is enforced server-side**: Every mutation validates that the target `userId` belongs to the requester's tenant. Cross-tenant access returns 404 (not 403, to avoid leaking existence).
- **Duplicate assignment detection**: `POST /{userId}/assignments` with a duplicate `orgUnitId` returns 409.
- **PUT assignments is atomic**: The full replace (delete all + insert new) happens in a single DB transaction.
- **Assignment semantics**: Assignments scoping only applies to roles below `tenant_admin`. Assigning an org unit to a `tenant_admin` has no practical effect on their access (they have full tenant access), but is technically allowed.

---

## Integration Notes

- **Auth header**: All endpoints require `Authorization: Bearer <JWT>` from Cognito.
- **Recommended flow for User Management UI**:
  1. Load current user: `GET /me` (for nav bar, avatar, role-based UI)
  2. Load user list: `GET /users` with optional filters
  3. Edit profile: `PATCH /profile` (current user only)
  4. Role change: `PATCH /{userId}/role` (admin only)
  5. View/edit assignments: `GET /{userId}/assignments` then `PUT /{userId}/assignments` for bulk replace
- **Optimistic UI**: Safe for profile updates (`PATCH /profile`). Not recommended for role changes or delete (business rule checks can fail).
- **Caching**: No cache headers set. User list can be short-lived cached (e.g., 30s) in the client if needed — changes are infrequent.
- **Real-time**: No WebSocket/SSE. Poll if live updates are needed.
- **Content-Type**: All requests with a body must set `Content-Type: application/json`.

---

## Test Scenarios

1. **Get current user** (`GET /me`): Returns own profile with `cognitoSub` included.
2. **List active users** (`GET /users`): Returns only `isActive: true` users by default.
3. **Search users** (`GET /users?search=jane`): Returns users with "jane" in email or display name.
4. **Filter by role** (`GET /users?role=data_entry`): Returns only users with that role.
5. **Pagination** (`GET /users?limit=10&offset=10`): Second page of results.
6. **Update own display name** (`PATCH /profile`): Returns updated user; validates 1–255 chars.
7. **Update profile — empty name** (`PATCH /profile { "displayName": "" }`): Returns 400.
8. **Admin role change** (`PATCH /{userId}/role { "role": "data_approver" }`): Returns updated user with new role.
9. **Role change — non-admin** (`PATCH /{userId}/role` by a `data_entry` user): Returns 403.
10. **Role change — invalid role** (`{ "role": "god_mode" }`): Returns 400.
11. **Demote last super_admin**: Returns 409 with conflict message.
12. **Delete user** (`DELETE /{userId}`): Returns deactivated user, user hidden from default list.
13. **Delete self**: Returns 403 "Cannot delete your own account".
14. **Delete last super_admin**: Returns 409.
15. **Get assignments** (`GET /{userId}/assignments`): Returns array (empty if none).
16. **Set assignments** (`PUT /{userId}/assignments { "orgUnitIds": [...] }`): Full replace, returns new set.
17. **Set assignments — empty** (`PUT ... { "orgUnitIds": [] }`): Clears all assignments, returns `[]`.
18. **Set assignments — duplicate IDs**: Returns 400.
19. **Add assignment** (`POST /{userId}/assignments { "orgUnitId": "..." }`): Returns 201 with new assignment.
20. **Add duplicate assignment**: Returns 409.
21. **Remove assignment** (`DELETE /{userId}/assignments/{orgUnitId}`): Returns 204 no body.
22. **Remove non-existent assignment**: Returns 404.
23. **Cross-tenant access attempt**: Returns 404 (not 403).
