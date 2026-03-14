import { outputJson } from './json.js';

/**
 * Placeholder table formatter.
 * Logs a warning to stderr and falls back to JSON output.
 * Real table implementation comes in Phase 14.
 */
export function outputTable(data: unknown, _columns?: string[]): void {
  console.error('[bukku-cli] Table format will be available in a future release. Showing JSON.');
  outputJson(data);
}
