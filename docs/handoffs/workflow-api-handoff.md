# API Handoff: Workflow Templates

## Business Context

Workflow templates define reusable multi-step approval pipelines for GHG data collection campaigns. A tenant creates a template with ordered steps (submit, review, approve) and transitions between them. Only one template can be "active" at a time per tenant — activating a campaign requires referencing an active template. Templates follow a `draft -> active -> archived` lifecycle.

Key domain terms:

- **Step**: A discrete stage in the approval pipeline (e.g., "Submit Data", "Manager Review")
- **Transition**: A directed edge between steps, triggered by completion, rejection, or timeout
- **Gate type**: Determines whether a step requires all assignees (`parallel_all`), any assignee (`parallel_any`), or runs sequentially (`serial`)
- **Step order**: Integer position used in requests; resolved to UUIDs in responses

## Endpoints

### POST /v1/workflow-templates

- **Purpose**: Create a new workflow template (always starts as `draft`, version 1)
- **Auth**: `tenant_admin` or higher
- **Request**:

  ```json
  {
    "name": "string — 1-200 chars, required, must be unique per tenant",
    "description": "string | null — max 1000 chars, optional",
    "steps": [
      {
        "name": "string — 1-200 chars, required",
        "type": "'submit' | 'review' | 'approve' — required",
        "assignedRole": "'super_admin' | 'tenant_admin' | 'data_approver' | 'data_entry' | 'viewer' — required",
        "gateType": "'serial' | 'parallel_all' | 'parallel_any' — optional, defaults to 'serial'",
        "stepOrder": "integer >= 1 — required, must be unique across steps"
      }
    ],
    "transitions": [
      {
        "fromStepOrder": "integer >= 1 — must match an existing step's stepOrder",
        "toStepOrder": "integer >= 1 — must match an existing step's stepOrder",
        "trigger": "'complete' | 'reject' | 'timeout' — required",
        "rejectionTargetStepOrder": "integer >= 1 | null — optional, must match existing step"
      }
    ]
  }
  ```

- **Response** (201):

  ```json
  {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "string",
    "description": "string | null",
    "version": 1,
    "status": "draft",
    "steps": [
      {
        "id": "uuid",
        "name": "string",
        "type": "submit | review | approve",
        "assignedRole": "string",
        "gateType": "serial | parallel_all | parallel_any",
        "stepOrder": 1
      }
    ],
    "transitions": [
      {
        "id": "uuid",
        "fromStepId": "uuid",
        "toStepId": "uuid",
        "trigger": "complete | reject | timeout",
        "rejectionTargetStepId": "uuid | null"
      }
    ],
    "createdBy": "uuid",
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601"
  }
  ```

- **Response** (error):
  - `400` — Zod validation failure or domain validation (duplicate step orders, invalid role, cycle in forward transitions)
  - `401` — missing `tenantId` in JWT
  - `403` — role below `tenant_admin`
  - `409` — duplicate template name within tenant
- **Notes**:
  - `tenantId` is injected from JWT, not accepted in body
  - Steps array requires at least 1, max 100 entries
  - Transitions default to `[]` if omitted
  - Forward (`complete`) transitions must not form a cycle (DFS cycle detection)
  - Request uses `stepOrder` integers; response uses step UUIDs (`fromStepId`, `toStepId`)

### GET /v1/workflow-templates

- **Purpose**: List all templates for the tenant
- **Auth**: Any authenticated user
- **Request**: No body, no query params. Tenant inferred from JWT.
- **Response** (200):

  ```json
  {
    "data": ["WorkflowTemplateResponseDto[]"],
    "total": 5
  }
  ```

- **Notes**: Ordered by `createdAt` ascending. Soft-deleted templates excluded. Steps within each template ordered by `stepOrder`.

### GET /v1/workflow-templates/{id}

- **Purpose**: Get a single template by ID
- **Auth**: Any authenticated user
- **Request**: No body. Path param `id` (UUID) required.
- **Response** (200): `WorkflowTemplateResponseDto`
- **Response** (error):
  - `400` — missing `id`
  - `404` — not found, deleted, or wrong tenant

### PATCH /v1/workflow-templates/{id}

- **Purpose**: Update template metadata, steps, transitions, or status
- **Auth**: `tenant_admin` or higher
- **Request**:

  ```json
  {
    "name": "string — 1-200 chars, optional",
    "description": "string | null — max 1000 chars, optional",
    "status": "'draft' | 'active' | 'archived' — optional, triggers status transition",
    "steps": "array — optional, REPLACES all existing steps if provided",
    "transitions": "array — optional, REPLACES all existing transitions (requires steps)"
  }
  ```

- **Response** (200): `WorkflowTemplateResponseDto`
- **Response** (error):
  - `400` — `transitions` supplied without `steps`; Zod/domain validation failures
  - `403` — insufficient role
  - `404` — not found
  - `409` — steps provided on non-draft template; activating when another is active; name collision
