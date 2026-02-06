# Project Research Summary

**Project:** Bukku MCP Server
**Domain:** MCP Server Wrapping REST API (Accounting)
**Researched:** 2026-02-06
**Confidence:** HIGH

## Executive Summary

The Bukku MCP Server is an accounting API wrapper that exposes 55 Bukku API operations as Model Context Protocol (MCP) tools, enabling Claude and other AI agents to perform accounting operations through natural language. Expert implementations follow a layered architecture pattern separating MCP protocol handling, business logic, and REST API communication. The official TypeScript SDK with native fetch provides the ideal foundation, with Zod validation ensuring type safety and runtime validation for tool parameters.

The recommended approach prioritizes 1:1 API-to-tool mapping for v0.1, focusing on complete surface area coverage across 9 categories (Sales, Purchases, Banking, Contacts, Products, Accounting, Lists, Files, Control Panel). This establishes the foundation before optimizing with composite tools in v1.0+. Critical success factors include high-quality tool descriptions (LLM selection accuracy), structured error handling (enabling self-correction), and accounting-specific validations like double-entry balance checks.

Key risks center on context pollution from 55+ tools, production data safety (no guardrails by design), and accounting domain pitfalls like idempotency failures causing duplicate invoices. Mitigation strategies include implementing CRUD factory patterns to reduce code duplication, comprehensive logging for audit trails, and error enrichment middleware that transforms API errors into actionable LLM-friendly guidance.

## Key Findings

### Recommended Stack

The official TypeScript MCP SDK provides the gold standard for protocol compliance, with Zod validation as a required peer dependency. Node.js 22+ enables instant reloads through native type stripping and eliminates HTTP client dependencies via built-in fetch. For 55 tools across 9 categories, the factory pattern is essential to avoid code duplication.

**Core technologies:**
- **@modelcontextprotocol/sdk (^1.26.0)**: Official TypeScript SDK — industry standard with full protocol support, anticipates v2 in Q1 2026
- **TypeScript (^5.9.0)**: Type-safe development — required for compile-time safety, SDK type inference, standard for MCP servers
- **Node.js (>=22.18.0)**: Runtime environment — native type stripping for instant reloads, built-in fetch eliminates axios dependency
- **Zod (^3.25.0)**: Schema validation — required SDK peer dependency for runtime validation and compile-time type inference
- **Native Fetch API**: HTTP client — built into Node 22+, zero dependencies, sufficient for Bukku API bearer token + header authentication
- **tsx (^4.19.0)**: Development execution — esbuild-powered for near-instant compilation, superior to ts-node for development velocity
- **Vitest (^3.0.0)**: Testing framework — faster than Jest, native ESM support, recommended for 2026 TypeScript projects

**Critical patterns:**
- Use stdio transport exclusively (local-only, secure, no network exposure)
- All logging must use `console.error()` to avoid corrupting JSON-RPC protocol
- Environment variables for credentials (BUKKU_TOKEN, COMPANY_SUBDOMAIN)
- CRUD factory pattern to generate repetitive tools from configuration
- Zod schemas define both validation and tool metadata

### Expected Features

The MCP ecosystem expects complete API surface coverage with intelligent abstractions. Bukku's 55 operations map to table stakes features, with optimizations deferred to post-launch validation. Accounting APIs require specific patterns like pagination, status workflows, and robust error handling.

**Must have (table stakes):**
- **1:1 Tool per API Operation** — Users expect full Bukku API coverage (~55 tools); missing operations create workflow blockers
- **Input Validation with Schemas** — Zod schemas prevent malformed requests; MCP protocol requirement for tool metadata
- **Authentication Handling** — Bearer token + Company-Subdomain header injection from environment variables
- **Error Handling & Reporting** — Transform API errors to actionable messages enabling Claude self-correction
- **List Operations with Pagination** — Cursor-based pagination per MCP spec for handling large result sets
- **Stdio Transport** — Standard local-only deployment pattern for MCP servers
- **Tool Descriptions** — Clear, task-oriented descriptions critical for LLM tool selection accuracy
- **CRUD Coverage** — All create/read/update/delete operations for entity types (invoices, contacts, products, etc.)
- **Status Operations** — Accounting workflows require status transitions (draft → approved → void)

