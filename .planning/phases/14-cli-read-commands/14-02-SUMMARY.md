---
phase: 14-cli-read-commands
plan: 02
subsystem: cli
tags: [cli, table-formatter, reference-data, search-accounts]
dependency_graph:
  requires: [cli-list-get-commands, core-bukku-client]
  provides: [cli-table-output, cli-reference-data-commands, cli-search-accounts]
  affects: [cli-write-commands]
tech_stack:
  added: []
  patterns: [per-resource-column-definitions, plain-text-table-rendering]
key_files:
  created:
    - packages/cli/src/commands/custom/reference-data.ts
    - packages/cli/src/commands/custom/search-accounts.ts
  modified:
    - packages/cli/src/output/table.ts
    - packages/cli/src/index.ts
decisions:
  - ref-data top-level group instead of nesting under accounting to avoid clutter
  - zero-dependency table formatter using string padding (no cli-table3 needed)
  - kept outputTable signature as (data, string[]) for backwards compat with factory
metrics:
  duration: 2min
  completed: "2026-03-14T09:12:19Z"
---

# Phase 14 Plan 02: Table Formatter + Reference Data Commands Summary

Real table formatter with 27 entity column layouts, 10 reference data commands via POST /v2/lists, and search-accounts custom command -- all zero external dependencies.

## Task Results

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Real table formatter with per-resource column definitions | f2cda97 | packages/cli/src/output/table.ts |
| 2 | Reference data commands + search-accounts + wiring | 97d1553 | packages/cli/src/commands/custom/reference-data.ts, packages/cli/src/commands/custom/search-accounts.ts, packages/cli/src/index.ts |

## Key Implementation Details

### Table Formatter (table.ts, 143 LOC)
- Column interface with key, header, width, align properties
- Helper functions: `col()`, `id()`, `transactionColumns()`, `paymentColumns`
- 27 entity-specific column layouts covering all CRUD entities
- Default columns (ID, Name, Description) for unknown entities
- Right-alignment for numeric fields (ID, Total, Amount, Price, Balance)
- Truncation with ellipsis for values exceeding column width
- Boolean display as "yes"/"no", null/undefined as empty string
- Empty results show "(no results)" message

### Reference Data Commands (reference-data.ts, 100 LOC)
- 10 commands under `bukku ref-data`: tax-codes, currencies, payment-methods, terms, accounts, price-levels, countries, classification-codes, numberings, states
- Each calls POST /v2/lists with the appropriate type
- Supports --format json|table flag
- No caching (CLI is short-lived, unlike MCP server)

### Search Accounts (search-accounts.ts, 60 LOC)
- Registered under `bukku accounting search-accounts`
- Options: --search, --category, --is-archived, --sort-by, --sort-dir, --page, --limit, --format
- Converts --is-archived boolean flag to string "true" for API
- Converts --limit to page_size parameter
- Uses 'account' entity column definitions for table output

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- TypeScript type-check: PASSED (zero errors)
- Build: PASSED
- `bukku ref-data --help`: Shows all 10 subcommands
- `bukku ref-data tax-codes --help`: Shows --format flag
- `bukku accounting search-accounts --help`: Shows all filter flags

## Self-Check: PASSED

- All 4 key files exist on disk
- Commits f2cda97 and 97d1553 verified in git log
