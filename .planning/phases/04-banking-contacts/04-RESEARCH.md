# Phase 4: Banking & Contacts - Research

**Researched:** 2026-02-08
**Domain:** Bukku Banking & Contacts API Integration using Validated Factory Pattern
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Banking tool naming
- All banking tools use `bank-` prefix: `list-bank-money-in`, `create-bank-money-in`, `get-bank-money-in`, `update-bank-money-in`, `delete-bank-money-in`, `update-bank-money-in-status`
- Money out follows same pattern: `list-bank-money-out`, `create-bank-money-out`, etc.
- Transfers: `list-bank-transfers`, `create-bank-transfer`, `get-bank-transfer`, `update-bank-transfer`, `delete-bank-transfer`, `update-bank-transfer-status`
- API paths: `/banking/incomes` (money in), `/banking/expenses` (money out), `/banking/transfers`

#### Contact status handling
- Contacts use archive/unarchive (PATCH with `is_archived: true/false`) — Claude decides how to map this to MCP tools (update-status pattern or dedicated archive tool)
- Contact groups have CRUD only — no status tool (API has no status endpoint for groups)
- list-contacts exposes `status` filter with values: ALL, ACTIVE, INACTIVE (default returns ACTIVE only)
- list-contacts exposes all available filters: search, status, type (customer/supplier/employee), group_id, is_myinvois_ready, page, page_size

#### Transfer entity differences
- Each banking entity gets entity-specific filter lists matching what the API actually supports
- Money in/out list filters: date_from, date_to, search, contact_id, account_id, status, email_status, page, page_size, sort_by, sort_dir
- Transfer list filters: date_from, date_to, search, account_id, status (no contact_id, no email_status, no page/page_size, no sort params)
- Banking status lifecycle (draft/ready/void transitions, delete constraints) must be researched — do NOT assume same as sales/purchases
- Research all three banking entities (money in, money out, transfers) separately for business rules

#### Contact delete constraints
- Tool description uses proactive warning: "Only contacts with no linked transactions can be deleted. Archive instead if the contact has transaction history."
- Contact groups: no delete constraint — allow delete freely
- Banking transaction delete constraints: let research determine actual rules (do not assume draft+void from sales/purchases)

### Claude's Discretion
- How to map contact archive/unarchive to MCP tool pattern (update-status vs dedicated tool)
- Banking entity config structure and TypeScript types
- Tool description wording for banking entities
- Registration order in registry

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

</user_constraints>

## Summary

Phase 4 implements complete CRUD tools for 3 banking entities (money in, money out, transfers) and 2 contact entities (contacts, contact groups) by reusing the validated factory pattern from Phases 2-3. Research of the Bukku Banking API OpenAPI specification (bank.yaml, 544 lines) and Contacts API specification (contacts.yaml, 1465 lines) confirms that banking entities follow the familiar transaction pattern from sales/purchases, while contacts introduce a new response wrapper structure.

**Banking entities:** All 3 banking entities (money in, money out, transfers) use `transaction`/`transactions` response wrappers identical to sales/purchases, support the same 6 CRUD operations (list, get, create, update, delete, patch status), and follow the same status lifecycle pattern. However, transfers have significantly reduced filter capabilities (no contact_id, no email_status, no pagination parameters, no sort parameters) compared to money in/out.

**Contact entities:** Contacts and contact groups use different response wrapper keys (`contact`/`contacts` for contacts, `group`/`groups` for groups) — the first deviation from the uniform `transaction`/`transactions` pattern. Contacts have a unique archive/unarchive operation (PATCH endpoint with `is_archived: true/false`) instead of the standard status update pattern. Contact groups are simpler with basic CRUD only (no status operations, no special filters beyond pagination).

**Primary recommendation:** Create 5 CrudEntityConfig objects (3 banking + 2 contacts). Banking configs follow the sales/purchases pattern exactly. Contact configs need custom wrapper keys but otherwise use factory pattern. For contact archive/unarchive, map to `update-contact-status` tool for consistency (treating archived as a status value), even though API uses `is_archived` field instead of `status` field. The factory's flexibility with `z.record(z.string(), z.unknown())` for data inputs handles this naturally.

## Standard Stack

Phase 4 builds entirely on Phase 1's infrastructure and Phase 2-3's validated patterns — zero new libraries needed.