**Should have (differentiators):**
- **Response Caching** — Cache Lists category (tax codes, currencies) to reduce API calls; 5min TTL for dynamic, 1hr for static
- **Intelligent Error Recovery** — Exponential backoff for rate limits/transients prevents cascading failures
- **Rich Logging & Observability** — Structured logs with request ID, timing, error context for debugging and audit trails
- **Rate Limit Management** — Token bucket pattern with proactive queueing to avoid 429 bans
- **Smart Defaults** — Auto-populate currency/tax codes from company settings to reduce input verbosity
- **Resource Exposure** — Expose Lists as MCP resources (read-only context) vs tools (write operations)
- **Connection Testing Tool** — Dedicated health check tool helps users debug authentication issues
- **Transaction Safety** — Destructive operations (delete, void) require explicit confirmation parameters

**Defer (v2+):**
- **Intent-Based Composite Tools** — High-level workflows like "create_customer_with_first_invoice"; requires usage pattern validation first
- **Batch Operations** — Multi-entity creation in single call; depends on Bukku API batch endpoint support
- **Field-Level Validation** — Pre-validate against Bukku business rules; requires deep domain knowledge
- **Circuit Breaker Pattern** — Prevent cascading failures during outages; over-engineering for v0.1
- **OpenTelemetry Integration** — Enterprise observability; not needed for local stdio usage

### Architecture Approach

MCP servers wrapping REST APIs follow a layered architecture separating transport (stdio), protocol (MCP server core), business logic (tool handlers), and external communication (API client). For 55+ tools, the factory pattern is essential to avoid code duplication, with category-based organization (sales, purchases, banking, etc.) providing maintainability.

**Major components:**
1. **Transport Layer (stdio)** — Handles JSON-RPC over stdin/stdout using StdioServerTransport from SDK
2. **MCP Server Core** — Protocol compliance, capability negotiation, tool registry manages 55+ tool registrations
3. **Tool Handler Layer** — Category-organized (9 folders), implements business logic with CRUD factory pattern generating similar tools
4. **API Client Layer** — Base HTTP client with bearer auth + Company-Subdomain header injection, unified error handling
5. **Schema Layer** — Zod schemas provide runtime validation, type inference, and tool metadata generation
6. **Error Transformation Middleware** — Converts terse API errors into LLM-friendly structured errors with what/why/how-to-fix

**Critical patterns:**
- **CRUD Factory Pattern**: Generate list/create/read/update/delete tools from configuration, eliminating 80%+ code duplication
- **Category Grouping**: Organize tools by domain (sales, purchases, contacts) matching Bukku's API structure
- **Schema-First Design**: Define Zod schemas separately, reuse for validation and tool registration
- **Composite API Client**: Centralize authentication, retry logic, error handling in base client class
- **Registry Orchestration**: Central registry imports category modules and registers all tools with MCP server

**Build order:**
1. **Foundation (Phase 1)**: api/client.ts → server.ts → index.ts
2. **Tool Infrastructure (Phase 2)**: tools/schemas.ts → tools/factory.ts → tools/registry.ts
3. **Proof of Concept (Phase 3)**: Implement one category end-to-end to validate pattern
4. **Scale (Phase 4)**: Parallel development of remaining categories using validated factory pattern

### Critical Pitfalls

1. **Tool Description Quality** — Poor descriptions cause context pollution with 55+ tools (~77K tokens), wrong tool selections, "can't do that" false negatives. Front-load critical info in first 10 words, use task-oriented language ("Create a sales invoice" vs "POST /api/v1/sales/invoices"), include business context. Test with real user prompts to verify selection accuracy. Address in Phase 1 before tool generation.

2. **Missing Double-Entry Validation** — Journal entries violating double-entry rules (debits ≠ credits) corrupt accounting data. Validate client-side before API call, sum debits/credits, reject if unbalanced. Return structured error: "Unbalanced entry. Debits: $150, Credits: $100, Difference: $50. Ensure debits equal credits." Address in Phase 2 before exposing accounting tools.

