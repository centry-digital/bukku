# Technology Stack

**Project:** Bukku MCP Server
**Researched:** 2026-02-06
**Confidence:** HIGH

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@modelcontextprotocol/sdk` | ^1.26.0 | Official MCP TypeScript SDK for server and client implementation | Industry standard, official implementation with full protocol support, active maintenance, anticipates v2 in Q1 2026 |
| TypeScript | ^5.9.0 | Type-safe development language | Required peer dependency, provides compile-time safety, excellent IDE support, standard for MCP servers |
| Node.js | >=22.18.0 | Runtime environment | Built-in type stripping (instant reloads without build step), native fetch support, ES modules support |
| Zod | ^3.25.0 | Schema validation and type inference | Required peer dependency for @modelcontextprotocol/sdk, provides runtime validation and compile-time types for tool parameters |

### HTTP Client
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Native Fetch API | Built-in (Node 22+) | REST API requests to Bukku API | Native to Node.js 18+, zero dependencies, sufficient for straightforward API calls, async/await friendly |
| Axios | ^1.7.0 | Alternative HTTP client (if needed) | Use only if you need interceptors for auth token injection, request/response transformation, or better TypeScript integration |

### Development Tools
| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| `tsx` | ^4.19.0 | Fast TypeScript execution for development | Leverages esbuild for near-instant compilation, ideal for dev mode, better than ts-node for speed |
| `@modelcontextprotocol/inspector` | latest | Interactive testing and debugging | Official MCP Inspector, runs via npx with no permanent installation, opens at localhost:6274 |
| Vitest | ^3.0.0 | Unit testing framework | Faster than Jest, native ESM support, tight TypeScript integration, recommended for 2026 |
| `@types/node` | ^22.0.0 | Node.js type definitions | TypeScript types for Node.js APIs |

### Environment Management
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `dotenv` | ^16.4.0 | Load environment variables from .env | Development only - NOT for production, client config (claude_desktop_config.json) is source of truth |

### OpenAPI Integration (Optional)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `openapi-typescript` | ^7.0.0 | Generate TypeScript types from OpenAPI spec | If you want type-safe Bukku API client from YAML specs |
| `openapi-mcp-generator` | latest | Auto-generate MCP tools from OpenAPI | Quick start option, but hand-crafted tools provide better UX for LLMs |

## Installation

```bash
# Core dependencies
npm install @modelcontextprotocol/sdk zod

# Choose ONE HTTP client approach:
# Option 1: Use native fetch (no install needed, Node 22+)
# Option 2: If you need advanced features
npm install axios

# Dev dependencies
npm install -D typescript @types/node tsx vitest

# Environment variables (dev only)
npm install -D dotenv
```

## Alternatives Considered

| Category | Recommended | Alternative | When to Use Alternative |
|----------|-------------|-------------|-------------------------|
| MCP Framework | `@modelcontextprotocol/sdk` | FastMCP (TypeScript) | Never for this project - FastMCP is opinionated framework, official SDK provides precise control needed for 55 tools |
| MCP Framework | `@modelcontextprotocol/sdk` | EasyMCP | Never for this project - too experimental, official SDK is production-ready |
| HTTP Client | Native Fetch | Axios | If you need request/response interceptors for Bearer token + Company-Subdomain header injection |
| HTTP Client | Native Fetch | node-fetch | Never - native fetch available in Node 22+, node-fetch is redundant |
| TypeScript Executor | tsx | ts-node | Never for dev - tsx is significantly faster via esbuild |
| Testing | Vitest | Jest 30 | Either works, but Vitest is faster and has better ESM/TypeScript defaults |
| Validation | Zod | TypeBox | Never - Zod is required peer dependency, switching creates incompatibility |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| ts-node for development | Slow compilation, uses tsc instead of fast bundler | tsx (uses esbuild, near-instant) |
| node-fetch | Redundant, native fetch available in Node 18+ | Native fetch API (built-in) |
| HTTP+SSE transport | Legacy protocol version (2024-11-05), deprecated | stdio transport (standard) or Streamable HTTP (new) |
| Hardcoded credentials | Security risk, inflexible | Environment variables via client config |
| console.log() in stdio transport | Writes to stdout, breaks JSON-RPC protocol | console.error() for all logs (writes to stderr) |
| Auto-generated tools from OpenAPI | 55 tools = poor LLM UX, lacks intent-based design | Hand-crafted composite tools with domain logic |
| 1:1 REST endpoint mapping | Creates too many granular tools, confuses LLMs | Curate meaningful higher-level tools by intent |

## Stack Patterns by Transport

**For stdio transport (recommended for local-only):**
- Use `StdioServerTransport` from SDK
- All logging must use `console.error()` not `console.log()`
- No HTTP server needed
- Client spawns server as subprocess

**For Streamable HTTP (if remote access needed):**
- Use `StreamableHTTPServerTransport` from SDK
- Can use `console.log()` normally
- Requires HTTP server setup
- Client connects via HTTP

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@modelcontextprotocol/sdk@^1.26.0` | zod@^3.25.0 | SDK uses zod/v4 internally, maintains backwards compatibility with Zod 3.25+ |
| `@modelcontextprotocol/sdk@^1.26.0` | Node 18+ | Minimum Node version, 22+ recommended for native fetch + type stripping |
| TypeScript@^5.9.0 | `@modelcontextprotocol/sdk@^1.26.0` | Requires TS 5.x for proper type inference |
| Vitest@^3.0.0 | TypeScript@^5.9.0 | Native TypeScript support, no compilation needed |

