# Phase 3: Purchases Category - Research

**Researched:** 2026-02-08
**Domain:** Bukku Purchases API Integration using Validated Factory Pattern
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Entity structure
- 6 purchase entities (no quote equivalent): purchase order, goods received note, bill, credit note, payment, refund
- All 6 support uniform operations: list, get, create, update, delete, update-status (36 tools total)
- All use `transaction`/`transactions` as response wrapper keys (same as sales)

#### API endpoint & filter parity
- Follow the OpenAPI spec exactly for each entity's available filters
- Purchase Order: `contact_id`, `email_status`, `transfer_status`
- Goods Received Note: `contact_id`, `email_status`, `transfer_status`
- Bill: `contact_id`, `payment_status`, `payment_mode` (credit/cash/claim — 'claim' is purchase-specific for expense claims)
- Credit Note: `contact_id`, `payment_status`
- Payment: `contact_id`, `email_status`, `payment_status`, `account_id`
- Refund: `contact_id`, `email_status`, `payment_status`, `account_id`
- Standard filters (search, date_from, date_to, status, page, page_size, sort_by, sort_dir) handled by factory

#### Naming & tool descriptions
- Entity names match Bukku API naming: `purchase-order`, `goods-received-note`, `purchase-bill`, `purchase-credit-note`, `purchase-payment`, `purchase-refund`
- Keep full 'goods-received-note' name (no abbreviation to GRN)
- Tool names follow existing pattern: `list-purchase-orders`, `create-goods-received-note`, `update-purchase-bill-status`, etc.
- Descriptions mirror sales style: "List purchase bills with optional filters", "Create a new purchase order"

#### Business rules (CORRECTED — applies to BOTH sales and purchases)
- **Delete constraint:** Only draft and void transactions can be deleted (NOT draft-only as Phase 2 currently states)
- **Status lifecycle:** draft -> ready (direct), OR draft -> pending_approval -> ready (via approval). ready -> void (final). No backward transitions.
- `pending_approval` is a valid status missing from current sales business rules
- Fix sales business rules as part of this phase to match the corrected rules

### Claude's Discretion
- Config file organization within src/tools/configs/
- Whether to create a shared purchase config directory or keep flat
- Order of entity registration in registry

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

</user_constraints>

## Summary

Phase 3 implements complete CRUD tools for 6 purchase entities by reusing the validated factory pattern from Phase 2. Research of the Bukku Purchases API OpenAPI specification (purchase.yaml) confirms nearly identical structure to the Sales API: all entities follow uniform REST patterns, share common filter parameters, use consistent response wrappers (`{ paging: {...}, transactions: [...] }` for lists and `{ transaction: {...} }` for single items), and support identical CRUD operations.

**Critical discovery:** The OpenAPI spec reveals that both sales and purchases support `pending_approval` as a creation status (enum: draft, pending_approval, ready), and the delete operation description suggests both draft and void transactions can be deleted. Current Phase 2 sales configs state incorrect business rules ("only draft can be deleted" and omit pending_approval from status lifecycle). Phase 3 must correct these rules for both categories.

The Purchases API has one purchase-specific feature: bills support `payment_mode` filter with values credit/cash/claim, where 'claim' represents expense claim/reimbursement scenarios (employee submits claim against supplier for reimbursement). All other patterns match sales exactly.

**Primary recommendation:** Create 6 CrudEntityConfig objects for purchase entities (mirroring the sales pattern exactly), update all 7 sales entity configs to fix business rules, add purchase configs to registry. The Phase 1 factory handles everything else. Focus planning on accurate entity configurations, business rule corrections, and verification that generated tools match API requirements.

## Standard Stack

Phase 3 builds entirely on Phase 1's infrastructure and Phase 2's validated patterns — zero new libraries needed.

### Existing Infrastructure (from Phase 1)
| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| CRUD Factory | `src/tools/factory.ts` | Generates 6 tools per entity config | Complete, tested with 7 sales entities |
| BukkuClient | `src/client/bukku-client.ts` | HTTP client with get/post/put/patch/delete methods | Complete, supports all needed methods |
| Error Transformer | `src/errors/transform.ts` | Converts HTTP errors to conversational messages | Complete, handles 400/401/403/404/422/500+ |
| Type System | `src/types/bukku.ts` | CrudEntityConfig, BukkuPaginatedResponse, etc. | Complete, supports factory pattern |
| Tool Registry | `src/tools/registry.ts` | Orchestrates tool registration | Complete, imports 7 sales configs |