3. **Production Data From Day One** — No guardrails by design means prompt misinterpretation can corrupt real financial data. Implement comprehensive logging to local file for audit trail, return verbose confirmation messages after destructive operations, document void vs delete semantics clearly, add user education in README about irreversibility. Address Phase 0 (setup docs) and ongoing.

4. **Bearer Token Passthrough** — Token leakage in logs/errors enables unauthorized API access. Redact Authorization headers in all logging, never log Company-Subdomain values. For future remote transport, must implement OAuth token exchange instead of passthrough. Address Phase 1 authentication setup.

5. **OpenAPI Schema Reference Explosion** — MCP requires self-contained schemas (no external $refs), naive conversion creates invalid schemas. Convert components/schemas to $defs within tool schema, minimize indirection depth, inline small schemas (<5 properties), validate against JSON Schema 2020-12. Address Phase 1 during OpenAPI-to-MCP conversion.

6. **Rate Limiting Blind Spots** — Burst API calls hit Bukku rate limits causing 429 bans. Implement exponential backoff (1s, 2s, 4s, 8s), use batch endpoints if available, queue bulk operations with delays, surface rate limit context to Claude in errors. Address Phase 2-3 HTTP client setup.

7. **Idempotency Ignorance** — Network timeouts during creates cause retries that duplicate invoices (1-2.5% typical error rate). Check Bukku API for idempotency key support, implement client-side dedup checking via list operations before create, return structured errors for duplicates. Address Phase 2 before sales/purchase tools.

8. **Structured Error Poverty** — Terse API errors ("Validation failed") prevent Claude self-correction. Transform to LLM-friendly format answering what/why/how-to-fix: "Tax code 'SR' invalid. G/L account 4000 requires valid code. Use: ST (8%), ZR (0%), EX (exempt)." Address Phase 1 error handling architecture.

## Implications for Roadmap

Based on research, the optimal phase structure follows architectural dependencies: foundation infrastructure → tool framework → proof-of-concept validation → parallel scaling → enhancements. This ordering enables early validation of the factory pattern while avoiding premature optimization.

### Phase 1: Foundation Infrastructure
**Rationale:** Everything depends on working API client and MCP server instance. Must establish authentication, transport, error handling architecture before building tools.

**Delivers:**
- Bukku API client with bearer token + Company-Subdomain authentication
- MCP server with stdio transport
- Base error handling and transformation middleware
- Project structure with category folders

**Addresses:**
- Authentication handling (table stakes)
- Error handling & reporting (table stakes)
- Stdio transport (table stakes)
- Bearer token security pitfall

**Avoids:**
- Token leakage through early logging redaction
- Structured error poverty through middleware design
- Technical debt from wrong project structure

**Research flag:** Standard MCP patterns, skip deep research

### Phase 2: Tool Framework
**Rationale:** Factory pattern and registry must exist before implementing individual tools. Validates code reuse strategy before scaling to 55+ tools.

**Delivers:**
- CRUD factory function for generating repetitive tools
- Zod schema library for common patterns (pagination, date ranges)
- Tool registry orchestration
- Category module structure

**Addresses:**
- Input validation with schemas (table stakes)
- Code duplication prevention
- Maintainability for 55+ tools

**Avoids:**
- Code duplication anti-pattern through early factory implementation
- Schema explosion by establishing reusable patterns

**Research flag:** Standard patterns, skip deep research

### Phase 3: Sales Category (Proof of Concept)
**Rationale:** Implement complete category to validate factory pattern, error handling, and end-to-end flow before scaling. Sales chosen as highest user value category with representative CRUD operations.

**Delivers:**
- Sales tools: quotations, invoices, payments, credit notes
- Working examples of list/create/read/update/delete patterns
- Integration testing with MCP Inspector
- Documentation of tool description patterns

**Addresses:**
- CRUD coverage (table stakes)
- Tool descriptions (table stakes)
- Status operations (draft/approved/void workflows)
- Idempotency handling

