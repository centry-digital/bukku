# Phase 2: Sales Category (Proof of Concept) - Research

**Researched:** 2026-02-07
**Domain:** Bukku Sales API Integration with CRUD Factory Pattern
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Tool granularity
- All 6 tools per entity (list, create, get, update, delete, update-status) for all 7 sales entities — no exceptions
- Tool names use Bukku API resource names in kebab-case: `list-sales-invoices`, `create-sales-credit-notes`, `update-status-delivery-orders`, etc.
- Tool descriptions are purely functional (e.g., "List sales invoices with optional filters.") — no workflow context in descriptions

#### Filter & search design
- All 7 entities share the same uniform filter set: search, date range (date_from, date_to), status, pagination (page, page_size)
- Date format: ISO dates (YYYY-MM-DD) — no flexible/natural date parsing
- Default page size: 25 items when user doesn't specify

#### Status transitions
- Relay API errors directly — the error transformer (Phase 1) already makes them conversational
- Status values use exact API strings (e.g., "approved", "void") — no friendly aliases or mapping
- Don't hardcode valid statuses in tool descriptions — let users discover via API behavior

#### Entity relationships
- Create tools support copy-from (source_id/source_type) to pre-fill from preceding documents in the sales pipeline (quote → order → delivery order → invoice → payment)
- Copy-from is API-native only — if Bukku's API doesn't support it, don't implement client-side field mapping
- Return raw API responses for list/get — no client-side enrichment of related entity references
- No composite workflow tools — each step is a separate tool call

### Claude's Discretion
- Whether to use separate tools per operation or consolidate into fewer tools with action parameters (user is fine either way)
- Whether filters are individual parameters or a filter object
- Whether to add client-side transition validation or pass through to API

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

</user_constraints>

## Summary

Phase 2 implements complete CRUD tools for 7 sales entities using the factory pattern established in Phase 1. Research of the Bukku Sales API OpenAPI specification reveals a highly consistent REST API design: all entities follow identical patterns for list/get/create/update/delete/patch operations, share common filter parameters, and use a uniform response structure with `{ paging: {...}, transactions: [...] }` for lists and `{ transaction: {...} }` for single items.

The Bukku API supports item-level copy-from via the `transfer_item_id` field in form items, enabling the sales pipeline workflow (quote → order → delivery order → invoice → payment). This is API-native support verified in the OpenAPI schema — when creating a sales order from a quote, individual form items can reference the source quote's item IDs using `transfer_item_id`.

All 7 entities support the same base filter parameters (search, date_from, date_to, status, page, page_size, sort_by, sort_dir) with some entities adding specialized filters (contact_id, email_status, transfer_status, payment_status). Status updates use PATCH `/sales/{entity}/{id}` with `{ status: "new_status" }` body, and all entities support the same creation statuses: draft, pending_approval, ready (with void available via status update).

**Primary recommendation:** Create 7 CrudEntityConfig objects (one per sales entity), add them to the registry, and let the existing factory generate all 42 tools. The Phase 1 infrastructure handles everything — no new patterns needed. Focus planning on entity configurations and verification that factory-generated tools match API requirements.

## Standard Stack

Phase 2 builds entirely on Phase 1's established infrastructure — no new libraries needed.

### Existing Infrastructure (from Phase 1)
| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| CRUD Factory | `src/tools/factory.ts` | Generates 6 tools per entity config | Complete, tested |
| BukkuClient | `src/client/bukku-client.ts` | HTTP client with get/post/put/patch/delete methods | Complete, supports all needed methods |
| Error Transformer | `src/errors/transform.ts` | Converts HTTP errors to conversational messages | Complete, handles 400/401/403/404/422/500+ |
| Type System | `src/types/bukku.ts` | CrudEntityConfig, BukkuPaginatedResponse, etc. | Complete, supports factory pattern |
| Tool Registry | `src/tools/registry.ts` | Orchestrates tool registration | Complete, ready for entity configs |

### What Phase 2 Adds
**Entity Configurations:** 7 CrudEntityConfig objects mapping sales entities to Bukku API endpoints

**No new dependencies required.** Phase 1 infrastructure was designed to handle Phase 2's requirements.

## Architecture Patterns

### Pattern 1: Entity Configuration for Sales Documents

**What:** CrudEntityConfig object mapping each sales entity to its Bukku API endpoints