### Existing Infrastructure (from Phase 1)
| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| CRUD Factory | `src/tools/factory.ts` | Generates 6 tools per entity config | Complete, tested with 13 entities (78 tools) |
| BukkuClient | `src/client/bukku-client.ts` | HTTP client with get/post/put/patch/delete methods | Complete, supports all needed methods |
| Error Transformer | `src/errors/transform.ts` | Converts HTTP errors to conversational messages | Complete, handles 400/401/403/404/422/500+ |
| Type System | `src/types/bukku.ts` | CrudEntityConfig, BukkuPaginatedResponse, etc. | Complete, supports factory pattern |
| Tool Registry | `src/tools/registry.ts` | Orchestrates tool registration | Complete, imports 13 configs (sales + purchases) |

### What Phase 4 Adds
**Banking Entity Configurations:** 3 CrudEntityConfig objects mapping banking entities to Bukku API endpoints (identical pattern to sales/purchases)

**Contact Entity Configurations:** 2 CrudEntityConfig objects mapping contact entities to Bukku API endpoints (new response wrapper keys, otherwise standard pattern)

**No new dependencies required.** Phase 1 infrastructure and Phase 2-3 validation cover all Phase 4 requirements.

## Architecture Patterns

### Pattern 1: Banking Entity Configuration — Money In/Out

**What:** CrudEntityConfig object mapping money in/out entities to Bukku API endpoints

**Structure verified from OpenAPI bank.yaml:**
```typescript
const bankMoneyInConfig: CrudEntityConfig = {
  entity: "bank-money-in",
  apiBasePath: "/banking/incomes",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "bank money in transaction",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "account_id", "email_status"],
  businessRules: {
    delete: "Only draft and void money in transactions can be deleted. Ready or pending approval transactions cannot be deleted — use update-bank-money-in-status to void a ready transaction instead.",
    statusTransitions: "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void transaction is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  },
};
```

**When to use:** Once for money in, once for money out (nearly identical config)

**Factory generates:**
- `list-bank-money-in` — GET /banking/incomes with filters
- `get-bank-money-in` — GET /banking/incomes/{id}
- `create-bank-money-in` — POST /banking/incomes
- `update-bank-money-in` — PUT /banking/incomes/{id}
- `delete-bank-money-in` — DELETE /banking/incomes/{id}
- `update-bank-money-in-status` — PATCH /banking/incomes/{id}

### Pattern 2: Banking Entity Configuration — Transfers (Reduced Filters)

**What:** CrudEntityConfig for transfers with significantly fewer list filters

**Structure verified from OpenAPI bank.yaml lines 405-431:**
```typescript
const bankTransferConfig: CrudEntityConfig = {
  entity: "bank-transfer",
  apiBasePath: "/banking/transfers",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "bank transfer",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["account_id"], // ONLY account_id, no contact_id, no email_status
  businessRules: {
    delete: "Only draft and void transfers can be deleted. Ready or pending approval transfers cannot be deleted — use update-bank-transfer-status to void a ready transfer instead.",
    statusTransitions: "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void transfer is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  },
};
```

**Critical differences from money in/out:**
- Transfer list endpoint (lines 405-431) has NO contact_id parameter (transfers are between accounts, not contacts)
- Transfer list endpoint has NO email_status parameter
- Transfer list endpoint has NO page/page_size parameters in the OpenAPI spec (unusual, but verified)
- Transfer list endpoint has NO sort_by/sort_dir parameters

**Factory handles this:** The factory's base listSchema (factory.ts lines 44-53) includes page/page_size/sort_by/sort_dir for all entities. Transfers config simply omits contact_id and email_status from listFilters array. If API doesn't support pagination for transfers, it will ignore those parameters.

### Pattern 3: Contact Entity Configuration (New Response Wrapper)

**What:** CrudEntityConfig for contacts with custom response wrapper keys

**Structure verified from OpenAPI contacts.yaml lines 11-170:**
```typescript
const contactConfig: CrudEntityConfig = {
  entity: "contact",
  apiBasePath: "/contacts",
  singularKey: "contact", // NOT "transaction"
  pluralKey: "contacts",  // NOT "transactions"
  description: "contact",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true, // Maps archive/unarchive to update-status pattern
  listFilters: ["group_id", "type", "is_myinvois_ready"],
  businessRules: {
    delete: "Only contacts with no linked transactions can be deleted. Archive instead if the contact has transaction history.",
    statusTransitions: "Valid values: ACTIVE (unarchive), INACTIVE (archive). Use archive to hide contacts with transaction history instead of deleting them.",
  },
};
```

**Critical differences from sales/purchases/banking:**
- Response wrapper keys are `contact` (singular) and `contacts` (plural) instead of uniform `transaction`/`transactions`
- Status operation is PATCH /contacts/{id} with `{ is_archived: true/false }` not `{ status: "..." }`
- List filter `status` has enum [ALL, ACTIVE, INACTIVE] (lines 315-326), different from transaction status enums