- **Notes**:
  - **Transitions require steps**: sending `transitions` without `steps` returns 400
  - **Steps are full-replace**: existing steps and transitions are deleted, new ones inserted
  - **Steps only editable in draft**: providing `steps` on active/archived returns 409
  - **One active per tenant**: setting `status: 'active'` fails if another template is already active
  - **Version increments** on status change or step replacement, NOT on name/description-only changes
  - **Outbox events**: `workflow_template.updated`, `workflow_template.activated`, `workflow_template.archived`

### DELETE /v1/workflow-templates/{id}

- **Purpose**: Soft-delete a template (draft only)
- **Auth**: `tenant_admin` or higher
- **Request**: No body.
- **Response** (200): `WorkflowTemplateResponseDto` (final state)
- **Response** (error):
  - `403` — insufficient role
  - `404` — not found
  - `409` — template is `active` or `archived`
- **Notes**: Only draft templates can be deleted. Steps/transitions rows remain in DB but template is hidden from list/get.

## Data Models / DTOs

```typescript
interface WorkflowTemplateResponseDto {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  version: number;
  status: "draft" | "active" | "archived";
  steps: WorkflowStepResponseDto[];
  transitions: WorkflowTransitionResponseDto[];
  createdBy: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

interface WorkflowStepResponseDto {
  id: string;
  name: string;
  type: "submit" | "review" | "approve";
  assignedRole: TenantRoleValue;
  gateType: "serial" | "parallel_all" | "parallel_any";
  stepOrder: number;
}

interface WorkflowTransitionResponseDto {
  id: string;
  fromStepId: string;
  toStepId: string;
  trigger: "complete" | "reject" | "timeout";
  rejectionTargetStepId: string | null;
}
```

## Enums & Constants

| Enum                        | Values                                                                 | Notes                       |
| --------------------------- | ---------------------------------------------------------------------- | --------------------------- |
| `WorkflowTemplateStatus`    | `draft`, `active`, `archived`                                          | Lifecycle states            |
| `WorkflowStepType`          | `submit`, `review`, `approve`                                          | Step purpose                |
| `WorkflowGateType`          | `serial`, `parallel_all`, `parallel_any`                               | Parallelism model           |
| `WorkflowTransitionTrigger` | `complete`, `reject`, `timeout`                                        | Edge triggers               |
| `TenantRole`                | `super_admin`, `tenant_admin`, `data_approver`, `data_entry`, `viewer` | Valid `assignedRole` values |

## Validation Rules

| Field                         | Rule                                   |
| ----------------------------- | -------------------------------------- |
| `name`                        | 1-200 chars, unique per tenant         |
| `description`                 | max 1000 chars, nullable               |
| `steps`                       | 1-100 items                            |
| `steps[].name`                | 1-200 chars                            |
| `steps[].stepOrder`           | integer >= 1, unique across all steps  |
| `steps[].assignedRole`        | must be a valid `TenantRole` value     |
| `transitions[].fromStepOrder` | must reference existing step           |
| `transitions[].toStepOrder`   | must reference existing step           |
| Forward transitions           | must not form a cycle (DFS validation) |

## Business Logic & Edge Cases

- **Draft is the only editable state.** Steps/transitions frozen once active or archived. UI should disable step editing on non-draft templates.
- **Only one active template per tenant.** UI should warn before activating. Error message: "Archive the current active template first."
- **Steps and transitions are atomic.** Update sends the complete desired set — no partial step updates.
- **Transitions require steps in the same request.** Even if steps haven't changed, include them when updating transitions.
- **Request uses `stepOrder` (integers), response uses step UUIDs.** Frontend must map between these representations.
- **Version tracks structural changes.** Increments on status change or step replacement; not on metadata-only edits.
- **Cycle detection on forward transitions.** Template must have at least one terminal step (no outgoing `complete` transition).

## Integration Notes

- **Recommended flow**: List templates -> Create/edit in draft -> Activate when ready -> Archive when retired
- **Optimistic UI**: Safe for metadata updates (name/description). Not safe for status transitions (conflict possible).
- **Caching**: No cache headers. Re-fetch list after create/update/delete.
- **No pagination on list**: All templates returned in a single response.

## Test Scenarios

1. **Happy path — create**: POST with valid steps and transitions, verify 201 with `status: 'draft'`, `version: 1`
2. **Happy path — lifecycle**: Create draft -> Update steps -> Activate -> Archive
3. **Validation error — duplicate step orders**: POST with two steps having `stepOrder: 1`, expect 400
4. **Validation error — cycle**: Create transitions A->B->C->A with trigger `complete`, expect 400
5. **Conflict — duplicate name**: Create two templates with same name, expect 409 on second
6. **Conflict — activate with existing active**: Activate when another template is active, expect 409
7. **Conflict — edit active template steps**: PATCH steps on an active template, expect 409
8. **Conflict — delete non-draft**: DELETE on active/archived template, expect 409
9. **Permission denied**: `data_entry` user attempts POST/PATCH/DELETE, expect 403
10. **Transitions without steps**: PATCH with only transitions array, expect 400
