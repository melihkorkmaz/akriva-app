---
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
argument-hint: <feature or change description>
description: Create implementation plan with NotebookLM research, codebase exploration, and structured task breakdown
---

# Implementation Planner

Create a comprehensive implementation plan for: **$ARGUMENTS**

## Instructions

Follow the **implementation-planner** skill workflow — a 6-phase process that ensures thorough planning.

### Skill Reference Files

Read these before starting (only read what's needed for the current phase):

- **Workflow**: `.claude/skills/implementation-planner/SKILL.md`
- **Plan Template**: `.claude/skills/implementation-planner/references/plan-template.md`
- **Query Strategy**: `.claude/skills/implementation-planner/references/notebook-query-strategy.md`
- **Question Framework**: `.claude/skills/implementation-planner/references/question-framework.md`

### Phase Summary

1. **Context Gathering** — Launch 2-3 parallel subagents to query NotebookLM notebooks (fe-akriva, techdocs, ghg-domain, akriva-repomix) based on feature type
2. **Codebase Exploration** — Read affected routes, components, schemas, layouts, API layer
3. **User Questions** — Ask minimum 3 adaptive questions with concrete options and tradeoffs using `AskUserQuestion`
4. **Plan Generation** — Generate structured plan using template, save to `.claude/plans/{feature-slug}-plan.md`
5. **User Review** — Present plan for approval, iterate on feedback
6. **Save to Second Brain** — Save approved plan to fe-akriva notebook via `nlm source add`, verify searchability

### Rules

- Never skip any phase
- Never write implementation code — planning only
- Always check for conflicting prior plans in Phase 1
- Minimum 3 questions before generating any plan
- Always save to Second Brain after approval (Phase 6 is mandatory)
- Use `nlm notebook query` for NotebookLM queries, never `nlm chat start`
- Respect 2-second delay between nlm queries
