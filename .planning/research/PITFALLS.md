# Pitfalls Research

**Domain:** MCP Server Wrapping Accounting REST API
**Researched:** 2026-02-06
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Tool Description Quality (Context Pollution at Scale)

**What goes wrong:**
With 55+ tools exposed, poor tool descriptions cause Claude to load irrelevant tools into context, consume excessive tokens (~77K for 50+ tools without MCP Tool Search), make wrong tool selections, or fail to find the right tool entirely. This manifests as "Claude chose the wrong endpoint" or "Claude said it couldn't do something it actually could."

**Why it happens:**
Developers treat tool descriptions as documentation rather than AI selection criteria. When converting OpenAPI specs to MCP tools, generated descriptions are often too technical ("POST /api/v1/sales/invoices") or too vague ("Manage invoices") instead of explaining WHEN and WHY an LLM should use the tool.

**How to avoid:**
- **Front-load critical info**: Put the most important information in the first 10 words. AI agents may not read beyond the first sentence.
- **Use imperative, task-oriented language**: "Create a new sales invoice with line items" not "Sales invoice creation endpoint"
- **Include business context**: "Record a customer payment against an existing invoice" helps Claude understand when to use it vs. creating a refund
- **Avoid technical jargon**: Don't include HTTP methods, API paths, or implementation details
- **Test with real prompts**: Ask "I need to record a payment from a customer" and verify Claude selects the right tool

**Warning signs:**
- Claude consistently picks the wrong endpoint (e.g., uses `create_sales_order` when user meant `create_sales_invoice`)
- User has to explicitly name the operation ("use the create invoice tool") instead of describing the task
- Token usage spikes without apparent cause
- Claude says "I don't have a tool for that" when the capability exists

**Phase to address:**
Phase 1 (Tool Schema Design) — Must define description standards BEFORE generating tool definitions from OpenAPI specs. Cannot be easily retrofitted after launch.

---

### Pitfall 2: Missing Double-Entry Validation (Financial Data Corruption)