**Avoids:**
- Tool description quality pitfall through testing and refinement
- Idempotency ignorance through duplicate detection

**Research flag:** May need Bukku API research if specs incomplete for status workflows

### Phase 4: Core Categories (Parallel Development)
**Rationale:** With validated factory pattern, remaining high-value categories can be developed independently using established patterns.

**Delivers:**
- Purchases category: bills, expenses, supplier payments
- Banking category: transactions, reconciliation
- Contacts category: customers, suppliers
- Products category: inventory items

**Addresses:**
- Complete API surface coverage (table stakes)
- Full accounting workflow support

**Avoids:**
- Scaling bottlenecks through parallel development

**Research flag:** Standard CRUD patterns established in Phase 3, skip research

### Phase 5: Accounting & Lists Categories
**Rationale:** Accounting requires double-entry validation (complex). Lists provides reference data useful for other tools.

**Delivers:**
- Accounting tools: journal entries, chart of accounts, fiscal periods
- Lists tools: tax codes, currencies, payment methods, account types

**Addresses:**
- Full accounting functionality
- Reference data access

**Avoids:**
- Double-entry validation pitfall through explicit client-side checks
- Reference data pitfalls through proper caching strategy

**Research flag:** NEEDS RESEARCH for double-entry accounting validation rules and Bukku's specific business logic

### Phase 6: Files & Control Panel
**Rationale:** Lower priority categories with fewer operations, different patterns (file uploads vs JSON).

**Delivers:**
- Files category: attachment upload/download
- Control Panel: company settings, user management

**Addresses:**
- Complete API coverage

**Avoids:**
- File handling pitfalls through proper multipart/form-data support

**Research flag:** May need research for file upload patterns if Bukku uses non-standard approach

### Phase 7: Enhanced Features
**Rationale:** Optimization and differentiators added after validating core functionality with real usage.

**Delivers:**
- Response caching for Lists category
- Rate limit management with token bucket
- Structured JSON logging
- Connection test tool

**Addresses:**
- Response caching (differentiator)
- Rate limit management (differentiator)
- Logging & observability (differentiator)
- Connection testing (differentiator)

**Avoids:**
- Rate limiting blind spots through backoff implementation
- Production debugging difficulty through comprehensive logging

**Research flag:** Standard optimization patterns, skip research

### Phase Ordering Rationale

**Dependency-driven sequencing:** Phase 1-2 establish infrastructure required by all subsequent phases. Phase 3 validates patterns before Phase 4-6 scaling. Phase 7 optimizes based on real usage patterns.

**Pitfall mitigation timeline:** Critical pitfalls (tool descriptions, authentication, error handling) addressed in Phase 1-3 before launch. Performance pitfalls (rate limits, caching) deferred to Phase 7 after validation.

**Parallel opportunities:** Phase 4 categories are independent and can be developed simultaneously once Phase 3 validates the pattern. Phase 5-6 can overlap with Phase 7 enhancements.

**Risk management:** Early proof-of-concept (Phase 3) validates architectural decisions before committing to full implementation. Double-entry validation research (Phase 5) occurs just-in-time when needed.

### Research Flags

**Phases needing deeper research:**
- **Phase 5 (Accounting & Lists)**: Complex double-entry validation rules, Bukku-specific business logic, tax calculation requirements. Research should cover journal entry validation, chart of accounts constraints, fiscal period locking.
- **Phase 6 (Files)**: If Bukku uses non-standard file upload patterns or custom attachment schemas. Review .api-specs/ for multipart/form-data vs base64 approaches.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation)**: Standard MCP stdio setup, bearer token authentication well-documented
- **Phase 2 (Tool Framework)**: Factory pattern is established TypeScript technique, Zod validation is standard
- **Phase 3 (Sales)**: CRUD operations follow standard REST patterns
- **Phase 4 (Core Categories)**: Repetition of Phase 3 patterns, no new research needed
- **Phase 7 (Enhancements)**: Caching, rate limiting, logging are standard optimization patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official MCP SDK documentation, verified versions, cross-referenced with production examples (Xero MCP). TypeScript + Node 22+ is industry standard. |
| Features | HIGH | MCP spec defines table stakes clearly. Xero MCP (40+ tools) validates 1:1 mapping approach. Accounting API patterns well-documented. |
| Architecture | HIGH | Official MCP build guides provide clear patterns. Multiple production MCP servers demonstrate factory pattern. Layered architecture is established for API wrappers. |
| Pitfalls | HIGH | MCP security guides, production postmortems, accounting API integration guides provide concrete failures. Tool description quality explicitly called out in official docs. |

