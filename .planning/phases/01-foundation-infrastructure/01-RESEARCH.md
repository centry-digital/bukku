# Phase 1: Foundation Infrastructure - Research

**Researched:** 2026-02-06
**Domain:** MCP Server Development with TypeScript
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Error message style
- Conversational tone — errors should read naturally in Claude's response (e.g., "Couldn't create the invoice — Bukku says the contact ID doesn't exist. Want me to look up the right contact?")
- Always suggest a next step — every error includes what Claude could do to help fix it
- Auth failures get prominent, distinct treatment — clear callout like "Your Bukku token may be invalid. Check BUKKU_API_TOKEN."
- Multiple validation errors shown all at once — present every field error together so user can fix in one go

#### Tool naming & descriptions
- Kebab-case without prefix: `list-sales-invoices`, `create-sales-invoice`, `get-sales-invoice`
- Relies on MCP server name for namespace context
- Concise one-liner descriptions: "List sales invoices with optional filters"
- Separate tools per CRUD action — 4 tools per entity (create, get, update, delete) plus list
- Dedicated status tools — `update-sales-invoice-status` separate from `update-sales-invoice`

#### Configuration & setup
- Environment variables only — `BUKKU_API_TOKEN` and `BUKKU_COMPANY_SUBDOMAIN`
- No .env file support, no config file
- Immediate crash with checklist on missing config — exit with clear output showing what's missing
- Validate token on startup — make a lightweight Bukku API call to confirm token works before accepting tool calls
- README should be a step-by-step guide — full walkthrough including how to get Bukku API token, Claude Desktop config JSON, and first usage example

### Claude's Discretion
- Type generation approach (auto-generate vs hand-craft from OpenAPI specs)
- Whether OpenAPI specs stay checked in as source of truth or serve as reference only
- Type strictness level (strict vs pragmatic coverage)
- Zod schema source (derived from OpenAPI or written separately)
- Exact error message wording and formatting
- Loading/progress indicators during API calls
- CRUD factory pattern internal architecture

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

</user_constraints>

## Summary

Phase 1 establishes the foundational MCP server infrastructure for the Bukku API integration. This research covers the TypeScript MCP SDK ecosystem, OpenAPI-to-TypeScript type generation, HTTP client patterns, and error transformation strategies essential for building a production-ready MCP server with 55+ tools across 9 API categories.

The standard approach uses the official `@modelcontextprotocol/sdk` (v1.26.0) with stdio transport, Zod v4 for validation, and either `@hey-api/openapi-ts` or `openapi-zod-client` for generating TypeScript types and Zod schemas from OpenAPI specs. Error handling follows MCP's three-tier model (transport, protocol, application) with structured error responses that help LLMs understand failures and suggest recovery actions.

The CRUD factory pattern is critical for this project — with 55+ tools needed, hand-coding each tool would create massive code duplication. The factory pattern generates tool definitions and handlers from a common configuration, ensuring consistency across all CRUD operations while keeping the codebase maintainable.

**Primary recommendation:** Use `@modelcontextprotocol/sdk` v1.26.0 with stdio transport, generate types and Zod schemas from OpenAPI specs using `@hey-api/openapi-ts`, implement a CRUD factory pattern to generate tools programmatically, and validate environment variables at startup with immediate fail-fast behavior.

## Standard Stack