**Factory adaptation:** The factory's flexible design handles this naturally:
- `singularKey: "contact"` and `pluralKey: "contacts"` tell factory which response keys to expect
- `hasStatusUpdate: true` generates `update-contact-status` tool
- Tool accepts `status` parameter, but in handler we can map: ACTIVE → `{ is_archived: false }`, INACTIVE → `{ is_archived: true }`
- **RECOMMENDATION:** Keep tool interface as "status" for consistency with other entities, do mapping in config-specific handler OR accept that factory sends `{ status: "ACTIVE" }` and let API return error (then we learn correct format and fix). **Simpler approach:** Since factory uses `z.record(z.string(), z.unknown())` for flexible inputs, and status tool does `client.patch(path, { status: params.status })`, we can document in businessRules that users should pass "ACTIVE" or "INACTIVE" as status, and we'll need to add a wrapper function that translates to `{ is_archived: boolean }`. **SIMPLEST approach:** Add special handling in factory for contacts entity type, OR create custom update-contact-status tool separately (not via factory).

**DECISION POINT for planner:** Contact archive/unarchive doesn't fit factory pattern cleanly. Two options:
1. **Factory with special case:** Modify factory to detect entity === "contact" and map status → is_archived in PATCH call
2. **Separate tool:** Skip hasStatusUpdate for contact config, create custom `archive-contact` / `unarchive-contact` tools manually
3. **Factory with generic flexibility:** Use factory's update-contact-status, document in businessRules that it accepts `{ is_archived: true/false }` as the data payload (users pass status data, we don't transform)

**RECOMMENDATION:** Option 3 is cleanest. Contact config has `hasStatusUpdate: true`. Factory generates `update-contact-status` tool. Tool description (via businessRules.statusTransitions) says: "To archive a contact, use update-contact-status with status='INACTIVE'. To unarchive, use status='ACTIVE'. The API uses is_archived field internally." This preserves factory purity while documenting the API quirk.

**WAIT — Re-checking factory code:** Factory's status update tool (lines 233-269) sends `{ status: params.status }` hardcoded. This won't work for contacts. Need factory modification OR separate custom tool. **Recommend separate custom tool** to avoid polluting factory with entity-specific logic.

### Pattern 4: Contact Group Entity Configuration (Minimal)

**What:** CrudEntityConfig for contact groups (simplest config in the project)

**Structure verified from OpenAPI contacts.yaml lines 174-289:**
```typescript
const contactGroupConfig: CrudEntityConfig = {
  entity: "contact-group",
  apiBasePath: "/contacts/groups",
  singularKey: "group",
  pluralKey: "groups",
  description: "contact group",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: false, // No status operations for groups
  listFilters: [], // No filters beyond base pagination (page/page_size implied by factory)
  // No businessRules needed — simple CRUD
};
```

**Critical differences:**
- Contact groups have NO status update operation (lines 174-289 show no PATCH endpoint)
- List endpoint (lines 199-220) has NO filter parameters beyond pagination (just GET /contacts/groups)
- Response wrappers are `group` (singular) and `groups` (plural)

**Factory generates:**
- `list-contact-groups` — GET /contacts/groups
- `get-contact-group` — GET /contacts/groups/{id}
- `create-contact-group` — POST /contacts/groups
- `update-contact-group` — PUT /contacts/groups/{id}
- `delete-contact-group` — DELETE /contacts/groups/{id}
- (NO update-contact-group-status tool, hasStatusUpdate: false)

### Pattern 5: Banking Business Rules (Same as Sales/Purchases)

**What:** Banking transactions follow identical status lifecycle and delete constraints as sales/purchases

**Verified from OpenAPI bank.yaml:**
- Delete description references `./description/delete_transaction.yaml` (lines 178, 356, 527) — same description file as sales/purchases
- Status update description references `./description/update_transaction_status.yaml` (lines 145, 323, 494) — same description file as sales/purchases
- All 3 banking entities use PATCH for status updates (lines 140-171, 318-349, 489-520)
- All 3 banking entities use DELETE endpoint (lines 173-195, 351-373, 522-544)

**Conclusion:** Banking transactions use the SAME business rules as sales/purchases:
- Delete constraint: "Only draft and void {entity} can be deleted"
- Status lifecycle: "draft -> pending_approval | draft -> ready | pending_approval -> ready | ready -> void"

**No separate research needed for banking status rules** — they match sales/purchases exactly (shared description files confirm this).

### Anti-Patterns to Avoid

**Anti-pattern 1: Assuming all entities use transaction/transactions wrappers**
- Contacts use `contact`/`contacts`, contact groups use `group`/`groups`
- Factory's `singularKey` and `pluralKey` fields handle this correctly
- Don't hardcode response parsing — let factory's generic approach work