### What Phase 3 Adds
**Purchase Entity Configurations:** 6 CrudEntityConfig objects mapping purchase entities to Bukku API endpoints (identical pattern to sales)

**Business Rule Corrections:** Update `businessRules` field in all 13 entity configs (7 sales + 6 purchases) to reflect accurate delete constraints and status lifecycle

**No new dependencies required.** Phase 1 infrastructure and Phase 2 validation cover all Phase 3 requirements.

## Architecture Patterns

### Pattern 1: Entity Configuration for Purchase Documents

**What:** CrudEntityConfig object mapping each purchase entity to its Bukku API endpoints

**Structure verified from OpenAPI purchase.yaml:**
```typescript
const purchaseOrderConfig: CrudEntityConfig = {
  entity: "purchase-order",
  apiBasePath: "/purchases/orders",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "purchase order",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "email_status", "transfer_status"],
  businessRules: {
    delete: "Only draft and void purchase orders can be deleted. Ready or pending approval orders cannot be deleted — use update-purchase-order-status to void a ready order instead.",
    statusTransitions: "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void order is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  }
};
```

**When to use:** Once per purchase entity (orders, goods received notes, bills, credit notes, payments, refunds)

**Factory generates:**
- `list-purchase-orders` — GET /purchases/orders with filters
- `get-purchase-order` — GET /purchases/orders/{id}
- `create-purchase-order` — POST /purchases/orders
- `update-purchase-order` — PUT /purchases/orders/{id}
- `delete-purchase-order` — DELETE /purchases/orders/{id}
- `update-purchase-order-status` — PATCH /purchases/orders/{id}

### Pattern 2: Corrected Business Rules (Sales + Purchases)

**What:** Accurate delete constraints and status lifecycle rules based on OpenAPI verification

**Corrected delete rule:**
```typescript
businessRules: {
  delete: "Only draft and void {entity-type} can be deleted. Ready or pending approval {entity-type} cannot be deleted — use update-{entity}-status to void a ready {entity-type} instead."
}
```

**Corrected status transitions:**
```typescript
businessRules: {
  statusTransitions: "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void {entity-type} is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft."
}
```

**Why this matters:** Business rules in tool descriptions proactively guide Claude's behavior. Incorrect rules lead to failed operations and user frustration. The corrected rules acknowledge:
1. Both draft AND void can be deleted (not just draft)
2. pending_approval is a valid intermediate status in the approval workflow
3. Multiple paths to ready: direct (draft -> ready) or via approval (draft -> pending_approval -> ready)

**Applies to:** All 7 sales entities + all 6 purchase entities = 13 configs to update

### Pattern 3: Purchase-Specific Filter — payment_mode with 'claim'

**What:** Bills support payment_mode filter with purchase-specific 'claim' value

**Verified from OpenAPI purchase.yaml lines 1058-1067:**
```yaml
paymentModePurchases:
  name: payment_mode
  in: query
  description: Search by payment mode.
  schema:
    type: string
    enum:
      - credit
      - cash
      - claim
```

**Usage in config:**
```typescript
const purchaseBillConfig: CrudEntityConfig = {
  entity: "purchase-bill",
  apiBasePath: "/purchases/bills",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "purchase bill",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "payment_status", "payment_mode"], // includes payment_mode
  businessRules: {
    delete: "Only draft and void bills can be deleted. Ready or pending approval bills cannot be deleted — use update-purchase-bill-status to void a ready bill instead.",
    statusTransitions: "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void bill is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  }
};
```

**What 'claim' means:** Expense claim/reimbursement scenario where an employee submits a bill against a supplier for reimbursement (e.g., employee paid supplier directly, company reimburses employee). This is distinct from normal credit/cash purchases.

**Sales comparison:** Sales payments use `payment_mode` filter but with different enum values (no 'claim' option, as expense claims are purchase-specific).

### Anti-Patterns to Avoid

**Anti-pattern 1: Inconsistent business rules between sales and purchases**
- Both categories share identical status lifecycle and delete constraints
- Don't create purchase-specific rules that differ from sales unless API behavior actually differs
- Verify: OpenAPI specs for sales.yaml and purchase.yaml show identical status enums and operation descriptions

**Anti-pattern 2: Hardcoding filter values in config comments**
- User constraint: don't enumerate valid status values in tool descriptions
- Let API validation guide users through error responses
- Exception: payment_mode 'claim' is worth noting in bill description as it's purchase-specific and non-obvious

