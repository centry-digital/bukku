---
phase: 13-cli-foundation-auth
plan: 02
subsystem: cli
tags: [output-formatters, exit-codes, withAuth, testing, tsx]

# Dependency graph
requires:
  - phase: 13-cli-foundation-auth
    provides: Commander.js CLI with auth resolution, rc config, config commands
provides:
  - JSON stdout formatter (outputJson)
  - Structured error stderr formatter (outputError) with exit codes
  - Exit code constants (SUCCESS=0, GENERAL=1, AUTH=2, API=3, VALIDATION=4)
  - mapExitCode function for error-code-to-exit-code mapping
  - Placeholder table formatter (outputTable) with JSON fallback
  - withAuth command wrapper resolving auth and creating BukkuClient
  - Unit tests for auth resolution, rc file, output formatters
  - Integration tests for CLI commands
affects: [14-cli-entity-commands, 15-cli-output-ux]

# Tech tracking
tech-stack:
  added: [tsx]
  patterns: [withAuth-wrapper, output-contract, exit-code-mapping]

key-files:
  created:
    - packages/cli/src/output/json.ts
    - packages/cli/src/output/error.ts
    - packages/cli/src/output/table.ts
    - packages/cli/src/commands/wrapper.ts
    - packages/cli/src/config/auth.test.ts
    - packages/cli/src/config/rc.test.ts
    - packages/cli/src/output/output.test.ts
    - packages/cli/src/commands/integration.test.ts
  modified:
    - packages/cli/package.json
    - package.json
    - package-lock.json

key-decisions:
  - "Added tsx as dev dependency for test execution -- Node --experimental-strip-types cannot resolve .js imports to .ts files required by Node16 module resolution"
  - "Test script uses node --test --import tsx/esm for proper .js -> .ts import resolution in test runner"
  - "Integration tests run against built JS (packages/cli/build/) rather than source TS to match production execution"
  - "RC tests use inline parsing logic replicating rc.ts behavior since parseIni/formatIni are not exported as separate functions"

patterns-established:
  - "withAuth wrapper: resolves auth, creates BukkuClient, catches AuthMissingError -> exit 2, Response -> exit 3, generic -> exit 1"
  - "Output contract: outputJson -> stdout, outputError -> stderr + process.exit"
  - "Integration tests spawn CLI as child process with temp HOME isolation"

requirements-completed: [CORE-04, CORE-05, CORE-06, OUT-01, OUT-05]

# Metrics
duration: 5min
completed: 2026-03-14
---

# Phase 13 Plan 02: Output Formatters, withAuth Wrapper, and Tests Summary

**JSON/error output formatters with exit code mapping, withAuth command wrapper for auth-aware commands, and 25 passing tests covering auth, rc, output, and CLI integration**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-14T08:50:03Z
- **Completed:** 2026-03-14T08:55:26Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Output contract: outputJson writes pretty-printed JSON to stdout, outputError writes structured {error, code, details} to stderr with process.exit
- Exit code system: SUCCESS=0, GENERAL=1, AUTH=2, API=3, VALIDATION=4 with mapExitCode helper
- withAuth wrapper resolves 3-tier auth, creates BukkuClient, handles AuthMissingError/Response/generic errors
- 25 passing tests: auth resolution (4), maskToken (3), rc parsing (5), output formatters (7), CLI integration (6)

## Task Commits

Each task was committed atomically:

1. **Task 1: Output formatters + exit codes + withAuth wrapper** - `441cc2b` (feat)
2. **Task 2: Unit and integration tests** - `09c863b` (test)

## Files Created/Modified
- `packages/cli/src/output/json.ts` - JSON stdout formatter with pretty-printing
- `packages/cli/src/output/error.ts` - ExitCode constants, CliError interface, mapExitCode, outputError
- `packages/cli/src/output/table.ts` - Placeholder table formatter falling back to JSON
- `packages/cli/src/commands/wrapper.ts` - withAuth command wrapper with auth resolution and error handling
- `packages/cli/src/config/auth.test.ts` - Unit tests for 3-tier auth resolution and maskToken
- `packages/cli/src/config/rc.test.ts` - Unit tests for INI parsing, roundtrip, permissions
- `packages/cli/src/output/output.test.ts` - Unit tests for outputJson and mapExitCode
- `packages/cli/src/commands/integration.test.ts` - Integration tests for --version, --help, config set
- `packages/cli/package.json` - Updated test script to use tsx/esm loader

## Decisions Made
- Added tsx as dev dependency because Node's --experimental-strip-types does not rewrite .js import specifiers to .ts files, which is required when source uses Node16 module resolution (.js extensions in imports)
- Integration tests run against the built JS output (packages/cli/build/) rather than source TS, matching actual production execution path
- RC tests replicate the parsing logic inline rather than importing non-exported internal functions, testing the same algorithm the module uses

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added tsx dev dependency for test execution**
- **Found during:** Task 2 (test writing)
- **Issue:** Node --experimental-strip-types cannot resolve .js imports to .ts files; auth.ts imports ./rc.js which doesn't exist as .js at source level
- **Fix:** Installed tsx, updated test script to `node --test --import tsx/esm`
- **Files modified:** package.json, package-lock.json, packages/cli/package.json
- **Verification:** All 25 tests pass with tsx/esm loader
- **Committed in:** 441cc2b (Task 1 commit)

**2. [Rule 3 - Blocking] Integration tests use built JS instead of source TS**
- **Found during:** Task 2 (integration test writing)
- **Issue:** CLI entry point (index.ts) uses .js imports that cannot be resolved by --experimental-strip-types when spawned as child process
- **Fix:** Changed integration test CLI_ENTRY to point to packages/cli/build/index.js
- **Files modified:** packages/cli/src/commands/integration.test.ts
- **Verification:** All integration tests pass
- **Committed in:** 09c863b (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for test execution. No scope creep.

## Issues Encountered
- The TS6310 error (`Referenced project may not disable emit`) occurs with `tsc --build` but not with `tsc --noEmit`. This is a pre-existing issue with TypeScript project references and does not affect the actual build (esbuild handles bundling).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Output formatters ready for all future commands to use
- withAuth wrapper ready for Phase 14 entity commands
- Test infrastructure established with tsx/esm loader pattern
- All 8 command groups remain as placeholders for Phase 14

## Self-Check: PASSED

- All 8 created files verified on disk
- Commit 441cc2b verified in git log
- Commit 09c863b verified in git log
- 25/25 tests passing

---
*Phase: 13-cli-foundation-auth*
*Completed: 2026-03-14*
