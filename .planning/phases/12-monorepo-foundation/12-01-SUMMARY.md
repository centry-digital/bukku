---
phase: 12-monorepo-foundation
plan: 01
subsystem: infra
tags: [npm-workspaces, monorepo, typescript-project-references, esbuild, barrel-exports]

# Dependency graph
requires: []
provides:
  - "packages/core package with BukkuClient, types, errors, validation, cache, logger, 27 entity configs"
  - "npm workspace root with project references"
  - "createLogger factory for prefixed stderr logging"
  - "CrudEntityConfig.cliGroup field for CLI command grouping"
  - "allEntityConfigs array and entityConfigByName lookup"
affects: [12-02-mcp-package, 12-03-smoke-test, 13-cli-foundation]

# Tech tracking
tech-stack:
  added: [esbuild]
  patterns: [npm-workspaces, tsconfig-project-references, barrel-exports, createLogger-factory, BukkuClientConfig-interface]

key-files:
  created:
    - packages/core/src/index.ts
    - packages/core/src/utils/logger.ts
    - packages/core/src/client/bukku-client.ts
    - packages/core/src/types/bukku.ts
    - packages/core/src/entities/index.ts
    - packages/core/package.json
    - packages/core/tsconfig.json
    - tsconfig.base.json
  modified:
    - package.json
    - tsconfig.json
    - .gitignore

key-decisions:
  - "Core package is private (not published) — internal workspace dependency only"
  - "createLogger(prefix) factory replaces hardcoded log() — enables per-package prefixes"
  - "BukkuClientConfig interface replaces Env dependency — decouples client from MCP env config"
  - "cliGroup field is optional on CrudEntityConfig — backward compatible addition"

patterns-established:
  - "Barrel export: packages/core/src/index.ts re-exports all public APIs"
  - "Entity config barrel: entities/index.ts with allEntityConfigs array and entityConfigByName lookup"
  - "Logger factory: createLogger('prefix') returns stderr-logging function"
  - "Client config: BukkuClientConfig { apiToken, companySubdomain } for framework-agnostic client construction"

requirements-completed: [MONO-01, MONO-02, MONO-04, MONO-05]

# Metrics
duration: 4min
completed: 2026-03-14
---

# Phase 12 Plan 01: Workspace Root and Core Package Summary

**npm workspace root with packages/core containing BukkuClient, createLogger factory, 27 cliGroup-tagged entity configs, and barrel exports**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T08:19:36Z
- **Completed:** 2026-03-14T08:23:15Z
- **Tasks:** 2
- **Files modified:** 45

## Accomplishments
- npm workspace root with `private: true`, `workspaces: ["packages/*"]`, node >= 20, esbuild devDep
- packages/core with full shared code: client, types, errors, validation, cache, logger, 27 entity configs
- createLogger(prefix) factory replaces hardcoded log() function for per-package prefixed logging
- BukkuClient accepts BukkuClientConfig { apiToken, companySubdomain } instead of MCP-specific Env
- CrudEntityConfig gains optional cliGroup field; all 27 configs have values across 8 groups
- All 28 tests pass (transform: 9 + 2, double-entry: 17)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create workspace root and packages/core skeleton** - `6d1b10c` (chore)
2. **Task 2: Move shared code to core and create barrel exports** - `f4fafab` (feat)

## Files Created/Modified
- `package.json` - Workspace root (private, workspaces, node>=20, esbuild)
- `tsconfig.base.json` - Shared compiler options with composite: true
- `tsconfig.json` - Project references to core, mcp, cli
- `.gitignore` - Added packages/*/build/
- `packages/core/package.json` - Core package (private, zod dependency)
- `packages/core/tsconfig.json` - Extends tsconfig.base.json
- `packages/core/src/index.ts` - Barrel export of all core APIs
- `packages/core/src/utils/logger.ts` - createLogger factory
- `packages/core/src/client/bukku-client.ts` - BukkuClient with BukkuClientConfig
- `packages/core/src/types/bukku.ts` - Core types with cliGroup on CrudEntityConfig
- `packages/core/src/types/api-responses.ts` - API response types
- `packages/core/src/errors/transform.ts` - HTTP/network error transforms
- `packages/core/src/errors/transform.test.ts` - Error transform tests
- `packages/core/src/validation/double-entry.ts` - Journal entry validation
- `packages/core/src/validation/double-entry.test.ts` - Validation tests
- `packages/core/src/cache/reference-cache.ts` - Reference data cache
- `packages/core/src/entities/index.ts` - Entity config barrel with allEntityConfigs and entityConfigByName
- `packages/core/src/entities/*.ts` - 27 entity config files with cliGroup values

## Decisions Made
- Core package is private (not published) -- workspace-internal dependency only
- createLogger(prefix) factory replaces hardcoded log() -- enables per-package stderr prefixes
- BukkuClientConfig { apiToken, companySubdomain } replaces Env dependency -- decouples from MCP-specific config
- cliGroup field is optional on CrudEntityConfig -- backward compatible; all 27 configs populated

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- packages/core is fully functional with passing tests and type-checks
- src/ directory intentionally preserved for plan 12-02 (MCP package migration)
- Workspace symlinks established (node_modules/core -> packages/core)
- Ready for plan 12-02 to create packages/mcp consuming core

---
*Phase: 12-monorepo-foundation*
*Completed: 2026-03-14*
