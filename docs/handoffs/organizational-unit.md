# API Handoff: Organizational Units

## Business Context

Organizational units represent a tenant's corporate hierarchy for GHG (greenhouse gas) emissions reporting. Each tenant structures their company into subsidiaries, divisions, and facilities arranged in a tree. This hierarchy determines how emissions data is rolled up, consolidated, and reported under frameworks like GHG Protocol and CSRD. Equity share percentages on each node drive the equity-based consolidation approach for Scope 1/2/3 reporting.

## Endpoints

All endpoints are JWT-protected (Cognito). The `tenantId` is extracted server-side from the JWT claims -- never sent by the client. Base path: `/v1/org-units`.

---

### POST /v1/org-units

- **Purpose**: Create a new organizational unit
- **Auth**: JWT required. Role: `OWNER` or `ADMIN` only (403 otherwise)
- **Request**:

  ```json
  {
    "parentId": "uuid | null — parent org unit ID (null = root node)",
    "name": "string — 1-200 chars, required",
    "type": "string — 'subsidiary' | 'division' | 'facility'",
    "code": "string — 1-50 chars, lowercase alphanumeric with dashes (e.g. 'eu-west-hq')",
    "description": "string | null — max 1000 chars, optional",
    "equitySharePercentage": "number | null — 0-100, optional"
  }
  ```

- **Response** (201):

  ```json
  {
    "id": "uuid",
    "tenantId": "uuid",
    "parentId": "uuid | null",
    "name": "string",
    "type": "subsidiary | division | facility",
    "code": "string",
    "description": "string | null",
    "equitySharePercentage": "number | null",
    "orderIndex": 0,
    "status": "active",
    "createdAt": "2026-02-20T12:00:00.000Z",
    "updatedAt": "2026-02-20T12:00:00.000Z"
  }
  ```

- **Errors**:
  - `400` — Zod validation failure (invalid fields, bad code format)
  - `401` — Missing or invalid JWT
  - `403` — Role is not OWNER/ADMIN
  - `404` — `parentId` references a non-existent org unit
  - `409` — `code` already exists within the tenant
- **Notes**: `code` must be globally unique per tenant (case-insensitive enforced via lowercase regex). New units default to `status: "active"` and `orderIndex: 0`.

---

### GET /v1/org-units

- **Purpose**: List all organizational units for the tenant (flat list or nested tree)
- **Auth**: JWT required. Any authenticated tenant member.
- **Query Parameters**:
  - `view` — `"flat"` (default) or `"tree"`
- **Response** (200, flat view):

  ```json
  {
    "view": "flat",
    "data": [
      {
        "id": "uuid",
        "tenantId": "uuid",
        "parentId": "uuid | null",
        "name": "string",
        "type": "subsidiary | division | facility",
        "code": "string",
        "description": "string | null",
        "equitySharePercentage": "number | null",
        "orderIndex": 0,
        "status": "active | inactive",
        "createdAt": "ISO 8601",
        "updatedAt": "ISO 8601"
      }
    ],
    "total": 5
  }
  ```

- **Response** (200, tree view):

  ```json
  {
    "view": "tree",
    "data": [
      {
        "id": "uuid",
        "tenantId": "uuid",
        "parentId": null,
        "name": "Acme Corp",
        "type": "subsidiary",
        "code": "acme-corp",
        "description": null,
        "equitySharePercentage": 100,
        "orderIndex": 0,
        "status": "active",
        "createdAt": "ISO 8601",
        "updatedAt": "ISO 8601",
        "children": [
          {
            "...same shape, recursively nested...": "",
            "children": []
          }
        ]
      }
    ],
    "total": 5
  }
  ```

- **Notes**: `total` counts all nodes (including nested children in tree view). Soft-deleted units are excluded. Tree view builds full hierarchy server-side from root nodes down.

---

### GET /v1/org-units/{id}

- **Purpose**: Get a single organizational unit by ID
- **Auth**: JWT required. Any authenticated tenant member.
- **Path Parameters**: `id` — UUID of the org unit
- **Response** (200):

  ```json
  {
    "id": "uuid",
    "tenantId": "uuid",
    "parentId": "uuid | null",
    "name": "string",
    "type": "subsidiary | division | facility",
    "code": "string",
    "description": "string | null",
    "equitySharePercentage": "number | null",
    "orderIndex": 0,
    "status": "active | inactive",
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601"
  }
  ```

- **Errors**:
  - `400` — Missing `id` path parameter
  - `404` — Org unit not found or belongs to another tenant

---

### PATCH /v1/org-units/{id}

- **Purpose**: Update an org unit's name, description, equity share, or status
- **Auth**: JWT required. Role: `OWNER` or `ADMIN` only
- **Path Parameters**: `id` — UUID of the org unit
- **Request** (all fields optional, at least one should be provided):

  ```json
  {
    "name": "string — 1-200 chars",
    "description": "string | null — max 1000 chars",
    "equitySharePercentage": "number | null — 0-100",
    "status": "'active' | 'inactive'"
  }
  ```