**Anti-pattern 3: Abbreviating 'goods-received-note' to 'GRN'**
- User decision: keep full name for consistency with Bukku API paths
- Entity ID: `goods-received-note` (matches /purchases/goods_received_notes)
- Tool names: `list-goods-received-notes`, `create-goods-received-note`, etc.

## Don't Hand-Roll

Phase 3 reuses all Phase 1 infrastructure — nothing to hand-roll.

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Purchase-specific tool generation | 36 hand-coded tool definitions | Factory pattern with 6 CrudEntityConfig objects | Factory generates consistent tools, 6 configs vs 36 functions |
| Business rule corrections | Copy-paste updates to each tool description | Update businessRules in entity config | Factory injects rules into delete/status descriptions automatically |
| Purchase API error handling | Purchase-specific error messages | transformHttpError from Phase 1 | Works for all Bukku APIs (sales, purchases, etc.) |
| Filter parameter schema generation | Custom Zod schemas per entity | Factory's listSchema builder + config.listFilters | Factory adds entity-specific filters to base filter set automatically |

**Key insight:** Phase 2 validated the factory pattern works perfectly for sales. Phase 3 simply applies the same pattern to purchases with near-zero changes to infrastructure code.

## Common Pitfalls

### Pitfall 1: Assuming bill and credit note have email_status filter
**What goes wrong:** Adding `email_status` to listFilters for bills and credit notes when API doesn't support it

**Why it happens:** Sales invoices and credit notes DO have email_status, leading to assumption that all invoice-like documents have it

**How to avoid:** Verify exact filter list in OpenAPI spec per entity. Purchase bills and credit notes lack email_status parameter (confirmed in purchase.yaml lines 380-391 for bills, 547-557 for credit notes).

**Warning signs:** If bill config includes email_status in listFilters, you've deviated from the API spec. Double-check purchase.yaml.

**Correct filters:**
- Bill: contact_id, payment_status, payment_mode
- Credit Note: contact_id, payment_status
- (NO email_status for either)

### Pitfall 2: Forgetting to update sales entity business rules
**What goes wrong:** Only fixing purchases configs, leaving sales configs with inaccurate delete constraint and missing pending_approval status

**Why it happens:** Phase is called "Purchases Category" so focus narrows to purchases only

**How to avoid:** User decision in CONTEXT.md explicitly states "Fix sales business rules as part of this phase." Update all 13 entity configs (7 sales + 6 purchases).

**Warning signs:** If planning creates tasks only for purchases configs, sales configs remain incorrect. Phase 3 success criteria must include sales corrections.

### Pitfall 3: Inconsistent entity naming between config and API path
**What goes wrong:** Using `purchase-goods-received-note` or `grn` instead of `goods-received-note`

**Why it happens:** Trying to add purchase prefix for consistency or abbreviate long name

**How to avoid:** Entity ID comes directly from API path. /purchases/goods_received_notes → entity: "goods-received-note" (converting underscore to kebab-case). No purchase prefix (apiBasePath already has /purchases/). No abbreviation (user decision: keep full name).

**Warning signs:** If entity ID doesn't match pattern from sales (e.g., sales-invoice for /sales/invoices → goods-received-note for /purchases/goods_received_notes), you've added unnecessary prefix/suffix.

### Pitfall 4: Different businessRules text between sales and purchases
**What goes wrong:** Sales says "Only draft quotes can be deleted" but purchases says "Only draft and void orders can be deleted"

**Why it happens:** Writing purchase rules correctly but not backfilling sales

**How to avoid:** Use identical template for all 13 entities, replacing {entity-type} placeholder. Ensures consistency across categories.

**Warning signs:** If git diff shows different delete constraint wording between sales-invoice.ts and purchase-bill.ts, you have inconsistent rules.

## Code Examples

Verified patterns from OpenAPI specs and existing Phase 2 code:

### Complete Entity Config Example — Purchase Order

```typescript
// src/tools/configs/purchase-order.ts
import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Purchase Order Entity Configuration
 *
 * API: /purchases/orders
 * Response keys: transaction (singular), transactions (plural)
 */
export const purchaseOrderConfig: CrudEntityConfig = {
  entity: "purchase-order",
  apiBasePath: "/purchases/orders",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "purchase order",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "email_status", "transfer_status"],
  businessRules: {
    delete: "Only draft and void purchase orders can be deleted. Ready or pending approval orders cannot be deleted — use update-purchase-order-status to void a ready order instead.",
    statusTransitions: "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void order is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  },
};
```

