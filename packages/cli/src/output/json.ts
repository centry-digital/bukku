/**
 * JSON output formatter.
 * Writes valid JSON to stdout for machine consumption.
 */
export function outputJson(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}
