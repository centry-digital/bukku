# Architecture Research

**Domain:** MCP Server for REST API Wrapper (Bukku Accounting API)
**Researched:** 2026-02-06
**Confidence:** HIGH

## Standard Architecture

MCP servers that wrap REST APIs follow a layered architecture pattern that separates concerns between protocol handling, business logic, and external API communication.

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Client Layer                          │
│              (Claude Desktop, Cline, etc.)                   │
└────────────────────────┬────────────────────────────────────┘
                         │ JSON-RPC over STDIO/HTTP
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                  Transport Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  STDIO       │  │  HTTP/SSE    │  │  WebSocket   │       │
│  │  Transport   │  │  Transport   │  │  (future)    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└────────────────────────┬────────────────────────────────────┘
                         │ MCP Protocol Messages
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   MCP Server Core                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Server Instance (capabilities, lifecycle)            │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Tool Registry (tool registration & routing)          │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ Tool Calls
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   Tool Handler Layer                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Sales   │  │Purchase │  │ Banking │  │Contacts │        │
│  │ Tools   │  │ Tools   │  │ Tools   │  │ Tools   │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       └───────────┬┴────────────┴┴────────────┘             │
└───────────────────┼──────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────┐
│                  API Client Layer                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │   Base HTTP Client (auth, headers, error handling)  │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ Request  │  │ Response │  │  Error   │                   │
│  │ Builder  │  │  Parser  │  │ Handler  │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP Requests
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              External REST API (Bukku)                       │
│  api.bukku.my (Bearer token + Company-Subdomain header)     │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Transport Layer | Handle communication protocol (STDIO, HTTP, etc.) | `@modelcontextprotocol/sdk` transports |
| MCP Server Core | Protocol compliance, tool registration, lifecycle | `McpServer` from SDK |
| Tool Registry | Map tool names to handlers, validate schemas | Built into SDK server |
| Tool Handlers | Business logic per tool, parameter validation | Custom TypeScript functions |
| API Client | HTTP communication, auth, retry logic | `fetch` or `axios` with wrappers |
| Request Builder | Construct REST API requests from tool params | Category-specific builder functions |
| Response Parser | Transform REST responses to MCP format | Mapping functions per endpoint |
| Error Handler | Convert REST errors to MCP-compatible errors | Unified error transformation |

## Recommended Project Structure

For an MCP server wrapping a REST API with ~55 tools across 9 categories, the following structure optimizes for maintainability and avoids code duplication:

```
bukku-mcp/
├── src/
│   ├── index.ts                    # Entry point, server initialization
│   ├── server.ts                   # MCP server setup, transport config
│   │
│   ├── api/                        # API client layer
│   │   ├── client.ts              # Base HTTP client with auth
│   │   ├── types.ts               # Shared API types
│   │   ├── errors.ts              # Error classes and handling
│   │   └── config.ts              # API configuration (base URL, headers)
│   │
│   ├── tools/                      # Tool implementations
│   │   ├── registry.ts            # Tool registration orchestration
│   │   ├── factory.ts             # CRUD tool factory pattern
│   │   ├── schemas.ts             # Shared Zod schemas
│   │   │
│   │   ├── sales/                 # Sales category tools
│   │   │   ├── index.ts          # Export all sales tools
│   │   │   ├── quotations.ts     # Quotation CRUD operations
│   │   │   ├── invoices.ts       # Invoice CRUD operations
│   │   │   └── payments.ts       # Payment CRUD operations
│   │   │
│   │   ├── purchases/             # Purchase category tools
│   │   │   ├── index.ts
│   │   │   ├── bills.ts
│   │   │   └── expenses.ts
│   │   │
│   │   ├── banking/               # Banking category tools
│   │   │   ├── index.ts
│   │   │   └── transactions.ts
│   │   │
│   │   ├── contacts/              # Contact category tools
│   │   │   ├── index.ts
│   │   │   ├── customers.ts
│   │   │   └── suppliers.ts
│   │   │
│   │   ├── products/              # Product category tools
│   │   │   ├── index.ts
│   │   │   └── items.ts
│   │   │
│   │   ├── accounting/            # Accounting category tools
│   │   │   ├── index.ts
│   │   │   └── journal-entries.ts
│   │   │
│   │   ├── lists/                 # List category tools
│   │   │   ├── index.ts
│   │   │   └── metadata.ts
│   │   │
│   │   ├── files/                 # File category tools
│   │   │   ├── index.ts
│   │   │   └── attachments.ts
│   │   │
│   │   └── control-panel/         # Control panel category tools
│   │       ├── index.ts
│   │       └── settings.ts
│   │
│   ├── utils/                      # Shared utilities
│   │   ├── validation.ts          # Input validation helpers
│   │   ├── formatting.ts          # Response formatting
│   │   └── logging.ts             # Logging (stderr for STDIO)
│   │
│   └── types/                      # TypeScript type definitions
│       ├── mcp.ts                 # MCP-specific types
│       ├── bukku.ts               # Bukku API types
│       └── common.ts              # Shared types
│
├── .api-specs/                     # OpenAPI specifications (already exists)
├── tests/                          # Test files
├── package.json
├── tsconfig.json
└── README.md
```

