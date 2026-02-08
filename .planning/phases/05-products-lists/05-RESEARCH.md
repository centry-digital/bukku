# Phase 5: Products & Lists - Research

**Researched:** 2026-02-08
**Domain:** Product catalog management and reference data caching
**Confidence:** HIGH

## Summary

Phase 5 introduces product catalog CRUD tools (products, bundles, groups) and reference data access with caching. The Bukku API provides comprehensive product management through three distinct entity types under the `/products` hierarchy, plus a unified reference data endpoint at `/v2/lists` that returns 26+ different reference data types (tax codes, currencies, payment methods, etc.) via a single POST endpoint with type selectors.

Products have complex nested structures (units, prices, inventory tracking) but follow the established pass-through validation pattern — let the API validate relationships and constraints. Product bundles aggregate multiple products with discount capabilities. Product groups organize products into categories, similar to contact groups.

Reference data is ideal for caching: relatively stable, frequently accessed, and returned via a single aggregated endpoint. A simple in-memory Map-based cache with 5-minute TTL is recommended — no external dependencies needed, transparent to tool users, and easy to implement.

**Primary recommendation:** Use factory pattern for all entities (products, bundles, groups, and each reference data type), implement transparent in-memory caching for reference data only (not product listings), and surface product-specific business rules in tool descriptions.

## User Constraints (from CONTEXT.md)

<user_constraints>

### Locked Decisions

**Reference data caching:**
- 5-minute TTL as specified in roadmap
- Stale data is "somewhat important" — if user creates a new tax code in Bukku web UI mid-session, a way to get fresh data would be nice but not critical

**List tool design:**
- Full CRUD for reference data (not read-only) — users may want to manage everything through Claude
- Auto-lookup behavior: Claude should use context to decide when to proactively fetch reference data vs ask the user. When instructions are unclear or vague, check with the user rather than assuming

**Product data shape:**
- Let Bukku API validate bundle relationships — same pass-through pattern as sales/purchases
- Researcher should discover product-specific business rules and constraints from API specs before deciding what to embed in tool descriptions
- Researcher should discover all available product list filters from OpenAPI spec
- Researcher should discover how product groups relate to products in the API

**Tool naming & grouping:**
- Same CRUD naming pattern for reference data tools (list-tax-codes, create-tax-code) — consistent with all other tools
- Use factory pattern (CrudEntityConfig) for reference data tools, same as products/sales/purchases
- Not concerned about tool count — expose everything the API offers
- Cross-reference related tools in descriptions (e.g., "Use list-tax-codes to find valid tax codes before creating invoices")

### Claude's Discretion