**Structure verified from OpenAPI specs:**
```typescript
const salesInvoiceConfig: CrudEntityConfig = {
  entity: "sales-invoice",
  apiBasePath: "/sales/invoices",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "sales invoice",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "email_status", "transfer_status", "payment_status"]
};
```

**When to use:** Once per sales entity (quotes, orders, delivery orders, invoices, credit notes, payments, refunds)

**Factory generates:**
- `list-sales-invoices` — GET /sales/invoices with filters
- `get-sales-invoice` — GET /sales/invoices/{id}
- `create-sales-invoice` — POST /sales/invoices
- `update-sales-invoice` — PUT /sales/invoices/{id}
- `delete-sales-invoice` — DELETE /sales/invoices/{id}
- `update-sales-invoice-status` — PATCH /sales/invoices/{id}

### Pattern 2: Uniform List Filters (API-Verified)

**What:** All sales entities accept identical base filter parameters

**Verified from OpenAPI parameters:**
```typescript
// Base filters (all entities)
{
  search: "Search keywords in No., Reference, Title, Contact Name, etc.",
  date_from: "YYYY-MM-DD",
  date_to: "YYYY-MM-DD",
  status: "draft | pending_approval | ready | void",
  page: 1,
  page_size: 25,
  sort_by: "number | date | contact_name | amount | created_at",
  sort_dir: "asc | desc"
}

// Additional filters (entity-specific)
{
  contact_id: 123,              // All entities
  email_status: "SENT",         // Quotes, Orders, Invoices, etc.
  transfer_status: "TRANSFERRED", // Quotes, Orders, Delivery Orders
  payment_status: "PAID"        // Invoices, Credit Notes
}
```

**Factory implementation:** The factory already includes all base filters in list tool schema (lines 44-53 of factory.ts). Additional filters come from `config.listFilters` array.

### Pattern 3: Copy-From via transfer_item_id (API-Native)

**What:** API supports copying items from previous documents in sales pipeline

**Verified from OpenAPI schema (line 1690-1693):**
```yaml
reqFormTransferItemId:
  type: integer
  description: |
    The transferred item's id, required for transfer items.
    Obtained from the to be transferred transaction's form_item's ID.
```

**Usage pattern:**
```typescript
// User: "Create a sales order from quote #1234"
// Step 1: Get quote to see its form_items
const quote = await get('sales-quote', { id: 1234 });
// Response: { transaction: { form_items: [{ id: 100, ... }, { id: 101, ... }] } }

// Step 2: Create sales order with transfer_item_id references
await create('sales-order', {
  data: {
    contact_id: quote.transaction.contact_id,
    date: "2026-02-07",
    currency_code: "MYR",
    exchange_rate: 1,
    tax_mode: "exclusive",
    form_items: [
      {
        transfer_item_id: 100,  // Copy from quote's first item
        quantity: 5             // Can override quantities
      },
      {
        transfer_item_id: 101   // Copy from quote's second item
      }
    ],
    status: "draft"
  }
});
```

**Critical:** This is API-native, not client-side mapping. The `transfer_item_id` field is part of the Bukku API schema. No custom copy logic needed — just pass the field through in the data object.

### Pattern 4: Status Update Operations (API-Verified)

**What:** Dedicated PATCH endpoint for status changes, separate from PUT update

**Verified from OpenAPI (lines 130-162):**
```yaml
patch:
  summary: Update Quotation Status
  requestBody:
    schema:
      type: object
      properties:
        status:
          type: string
```

**All entities support:**
- **Creation statuses:** draft, pending_approval, ready
- **Update-only statuses:** void (cannot create as void, must transition via status update)

**Factory implementation:** The factory's `update-{entity}-status` tool uses `client.patch()` with `{ status: params.status }` body (lines 234-269 of factory.ts). This matches the API exactly.

## Bukku Sales API Structure

### Complete Entity Mapping (from OpenAPI sales.yaml)

| Entity | API Path | List Path | Single Path | Response Keys |
|--------|----------|-----------|-------------|---------------|
| Quotation | `/sales/quotes` | GET /sales/quotes | GET /sales/quotes/{transactionId} | transaction / transactions |
| Sales Order | `/sales/orders` | GET /sales/orders | GET /sales/orders/{transactionId} | transaction / transactions |
| Delivery Order | `/sales/delivery_orders` | GET /sales/delivery_orders | GET /sales/delivery_orders/{transactionId} | transaction / transactions |
| Invoice | `/sales/invoices` | GET /sales/invoices | GET /sales/invoices/{transactionId} | transaction / transactions |
| Credit Note | `/sales/credit_notes` | GET /sales/credit_notes | GET /sales/credit_notes/{transactionId} | transaction / transactions |
| Payment | `/sales/payments` | GET /sales/payments | GET /sales/payments/{transactionId} | transaction / transactions |
| Refund | `/sales/refunds` | GET /sales/refunds | GET /sales/refunds/{transactionId} | transaction / transactions |