**Overall confidence:** HIGH

All four research areas have official documentation and production examples. Bukku API specifications exist in .api-specs/ directory providing ground truth for endpoint validation. The 55-tool scale is within proven range (Xero has 40+). No experimental or cutting-edge technologies required.

### Gaps to Address

**OpenAPI spec completeness:** During Phase 1, verify .api-specs/ YAML files cover all 55 operations and include complete schemas. If gaps exist, may need to reference Bukku's official API documentation or contact Bukku support for missing specs.

**Bukku rate limit policies:** Research didn't surface specific Bukku rate limits (requests per minute/day). During Phase 2 HTTP client setup, check Bukku documentation for rate limit headers (X-RateLimit-*, Retry-After) and implement appropriate backoff thresholds.

**Idempotency key support:** Unclear if Bukku API supports idempotency keys (Idempotency-Key header). During Phase 3, test create operations with duplicate requests to determine if client-side deduplication is required or if Bukku handles it server-side.

**Double-entry validation rules:** Research provided general double-entry principles but not Bukku-specific validation requirements. Phase 5 needs targeted research on Bukku's journal entry rules, G/L account constraints, and tax code requirements before implementing accounting tools.

**Batch endpoint availability:** Unknown if Bukku provides batch operations for high-volume scenarios. During Phase 4, check if endpoints like POST /sales/invoices/batch exist to optimize bulk creation workflows.

## Sources

### Primary (HIGH confidence)
- [MCP Official Documentation](https://modelcontextprotocol.io/docs/develop/build-server) — Build server guide, protocol specification
- [MCP TypeScript SDK Repository](https://github.com/modelcontextprotocol/typescript-sdk) — Official SDK, code examples
- [MCP Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25) — Protocol specification, pagination requirements
- [Xero MCP Server](https://github.com/XeroAPI/xero-mcp-server) — Production accounting MCP server, 40+ tools
- [@modelcontextprotocol/sdk npm](https://www.npmjs.com/package/@modelcontextprotocol/sdk) — Version 1.26.0 verified

### Secondary (MEDIUM confidence)
- [From REST API to MCP Server - Stainless](https://www.stainless.com/mcp/from-rest-api-to-mcp-server) — Wrapping patterns
- [MCP Best Practices Guide](https://modelcontextprotocol.info/docs/best-practices/) — Community patterns
- [15 Best Practices for Building MCP Servers](https://thenewstack.io/15-best-practices-for-building-mcp-servers-in-production/) — Production patterns
- [Error Handling in MCP Servers - MCPcat](https://mcpcat.io/guides/error-handling-custom-mcp-servers/) — Error patterns
- [MCP Security Survival Guide](https://towardsdatascience.com/the-mcp-security-survival-guide-best-practices-pitfalls-and-real-world-lessons/) — Security patterns
- [Accounting API Integration Guide - Apideck](https://www.apideck.com/blog/the-complete-guide-to-accounting-api-integrations-for-fintech) — Domain patterns
- [MCP Tool Descriptions Guide - Merge.dev](https://www.merge.dev/blog/mcp-tool-description) — Description patterns

### Tertiary (LOW confidence)
- [OpenAPI MCP Generator](https://github.com/harsha-iiiv/openapi-mcp-generator) — Code generation approach
- [Dynamic Configuration for MCP Servers - DEV](https://dev.to/saleor/dynamic-configuration-for-mcp-servers-using-environment-variables-2a0o) — Environment patterns

---
*Research completed: 2026-02-06*
*Ready for roadmap: yes*
