# Project State: Bukku MCP Server

**Last updated:** 2026-02-08

## Project Reference

**Core Value:** Claude can read and write accounting data in Bukku reliably, so the user can do bookkeeping work through natural conversation instead of manual data entry.

**Current Focus:** Phase 6 (Accounting) — In Progress (Entity configs complete)

## Current Position

**Active Phase:** Phase 6 - Accounting
**Active Plan:** 2 of 3
**Plan Status:** In progress
**Current Task:** N/A
**Last activity:** 2026-02-08 - Completed 06-02-PLAN.md (Entity Configs & Custom Tools)

**Progress:**
```
[████████████████████████████████████████░░░░░░░░░░] 71% (5/7 phases complete)
Phase 6: [████████░░░░] 67% (2/3 plans complete)
```

## Performance Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Phases Complete | 5 | 7 | On Track |
| Plans Complete | 18 | TBD | On Track |
| Requirements Delivered | 0 | 80 | On Track |
| Blockers | 0 | 0 | Green |

## Accumulated Context

### Key Decisions

| Phase-Plan | Decision | Rationale | Impact |
|------------|----------|-----------|--------|
| 01-01 | Use ESM (type: module) for Node16 module resolution | Modern Node.js compatibility and better tree-shaking | Foundation for all modules |
| 01-01 | Fail-fast on missing environment variables with setup checklist | Invalid/missing credentials cause immediate process.exit(1) | Prevents silent auth failures, clearer debugging |
| 01-01 | Validate token on startup via /contacts endpoint | Verify token works before serving tools | Early detection of auth issues |
| 01-01 | All logging goes to stderr to preserve MCP stdio protocol | stdout reserved for protocol messages | MCP protocol compliance |
| 01-02 | Conversational tone for all error messages | Messages relayed by Claude should sound helpful, not technical | User experience improvement |
| 01-02 | 401 errors mention BUKKU_API_TOKEN explicitly | Authentication is critical - make troubleshooting obvious | Faster debugging |
| 01-02 | Show all validation errors at once | Avoid whack-a-mole iteration cycles | Better developer experience |
| 01-02 | Use Node.js built-in test runner | Zero test dependencies with native TypeScript support | Simpler dependency management |
| 01-03 | Hand-craft types from OpenAPI specs | OpenAPI specs have missing $ref files, auto-gen would fail | Types accurate, verified against schemas |
| 01-03 | Use generic response wrappers (BukkuPaginatedResponse<T>, BukkuSingleResponse<T>) | All Bukku endpoints follow same pattern | Supports all 55+ entities without duplication |
| 01-03 | Include CrudEntityConfig interface | Factory needs type-safe configuration | Prevents config errors in tool generation |
| 01-04 | Factory generates tools with kebab-case names without prefix | Per locked decision: list-sales-invoices, not list_sales_invoices | Consistent naming across all 55+ tools |
| 01-04 | Dedicated update-status tools for entities that support status changes | Status updates are common operations, deserve dedicated tools | Clearer tool purpose vs generic update |
| 01-04 | Registry is empty in Phase 1, configs added in Phase 2+ | Complete infrastructure first, add business logic incrementally | Phase 1 validates architecture without entity code |
| 01-04 | Use z.record(z.string(), z.unknown()) for flexible data inputs | Create/update tools accept any fields to forward to Bukku API | Maximum flexibility - Bukku API validates fields |
| 02-01 | Entity-specific list filters per OpenAPI spec | Each entity config declares its own listFilters array | Different sales entities support different filter parameters (invoice has payment_status, payment has payment_mode, etc.) |
| 02-01 | All 7 sales entities support uniform operations | All configs enable all 5 CRUD operations + status updates | OpenAPI spec shows all sales transaction types support full CRUD + status changes |
| 02-02 | Sequential registration over loop for entity configs | Explicit calls to registerCrudTools for each config | Easier to read, debug, and maintain. Clear tool count tracking per entity |
| 02-03 | Business rules in tool descriptions (proactive) not error messages (reactive) | LLM reads tool descriptions before calling tools, enabling correct decisions upfront | Prevents invalid recovery suggestions like reverting ready invoices to draft |
| 02-03 | businessRules field is optional on CrudEntityConfig | Backward compatibility with configs that lack rules | Non-breaking change, future entity categories can adopt incrementally |
| 03-01 | Corrected delete to "draft and void" (not "draft only") | Both draft and void transactions are deletable per API behavior | All 13 entity configs use consistent delete constraint |
| 03-01 | Added pending_approval to status lifecycle | Approval workflow: draft -> pending_approval -> ready is valid path | Accurate status guidance prevents failed operations |
| 03-02 | Bills/credit notes omit email_status filter | OpenAPI purchase.yaml confirms these entities lack email_status | Accurate filter lists match API spec |
| 03-02 | Bills include payment_mode with 'claim' option | Purchase-specific expense claims/reimbursement scenario | JSDoc documents purchase-specific business context |
| 03-03 | Sequential registration in workflow order (order -> GRN -> bill -> credit -> payment -> refund) | Mirrors sales pattern for consistency and readability | Registry easy to scan, reflects business flow |
| 04-01 | Contact archive uses PATCH with is_archived boolean, not factory status tool | API expects { is_archived: boolean } not { status: string } | Custom tools needed for non-standard API patterns |
| 04-01 | Bank transfer has only account_id filter (no contact_id, no email_status) | Transfers are account-to-account, no contact involved | Accurate filter set matches API spec |
| 04-01 | Contacts use custom wrapper keys (contact/contacts, group/groups) | First non-transaction entities break from transaction/transactions pattern | Validates CrudEntityConfig flexibility |
| 05-02 | 5-minute TTL for reference data cache | Reference data changes infrequently, caching reduces redundant API calls during a session | Transparent performance improvement, configurable for testing |
| 05-02 | Cache key = reference data type name (e.g., "tax_codes") | Matches POST /v2/lists request structure, simple and predictable | One-to-one mapping between API type and cache entry |
| 05-02 | 10 reference data types for initial implementation | Covers all core reference data needed for products, invoices, and transactions | Comprehensive reference data access for business operations |
| 05-03 | ReferenceDataCache instantiated inside registerAllTools with default 5-minute TTL | Cache lifecycle tied to server instance, simple instantiation pattern | Cache available to reference data tools without global state |
| 05-03 | Registry organized by phase with clear comment blocks and tool counts | Phase-based organization with inline documentation for maintenance | Easy to scan, understand tool distribution, and validate counts |
| 05-03 | Product entities registered before custom tools (established pattern from Phase 4) | Factory tools first, then custom tools that extend their capabilities | Consistent registration order across all phases |
| 05-04 | 500 errors include response body to debug Bukku's incorrect status codes | Bukku API sometimes returns validation errors as 500 instead of 400 - including body surfaces hidden details | Improved debugging experience, faster issue resolution |
| 05-04 | Product bundles have no list operation - users directed to list-products with type=bundle | Bukku API has no GET /products/bundles endpoint - bundles listed via GET /products?type=bundle | Eliminates phantom tool, guides users to correct approach, accurate tool count (136 not 137) |
| 06-01 | Use 0.01 epsilon tolerance for debit/credit comparison | Currency has 2 decimal places precision; differences below 1 cent are acceptable rounding artifacts | Prevents false negatives from floating-point arithmetic in journal entry validation |
| 06-01 | Include totals, difference, and explanation in validation error messages | Claude needs specific amounts to self-correct unbalanced journal entries | Conversational errors enable LLM to fix issues without user intervention |
| 06-02 | Journal entry config omits create and update operations | Create/update require double-entry validation which needs custom tools, not generic CRUD factory | Custom journal-entry-tools.ts module will be created in future plan |
| 06-02 | Account config omits list operation | Phase 5's list-accounts reference data tool already occupies that tool name | No tool name collision. Users get both quick lookup (list-accounts) and advanced filtering (search-accounts) |
| 06-02 | Convert boolean is_archived to string for query parameters | BukkuClient.get() signature requires string/number, but Zod schema uses boolean for type safety | Manual conversion in handler. Pattern reusable for other boolean query parameters |