**Pattern observed:** All entities use `transaction` (singular) and `transactions` (plural) as response wrapper keys. This validates Phase 1's decision to use generic response types.

### Operations Supported (from OpenAPI)

**All 7 entities support identical operations:**
- POST /{path} — Create
- GET /{path} — List with filters
- GET /{path}/{id} — Get single
- PUT /{path}/{id} — Update
- PATCH /{path}/{id} — Update status
- DELETE /{path}/{id} — Delete

**Verification:** Lines 17-181 (quotes), 184-349 (orders), 351-516 (delivery orders), 518-684 (invoices), 686-851 (credit notes), 853-1019 (payments), 1021-1187 (refunds) all follow identical structure.

### Entity-Specific Filters (from OpenAPI parameters)

| Entity | Base Filters | Additional Filters |
|--------|-------------|-------------------|
| Quotes | ✓ | contact_id, email_status, transfer_status |
| Sales Orders | ✓ | contact_id, email_status, transfer_status |
| Delivery Orders | ✓ | contact_id, email_status, transfer_status |
| Invoices | ✓ | contact_id, email_status, payment_status |
| Credit Notes | ✓ | contact_id, email_status |
| Payments | ✓ | contact_id, payment_mode |
| Refunds | ✓ | contact_id |

**Base filters:** search, date_from, date_to, status, page, page_size, sort_by, sort_dir

### Required Fields per Entity (from OpenAPI schemas)

**Quotes, Sales Orders, Delivery Orders (similar structure):**
- contact_id (customer ID)
- date (YYYY-MM-DD)
- currency_code (e.g., "MYR")
- exchange_rate (number)
- tax_mode ("inclusive" | "exclusive")
- form_items (array of line items)
- status ("draft" | "pending_approval" | "ready")

**Invoices, Credit Notes (add form items complexity):**
- Same as above, but form_items use MyInvois schema with classification codes

**Payments (different structure):**
- contact_id
- date
- currency_code
- exchange_rate
- amount (payment amount)
- deposit_items (payment method details)
- status

**Refunds (similar to payments, no amount required):**
- contact_id
- date
- currency_code
- exchange_rate
- deposit_items
- status

## Don't Hand-Roll

Problems that already have solutions in Phase 1 infrastructure:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tool registration for each entity | 42 hand-coded tool definitions | Factory pattern with CrudEntityConfig | Factory generates consistent tools, 7 configs vs 42 functions |
| HTTP error handling | Entity-specific error messages | transformHttpError from Phase 1 | Already handles 400/401/403/404/422/500+, conversational messages |
| API authentication | Per-tool auth logic | BukkuClient from Phase 1 | Handles Bearer token + Company-Subdomain headers |
| Input validation | Hand-written Zod schemas per entity | z.record(z.string(), z.unknown()) | Maximum flexibility, API validates fields |
| Response parsing | Entity-specific response handlers | Generic JSON return | Factory returns JSON.stringify(result), MCP handles formatting |
| Status validation | Enum validation in tool schemas | Pass-through to API | User constraint: let API return errors, transformer makes them friendly |

**Key insight:** Phase 1's design anticipated Phase 2's needs. The factory pattern, error transformer, and flexible input validation were built specifically to avoid hand-rolling any sales entity logic.

## Common Pitfalls

### Pitfall 1: Assuming entity-specific response keys
**What goes wrong:** Different entities use different response keys (e.g., invoices use `invoice`, orders use `order`)

**Why it happens:** Many REST APIs use entity-specific response wrappers

**How to avoid:** Bukku uses uniform `transaction`/`transactions` keys across ALL sales entities (verified in OpenAPI lines 35, 70, 202, 237, etc.)

**Warning signs:** If response parsing fails, check the actual API response — should always be `{ transaction: {...} }` or `{ paging: {...}, transactions: [...] }`

### Pitfall 2: Hardcoding status enums in tool descriptions
**What goes wrong:** Tool description says "status must be draft, pending_approval, or ready" but API also accepts void via PATCH

