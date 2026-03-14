---
phase: 14-cli-read-commands
plan: 01
subsystem: cli
tags: [cli, commands, factory, crud]
dependency_graph:
  requires: [core-entity-configs, cli-foundation]
  provides: [cli-list-get-commands]
  affects: [cli-table-output, cli-write-commands]
tech_stack:
  added: []
  patterns: [command-factory, config-driven-cli, auto-pagination]
key_files:
  created:
    - packages/cli/src/commands/factory.ts
  modified:
    - packages/cli/src/index.ts
decisions:
  - Explicit RESOURCE_NAME_MAP over prefix-stripping heuristics for entity-to-subcommand mapping
  - outputTable receives entity name in array for future column selection
  - get command uses setOptionValue to pass parsed ID through withAuth wrapper
metrics:
  duration: 3min
  completed: "2026-03-14T09:07:29Z"
---

# Phase 14 Plan 01: CLI Command Factory Summary

Config-driven factory that auto-generates list and get CLI subcommands for all 27 entity configs under 8 command groups.

## What Was Done

### Task 1: Create CLI command factory (factory.ts)
- Created `registerEntityCommands(program)` that iterates `allEntityConfigs` from core
- Explicit `RESOURCE_NAME_MAP` maps 27 entity names to CLI resource subcommand names
- `addListCommand()` generates list subcommands with standard options (--limit, --page, --search, --date-from, --date-to, --status, --sort-by, --sort-dir, --all, --format) plus entity-specific filters from `config.listFilters`
- `addGetCommand()` generates get subcommands with `<id>` argument and --format option
- `--all` flag triggers auto-pagination loop with stderr progress messages
- Commit: `4656fba`

### Task 2: Wire factory into CLI entry point
- Removed 8 placeholder `.command()` calls from index.ts
- Added `registerEntityCommands(program)` call before config command
- "settings" placeholder replaced by "control-panel" group (matching entity cliGroup values)
- Commit: `7ff742b`

## Command Tree

```
bukku
  sales (invoices, quotes, orders, credit-notes, payments, refunds, delivery-orders)
  purchases (bills, orders, credit-notes, payments, refunds, goods-received-notes)
  banking (money-in, money-out, transfers)
  contacts (contacts, groups)
  products (products, bundles, groups)
  accounting (journal-entries, accounts[get only])
  files (files)
  control-panel (locations, tags, tag-groups)
  config (set, show)
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] outputTable signature mismatch**
- **Found during:** Task 1
- **Issue:** Plan called `outputTable(items, config.entity)` but placeholder signature expects `string[]` not `string`
- **Fix:** Wrapped entity name in array: `outputTable(items, [config.entity])`
- **Files modified:** packages/cli/src/commands/factory.ts

**2. [Rule 3 - Blocking] get command ID argument inaccessible through withAuth**
- **Found during:** Task 1
- **Issue:** `withAuth` wrapper ignores positional args from Commander action callback, so `<id>` argument unreachable in handler
- **Fix:** Thin wrapper captures id arg, validates it, stores via `setOptionValue('_entityId', parsedId)` before delegating to withAuth
- **Files modified:** packages/cli/src/commands/factory.ts

## Verification Results

- TypeScript type-check: PASS (no errors)
- `bukku --help`: Shows all 8 entity groups + config
- `bukku sales --help`: Shows 7 resource subcommands
- `bukku sales invoices list --help`: Shows all standard + entity-specific flags
- `bukku sales invoices get --help`: Shows `<id>` argument and --format
- `bukku accounting accounts --help`: Shows only `get` (no list, as expected)
- `bukku control-panel tags list --help`: Works correctly

## Self-Check: PASSED
