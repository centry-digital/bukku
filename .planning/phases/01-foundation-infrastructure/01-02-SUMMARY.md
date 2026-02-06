---
phase: 01-foundation-infrastructure
plan: 02
type: tdd
subsystem: error-handling
status: complete
completed: 2026-02-06

tags:
  - error-transformation
  - mcp-protocol
  - http-errors
  - conversational-messages

dependencies:
  requires: []
  provides:
    - "HTTP to MCP error transformation"
    - "Conversational error messages"
    - "Authentication error handling"
  affects:
    - "01-03 (Bukku API client will use these transformers)"
    - "01-04 (Tool framework will use for error responses)"

tech-stack:
  added: []
  patterns:
    - "Error transformation layer"
    - "Conversational error messaging"
    - "Pattern matching by HTTP status"

key-files:
  created:
    - path: "src/errors/transform.ts"
      purpose: "HTTP to MCP error transformation"
      exports: ["transformHttpError", "transformNetworkError", "MCPErrorResponse"]
      lines: 162
    - path: "src/errors/transform.test.ts"
      purpose: "Tests for error transformation"
      lines: 166
  modified:
    - path: "package.json"
      change: "Added test script for Node.js built-in test runner"

decisions:
  - id: "error-conversational-tone"
    choice: "Use conversational tone for all error messages"
    rationale: "Messages are relayed by Claude to users - should sound like a helpful colleague, not log file"
    alternatives: ["Technical error codes", "JSON error objects"]

  - id: "error-next-steps"
    choice: "Every error message suggests a next action"
    rationale: "Users need guidance on how to proceed - locked decision from plan context"
    alternatives: []

  - id: "auth-error-prominence"
    choice: "401 errors explicitly mention BUKKU_API_TOKEN environment variable"
    rationale: "Authentication is critical - make troubleshooting obvious"
    alternatives: ["Generic auth error", "HTTP 401 code only"]

  - id: "validation-all-at-once"
    choice: "Show all validation errors together"
    rationale: "User can fix all issues in one iteration instead of whack-a-mole"
    alternatives: ["Show first error only", "One error per attempt"]

  - id: "test-framework"
    choice: "Use Node.js built-in test runner with --experimental-strip-types"
    rationale: "Zero dependencies for testing - Node 22+ has native TypeScript support"
    alternatives: ["Jest", "Vitest", "Mocha"]

metrics:
  tests: 10
  test_coverage: "100% (all error paths tested)"
  duration: "2.5 minutes"
  commits: 2

blockers: []
---

# Phase 01 Plan 02: Error Transformation Summary

**One-liner:** Conversational HTTP-to-MCP error transformer with prominent auth failures and batch validation errors

## What Was Built

Created a TDD-driven error transformation layer that converts HTTP errors into conversational MCP error messages. The transformer handles:

- **Authentication errors (401)**: Prominently mentions BUKKU_API_TOKEN environment variable
- **Permission errors (403)**: Clear permission messaging
- **Not found errors (404)**: Suggests listing available items
- **Validation errors (400, 422)**: Shows ALL field errors at once
- **Server errors (500-599)**: Helpful retry suggestions
- **Network errors**: Connection troubleshooting guidance

Every error message suggests a next action, following the locked decision for conversational tone.

## Task Commits

| Task | Type | Description | Commit | Files |
|------|------|-------------|--------|-------|
| RED | test | Add failing tests for error transformation | 908da37 | transform.test.ts, transform.ts (stub), package.json |
| GREEN | feat | Implement HTTP-to-MCP error transformation | 4aeef51 | transform.ts |
| REFACTOR | - | Skipped (no changes needed) | - | - |

## Deviations from Plan

None - plan executed exactly as written.

## Technical Highlights

### Error Message Examples

**Authentication (401):**
> Bukku authentication failed for "create invoice". The BUKKU_API_TOKEN environment variable is either missing or invalid. Please check your token and restart the server with the correct credentials.

**Validation (400 with multiple errors):**
> Validation failed for "create invoice":
>   - contact_id: required
>   - date: invalid format
>
> Please fix these issues and try again.

**Network Error:**
> Couldn't connect to Bukku while trying to "list contacts". Please check your internet connection and ensure the Bukku API is accessible.

### Test Coverage

All 10 tests passing:
- 8 tests for `transformHttpError` (401, 403, 404, 400, 422, 500, 503, fallback)
- 2 tests for `transformNetworkError` (network errors, unknown errors)

### Testing Approach

Used Node.js built-in test runner with `--experimental-strip-types` flag:
- Zero test dependencies
- Native TypeScript support in Node 22+
- Fast execution (121ms total)
- TAP format output

## Integration Points

### Exports

```typescript
export interface MCPErrorResponse {
  isError: true;
  content: Array<{ type: 'text'; text: string }>;
}

export function transformHttpError(
  status: number | null,
  body: unknown,
  operation: string
): MCPErrorResponse

export function transformNetworkError(
  error: unknown,
  operation: string
): MCPErrorResponse
```

### Usage Pattern

```typescript
// In API client
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    return transformHttpError(
      response.status,
      await response.json(),
      'create invoice'
    );
  }
} catch (error) {
  return transformNetworkError(error, 'create invoice');
}
```

## Decisions Made

1. **Conversational Tone**: All error messages read naturally as if spoken by a helpful colleague
2. **Next-Step Guidance**: Every error includes actionable advice (try again, check connection, list items, etc.)
3. **Auth Prominence**: BUKKU_API_TOKEN is explicitly mentioned in 401 errors for quick troubleshooting
4. **Batch Validation**: Multiple validation errors shown together to avoid iteration cycles
5. **Zero Test Dependencies**: Used Node.js built-in test runner instead of Jest/Vitest

## Next Phase Readiness

**Ready for 01-03 (Bukku API Client)**: Error transformers are ready to integrate with fetch-based API client.

**Key for 01-04 (Tool Framework)**: Tool implementations will use these transformers for all error responses.

**No blockers**: All functionality complete and tested.

## Self-Check: PASSED

All created files exist:
- src/errors/transform.ts
- src/errors/transform.test.ts

All commits verified:
- 908da37 (RED - test)
- 4aeef51 (GREEN - feat)
