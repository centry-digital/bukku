---
phase: 04-banking-contacts
plan: 01
subsystem: api
tags: [crud-config, banking, contacts, mcp-tools, archive]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: CrudEntityConfig interface, CRUD factory, error transforms, BukkuClient
provides:
  - 3 banking CrudEntityConfig objects (bank-money-in, bank-money-out, bank-transfer)
  - 2 contact CrudEntityConfig objects (contact, contact-group)
  - Custom contact archive/unarchive tools (registerContactArchiveTools)
affects: [04-02-registry-wiring]

# Tech tracking
tech-stack:
  added: []
  patterns: [custom-wrapper-keys, custom-tools-for-non-standard-api-patterns]

key-files:
  created:
    - src/tools/configs/bank-money-in.ts
    - src/tools/configs/bank-money-out.ts
    - src/tools/configs/bank-transfer.ts
    - src/tools/configs/contact.ts
    - src/tools/configs/contact-group.ts
    - src/tools/custom/contact-archive.ts
  modified: []

key-decisions:
  - "Contact archive uses PATCH with is_archived boolean, not factory status tool"
  - "Bank transfer has only account_id filter (no contact_id, no email_status)"
  - "Contact and contact-group use custom wrapper keys (contact/contacts, group/groups) instead of transaction/transactions"

patterns-established:
  - "Custom tools pattern: registerXxxTools(server, client) returns tool count, for non-standard API operations"
  - "Non-transaction entities: singularKey/pluralKey can be any value, not just transaction/transactions"

# Metrics
duration: 2min
completed: 2026-02-08
---

# Phase 4 Plan 1: Entity Configs & Custom Tools Summary

**5 CrudEntityConfig objects (3 banking, 2 contacts) and 2 custom archive tools using PATCH with is_archived boolean**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-08T12:47:08Z
- **Completed:** 2026-02-08T12:49:08Z
- **Tasks:** 3
- **Files created:** 6

## Accomplishments
- Created 3 banking entity configs (money-in, money-out, transfer) with correct API paths, filters, and shared status lifecycle
- Created 2 contact entity configs with custom wrapper keys (first non-transaction entities)
- Created custom archive/unarchive tools that send is_archived boolean via PATCH instead of factory status pattern
- Bank transfer correctly uses reduced filter set (account_id only) per user decision

## Task Commits

Each task was committed atomically:

1. **Task 1: Create 3 banking entity configs** - `aabfdd4` (feat)
2. **Task 2: Create 2 contact entity configs** - `0c94983` (feat)
3. **Task 3: Create custom contact archive/unarchive tools** - `46bc5c9` (feat)

## Files Created/Modified
- `src/tools/configs/bank-money-in.ts` - Bank money in config: /banking/incomes, contact_id + account_id + email_status filters
- `src/tools/configs/bank-money-out.ts` - Bank money out config: /banking/expenses, same filters as money in
- `src/tools/configs/bank-transfer.ts` - Bank transfer config: /banking/transfers, account_id only (account-to-account, no contact)
- `src/tools/configs/contact.ts` - Contact config: /contacts, custom wrapper keys (contact/contacts), hasStatusUpdate false
- `src/tools/configs/contact-group.ts` - Contact group config: /contacts/groups, custom wrapper keys (group/groups), minimal config
- `src/tools/custom/contact-archive.ts` - Custom archive/unarchive tools using PATCH with is_archived boolean

## Decisions Made
- Contact archive/unarchive handled by custom tools (not factory status tool) because API expects `{ is_archived: boolean }` not `{ status: string }`
- Bank transfer has only `["account_id"]` in listFilters — no contact_id or email_status since transfers are account-to-account movements
- Contacts and contact groups use custom response wrapper keys (contact/contacts and group/groups) — first entities to break from the transaction/transactions pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 5 CrudEntityConfig objects ready for registry wiring in Plan 02
- Custom registerContactArchiveTools function ready for registry integration
- All 6 files compile cleanly with zero TypeScript errors
- Established custom tools directory (src/tools/custom/) for future non-standard tool patterns

## Self-Check: PASSED

All 6 created files verified present. All 3 task commits verified in git log.

---
*Phase: 04-banking-contacts*
*Completed: 2026-02-08*