**What goes wrong:**
Journal entries violate double-entry bookkeeping rules (debits don't equal credits), causing accounting data corruption that may not surface until month-end reconciliation or audit. The Bukku API may accept malformed entries if validation is insufficient, or return cryptic errors that Claude can't self-correct from.

**Why it happens:**
Developers assume the upstream API validates all accounting rules, but many APIs only validate data types and required fields, not business logic like balanced journal entries. Claude can generate syntactically valid but semantically broken accounting data (e.g., debit = $100, credit = $0).

**How to avoid:**
- **Client-side validation before API call**: Sum debits and credits in the MCP tool handler, reject if unbalanced
- **Return structured, LLM-friendly errors**: If unbalanced, return `isError: true` with message: "Journal entry is unbalanced. Total debits: $150.00, Total credits: $100.00. Difference: $50.00. Ensure debits equal credits."
- **Include validation in tool description**: "Creates a journal entry. CRITICAL: Total debits must equal total credits (double-entry requirement)."
- **Provide examples in tool schema**: Include `examples` property showing valid balanced entry
- **Check Bukku API spec for validation**: Review `.api-specs/` YAML to understand what validations Bukku performs server-side

**Warning signs:**
- Users report "wrong numbers" weeks after entries created
- Reconciliation fails with mysterious imbalances
- Bukku API returns errors like "Tax code required" or "Invalid G/L account" that Claude can't recover from
- Claude creates entries with single-sided transactions (all debits, no credits)

**Phase to address:**
Phase 2 (Tool Implementation — Accounting Tools) — Must implement validation BEFORE exposing journal entry tools. This is a data integrity issue that can't be patched post-launch.

---

### Pitfall 3: Production Data From Day One (No Safety Net)

**What goes wrong:**
User connects to `api.bukku.my` (production) immediately with no guardrails on destructive operations. Claude accidentally deletes invoices, voids payments, or creates duplicate journal entries in live accounting data. Recovery requires manual data cleanup or restoring from backups.

**Why it happens:**
Project explicitly chose "no safety guardrails" and "production-first" (per PROJECT.md constraints). This is a conscious tradeoff for power users, but it means a single prompt misinterpretation can corrupt real financial data. Unlike code changes (git revert), accounting changes have audit trail and compliance implications.

**How to avoid:**
Since guardrails are out of scope, focus on **detection and recovery**:
- **Implement comprehensive logging**: Log every API call (method, endpoint, payload, response) to a local file for audit trail
- **Return verbose confirmation messages**: After destructive ops, return full details: "Deleted invoice #INV-001 for customer ABC Corp, amount $500.00, dated 2026-01-15. This action is permanent."
- **Document Bukku's void vs delete semantics**: Understand which operations are reversible (void) vs permanent (delete). Prefer void where possible.
- **Add undo guidance to error messages**: If delete fails, suggest alternatives: "Cannot delete posted invoice. Use void_sales_invoice instead to maintain audit trail."
- **User education in README**: Clear warnings that this is production data, no undo, backup critical data

**Warning signs:**
- User says "Claude deleted the wrong invoice"
- Can't trace what changed when (poor audit trail)
- Duplicate entries accumulate (idempotency failure)
- User asks "how do I undo this?"

**Phase to address:**
Phase 0 (Project Setup) — Document risk clearly in README and config examples. Phase 1-3 — Implement logging and verbose responses as each tool is built.

---

### Pitfall 4: Bearer Token Passthrough Anti-Pattern (Security Nightmare)

**What goes wrong:**
The MCP server accepts tokens from environment variables and passes them directly to Bukku API without validation. If the token is compromised (leaked in logs, process listing, or memory dump), an attacker can impersonate the user indefinitely. Worse, if running as a remote MCP server (future consideration), multiple clients could share the same token, violating isolation.

**Why it happens:**
For stdio-based local MCP servers, token passthrough seems "good enough" because only the user's process can access it. But this creates technical debt if you later need remote deployment, multi-company support, or token rotation. The MCP Authorization spec explicitly forbids token passthrough for remote servers.

**How to avoid:**
For **stdio transport (current scope)**:
- **Environment variables are acceptable** for local-only usage
- **Never log the token**: Redact `Authorization` headers and `Company-Subdomain` in debug logs
- **Validate token format**: Check it's a valid Bearer token before making API calls
- **Fail fast on auth errors**: Don't retry on 401/403, return clear error to Claude

For **future remote transport**:
- **Use OAuth token exchange**: MCP server must validate tokens issued TO IT, not pass through upstream tokens
- **Implement per-client tokens**: Each MCP client gets separate credentials
- **Add token expiration**: Short-lived tokens with refresh flow

**Warning signs:**
- Token visible in error messages or logs
- API returns 401 but MCP server doesn't surface it clearly
- Multiple MCP clients share credentials (if remote)
- No way to revoke access without changing environment variable

**Phase to address:**
Phase 1 (Authentication Setup) — Implement token redaction in logging. Phase 4 (Remote Transport) — If scope changes to remote, this becomes CRITICAL and requires architecture rework.

---

### Pitfall 5: OpenAPI Schema Reference Explosion ($ref Hell)

**What goes wrong:**
OpenAPI specs use `$ref: '#/components/schemas/Invoice'` to reuse schemas, but MCP Tool `inputSchema` must be completely self-contained (no external references). Naive conversion creates broken tool schemas that Claude can't use. Alternatively, inlining all refs creates massive schemas that consume excessive context tokens.

**Why it happens:**
OpenAPI is designed for API documentation and code generation (where $ref is a feature). MCP is designed for LLM consumption (where $ref is a liability). Automated converters often produce invalid schemas or over-inline, causing LLMs to get confused by excessive indirection.

**How to avoid:**
- **Use $defs for schema reuse**: Convert `#/components/schemas/Invoice` to `#/$defs/Invoice` within the tool schema
- **Minimize indirection depth**: If schema A → B → C → D, Claude gets lost. Flatten to A → B where possible
- **Prefer inline for small schemas**: If a schema is <5 properties, inline it rather than using $defs
- **Test schema complexity**: If you can't understand the schema in 10 seconds, neither can Claude
- **Validate against JSON Schema 2020-12**: MCP defaults to 2020-12, ensure Bukku specs are compatible

**Warning signs:**
- Claude sends requests with wrong parameter types (string instead of number)
- Tool calls fail validation with "property X is required" when Claude provided it
- Schema validation errors in MCP client logs
- Claude says "I don't know what parameters this tool needs"

**Phase to address:**
Phase 1 (OpenAPI to MCP Conversion) — Must resolve during schema generation. Attempting to fix post-conversion requires regenerating all tool schemas.

---

### Pitfall 6: Rate Limiting Blind Spots (API Ban Hammer)

**What goes wrong:**
Claude generates a burst of API calls (e.g., "create 20 invoices from this spreadsheet"), hitting Bukku's rate limits and getting temporarily banned (HTTP 429). The MCP server doesn't handle this gracefully, so Claude either fails silently, retries immediately (making it worse), or reports a generic error the user can't act on.

**Why it happens:**
Accounting APIs often have conservative rate limits to protect database performance. Bukku specifically warns about "high-volume transaction consolidation" (per PROJECT.md). Without backoff logic, automated tools can exhaust quota in seconds.

**How to avoid:**
- **Implement exponential backoff**: On 429, wait 1s, 2s, 4s, 8s before retry
- **Batch where possible**: If Bukku offers batch endpoints (check `.api-specs/`), use them instead of N individual calls
- **Queue requests**: For bulk operations, enqueue and process with delay rather than parallel blast
- **Surface rate limit info to Claude**: Return structured error: "Rate limit exceeded. Bukku allows 100 requests/minute. Wait 30 seconds and retry, or reduce batch size to 10 items at a time."
- **Add rate limit hints to tool descriptions**: "Note: Bukku recommends consolidating high-volume transactions into daily journal entries instead of individual API calls."

**Warning signs:**
- Intermittent failures with "too many requests"
- Claude reports "API error" without details
- Bulk operations fail partway through
- User sees 429 errors in Bukku's logs but MCP server logs show success

**Phase to address:**
Phase 2-3 (Tool Implementation) — Implement retry/backoff logic in HTTP client library before building bulk operation tools.

---

### Pitfall 7: Idempotency Ignorance (Duplicate Invoice Apocalypse)

**What goes wrong:**
Network timeout during `create_sales_invoice` call. Claude doesn't know if it succeeded, retries, creates duplicate invoice. Customer gets billed twice. Between 1-2.5% of payments are duplicates/errors in typical AP systems.

**Why it happens:**
REST POST operations are not idempotent by default. If the MCP server doesn't track request IDs or Claude retries without checking, duplicates are inevitable. Accounting systems compound this because "invoice already exists" errors vary by API (some check number, some check date+amount, some don't check at all).

