---
phase: 06-accounting
plan: 01
subsystem: validation
tags: [tdd, validation, accounting, double-entry]

dependency_graph:
  requires: []
  provides:
    - validateDoubleEntry function for journal entry validation
  affects:
    - Future journal entry tools (06-02, 06-03)

tech_stack:
  added: []
  patterns:
    - TDD with Node.js built-in test runner
    - Epsilon-based floating-point comparison for currency
    - Conversational error messages with detailed diagnostics

key_files:
  created:
    - src/tools/validation/double-entry.ts
    - src/tools/validation/double-entry.test.ts
  modified: []

decisions:
  - decision: Use 0.01 epsilon tolerance for debit/credit comparison
    rationale: Currency has 2 decimal places precision; differences below 1 cent are acceptable rounding artifacts
    impact: Prevents false negatives from floating-point arithmetic
  - decision: Default minimum 2 lines, configurable via parameter
    rationale: Double-entry requires at least one debit and one credit; API may not enforce this
    impact: Clear client-side validation with helpful error message
  - decision: Include totals, difference, and explanation in error message
    rationale: Claude needs specific amounts to self-correct unbalanced entries
    impact: Conversational errors enable LLM to fix issues without user intervention

metrics:
  duration_seconds: 89
  test_count: 17
  commits: 2
  files_created: 2
  completed_date: 2026-02-08
---

# Phase 6 Plan 1: Double-Entry Validation Summary

**One-liner:** TDD implementation of validateDoubleEntry function with epsilon-tolerant balance checking and minimum line count validation.

## What Was Built

Created the double-entry accounting validation function that ensures journal entry debits equal credits before API submission. This provides Claude with immediate, conversational error messages instead of raw API errors.

**Core functionality:**
- `validateDoubleEntry(lines, minLines?)` validates journal entry line items
- Returns `{ valid: boolean, error?: string }`
- Epsilon tolerance (0.01) handles floating-point precision issues
- Minimum line count validation (default 2 lines)
- Detailed error messages with formatted totals and difference

**Test coverage:**
- 17 tests across 4 test suites
- Balanced entries (7 tests): simple, multi-line, floating-point, zero amounts, missing fields, both debit/credit on single line
- Unbalanced entries (2 tests): error message format, both debit > credit and credit > debit
- Minimum line count (4 tests): default minimum, empty entry, custom minimum, acceptance
- Edge cases (4 tests): sub-epsilon differences, epsilon boundary, large amounts, many lines

## TDD Execution

**RED Phase:**
- Wrote 17 comprehensive tests covering all behavior specified in plan
- Tests failed with ERR_MODULE_NOT_FOUND (expected - implementation doesn't exist)
- Committed failing tests: `238867a`

**GREEN Phase:**
- Implemented validateDoubleEntry function with all required logic
- All 17 tests passing
- Committed passing implementation: `8445057`

**REFACTOR Phase:**
- No refactoring needed - code clean, well-documented, follows established patterns

## Verification Results

```bash
npx tsx --test src/tools/validation/double-entry.test.ts
```

**Output:**
- tests: 17
- suites: 5
- pass: 17
- fail: 0
- duration_ms: 205.536

All success criteria met:
- ✓ validateDoubleEntry correctly validates balanced entries
- ✓ validateDoubleEntry rejects unbalanced entries with formatted error message showing totals and difference
- ✓ validateDoubleEntry rejects entries with fewer than 2 lines
- ✓ Floating-point edge cases handled (0.01 epsilon tolerance)
- ✓ All tests pass with Node.js built-in test runner

## Deviations from Plan

None - plan executed exactly as written.

## Implementation Highlights

### Epsilon Tolerance

```typescript
const difference = Math.abs(totalDebits - totalCredits);
const EPSILON = 0.01;

if (difference >= EPSILON) {
  return { valid: false, error: "..." };
}
```

Using 0.01 instead of Number.EPSILON because currency precision is 2 decimal places. Differences smaller than 1 cent are acceptable rounding artifacts from floating-point arithmetic.

### Conversational Error Messages

```typescript
error: `Journal entry is unbalanced. Total debits: ${totalDebits.toFixed(2)}, Total credits: ${totalCredits.toFixed(2)}. Difference: ${difference.toFixed(2)}. Debits must equal credits in double-entry accounting.`
```

Error message includes:
- Clear problem statement ("unbalanced")
- Specific totals (formatted to 2 decimal places)
- Difference amount (formatted)
- Contextual explanation (double-entry accounting rule)

This enables Claude to self-correct by adjusting line item amounts to close the gap.

### Minimum Line Count

```typescript
if (lines.length < minLines) {
  const lineWord = lines.length === 1 ? "line" : "lines";
  return {
    valid: false,
    error: `Journal entries require at least ${minLines} line items (minimum one debit and one credit). This entry has ${lines.length} ${lineWord}.`,
  };
}
```

Validates minimum 2 lines (configurable) to enforce double-entry principle. Proper grammar handling (1 line vs 2 lines) for clearer messaging.

## Files Created

**src/tools/validation/double-entry.ts** (86 lines)
- `JournalEntryLine` interface (debit?, credit?, extensible)
- `ValidationResult` interface (valid, error?)
- `validateDoubleEntry()` function (main validation logic)
- Comprehensive JSDoc with examples

**src/tools/validation/double-entry.test.ts** (167 lines)
- 17 test cases across 4 test suites
- Tests balanced entries, unbalanced entries, minimum line count, edge cases
- Uses Node.js built-in test runner (node:test, node:assert)

## Next Phase Readiness

**Blocks:** Nothing

**Enables:**
- Plan 06-02: Journal entry and account entity configurations can reference validateDoubleEntry
- Plan 06-03: Journal entry tools can import and use validateDoubleEntry before API calls

**Dependencies satisfied:**
- None (this is the first plan in Phase 6)

**Dependencies introduced:**
- Future plans must import from `src/tools/validation/double-entry.js`
- Journal entry create/update tools must call validateDoubleEntry before API submission

## Key Decisions for Future Plans

1. **Validation integration point:** Call validateDoubleEntry in journal entry create/update handlers before client.post() or client.put()
2. **Error handling:** Return validation.error as MCP error response if validation fails (don't proceed with API call)
3. **Line item structure:** JournalEntryLine interface uses optional debit/credit fields (treats missing as 0)
4. **Minimum lines:** Default 2 lines is appropriate for journal entries; custom minimum not needed in practice

## Commits

| Hash | Message | Files |
|------|---------|-------|
| 238867a | test(06-01): add failing test for double-entry validation | src/tools/validation/double-entry.test.ts |
| 8445057 | feat(06-01): implement double-entry validation | src/tools/validation/double-entry.ts |

## Self-Check: PASSED

**Created files verified:**
```bash
[ -f "src/tools/validation/double-entry.ts" ] && echo "FOUND"
# FOUND

[ -f "src/tools/validation/double-entry.test.ts" ] && echo "FOUND"
# FOUND
```

**Commits verified:**
```bash
git log --oneline --all | grep -q "238867a" && echo "FOUND"
# FOUND

git log --oneline --all | grep -q "8445057" && echo "FOUND"
# FOUND
```

**Exports verified:**
```bash
grep -q "export function validateDoubleEntry" src/tools/validation/double-entry.ts && echo "FOUND"
# FOUND

grep -q "export interface JournalEntryLine" src/tools/validation/double-entry.ts && echo "FOUND"
# FOUND

grep -q "export interface ValidationResult" src/tools/validation/double-entry.ts && echo "FOUND"
# FOUND
```

All files created, all commits present, all exports available. Plan 06-01 complete.
