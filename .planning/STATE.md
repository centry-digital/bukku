---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Monorepo + CLI
status: complete
stopped_at: Completed 16-01-PLAN.md (CLI distribution)
last_updated: "2026-03-14T09:46:46.417Z"
last_activity: 2026-03-14 — Plan 16-01 executed (CLI distribution)
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 11
  completed_plans: 11
  percent: 100
---

# Project State: Bukku

**Last updated:** 2026-03-14T09:07Z

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-14)

**Core value:** Users can read and write accounting data in Bukku efficiently — through AI conversation (MCP) or direct commands (CLI) — instead of manual data entry in the web UI.
**Current focus:** v2.0 Monorepo + CLI — Complete (all 5 phases, 11 plans)

## Current Position

Phase: 16 (Distribution) — Complete
Plan: 01 completed (1/1 plans)
Status: v2.0 milestone complete — CLI package v2.0.0 ready for npm publish
Last activity: 2026-03-14 — Plan 16-01 executed (CLI distribution)

```
Progress: [██████████] 100%
Phase 12 #####  Phase 13 #####  Phase 14 #####  Phase 15 #####  Phase 16 #####
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
- Total plans completed: 11
- Started: 2026-03-14
- Requirements: 34 total (7 + 13 + 4 + 7 + 3)
- Plan 12-01: 4min, 2 tasks, 45 files
- Plan 12-02: 4min, 2 tasks, 16 files
- Plan 12-03: 3min, 1 task, 8 files
- Plan 13-01: 2min, 2 tasks, 5 files
- Plan 13-02: 5min, 2 tasks, 11 files
- Plan 14-01: 3min, 2 tasks, 2 files
- Plan 14-02: 2min, 2 tasks, 4 files
- Plan 15-01: 2min, 1 task, 2 files
- Plan 15-02: 3min, 2 tasks, 6 files
- Plan 15-03: 4min, 2 tasks, 9 files
- Plan 16-01: 3min, 2 tasks, 5 files

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
- commander v14.0.3 for CLI; shebang only in esbuild banner not source (avoids double-shebang bug)
- commander v14 + ini v6 — lean, well-maintained, no unnecessary deps (cli-table3 not needed; custom table formatter)
- Node.js minimum version bump to 20 — commander v14 and ini v6 require Node 20; Node 18 EOL April 2025
- AuthMissingError as custom Error subclass with code/missingFields for typed error handling in withAuth wrapper
- Config show resolves precedence independently per field, matching resolveAuth behavior
- Exit code 4 for validation errors (invalid config keys)
- tsx dev dependency for test execution -- Node --experimental-strip-types cannot resolve .js -> .ts imports
- Integration tests run against built JS (packages/cli/build/) matching production execution
- withAuth wrapper pattern: resolves auth, creates BukkuClient, catches typed errors with mapped exit codes
- Explicit RESOURCE_NAME_MAP over prefix-stripping heuristics for entity-to-subcommand mapping
- get command uses setOptionValue to pass parsed ID through withAuth wrapper
- ref-data top-level group for reference data commands (not nested under accounting)
- zero-dependency table formatter with string padding (cli-table3 unnecessary)
- JSON input parsed inside withAuth handler (after auth), matching security-first design
- Reused readJsonInput from 15-01 instead of inlining JSON parsing (15-01 already landed)
- Status command uses requiredOption for --status flag to enforce value at Commander level
- Custom commands find existing group/resource commands and add subcommands to them
- Separate dry-run.ts output module for clean separation of concerns
- Auth credentials exposed in CommandContext for dry-run token masking
- Node 20+22 CI matrix matching engines >=20.0.0 requirement
- Dual-package npm publish workflow with OIDC provenance

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

**Last session:** 2026-03-14T09:46:46.415Z
**Stopped at:** Completed 16-01-PLAN.md (CLI distribution)
**What's next:** v2.0 milestone complete -- publish release

---
*State tracking since: 2026-02-06*
