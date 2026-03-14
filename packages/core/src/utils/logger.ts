/**
 * Logger utility.
 * CRITICAL: All logs must go to stderr, NEVER stdout.
 * MCP servers communicate via stdio — stdout is reserved for protocol messages.
 * CLI tools use stdout for data output only.
 */
export function createLogger(prefix: string): (message: string, ...args: unknown[]) => void {
  return (message: string, ...args: unknown[]) => {
    console.error(`[${prefix}] ${message}`, ...args);
  };
}