**Why it happens:** OpenAPI shows creation statuses (draft/pending_approval/ready) but PATCH accepts additional statuses

**How to avoid:** Per user constraint, don't hardcode valid statuses. Tool description should be "New status value" without enumerating options. Let API validation errors guide users.

**Warning signs:** User asks "what statuses are valid?" — the answer should come from API behavior, not tool descriptions

### Pitfall 3: Implementing client-side copy-from logic
**What goes wrong:** Building field-mapping code to copy quote data into sales order creation

**Why it happens:** Misunderstanding "copy-from" to mean client-side data transformation

**How to avoid:** `transfer_item_id` is an API field. Just include it in form_items when creating. The API handles copying the item details.

**Warning signs:** If you're writing code to extract fields from one entity and map them to another, you're doing it wrong

### Pitfall 4: Using different filter parameters per entity
**What goes wrong:** Each entity gets custom filter parameters, breaking consistency

**Why it happens:** Not reading the OpenAPI specs carefully — assuming filters vary by entity

**How to avoid:** All 7 entities accept identical base filters. Only additional filters (contact_id, email_status, etc.) vary. The factory already handles this via `config.listFilters`.

**Warning signs:** If list tool schemas differ significantly between entities, you've diverged from the API structure

### Pitfall 5: Creating workflow tools that combine operations
**What goes wrong:** Creating "create-order-from-quote" tool that does get + create in one call

**Why it happens:** Trying to optimize for common workflows

**How to avoid:** Per user constraint, no composite workflow tools. Claude orchestrates multi-step workflows conversationally using individual tools.

**Warning signs:** If tool names include "from" or "to" (e.g., "convert-quote-to-order"), you're building composite tools

## Code Examples

### Entity Configuration Pattern

```typescript
// src/tools/configs/sales-invoice.ts
import type { CrudEntityConfig } from "../../types/bukku.js";

export const salesInvoiceConfig: CrudEntityConfig = {
  entity: "sales-invoice",
  apiBasePath: "/sales/invoices",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "sales invoice",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "email_status", "transfer_status", "payment_status"]
};
```

**Source:** Derived from OpenAPI sales.yaml lines 518-684 and factory.ts pattern

### Registry Pattern (All 7 Entities)

```typescript
// src/tools/registry.ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BukkuClient } from "../client/bukku-client.js";
import { registerCrudTools } from "./factory.js";
import { salesQuoteConfig } from "./configs/sales-quote.js";
import { salesOrderConfig } from "./configs/sales-order.js";
import { deliveryOrderConfig } from "./configs/delivery-order.js";
import { salesInvoiceConfig } from "./configs/sales-invoice.js";
import { creditNoteConfig } from "./configs/credit-note.js";
import { paymentConfig } from "./configs/payment.js";
import { refundConfig } from "./configs/refund.js";

export function registerAllTools(server: McpServer, client: BukkuClient): number {
  let toolCount = 0;

  // Sales entities (Phase 2)
  toolCount += registerCrudTools(server, client, salesQuoteConfig);
  toolCount += registerCrudTools(server, client, salesOrderConfig);
  toolCount += registerCrudTools(server, client, deliveryOrderConfig);
  toolCount += registerCrudTools(server, client, salesInvoiceConfig);
  toolCount += registerCrudTools(server, client, creditNoteConfig);
  toolCount += registerCrudTools(server, client, paymentConfig);
  toolCount += registerCrudTools(server, client, refundConfig);

  return toolCount;
}
```

**Source:** Phase 1 registry pattern (src/tools/registry.ts)

### Tool Usage Examples (What Gets Generated)