**How to avoid:**
- **Check Bukku API for idempotency keys**: Review `.api-specs/` for headers like `Idempotency-Key` or `X-Request-ID`
- **If no native support, implement client-side dedup**: Before creating invoice, check if one with same number/date/amount exists via `list_sales_invoices`
- **Return dedup guidance in errors**: If create fails with "duplicate number", return structured error: "Invoice #INV-001 already exists. Retrieved existing invoice: [invoice details]. If you intended to create a new invoice, use a different invoice number."
- **Use unique identifiers in prompts**: Encourage user to specify invoice number: "Create invoice #INV-2026-001" vs vague "create an invoice"

**Warning signs:**
- Duplicate invoices appear after timeouts
- Claude retries operations that already succeeded
- User manually deletes duplicates frequently
- "Number already exists" errors that Claude can't self-correct

**Phase to address:**
Phase 2 (Sales/Purchase Tools) — Implement deduplication logic in create operations before exposing to production. This prevents data integrity issues that are hard to clean up retroactively.

---

### Pitfall 8: Structured Error Poverty (Claude Can't Self-Correct)

**What goes wrong:**
Bukku API returns error: `{"error": "Validation failed"}`. MCP server forwards it to Claude as-is. Claude has no idea what failed, can't fix the request, reports "API error" to user. User has to manually debug, defeating the purpose of AI assistance.

**Why it happens:**
Many REST APIs return terse, machine-oriented errors optimized for developer debugging, not LLM self-correction. MCP servers that blindly forward these errors miss the opportunity to transform them into actionable feedback.

**How to avoid:**
Implement error enrichment middleware that transforms API errors into LLM-friendly structured errors answering three questions:

