---
name: Spec Manager
description: >
  This skill should be used when the user asks to "create a spec", "write a spec",
  "generate a spec", "draft a spec", "new feature spec", "tech debt spec", "refactoring spec",
  "create a design doc", "write a design document", "generate design", "review design",
  "review specs", "list specs", "update spec status", "show spec", "archive spec",
  or mentions specification creation, design document generation, feature planning,
  technical debt tracking, refactoring plans, or feature update proposals
  for the akriva-app frontend project.
---

# Spec Manager

Generate, save, review, and manage specification and design documents for the akriva-app
frontend project. Every change — feature, tech-debt, refactor, or update — follows a full
lifecycle from spec through design to implementation readiness.

## Full Lifecycle

```
1. SPEC         Clarify requirements → generate spec → save → approve
                    ↓
2. DESIGN       Explore codebase → generate design doc → save
                    ↓
3. REVIEW       Run design-reviewer agent → address findings → approve
                    ↓
4. IMPLEMENT    Design is the implementation blueprint
```

Nothing reaches implementation without an approved spec AND an approved design document.

## Spec Types

| Type | Directory | Purpose |
|------|-----------|---------|
| `feature` | `.claude/specs/feature/` | New pages, components, or UI functionality end-to-end |
| `tech-debt` | `.claude/specs/tech-debt/` | Technical debt identification and resolution |
| `refactor` | `.claude/specs/refactor/` | Structural improvements without behavior change |
| `update` | `.claude/specs/update/` | Enhancements to existing pages or components |

## Directory Structure

Each spec lives in its own directory with its design documents:

```
.claude/specs/<type>/<friendly-name>/
├── spec.md           # Requirements specification
├── design.md         # Technical design document (implementation blueprint)
├── review.md         # Design review findings and resolutions
└── (wireframes, additional design artifacts)
```

## Status Flow

Spec and design documents track status independently in their frontmatter:

**Spec status:**
```
draft → in-review → approved → archived
                  → rejected
```

**Design status:**
```
draft → in-review → changes-requested → in-review → approved → archived
```

**Implementation readiness** requires both `spec.status = approved` AND `design.status = approved`.

---

## Phase 1: Spec Creation

### Step 1 — Clarification

Before generating any spec, ask clarifying questions tailored to the type.

**For all types:**
- What is the high-level goal or problem statement?
- Which area(s) of the app are affected? (auth, dashboard, campaigns, tasks, settings, emission entries, organizational tree, team members, indicators)
- What is the priority/urgency?
- Is there a Figma design for this? (provide URL if available)
- Does this depend on a backend API that already exists, or does a backend spec need to be created first?

**Additional for `feature`:**
- What pages/routes are needed?
- What forms or data collection is involved?
- What API endpoints does this consume? (list endpoints, methods, response shapes)
- What user roles can access this feature?
- What are the acceptance criteria?

**Additional for `tech-debt`:**
- What is the current risk or impact?
- What symptoms indicate this debt? (bugs, DX friction, performance issues)
- Is there a deadline or trigger for resolution?

**Additional for `refactor`:**
- What is the current structure vs. target?
- Must behavior remain identical?
- Can this be done incrementally?

**Additional for `update`:**
- What is the current behavior vs. desired behavior?
- Are there backward compatibility concerns (URL changes, form field changes)?
- Which existing routes/components are affected?

Ask 2-4 focused questions per round. Continue until scope is well-understood.

### Step 2 — Generation

1. Read the appropriate template from `references/templates.md`
2. Consult `references/architecture-context.md` for project-specific conventions
3. Explore relevant source files to ground the spec in current implementation
4. Generate the spec with all sections filled in
5. Present the draft to the user for review before saving

### Step 3 — Saving

1. Determine the `<friendly-name>` slug (kebab-case, descriptive)
2. Create directory: `.claude/specs/<type>/<friendly-name>/`
3. Write `spec.md` with status `draft`
4. Confirm the save path to the user

---

## Phase 2: Design Document Creation

After the spec is approved, create the design document — the implementation blueprint.

### Step 1 — Codebase Exploration

Before writing the design document, thoroughly explore the affected codebase:

1. Read existing routes, layouts, and page components in affected areas
2. Read existing API client functions and types for consumed endpoints
3. Read existing Zod schemas for similar forms
4. Read existing custom components in `src/components/`
5. Read the shadcn-svelte components used in similar pages
6. Check existing form patterns (Superforms + formsnap) in the affected area
7. If Figma design provided: fetch design context and screenshot via Figma MCP

Use the Explore agent or direct file reads. The design must be grounded in actual code,
not assumptions.

### Step 2 — Design Generation

Read the design document template from `references/templates.md` (Design Document Template
section). Generate a design document that includes:

- **File inventory**: Exact paths of every file to create or modify
- **Route structure**: SvelteKit route definitions with load functions and actions
- **Page components**: Complete Svelte 5 component structure with props and state
- **Form implementation**: Superforms + formsnap setup with Zod schemas
- **API integration**: apiFetchAuth calls, request/response types, error handling
- **Custom components**: New shared components needed (with props API)
- **Layout**: Tailwind CSS layout patterns, responsive design
- **State management**: Svelte 5 runes ($state, $derived, $props, $bindable)
- **Navigation**: Breadcrumbs, back buttons, redirects after actions
- **Error handling**: ApiError catch patterns, form message display
- **Authorization**: Role checks via requireAdmin or similar
- **Figma alignment**: Design token mapping if Figma design provided

Present the draft to the user for review before saving.

### Step 3 — Saving

Write `design.md` in the same spec directory with status `draft`.

---

## Phase 3: Design Review

Use the **design-reviewer** agent to review the design document against project conventions.

### Running a Review

Invoke the design-reviewer agent with the path to the design document:

```
Review the design document at .claude/specs/<type>/<name>/design.md
```

The agent performs these review checks:

1. **Architecture compliance** — Thin presentational layer, no business logic in frontend
2. **shadcn-svelte patterns** — Correct component imports, namespace vs. named imports
3. **Superforms pattern** — Full superform object passed to Form.Field, not destructured store
4. **Design token usage** — No hardcoded colors, fonts, or radii
5. **Component reuse** — Uses existing components instead of creating duplicates
6. **API integration** — Correct apiFetchAuth usage, proper error handling
7. **Type safety** — TypeScript strict mode compliance, proper type inference
8. **Accessibility** — Semantic HTML, ARIA attributes, keyboard navigation
9. **Routing conventions** — SvelteKit file-based routing, layout groups, redirects
10. **Spec alignment** — All requirements from spec are covered in design

### Review Output

The agent produces `review.md` in the spec directory with:
- Checklist of all review categories (pass/fail/warning)
- Findings with severity (blocker/warning/suggestion)
- Specific file paths and code references
- Recommended fixes

### Addressing Findings

1. Fix blockers and warnings in `design.md`
2. Add resolution notes to each finding in `review.md`
3. Re-run the design-reviewer agent to verify fixes
4. Once all blockers resolved, update `design.status` to `approved`

---

## Phase 4: Implementation Readiness

A spec is ready for implementation when:

- [ ] `spec.md` status is `approved`
- [ ] `design.md` status is `approved`
- [ ] `review.md` has no unresolved blockers
- [ ] Backend API endpoints referenced in spec exist (or their backend spec is approved)
- [ ] User confirms readiness

The approved design document serves as the implementation blueprint. Every file path,
component structure, form setup, and API integration is specified — implementation follows
the design.

---

## Managing Specs

### Listing

Run the listing script:

```bash
bash .claude/skills/spec-manager/scripts/list-specs.sh
```

Filter by type:

```bash
bash .claude/skills/spec-manager/scripts/list-specs.sh feature
```

### Reading

Read spec or design directly:
- `.claude/specs/<type>/<name>/spec.md`
- `.claude/specs/<type>/<name>/design.md`
- `.claude/specs/<type>/<name>/review.md`

### Updating Status

Edit the `status` field in the document's YAML frontmatter.

### Adding Notes

Append to the `## Notes` section with dated entries:

```markdown
### YYYY-MM-DD
- Note content here
```

### Linking PRs/Commits

Add to the `## References` section:

```markdown
- PR: #123 - Description
- Commit: abc1234 - Description
```

## Architecture Context

When generating specs and designs, ground them in akriva-app conventions. Consult
`references/architecture-context.md` for the full route inventory, component library,
API patterns, and cross-cutting concerns.

Quick reference:
- **Stack**: SvelteKit 2 + Svelte 5 + shadcn-svelte + Tailwind CSS 4
- **Routes**: `(auth)/` for guest pages, `(app)/` for protected pages
- **Forms**: Superforms + formsnap + Zod 4 with `zod4Client` adapter
- **API**: `apiFetchAuth<T>()` with session.idToken
- **Components**: shadcn-svelte from `$lib/components/ui/`, custom from `$components/`
- **Icons**: Lucide from `@lucide/svelte/icons/{name}`
- **Design tokens**: CSS variables via Tailwind utilities (never hardcode)
- **No business logic**: Frontend is a thin presentational layer

## Additional Resources

### Reference Files

- **`references/templates.md`** — Spec templates (4 types) + design document template
- **`references/architecture-context.md`** — Route inventory, component library, patterns, conventions
- **`references/design-review-checklist.md`** — Complete review checklist for design-reviewer agent

### Scripts

- **`scripts/list-specs.sh`** — List all specs with spec/design status

### Agents

- **`design-reviewer`** (`.claude/agents/design-reviewer.md`) — Reviews design documents against frontend architecture conventions