The established libraries/tools for MCP server development with TypeScript:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@modelcontextprotocol/sdk` | 1.26.0 | Official MCP SDK for TypeScript servers | Official implementation, 23,577+ projects using it, stable v1.x recommended for production |
| `zod` | 4.3.5+ | Schema validation and type inference | TypeScript-first validation, runtime safety, used by MCP SDK internally |
| TypeScript | 5.x | Type-safe JavaScript | Required for MCP SDK, catches errors at compile time |
| Node.js | 18+ | Runtime environment | Native fetch support (v18+), stdio transport compatibility |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@hey-api/openapi-ts` | latest | Generate TypeScript types and Zod schemas from OpenAPI | When OpenAPI specs are source of truth (recommended for this project) |
| `openapi-zod-client` | latest | Alternative OpenAPI to Zod generator | If need Zodios client integration, but slower IDE performance |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@hey-api/openapi-ts` | `openapi-zod-client` | Slower generation and IDE suggestions, but tighter Zodios integration |
| Native `fetch` | `axios` | Axios adds bundle size but provides interceptors, automatic JSON parsing, better error handling |
| Stdio transport | HTTP/SSE transport | HTTP more complex setup, stdio is standard for Claude Desktop |

**Installation:**
```bash
npm install @modelcontextprotocol/sdk zod@4
npm install -D @hey-api/openapi-ts @types/node typescript
```

## Architecture Patterns

### Recommended Project Structure
```
bukku-mcp/
├── src/
│   ├── index.ts              # Server entry point, stdio transport setup
│   ├── config/
│   │   └── env.ts            # Environment variable validation (Zod schema)
│   ├── client/
│   │   └── bukku-client.ts   # Authenticated HTTP client wrapper
│   ├── types/
│   │   └── generated/        # OpenAPI-generated types (gitignored or committed)
│   ├── schemas/
│   │   └── generated/        # OpenAPI-generated Zod schemas
│   ├── tools/
│   │   ├── factory.ts        # CRUD factory pattern implementation
│   │   └── registry.ts       # Tool registration logic
│   ├── errors/
│   │   └── transform.ts      # HTTP to MCP error transformation
│   └── utils/
│       └── logger.ts         # Stderr logging utilities
├── .api-specs/               # OpenAPI spec files (already exists)
├── build/                    # Compiled TypeScript output
├── package.json
└── tsconfig.json
```

### Pattern 1: Environment Variable Validation at Startup
**What:** Validate all required environment variables immediately on server startup using Zod schema, exit with clear error message if validation fails.

**When to use:** Always — prevents cryptic runtime errors when config is missing.

**Example:**
```typescript
// src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  BUKKU_API_TOKEN: z.string().min(1, "BUKKU_API_TOKEN is required"),
  BUKKU_COMPANY_SUBDOMAIN: z.string().min(1, "BUKKU_COMPANY_SUBDOMAIN is required"),
});

export function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Configuration Error\n");
    console.error("Missing required environment variables:\n");
    result.error.issues.forEach(issue => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    console.error("\nSetup checklist:");
    console.error("  1. Set BUKKU_API_TOKEN environment variable");
    console.error("  2. Set BUKKU_COMPANY_SUBDOMAIN environment variable");
    console.error("  3. Restart Claude Desktop");
    process.exit(1);
  }

  return result.data;
}
```

### Pattern 2: CRUD Factory for Tool Generation
**What:** Generate MCP tool definitions and handlers programmatically from configuration objects, avoiding code duplication across 55+ similar tools.

**When to use:** When building multiple tools with similar structure (CRUD operations, list/get/create/update/delete patterns).

**Example:**
```typescript
// src/tools/factory.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

interface CrudConfig {
  entity: string;           // "sales-invoice"
  apiPath: string;         // "/sales/invoices"
  operations: ('list' | 'get' | 'create' | 'update' | 'delete')[];
  schemas: {
    list?: z.ZodSchema;
    get?: z.ZodSchema;
    create?: z.ZodSchema;
    update?: z.ZodSchema;
  };
}

