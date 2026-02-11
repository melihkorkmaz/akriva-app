# Plan Template

Use this template when generating implementation plans in Phase 4. Fill every section. If a section is not applicable, write "N/A — [reason]" instead of omitting it.

---

```markdown
# Plan: [Feature Name]

**Date**: [YYYY-MM-DD]
**Complexity**: [Simple | Medium | Complex]
**Affected Areas**: [routes, components, API layer, schemas, styles, ...]
**Estimated Tasks**: [N tasks]

---

## 1. Goal

[2-3 sentences: What are we building? What problem does it solve? What's the expected outcome?]

## 2. Background & Context

### Prior Decisions
[Relevant decisions from Second Brain queries. Cite notebook sources.]

### Current State
[What exists today? What's the starting point?]

### Constraints
[Technical constraints, business rules, timeline, or scope limitations.]

## 3. Architecture Decisions

For each significant decision:

### Decision: [Short title]

| Option | Pros | Cons |
|--------|------|------|
| **Option A** (chosen) | ... | ... |
| Option B | ... | ... |

**Chosen**: Option A
**Reasoning**: [Why this option was selected]

## 4. Implementation Steps

### Step 1: [Title]

- **Description**: [What to do and why]
- **Files**:
  - Create: `src/routes/(app)/.../+page.svelte`
  - Modify: `src/lib/api/types.ts`
- **Dependencies**: None | Step N
- **Pattern Reference**: Follow `src/routes/(app)/settings/company/+page.svelte`
- **Acceptance Criteria**:
  - [ ] [Specific, verifiable criterion]
  - [ ] [Another criterion]

### Step 2: [Title]

[Repeat structure for each step]

## 5. Files Summary

### New Files
| File Path | Purpose |
|-----------|---------|
| `src/routes/(app)/.../+page.svelte` | [Brief purpose] |
| `src/routes/(app)/.../+page.server.ts` | [Brief purpose] |
| `src/lib/schemas/...` | [Brief purpose] |

### Modified Files
| File Path | Changes |
|-----------|---------|
| `src/lib/api/types.ts` | [What changes] |
| `src/lib/api/client.ts` | [What changes] |

### Reference Files (patterns to follow)
| File Path | Pattern |
|-----------|---------|
| `src/routes/(app)/settings/company/+page.svelte` | [What pattern to follow] |

## 6. API Integration

### Backend Endpoints Consumed
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/...` | GET/POST/PUT | [What data is fetched/sent] |

### Request/Response Shapes
[Document key request bodies and response shapes from the backend API. Reference `src/lib/api/types.ts` interfaces.]

### Error Handling
[How API errors are handled — toast notifications, inline errors, redirect on 401/403, etc.]

### If N/A
N/A — [This feature does not require new API integration]

## 7. Routing & Navigation

### New Routes
| Route Path | Layout Group | Purpose |
|------------|-------------|---------|
| `/(app)/...` | `(app)` | [Page purpose] |

### Layout Changes
[Any changes to `+layout.svelte` files, navigation menus, breadcrumbs, etc.]

### Route Guards
[Any new auth guards or access control requirements for the routes.]

### If N/A
N/A — [This feature does not require routing changes]

## 8. Testing Strategy

### Unit Tests
| Test File | What It Covers |
|-----------|---------------|
| `src/lib/.../*.test.ts` | [Test scope] |

### Component/Integration Tests
[Component testing approach — Vitest with @testing-library/svelte, Playwright e2e, etc.]

### Coverage Goals
[Specific coverage targets for this feature]

## 9. Risks & Open Questions

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk description] | [High/Medium/Low] | [How to mitigate] |

### Open Questions
- [ ] [Question that needs answering before or during implementation]

## 10. Task Breakdown

Ordered checklist with complexity estimates. Tasks are ordered by dependency.

| # | Task | Complexity | Depends On | Status |
|---|------|-----------|------------|--------|
| 1 | [Task description] | S/M/L | — | [ ] |
| 2 | [Task description] | S/M/L | #1 | [ ] |
| 3 | [Task description] | S/M/L | #1 | [ ] |
| 4 | [Task description] | S/M/L | #2, #3 | [ ] |

**Legend**: S = Small (< 30 min), M = Medium (30 min - 2 hr), L = Large (2+ hr)

## 11. Rollback Strategy

[How to safely roll back this change if something goes wrong in production.]

- **UI changes**: [Can the route/component be reverted without side effects?]
- **API compatibility**: [Does this depend on new backend endpoints? Are they backward compatible?]
- **Feature flags**: [If applicable, how to disable the feature without deployment]
```
