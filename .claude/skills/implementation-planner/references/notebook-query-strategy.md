# Notebook Query Strategy

This reference defines which notebooks to query based on the feature type being planned. Used in Phase 1 to determine subagent assignments.

## Notebook Aliases

| Alias | Notebook | Contains |
|-------|----------|----------|
| `fe-akriva` | Second Brain | Architecture, patterns, prior plans, domain conventions, PRD, UI components |
| `techdocs` | Tech Documentation | Svelte 5, SvelteKit 2, Superforms, Zod 4, Web Awesome 3.2, Vite 7 |
| `ghg-domain` | GHG Domain Knowledge | GHG Protocol, ISO 14064, CSRD, emission factors, scopes, audit standards |
| `akriva-repomix` | Full Codebase | Complete frontend + backend codebase as XML — all routes, components, API layer, configs |

## Query Patterns by Feature Type

### New Page/Route

**Agent 1** (fe-akriva):
```bash
nlm notebook query fe-akriva "existing plans for [page/route name]"
nlm notebook query fe-akriva "patterns for creating new pages and routes"
nlm notebook query fe-akriva "layout and navigation conventions"
```

**Agent 2** (techdocs):
```bash
nlm notebook query techdocs "sveltekit routing load functions form actions"
nlm notebook query techdocs "sveltekit page server load data patterns"
```

**Agent 3** (akriva-repomix):
```bash
nlm notebook query akriva-repomix "route structure and page files for [similar route]"
nlm notebook query akriva-repomix "page.server.ts load and action patterns"
```

### New Component

**Agent 1** (fe-akriva):
```bash
nlm notebook query fe-akriva "existing reusable components and conventions"
nlm notebook query fe-akriva "component design patterns and props conventions"
```

**Agent 2** (techdocs):
```bash
nlm notebook query techdocs "svelte 5 runes props state derived bindable"
nlm notebook query techdocs "svelte 5 snippets and component composition"
```

**Agent 3** (akriva-repomix):
```bash
nlm notebook query akriva-repomix "component files in src/components"
nlm notebook query akriva-repomix "component props and event patterns"
```

### Form Feature (Superforms)

**Agent 1** (fe-akriva):
```bash
nlm notebook query fe-akriva "superforms setup and form handling patterns"
nlm notebook query fe-akriva "zod schema validation conventions"
nlm notebook query fe-akriva "web awesome form component event handling"
```

**Agent 2** (techdocs):
```bash
nlm notebook query techdocs "superforms sveltekit setup validation configuration"
nlm notebook query techdocs "zod 4 schema definition refinements coercion"
nlm notebook query techdocs "web awesome input select radio form components"
```

**Agent 3** (akriva-repomix):
```bash
nlm notebook query akriva-repomix "existing form implementations with superforms"
nlm notebook query akriva-repomix "zod schemas in src/lib/schemas"
```

### API Integration

**Agent 1** (fe-akriva):
```bash
nlm notebook query fe-akriva "API client patterns and fetch wrapper conventions"
nlm notebook query fe-akriva "API types and response handling patterns"
nlm notebook query fe-akriva "error handling for API calls"
```

**Agent 2** (techdocs):
```bash
nlm notebook query techdocs "sveltekit server load functions and form actions"
nlm notebook query techdocs "sveltekit hooks and middleware patterns"
```

**Agent 3** (akriva-repomix):
```bash
nlm notebook query akriva-repomix "API client usage in page.server.ts files"
nlm notebook query akriva-repomix "API types and domain API function patterns"
```

### UI/Design System Update

**Agent 1** (fe-akriva):
```bash
nlm notebook query fe-akriva "design token system and CSS custom properties"
nlm notebook query fe-akriva "web awesome component customization and overrides"
nlm notebook query fe-akriva "styling conventions and theme structure"
```

**Agent 2** (techdocs):
```bash
nlm notebook query techdocs "web awesome component styling tokens customization"
nlm notebook query techdocs "web awesome dialog tabs card component usage"
```

**Agent 3** (akriva-repomix):
```bash
nlm notebook query akriva-repomix "styles directory theme tokens and CSS files"
nlm notebook query akriva-repomix "web awesome component usage across routes"
```

### GHG/Emissions Feature

**Agent 1** (fe-akriva):
```bash
nlm notebook query fe-akriva "GHG module plans and requirements"
nlm notebook query fe-akriva "emissions-related architecture decisions"
nlm notebook query fe-akriva "PRD requirements for [specific GHG feature]"
```

**Agent 2** (ghg-domain):
```bash
nlm notebook query ghg-domain "[specific topic] calculation methodology"
nlm notebook query ghg-domain "data requirements for [scope/feature]"
nlm notebook query ghg-domain "compliance requirements for [standard]"
```

**Agent 3** (techdocs — for framework patterns relevant to the feature):
```bash
nlm notebook query techdocs "sveltekit form patterns for complex data entry"
nlm notebook query techdocs "svelte 5 reactive state for multi-step workflows"
```

### Authentication/Authorization

**Agent 1** (fe-akriva):
```bash
nlm notebook query fe-akriva "authentication system and auth store patterns"
nlm notebook query fe-akriva "route guards and token refresh conventions"
nlm notebook query fe-akriva "session handling and JWT patterns"
```

**Agent 2** (techdocs):
```bash
nlm notebook query techdocs "sveltekit hooks server middleware auth patterns"
nlm notebook query techdocs "sveltekit cookies and session management"
```

**Agent 3** (akriva-repomix):
```bash
nlm notebook query akriva-repomix "auth hooks and guard implementations"
nlm notebook query akriva-repomix "auth store and signin signup flow"
```

## Best Practices

1. **Be specific** — "superforms zod validation for multi-step form with wa-select" is better than "form handling"
2. **Ask about prior decisions** — Always include a query for "existing plans and decisions for [feature]"
3. **Check for conflicts** — If Phase 1 reveals a prior plan that conflicts, flag it for Phase 3
4. **Limit queries** — 2-4 queries per notebook per agent, not broad sweeps
5. **Rate limiting** — Wait 2 seconds between queries within the same agent
6. **Choose the right notebook** — Don't query `techdocs` for business rules, don't query `ghg-domain` for UI patterns