export function registerCrudTools(server: McpServer, config: CrudConfig) {
  const { entity, apiPath, operations, schemas } = config;

  if (operations.includes('list')) {
    server.registerTool(
      `list-${entity}`,
      {
        description: `List ${entity.replace('-', ' ')}s with optional filters`,
        inputSchema: schemas.list || z.object({
          page: z.number().optional(),
          page_size: z.number().optional(),
        }),
      },
      async (params) => {
        // HTTP call logic, error transformation
        // Returns structured MCP response
      }
    );
  }

  // Similar for get, create, update, delete...
}
```

### Pattern 3: HTTP to MCP Error Transformation
**What:** Convert HTTP errors (4xx, 5xx) and Bukku API error responses into structured MCP errors with conversational messages that suggest next steps.

**When to use:** Always — wrap every HTTP call to the Bukku API.

**Example:**
```typescript
// src/errors/transform.ts
interface BukkuApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export function transformHttpError(
  error: unknown,
  operation: string
): { isError: true; content: Array<{ type: 'text'; text: string }> } {
  if (error instanceof Response) {
    const status = error.status;

    if (status === 401) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Your Bukku token may be invalid. Check BUKKU_API_TOKEN environment variable and restart Claude Desktop.`
        }]
      };
    }

    if (status === 404) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Couldn't find that ${operation} — Bukku returned 404. Want me to list available items?`
        }]
      };
    }

    // Handle validation errors (400)
    const body = await error.json() as BukkuApiError;
    if (body.errors) {
      const errorList = Object.entries(body.errors)
        .map(([field, messages]) => `  - ${field}: ${messages.join(', ')}`)
        .join('\n');

      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Couldn't ${operation} — Bukku found validation errors:\n${errorList}\n\nWant me to help fix these?`
        }]
      };
    }
  }

  // Fallback for unknown errors
  return {
    isError: true,
    content: [{
      type: 'text',
      text: `Couldn't ${operation} — an unexpected error occurred. Check server logs for details.`
    }]
  };
}
```

### Pattern 4: Stdio Server Setup with Type Safety
**What:** Initialize MCP server with stdio transport, register tools, and handle graceful shutdown.

**When to use:** Main server entry point for Claude Desktop integration.

**Example:**
```typescript
// src/index.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { validateEnv } from './config/env.js';

