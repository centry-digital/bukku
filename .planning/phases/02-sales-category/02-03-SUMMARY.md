---
phase: 02-sales-category
plan: 03
subsystem: api
tags: [mcp, tool-descriptions, business-rules, status-lifecycle]

# Dependency graph
requires:
  - phase: 02-sales-category
    provides: "CrudEntityConfig type, factory pattern, 7 sales entity configs"
provides:
  - "Business-rule context in MCP tool descriptions for delete and status operations"
  - "LLM-facing status lifecycle documentation (draft -> ready -> void)"
  - "CrudEntityConfig.businessRules optional field for any entity"
affects: [03-purchases-category, 04-accounting-category]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Business rules declared in entity configs, surfaced in tool descriptions by factory"
    - "Proactive LLM guidance via tool descriptions rather than reactive error messages"

key-files:
  created: []
  modified:
    - "src/types/bukku.ts"
    - "src/tools/factory.ts"
    - "src/tools/configs/sales-invoice.ts"
    - "src/tools/configs/sales-quote.ts"
    - "src/tools/configs/sales-order.ts"
    - "src/tools/configs/delivery-order.ts"
    - "src/tools/configs/sales-credit-note.ts"
    - "src/tools/configs/sales-payment.ts"
    - "src/tools/configs/sales-refund.ts"

key-decisions:
  - "Business rules in tool descriptions (proactive) rather than error messages (reactive) -- LLM reads descriptions before calling tools"
  - "businessRules field is optional to maintain backward compatibility with configs that lack rules"

patterns-established:
  - "Entity config business rules pattern: declare delete/statusTransitions strings in config, factory appends to tool descriptions"
  - "All future entity categories (purchases, accounting) should follow same pattern for status lifecycle documentation"

# Metrics
duration: 2min
completed: 2026-02-08
---

# Phase 2 Plan 3: GAP-01 Closure Summary

**Business-rule context embedded in MCP tool descriptions so LLM knows draft-only delete constraints and draft->ready->void status lifecycle**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-08T07:28:42Z
- **Completed:** 2026-02-08T07:30:22Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Extended CrudEntityConfig with optional `businessRules` field (delete constraints + status transitions)
- Factory now appends business-rule text to delete and update-status tool descriptions when present
- All 7 sales entity configs declare that only draft documents can be deleted and that status flows draft -> ready -> void with no revert
- GAP-01 closed: LLM will see "Only draft invoices can be deleted" and "There is no way to revert a ready or void invoice back to draft" in tool descriptions

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend CrudEntityConfig type and update factory** - `f043be0` (feat)
2. **Task 2: Add business rules to all 7 sales entity configs** - `1a78deb` (feat)

## Files Created/Modified
- `src/types/bukku.ts` - Added optional `businessRules` field with `delete` and `statusTransitions` sub-fields to CrudEntityConfig
- `src/tools/factory.ts` - Delete and status tool descriptions now append business-rule text from config
- `src/tools/configs/sales-invoice.ts` - Business rules for invoice delete constraints and status lifecycle
- `src/tools/configs/sales-quote.ts` - Business rules for quote delete constraints and status lifecycle
- `src/tools/configs/sales-order.ts` - Business rules for order delete constraints and status lifecycle
- `src/tools/configs/delivery-order.ts` - Business rules for delivery order delete constraints and status lifecycle
- `src/tools/configs/sales-credit-note.ts` - Business rules for credit note delete constraints and status lifecycle
- `src/tools/configs/sales-payment.ts` - Business rules for payment delete constraints and status lifecycle
- `src/tools/configs/sales-refund.ts` - Business rules for refund delete constraints and status lifecycle

## Decisions Made
- Business rules placed in tool descriptions (proactive guidance) rather than error messages (reactive) -- the LLM reads tool descriptions before making calls, enabling correct decisions upfront
- `businessRules` field is optional on CrudEntityConfig to maintain backward compatibility; configs without it produce identical descriptions as before

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- GAP-01 is closed; Phase 2 (Sales Category) is fully complete
- The `businessRules` pattern is established and should be replicated for Phase 3 (Purchases) and Phase 4 (Accounting) entity configs
- All 42 MCP tools now carry business-rule context in their descriptions where applicable

## Self-Check: PASSED

All 9 modified files verified present. Both task commits (f043be0, 1a78deb) verified in git log.

---
*Phase: 02-sales-category*
*Completed: 2026-02-08*