- Cache implementation approach (transparent vs explicit refresh, in-memory vs persisted, scope)
- One-tool-per-list vs single lookup tool for reference data
- Whether to cache product listings alongside reference data
- Product filter selection (after research reveals what's available)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ^5.9.3 | Type-safe product/reference configs | Already in project, zero new dependencies |
| Zod | ^4.3.6 | Runtime validation for tool inputs | Already used in factory pattern |
| @modelcontextprotocol/sdk | ^1.26.0 | MCP tool registration | Project foundation |

### Supporting

No additional libraries needed. The project already has all necessary dependencies.

### Cache Implementation

**Recommendation: Hand-rolled Map-based cache (no external dependency)**

| Approach | Tradeoff |
|----------|----------|
| Hand-rolled Map + setTimeout | Simple, zero dependencies, 20 lines of code, sufficient for 5-minute TTL |
| node-cache library | Adds dependency, more features than needed (events, stats, clone), 500KB+ |
| lru-cache library | Memory-bounded but overkill for stable reference data with known item counts |

**Why hand-rolled wins:**
- Reference data has predictable size (26 list types, each with dozens to hundreds of items)
- 5-minute TTL is simple — no complex eviction logic needed
- Project philosophy favors minimal dependencies
- Transparent caching fits MCP tool model better than explicit cache management tools

**Installation:**
```bash
# No installation needed — use existing dependencies only
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── tools/
│   ├── configs/
│   │   ├── product.ts              # Product CrudEntityConfig
│   │   ├── product-bundle.ts       # Bundle CrudEntityConfig
│   │   ├── product-group.ts        # Group CrudEntityConfig
│   │   ├── tax-code.ts             # Reference data configs (one per type)
│   │   ├── currency.ts
│   │   ├── payment-method.ts
│   │   └── ...                     # Additional reference types
│   └── cache/
│       └── reference-cache.ts      # Transparent in-memory cache with 5-min TTL
└── client/
    └── bukku-client.ts             # Extend with cached reference data methods
```

### Pattern 1: Product Entity Configuration

**What:** Standard CrudEntityConfig for products following established pattern

**When to use:** Products have standard CRUD operations but complex nested data (units, prices, groups)

**Example:**
```typescript
// Source: Derived from src/tools/configs/contact.ts pattern + product.yaml spec

import type { CrudEntityConfig } from "../../types/bukku.js";

export const productConfig: CrudEntityConfig = {
  entity: "product",
  apiBasePath: "/products",
  singularKey: "product",  // NOT "transaction" — products use custom wrapper
  pluralKey: "products",
  description: "product",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: false,  // Products use is_archived via PATCH, not status
  listFilters: ["search", "stock_level", "mode", "type", "include_archived"],
  businessRules: {
    delete: "Only products that are not used in any transactions can be deleted. Archive instead if the product has transaction history.",
  },
};
```

**Key filters discovered from product.yaml:**
- `search`: Searches Name, SKU, Sale Description, Purchase Description, Remarks (maxLength: 60)
- `stock_level`: enum ["all", "no_stock", "low_stock"]
- `mode`: enum ["sale", "purchase"]
- `type`: enum ["product", "bundle"]
- `include_archived`: boolean
- `sort_by`: enum ["name", "sku", "sale_price", "purchase_price", "quantity"]

### Pattern 2: Product Bundle Configuration

**What:** Bundles are products that aggregate other products with discounts

**When to use:** Bundles have different API path (/products/bundles) and response wrapper (bundle object)

**Example:**
```typescript
// Source: Derived from product.yaml lines 175-301

export const productBundleConfig: CrudEntityConfig = {
  entity: "product-bundle",
  apiBasePath: "/products/bundles",
  singularKey: "bundle",  // Custom wrapper key
  pluralKey: "bundles",   // List endpoint returns array under "bundles" key
  description: "product bundle",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: false,  // Bundles use is_archived via PATCH
  listFilters: [],  // No filters discovered in spec — bundles list has no query params
  businessRules: {
    delete: "Only bundles that are not used in any transactions can be deleted.",
  },
};
```

**Bundle relationship discovery (product.yaml):**
- Bundles contain `items` array with: `product_id`, `quantity`, `product_unit_id`, `sale_discount_amount`, `purchase_discount_amount`
- Bundle validation is API-side — tools pass through full bundle structure
- Bundles can belong to product groups via `group_ids` array

### Pattern 3: Product Group Configuration

**What:** Simplest entity — groups organize products into categories

**When to use:** Groups have minimal data (name + product_ids array), similar to contact groups

**Example:**
```typescript
// Source: Derived from product.yaml lines 303-425 + contact-group.ts pattern

export const productGroupConfig: CrudEntityConfig = {
  entity: "product-group",
  apiBasePath: "/products/groups",
  singularKey: "group",
  pluralKey: "groups",
  description: "product group",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: false,
  listFilters: [],  // No entity-specific filters
  // No businessRules — groups have no delete constraints per spec
};
```

**Group relationship discovery:**
- Products have `group_ids: number[]` field linking to groups
- Groups have `product_ids: number[]` field (can be empty array)
- List response includes `products_count` field for each group

### Pattern 4: Transparent Reference Data Cache

**What:** In-memory Map-based cache with automatic 5-minute expiry, transparent to tool callers

**When to use:** Reference data (tax codes, currencies, payment methods) that changes infrequently

**Example:**
```typescript
// Source: Synthesized from web search findings on Map-based TTL cache patterns
// https://oneuptime.com/blog/post/2026-01-30-nodejs-memory-cache-ttl/view
// https://medium.com/@vcardozo/implementing-caching-in-node-js-with-typescript-decorators-7f9396c6ccbf

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class ReferenceDataCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly ttlMs = 5 * 60 * 1000;  // 5 minutes

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);  // Lazy deletion on access
      return undefined;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}
```

**Cache visibility decision: TRANSPARENT**
- No explicit refresh tool needed — cache is implementation detail
- Tools always return fresh-looking data (either from cache or API)
- If user says "get latest tax codes", cache automatically expires after 5 minutes
- Matches user requirement: stale data is "somewhat important" but not critical

### Pattern 5: Reference Data via Unified Lists Endpoint

**What:** Bukku's `/v2/lists` endpoint returns multiple reference types in one request

**When to use:** Claude needs tax codes, currencies, payment methods, etc.

**API structure discovered from lists.yaml:**
```typescript
// POST /v2/lists
// Request body:
{
  lists: ["tax_codes", "currencies", "payment_methods"],
  params: []  // Optional params for specific lists
}

// Response:
{
  tax_codes: [...],
  currencies: [...],
  payment_methods: [...]
}
```

**Available reference list types (from lists.yaml enum at line 147):**
1. `countries` - All countries ordered by name
2. `currencies` - User's activated currencies
3. `contacts` - All contacts (duplicates /contacts API)
4. `contact_addresses` - All contact addresses
5. `company_addresses` - All company addresses
6. `contact_groups` - All contact groups
7. `classification_code_list` - Product classification codes (Malaysia LHDN)
8. `products` / `product_list` / `product` - Product data variants
9. `product_groups` - Product groups
10. `accounts` - Chart of accounts
11. `terms` - Payment terms
12. `payment_methods` - Payment methods
13. `price_levels` - Custom pricing tiers
14. `tag_groups` - Tag categorization
15. `asset_types` - Fixed asset categories
16. `fields` - Custom field definitions
17. `numberings` - Document numbering schemes
18. `form_designs` - Custom form templates
19. `locations` - Inventory locations
20. `stock_balances` - Current stock levels
21. `tax_codes` - Tax rate definitions
22. `settings` - Company settings
23. `limits` - Subscription limits
24. `users` - User accounts
25. `advisors` - Advisor accounts
26. `state_list` - Geographic states

**Recommendation: One tool per reference type (NOT single lookup tool with type parameter)**

**Why separate tools:**
- Matches established CRUD pattern (`list-tax-codes`, `list-currencies`)
- Tool descriptions can be reference-specific ("Tax codes define rates for invoices")
- Claude can discover tools by semantic search ("currency" finds `list-currencies`)
- User explicitly said "not concerned about tool count"
- Consistent with existing pattern (`list-contacts`, `list-contact-groups`)

**Which reference types to expose as full CRUD:**

| Reference Type | Expose As | Rationale |
|----------------|-----------|-----------|
| `tax_codes` | Full CRUD | User creates custom tax rates (e.g., "Export 0%", "Standard 6%") |
| `currencies` | Full CRUD | User activates currencies for multi-currency transactions |
| `payment_methods` | Full CRUD | User defines custom payment methods (e.g., "Bank Transfer", "Cash") |
| `accounts` | Full CRUD | Chart of accounts — fundamental accounting structure |
| `terms` | Full CRUD | Payment terms (e.g., "Net 30", "Due on Receipt") |
| `price_levels` | Full CRUD | Custom pricing tiers for volume discounts |
| `countries` | List only | Static data, unlikely to need CRUD |
| `classification_code_list` | List only | Malaysia tax classification, user doesn't create these |
| `product_groups` | Use /products/groups API | Already covered by product-group config |
| `contacts` | Use /contacts API | Already covered by contact config |
| `settings` | List only | Read-only system settings |
| `limits` | List only | Read-only subscription limits |
| `users` | Full CRUD | User management (add/remove team members) |
| `fields` | Full CRUD | Custom field definitions for extensions |
| `numberings` | Full CRUD | Document numbering schemes |
| `form_designs` | Full CRUD | Custom invoice/quote templates |
| `locations` | Full CRUD | Warehouse/inventory locations |
| `asset_types` | Full CRUD | Fixed asset categories |
| `tag_groups` | Full CRUD | Tagging system for categorization |
| `advisors` | List only | External advisors, likely read-only |
| `stock_balances` | List only | Derived data, cannot create directly |

**Cache strategy for reference data:**
- Cache LIST operations only (not GET by ID, not CREATE/UPDATE/DELETE)
- Cache key: reference type name (e.g., "tax_codes")
- Invalidate cache entry on CREATE/UPDATE/DELETE for that type
- Do NOT cache product listings (products change frequently with transactions)

### Pattern 6: Cross-Reference Tool Descriptions

**What:** Tool descriptions guide Claude to chain workflows correctly

**When to use:** Tools that depend on reference data from other tools

**Example:**
```typescript
// In product.ts config:
description: "product. Use list-tax-codes to find valid tax code IDs for sale_tax_code_id and purchase_tax_code_id. Use list-accounts to find valid account IDs for sale_account_id, purchase_account_id, and inventory_account_id."

// In sales-invoice.ts config (updated):
description: "sales invoice. Use list-tax-codes to find valid tax codes, list-currencies for currency codes, and list-payment-methods for payment method IDs before creating invoices."
```

### Anti-Patterns to Avoid

- **Explicit cache management tools:** Don't expose "refresh-cache" or "clear-cache" tools — caching is transparent implementation detail
- **Single lookup tool with type parameter:** `get-reference-data(type, id)` is less discoverable than `list-tax-codes()`
- **Caching product listings:** Products change with every transaction — cache only stable reference data
- **Custom validation:** Let API validate product/bundle relationships, units, prices — pass through

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Product validation | Custom unit/price/bundle validators | API validation (pass-through) | API enforces complex business rules (base units, sale/purchase defaults, bundle item relationships) |
| Cache eviction | Complex LRU/expiry algorithms | Map + setTimeout with lazy deletion | Reference data is small and stable; TTL-based expiry is sufficient |
| Reference data normalization | Transform API responses into common shape | Return API response as-is | Different reference types have different structures; tools expose raw API shape |
| Stale cache detection | Version tracking, ETags, polling | Simple time-based expiry | User requirement: "stale data is somewhat important" — 5-minute TTL is acceptable |

**Key insight:** Reference data caching is a performance optimization, not a correctness requirement. Simple solutions work because reference data changes infrequently and users can tolerate 5-minute staleness. The API handles all validation complexity for products — tools just pass data through.

## Common Pitfalls

### Pitfall 1: Over-engineering Cache Invalidation

**What goes wrong:** Implementing complex cache invalidation logic (webhooks, polling, version tracking) for reference data

**Why it happens:** Fear of stale data; desire for "real-time" accuracy

**How to avoid:**
- User explicitly said stale data is "somewhat important" — not critical
- 5-minute TTL handles 95% of cases (user creates tax code in web UI, waits < 5 min to use in Claude)
- On CREATE/UPDATE/DELETE, clear that specific reference type from cache immediately
- For edge cases (user urgently needs fresh data), 5-minute expiry handles it automatically

**Warning signs:** Adding dependencies like Redis, implementing pub/sub, writing cache versioning logic

### Pitfall 2: Confusing Product Types

**What goes wrong:** Treating products, bundles, and groups as a single entity with type parameter

**Why it happens:** They're all under `/products` hierarchy and share some fields

**How to avoid:**
- Separate API paths: `/products`, `/products/bundles`, `/products/groups`
- Different response wrappers: `product`, `bundle`, `group`
- Different data shapes: bundles have `items[]`, groups have `product_ids[]`, products have `units[]`
- Use 3 separate CrudEntityConfig objects, each with distinct entity name

**Warning signs:** Trying to merge into single config with `type` parameter; complex conditional logic in factory

### Pitfall 3: Mixing Product Lists with Reference Lists

**What goes wrong:** Treating product listings as reference data and caching them

**Why it happens:** Both are "lists", API has products in /v2/lists endpoint

**How to avoid:**
- Products change frequently (every transaction updates stock, creates new products)
- Reference data is stable (tax codes, currencies rarely change)
- Cache only reference data (tax_codes, currencies, payment_methods)
- Do NOT cache product listings — always fetch fresh from /products

**Warning signs:** Seeing stale product stock levels, missing newly created products

### Pitfall 4: Ignoring Product-Specific Business Rules

**What goes wrong:** Not surfacing delete constraints and archive patterns in tool descriptions

**Why it happens:** Copying sales/purchase patterns without checking product.yaml spec

**How to avoid:**
- Product delete: "Only products that are not used can be deleted" (line 159 of product.yaml)
- Products use `is_archived` boolean via PATCH (line 127-152), NOT status string
- Same pattern as contacts — archive instead of delete for items with history
- Bundles and groups have same delete constraint

**Warning signs:** Tools fail with "product is in use" errors; users confused why delete fails

### Pitfall 5: Not Discovering All List Filters

**What goes wrong:** Missing critical filters from product list endpoint

**Why it happens:** Only reading summary docs, not examining parameter definitions

**How to avoid:**
- Product.yaml lines 448-497 define ALL query parameters
- Key filters: `search` (searches 5 fields), `stock_level` (inventory filtering), `mode` (sale vs purchase), `type` (product vs bundle), `include_archived`
- Sort options: name, sku, sale_price, purchase_price, quantity
- Include ALL filters in listFilters array for factory to expose

**Warning signs:** Users can't find low-stock items; can't filter by SKU; can't search descriptions

## Code Examples

### Product CRUD Configuration

```typescript
// Source: Synthesized from product.yaml + contact.ts pattern

import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Product Entity Configuration
 *
 * API: /products
 * Response keys: product (singular), products (plural)
 *
 * Products have complex nested structures:
 * - units[] (base unit, sale/purchase units, pricing per unit)
 * - sale_prices[] and purchase_prices[] (custom pricing tiers)
 * - group_ids[] (organization into product groups)
 *
 * Archive via PATCH { is_archived: boolean }, not status field.
 * Delete constraint: Can only delete products not used in transactions.
 */
export const productConfig: CrudEntityConfig = {
  entity: "product",
  apiBasePath: "/products",
  singularKey: "product",
  pluralKey: "products",
  description: "product. Use list-tax-codes to find valid tax code IDs for sale_tax_code_id and purchase_tax_code_id. Use list-accounts to find valid account IDs for sale_account_id, purchase_account_id, and inventory_account_id.",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: false,
  listFilters: ["search", "stock_level", "mode", "type", "include_archived"],
  businessRules: {
    delete: "Only products that are not used in any transactions can be deleted. Archive instead if the product has transaction history.",
  },
};
```

### Reference Data Cache Implementation

```typescript
// Source: Synthesized from Map-based TTL cache patterns
// https://oneuptime.com/blog/post/2026-01-30-nodejs-memory-cache-ttl/view

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * Transparent in-memory cache for Bukku reference data.
 *
 * - 5-minute TTL per roadmap requirement
 * - Lazy deletion (items removed on access if expired)
 * - Automatically invalidated on CREATE/UPDATE/DELETE operations
 * - Cache key = reference data type (e.g., "tax_codes")
 */
export class ReferenceDataCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly ttlMs = 5 * 60 * 1000;  // 5 minutes

  /**
   * Get cached data if exists and not expired.
   * Returns undefined if cache miss or expired.
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);  // Lazy deletion
      return undefined;
    }

    return entry.data as T;
  }

  /**
   * Store data with 5-minute expiry.
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  /**
   * Clear specific cache entry (called after CREATE/UPDATE/DELETE).
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cached data.
   */
  clear(): void {
    this.cache.clear();
  }
}
```

### Reference Data Tool Registration Pattern

```typescript
// Source: Synthesized from factory.ts + lists.yaml discovery

/**
 * Register reference data tool with transparent caching.
 *
 * List operations check cache first, fetch from API if miss, store in cache.
 * CREATE/UPDATE/DELETE operations invalidate cache for that reference type.
 */
function registerReferenceDataTools(
  server: McpServer,
  client: BukkuClient,
  cache: ReferenceDataCache,
  referenceType: string
): number {
  const toolName = `list-${referenceType.replace(/_/g, '-')}`;

  server.tool(
    toolName,
    `List all ${referenceType} reference data. Used for validating IDs in other operations.`,
    {},
    async () => {
      try {
        // Check cache first
        const cached = cache.get(referenceType);
        if (cached) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }],
          };
        }

        // Cache miss — fetch from API
        const result = await client.post("/v2/lists", {
          lists: [referenceType],
          params: [],
        });

        // Store in cache
        cache.set(referenceType, result);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        if (error instanceof Response) {
          const body = await error.json().catch(() => null);
          return transformHttpError(error.status, body, toolName);
        }
        return transformNetworkError(error, toolName);
      }
    }
  );

  return 1;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate endpoints for each reference type | Unified /v2/lists endpoint with type selectors | Bukku API v2 | Single endpoint reduces round-trips, enables batch fetching multiple reference types |
| External cache libraries (Redis, node-cache) | Simple Map-based in-memory cache | 2024-2026 trend | Minimal dependencies, sufficient for MCP server use case (single-process, short-lived sessions) |
| Manual cache invalidation | TTL-based auto-expiry | Always preferred | Simpler implementation, acceptable for reference data that changes infrequently |
| Products as transaction entities | Products as separate domain with custom wrappers | Bukku API design | Products are NOT transactions (no status lifecycle), use product/products wrappers instead of transaction/transactions |

**Deprecated/outdated:**
- Individual GET endpoints for reference data (use /v2/lists instead)
- Complex cache invalidation strategies for MCP servers (TTL is sufficient)

## Open Questions

1. **Should product bundle list endpoint support filters?**
   - What we know: product.yaml shows no query parameters for GET /products/bundles
   - What's unclear: Is this intentional (bundles don't need filtering) or oversight in spec?
   - Recommendation: Start with `listFilters: []` per spec; add filters in future phase if users request

2. **Should we expose all 26 reference types or prioritize core ones?**
   - What we know: User said "not concerned about tool count — expose everything the API offers"
   - What's unclear: Some reference types (stock_balances, settings, limits) are derived/read-only — do they need CRUD?
   - Recommendation:
     - Phase 5 core: tax_codes, currencies, payment_methods, accounts, terms, price_levels (6 CRUD + 6 list-only = 12 entities)
     - Future phases: users, fields, numberings, form_designs, locations, asset_types, tag_groups (7 entities)
     - Never expose: stock_balances (derived), settings (read-only), limits (subscription info)

3. **Should we cache product groups alongside reference data?**
   - What we know: Product groups are relatively stable, accessed via /products/groups API
   - What's unclear: Groups can be updated when products are assigned/removed — caching may cause stale membership
   - Recommendation: Do NOT cache product groups — use factory CRUD without caching (same as contacts)

## Sources

### Primary (HIGH confidence)

- `/Users/ylchow/Centry/bukku-mcp/.api-specs/product.yaml` - Complete product/bundle/group endpoint definitions
- `/Users/ylchow/Centry/bukku-mcp/.api-specs/lists.yaml` - Unified reference data endpoint structure and all 26 available list types
- `/Users/ylchow/Centry/bukku-mcp/src/tools/factory.ts` - Established CRUD factory pattern
- `/Users/ylchow/Centry/bukku-mcp/src/tools/configs/contact.ts` - Non-transaction entity pattern (custom wrapper keys, archive via PATCH)
- `/Users/ylchow/Centry/bukku-mcp/src/tools/configs/sales-invoice.ts` - Business rules pattern (delete constraints, status transitions)

### Secondary (MEDIUM confidence)

- [How to Create Memory Cache with TTL in Node.js](https://oneuptime.com/blog/post/2026-01-30-nodejs-memory-cache-ttl/view) - Map-based cache implementation patterns (published 2026-01-30)
- [Boost Performance with ts-cacheable](https://medium.com/@psinha6/boost-performance-with-ts-cacheable-a-complete-guide-to-caching-in-typescript-01a5230088b9) - TypeScript caching best practices
- [Building a Lightning-Fast In-Memory Cache with TypeScript and LRU](https://bhaireshm.medium.com/building-a-lightning-fast-in-memory-cache-with-typescript-and-lru-1917560a07fa) - LRU cache patterns (overkill for this use case)
- [map-cache-ttl - npm](https://www.npmjs.com/package/map-cache-ttl) - External library option (not recommended due to added dependency)
- [Simple TS caching mechanism](https://gist.github.com/kendallroth/2914a5a5d62bccbf1634329405fcac7f) - Community code examples

## Metadata

**Confidence breakdown:**
- Product entity structure: HIGH - Directly from OpenAPI specs with examples
- Bundle relationships: HIGH - API spec shows complete schema with item structure
- Reference data types: HIGH - Complete enum list from lists.yaml
- Cache implementation: HIGH - Simple pattern, well-documented, no exotic features
- Business rules: HIGH - Explicitly stated in product.yaml (delete constraints, archive pattern)
- Filter discovery: HIGH - Complete parameter definitions in spec lines 448-497

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (30 days — stable domain, API specs unlikely to change rapidly)