1. **What happened**: "Invoice creation failed validation"
2. **Why it happened**: "Tax code 'SR' is invalid. The G/L account '4000' is tax-relevant and requires a valid tax code."
3. **What to do**: "Available tax codes: ['ST' (Standard Rate 8%), 'ZR' (Zero Rated), 'EX' (Exempt)]. Use 'ST' for standard sales."

**Example implementation:**
```typescript
if (apiError.code === 'INVALID_TAX_CODE') {
  return {
    isError: true,
    content: [{
      type: 'text',
      text: `Tax code '${apiError.invalidValue}' not found.

WHY: G/L account '${apiError.glAccount}' requires a valid tax code (account is tax-relevant).

SOLUTION: Use one of these tax codes:
- 'ST': Standard Rate (8%)
- 'ZR': Zero Rated (0%)
- 'EX': Exempt

Retry your request with a valid tax code.`
    }]
  }
}
```

**Warning signs:**
- Claude repeatedly makes the same invalid request
- User has to explain error messages to Claude
- Errors don't include field names or valid values
- Claude gives up after first error instead of self-correcting

**Phase to address:**
Phase 1 (Error Handling Architecture) — Design error transformation middleware BEFORE implementing individual tools. Retrofitting requires touching every tool handler.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Generate all tools from OpenAPI without manual review | Fast initial implementation, comprehensive coverage | Poor tool descriptions → Claude makes wrong choices, wasted context tokens | Never — tool quality is critical for LLM selection |
| Skip input validation (trust Bukku API to validate) | Less code, faster development | Cryptic API errors Claude can't recover from, poor UX | Only for read-only operations with no business logic constraints |
| Use generic HTTP client without retry/backoff | Simple implementation, fewer dependencies | Rate limit bans, unreliable bulk operations | Only for MVP testing, must add before production use |
| Log full request/response bodies including auth headers | Comprehensive debugging info | Token leakage, security vulnerability | Only in development with staging API, NEVER in production |
| Return raw API errors to Claude without transformation | No error mapping needed, API errors "speak for themselves" | Claude can't self-correct, user frustration | Only when API already returns LLM-friendly structured errors (rare) |
| Use single MCP server for all 55 tools | Simpler deployment, one config | Context pollution, slow tool selection, hard to scope permissions | Acceptable for stdio transport; reconsider if moving to remote or multi-user |
| Skip idempotency checks (assume Bukku handles it) | Faster implementation | Duplicate invoices, payments, journal entries | Only if Bukku API docs explicitly guarantee idempotent POST operations (verify in `.api-specs/`) |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Bukku Authentication | Hardcode `Company-Subdomain` header value in code | Read from environment variable (`BUKKU_COMPANY_SUBDOMAIN`), validate presence at startup |
| Multi-page API responses | Return first page only, ignore pagination | Check for `nextCursor`/pagination tokens in Bukku API responses, implement recursive fetch or document limitation |
| Enum/Reference data (tax codes, currencies) | Hardcode values from docs | Call `lists` endpoints to fetch current values, cache locally, refresh on `list_changed` notification |
| Date/time formats | Use local timezone or inconsistent format | Verify Bukku's expected format (ISO 8601, local time, UTC?) from `.api-specs/`, document in tool schemas |
| Decimal precision (money values) | Use floating point (0.1 + 0.2 = 0.30000000000000004) | Use integer cents or decimal libraries (e.g., `decimal.js`) for money calculations |
| File uploads | Base64-encode files and send in JSON | Check Bukku's file upload API (likely multipart/form-data), implement proper file handling |
| Void vs Delete semantics | Treat them as equivalent | Understand Bukku's distinction: void = reversible audit trail, delete = permanent removal. Document in tool descriptions. |
| Batch operations | Loop and call API N times | Check if Bukku offers batch endpoints (e.g., create multiple invoices in one request), use them to avoid rate limits |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all 55 tools into context | High token usage (~77K for 50+ tools), slow responses, high costs | Rely on MCP Tool Search (if Claude Code 2026 supports it), or split into multiple focused MCP servers (sales, purchases, accounting) | Immediately — affects every conversation |
| No request caching for reference data | Repeated calls to `lists` endpoints, slow tool execution | Cache tax codes, currencies, payment methods locally, refresh on `list_changed` notification or TTL (e.g., 1 hour) | After ~100 tool calls/day |
| Sequential bulk operations | Creating 50 invoices takes 50+ seconds, user waits | Implement concurrent requests (respect rate limits), or guide Claude to use batch endpoints | When user asks to "import this CSV" with >10 rows |
| Unbounded list operations | Calling `list_sales_invoices` returns 10,000 invoices, crashes MCP client | Implement pagination, default to recent items (last 30 days), let Claude request more if needed | When user has >1000 invoices |
| No connection pooling | New HTTPS connection for each API call, slow performance | Use HTTP client with keep-alive and connection pooling (e.g., `axios` with `http.Agent`) | After ~50 API calls/session |
| Logging every API call to console | Verbose output, hard to debug actual issues | Log to file with rotation, use log levels (ERROR, WARN, INFO, DEBUG), suppress DEBUG in production | When logs exceed 1MB/day |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Logging Bearer token in error messages | Token leakage → unauthorized API access | Redact `Authorization` header in all logs. Use `Authorization: Bearer ***` or strip entirely. |
| Exposing delete operations without confirmation | Accidental data loss, compliance violations | Return detailed confirmation message: "Deleted invoice #INV-001. This is permanent. To undo, you must manually recreate the invoice." (Note: Project explicitly excludes interactive confirmations) |
| No audit trail of MCP tool calls | Can't trace who changed what when | Log every tool call with timestamp, tool name, parameters (redact sensitive fields), response status. Retain for compliance period (7+ years for accounting data). |
| Accepting arbitrary Company-Subdomain from tool calls | User could access other companies' data | Only accept subdomain from environment variable at startup, reject any runtime override attempts. |
| Returning sensitive data in error messages | PII leakage, compliance violations | Sanitize errors: return "Invalid customer ID" not "Customer 'John Doe <john@secret.com>' not found". |
| No TLS verification for API calls | Man-in-the-middle attacks | Ensure HTTPS client validates certificates (default in Node.js `https` module, but verify). |
| Storing API responses in plaintext logs | Compliance violations (GDPR, SOX) | If logging responses for debug, redact customer names, emails, amounts. Better: log only status codes and error messages, not full bodies. |
| Using same credentials across environments | Production data exposed in development | Document separate env var setup for staging (`BUKKU_API_TOKEN_STAGING`) vs production (`BUKKU_API_TOKEN`). |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Returning only IDs in success responses | User asks "did it work?", has to manually check Bukku UI | Return full created object with key fields: "Created invoice #INV-001 for ABC Corp, amount $500.00, due 2026-03-01". |
| Vague error messages | User doesn't know what to fix, asks Claude to retry blindly | Structured errors with actionable guidance: "Tax code 'SR' invalid. Valid options: ST, ZR, EX. Use ST for standard sales." |
| No progress feedback for bulk operations | User thinks it's frozen, interrupts | Stream progress updates: "Created 5/20 invoices... Created 10/20 invoices..." (Note: Requires streaming response support in MCP SDK) |
| Inconsistent operation results | Sometimes returns summary, sometimes full details | Standardize response format: summary for lists, full details for creates/updates, confirmation for deletes. |
| No guidance on when to use batch vs individual | User doesn't know if "create 50 invoices" is okay | Add to tool descriptions: "For >10 invoices, consider creating a consolidated journal entry instead (per Bukku best practices)." |
| Cryptic field names in responses | User sees "gl_account_id: 1234" and doesn't know what it means | Include human-readable labels: "G/L Account: 4000 (Sales Revenue)". Fetch account names from chart of accounts if needed. |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Tool descriptions**: Often missing task-oriented language — verify each description explains WHEN to use the tool, not just WHAT it does. Test with real user prompts.
- [ ] **Error handling**: Often missing LLM-friendly structured errors — verify `isError: true` responses include what/why/how-to-fix, not just raw API errors.
- [ ] **Pagination**: Often missing or incomplete — verify list operations handle multi-page responses or document single-page limitation clearly.
- [ ] **Input validation**: Often missing business logic validation — verify accounting tools check double-entry rules, not just data types.
- [ ] **Authentication error handling**: Often generic — verify 401/403 returns actionable message: "Bukku API token invalid or expired. Check BUKKU_API_TOKEN environment variable."
- [ ] **Rate limit handling**: Often missing — verify retry logic with exponential backoff on HTTP 429.
- [ ] **Idempotency**: Often assumed but not verified — verify create operations check for duplicates or use idempotency keys.
- [ ] **Logging**: Often too verbose or missing — verify request/response logging redacts auth tokens and PII.
- [ ] **Reference data caching**: Often missing — verify tax codes, currencies fetched once and cached, not on every transaction.
- [ ] **Void vs delete semantics**: Often undocumented — verify destructive operations document reversibility and audit trail impact.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Poor tool descriptions → Claude makes wrong choices | MEDIUM | 1. Identify which tools are misused (check logs). 2. Rewrite descriptions with task-oriented language. 3. Redeploy MCP server. 4. Test with original failing prompts. |
| Double-entry validation missing → unbalanced entries | HIGH | 1. Query Bukku API for all journal entries since go-live. 2. Calculate debit/credit balance for each. 3. Identify unbalanced entries. 4. Create correcting journal entries to balance. 5. Add validation to prevent recurrence. |
| Production data corruption (duplicate invoices) | HIGH | 1. List all invoices created by MCP server (check timestamps). 2. Identify duplicates (same number, customer, amount, date). 3. Void or delete duplicates in Bukku. 4. Verify customer wasn't double-billed. 5. Add idempotency checks. |
| Bearer token leaked in logs | HIGH | 1. Immediately rotate token in Bukku admin panel. 2. Update `BUKKU_API_TOKEN` env var. 3. Review logs for unauthorized API calls (check IPs, unusual operations). 4. Notify user if financial data was accessed. 5. Add token redaction to logging middleware. |
| Rate limit ban (HTTP 429) | LOW | 1. Wait for ban to expire (check `Retry-After` header or wait 1 hour). 2. Implement exponential backoff. 3. Reduce batch sizes. 4. Consider using batch endpoints instead of loops. |
| OpenAPI schema references broken ($ref errors) | MEDIUM | 1. Review error messages for specific schema failures. 2. Regenerate tool schemas with proper $defs conversion. 3. Redeploy MCP server. 4. Test affected tools. |
| No audit trail of changes | MEDIUM | 1. Cannot recover past actions (data lost). 2. Implement comprehensive logging immediately. 3. Document logging policy in README for future compliance. |
| Structured error poverty → Claude can't self-correct | MEDIUM | 1. Identify which API errors cause Claude to fail. 2. Build error transformation middleware for those errors. 3. Deploy incrementally (start with most common errors). 4. Test Claude's self-correction with previous failing cases. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Tool description quality (context pollution) | Phase 1: Tool Schema Design | Generate 3 tools, test with Claude using varied prompts, verify correct tool selection >90% of time |
| Missing double-entry validation | Phase 2: Accounting Tools | Create journal entry with unbalanced debits/credits, verify MCP returns structured error and Claude self-corrects |
| Production data from day one (no safety net) | Phase 0: Project Setup + ongoing | README includes risk warnings, test log output includes redacted auth, verify void vs delete documented |
| Bearer token passthrough | Phase 1: Authentication Setup | Grep codebase for logged auth headers, verify none appear in test output |
| OpenAPI schema reference explosion | Phase 1: OpenAPI to MCP Conversion | Generate tool schema, verify no external $refs, test with JSON Schema validator, confirm Claude can parse |
| Rate limiting blind spots | Phase 2: HTTP Client Setup | Simulate 429 response, verify exponential backoff triggers, check error message provides actionable guidance |
| Idempotency ignorance | Phase 2: Sales/Purchase Tools | Create invoice, simulate timeout, retry, verify no duplicate created or clear error returned |
| Structured error poverty | Phase 1: Error Handling Architecture | Trigger common API errors (invalid tax code, missing required field), verify LLM-friendly error with what/why/how |