## TypeScript Configuration

Recommended `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build", "**/*.test.ts"]
}
```

Key settings explained:
- **module: "NodeNext"** - Modern ES modules with Node.js compatibility
- **target: "ES2022"** - Modern JavaScript features, compatible with Node 22+
- **strict: true** - Maximum type safety
- **declaration: true** - Generate .d.ts files for TypeScript consumers

## Package.json Configuration

Recommended structure:

```json
{
  "name": "bukku-mcp",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "bukku-mcp": "./build/index.js"
  },
  "scripts": {
    "build": "tsc && chmod 755 build/index.js",
    "dev": "tsx watch src/index.ts",
    "inspector": "npx @modelcontextprotocol/inspector build/index.js",
    "test": "vitest",
    "test:once": "vitest run"
  },
  "files": ["build"],
  "engines": {
    "node": ">=22.18.0"
  }
}
```

Critical fields:
- **type: "module"** - Enables ES modules
- **bin** - Makes server executable (for client config)
- **files** - Only ship compiled output, not source
- **engines** - Enforce Node version requirement

## Authentication Pattern for Bukku API

```typescript
// Recommended approach: Environment variables
const BUKKU_TOKEN = process.env.BUKKU_TOKEN;
const COMPANY_SUBDOMAIN = process.env.COMPANY_SUBDOMAIN;

// Use with native fetch
const response = await fetch('https://api.bukku.my/v1/endpoint', {
  headers: {
    'Authorization': `Bearer ${BUKKU_TOKEN}`,
    'Company-Subdomain': COMPANY_SUBDOMAIN,
    'Content-Type': 'application/json'
  }
});

// Alternative with axios (if using interceptors)
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.bukku.my/v1',
  headers: {
    'Authorization': `Bearer ${process.env.BUKKU_TOKEN}`,
    'Company-Subdomain': process.env.COMPANY_SUBDOMAIN
  }
});
```

## Error Handling Pattern

```typescript
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// In tool handlers
server.tool('bukku-create-sale', { schema }, async (params) => {
  try {
    // Tool logic here
    const response = await fetch(/* ... */);

    if (!response.ok) {
      // Return error in result, NOT as McpError
      return {
        content: [{
          type: 'text',
          text: `API error: ${response.status} ${response.statusText}`
        }]
      };
    }

    return { content: [{ type: 'text', text: 'Success' }] };
  } catch (error) {
    // Log to stderr
    console.error('Tool error:', error);

    // Return error to LLM (NOT thrown)
    return {
      content: [{
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
});

// Only use McpError for protocol-level errors
server.onerror = (error) => {
  console.error('[MCP Error]', error);
};
```

## Roadmap Considerations

