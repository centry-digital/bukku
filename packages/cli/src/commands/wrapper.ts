import type { Command } from 'commander';
import { BukkuClient } from 'core';
import { resolveAuth, AuthMissingError } from '../config/auth.js';
import { outputError, ExitCode } from '../output/error.js';

/**
 * Context passed to commands wrapped by withAuth.
 */
export interface CommandContext {
  client: BukkuClient;
  opts: Record<string, unknown>;
}

/**
 * Wrap a command handler with auth resolution and error handling.
 *
 * Resolves credentials via 3-tier precedence (flags > env > rc),
 * creates a BukkuClient, and passes it to the handler.
 *
 * Must use a regular function (not arrow) to preserve Commander's `this` context.
 */
export function withAuth(
  handler: (ctx: CommandContext) => Promise<void>,
): (this: Command, ...args: unknown[]) => Promise<void> {
  return async function (this: Command) {
    const mergedOpts = this.optsWithGlobals<{
      apiToken?: string;
      companySubdomain?: string;
    }>();

    let auth;
    try {
      auth = await resolveAuth({
        apiToken: mergedOpts.apiToken,
        companySubdomain: mergedOpts.companySubdomain,
      });
    } catch (err) {
      if (err instanceof AuthMissingError) {
        outputError(
          {
            error:
              'Authentication required. Set credentials via --api-token flag, BUKKU_API_TOKEN env var, or bukku config set',
            code: 'AUTH_MISSING',
            details: null,
          },
          ExitCode.AUTH,
        );
      }
      throw err;
    }

    const client = new BukkuClient({
      apiToken: auth.apiToken,
      companySubdomain: auth.companySubdomain,
    });

    try {
      await handler({ client, opts: mergedOpts as Record<string, unknown> });
    } catch (err) {
      if (err instanceof Response) {
        let body: Record<string, unknown> = {};
        try {
          body = (await err.json()) as Record<string, unknown>;
        } catch {
          // response body not parseable
        }
        outputError(
          {
            error: (body['message'] as string) || 'API error',
            code: 'API_ERROR',
            details: body['errors'] || null,
          },
          ExitCode.API,
        );
      }
      outputError(
        {
          error: err instanceof Error ? err.message : 'Unknown error',
          code: 'GENERAL_ERROR',
        },
        ExitCode.GENERAL,
      );
    }
  };
}
