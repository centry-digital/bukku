---
phase: 13-cli-foundation-auth
plan: 01
subsystem: cli
tags: [commander, ini, auth, config]

# Dependency graph
requires:
  - phase: 12-monorepo-foundation
    provides: CLI skeleton with Commander.js, esbuild build, npm workspace
provides:
  - Commander.js program with 8 command groups and global flags
  - 3-tier auth resolution (flags > env > rc)
  - ~/.bukkurc INI config file management with 0o600 permissions
  - config set/show subcommands with JSON output
  - maskToken utility for display
  - AuthMissingError class for downstream error handling
affects: [13-cli-foundation-auth, 14-cli-entity-commands, 15-cli-output-ux]

# Tech tracking
tech-stack:
  added: []
  patterns: [3-tier-auth-resolution, ini-config-file, json-stdout-errors-stderr]

key-files:
  created:
    - packages/cli/src/index.ts
    - packages/cli/src/config/auth.ts
    - packages/cli/src/config/rc.ts
    - packages/cli/src/commands/config.ts
  modified:
    - packages/cli/package.json

key-decisions:
  - "Used tsx for dev-time execution since --experimental-strip-types does not rewrite .js imports for Node16 module resolution"
  - "AuthMissingError as custom Error subclass with code property for typed error handling in withAuth wrapper"
  - "Config show resolves precedence independently per field, matching resolveAuth behavior"

patterns-established:
  - "JSON output on stdout, human warnings on stderr"
  - "Exit code 4 for validation errors (invalid config keys)"
  - "3-tier precedence: flags > env vars > ~/.bukkurc for all auth fields"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, CORE-01, CORE-02, CORE-03]

# Metrics
duration: 2min
completed: 2026-03-14
---

# Phase 13 Plan 01: CLI Foundation and Auth Summary

**Commander.js CLI with 8 command groups, 3-tier auth resolution (flags > env > ~/.bukkurc), and config set/show subcommands with JSON output**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-14T08:45:14Z
- **Completed:** 2026-03-14T08:47:35Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Commander.js program with --help, --version, global options, and 9 commands (8 groups + config)
- 3-tier auth resolution with per-field source tracking and AuthMissingError
- ~/.bukkurc INI read/write with 0o600 permissions and permission checking
- config set/show with JSON output, token masking, and key validation

## Task Commits

Each task was committed atomically:

1. **Task 1: CLI entry point + auth resolution + rc file** - `43ff102` (feat)
2. **Task 2: Config subcommand (set/show)** - `2cf21fa` (feat)

## Files Created/Modified
- `packages/cli/src/index.ts` - Commander.js program with command groups and global flags
- `packages/cli/src/config/auth.ts` - 3-tier auth resolution with AuthMissingError and maskToken
- `packages/cli/src/config/rc.ts` - ~/.bukkurc INI read/write with 0o600 permissions
- `packages/cli/src/commands/config.ts` - config set/show subcommands with JSON output
- `packages/cli/package.json` - Added test script

## Decisions Made
- Used AuthMissingError as a custom Error subclass with `code` and `missingFields` properties for structured error handling in the withAuth wrapper (Plan 13-02)
- Config show resolves precedence independently per field (not a single source), matching resolveAuth behavior
- Token masking shows first 4 + ... + last 4 for tokens >= 8 chars, otherwise ****

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `--experimental-strip-types` does not rewrite `.js` extensions in imports for `module: "Node16"` TypeScript projects, so dev-time execution requires `tsx` instead. This does not affect production (esbuild handles bundling).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- CLI skeleton ready for Plan 13-02 (withAuth wrapper, entity command factory)
- All 8 command groups registered as placeholders for Phase 14
- Auth resolution and config management fully operational

---
*Phase: 13-cli-foundation-auth*
*Completed: 2026-03-14*