### Phase 1: Foundation (Use official SDK + native fetch)
- Minimal dependencies
- Focus on stdio transport
- Manual API client (no code generation)

### Phase 2: Enhanced DX (Consider OpenAPI types)
- Generate TypeScript types from Bukku OpenAPI YAML
- Improves autocomplete and type safety
- Still hand-craft MCP tools (don't auto-generate)

### Phase 3: Production Hardening (Add testing)
- Vitest for unit tests
- Test tool handlers with mocked API responses
- MCP Inspector for integration testing

### Later: If Remote Access Needed
- Switch to Streamable HTTP transport
- May need axios for better error handling
- Consider adding retry logic with exponential backoff

## Sources

**Official MCP Documentation:**
- [GitHub - modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) - Official TypeScript SDK (HIGH confidence)
- [@modelcontextprotocol/sdk - npm](https://www.npmjs.com/package/@modelcontextprotocol/sdk) - Package version: 1.26.0 (HIGH confidence)
- [Build an MCP server - Model Context Protocol](https://modelcontextprotocol.io/docs/develop/build-server) - Official build guide (HIGH confidence)

**Architecture & Best Practices:**
- [From REST API to MCP Server - Stainless](https://www.stainless.com/mcp/from-rest-api-to-mcp-server) - REST wrapping patterns (MEDIUM confidence)
- [Should you wrap MCP around your existing API?](https://www.scalekit.com/blog/wrap-mcp-around-existing-api) - Design principles (MEDIUM confidence)
- [Error Handling in MCP Servers - MCPcat](https://mcpcat.io/guides/error-handling-custom-mcp-servers/) - Error patterns (MEDIUM confidence)

**HTTP Clients:**
- [Axios vs. Fetch (2025 update) - LogRocket](https://blog.logrocket.com/axios-vs-fetch-2025/) - Comparison analysis (MEDIUM confidence)

**Development Tools:**
- [MCP Inspector - Model Context Protocol](https://modelcontextprotocol.io/docs/tools/inspector) - Official inspector tool (HIGH confidence)
- [TSX vs ts-node - Better Stack](https://betterstack.com/community/guides/scaling-nodejs/tsx-vs-ts-node/) - Executor comparison (MEDIUM confidence)
- [⚡️ MCP Server: Node.js, TypeScript, Vitest & K6](https://medium.com/@rajasekaran.parthiban7/%EF%B8%8F-mcp-server-node-js-typescript-vitest-k6-f056dad97288) - Testing with Vitest (MEDIUM confidence)

**Environment Variables:**
- [Environment Variable Management in MCP](https://apxml.com/courses/getting-started-model-context-protocol/chapter-4-debugging-and-client-integration/managing-environment-variables) - Config patterns (MEDIUM confidence)
- [Dynamic Configuration for MCP Servers - DEV](https://dev.to/saleor/dynamic-configuration-for-mcp-servers-using-environment-variables-2a0o) - Best practices (LOW confidence)

**OpenAPI Integration:**
- [Generate MCP servers from OpenAPI specs - Stainless](https://www.stainless.com/docs/guides/generate-mcp-server-from-openapi/) - Code generation (MEDIUM confidence)
- [GitHub - harsha-iiiv/openapi-mcp-generator](https://github.com/harsha-iiiv/openapi-mcp-generator) - Generation tool (LOW confidence)

**TypeScript Configuration:**
- [Guide to Building Local MCP Servers with Modern JS Tooling](https://gist.github.com/jevenson76/3fcfb102eb543db64c7e1162f017f49e) - Config examples (MEDIUM confidence)
- [Build MCP Servers in TypeScript - MCPcat](https://mcpcat.io/guides/building-mcp-server-typescript/) - Setup guide (MEDIUM confidence)

**Validation:**
- [Adding custom tools to an MCP server in TypeScript - MCPcat](https://mcpcat.io/guides/adding-custom-tools-mcp-server-typescript/) - Zod patterns (MEDIUM confidence)

---
*Stack research for: Bukku MCP Server (TypeScript MCP server wrapping REST API)*
*Researched: 2026-02-06*
*Confidence: HIGH - Based on official docs, SDK repository, and cross-verified community patterns*