```typescript
// Example 1: List invoices with filters (generated by factory)
// Tool: list-sales-invoices
// Parameters: { status: "ready", date_from: "2026-01-01", page_size: 25 }
// API Call: GET /sales/invoices?status=ready&date_from=2026-01-01&page_size=25
// Response: { paging: {...}, transactions: [...] }

// Example 2: Create invoice (generated by factory)
// Tool: create-sales-invoice
// Parameters: {
//   data: {
//     contact_id: 123,
//     date: "2026-02-07",
//     currency_code: "MYR",
//     exchange_rate: 1,
//     tax_mode: "exclusive",
//     form_items: [{ type: null, account_id: 45, description: "Service", unit_price: 100, quantity: 1 }],
//     status: "draft"
//   }
// }
// API Call: POST /sales/invoices with body
// Response: { transaction: {...} }

// Example 3: Update status (generated by factory)
// Tool: update-sales-invoice-status
// Parameters: { id: 456, status: "void" }
// API Call: PATCH /sales/invoices/456 with { status: "void" }
// Response: { transaction: {...} }

// Example 4: Copy from quote to order (using transfer_item_id)
// Step 1: Get quote's form items
// Tool: get-sales-quote
// Parameters: { id: 789 }
// Response: { transaction: { form_items: [{ id: 100, ... }, { id: 101, ... }] } }

// Step 2: Create order with transfer references
// Tool: create-sales-order
// Parameters: {
//   data: {
//     contact_id: 123,
//     date: "2026-02-07",
//     currency_code: "MYR",
//     exchange_rate: 1,
//     tax_mode: "exclusive",
//     form_items: [
//       { transfer_item_id: 100 },  // API copies details from quote item 100
//       { transfer_item_id: 101 }   // API copies details from quote item 101
//     ],
//     status: "draft"
//   }
// }
```

**Source:** Factory pattern (src/tools/factory.ts) applied to OpenAPI operations

## State of the Art

| Approach | Current (Phase 2) | Previous (Would Be) | Impact |
|----------|------------------|---------------------|--------|
| Tool generation | Factory pattern with 7 configs | 42 hand-coded tool functions | 85% less code, perfect consistency |
| Error handling | Centralized transformer | Per-tool error messages | Uniform UX, easier maintenance |
| Input validation | z.record(z.string(), z.unknown()) | Strict per-entity Zod schemas | API-first validation, faster iteration |
| Response handling | Generic JSON return | Entity-specific parsers | No parsing code needed |

**No deprecated/outdated patterns:** This is a new phase building on fresh Phase 1 infrastructure.

## Open Questions

1. **Entity naming in tool IDs**
   - What we know: OpenAPI uses `sales/quotes`, `sales/orders`, `sales/delivery_orders`, `sales/credit_notes`
   - What's unclear: Should entity IDs be `sales-quote`, `sales-delivery-order`, or `delivery-order`?
   - Recommendation: Use API path segment directly: `sales-quote`, `sales-order`, `delivery-order`, `sales-invoice`, `sales-credit-note`, `sales-payment`, `sales-refund`. This matches API paths exactly and avoids ambiguity.

2. **Default page_size value**
   - What we know: User constraint specifies default 25 when not provided
   - What's unclear: Should factory set default or require planner to handle it?
   - Recommendation: Factory's list tool already makes page_size optional. MCP host (Claude) will omit it when user doesn't specify. This means API gets no page_size parameter and uses its default. Need to verify Bukku API default matches user's expectation of 25.

3. **Entity-specific filter inclusion**
   - What we know: Different entities support different additional filters beyond base set
   - What's unclear: Whether to include all possible filters in every entity or only relevant ones
   - Recommendation: Use entity-specific filters from OpenAPI. Invoice gets `payment_status`, payments get `payment_mode`, etc. Factory's `listFilters` array handles this. Makes tools more discoverable.

## Sources

### Primary (HIGH confidence)
- `/Users/ylchow/Centry/bukku-mcp/.api-specs/sales.yaml` — Official OpenAPI specification for Bukku Sales API
- `/Users/ylchow/Centry/bukku-mcp/src/tools/factory.ts` — Phase 1 CRUD factory implementation
- `/Users/ylchow/Centry/bukku-mcp/src/types/bukku.ts` — CrudEntityConfig interface definition
- `/Users/ylchow/Centry/bukku-mcp/src/client/bukku-client.ts` — HTTP client with all needed methods

### Secondary (MEDIUM confidence)
- `.planning/phases/01-foundation-infrastructure/01-RESEARCH.md` — Phase 1 research on MCP patterns
- `.planning/STATE.md` — Prior decisions about factory pattern, tool naming, error handling

### Tertiary (LOW confidence)
None — all findings verified against local OpenAPI specs and existing code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All infrastructure exists in Phase 1, verified working
- Architecture: HIGH - All patterns verified against OpenAPI specs and existing factory code
- Pitfalls: MEDIUM - Derived from code review and API structure analysis, not from production experience
- Entity configs: HIGH - Exact mappings from OpenAPI paths and schemas

**Research date:** 2026-02-07
**Valid until:** 60 days (stable API, unlikely to change)
**OpenAPI spec version:** v1.0 (from sales.yaml line 4)
