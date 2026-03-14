# Project State: Bukku

**Last updated:** 2026-03-14T08:23Z

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-14)

**Core value:** Users can read and write accounting data in Bukku efficiently — through AI conversation (MCP) or direct commands (CLI) — instead of manual data entry in the web UI.
**Current focus:** v2.0 Monorepo + CLI — Phase 12 (Monorepo Foundation) in progress

## Current Position

Phase: 12 (Monorepo Foundation) — In progress
Plan: 02 completed (2/3 plans)
Status: Plan 12-02 complete, ready for 12-03
Last activity: 2026-03-14 — Plan 12-02 executed (MCP package migration + esbuild)

```
Progress: [####                          ] 13% (0/5 phases, 2/3 plans in Phase 12)
Phase 12 ####░  Phase 13 ░░░░░  Phase 14 ░░░░░  Phase 15 ░░░░░  Phase 16 ░░░░░
```

## Performance Metrics

**v1.0 Milestone (Phases 1-7):**
- Total plans completed: 25 (including gap closures)
- Timeline: 4 days (2026-02-06 to 2026-02-09)
- Commits: 116
- LOC: 4,003 TypeScript

**v1.1 Milestone (Phases 8-11):**
- Total plans completed: 4
- Timeline: 2 days (2026-02-09 to 2026-02-10)
- Commits: 8
- Shipped: npm package @centry-digital/bukku-mcp with CI/CD

**v2.0 Milestone (Phases 12-16):**
- Total plans completed: 2
- Started: 2026-03-14
- Requirements: 34 total (7 + 13 + 4 + 7 + 3)
- Plan 12-01: 4min, 2 tasks, 45 files
- Plan 12-02: 4min, 2 tasks, 16 files

## Accumulated Context

### Key Decisions

See `.planning/PROJECT.md` Key Decisions table for full list with outcomes.

**v2.0 decisions:**
- Monorepo with npm workspaces — CLI + MCP share ~80% code; avoids duplication
- Core package internal-only — no third-party consumers; simplifies versioning
- @centry-digital/bukku-cli package name — consistent with existing scope
- JSON-first CLI output — primary consumers are AI tools and automation platforms
- Config file (~/.bukkurc) for CLI auth — convenience for interactive use; env vars still supported
- Nested subcommands — natural grouping (e.g., bukku sales invoices list)
- commander v14 + ini v6 + cli-table3 — lean, well-maintained, no unnecessary deps
- Node.js minimum version bump to 20 — commander v14 and ini v6 require Node 20; Node 18 EOL April 2025

### Active TODOs

None.

### Blockers

No blockers.

### Critical Risks (v2.0)

- Breaking @centry-digital/bukku-mcp during monorepo restructure — mitigated by npm pack tarball diff and smoke test in Phase 12
- Phantom dependencies from npm hoisting — mitigated by depcheck run before any publish
- TypeScript project references silently degrading to `any` — mitigated by verifying emitted .d.ts files contain real types
- CLI stdout pollution breaking automation consumers — mitigated by shared output utilities with JSON.parse assertions in tests
- Process hang after command completion — mitigated by keepAlive: false on BukkuClient in CLI mode

## Session Continuity

**Last session:** 2026-03-14T08:31Z
**Stopped at:** Completed 12-02-PLAN.md (MCP package migration + esbuild)
**What's next:** Execute plan 12-03 (smoke testing, npm pack tarball diff, CI updates)

---
*State tracking since: 2026-02-06*