## Sources

### MCP Security and Best Practices (HIGH confidence)
- [MCP Security Survival Guide: Best Practices, Pitfalls, and Real-World Lessons | Towards Data Science](https://towardsdatascience.com/the-mcp-security-survival-guide-best-practices-pitfalls-and-real-world-lessons/)
- [Model Context Protocol (MCP): Understanding security risks and controls | Red Hat](https://www.redhat.com/en/blog/model-context-protocol-mcp-understanding-security-risks-and-controls)
- [Security Best Practices - Model Context Protocol (Official Spec)](https://modelcontextprotocol.io/specification/draft/basic/security_best_practices)
- [MCP Best Practices: Architecture & Implementation Guide](https://modelcontextprotocol.info/docs/best-practices/)
- [Tools - Model Context Protocol (Official Spec)](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)

### Tool Design and Context Management (MEDIUM confidence)
- [MCP Tool Search: Claude Code Feature Guide | Cyrus](https://www.atcyrus.com/stories/mcp-tool-search-claude-code-context-pollution-guide)
- [MCP tool descriptions: overview, examples, and best practices | Merge.dev](https://www.merge.dev/blog/mcp-tool-description)
- [MCP Server Naming Conventions | ZazenCodes](https://zazencodes.com/blog/mcp-server-naming-conventions)
- [15 Best Practices for Building MCP Servers in Production | The New Stack](https://thenewstack.io/15-best-practices-for-building-mcp-servers-in-production/)

### OpenAPI to MCP Conversion (MEDIUM confidence)
- [From OpenAPI spec to MCP: how we built Xata's MCP server | Xata](https://xata.io/blog/built-xata-mcp-server)
- [Lessons from complex OpenAPI spec to MCP server conversions | Stainless](https://www.stainless.com/blog/lessons-from-openapi-to-mcp-server-conversion)
- [Generating MCP tools from OpenAPI: benefits, limits and best practices | Speakeasy](https://www.speakeasy.com/mcp/tool-design/generate-mcp-tools-from-openapi)

### Accounting API Integration (MEDIUM confidence)
- [The Complete Guide to Accounting API Integrations for Fintech | Apideck](https://www.apideck.com/blog/the-complete-guide-to-accounting-api-integrations-for-fintech)
- [Developer's Guide to Accounting API Integration | Knit](https://www.getknit.dev/blog/developers-guide-to-accounting-api-integration)
- [A SaaS Founder & CTO's Guide to API Rate Limits in Accounting Platforms | Satva Solutions](https://satvasolutions.com/blog/saas-leaders-guide-api-rate-limits-in-accounting-platforms)

### Error Handling and Self-Correction (HIGH confidence)
- [Error Handling in MCP Tools | APXML](https://apxml.com/courses/getting-started-model-context-protocol/chapter-3-implementing-tools-and-logic/error-handling-reporting)
- [Error Handling And Debugging MCP Servers | Stainless](https://www.stainless.com/mcp/error-handling-and-debugging-mcp-servers)

### Idempotency and Duplicate Prevention (MEDIUM confidence)
- [How to Prevent Duplicate Payments in Accounts Payable | Brex](https://www.brex.com/spend-trends/accounting/prevent-duplicate-payments-in-accounts-payable)
- [Duplicate Invoices: What Are They and How to Prevent Them | Medius](https://www.medius.com/blog/duplicate-invoices/)

### Double-Entry Accounting Validation (MEDIUM confidence)
- [Troubleshooting Common Journal Entry API Errors | SAP Community](https://community.sap.com/t5/enterprise-resource-planning-blog-posts-by-sap/troubleshooting-common-journal-entry-api-errors-a-quick-guide/ba-p/13720456)
- [An Engineer's Guide to Double-Entry Bookkeeping | Anvil](https://anvil.works/blog/double-entry-accounting-for-engineers)

### Authentication and Token Security (HIGH confidence)
- [MCP authentication and authorization implementation guide | Stytch](https://stytch.com/blog/MCP-authentication-and-authorization-guide/)
- [Best Practices for remote MCP bearer token Authentication | MCP Discussion](https://github.com/modelcontextprotocol/modelcontextprotocol/discussions/1247)

### Rate Limiting and Performance (MEDIUM confidence)
- [How to Handle API Rate Limits Gracefully (2026 Guide) | API Status Check Blog](https://apistatuscheck.com/blog/how-to-handle-api-rate-limits)
- [7 API rate limit best practices worth following | Merge.dev](https://www.merge.dev/blog/api-rate-limit-best-practices)

---
*Pitfalls research for: MCP Server Wrapping Accounting REST API (Bukku)*
*Researched: 2026-02-06*