**Source:** OpenAPI purchase.yaml lines 16-180 + Phase 2 sales-quote.ts pattern

### Complete Entity Config Example — Purchase Bill (with payment_mode)

```typescript
// src/tools/configs/purchase-bill.ts
import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Purchase Bill Entity Configuration
 *
 * API: /purchases/bills
 * Response keys: transaction (singular), transactions (plural)
 *
 * Note: payment_mode filter includes 'claim' option for expense claims/reimbursements
 * (employee submits supplier bill for company reimbursement)
 */
export const purchaseBillConfig: CrudEntityConfig = {
  entity: "purchase-bill",
  apiBasePath: "/purchases/bills",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "purchase bill",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "payment_status", "payment_mode"],
  businessRules: {
    delete: "Only draft and void bills can be deleted. Ready or pending approval bills cannot be deleted — use update-purchase-bill-status to void a ready bill instead.",
    statusTransitions: "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void bill is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  },
};
```

**Source:** OpenAPI purchase.yaml lines 350-514 + user decision to note 'claim' mode

### Corrected Sales Config Example — Sales Invoice

```typescript
// src/tools/configs/sales-invoice.ts
import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Sales Invoice Entity Configuration
 *
 * API: /sales/invoices
 * Response keys: transaction (singular), transactions (plural)
 */
export const salesInvoiceConfig: CrudEntityConfig = {
  entity: "sales-invoice",
  apiBasePath: "/sales/invoices",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "sales invoice",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "email_status", "transfer_status", "payment_status"],
  businessRules: {
    delete: "Only draft and void invoices can be deleted. Ready or pending approval invoices cannot be deleted — use update-sales-invoice-status to void a ready invoice instead.",
    statusTransitions: "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void invoice is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  },
};
```

**Source:** Correction applied to existing src/tools/configs/sales-invoice.ts (currently has incorrect rules)

### Registry Pattern — Adding Purchase Entities

```typescript
// src/tools/registry.ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BukkuClient } from "../client/bukku-client.js";
import { registerCrudTools } from "./factory.js";

// Sales entities (Phase 2)
import { salesQuoteConfig } from "./configs/sales-quote.js";
import { salesOrderConfig } from "./configs/sales-order.js";
import { deliveryOrderConfig } from "./configs/delivery-order.js";
import { salesInvoiceConfig } from "./configs/sales-invoice.js";
import { salesCreditNoteConfig } from "./configs/sales-credit-note.js";
import { salesPaymentConfig } from "./configs/sales-payment.js";
import { salesRefundConfig } from "./configs/sales-refund.js";

// Purchase entities (Phase 3)
import { purchaseOrderConfig } from "./configs/purchase-order.js";
import { goodsReceivedNoteConfig } from "./configs/goods-received-note.js";
import { purchaseBillConfig } from "./configs/purchase-bill.js";
import { purchaseCreditNoteConfig } from "./configs/purchase-credit-note.js";
import { purchasePaymentConfig } from "./configs/purchase-payment.js";
import { purchaseRefundConfig } from "./configs/purchase-refund.js";

/**
 * Tool Registry
 *
 * Orchestrates registration of all MCP tools.
 * Phase 1 established the infrastructure.
 * Phase 2 added sales entity configs (7 entities, 42 tools).
 * Phase 3 adds purchase entity configs (6 entities, 36 tools).
 */

export function registerAllTools(server: McpServer, client: BukkuClient): number {
  let totalTools = 0;

  // Sales entities (Phase 2) — 42 tools
  totalTools += registerCrudTools(server, client, salesQuoteConfig);
  totalTools += registerCrudTools(server, client, salesOrderConfig);
  totalTools += registerCrudTools(server, client, deliveryOrderConfig);
  totalTools += registerCrudTools(server, client, salesInvoiceConfig);
  totalTools += registerCrudTools(server, client, salesCreditNoteConfig);
  totalTools += registerCrudTools(server, client, salesPaymentConfig);
  totalTools += registerCrudTools(server, client, salesRefundConfig);

  // Purchase entities (Phase 3) — 36 tools
  totalTools += registerCrudTools(server, client, purchaseOrderConfig);
  totalTools += registerCrudTools(server, client, goodsReceivedNoteConfig);
  totalTools += registerCrudTools(server, client, purchaseBillConfig);
  totalTools += registerCrudTools(server, client, purchaseCreditNoteConfig);
  totalTools += registerCrudTools(server, client, purchasePaymentConfig);
  totalTools += registerCrudTools(server, client, purchaseRefundConfig);

  return totalTools; // Should be 78 after Phase 3
}
```

