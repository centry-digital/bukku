---
phase: 12-monorepo-foundation
plan: 02
subsystem: infra
tags: [monorepo, esbuild, npm-workspaces, typescript-references, bundling]

# Dependency graph
requires:
  - phase: 12-01
    provides: "packages/core with BukkuClient, entity configs, errors, validation, cache, logger"
provides:
  - "packages/mcp with all MCP server source files consuming core via workspace symlinks"
  - "esbuild.config.mjs bundling MCP entry point with core inlined"
  - "Working build pipeline: tsc --build + esbuild producing self-contained MCP server"
affects: [12-03, 13-cli, publishing, ci-cd]

# Tech tracking
tech-stack:
  added: [esbuild]
  patterns: [esbuild-bundle-with-core-inlined, workspace-symlink-dev-resolution, createLogger-factory]

key-files:
  created:
    - packages/mcp/package.json
    - packages/mcp/tsconfig.json
    - packages/mcp/src/index.ts
    - packages/mcp/src/config/env.ts
    - packages/mcp/src/tools/factory.ts
    - packages/mcp/src/tools/registry.ts
    - packages/mcp/src/tools/custom/file-upload.ts
    - packages/mcp/src/tools/custom/contact-archive.ts
    - packages/mcp/src/tools/custom/product-archive.ts
    - packages/mcp/src/tools/custom/control-panel-archive.ts
    - packages/mcp/src/tools/custom/account-tools.ts
    - packages/mcp/src/tools/custom/journal-entry-tools.ts
    - packages/mcp/src/tools/custom/location-tools.ts
    - packages/mcp/src/tools/custom/reference-data.ts
    - esbuild.config.mjs
  modified:
    - tsconfig.json

key-decisions:
  - "Removed premature packages/cli reference from root tsconfig.json to unblock tsc --build"
  - "core not listed in mcp dependencies — workspace symlink for dev, esbuild inlining for publish"

patterns-established:
  - "createLogger('bukku-mcp') factory pattern for all MCP log calls"
  - "All shared imports via 'core' package, never relative paths"
  - "esbuild inlines core, externalizes @modelcontextprotocol/sdk and zod"

requirements-completed: [MONO-03, MONO-04]

# Metrics
duration: 4min
completed: 2026-03-14
---

# Phase 12 Plan 02: MCP Package Migration Summary

**MCP server migrated to packages/mcp consuming core via workspace symlinks, with esbuild producing 1821-line self-contained bundle**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T08:26:40Z
- **Completed:** 2026-03-14T08:31:29Z
- **Tasks:** 2
- **Files modified:** 16 created, 1 modified, 48 deleted (old src/)

## Accomplishments
- All MCP-specific files moved to packages/mcp with imports rewired to 'core' package
- esbuild config bundles MCP with core inlined (BukkuClient found in output), SDK/zod external
- Old src/ and build/ directories removed; clean build from scratch works
- TypeScript project references compilation passes cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Move MCP files and rewire imports** - `8aa5379` (feat)
2. **Task 2: Set up esbuild config, build pipeline, and clean up src/** - `6ed7719` (feat)

**Plan metadata:** (pending)

## Files Created/Modified
- `packages/mcp/package.json` - Published package identity (@centry-digital/bukku-mcp)
- `packages/mcp/tsconfig.json` - TypeScript config with core reference
- `packages/mcp/src/index.ts` - MCP server entry point using BukkuClient from core
- `packages/mcp/src/config/env.ts` - Environment validation (MCP-specific)
- `packages/mcp/src/tools/factory.ts` - CRUD tool factory using core types/errors
- `packages/mcp/src/tools/registry.ts` - Tool registry importing 27 entity configs from core
- `packages/mcp/src/tools/custom/*.ts` - 8 custom tool files with core imports
- `esbuild.config.mjs` - Bundle config: core inlined, SDK/zod external
- `tsconfig.json` - Removed premature cli reference

## Decisions Made
- Removed packages/cli reference from root tsconfig.json — it was added prematurely in 12-01 and blocked tsc --build since the package doesn't exist yet
- core is NOT in mcp's dependencies — npm workspace symlink handles dev-time resolution, esbuild inlines at build time

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed premature packages/cli reference from root tsconfig.json**
- **Found during:** Task 1 (TypeScript compilation verification)
- **Issue:** Root tsconfig.json referenced packages/cli which doesn't exist yet, causing tsc --build to fail with TS5083
- **Fix:** Removed the `{ "path": "packages/cli" }` reference; will be re-added when packages/cli is created in Phase 13
- **Files modified:** tsconfig.json
- **Verification:** tsc --build compiles cleanly after removal
- **Committed in:** 8aa5379 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Fix was necessary for build to succeed. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- packages/mcp builds cleanly via `npm run build` (tsc --build + esbuild)
- Bundle output verified: core inlined, SDK external, 1821 lines
- Ready for Plan 12-03 (smoke testing, npm pack tarball diff, CI updates)
- packages/cli tsconfig reference will need to be re-added when Phase 13 begins

## Self-Check: PASSED

All 16 created files verified present. Both task commits (8aa5379, 6ed7719) confirmed. Old src/ directory confirmed deleted. Bundle output verified (core inlined, SDK external).

---
*Phase: 12-monorepo-foundation*
*Completed: 2026-03-14*
