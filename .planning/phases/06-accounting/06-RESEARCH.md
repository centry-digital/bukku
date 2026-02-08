# Phase 6: Accounting - Research

**Researched:** 2026-02-08
**Domain:** Double-Entry Accounting with Journal Entries and Chart of Accounts
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Double-entry validation
- Pre-validate debits = credits in the MCP tool before sending to Bukku API
- Gives Claude a clear, friendly error message immediately rather than raw API errors
- Error message format: Claude's discretion (should include enough detail for self-correction)
- Minimum line count validation: Claude's discretion on whether to enforce locally or let API handle

#### Journal entry structure
- Use the standard CRUD factory pattern (CrudEntityConfig) — same as all other entities
- Line item format and multi-currency support: Claude's discretion based on API spec
- Status workflow (draft/ready/void): Claude's discretion — include update-status tool only if the API supports it

#### Chart of accounts behavior
- Factory vs custom tools: Claude's discretion based on API spec
- Delete safeguards: Claude's discretion based on API behavior
- Account type filtering: Claude's discretion — include if the API supports it
- Reference data cache integration: Claude's discretion based on what the API spec shows

#### Tool description guidance
- Tool descriptions include validation rules only (debits must equal credits) — NOT common accounting patterns
- Create-journal-entry description must mention using list-accounts first to find valid account IDs (tool chaining guidance)
- Same conversational, task-oriented tone as all existing tools — consistent with Phase 1 decision
- Account type categorization in list-accounts description: Claude's discretion

### Claude's Discretion
- Double-entry error message format (totals only vs totals + line breakdown)
- Whether to enforce minimum 2-line validation locally
- Multi-currency support (depends on API spec)
- Journal entry status workflow (depends on API spec)
- Chart of accounts: factory vs custom, delete guards, type filtering, reference data cache link
- Account type hints in list-accounts description

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

</user_constraints>

## Summary

Phase 6 implements journal entry and chart of accounts tools with client-side double-entry validation. Research confirms the Bukku Accounting API follows the same patterns as sales and purchases: journal entries use the standard `transaction`/`transactions` response wrappers and support full CRUD + status updates, while accounts use custom `account`/`accounts` response wrappers and support CRUD with archive/unarchive operations.

**Critical discovery:** The accounting.yaml spec shows that accounts already exist as a reference data endpoint (`list-accounts` tool in Phase 5 via POST /v2/lists), but CRUD operations for managing the chart of accounts use a separate REST API at `/accounts`. Journal entries reference account IDs from the chart of accounts via their line items. This creates a dependency: users must query list-accounts (reference data) to find valid account IDs before creating journal entries.

**Double-entry validation pattern:** Standard accounting practice requires total debits = total credits before accepting a journal entry. Modern accounting software validates this at creation time with clear error messages showing the imbalance amount. The best practice is pre-validation (client-side check before API call) to provide immediate feedback with conversational error messages like "Journal entry is unbalanced. Total debits: $1,500.00, Total credits: $1,450.00. Difference: $50.00. Please adjust line items so debits equal credits."

**Account deletion constraints:** Research reveals all accounting systems prevent deleting accounts that have been used in transactions. The API spec confirms accounts can only be deleted if "not assigned to locked system type, have no children, and are not used." Archive/unarchive (PATCH with `is_archived` boolean) is the safe alternative for accounts with transaction history.

**Primary recommendation:** Use the CRUD factory for journal entries (6 tools) with custom pre-validation logic that checks debits = credits before calling the API. For chart of accounts, use the factory (5 tools: list, get, create, update, delete) plus a custom archive tool (reusing the contact-archive.ts pattern). Link list-accounts tool in create-journal-entry description to guide tool chaining.

## Standard Stack

Phase 6 builds entirely on existing infrastructure — zero new dependencies.

### Existing Infrastructure (from Phase 1)

| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| CRUD Factory | `src/tools/factory.ts` | Generates tools from entity config | Complete, supports custom validation hooks |
| BukkuClient | `src/client/bukku-client.ts` | HTTP client wrapper | Complete, all methods available |
| Error Transformer | `src/errors/transform.ts` | HTTP to conversational errors | Complete, handles 400/401/403/404/500+ |
| Reference Data | `src/tools/custom/reference-data.ts` | Cached list-accounts tool | Complete (Phase 5), provides account IDs |
| Archive Pattern | `src/tools/custom/contact-archive.ts` | Archive/unarchive via PATCH | Complete (Phase 4), reusable for accounts |

### What Phase 6 Adds