- **Response** (200): Same shape as GET single response
- **Errors**:
  - `400` — Zod validation failure
  - `403` — Role is not OWNER/ADMIN
  - `404` — Org unit not found
- **Notes**: Sending an empty body (no updatable fields) returns current state without modification. `type` and `code` are immutable after creation.

---

### DELETE /v1/org-units/{id}

- **Purpose**: Soft-delete an organizational unit
- **Auth**: JWT required. Role: `OWNER` or `ADMIN` only
- **Path Parameters**: `id` — UUID of the org unit
- **Response** (200): Returns the deleted org unit (with updated `deletedAt` reflected in `updatedAt`)
- **Errors**:
  - `403` — Role is not OWNER/ADMIN
  - `404` — Org unit not found
  - `409` — Org unit has active (non-deleted) children. Children must be moved or deleted first.
- **Notes**: This is a soft delete. The record remains in the database but is excluded from all list/tree queries. The `409` error message explains that children must be removed first.

---

### PATCH /v1/org-units/{id}/move

- **Purpose**: Move an org unit to a new parent (or to root) and optionally reorder
- **Auth**: JWT required. Role: `OWNER` or `ADMIN` only
- **Path Parameters**: `id` — UUID of the org unit to move
- **Request**:

  ```json
  {
    "parentId": "uuid | null — target parent (null = make root node)",
    "orderIndex": "number — 0-based position among siblings (default: 0, optional)"
  }
  ```

- **Response** (200): Same shape as GET single response (with updated `parentId` and `orderIndex`)
- **Errors**:
  - `400` — Cyclic parent detected (moving a node under its own descendant)
  - `400` — Max tree depth exceeded (limit: 10 levels)
  - `403` — Role is not OWNER/ADMIN
  - `404` — Org unit or target parent not found
- **Notes**: The server validates cycles and depth atomically inside a transaction. Moving a node to root sets `parentId: null`.

---

## Data Models / DTOs

```typescript
// Org unit types
type OrgUnitType = "subsidiary" | "division" | "facility";
type OrgUnitStatus = "active" | "inactive";

// Single org unit (flat)
interface OrgUnitResponseDto {
  id: string; // UUID
  tenantId: string; // UUID
  parentId: string | null; // UUID of parent, null if root
  name: string;
  type: OrgUnitType;
  code: string; // unique per tenant, lowercase alphanumeric with dashes
  description: string | null;
  equitySharePercentage: number | null; // 0-100
  orderIndex: number; // sibling sort order (0-based)
  status: OrgUnitStatus;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// Tree node (recursive children)
interface OrgUnitTreeResponseDto extends OrgUnitResponseDto {
  children: OrgUnitTreeResponseDto[];
}

// List response (flat)
interface OrgUnitListResponseDto {
  view: "flat";
  data: OrgUnitResponseDto[];
  total: number;
}

// List response (tree)
interface OrgUnitTreeListResponseDto {
  view: "tree";
  data: OrgUnitTreeResponseDto[];
  total: number;
}
```

## Enums & Constants

| Enum          | Value        | Meaning                     | Display Label |
| ------------- | ------------ | --------------------------- | ------------- |
| OrgUnitType   | `subsidiary` | A subsidiary company        | Subsidiary    |
| OrgUnitType   | `division`   | A business division         | Division      |
| OrgUnitType   | `facility`   | A physical facility/site    | Facility      |
| OrgUnitStatus | `active`     | Currently operational       | Active        |
| OrgUnitStatus | `inactive`   | Deactivated (still visible) | Inactive      |

**Constants**:

- `MAX_TREE_DEPTH = 10` — Maximum hierarchy depth (root = level 0, deepest leaf = level 9)

## Validation Rules

| Field                   | Rule                                                     | Notes                                                                            |
| ----------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `name`                  | Required, 1-200 chars                                    | Trimmed                                                                          |
| `code`                  | Required, 1-50 chars, regex `^[a-z0-9]+(?:-[a-z0-9]+)*$` | Lowercase alphanumeric with dashes. Unique per tenant. Immutable after creation. |
| `type`                  | Required, one of: `subsidiary`, `division`, `facility`   | Immutable after creation                                                         |
| `parentId`              | UUID or `null`                                           | Must reference an existing active org unit in the same tenant                    |
| `description`           | Max 1000 chars, nullable                                 | Optional                                                                         |
| `equitySharePercentage` | Number 0-100, nullable                                   | Two decimal precision (e.g. 51.50). Used for equity consolidation                |
| `status`                | `active` or `inactive`                                   | Only updatable, not settable on create (defaults to `active`)                    |
| `orderIndex`            | Integer >= 0                                             | Only settable via move endpoint                                                  |

## Business Logic & Edge Cases

