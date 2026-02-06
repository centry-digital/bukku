/**
 * Logger utility for MCP server.
 * CRITICAL: All logs must go to stderr, NEVER stdout.
 * MCP servers communicate via stdio - stdout is reserved for protocol messages.
 */

export function log(message: string, ...args: unknown[]): void {
  console.error(`[bukku-mcp] ${message}`, ...args);
}
