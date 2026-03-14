---
phase: 15-cli-write-commands
plan: 03
subsystem: cli
tags: [dry-run, parity, verification, commander]

# Dependency graph
requires:
  - phase: 15-cli-write-commands (plans 01, 02)
    provides: factory-generated and custom mutation CLI commands
provides:
  - "--dry-run flag on all mutation commands for safe request inspection"
  - "Parity verification script confirming 169/169 MCP-CLI tool coverage"
affects: [16-cli-packaging]

# Tech tracking
tech-stack:
  added: []
  patterns: [outputDryRun helper for masked request preview, auth exposed in CommandContext]

key-files:
  created:
    - packages/cli/src/output/dry-run.ts
    - scripts/verify-parity.ts
  modified:
    - packages/cli/src/commands/wrapper.ts
    - packages/cli/src/commands/factory.ts
    - packages/cli/src/commands/custom/archive.ts
    - packages/cli/src/commands/custom/journal-entry.ts
    - packages/cli/src/commands/custom/file-upload.ts
    - packages/cli/src/commands/custom/location-write.ts
    - package.json

key-decisions:
  - "Separate dry-run.ts output module rather than inlining in json.ts"
  - "Auth credentials exposed in CommandContext for dry-run token masking"

patterns-established:
  - "Dry-run pattern: resolve auth + validate input, then outputDryRun instead of API call"
  - "Parity verification: derive MCP tools from entity configs, map to CLI commands, diff"

requirements-completed: [OUT-04, CMD-08]

# Metrics
duration: 4min
completed: 2026-03-14
---

# Phase 15 Plan 03: Dry-Run and Parity Verification Summary

**--dry-run flag on all mutation commands with masked token output, plus 169/169 MCP-CLI parity verification script**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T09:30:39Z
- **Completed:** 2026-03-14T09:34:57Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- All mutation commands (create, update, delete, status, archive, unarchive, journal-entry, file-upload, location write/delete) support --dry-run
- Dry-run output includes method, URL, masked auth token, company subdomain, and request body
- Parity verification script confirms 100% coverage: all 169 MCP tools have CLI command equivalents
- Validation (double-entry, file existence) still runs during dry-run

## Task Commits

Each task was committed atomically:

1. **Task 1: Add --dry-run flag to all mutation commands** - `c3c66ba` (feat)
2. **Task 2: Parity verification script** - `70a5081` (feat)

## Files Created/Modified
- `packages/cli/src/output/dry-run.ts` - outputDryRun helper with token masking
- `packages/cli/src/commands/wrapper.ts` - Added auth to CommandContext interface
- `packages/cli/src/commands/factory.ts` - --dry-run on create/update/delete/status
- `packages/cli/src/commands/custom/archive.ts` - --dry-run on archive/unarchive
- `packages/cli/src/commands/custom/journal-entry.ts` - --dry-run on create/update (after validation)
- `packages/cli/src/commands/custom/file-upload.ts` - --dry-run on upload (after file existence check)
- `packages/cli/src/commands/custom/location-write.ts` - --dry-run on update/delete
- `scripts/verify-parity.ts` - MCP-to-CLI parity verification script
- `package.json` - Added verify:parity npm script

## Decisions Made
- Created separate `output/dry-run.ts` module to keep concerns separate from json.ts
- Exposed `auth` (apiToken, companySubdomain) in CommandContext rather than re-resolving in each handler
- Token masking: first 3 chars + "****" for tokens > 6 chars, otherwise just "****"

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 15 (CLI Write Commands) is now complete with all 3 plans done
- CLI supports all 169 MCP tool equivalents with dry-run inspection
- Ready for Phase 16 (CLI Packaging)

---
*Phase: 15-cli-write-commands*
*Completed: 2026-03-14*