**Anti-pattern 2: Treating contact archive/unarchive as standard status update**
- API uses `is_archived` field, not `status` field
- Factory's status tool sends `{ status: params.status }` which won't work
- Must create separate `archive-contact` / `unarchive-contact` tools OR modify factory to detect contact entity

**Anti-pattern 3: Adding contact_id filter to transfers**
- Transfers are account-to-account, not contact-related
- Transfer list endpoint explicitly lacks contact_id parameter (verified lines 405-431)
- Only include filters that API actually supports

**Anti-pattern 4: Assuming transfers support pagination**
- Transfer list endpoint (lines 405-431) has NO page/page_size parameters in OpenAPI spec
- Other list endpoints (money in line 50-82, money out line 227-259) DO have page/page_size
- Factory includes pagination parameters by default — if API doesn't support them for transfers, it will ignore them (no harm, but worth noting in docs)

## Don't Hand-Roll

Phase 4 reuses all Phase 1-3 infrastructure — nothing to hand-roll except contact archive decision.

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Banking CRUD tools | 18 hand-coded tool definitions (3 entities × 6 tools) | Factory pattern with 3 CrudEntityConfig objects | Factory generates consistent tools, 3 configs vs 18 functions |
| Contact CRUD tools | 10+ hand-coded tool definitions (2 entities × 5-6 tools) | Factory pattern with 2 CrudEntityConfig objects + maybe 2 custom archive tools | Reuse factory for 90% of work, custom tools only for archive quirk |
| Banking business rules | Custom delete/status logic per entity | Reuse same businessRules template from sales/purchases | Banking uses identical status lifecycle (shared description files confirm) |
| Response parsing | Banking/contact-specific response handlers | Generic factory approach with custom wrapper keys | Factory's singularKey/pluralKey design handles this |

**Key insight:** Phase 4 validates that the factory pattern scales beyond transactions. Contacts introduce new response wrappers but still fit the factory model. Only contact archive/unarchive requires special handling (not a factory limitation, just API design quirk).

## Common Pitfalls

### Pitfall 1: Assuming transfers have same filters as money in/out
**What goes wrong:** Adding contact_id, email_status to transfer config when API doesn't support them

**Why it happens:** Money in and money out both have rich filter sets, leading to assumption transfers do too

**How to avoid:** Verify exact filter list in OpenAPI spec per entity. Transfer list endpoint (lines 405-431) only has: date_from, date_to, search, account_id, status. No contact_id, no email_status, no page/page_size, no sort params.

**Warning signs:** If transfer config includes filters not in lines 410-414 of bank.yaml, you've deviated from API spec.

**Correct filters:**
- Money In: contact_id, account_id, email_status
- Money Out: contact_id, account_id, email_status
- Transfers: account_id (ONLY)

### Pitfall 2: Using factory status tool for contact archive/unarchive
**What goes wrong:** Factory's `update-contact-status` sends `{ status: "ACTIVE" }` but API expects `{ is_archived: false }`

**Why it happens:** Factory's status update tool (lines 233-269) hardcodes `{ status: params.status }` body

**How to avoid:** Create separate custom tools `archive-contact` and `unarchive-contact` that call `client.patch(/contacts/{id}, { is_archived: true/false })`. Don't use factory for contact status operations.

**Warning signs:** If contact config has `hasStatusUpdate: true` but no custom handler for archive, the generated tool will fail at runtime.

**Resolution:** Set `hasStatusUpdate: false` in contact config, create 2 custom tools manually (archive, unarchive).

### Pitfall 3: Assuming banking has different status rules than sales/purchases
**What goes wrong:** Creating separate banking-specific business rules text when it's identical

**Why it happens:** New API domain (banking vs transactions), leading to assumption of different rules

**How to avoid:** OpenAPI verification shows banking uses identical description files for delete/status as sales/purchases. Use same businessRules template, just replace {entity-type} placeholder.

**Warning signs:** If banking configs have different delete constraint wording than sales/purchases, you're creating unnecessary divergence.

### Pitfall 4: Missing the contact delete constraint in tool description
**What goes wrong:** Contact delete tool has no warning about transaction history constraint

**Why it happens:** Focusing on API structure, missing the critical business rule in line 155-156 of contacts.yaml

**How to avoid:** Contact delete description (lines 154-157) explicitly states: "Only contacts that are not used in any transactions can be deleted." Add this as businessRules.delete in contact config.

**Warning signs:** If contact config lacks businessRules.delete, LLM won't know to archive instead of delete.