**Journal Entry Validation:** Custom validation function that sums debits and credits from line items, comparing totals before API submission.

**Entity Configurations:**
- Journal Entry config (uses factory with pre-validation)
- Account config (uses factory, similar to contacts)

**Custom Archive Tool:**
- Archive/unarchive account tool (PATCH /accounts/{id} with `{ is_archived: boolean }`)

**No new dependencies.** TypeScript standard library provides sufficient precision for currency arithmetic (use integer-based cents/smallest unit if needed, per user discretion).

## Architecture Patterns

### Pattern 1: Client-Side Double-Entry Validation

**What:** Pre-validate that sum(debits) = sum(credits) in journal entry line items before calling POST /journal_entries

**When to use:** Every create-journal-entry and update-journal-entry call

**Why client-side:** Provides immediate, conversational error message to Claude without round-trip to Bukku API. User decision: "gives Claude a clear, friendly error message immediately rather than raw API errors."

**Example validation logic:**
```typescript
// Validation function (not in factory, used by journal entry tools)
function validateDoubleEntry(lineItems: JournalEntryLine[]): {
  valid: boolean;
  error?: string
} {
  let totalDebits = 0;
  let totalCredits = 0;

  for (const line of lineItems) {
    totalDebits += line.debit || 0;
    totalCredits += line.credit || 0;
  }

  // Use Number.EPSILON for floating-point comparison
  const difference = Math.abs(totalDebits - totalCredits);

  if (difference > 0.01) { // 1 cent tolerance for rounding
    return {
      valid: false,
      error: `Journal entry is unbalanced. Total debits: ${totalDebits.toFixed(2)}, Total credits: ${totalCredits.toFixed(2)}. Difference: ${difference.toFixed(2)}. Debits must equal credits in double-entry accounting.`
    };
  }

  return { valid: true };
}
```

**Integration with factory:**
```typescript
// In journal entry creation handler (before API call)
const validation = validateDoubleEntry(params.data.journal_items);
if (!validation.valid) {
  return {
    isError: true,
    content: [{
      type: 'text',
      text: validation.error
    }]
  };
}
// If valid, proceed with API call
```