### Structure Rationale

**api/**: Centralizes all REST API communication logic. The `client.ts` handles authentication (Bearer token + Company-Subdomain header), request/response interceptors, and error handling. This ensures DRY principles for HTTP operations.

**tools/**: Organized by domain (matching Bukku's API categories). Each category folder contains related tools. The `factory.ts` implements a reusable pattern for CRUD operations, preventing duplication across the ~55 tools.

**tools/registry.ts**: Orchestrates tool registration with the MCP server. Imports all tool definitions and registers them with appropriate schemas.

**tools/factory.ts**: Critical for avoiding code duplication. Implements a factory function that generates CRUD tools (list, create, read, update, delete) from a configuration object, reducing repetitive code.

**utils/**: Shared helpers used across multiple tools. The `logging.ts` is configured to write to stderr (critical for STDIO transport).

**types/**: Centralized TypeScript types prevent duplication and ensure type safety across the codebase.

## Architectural Patterns

### Pattern 1: CRUD Tool Factory

**What:** A factory function that generates MCP tools for standard CRUD operations, eliminating repetitive code for similar endpoints.

**When to use:** When multiple resources share the same operation patterns (list, create, read, update, delete).

**Trade-offs:**
- Pros: Massive reduction in code duplication, consistent behavior across tools
- Cons: Slightly less flexibility for highly customized endpoints

**Example:**
```typescript
// tools/factory.ts
interface CRUDConfig {
  resourceName: string;
  endpoint: string;
  schemas: {
    list?: z.ZodType;
    create?: z.ZodType;
    read?: z.ZodType;
    update?: z.ZodType;
  };
}

export function createCRUDTools(config: CRUDConfig, apiClient: APIClient) {
  const tools = [];

  if (config.schemas.list) {
    tools.push({
      name: `list_${config.resourceName}`,
      description: `List all ${config.resourceName}`,
      inputSchema: config.schemas.list,
      handler: async (params: any) => {
        const response = await apiClient.get(config.endpoint, params);
        return formatToolResponse(response);
      }
    });
  }

  if (config.schemas.create) {
    tools.push({
      name: `create_${config.resourceName}`,
      description: `Create a new ${config.resourceName}`,
      inputSchema: config.schemas.create,
      handler: async (params: any) => {
        const response = await apiClient.post(config.endpoint, params);
        return formatToolResponse(response);
      }
    });
  }

  // Similar for read, update, delete...
  return tools;
}

// Usage in tools/sales/quotations.ts
import { createCRUDTools } from '../factory';

export const quotationTools = createCRUDTools({
  resourceName: 'quotations',
  endpoint: '/sales/quotes',
  schemas: {
    list: listQuotationSchema,
    create: createQuotationSchema,
    read: readQuotationSchema,
    update: updateQuotationSchema
  }
}, apiClient);
```

### Pattern 2: Composite API Client

**What:** A base HTTP client that handles authentication, headers, error handling, and retry logic, with category-specific clients extending it.

**When to use:** When wrapping any REST API with consistent authentication and error handling patterns.

**Trade-offs:**
- Pros: Centralized auth/error handling, easy to add middleware (logging, metrics)
- Cons: Adds abstraction layer over fetch/axios

**Example:**
```typescript
// api/client.ts
export class BukkuAPIClient {
  private baseURL: string;
  private token: string;
  private subdomain: string;

  constructor(config: APIConfig) {
    this.baseURL = config.baseURL;
    this.token = config.token;
    this.subdomain = config.subdomain;
  }

  private async request<T>(
    method: string,
    path: string,
    data?: any,
    params?: any
  ): Promise<T> {
    const url = new URL(path, this.baseURL);
    if (params) {
      Object.keys(params).forEach(key =>
        url.searchParams.append(key, params[key])
      );
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Company-Subdomain': this.subdomain,
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      throw new BukkuAPIError(response);
    }

    return response.json();
  }

  async get<T>(path: string, params?: any): Promise<T> {
    return this.request<T>('GET', path, undefined, params);
  }

  async post<T>(path: string, data: any): Promise<T> {
    return this.request<T>('POST', path, data);
  }

  // Similar for PUT, DELETE...
}
```

### Pattern 3: Tool Registration with Category Grouping

**What:** Organize tool registration by domain category, with a central registry that imports and registers all tools.

**When to use:** When you have many tools (>20) that logically group into categories.

**Trade-offs:**
- Pros: Easier to find and maintain related tools, clear organization
- Cons: Slightly more files to navigate

**Example:**
```typescript
// tools/registry.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { salesTools } from './sales';
import { purchaseTools } from './purchases';
import { bankingTools } from './banking';
// ... other imports

export function registerAllTools(server: McpServer, apiClient: BukkuAPIClient) {
  // Register sales tools
  salesTools(apiClient).forEach(tool => {
    server.registerTool(tool.name, tool.schema, tool.handler);
  });

  // Register purchase tools
  purchaseTools(apiClient).forEach(tool => {
    server.registerTool(tool.name, tool.schema, tool.handler);
  });

  // ... register other categories
}

// tools/sales/index.ts
export function salesTools(apiClient: BukkuAPIClient) {
  return [
    ...quotationTools(apiClient),
    ...invoiceTools(apiClient),
    ...paymentTools(apiClient),
    // ... other sales resources
  ];
}
```

### Pattern 4: Schema-First Tool Definition

**What:** Define Zod schemas separately and use them for both input validation and tool metadata generation.

**When to use:** Always. TypeScript + Zod provides type safety and runtime validation.

**Trade-offs:**
- Pros: Type safety, automatic validation, schema reuse
- Cons: Learning curve for Zod if unfamiliar

**Example:**
```typescript
// tools/schemas.ts
import { z } from 'zod';

// Shared schemas
export const paginationSchema = z.object({
  page: z.number().min(1).optional(),
  page_size: z.number().min(1).max(100).optional()
});

export const dateRangeSchema = z.object({
  date_from: z.string().optional(),
  date_to: z.string().optional()
});

// Resource-specific schemas
export const listQuotationSchema = z.object({
  search: z.string().optional(),
  contact_id: z.string().optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'declined']).optional()
}).merge(paginationSchema).merge(dateRangeSchema);

export const createQuotationSchema = z.object({
  contact_id: z.string(),
  date: z.string(),
  line_items: z.array(z.object({
    product_id: z.string(),
    quantity: z.number(),
    unit_price: z.number()
  }))
});
```

### Pattern 5: Progressive Tool Discovery (for future scaling)

**What:** Load tools on-demand rather than registering all upfront, organizing them in a hierarchical namespace.

**When to use:** When you have 100+ tools or want to optimize initialization time.

**Trade-offs:**
- Pros: Faster startup, lower memory footprint
- Cons: More complex implementation, not supported by all MCP clients yet

**Note:** This is an emerging pattern for 2026. With ~55 tools, upfront registration is fine, but consider this for future expansion.

## Data Flow

### Request Flow (Tool Call)

```
[MCP Client] "Create a quotation"
    ↓
[Transport Layer] Receives JSON-RPC request
    ↓
[MCP Server Core] Parses tool call: create_quotation
    ↓
[Tool Registry] Routes to quotation tool handler
    ↓
[Tool Handler] Validates params with Zod schema
    ↓
[API Client] Constructs POST /sales/quotes request
    ↓                    ↓
    ↓              [Auth Headers Added]
    ↓                    ↓
    ↓              [Request Sent]
    ↓                    ↓
[External API] Processes request
    ↓
[API Client] Receives HTTP response
    ↓
[Response Parser] Transforms to MCP format
    ↓
[Tool Handler] Returns CallToolResult
    ↓
[MCP Server Core] Formats as JSON-RPC response
    ↓
[Transport Layer] Sends response
    ↓
[MCP Client] Displays result to user
```

### Error Flow

```
[External API] Returns 400/401/500 error
    ↓
[API Client] Catches HTTP error
    ↓
[Error Handler] Transforms to BukkuAPIError
    ↓
[Tool Handler] Catches error, formats as MCP error
    ↓
[MCP Server Core] Returns error result
    ↓
[Transport Layer] Sends error response
    ↓
[MCP Client] Shows error to user
```

### Key Data Flows

1. **Authentication Flow:** Bearer token and Company-Subdomain header are injected by the API client for every request to Bukku API.

2. **Pagination Flow:** List tools accept page/page_size parameters, which are passed as query params to the Bukku API. Responses include pagination metadata.

3. **Schema Validation Flow:** Zod schemas validate input before making API calls. Invalid input returns immediate error without hitting the API.

4. **Response Formatting Flow:** API responses are transformed to MCP's text content format, often converting JSON to readable text summaries.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 55-100 tools | Current architecture works well. Use factory pattern aggressively. |
| 100-200 tools | Consider progressive tool discovery. Group tools into logical packages (e.g., `sales.*`, `purchases.*`). |
| 200+ tools | Implement lazy loading, namespace hierarchy. Consider generating tools from OpenAPI spec automatically. |

### Scaling Priorities

1. **First bottleneck:** Code duplication across CRUD tools. **Fix:** Implement factory pattern early (Phase 1).

2. **Second bottleneck:** Tool registration time if >100 tools. **Fix:** Progressive discovery pattern or lazy registration.

3. **Third bottleneck:** Type safety maintenance. **Fix:** Generate TypeScript types from OpenAPI specs using tools like `openapi-typescript`.

## Anti-Patterns

### Anti-Pattern 1: One File Per Tool

**What people do:** Create a separate file for each of 55 tools with duplicated CRUD logic.

**Why it's wrong:** Results in massive code duplication. A quotation list tool looks 95% identical to an invoice list tool, but you maintain both separately.

**Do this instead:** Use the factory pattern to generate similar tools from configuration. One factory function can generate 5 CRUD operations × 9 categories = 45 tools with minimal code.

### Anti-Pattern 2: Inline Tool Registration

**What people do:** Register all tools directly in `index.ts` or `server.ts`, leading to a 1000+ line file.

**Why it's wrong:** Unmaintainable, hard to test, violates separation of concerns.

**Do this instead:** Use the registry pattern with category-based organization. Each category is a separate module, imported by the central registry.

### Anti-Pattern 3: Not Using Composite Tools

**What people do:** Map REST API 1:1 to MCP tools. If API has 55 endpoints, create 55 tools.

**Why it's wrong:** LLMs work better with higher-level, intent-focused tools. "Create and send invoice" is better than separate "create invoice" + "mark as sent" tools.

**Do this instead:** For common workflows, create composite tools that orchestrate multiple API calls. Reserve granular tools for advanced use cases.

### Anti-Pattern 4: stdout Logging in STDIO Transport

**What people do:** Use `console.log()` for debugging in STDIO-based servers.

**Why it's wrong:** Corrupts JSON-RPC messages, breaking the protocol completely.

**Do this instead:** Always use `console.error()` or a logging library configured for stderr. Better: use a structured logger like `winston` or `pino` with stderr transport.

### Anti-Pattern 5: Ignoring Error Context

**What people do:** Return generic error messages like "API request failed" without context.

**Why it's wrong:** LLMs can't help users fix issues without knowing what went wrong (auth? validation? rate limit?).

**Do this instead:** Parse API error responses and return structured errors with actionable information:
```typescript
{
  content: [{
    type: "text",
    text: "Failed to create quotation: Missing required field 'contact_id'. Please provide a valid contact ID."
  }],
  isError: true
}
```

### Anti-Pattern 6: Hardcoded Credentials

**What people do:** Put API tokens directly in code.

**Why it's wrong:** Security risk, can't switch between staging/production easily.

**Do this instead:** Use environment variables or configuration files (excluded from git). Support multiple environments:
```typescript
const config = {
  baseURL: process.env.BUKKU_API_URL || 'https://api.bukku.my',
  token: process.env.BUKKU_TOKEN,
  subdomain: process.env.BUKKU_SUBDOMAIN
};
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Bukku REST API | HTTP client with Bearer auth | Requires token + subdomain header |
| MCP Clients | STDIO or HTTP transport | Claude Desktop uses STDIO, others may use HTTP |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| MCP Server ↔ Tools | Function calls with schemas | Tools register handlers with server |
| Tools ↔ API Client | Method calls (get, post, etc.) | Tools use shared API client instance |
| API Client ↔ External API | HTTP/REST | Standard REST patterns |
| Tool Registry ↔ Categories | Module imports | Each category exports tool definitions |

## Build Order and Dependencies

### Phase 1: Foundation (Core Infrastructure)
**Build order:** api/client.ts → api/types.ts → api/errors.ts → server.ts → index.ts

**Why first:** Everything else depends on having a working API client and MCP server instance.

### Phase 2: Tool Infrastructure
**Build order:** tools/schemas.ts → tools/factory.ts → tools/registry.ts

**Why second:** Need the factory pattern and registry before building individual tools.

### Phase 3: First Category Implementation (Proof of Concept)
**Build order:** Pick one category (e.g., sales/quotations) → Implement all CRUD operations → Test end-to-end

**Why third:** Validates the architecture works before scaling to all categories.

### Phase 4: Remaining Categories (Parallel Development)
**Build order:** All other categories can be built in parallel using the factory pattern established in Phase 3.

**Why fourth:** Once pattern is proven, categories are independent and can be developed simultaneously.

### Phase 5: Enhanced Features
**Build order:** Error handling improvements → Response formatting → Composite tools

**Why last:** Nice-to-haves that improve UX but aren't blocking.

## Sources

**HIGH Confidence Sources (Official Documentation):**
- [MCP Official Documentation - Build a Server](https://modelcontextprotocol.io/docs/develop/build-server)
- [MCP TypeScript SDK Repository](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Best Practices Guide](https://modelcontextprotocol.info/docs/best-practices/)

**MEDIUM Confidence Sources (Community Examples & Tutorials):**
- [15 Best Practices for Building MCP Servers in Production](https://thenewstack.io/15-best-practices-for-building-mcp-servers-in-production/)
- [How to Build an MCP Server: Architecture Guide](https://www.invatechs.com/blog/how-to-build-an-mcp-server-architecture-guide)
- [GitHub - Filesystem MCP Server (Multi-tool Example)](https://github.com/cyanheads/filesystem-mcp-server)
- [GitHub - MCP Tool Factory for REST APIs](https://github.com/HeshamFS/mcp-tool-factory-ts)
- [FreeCodeCamp - Custom MCP Server Handbook](https://www.freecodecamp.org/news/how-to-build-a-custom-mcp-server-with-typescript-a-handbook-for-developers/)
- [Building Production-Ready MCP Servers in TypeScript](https://maurocanuto.medium.com/building-mcp-servers-the-right-way-a-production-ready-guide-in-typescript-8ceb9eae9c7f)

**Key Findings:**
- CRUD factory pattern is essential for avoiding duplication with many similar endpoints
- Category-based organization scales better than flat file structure
- Composite tools (intent-focused) work better than 1:1 API mapping
- STDIO logging must use stderr, never stdout
- Schema-first approach with Zod provides both type safety and validation

---
*Architecture research for: Bukku MCP Server (REST API Wrapper)*
*Researched: 2026-02-06*