### Pitfall 5: Using "transaction" wrappers for contacts/groups
**What goes wrong:** Response parsing fails because contacts.yaml uses `contact`/`contacts` not `transaction`/`transactions`

**Why it happens:** 13 prior entities all used transaction wrappers, leading to assumption it's universal

**How to avoid:** Verify singularKey/pluralKey from OpenAPI per entity. Contacts schema (line 29) shows `contact:` response wrapper. Groups schema (line 189) shows `group:` wrapper.

**Warning signs:** If contact/group configs use singularKey: "transaction", runtime will return "undefined" because actual API response has different keys.

## Code Examples

Verified patterns from OpenAPI specs and existing Phase 2-3 code:

### Complete Entity Config Example — Bank Money In

```typescript
// src/tools/configs/bank-money-in.ts
import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Bank Money In Entity Configuration
 *
 * API: /banking/incomes
 * Response keys: transaction (singular), transactions (plural)
 *
 * Money In represents incoming cash transactions (customer payments, deposits, etc.)
 * following the same transaction pattern as sales/purchases.
 */
export const bankMoneyInConfig: CrudEntityConfig = {
  entity: "bank-money-in",
  apiBasePath: "/banking/incomes",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "bank money in transaction",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "account_id", "email_status"],
  businessRules: {
    delete: "Only draft and void money in transactions can be deleted. Ready or pending approval transactions cannot be deleted — use update-bank-money-in-status to void a ready transaction instead.",
    statusTransitions: "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void transaction is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  },
};
```

**Source:** OpenAPI bank.yaml lines 19-196 + Phase 3 business rules template

### Complete Entity Config Example — Bank Transfers (Reduced Filters)

```typescript
// src/tools/configs/bank-transfer.ts
import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Bank Transfer Entity Configuration
 *
 * API: /banking/transfers
 * Response keys: transaction (singular), transactions (plural)
 *
 * Transfers represent account-to-account money movements (no contact involved).
 * Note: Transfers have significantly fewer list filters than money in/out
 * (no contact_id, no email_status, no pagination/sort in API spec).
 */
export const bankTransferConfig: CrudEntityConfig = {
  entity: "bank-transfer",
  apiBasePath: "/banking/transfers",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "bank transfer",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["account_id"], // ONLY account_id (no contact_id, no email_status)
  businessRules: {
    delete: "Only draft and void transfers can be deleted. Ready or pending approval transfers cannot be deleted — use update-bank-transfer-status to void a ready transfer instead.",
    statusTransitions: "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void transfer is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  },
};
```

**Source:** OpenAPI bank.yaml lines 375-544 + user decision to note filter differences

### Complete Entity Config Example — Contact (Custom Response Wrapper)

```typescript
// src/tools/configs/contact.ts
import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Contact Entity Configuration
 *
 * API: /contacts
 * Response keys: contact (singular), contacts (plural)
 *
 * Contacts represent customers, suppliers, and employees.
 * NOTE: Contact "status" is archive/unarchive, NOT the standard transaction status.
 * The archive operation is handled by separate custom tools (archive-contact, unarchive-contact)
 * because the API uses `is_archived` field instead of `status` field.
 */
export const contactConfig: CrudEntityConfig = {
  entity: "contact",
  apiBasePath: "/contacts",
  singularKey: "contact", // NOT "transaction"
  pluralKey: "contacts",  // NOT "transactions"
  description: "contact",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: false, // Archive/unarchive handled by separate custom tools
  listFilters: ["group_id", "status", "type", "is_myinvois_ready"],
  businessRules: {
    delete: "Only contacts with no linked transactions can be deleted. Archive instead if the contact has transaction history.",
  },
};
```

**Source:** OpenAPI contacts.yaml lines 11-170

### Complete Entity Config Example — Contact Group (Minimal)

```typescript
// src/tools/configs/contact-group.ts
import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Contact Group Entity Configuration
 *
 * API: /contacts/groups
 * Response keys: group (singular), groups (plural)
 *
 * Contact groups organize contacts into categories (e.g., "VIP Customers", "Suppliers - Malaysia").
 * Simplest entity in the project: basic CRUD only, no status operations, no special filters.
 */
export const contactGroupConfig: CrudEntityConfig = {
  entity: "contact-group",
  apiBasePath: "/contacts/groups",
  singularKey: "group",
  pluralKey: "groups",
  description: "contact group",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: false, // No status operations for groups
  listFilters: [], // No entity-specific filters (base pagination from factory applies)
};
```

**Source:** OpenAPI contacts.yaml lines 174-289

### Custom Tool Example — Contact Archive/Unarchive