**Sources:**
- [Odoo Forum - Unbalanced Journal Entry Error](https://www.odoo.com/forum/help-1/user-error-x-cannot-create-unbalanced-journal-entry-ids-20-differences-debit-credit-16085-19-197626)
- [Journal Entry Best Practices](https://www.adaptcfo.com/post/why-most-people-get-journal-entries-wrong-and-how-to-fix-it)

### Pattern 2: Journal Entry Entity Configuration

**What:** CrudEntityConfig for journal entries using validated factory pattern

**API structure from accounting.yaml:**
- Endpoint: `/journal_entries`
- Response keys: `transaction` (singular), `transactions` (plural)
- Operations: POST, GET, GET /{id}, PUT /{id}, PATCH /{id}, DELETE /{id}
- Status update: Yes (PATCH /{id} with `{ status: string }`)

**Configuration:**
```typescript
// src/tools/configs/journal-entry.ts
import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Journal Entry Entity Configuration
 *
 * API: /journal_entries
 * Response keys: transaction (singular), transactions (plural)
 *
 * IMPORTANT: Create/update operations require double-entry validation
 * (debits = credits) before API submission. Validation logic in custom
 * tool wrappers, not in this config.
 */
export const journalEntryConfig: CrudEntityConfig = {
  entity: "journal-entry",
  apiBasePath: "/journal_entries",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "journal entry",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true, // PATCH /{id} exists per accounting.yaml line 122-152
  listFilters: [], // Only standard filters per accounting.yaml lines 44-53
  businessRules: {
    delete: "Only draft and void journal entries can be deleted. Ready journal entries cannot be deleted — use update-journal-entry-status to void a ready entry instead.",
    statusTransitions: "Valid transitions: draft -> ready, ready -> void. A void entry is final and cannot be changed.",
  },
};
```

**List filters verified from accounting.yaml lines 44-53:**
- date_from
- date_to (appears twice in spec, likely typo)
- search (for journal_entries search)
- status
- page
- page_size
- sort_by
- sort_dir

No entity-specific filters (no contact_id, email_status, etc.) — only standard transaction filters.

**Tool chaining in create description:**

User decision: "Create-journal-entry description must mention using list-accounts first to find valid account IDs (tool chaining guidance)."

Enhanced description for create-journal-entry tool:
```typescript
const createDescription = `Create a new journal entry. Use list-accounts to find valid account IDs for line items. Journal entries must have balanced debits and credits (total debits = total credits).`;
```

### Pattern 3: Chart of Accounts Entity Configuration

**What:** CrudEntityConfig for accounts plus custom archive tool

**API structure from accounting.yaml:**
- Endpoint: `/accounts`
- Response keys: `account` (singular), `accounts` (plural) — NOT transaction/transactions
- Operations: POST, GET, GET /{id}, PUT /{id}, PATCH /{id} (archive), DELETE /{id}
- List supports filtering: search, category, is_archived, sort_by, sort_dir

**Configuration:**
```typescript
// src/tools/configs/account.ts
import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Account Entity Configuration
 *
 * API: /accounts
 * Response keys: account (singular), accounts (plural)
 *
 * NOTE: Archive/unarchive handled by separate custom tool (account-archive.ts),
 * similar to contact-archive.ts pattern. The PATCH endpoint expects
 * { is_archived: boolean } instead of { status: string }.
 */
export const accountConfig: CrudEntityConfig = {
  entity: "account",
  apiBasePath: "/accounts",
  singularKey: "account",
  pluralKey: "accounts",
  description: "account",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: false, // Archive is custom tool, not status update
  listFilters: ["category", "is_archived"], // per accounting.yaml lines 344-362
  businessRules: {
    delete: "Only accounts that are not assigned to locked system type, have no children, and are not used in transactions can be deleted. Use archive-account instead if the account has transaction history.",
  },
};
```

**List filters verified from accounting.yaml:**
- search (lines 337-343): keywords in Name, Code, Description
- category (lines 344-355): enum [assets, liabilities, equity, income, expenses]
- is_archived (lines 356-362): boolean, default false
- sort_by (lines 363-373): enum [code, name, balance], default "code"
- sort_dir (lines 374-383): enum [asc, desc], default "asc"

**Custom archive tool:**
```typescript
// src/tools/custom/account-archive.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BukkuClient } from "../../client/bukku-client.js";
import { transformHttpError, transformNetworkError } from "../../errors/transform.js";

/**
 * Archive/Unarchive Account Tool
 *
 * Uses PATCH /accounts/{accountId} with { is_archived: boolean }
 * Follows contact-archive.ts pattern
 */
export function registerAccountArchiveTools(
  server: McpServer,
  client: BukkuClient
): number {
  server.tool(
    "archive-account",
    "Archive an account (make it inactive). Use this instead of delete for accounts with transaction history.",
    {
      id: z.number().describe("The account ID"),
      is_archived: z.boolean().describe("True to archive, false to unarchive"),
    },
    async (params) => {
      try {
        const result = await client.patch(`/accounts/${params.id}`, {
          is_archived: params.is_archived,
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
          return transformHttpError(error.status, body, "archive-account");
        }
        return transformNetworkError(error, "archive-account");
      }
    }
  );

  return 1;
}
```

**Source:** Existing `src/tools/custom/contact-archive.ts` pattern

### Pattern 4: Account Category Filtering

**What:** list-accounts tool supports category parameter to filter by account type

**API enum from accounting.yaml lines 349-355:**
- assets
- liabilities
- equity
- income
- expenses

**User discretion decision:** "Account type categorization in list-accounts description: Claude's discretion"

**Recommendation:** Include category filter hint in list-accounts description to help Claude discover valid account types for journal entry line items.

Enhanced description:
```typescript
const listDescription = `List all accounts from the chart of accounts. Use to find valid account IDs for journal entries. Supports filtering by category (assets, liabilities, equity, income, expenses) and archived status.`;
```

**Rationale:** Claude needs to understand account categories to create meaningful journal entries (e.g., debit asset account, credit revenue account). Including category hint in description enables smarter tool usage.

### Pattern 5: Reference Data Cache Integration

**What:** list-accounts tool already exists in Phase 5 reference-data.ts, provides cached account list via POST /v2/lists

**Discovery:** Two sources of account data:
1. **Reference data:** POST /v2/lists with `{ lists: ["accounts"] }` — cached, read-only, used for dropdowns/lookups
2. **CRUD API:** GET /accounts — supports full CRUD operations for managing chart of accounts

**User discretion decision:** "Reference data cache integration: Claude's discretion based on what the API spec shows"

**Recommendation:** Keep both tools, different purposes:
- `list-accounts` (Phase 5 reference data): Fast, cached lookup for finding account IDs when creating journal entries
- `list-account` (Phase 6 from factory): Full account details with CRUD context, used for managing chart of accounts

**Naming disambiguation:**
- Reference data tool: `list-accounts` (plural, matches existing Phase 5)
- CRUD factory tool: Should be `list-account` (singular) to match factory pattern... BUT this conflicts with reference tool

**Conflict resolution:**
User decision states "Use list-accounts to find valid account IDs" — this refers to the existing Phase 5 reference data tool. The factory will generate `list-account` (singular pattern). Both can coexist:
- `list-accounts`: Quick reference lookup (cached)
- `list-account`: Full CRUD list with filters (not cached)

Actually, looking at factory.ts line 40, the list tool is named `list-${entity}s` (plural). So factory generates:
- `list-accounts` from account config

This collides with Phase 5's `list-accounts` reference tool.

**Resolution:** Phase 5 reference-data.ts line 44 already registers `list-accounts` tool. Phase 6 CRUD factory would try to register the same tool name, causing conflict.

**Correct approach:**
1. Keep Phase 5 `list-accounts` (reference data, cached, faster)
2. Don't register CRUD list tool for accounts — remove "list" from accountConfig.operations
3. Use `list-accounts` (reference data) for journal entry account ID lookups
4. Provide get/create/update/delete for individual account management
5. If full CRUD list with filters is needed, implement custom `list-accounts-detailed` or similar

**Updated account config:**
```typescript
export const accountConfig: CrudEntityConfig = {
  entity: "account",
  apiBasePath: "/accounts",
  singularKey: "account",
  pluralKey: "accounts",
  description: "account",
  operations: ["get", "create", "update", "delete"], // NO "list" — use Phase 5 reference data
  hasStatusUpdate: false,
  listFilters: [], // Not applicable without list operation
  businessRules: {
    delete: "Only accounts that are not assigned to locked system type, have no children, and are not used in transactions can be deleted. Use archive-account instead if the account has transaction history.",
  },
};
```

### Anti-Patterns to Avoid

**Anti-pattern 1: Using floating-point arithmetic for currency without rounding checks**
- Debits/credits involve currency values which can have floating-point precision issues
- 1.20 + 1.30 might equal 2.4999999999 due to binary representation
- Always use epsilon-based comparison (e.g., difference < 0.01) or integer-based cents

**Anti-pattern 2: Generic "entry is invalid" error for unbalanced journals**
- Claude needs specific totals to self-correct
- Bad: "Invalid journal entry"
- Good: "Total debits: $1,500.00, Total credits: $1,450.00. Difference: $50.00"

**Anti-pattern 3: Trying to delete accounts with transaction history**
- API will reject with 400 error
- Tool description should guide users to archive instead
- Include delete safeguard in businessRules

**Anti-pattern 4: Duplicating list-accounts tool**
- Phase 5 already provides cached list-accounts via reference data
- Don't generate conflicting tool from factory
- Remove "list" from operations or rename tool

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency precision handling | Custom BigDecimal class | Standard Number with epsilon comparison or integer-based cents | JavaScript Number handles currency well with proper rounding checks; over-engineering adds complexity |
| Journal entry validation | Complex multi-step validation pipeline | Simple sum-and-compare function | Double-entry rule is straightforward: sum(debits) == sum(credits) |
| Account archive | New PATCH wrapper logic | Reuse contact-archive.ts pattern | Same API pattern ({ is_archived: boolean }), same tool structure |
| Account deletion guards | Runtime checks before delete API call | businessRules in config + API error handling | API enforces constraints, tool description guides user, no need for duplicate client-side checking |
| Multi-currency journal entries | Custom currency conversion | Use API's exchange_rate field | API spec shows currency_code and exchange_rate per journal entry (lines in accounting.yaml), no client-side conversion needed |

**Key insight:** Accounting integrity rules (debits = credits, can't delete used accounts) are well-defined and simple to validate. The complexity is in the business domain, not the code — focus on clear error messages and letting the API enforce constraints.

## Common Pitfalls

### Pitfall 1: Floating-Point Rounding Errors in Debit/Credit Comparison

**What goes wrong:** Journal entry with debits = $1,200.33 and credits = $1,200.33 fails validation with "difference: 0.000000000001" error.

**Why it happens:** JavaScript Number uses binary floating-point (IEEE 754). Some decimal values can't be represented exactly. Repeated additions accumulate tiny errors.

**How to avoid:**
- Use epsilon-based comparison: `Math.abs(debits - credits) < 0.01` (1 cent tolerance)
- OR use integer arithmetic (cents): multiply all amounts by 100, compare integers
- Display amounts with .toFixed(2) to show user-friendly values

**Warning signs:**
- Validation fails on entries that look balanced
- Error messages show differences like "0.000000000002"
- User reports "the numbers match but it says they don't"

**Source:** Standard floating-point arithmetic behavior documented in JavaScript specs

### Pitfall 2: Missing Minimum Line Count Validation

**What goes wrong:** User creates journal entry with 0 or 1 line items, API accepts it (or rejects with unclear error).

**Why it happens:** User decision left "minimum line count validation" to Claude's discretion. Forgetting to enforce minimum 2 lines violates double-entry principle.

**How to avoid:**
- If API doesn't enforce minimum 2 lines, add client-side check
- Error message: "Journal entries require at least 2 line items (minimum one debit and one credit)"
- Check during same validation as debit/credit balance

**Warning signs:**
- Single-line journal entries pass validation
- API returns cryptic error about missing items
- User confused why "balanced" entry with 1 line fails

**Recommendation:** Enforce minimum 2 lines client-side for clear error message.

**Source:** [Journal Entry Best Practices - Minimum Line Items](https://www.accountingtools.com/articles/how-do-i-write-an-accounting-journal-entry.html)

### Pitfall 3: Conflicting list-accounts Tool Registration

**What goes wrong:** Server crashes on startup or MCP returns error about duplicate tool name "list-accounts".

**Why it happens:** Phase 5 registers list-accounts (reference data), Phase 6 factory tries to register list-accounts (CRUD), same tool name twice.

**How to avoid:**
- Remove "list" from account config operations
- Use Phase 5 reference data tool for lookups
- Don't generate CRUD list tool from factory

**Warning signs:**
- Server startup error mentioning duplicate tool
- list-accounts returns unexpected response structure
- Tool count doesn't match expected (Phase 5 tools + Phase 6 tools overlap)

**Source:** Direct observation from Phase 5 reference-data.ts line 44 and factory.ts line 40 naming pattern

### Pitfall 4: Unclear Error Message on Unbalanced Entry

**What goes wrong:** Error says "journal entry is unbalanced" without showing totals. Claude can't self-correct because it doesn't know which side is short.

**Why it happens:** Validation returns boolean (valid/invalid) without diagnostic details.

**How to avoid:**
- Include total debits, total credits, and difference in error message
- Format as currency with 2 decimal places for readability
- Add hint: "Please adjust line items so debits equal credits"

**Warning signs:**
- User asks "what's the difference?" after error
- Claude tries same entry repeatedly without adjusting amounts
- Error message lacks numerical details

**Best practice:** "Total debits: $1,500.00, Total credits: $1,450.00. Difference: $50.00."

**Source:** [Odoo - Unbalanced Journal Entry Error Format](https://www.odoo.com/forum/help-1/user-error-x-cannot-create-unbalanced-journal-entry-ids-20-differences-debit-credit-16085-19-197626)

### Pitfall 5: Deleting Accounts with Transaction History

**What goes wrong:** User tries to delete account, API returns 400 error "account cannot be deleted — has transactions." User frustrated.

**Why it happens:** Account deletion constraint not clearly communicated in tool description.

**How to avoid:**
- businessRules.delete clearly states deletion constraints
- Suggest archive-account as alternative
- API will still reject (correct), but user has clear guidance upfront

**Warning signs:**
- Repeated delete attempts on same account
- User asks "how do I remove this account?"
- 400 errors from delete-account tool

**Correct guidance in tool description:**
"Only accounts that are not assigned to locked system type, have no children, and are not used in transactions can be deleted. Use archive-account instead if the account has transaction history."

**Source:** [Chart of Accounts Deletion Constraints](https://www.odoo.com/documentation/19.0/applications/finance/accounting/get_started/chart_of_accounts.html)

### Pitfall 6: Not Validating Required Fields in Journal Entry

**What goes wrong:** Journal entry passes debit/credit balance check but API rejects it with "date is required" or "currency_code missing."

**Why it happens:** Custom validation only checks balance, not required fields. API performs field validation after receiving request.

**How to avoid:**
- Focus double-entry validation on balance only
- Let API validate required fields (it provides detailed error messages)
- Don't duplicate API's field validation client-side

**Warning signs:**
- Balanced entries still fail with validation errors
- Error messages about missing/invalid fields
- Trying to implement comprehensive field validation client-side

**Correct approach:** Validate only the double-entry rule (debits = credits). API handles everything else.

## Code Examples

### Double-Entry Validation Function

```typescript
// src/tools/validation/double-entry.ts

interface JournalEntryLine {
  debit?: number;
  credit?: number;
  // ... other fields
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate double-entry accounting rule: debits must equal credits
 *
 * @param lines - Journal entry line items
 * @param minLines - Minimum number of lines required (default: 2)
 * @returns Validation result with detailed error message if invalid
 */
export function validateDoubleEntry(
  lines: JournalEntryLine[],
  minLines: number = 2
): ValidationResult {
  // Check minimum line count
  if (lines.length < minLines) {
    return {
      valid: false,
      error: `Journal entries require at least ${minLines} line items (minimum one debit and one credit). This entry has ${lines.length} line(s).`,
    };
  }

  // Sum debits and credits
  let totalDebits = 0;
  let totalCredits = 0;

  for (const line of lines) {
    totalDebits += line.debit || 0;
    totalCredits += line.credit || 0;
  }

  // Compare with epsilon tolerance (1 cent)
  const difference = Math.abs(totalDebits - totalCredits);
  const EPSILON = 0.01;

  if (difference >= EPSILON) {
    return {
      valid: false,
      error: `Journal entry is unbalanced. Total debits: ${totalDebits.toFixed(2)}, Total credits: ${totalCredits.toFixed(2)}. Difference: ${difference.toFixed(2)}. Debits must equal credits in double-entry accounting.`,
    };
  }

  return { valid: true };
}
```

**Source:** Derived from accounting best practices and Odoo error format

### Journal Entry Config with Enhanced Create Description

```typescript
// src/tools/configs/journal-entry.ts
import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Journal Entry Entity Configuration
 *
 * API: /journal_entries
 * Response keys: transaction (singular), transactions (plural)
 */
export const journalEntryConfig: CrudEntityConfig = {
  entity: "journal-entry",
  apiBasePath: "/journal_entries",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "journal entry",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: [], // Only standard filters (date_from, date_to, search, status)
  businessRules: {
    delete: "Only draft and void journal entries can be deleted. Ready journal entries cannot be deleted — use update-journal-entry-status to void a ready entry instead.",
    statusTransitions: "Valid transitions: draft -> ready, ready -> void. A void entry is final and cannot be changed.",
  },
};

// Note: Create tool description enhancement happens in factory.ts
// when entity === "journal-entry":
//   description: "Create a new journal entry. Use list-accounts to find valid account IDs for line items. Journal entries must have balanced debits and credits (total debits = total credits)."
```

**Source:** accounting.yaml API spec + user decision on tool chaining guidance

### Account Config Without List Operation

```typescript
// src/tools/configs/account.ts
import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Account Entity Configuration
 *
 * API: /accounts
 * Response keys: account (singular), accounts (plural)
 *
 * NOTE: List operation omitted because Phase 5's list-accounts (reference data)
 * provides cached account listing. This config handles individual account CRUD only.
 * Archive/unarchive via custom account-archive tool (not factory status update).
 */
export const accountConfig: CrudEntityConfig = {
  entity: "account",
  apiBasePath: "/accounts",
  singularKey: "account",
  pluralKey: "accounts",
  description: "account",
  operations: ["get", "create", "update", "delete"], // No "list"
  hasStatusUpdate: false,
  listFilters: [], // Not applicable
  businessRules: {
    delete: "Only accounts that are not assigned to locked system type, have no children, and are not used in transactions can be deleted. Use archive-account instead if the account has transaction history.",
  },
};
```

**Source:** Derived from accounting.yaml spec + resolution of list-accounts naming conflict

### Account Archive Tool

```typescript
// src/tools/custom/account-archive.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BukkuClient } from "../../client/bukku-client.js";
import { transformHttpError, transformNetworkError } from "../../errors/transform.js";
import { log } from "../../utils/logger.js";

/**
 * Archive/Unarchive Account Tool
 *
 * Follows contact-archive.ts pattern.
 * Uses PATCH /accounts/{accountId} with { is_archived: boolean }
 */
export function registerAccountArchiveTools(
  server: McpServer,
  client: BukkuClient
): number {
  server.tool(
    "archive-account",
    "Archive or unarchive an account. Use this instead of delete for accounts with transaction history. Archived accounts are hidden by default but can be reactivated.",
    {
      id: z.number().describe("The account ID"),
      is_archived: z.boolean().describe("True to archive (deactivate), false to unarchive (reactivate)"),
    },
    async (params) => {
      try {
        const result = await client.patch(`/accounts/${params.id}`, {
          is_archived: params.is_archived,
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
          return transformHttpError(error.status, body, "archive-account");
        }
        return transformNetworkError(error, "archive-account");
      }
    }
  );

  log("Registered tool: archive-account");
  return 1;
}
```

**Source:** src/tools/custom/contact-archive.ts pattern

## API Structure Reference

### Journal Entries Endpoint

**Base path:** `/journal_entries`

**Operations:**
- POST /journal_entries — Create (accounting.yaml lines 12-38)
- GET /journal_entries — List with filters (lines 40-68)
- GET /journal_entries/{transactionId} — Read single (lines 70-91)
- PUT /journal_entries/{transactionId} — Update (lines 93-120)
- PATCH /journal_entries/{transactionId} — Update status (lines 122-152)
- DELETE /journal_entries/{transactionId} — Delete (lines 154-171)

**List parameters (lines 44-53):**
- date_from
- date_to
- search (journal_entries search)
- status
- page
- page_size
- sort_by (transactions)
- sort_dir

**Response structure:**
- List: `{ paging: {...}, transactions: [...] }`
- Single: `{ transaction: {...} }`

**Status update (PATCH):**
- Request: `{ status: "draft" | "ready" | "void" }`
- Description references: './description/update_transaction_status.yaml'

### Accounts Endpoint

**Base path:** `/accounts`

**Operations:**
- POST /accounts — Create (accounting.yaml lines 174-198)
- GET /accounts — List with filters (lines 200-227)
- GET /accounts/{accountId} — Read single (lines 229-253)
- PUT /accounts/{accountId} — Update (lines 255-279)
- PATCH /accounts/{accountId} — Archive/Unarchive (lines 282-306)
- DELETE /accounts/{accountId} — Delete (lines 309-327)

**List parameters (lines 337-383):**
- search (Name, Code, Description)
- category (assets | liabilities | equity | income | expenses)
- is_archived (boolean, default false)
- sort_by (code | name | balance, default "code")
- sort_dir (asc | desc, default "asc")

**Response structure:**
- List: `{ accounts: [...] }` (lines 217-219)
- Single: `{ account: {...} }` (lines 188-190)

**Archive structure (PATCH):**
- Request: `{ is_archived: boolean }`
- Schema: reqArchiveAccount (lines 511-517)

**Delete constraint (line 313-314):**
> Only accounts that are not assigned to locked system type, have no children or not used can be deleted.

**Account type enums:**
- type (lines 419-430): current_assets, non_current_assets, other_assets, current_liabilities, non_current_liabilities, equity, income, other_income, cost_of_sales, expenses, taxation
- system_type (lines 431-445): bank_cash, accounts_receivable, accounts_payable, inventory, credit_card, fixed_assets, depreciation, my_epf_expense, my_socso_expense, my_eis_expense, my_salary_expense

## State of the Art

| Aspect | Current Approach | Traditional Approach | Impact |
|--------|-----------------|---------------------|--------|
| Journal entry validation | Client-side pre-validation before API call | Server-side only validation | Immediate feedback, conversational error messages |
| Error message format | "Total debits: X, Total credits: Y, Difference: Z" | "Entry is unbalanced" or raw API error | Claude can self-correct with specific amounts |
| Account deletion | businessRules guide to archive, API enforces | Try delete, catch error, show generic message | Proactive guidance prevents failed operations |
| Tool chaining guidance | create-journal-entry description mentions list-accounts | No cross-tool hints in descriptions | LLM discovers correct workflow (list accounts → create entry) |
| Reference data integration | Reuse Phase 5 cached list-accounts, avoid duplication | Generate separate list tool, possible conflicts | Single source of truth, faster lookups |

**Modern accounting software patterns (2026):**
- All systems validate debits = credits at creation time (Odoo, QuickBooks, Xero)
- Error messages include numerical breakdown of imbalance
- Archive/inactive preferred over delete for accounts with history
- System-type accounts (locked) prevent deletion even without transactions

**No deprecated patterns in accounting.yaml:** API spec is v1.0, modern REST design, follows same patterns as sales/purchases.

## Open Questions

1. **Minimum line count enforcement**
   - What we know: User decision left this to Claude's discretion
   - What's unclear: Does Bukku API reject journal entries with < 2 lines, or accept them?
   - Recommendation: Enforce minimum 2 lines client-side with clear error message. Prevents confusion from API rejection and aligns with double-entry principle (must have at least one debit and one credit).

2. **Multi-currency journal entries**
   - What we know: API schema likely has currency_code and exchange_rate fields (standard across all Bukku transaction endpoints)
   - What's unclear: Are journal entry line items multi-currency (each line can be different currency), or is currency per entry?
   - Recommendation: Check API spec during implementation. If per-entry currency, validation sums in entry currency. If per-line currency, may need currency conversion before balance check (or skip validation, let API handle).

3. **Status workflow completeness**
   - What we know: PATCH endpoint exists for status update (accounting.yaml line 122)
   - What's unclear: Valid status values (draft/ready/void assumed from transaction pattern, but not explicitly verified in accounting.yaml schemas)
   - Recommendation: Include update-status tool (hasStatusUpdate: true), verify status enum during implementation, align with sales/purchases pattern if schema references transaction_update_status.yaml.

4. **Archive vs Delete preference**
   - What we know: API supports both archive (PATCH) and delete (DELETE) for accounts
   - What's unclear: What Bukku's best practice guidance is — always archive, or delete if never used?
   - Recommendation: businessRules says "use archive if has history" — implies delete is OK for unused accounts. This aligns with standard accounting practice.

5. **Account list pagination**
   - What we know: GET /accounts supports search, category, is_archived, sort_by, sort_dir
   - What's unclear: Does it support page/page_size like other list endpoints? accounting.yaml doesn't show these in accounts list parameters (lines 200-227).
   - Recommendation: Accounts list may be unpaginated (returns all accounts). Chart of accounts is typically small (< 500 accounts). If pagination needed, API may accept standard page/page_size params even if undocumented. Test during implementation.

## Sources

### Primary (HIGH confidence)
- `/Users/ylchow/Centry/bukku-mcp/.api-specs/accounting.yaml` — Official OpenAPI spec for Bukku Accounting API (v1.0)
- `/Users/ylchow/Centry/bukku-mcp/src/tools/factory.ts` — Phase 1 CRUD factory implementation
- `/Users/ylchow/Centry/bukku-mcp/src/tools/custom/reference-data.ts` — Phase 5 list-accounts tool (reference data)
- `/Users/ylchow/Centry/bukku-mcp/src/tools/custom/contact-archive.ts` — Archive tool pattern for reuse
- `/Users/ylchow/Centry/bukku-mcp/src/types/bukku.ts` — CrudEntityConfig interface
- `.planning/phases/06-accounting/06-CONTEXT.md` — User decisions from phase discussion

### Secondary (MEDIUM confidence)
- [Odoo Forum - Unbalanced Journal Entry Error](https://www.odoo.com/forum/help-1/user-error-x-cannot-create-unbalanced-journal-entry-ids-20-differences-debit-credit-16085-19-197626) - Error message format
- [How to Write Journal Entries](https://www.accountingtools.com/articles/how-do-i-write-an-accounting-journal-entry.html) - Minimum 2 line items requirement
- [Odoo Chart of Accounts](https://www.odoo.com/documentation/19.0/applications/finance/accounting/get_started/chart_of_accounts.html) - Account deletion constraints
- [NetSuite Account Deletion](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1444958.html) - Account deletion rules
- [Journal Entry Best Practices](https://www.adaptcfo.com/post/why-most-people-get-journal-entries-wrong-and-how-to-fix-it) - Validation and error handling
- [Adjusting Journal Entries Guide 2026](https://www.growexx.com/blog/adjusting-journal-entries-guide-examples/) - Current best practices

### Tertiary (LOW confidence)
- General web search results on double-entry bookkeeping principles
- Accounting Coach explanations of debits and credits

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All infrastructure exists from Phase 1-5, zero new dependencies
- Architecture: HIGH - Patterns verified against accounting.yaml spec and existing code
- Pitfalls: HIGH - Derived from standard accounting practices and observed API patterns
- Double-entry validation: HIGH - Well-defined rule, standard practice across all accounting systems
- Account operations: MEDIUM - API spec clear, but missing pagination details for accounts list
- Multi-currency handling: LOW - Schema details not fully verified in accounting.yaml references

**Research date:** 2026-02-08
**Valid until:** 60 days (stable accounting API, v1.0 spec unlikely to change)
**OpenAPI spec version:** v1.0 (accounting.yaml line 4)

**Critical for planning:**
- Journal entry tools: 6 tools (list, get, create, update, delete, update-status)
- Account tools: 5 tools (get, create, update, delete, archive)
- Custom validation function for double-entry balance check
- Enhanced create-journal-entry description mentioning list-accounts tool chaining
- Conflict resolution: Don't generate list-accounts from factory (use Phase 5 reference data)
- Archive tool follows contact-archive.ts pattern
