import { outputError, ExitCode } from '../output/error.js';

/**
 * Read JSON input from --data flag or stdin pipe.
 *
 * Precedence:
 * 1. If opts.data is set, parse it as JSON
 * 2. If stdin is piped (!process.stdin.isTTY), read and parse stdin
 * 3. Otherwise, exit with validation error
 */
export async function readJsonInput(opts: Record<string, unknown>): Promise<unknown> {
  if (opts.data != null) {
    try {
      return JSON.parse(opts.data as string);
    } catch (err) {
      outputError(
        {
          error: 'Invalid JSON input: ' + (err instanceof SyntaxError ? err.message : String(err)),
          code: 'VALIDATION_ERROR',
        },
        ExitCode.VALIDATION,
      );
    }
  }

  if (!process.stdin.isTTY) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk as Buffer);
    }
    const raw = Buffer.concat(chunks).toString('utf-8');
    try {
      return JSON.parse(raw);
    } catch (err) {
      outputError(
        {
          error: 'Invalid JSON input: ' + (err instanceof SyntaxError ? err.message : String(err)),
          code: 'VALIDATION_ERROR',
        },
        ExitCode.VALIDATION,
      );
    }
  }

  outputError(
    {
      error: 'JSON input required. Use --data flag or pipe JSON to stdin',
      code: 'VALIDATION_ERROR',
    },
    ExitCode.VALIDATION,
  );
}