### Active TODOs

*None - Phase 6 in progress, ready for 06-03*

### Blockers

*No blockers*

### Recent Changes

- **2026-02-08:** Completed plan 06-02 (Entity Configs & Custom Tools) - Created journal entry config (list, get, delete with status update) and account config (get, create, update, delete - no list to avoid Phase 5 collision). Added 3 custom account tools: search-accounts with category/archived filtering, archive-account, unarchive-account. Commits: a240858, 20d5a9c.
- **2026-02-08:** Completed plan 06-01 (Double-Entry Validation) - TDD implementation of validateDoubleEntry function with epsilon tolerance (0.01), minimum line count validation, and conversational error messages. All 17 tests passing.
- **2026-02-08:** Completed plan 05-04 (Gap Closure) - Fixed two UAT issues: enhanced 500 errors to include response body (surfaces hidden validation errors), removed phantom list-product-bundles tool. Tool count corrected from 137 to 136.
- **2026-02-08:** Completed plan 05-03 (Registry Wiring) - Wired all Phase 5 entities into registry, producing 137-tool MCP server (108 prior + 29 new).
- **2026-02-08:** Completed plan 05-02 (Reference Data Cache & Tools) - Created ReferenceDataCache class with 5-minute TTL and 10 reference data list tools using POST /v2/lists endpoint
- **2026-02-08:** Completed plan 05-01 (Product Catalog Configurations) - Created 3 product entity configs (product, bundle, group) and 4 custom archive tools
- **2026-02-08:** Completed plan 04-02 (Registry Wiring) - Wired all Phase 4 entities into registry, producing 108-tool MCP server (78 prior + 30 new)
- **2026-02-08:** Completed plan 04-01 (Entity Configs & Custom Tools) - Created 5 CrudEntityConfig objects (3 banking, 2 contacts) and 2 custom archive tools
- **2026-02-08:** Completed plan 03-03 (Purchase Registry Wiring) - Wired all 6 purchase entity configs into registry, producing 78 total working MCP tools (42 sales + 36 purchases)
- **2026-02-08:** Completed plan 03-02 (Purchase Entity Configurations) - Created 6 purchase entity configs with corrected business rules
- **2026-02-08:** Completed plan 03-01 (Correct Sales Business Rules) - Fixed delete constraints (draft+void) and added pending_approval status to all 7 sales entity configs
- **2026-02-08:** Completed plan 02-03 (GAP-01 Closure) - Business-rule context embedded in MCP tool descriptions for delete constraints and status lifecycle
- **2026-02-07:** Completed plan 02-02 (Tool Registry Wiring) - Wired all 7 sales entity configs into registry, producing 42 working MCP tools
- **2026-02-07:** Completed plan 02-01 (Sales Entity Configurations) - Created 7 CrudEntityConfig objects for all sales transaction types, ready for registry wiring

## Session Continuity

**Last session:** 2026-02-08
**Stopped at:** Phase 6 plan 2 of 3 complete
**Resume file:** .planning/phases/06-accounting/06-02-SUMMARY.md

**What just happened:** Executed plan 06-02 (Entity Configs & Custom Tools). Created journalEntryConfig (list, get, delete operations with status update - omits create/update for custom validation) and accountConfig (get, create, update, delete - omits list to avoid collision with Phase 5's list-accounts). Created 3 custom account tools: search-accounts (filtered chart of accounts search with category/archived filtering), archive-account, unarchive-account. Boolean-to-string conversion pattern for query parameters. All TypeScript compiles cleanly. Two commits: a240858 (configs), 20d5a9c (custom tools).

**What's next:** Plan 06-03 (Registry Wiring)

**Context for next session:**
- Phase 6 in progress: 2 of 3 plans done
- Entity configs ready: src/tools/configs/journal-entry.ts, src/tools/configs/account.ts
- Custom tools ready: src/tools/custom/account-tools.ts (3 tools)
- No tool name collisions with Phase 5
- Commits: a240858, 20d5a9c

---
*State tracking since: 2026-02-06*