```typescript
// src/tools/custom/contact-archive.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BukkuClient } from "../../client/bukku-client.js";
import { transformHttpError, transformNetworkError } from "../../errors/transform.js";
import { log } from "../../utils/logger.js";

/**
 * Register custom contact archive/unarchive tools.
 *
 * These tools handle the archive/unarchive operation which uses `is_archived` field
 * instead of the standard `status` field used by other entities.
 *
 * @param server - MCP server instance
 * @param client - Authenticated Bukku API client
 * @returns Number of tools registered (2: archive-contact, unarchive-contact)
 */
export function registerContactArchiveTools(
  server: McpServer,
  client: BukkuClient
): number {
  let toolCount = 0;

  // Archive tool
  server.tool(
    "archive-contact",
    "Archive a contact (hide from active lists). Use this for contacts with transaction history instead of deleting them.",
    {
      id: z.number().describe("The contact ID"),
    },
    async (params) => {
      try {
        const result = await client.patch(`/contacts/${params.id}`, {
          is_archived: true,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof Response) {
          const body = await error.json().catch(() => null);
          return transformHttpError(error.status, body, "archive-contact");
        }
        return transformNetworkError(error, "archive-contact");
      }
    }
  );
  toolCount++;
  log("Registered tool: archive-contact");

  // Unarchive tool
  server.tool(
    "unarchive-contact",
    "Unarchive a contact (restore to active lists).",
    {
      id: z.number().describe("The contact ID"),
    },
    async (params) => {
      try {
        const result = await client.patch(`/contacts/${params.id}`, {
          is_archived: false,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof Response) {
          const body = await error.json().catch(() => null);
          return transformHttpError(error.status, body, "unarchive-contact");
        }
        return transformNetworkError(error, "unarchive-contact");
      }
    }
  );
  toolCount++;
  log("Registered tool: unarchive-contact");

  return toolCount;
}
```

**Source:** Adapted from factory pattern (factory.ts lines 233-269) for contact-specific archive operation

### Registry Pattern — Adding Banking and Contact Entities

```typescript
// src/tools/registry.ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BukkuClient } from "../client/bukku-client.js";
import { registerCrudTools } from "./factory.js";
import { registerContactArchiveTools } from "./custom/contact-archive.js";

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

// Banking entities (Phase 4)
import { bankMoneyInConfig } from "./configs/bank-money-in.js";
import { bankMoneyOutConfig } from "./configs/bank-money-out.js";
import { bankTransferConfig } from "./configs/bank-transfer.js";

// Contact entities (Phase 4)
import { contactConfig } from "./configs/contact.js";
import { contactGroupConfig } from "./configs/contact-group.js";

/**
 * Tool Registry
 *
 * Orchestrates registration of all MCP tools.
 * Phase 1 established the infrastructure.
 * Phase 2 added sales entity configs (7 entities, 42 tools).
 * Phase 3 added purchase entity configs (6 entities, 36 tools).
 * Phase 4 adds banking + contact entity configs (5 entities, 28 tools + 2 custom = 30 tools).
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

  // Banking entities (Phase 4) — 18 tools (3 entities × 6 tools)
  totalTools += registerCrudTools(server, client, bankMoneyInConfig);
  totalTools += registerCrudTools(server, client, bankMoneyOutConfig);
  totalTools += registerCrudTools(server, client, bankTransferConfig);

  // Contact entities (Phase 4) — 10 factory tools + 2 custom archive tools = 12 tools
  totalTools += registerCrudTools(server, client, contactConfig); // 5 tools (no status)
  totalTools += registerCrudTools(server, client, contactGroupConfig); // 5 tools (no status)
  totalTools += registerContactArchiveTools(server, client); // 2 custom tools

  return totalTools; // Should be 108 after Phase 4 (78 + 30)
}
```

**Source:** Existing src/tools/registry.ts with Phase 4 additions

## Bukku Banking API Structure

### Complete Entity Mapping (from OpenAPI bank.yaml)

| Entity | API Path | List Path | Single Path | Response Keys |
|--------|----------|-----------|-------------|---------------|
| Money In | `/banking/incomes` | GET /banking/incomes | GET /banking/incomes/{transactionId} | transaction / transactions |
| Money Out | `/banking/expenses` | GET /banking/expenses | GET /banking/expenses/{transactionId} | transaction / transactions |
| Transfer | `/banking/transfers` | GET /banking/transfers | GET /banking/transfers/{transactionId} | transaction / transactions |

**Pattern observed:** All banking entities use `transaction` (singular) and `transactions` (plural) as response wrapper keys. Identical to sales/purchases — validates factory pattern universality for transaction-based entities.

