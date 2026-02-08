---
phase: 05-products-lists
plan: 02
subsystem: reference-data
tags: [cache, custom-tools, reference-data, lists-endpoint]
dependency_graph:
  requires:
    - 01-02 (error transformation)
    - 01-03 (BukkuClient)
  provides:
    - ReferenceDataCache class
    - registerReferenceDataTools function
  affects:
    - 05-03 (registry wiring - will consume these tools)
tech_stack:
  added:
    - In-memory Map-based cache with TTL
  patterns:
    - Cache-first data access (check cache before API call)
    - Lazy deletion on expired entries
    - Custom tool registration for non-CRUD endpoints
key_files:
  created:
    - src/tools/cache/reference-cache.ts
    - src/tools/custom/reference-data.ts
  modified: []
decisions:
  - decision: 5-minute TTL for reference data cache
    rationale: Reference data changes infrequently, caching reduces redundant API calls during a session
    impact: Transparent performance improvement, configurable for testing
  - decision: Cache key = reference data type name (e.g., "tax_codes")
    rationale: Matches POST /v2/lists request structure, simple and predictable
    impact: One-to-one mapping between API type and cache entry
  - decision: 10 reference data types for initial implementation
    rationale: Covers all core reference data needed for products, invoices, and transactions
    impact: Comprehensive reference data access for business operations
metrics:
  duration: 1m 19s
  completed: 2026-02-08
---

# Phase 5 Plan 02: Reference Data Cache & Tools Summary

**One-liner:** Created in-memory cache with 5-minute TTL and 10 reference data list tools using POST /v2/lists endpoint.

## Objective

Create reference data cache and custom reference data list tools that fetch from Bukku's unified POST /v2/lists endpoint with transparent 5-minute TTL caching.

## Work Completed

### Task 1: Create ReferenceDataCache class
**Status:** Complete
**Commit:** d7593dc

Created `src/tools/cache/reference-cache.ts` with Map-based in-memory cache:
- 5-minute TTL (configurable via constructor for testing)
- Lazy deletion: expired entries removed on access, not on timer
- Methods: get, set, invalidate, clear
- Generic type support for type-safe cache access
- Comprehensive JSDoc documentation

**Files created:**
- src/tools/cache/reference-cache.ts (75 lines)

### Task 2: Create custom reference data list tools
**Status:** Complete
**Commit:** 6de739b

Created `src/tools/custom/reference-data.ts` with 10 reference data list tools:
- All tools use POST /v2/lists endpoint (per API spec)
- Cache-first pattern: check cache before API call, store on miss
- Cross-reference descriptions explain when to use each tool
- No required parameters (reference data lists are simple fetches)

**Reference data types implemented:**
1. tax_codes → list-tax-codes
2. currencies → list-currencies
3. payment_methods → list-payment-methods
4. terms → list-terms
5. accounts → list-accounts
6. price_levels → list-price-levels
7. countries → list-countries
8. classification_code_list → list-classification-codes
9. numberings → list-numberings
10. state_list → list-states

**Files created:**
- src/tools/custom/reference-data.ts (126 lines)

## Deviations from Plan

None - plan executed exactly as written.

## Testing & Verification

**Verification performed:**
- ✓ TypeScript compilation passed (npx tsc --noEmit)
- ✓ src/tools/cache/ directory exists
- ✓ ReferenceDataCache has get, set, invalidate, clear methods
- ✓ 5-minute TTL default configured
- ✓ 10 reference data types defined
- ✓ All imports resolve correctly
- ✓ registerReferenceDataTools function signature matches expected pattern

## Next Steps

**Immediate (Plan 03):**
- Wire ReferenceDataCache and registerReferenceDataTools into main registry
- Instantiate cache at server startup
- Register reference data tools after product tools
- Update tool count in server startup log

**Future considerations:**
- Cache warming: Pre-populate cache with all reference data on startup
- Cache invalidation: Webhook support for reference data updates
- Metrics: Track cache hit rate for optimization

## Self-Check

**Files created:**
```
✓ FOUND: src/tools/cache/reference-cache.ts
✓ FOUND: src/tools/custom/reference-data.ts
```

**Commits created:**
```
✓ FOUND: d7593dc (Task 1: ReferenceDataCache class)
✓ FOUND: 6de739b (Task 2: reference data list tools)
```

## Self-Check: PASSED

All files and commits verified present in repository.
