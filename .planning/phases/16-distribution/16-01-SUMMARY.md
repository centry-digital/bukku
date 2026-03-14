---
phase: 16-distribution
plan: 01
subsystem: infra
tags: [npm, cli, ci-cd, readme, publishing]

requires:
  - phase: 15-cli-write
    provides: Complete CLI with 169 commands, dry-run, mutations
provides:
  - CLI package v2.0.0 ready for npm publish
  - Dual-package CI/CD pipeline (MCP + CLI)
  - CLI README with full documentation
  - Monorepo root README
affects: []

tech-stack:
  added: []
  patterns:
    - Dual-package npm workspace publishing with OIDC provenance

key-files:
  created:
    - packages/cli/README.md
  modified:
    - packages/cli/package.json
    - .github/workflows/publish.yml
    - .github/workflows/ci.yml
    - README.md

key-decisions:
  - "Node 20+22 CI matrix matching engines >=20.0.0 requirement"
  - "CLI tarball uses .some(d => d.includes('core')) for broader core dependency detection"

patterns-established:
  - "Dual-package publish: MCP first, then CLI, both with --provenance"

requirements-completed: [DIST-01, DIST-02, DIST-03]

duration: 3min
completed: 2026-03-14
---

# Phase 16 Plan 01: CLI Distribution Summary

**CLI package v2.0.0 finalized with dual-package CI/CD, tarball verification, and comprehensive README covering all 169 commands**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-14T09:43:11Z
- **Completed:** 2026-03-14T09:45:47Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- CLI package.json set to v2.0.0 with full metadata (homepage, bugs, keywords)
- Publish workflow updated for dual-package release (MCP + CLI) with OIDC provenance
- CI workflow updated with Node 20+22 matrix and CLI tarball verification
- CLI README created (267 lines) with installation, 3-tier configuration, usage examples for all 9 categories, input/output formats, exit codes
- Root README rewritten as monorepo overview with package table and quick start paths

## Task Commits

Each task was committed atomically:

1. **Task 1: Package finalization + CI/CD updates** - `33a86c2` (chore)
2. **Task 2: CLI README + root README update** - `132b667` (docs)

## Files Created/Modified

- `packages/cli/package.json` - Version 2.0.0, homepage, bugs, malaysia keyword
- `.github/workflows/publish.yml` - Dual-package publish (MCP + CLI)
- `.github/workflows/ci.yml` - Node 20+22 matrix, CLI tarball verification
- `packages/cli/README.md` - Full CLI documentation for end users
- `README.md` - Monorepo overview with package table

## Decisions Made

- Used `.some(d => d.includes('core'))` instead of `.includes('core')` for tarball dependency check -- catches scoped packages like `@org/core`
- Node 20+22 CI matrix aligns with CLI engines requirement (>=20.0.0)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed MCP tarball core check to use .some() instead of .includes()**
- **Found during:** Task 1 (CI workflow update)
- **Issue:** Existing MCP check used `deps.includes('core')` which only matches exact string 'core', not scoped names
- **Fix:** Changed to `deps.some(d => d.includes('core'))` matching the plan's CLI check pattern
- **Files modified:** .github/workflows/ci.yml
- **Committed in:** 33a86c2

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor fix to make MCP and CLI checks consistent. No scope creep.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CLI package ready for npm publish via GitHub release
- Both packages verified with tarball checks in CI
- Documentation complete for end users

## Self-Check: PASSED

All 5 files verified present. Both task commits (33a86c2, 132b667) verified in git log.

---
*Phase: 16-distribution*
*Completed: 2026-03-14*