### Operations Supported (from OpenAPI)

**All 3 banking entities support identical operations:**
- POST /{path} — Create
- GET /{path} — List with filters
- GET /{path}/{id} — Get single
- PUT /{path}/{id} — Update
- PATCH /{path}/{id} — Update status
- DELETE /{path}/{id} — Delete

**Verification:** Lines 20-196 (money in), 197-374 (money out), 375-544 (transfers) all follow identical structure.

### Entity-Specific Filters (from OpenAPI parameters)

| Entity | Base Filters | Additional Filters | OpenAPI Lines |
|--------|-------------|-------------------|---------------|
| Money In | ✓ | contact_id, account_id, email_status | 54-66 |
| Money Out | ✓ | contact_id, account_id, email_status | 231-243 |
| Transfers | ✓ | account_id | 409-414 |

**Base filters (all entities):** date_from, date_to, search, status, page, page_size, sort_by, sort_dir

**Critical difference:** Transfers ONLY have account_id as additional filter (no contact_id, no email_status). Transfer list endpoint also lacks page/page_size/sort parameters in the OpenAPI spec (lines 409-414), though factory will include them by default.

## Bukku Contacts API Structure

### Complete Entity Mapping (from OpenAPI contacts.yaml)

| Entity | API Path | List Path | Single Path | Response Keys |
|--------|----------|-----------|-------------|---------------|
| Contact | `/contacts` | GET /contacts | GET /contacts/{contactId} | contact / contacts |
| Contact Group | `/contacts/groups` | GET /contacts/groups | GET /contacts/groups/{contactId} | group / groups |

**Pattern observed:** Contacts use `contact`/`contacts` wrappers, groups use `group`/`groups` wrappers. First deviation from uniform `transaction`/`transactions` pattern across sales/purchases/banking.

### Operations Supported (from OpenAPI)

**Contacts (lines 14-170):**
- POST /contacts — Create
- GET /contacts — List with filters
- GET /contacts/{id} — Get single
- PUT /contacts/{id} — Update
- PATCH /contacts/{id} — Archive/unarchive (special operation, NOT standard status update)
- DELETE /contacts/{id} — Delete

**Contact Groups (lines 174-289):**
- POST /contacts/groups — Create
- GET /contacts/groups — List
- GET /contacts/groups/{id} — Get single
- PUT /contacts/groups/{id} — Update
- DELETE /contacts/groups/{id} — Delete
- (NO PATCH operation — groups have no status)

### Contact-Specific Filters (from OpenAPI parameters)

| Entity | Base Filters | Additional Filters | OpenAPI Lines |
|--------|-------------|-------------------|---------------|
| Contacts | ✓ | group_id, status (ALL/ACTIVE/INACTIVE), type (customer/supplier/employee), is_myinvois_ready | 43-52, 309-343 |
| Contact Groups | ✓ | (none — just pagination) | 199-220 |

**Base filters (pagination):** page, page_size, sort_by, sort_dir

**Contact status filter:** Lines 315-326 define status enum as [ALL, ACTIVE, INACTIVE] with default null (returns ACTIVE only). This is different from transaction status enums (draft/pending_approval/ready/void).

### Contact Archive Operation (PATCH /contacts/{id})

**Verified from OpenAPI contacts.yaml lines 125-150:**
```yaml
patch:
  summary: Archive / Unarchive Contact
  requestBody:
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/reqArchiveContact'
```

**Request body schema (lines 387-394):**
```yaml
reqArchiveContact:
  type: object
  properties:
    is_archived:
      type: boolean
```

**Critical difference from transaction status updates:**
- Transaction status: PATCH sends `{ status: "ready" }`
- Contact archive: PATCH sends `{ is_archived: true }`
- Different field name means factory's generic status tool won't work without modification

## State of the Art

| Aspect | Phase 4 Approach | Phase 2-3 Approach | Impact |
|--------|-----------------|-------------------|--------|
| Response wrapper flexibility | Support custom keys (contact/contacts, group/groups) via singularKey/pluralKey | Used uniform transaction/transactions for all entities | Factory pattern scales to non-transaction entities |
| Contact archive handling | Separate custom tools (archive-contact, unarchive-contact) | Standard update-status tool for all entities | Acknowledges API quirk without polluting factory |
| Banking business rules | Reuse identical template from sales/purchases | N/A | Confirms status lifecycle consistency across all transaction types |
| Filter list accuracy | Entity-specific filters per OpenAPI (transfers have fewer filters) | Entity-specific filters per OpenAPI (bills lack email_status) | Continues pattern of API-first filter configuration |

**No deprecated patterns:** All approaches follow established Phase 1-3 architecture.