async function main() {
  // Validate environment variables first
  const env = validateEnv();

  // Create MCP server instance
  const server = new McpServer({
    name: "bukku",
    version: "1.0.0",
  });

  // Register tools using factory pattern
  // (tool registration code here)

  // Setup stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (never stdout for stdio servers!)
  console.error("Bukku MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

### Anti-Patterns to Avoid

- **Logging to stdout in stdio servers:** Corrupts JSON-RPC messages. Always use `console.error()` or dedicated logger writing to stderr.

- **Hand-coding 55+ similar tools:** Creates massive duplication, hard to maintain. Use factory pattern instead.

- **Throwing exceptions from tool handlers:** MCP tools should return `{ isError: true, content: [...] }` for business logic errors, not throw. Exceptions are for protocol-level errors only.

- **Validating inputs in tool handler:** Zod validation happens automatically before handler runs. Don't duplicate validation logic.

- **Exposing internal errors to LLM:** Sanitize error messages — show user-friendly text, log full details to stderr.

- **Using relative imports without file extensions:** TypeScript with `module: "Node16"` requires `.js` extensions in imports even for `.ts` files.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TypeScript types from OpenAPI | Manual type definitions | `@hey-api/openapi-ts` or `openapi-zod-client` | OpenAPI specs have 100+ types, manual definitions get out of sync, generators handle edge cases |
| Zod schemas from OpenAPI | Hand-written Zod schemas | `@hey-api/openapi-ts` Zod plugin | Bidirectional sync (OpenAPI ↔ Zod) prevents drift, handles nested refs and unions correctly |
| HTTP client with retries | Custom fetch wrapper | Consider axios or keep fetch simple | Retries need exponential backoff, jitter, circuit breakers — complex to get right |
| Environment variable validation | Manual `process.env` checks | Zod schema with `safeParse()` | Type inference, clear error messages, single source of truth for config shape |
| Tool registration boilerplate | Copy-paste tool definitions | CRUD factory pattern | 55+ tools = massive duplication, factory ensures consistency, easier to add auth/logging |
| JSON-RPC message handling | Manual stdio parsing | `@modelcontextprotocol/sdk` transport | Protocol is complex, SDK handles edge cases, version negotiation, capabilities discovery |

**Key insight:** This project scales to 55+ tools across 9 API categories. Automation and code generation are not optional optimizations — they're essential architecture. Hand-rolling type definitions or tool registrations will create a maintenance nightmare within weeks.

## Common Pitfalls

### Pitfall 1: Stdout Corruption in Stdio Servers
**What goes wrong:** Using `console.log()`, `print()`, or any stdout writes in stdio-based MCP servers breaks JSON-RPC communication. Server appears to start but Claude Desktop can't communicate with it.

**Why it happens:** Stdio transport sends JSON-RPC messages over stdout. Any non-JSON-RPC output corrupts the message stream.

**How to avoid:**
- Always use `console.error()` for logging (writes to stderr)
- Never use `console.log()` in stdio servers
- Configure logging libraries to write to stderr or files
- Disable banner output in frameworks (e.g., Spring Boot)

**Warning signs:**
- Server starts but doesn't appear in Claude Desktop
- "Parse error" in MCP logs
- Claude Desktop shows "Server disconnected"

### Pitfall 2: Missing Environment Variable Validation
**What goes wrong:** Server starts successfully, tools are called, but fail with cryptic errors like "Cannot read property 'headers' of undefined" or 401 responses. User wastes time debugging when config was never set.

**Why it happens:** Node.js doesn't validate environment variables — `process.env.MISSING_VAR` returns `undefined`, not an error. Errors only surface when the value is used.

**How to avoid:**
- Validate ALL required env vars on startup with Zod schema
- Exit immediately with clear checklist if validation fails
- Include validation in the very first lines of `main()`

**Warning signs:**
- Runtime errors mentioning `undefined` or `null`
- 401 Unauthorized from API with valid token
- Server starts but tools fail silently

### Pitfall 3: Generic Error Messages to LLM
**What goes wrong:** Error messages like "Request failed" or "Error 400" force users to check logs. LLM can't help because error lacks context.

**Why it happens:** Directly exposing HTTP status codes or raw API errors without transformation. Treating errors as "failures" rather than "conversational feedback."

**How to avoid:**
- Transform every error to conversational message with next step
- Include what failed, why (user-safe reason), and suggested action
- Show multiple validation errors together, not one at a time
- Special treatment for auth failures (clear, prominent)

**Warning signs:**
- Users asking "what does error 400 mean?"
- LLM responding "I don't know what went wrong"
- Error messages containing "undefined" or stack traces

### Pitfall 4: Not Testing Token Validity on Startup
**What goes wrong:** Server starts successfully with invalid token. Tools fail later with 401 errors. User doesn't realize token is wrong until after asking Claude to do something.

**Why it happens:** Environment variable validation only checks presence, not validity. Token could be expired, revoked, or typo'd.

**How to avoid:**
- Make lightweight API call during startup (e.g., GET /api/user/profile)
- If 401 response, exit with clear "token is invalid" message
- Only accept tool calls after successful token validation

**Warning signs:**
- All tool calls fail with 401
- Token is set but never actually tested
- User has to manually test API calls outside MCP server

### Pitfall 5: Type Generation Out of Sync
**What goes wrong:** OpenAPI specs updated, types not regenerated. Runtime errors due to missing fields or wrong types. Tests pass but production fails.

**Why it happens:** Manual workflow — developer forgets to run codegen after updating specs. No automation to keep types fresh.

**How to avoid:**
- Add `npm run generate-types` to CI/CD pipeline
- Run codegen in pre-build step automatically
- Commit generated types OR commit specs and regenerate on install
- Document regeneration process clearly in README

**Warning signs:**
- TypeScript compiles but runtime errors
- API returns fields not in TypeScript types
- Tests use mocked data that doesn't match real API

### Pitfall 6: CRUD Factory Pattern Not Generic Enough
**What goes wrong:** Factory pattern works for first few entities, then need special cases. End up with 50% generated tools, 50% hand-written. Factory becomes technical debt.

**Why it happens:** Factory designed for simplest case (basic CRUD). Real API has variations — some entities need extra params, different auth, custom validation.

**How to avoid:**
- Design factory for extensibility from start
- Support "hooks" for customization (beforeRequest, afterResponse)
- Allow overriding specific operations (e.g., custom create logic)
- Keep factory focused on structure, not business logic

**Warning signs:**
- "Special case" comments in factory code
- Copy-pasting factory code with small tweaks
- More lines customizing factory than factory saves

### Pitfall 7: Bearer Token Exposure in Logs
**What goes wrong:** Full HTTP requests logged including Authorization header. Token visible in log files or stderr output. Security audit flags credential exposure.

**Why it happens:** Logging HTTP requests for debugging without sanitization. Token is just another header — logger doesn't know it's sensitive.

**How to avoid:**
- Sanitize logs — redact Authorization header values
- Log "Bearer ***" instead of full token
- Use structured logging that supports redaction rules
- Never log full request/response bodies

**Warning signs:**
- Token visible in console output
- Log files contain "Bearer sk-..."
- Security scanner flags credential exposure

## Code Examples

Verified patterns from official sources and ecosystem best practices:

### MCP Server Initialization (Stdio Transport)
```typescript
// Source: https://modelcontextprotocol.io/docs/develop/build-server
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "bukku",
  version: "1.0.0",
});

// Register tools here

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Server running on stdio");
```

### Tool Registration with Zod Validation
```typescript
// Source: https://modelcontextprotocol.io/docs/develop/build-server (TypeScript example)
import { z } from "zod";

server.registerTool(
  "list-sales-invoices",
  {
    description: "List sales invoices with optional filters",
    inputSchema: {
      page: z.number().min(1).optional().describe("Page number (1-indexed)"),
      page_size: z.number().min(1).max(100).optional().describe("Items per page"),
      status: z.enum(["draft", "sent", "paid", "void"]).optional().describe("Filter by status"),
    },
  },
  async ({ page, page_size, status }) => {
    // Zod validates inputs automatically before this runs
    // Implementation here
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(invoices),
        },
      ],
    };
  }
);
```

### Environment Variable Validation with Zod
```typescript
// Source: https://dev.to/schead/ensuring-environment-variable-integrity-with-zod-in-typescript-3di5
import { z } from 'zod';

const envSchema = z.object({
  BUKKU_API_TOKEN: z.string().min(1),
  BUKKU_COMPANY_SUBDOMAIN: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Missing environment variables:");
    result.error.issues.forEach(issue => {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }

  return result.data;
}
```

### Authenticated HTTP Client with Bearer Token
```typescript
// Source: https://apidog.com/blog/bearer-token-nodejs-express/
const env = validateEnv();

async function makeBukkuRequest(path: string, options: RequestInit = {}) {
  const url = `https://${env.BUKKU_COMPANY_SUBDOMAIN}.bukku.com/api${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${env.BUKKU_API_TOKEN}`,
      'Company-Subdomain': env.BUKKU_COMPANY_SUBDOMAIN,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw response; // Will be caught and transformed by error handler
  }

  return response.json();
}
```

### Generating Types from OpenAPI with Hey API
```typescript
// Source: https://heyapi.dev/openapi-ts/plugins/zod
// openapi-ts.config.ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: '.api-specs/sales.yaml',
  output: 'src/types/generated',
  plugins: [
    'zod',                    // Generate Zod schemas
    '@hey-api/typescript',    // Generate TypeScript types
  ],
});
```

### MCP Error Response Pattern
```typescript
// Source: https://mcpcat.io/guides/error-handling-custom-mcp-servers/
// Application-level errors use isError flag, not exceptions