**Source:** Existing src/tools/registry.ts with Phase 3 additions

## Bukku Purchases API Structure

### Complete Entity Mapping (from OpenAPI purchase.yaml)

| Entity | API Path | List Path | Single Path | Response Keys |
|--------|----------|-----------|-------------|---------------|
| Purchase Order | `/purchases/orders` | GET /purchases/orders | GET /purchases/orders/{transactionId} | transaction / transactions |
| Goods Received Note | `/purchases/goods_received_notes` | GET /purchases/goods_received_notes | GET /purchases/goods_received_notes/{transactionId} | transaction / transactions |
| Bill | `/purchases/bills` | GET /purchases/bills | GET /purchases/bills/{transactionId} | transaction / transactions |
| Credit Note | `/purchases/credit_notes` | GET /purchases/credit_notes | GET /purchases/credit_notes/{transactionId} | transaction / transactions |
| Payment | `/purchases/payments` | GET /purchases/payments | GET /purchases/payments/{id} | transaction / transactions |
| Refund | `/purchases/refunds` | GET /purchases/refunds | GET /purchases/refunds/{id} | transaction / transactions |

**Pattern observed:** All entities use `transaction` (singular) and `transactions` (plural) as response wrapper keys. Identical to sales category — validates Phase 1's generic response type design.

### Operations Supported (from OpenAPI)

**All 6 entities support identical operations:**
- POST /{path} — Create
- GET /{path} — List with filters
- GET /{path}/{id} — Get single
- PUT /{path}/{id} — Update
- PATCH /{path}/{id} — Update status
- DELETE /{path}/{id} — Delete

**Verification:** Lines 16-180 (orders), 183-347 (GRN), 350-514 (bills), 517-680 (credit notes), 683-848 (payments), 851-1016 (refunds) all follow identical structure.

### Entity-Specific Filters (from OpenAPI parameters)

| Entity | Base Filters | Additional Filters | OpenAPI Lines |
|--------|-------------|-------------------|---------------|
| Purchase Orders | ✓ | contact_id, email_status, transfer_status | 46-57 |
| Goods Received Notes | ✓ | contact_id, email_status, transfer_status | 213-224 |
| Bills | ✓ | contact_id, payment_status, payment_mode | 380-391 |
| Credit Notes | ✓ | contact_id, payment_status | 547-557 |
| Payments | ✓ | contact_id, email_status, payment_status, account_id | 713-725 |
| Refunds | ✓ | contact_id, email_status, payment_status, account_id | 881-893 |

**Base filters (all entities):** search, date_from, date_to, status, page, page_size, sort_by, sort_dir

**Key differences from sales:**
- Bills and credit notes lack email_status (unlike sales invoices/credit notes which have it)
- Bills have payment_mode with 'claim' option (expense claims)
- Payments and refunds have account_id filter (which account paid from / deposited to)

### Required Fields per Entity (from OpenAPI schemas)

**Purchase Orders, Goods Received Notes (similar structure):**
- contact_id (supplier ID)
- date (YYYY-MM-DD)
- currency_code (e.g., "MYR")
- exchange_rate (number)
- tax_mode ("inclusive" | "exclusive")
- form_items (array of line items)
- status ("draft" | "pending_approval" | "ready")

**Bills (adds payment_mode):**
- Same as above, plus:
- payment_mode ("cash" | "credit" | "claim")

**Payments (different structure):**
- contact_id
- date
- currency_code
- exchange_rate
- amount (payment amount)
- deposit_items (payment method details)
- status

**Refunds (similar to payments):**
- contact_id
- date
- currency_code
- exchange_rate
- deposit_items (refund method details)
- status

## State of the Art

| Aspect | Phase 3 Approach | Phase 2 Approach | Impact |
|--------|-----------------|------------------|--------|
| Business rules accuracy | Corrected delete constraint (draft + void) + pending_approval status | Incorrect delete constraint (draft only), missing pending_approval | Accurate guidance prevents failed operations |
| Config reuse | 6 purchase configs follow identical pattern as 7 sales configs | 7 sales configs established the pattern | Zero pattern changes needed, perfect validation |
| Total tools generated | 78 tools (42 sales + 36 purchases) from 13 configs | 42 tools from 7 configs | Factory pattern scales linearly |
| Purchase-specific features | payment_mode 'claim' documented in bill config comment | N/A | Clarity on purchase-specific business context |

