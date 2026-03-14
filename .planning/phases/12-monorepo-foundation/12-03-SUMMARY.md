---
phase: 12-monorepo-foundation
plan: 03
subsystem: infra
tags: [monorepo, cli, esbuild, github-actions, npm-workspaces, commander]

requires:
  - phase: 12-02
    provides: "MCP package migration with esbuild bundling"
provides:
  - "CLI skeleton package (@centry-digital/bukku-cli) with commander.js"
  - "Workspace-aware CI/CD workflows"
  - "Verified MCP tarball with no core dependency (MONO-07)"
  - "Three-package monorepo fully building (core, mcp, cli)"
affects: [13-cli-commands, 14-cli-advanced]

tech-stack:
  added: [commander@14.0.3]
  patterns: [esbuild-multi-bundle, workspace-scoped-publish]

key-files:
  created:
    - packages/cli/package.json
    - packages/cli/tsconfig.json
    - packages/cli/src/index.ts
  modified:
    - esbuild.config.mjs
    - tsconfig.json
    - .github/workflows/ci.yml
    - .github/workflows/publish.yml
    - package-lock.json

key-decisions:
  - "commander v14.0.3 (latest stable) instead of plan's ^14.0.0"
  - "Shebang only in esbuild banner, not in source — prevents double-shebang in bundle"

patterns-established:
  - "esbuild multi-bundle: shared config object spread into per-package build calls"
  - "workspace-scoped publish: npm publish --workspace packages/mcp --provenance"

requirements-completed: [MONO-06, MONO-07]

duration: 3min
completed: 2026-03-14
---

# Phase 12 Plan 03: CLI Skeleton + CI/CD Updates Summary

**CLI skeleton with commander v14, esbuild multi-bundle for mcp+cli, workspace-aware CI/CD, verified MCP tarball has no core dependency**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-14T08:34:29Z
- **Completed:** 2026-03-14T08:37:03Z
- **Tasks:** 1 (Task 2 is human-verify checkpoint, skipped per user instruction)
- **Files modified:** 8

## Accomplishments
- Created CLI skeleton package with commander.js dependency and placeholder entry point
- Updated esbuild.config.mjs to bundle both MCP and CLI packages in a single build
- Updated CI workflow with workspace-aware test command and MCP tarball verification step
- Updated publish workflow to use `--workspace packages/mcp` for scoped publishing
- Verified MCP tarball: no core in dependencies, build/index.js included, BukkuClient inlined
- All 28 core tests pass, CLI placeholder runs successfully
- npm ls --workspaces shows all 3 packages (core, mcp, cli) without errors

## Task Commits

Each task was committed atomically:

1. **Task 1: CLI skeleton + esbuild update + CI/CD workflows** - `8399787` (feat)

**Plan metadata:** [pending] (docs: complete plan)

## Files Created/Modified
- `packages/cli/package.json` - CLI package identity (@centry-digital/bukku-cli v0.0.1)
- `packages/cli/tsconfig.json` - TypeScript config extending base, referencing core
- `packages/cli/src/index.ts` - Placeholder entry point importing createLogger from core
- `esbuild.config.mjs` - Added CLI bundle alongside MCP bundle
- `tsconfig.json` - Added packages/cli reference
- `.github/workflows/ci.yml` - Workspace-aware tests, tarball verification step
- `.github/workflows/publish.yml` - Scoped publish with --workspace packages/mcp
- `package-lock.json` - commander@14.0.3 installed

## Decisions Made
- Used commander v14.0.3 (latest stable) instead of plan's ^14.0.0 — same major, includes latest patches
- Removed shebang from CLI source file (src/index.ts) — esbuild banner adds it to the bundle output, having it in source caused a double-shebang SyntaxError

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed double-shebang in CLI bundle**
- **Found during:** Task 1 (CLI skeleton creation)
- **Issue:** Plan specified `#!/usr/bin/env node` in src/index.ts AND esbuild banner. When esbuild bundles, both shebangs appear in output, causing Node.js SyntaxError on `node packages/cli/build/index.js`
- **Fix:** Removed shebang from source file; esbuild banner handles it for the built artifact
- **Files modified:** packages/cli/src/index.ts
- **Verification:** `node packages/cli/build/index.js` runs successfully, `head -1 packages/cli/build/index.js` shows single shebang
- **Committed in:** 8399787 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix for CLI to be executable. No scope creep.

## Issues Encountered
- Depcheck reports commander and zod as "unused" in packages/cli — expected since placeholder doesn't use them yet; they will be used in Phase 13

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three packages (core, mcp, cli) build successfully
- CLI skeleton ready for Phase 13 command implementation
- CI/CD workflows updated and ready for workspace-aware builds
- MCP tarball verified: publishable with no core leakage

## Self-Check: PASSED

All created files exist. Task commit 8399787 verified in git log.

---
*Phase: 12-monorepo-foundation*
*Completed: 2026-03-14*