## Open Questions

1. **Contact archive tool approach**
   - What we know: Factory's status tool sends `{ status: params.status }`, contact archive needs `{ is_archived: true/false }`
   - What's unclear: Modify factory to detect contact entity OR create separate custom tools
   - Recommendation: Create separate `archive-contact` / `unarchive-contact` custom tools to preserve factory purity. Factory shouldn't have entity-specific conditionals. Custom tools are the escape hatch for API quirks.

2. **Transfer pagination support**
   - What we know: Transfer list endpoint (lines 409-414) has NO page/page_size parameters in OpenAPI spec
   - What's unclear: Whether API silently ignores pagination params or returns error
   - Recommendation: Include pagination in factory-generated tool (factory does this by default). If API doesn't support it for transfers, it will likely ignore the params. Document in config JSDoc that transfers may not support pagination (API spec ambiguity).

3. **Contact group list response structure**
   - What we know: List endpoint schema (lines 209-212) shows `groups` response key
   - What's unclear: Whether it includes `paging` wrapper like other list endpoints
   - Recommendation: Assume it does (contact list has paging, lines 61-64). If not, runtime will reveal the structure and we can adjust.

4. **Banking tool naming consistency**
   - What we know: User decision locked `bank-money-in`, `bank-money-out`, `bank-transfer` as entity names
   - What's unclear: Whether tool descriptions should say "money in transaction" or just "money in"
   - Recommendation: Use "bank money in transaction" for description (matches sales/purchases pattern of "{category} {entity} transaction"). Keeps consistency while being slightly more formal.

## Sources

### Primary (HIGH confidence)
- `/Users/ylchow/Centry/bukku-mcp/.api-specs/bank.yaml` — Official OpenAPI specification for Bukku Banking API (v1.0, 544 lines)
- `/Users/ylchow/Centry/bukku-mcp/.api-specs/contacts.yaml` — Official OpenAPI specification for Bukku Contacts API (v1.0, 1465 lines)
- `/Users/ylchow/Centry/bukku-mcp/src/tools/factory.ts` — Phase 1 CRUD factory implementation (validated in Phases 2-3)
- `/Users/ylchow/Centry/bukku-mcp/src/types/bukku.ts` — CrudEntityConfig interface definition
- `/Users/ylchow/Centry/bukku-mcp/src/tools/configs/sales-invoice.ts` — Phase 2 sales config pattern
- `/Users/ylchow/Centry/bukku-mcp/src/tools/configs/purchase-bill.ts` — Phase 3 purchase config pattern
- `/Users/ylchow/Centry/bukku-mcp/src/tools/registry.ts` — Phase 2-3 registry pattern
- `.planning/phases/04-banking-contacts/04-CONTEXT.md` — User decisions gathered during phase discussion

### Secondary (MEDIUM confidence)
- `.planning/phases/02-sales-category/02-RESEARCH.md` — Phase 2 research on factory pattern validation
- `.planning/phases/03-purchases-category/03-RESEARCH.md` — Phase 3 research on business rules correction
- `.planning/STATE.md` — Accumulated decisions about factory pattern, tool naming, business rules

### Tertiary (LOW confidence)
None — all findings verified against local OpenAPI specs, existing code, and user CONTEXT.md

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All infrastructure exists and validated through Phases 2-3
- Architecture: HIGH - All patterns verified against OpenAPI specs
- Pitfalls: HIGH - Directly observed from OpenAPI spec analysis (transfer filter differences, contact archive API quirk)
- Banking business rules: HIGH - OpenAPI confirms shared description files with sales/purchases
- Contact patterns: HIGH - Exact mappings from OpenAPI schemas and parameters
- Custom tool recommendation: MEDIUM - Judgment call between factory modification vs separate tools (both are valid, separate tools preserve factory purity)

**Research date:** 2026-02-08
**Valid until:** 60 days (stable API, v1.0 spec unlikely to change)
**OpenAPI spec versions:** bank.yaml v1.0 (line 5), contacts.yaml v1.0 (line 4)

**Critical for planning:**
- 5 entity configs to create (3 banking + 2 contacts)
- Banking entities follow sales/purchases pattern exactly (same business rules template)
- Contact entities need custom response wrapper keys (contact/contacts, group/groups)
- Contact archive/unarchive requires 2 custom tools (API uses is_archived field, not status field)
- Transfer filters are significantly reduced vs money in/out (no contact_id, no email_status, no pagination/sort in spec)
- Contact delete constraint is different: "no linked transactions" vs transaction entities' "draft and void"
- Total tool count: 30 tools (18 banking via factory + 10 contact via factory + 2 custom archive tools)