- **Tenant isolation**: All queries are scoped to the authenticated user's tenant. A user cannot see or modify org units belonging to another tenant.
- **Code uniqueness**: The `code` field is unique per tenant among non-deleted records. Soft-deleted org units release their code for reuse.
- **Immutable fields**: `type` and `code` cannot be changed after creation. Only `name`, `description`, `equitySharePercentage`, and `status` are updatable.
- **Soft delete requires no children**: Deleting an org unit with active children returns 409. The frontend should prompt the user to move or delete children first.
- **Cycle prevention**: Moving a node under one of its own descendants is rejected with 400. The server checks this atomically.
- **Depth limit**: The tree cannot exceed 10 levels deep. Creating or moving a node that would exceed this returns 400.
- **Empty update is idempotent**: PATCH with no updatable fields returns the current state (200), no error.
- **Equity share is nullable**: Not all org units need an equity percentage. When `null`, the node does not participate in equity-based consolidation.
- **Tree view returns only roots at top level**: The `data` array in tree view contains only root nodes (`parentId: null`). All other nodes are nested under `children`.
- **Order index**: Used for sibling ordering. Default is 0. Only modifiable via the move endpoint.
- **Audit trail**: All mutations (create, update, move, delete) generate audit events tracked via the transactional outbox pattern. Frontend does not interact with this directly.
- **Role enforcement**: Only `OWNER` and `ADMIN` roles can create, update, delete, or move org units. All authenticated users can read (list/get).

## Error Response Format

All errors follow a consistent shape:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": { "...optional context..." }
}
```

| HTTP Status | Code                | When                                                    |
| ----------- | ------------------- | ------------------------------------------------------- |
| 400         | `VALIDATION_FAILED` | Zod validation fails, cyclic parent, max depth exceeded |
| 401         | `UNAUTHORIZED`      | Missing/invalid JWT or tenant claims                    |
| 403         | `FORBIDDEN`         | User role is not OWNER or ADMIN                         |
| 404         | `NOT_FOUND`         | Org unit ID not found or belongs to another tenant      |
| 409         | `CONFLICT`          | Duplicate code, or delete blocked by active children    |

**Zod validation errors** include an `issues` array in `details`:

```json
{
  "error": "Validation error: Code must be lowercase alphanumeric with dashes (e.g., \"eu-west-hq\")",
  "code": "VALIDATION_FAILED",
  "details": {
    "issues": [
      {
        "code": "invalid_string",
        "validation": "regex",
        "path": ["code"],
        "message": "Code must be lowercase alphanumeric with dashes (e.g., \"eu-west-hq\")"
      }
    ]
  }
}
```

## Integration Notes

- **Recommended flow**: Fetch tree view (`GET /v1/org-units?view=tree`) to render the hierarchy UI. Use flat view for tables/search. Create/update individual nodes, then refetch the tree to reflect changes.
- **Optimistic UI**: Safe for updates (name, description, equity, status). Not recommended for move/delete operations due to server-side cycle/depth/children validation.
- **Caching**: No cache headers set. Refetch after any mutation.
- **Real-time**: No WebSocket support. Poll or refetch after mutations.
- **Tree rendering**: The tree response is pre-built server-side. Frontend does not need to assemble the tree from flat data (though it can use flat view + `parentId` if preferred).
- **Code format hint**: Display a helper/pattern mask in the code input field showing the expected format: lowercase letters, numbers, and dashes (e.g., `eu-west-hq`, `factory-01`).

## Test Scenarios

1. **Happy path — create root org unit**: POST with `parentId: null`, valid name/type/code. Expect 201 with the created org unit.
2. **Happy path — create child org unit**: POST with `parentId` set to an existing org unit's ID. Expect 201 with `parentId` populated.
3. **Happy path — list flat**: GET without `view` param. Expect 200 with `{ view: "flat", data: [...], total: N }`.
4. **Happy path — list tree**: GET with `?view=tree`. Expect 200 with nested `children` arrays.
5. **Happy path — get single**: GET `/{id}`. Expect 200 with full org unit.
6. **Happy path — update**: PATCH `/{id}` with `{ name: "New Name" }`. Expect 200 with updated name.
7. **Happy path — move to new parent**: PATCH `/{id}/move` with `{ parentId: "other-uuid" }`. Expect 200 with updated parentId.
8. **Happy path — move to root**: PATCH `/{id}/move` with `{ parentId: null }`. Expect 200 with `parentId: null`.
9. **Happy path — delete**: DELETE `/{id}` on a leaf node (no children). Expect 200.
10. **Validation error — bad code format**: POST with `code: "UPPER_CASE"`. Expect 400 with Zod issues.
11. **Duplicate code**: POST with a `code` that already exists in the tenant. Expect 409.
12. **Parent not found**: POST with `parentId` that doesn't exist. Expect 404.
13. **Delete with children**: DELETE on a node that has active children. Expect 409 with message about moving/deleting children first.
14. **Cyclic move**: Move a parent node under one of its descendants. Expect 400.
15. **Max depth exceeded**: Move/create that would push tree beyond 10 levels. Expect 400.
16. **Permission denied**: MEMBER role user attempts POST/PATCH/DELETE. Expect 403.
17. **Not found**: GET/PATCH/DELETE with non-existent UUID. Expect 404.
18. **Empty update body**: PATCH `/{id}` with `{}`. Expect 200 with current state (no-op).
19. **Set status to inactive**: PATCH `/{id}` with `{ status: "inactive" }`. Expect 200. Verify inactive nodes still appear in list/tree.