async function handleToolCall() {
  try {
    const result = await makeBukkuRequest('/sales/invoices', { method: 'POST' });
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  } catch (error) {
    // Transform to conversational error
    return {
      isError: true,
      content: [{
        type: 'text',
        text: transformHttpError(error, 'create invoice')
      }]
    };
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual TypeScript types from OpenAPI | Auto-generate with `@hey-api/openapi-ts` or `openapi-zod-client` | 2023-2024 | Eliminates type drift, reduces maintenance, ensures types match API |
| Zod v3 | Zod v4 | 2025 | Breaking changes in some APIs, improved type inference, better error messages |
| axios for HTTP | Native fetch (Node 18+) | 2022 | Fetch now standard in Node.js, no dependency needed, lighter bundle |
| Manual tool registration | CRUD factory patterns | 2024-2025 | Scales to 100+ tools, reduces duplication, easier maintenance |
| Generic error messages | Conversational error transformation | 2025-2026 | LLMs can understand errors and suggest fixes, better UX |

**Deprecated/outdated:**
- **`openapi-typescript-codegen`**: Less active, superseded by `@hey-api/openapi-ts` (formerly `openapi-typescript-codegen` fork with better maintenance)
- **MCP SDK pre-v1.0**: Breaking changes in v1.0, older tutorials may show outdated APIs
- **dotenv package for env loading**: Not needed for MCP servers — Claude Desktop sets env vars directly in config
- **console.log() for logging**: Never acceptable in stdio servers, always use stderr

## Open Questions

Things that couldn't be fully resolved:

1. **OpenAPI spec management strategy**
   - What we know: User has 11 OpenAPI spec files in `.api-specs/`
   - What's unclear: Should generated types be gitignored and regenerated on install, or committed? Specs reference each other via `$ref` — does codegen handle this correctly?
   - Recommendation: Commit generated types for deterministic builds, add generation check to CI to detect drift

2. **CRUD factory customization depth**
   - What we know: Need ~55 tools across 9 categories, factory pattern essential
   - What's unclear: How much variation exists between Bukku API endpoints? Will one factory fit all, or need multiple factory types?
   - Recommendation: Start with single factory for common patterns, extract hooks for customization points as needed during implementation

3. **Pagination strategy consistency**
   - What we know: List operations need pagination (page, page_size parameters)
   - What's unclear: Do all Bukku API list endpoints use same pagination pattern? Are there cursor-based pagination endpoints?
   - Recommendation: Check during implementation, may need pagination abstraction in factory

4. **Type generation performance**
   - What we know: `openapi-zod-client` noted as slower than alternatives
   - What's unclear: With 11 OpenAPI specs, will generation be fast enough for developer workflow?
   - Recommendation: Test both `@hey-api/openapi-ts` and `openapi-zod-client` with actual specs, measure generation time, choose based on performance

5. **Startup token validation API endpoint**
   - What we know: Need to validate token on startup with lightweight API call
   - What's unclear: Which Bukku API endpoint is best for health check? (minimal cost, fast, requires auth)
   - Recommendation: Check Bukku API docs for `/health`, `/me`, or `/company/profile` endpoint during implementation

## Sources

### Primary (HIGH confidence)
- [Model Context Protocol - Build an MCP server](https://modelcontextprotocol.io/docs/develop/build-server) - Official TypeScript server tutorial
- [GitHub - modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) - Official SDK repository
- [MCPcat - Error Handling in MCP Servers](https://mcpcat.io/guides/error-handling-custom-mcp-servers/) - Comprehensive error handling patterns
- [MCP Specification - Tools](https://modelcontextprotocol.io/specification/2025-06-18/server/tools) - Official tool specification

### Secondary (MEDIUM confidence)
- [Hey API - OpenAPI TypeScript Codegen](https://heyapi.dev/openapi-ts/plugins/zod) - Type generation documentation
- [GitHub - astahmer/openapi-zod-client](https://github.com/astahmer/openapi-zod-client) - Alternative codegen tool
- [DEV Community - Error Handling in MCP TypeScript SDK](https://dev.to/yigit-konur/error-handling-in-mcp-typescript-sdk-2ol7) - Error patterns
- [LogRocket - Axios vs Fetch 2025](https://blog.logrocket.com/axios-vs-fetch-2025/) - HTTP client comparison
- [DEV Community - Environment Variable Validation with Zod](https://dev.to/schead/ensuring-environment-variable-integrity-with-zod-in-typescript-3di5) - Env validation pattern
- [Apidog - Bearer Token in Node.js Express](https://apidog.com/blog/bearer-token-nodejs-express/) - Auth patterns

### Tertiary (LOW confidence)
- [Medium - How LLM Choose MCP Tools](https://gyliu513.medium.com/how-llm-choose-the-right-mcp-tools-9f88dbcf11a2) - Tool description guidance
- [Avenue Code - Generic CRUD API in Node.js](https://blog.avenuecode.com/how-to-build-a-generalist-crud-api-in-nodejs) - CRUD patterns
- Various Stack Overflow and community discussions on TypeScript patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official MCP SDK, well-documented, 23k+ users
- Architecture: HIGH - Patterns from official docs and established TypeScript practices
- Pitfalls: HIGH - Verified from official warnings and community pain points
- OpenAPI tooling: MEDIUM - Multiple options, performance tradeoffs unclear without benchmarking
- CRUD factory implementation: MEDIUM - Pattern proven but needs customization for Bukku API specifics

**Research date:** 2026-02-06
**Valid until:** 2026-03-06 (30 days - MCP SDK stable, ecosystem mature)