**No deprecated/outdated patterns in purchases API:** Both sales.yaml and purchase.yaml use identical modern REST API design (v1.0 spec).

**Backward compatibility:** Correcting sales business rules doesn't change tool behavior (delete still fails for ready items, just with more accurate description now). No breaking changes.

## Open Questions

1. **Delete operation allowed statuses**
   - What we know: CONTEXT.md states "draft and void" can be deleted, contradicting current Phase 2 code ("only draft")
   - What's unclear: Whether this is verified against actual API behavior or inferred from business logic
   - Recommendation: Accept user's corrected rule from CONTEXT.md (they gathered this during phase discussion). Update all 13 configs with "draft and void" constraint. If API behavior differs, UAT will catch it.

2. **Config file organization**
   - What we know: Sales configs are flat in src/tools/configs/ (sales-invoice.ts, sales-payment.ts, etc.)
   - What's unclear: Whether to continue flat structure or create src/tools/configs/purchases/ subdirectory
   - Recommendation: Keep flat structure for consistency with Phase 2. 13 files in one directory is manageable. Subdirectories add indirection without clear benefit at current scale. Revisit if registry grows beyond 50 entities.

3. **Registry entity order**
   - What we know: Sales entities registered sequentially in logical workflow order (quote, order, delivery, invoice, credit, payment, refund)
   - What's unclear: Whether purchases should follow same workflow order or alphabetical order
   - Recommendation: Follow workflow order for purchases (order, GRN, bill, credit note, payment, refund) to mirror sales pattern. Makes registry easier to scan and understand business flow.

## Sources

### Primary (HIGH confidence)
- `/Users/ylchow/Centry/bukku-mcp/.api-specs/purchase.yaml` — Official OpenAPI specification for Bukku Purchases API (v1.0)
- `/Users/ylchow/Centry/bukku-mcp/.api-specs/sales.yaml` — Official OpenAPI specification for Bukku Sales API (v1.0, for status enum verification)
- `/Users/ylchow/Centry/bukku-mcp/src/tools/factory.ts` — Phase 1 CRUD factory implementation (validated in Phase 2)
- `/Users/ylchow/Centry/bukku-mcp/src/types/bukku.ts` — CrudEntityConfig interface definition
- `/Users/ylchow/Centry/bukku-mcp/src/tools/configs/sales-invoice.ts` — Phase 2 sales config pattern (to be corrected)
- `/Users/ylchow/Centry/bukku-mcp/src/tools/configs/sales-payment.ts` — Phase 2 sales payment config for comparison
- `/Users/ylchow/Centry/bukku-mcp/src/tools/registry.ts` — Phase 2 registry pattern
- `.planning/phases/03-purchases-category/03-CONTEXT.md` — User decisions gathered during phase discussion

### Secondary (MEDIUM confidence)
- `.planning/phases/02-sales-category/02-RESEARCH.md` — Phase 2 research on factory pattern application
- `.planning/STATE.md` — Prior decisions about factory pattern, tool naming, error handling (referenced)

### Tertiary (LOW confidence)
None — all findings verified against local OpenAPI specs, existing code, and user CONTEXT.md

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All infrastructure exists and validated through Phase 2
- Architecture: HIGH - All patterns verified against OpenAPI specs and match sales exactly
- Pitfalls: HIGH - Directly observed from OpenAPI spec analysis (email_status missing from bills/credit notes)
- Business rules corrections: MEDIUM - Based on user CONTEXT.md decisions rather than direct API testing, but OpenAPI confirms pending_approval status exists
- Entity configs: HIGH - Exact mappings from OpenAPI paths, schemas, and parameters

**Research date:** 2026-02-08
**Valid until:** 60 days (stable API, v1.0 spec unlikely to change)
**OpenAPI spec version:** v1.0 (from purchase.yaml line 4, sales.yaml line 4)

**Critical for planning:**
- 13 entity configs to create/update (6 new purchases + 7 corrections to sales)
- Business rules template must be applied consistently across all entities
- Filter lists must exactly match OpenAPI parameter lists per entity (especially: NO email_status for bills/credit notes)
- payment_mode 'claim' is purchase-specific and worth documenting
