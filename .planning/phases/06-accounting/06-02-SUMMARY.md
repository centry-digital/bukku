---
phase: 06-accounting
plan: 02
subsystem: accounting-entities
status: complete
completed_date: 2026-02-08
duration_minutes: 2

tags:
  - entity-config
  - crud-factory
  - custom-tools
  - chart-of-accounts

dependency_graph:
  requires:
    - "Phase 1 CRUD factory (registerCrudTools function)"
    - "Phase 1 error transformers (transformHttpError, transformNetworkError)"
    - "src/types/bukku.ts (CrudEntityConfig interface)"
  provides:
    - "journalEntryConfig: list, get, delete operations with status update"
    - "accountConfig: get, create, update, delete (no list to avoid Phase 5 collision)"
    - "registerAccountCustomTools: search-accounts, archive-account, unarchive-account"
  affects:
    - "Phase 6 registry (will wire these configs in 06-03)"
    - "Chart of accounts search capabilities"

tech_stack:
  added:
    - "journal-entry entity config with double-entry validation note"
    - "account entity config with custom list handling"
    - "search-accounts with category and archived status filtering"
  patterns:
    - "Custom tools for archive/unarchive (boolean is_archived pattern)"
    - "Boolean-to-string conversion for query parameters"
    - "Separation of concerns: list-accounts (quick cached lookup) vs search-accounts (filtered search)"

key_files:
  created:
    - path: "src/tools/configs/journal-entry.ts"
      loc: 28
      exports: ["journalEntryConfig"]
    - path: "src/tools/configs/account.ts"
      loc: 28
      exports: ["accountConfig"]
    - path: "src/tools/custom/account-tools.ts"
      loc: 143
      exports: ["registerAccountCustomTools"]
  modified: []

decisions:
  - id: "ACCT-02-1"
    decision: "Journal entry config omits create and update operations"
    rationale: "Create and update require double-entry validation (debits == credits) which needs custom tools, not generic CRUD factory tools"
    alternatives: "Could have used factory tools with pre-validation, but custom tools provide clearer error messages and business-rule enforcement"
    impact: "Custom journal-entry-tools.ts module will be created in future plan"

  - id: "ACCT-02-2"
    decision: "Account config omits list operation"
    rationale: "Phase 5's list-accounts reference data tool already occupies that tool name and provides cached quick lookup functionality"
    alternatives: "Could rename one of the tools, but search-accounts is more descriptive for filtered queries"
    impact: "No tool name collision. Users get both quick lookup (list-accounts) and advanced filtering (search-accounts)"

  - id: "ACCT-02-3"
    decision: "Convert boolean is_archived to string for query parameters"
    rationale: "BukkuClient.get() signature requires Record<string, string | number | undefined>, but Zod schema uses boolean for better type safety"
    alternatives: "Could change Zod schema to string, but boolean is more semantically accurate"
    impact: "Manual conversion in handler function. Pattern can be reused for other boolean query parameters"

metrics:
  tasks_completed: 2
  tasks_total: 2
  commits: 2
  files_created: 3
  tests_added: 0
  lines_of_code: 199

---

# Phase 06 Plan 02: Entity Configs & Custom Tools Summary

**One-liner:** Created journal entry and account entity configs with custom account tools (search with category/archived filtering, archive, unarchive).

## What Was Built

### Entity Configurations

**Journal Entry Config** (`src/tools/configs/journal-entry.ts`):
- Operations: `list`, `get`, `delete` (omits create/update for custom validation)
- Status updates: Enabled (`hasStatusUpdate: true`)
- Response keys: `transaction` (singular), `transactions` (plural)
- Business rules:
  - Delete constraint: Only draft and void entries deletable
  - Status transitions: draft → ready, ready → void (final)
- Note: Create/update deferred to custom tools for double-entry validation

**Account Config** (`src/tools/configs/account.ts`):
- Operations: `get`, `create`, `update`, `delete` (omits list to avoid Phase 5 collision)
- Status updates: Disabled (archive uses custom tools)
- Response keys: `account` (singular), `accounts` (plural)
- Business rules:
  - Delete constraint: Only accounts with no children, not in locked system type, and not used in transactions
- Note: Phase 5's `list-accounts` provides cached lookup; `search-accounts` provides filtered search

### Custom Account Tools

**search-accounts** (`src/tools/custom/account-tools.ts`):
- Filtered chart of accounts search via GET /accounts
- Parameters:
  - `search`: Search by name, code, or description
  - `category`: Filter by account type (assets, liabilities, equity, income, expenses)
  - `is_archived`: Show archived accounts (default: false)
  - `sort_by`: Sort field (code, name, balance)
  - `sort_dir`: Sort direction (asc, desc)
  - `page`, `page_size`: Pagination
- Converts boolean `is_archived` to string for query parameter compatibility

**archive-account** / **unarchive-account**:
- Archive/unarchive via PATCH /accounts/:id with `{ is_archived: boolean }`
- Follows contact-archive.ts and product-archive.ts patterns
- Returns 3 tools total from `registerAccountCustomTools`

## Deviations from Plan

**None** - plan executed exactly as written. All entity configs and custom tools created according to specification.

## Verification Results

### TypeScript Compilation
```bash
npx tsc --noEmit
```
**Result:** All files compile with zero errors. Entity configs match CrudEntityConfig interface. Custom tools follow established patterns.

### Success Criteria
- [x] journalEntryConfig exports valid config with operations ["list", "get", "delete"], hasStatusUpdate true, and business rules
- [x] accountConfig exports valid config with operations ["get", "create", "update", "delete"] (no list), hasStatusUpdate false, and delete business rules
- [x] registerAccountCustomTools registers 3 tools (search-accounts, archive-account, unarchive-account)
- [x] search-accounts supports category, is_archived, search, sort_by, sort_dir, page, page_size parameters
- [x] No tool name collisions with Phase 5 list-accounts
- [x] All files compile with zero TypeScript errors

## Technical Highlights

### Boolean Query Parameter Handling
The search-accounts tool demonstrates a pattern for handling boolean query parameters with TypeScript type safety:

```typescript
const queryParams: Record<string, string | number | undefined> = {
  search: params.search,
  category: params.category,
  // ... other params
};

// Convert boolean to string if provided
if (params.is_archived !== undefined) {
  queryParams.is_archived = params.is_archived ? "true" : "false";
}
```

This preserves Zod's boolean type checking while satisfying BukkuClient's string/number parameter requirement.

### Tool Name Collision Avoidance
By omitting the `list` operation from accountConfig, we avoid collision with Phase 5's `list-accounts` reference data tool. This creates a clean separation:
- `list-accounts`: Quick cached lookup of all accounts (reference data)
- `search-accounts`: Advanced filtered search with pagination (custom tool)

### Business Rules Documentation
Both configs include comprehensive business rules that will be embedded in MCP tool descriptions:
- Delete constraints guide LLM to use archive instead of delete when appropriate
- Status transition rules prevent invalid state changes

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| a240858 | feat | Add journal entry and account entity configs |
| 20d5a9c | feat | Add account custom tools (search, archive, unarchive) |

## Next Phase Readiness

**Blockers:** None

**Next Steps:**
1. Plan 06-03: Wire journal entry and account configs into registry
2. Future plan: Create custom journal-entry-tools.ts for create/update with double-entry validation

## Self-Check: PASSED

**Created files exist:**
```
FOUND: src/tools/configs/journal-entry.ts
FOUND: src/tools/configs/account.ts
FOUND: src/tools/custom/account-tools.ts
```

**Commits exist:**
```
FOUND: a240858
FOUND: 20d5a9c
```

All claims verified.
