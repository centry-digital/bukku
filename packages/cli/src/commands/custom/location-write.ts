import type { Command } from 'commander';
import { withAuth } from '../wrapper.js';
import { outputJson } from '../../output/json.js';
import { outputDryRun } from '../../output/dry-run.js';
import { outputTable } from '../../output/table.js';
import { outputError, ExitCode } from '../../output/error.js';
import { readJsonInput } from '../../input/json.js';

/**
 * Parse and validate a positional ID argument.
 */
function parseId(idArg: string): number {
  const parsed = parseInt(idArg, 10);
  if (isNaN(parsed) || parsed <= 0) {
    outputError(
      { error: 'ID must be a positive integer', code: 'VALIDATION_ERROR' },
      ExitCode.VALIDATION,
    );
  }
  return parsed;
}

/**
 * Register location get/update/delete commands using singular /location/{id} path.
 *
 * The Bukku API uses /locations (plural) for list/create but /location/{id} (singular)
 * for get/update/delete. The factory only generates list and create for locations,
 * so these custom commands handle the singular-path operations.
 */
export function registerLocationWriteCommands(program: Command): void {
  // Find existing control-panel group and locations resource
  const groupCmd = program.commands.find((c) => c.name() === 'control-panel');
  if (!groupCmd) return;

  const resourceCmd = groupCmd.commands.find((c) => c.name() === 'locations');
  if (!resourceCmd) return;

  // Add get subcommand
  const getHandler = withAuth(async ({ client, opts }) => {
    const id = opts._entityId as number;
    const data = await client.get(`/location/${id}`);
    const format = opts.format as string;

    if (format === 'table') {
      const response = data as Record<string, unknown>;
      const item = response['location'] as unknown;
      outputTable(item ? [item] : [], ['location']);
    } else {
      outputJson(data);
    }
  });

  resourceCmd
    .command('get <id>')
    .description('Get a single location by ID')
    .option('--format <format>', 'Output format (json, table)', 'json')
    .action(function (this: Command, idArg: string, ...rest: unknown[]) {
      const id = parseId(idArg);
      this.setOptionValue('_entityId', id);
      return getHandler.call(this, idArg, ...rest);
    });

  // Add update subcommand
  const updateHandler = withAuth(async ({ client, opts, auth }) => {
    const id = opts._entityId as number;
    const body = await readJsonInput(opts);
    if (opts.dryRun) {
      outputDryRun({ method: 'PUT', path: `/location/${id}`, token: auth.apiToken, subdomain: auth.companySubdomain, body });
      return;
    }
    const data = await client.put(`/location/${id}`, body);
    outputJson(data);
  });

  resourceCmd
    .command('update <id>')
    .description('Update a location')
    .option('--data <json>', 'JSON data (or pipe to stdin)')
    .option('--dry-run', 'Show request details without executing', false)
    .action(function (this: Command, idArg: string, ...rest: unknown[]) {
      const id = parseId(idArg);
      this.setOptionValue('_entityId', id);
      return updateHandler.call(this, idArg, ...rest);
    });

  // Add delete subcommand
  const deleteHandler = withAuth(async ({ client, opts, auth }) => {
    const id = opts._entityId as number;
    if (opts.dryRun) {
      outputDryRun({ method: 'DELETE', path: `/location/${id}`, token: auth.apiToken, subdomain: auth.companySubdomain });
      return;
    }
    await client.delete(`/location/${id}`);
    outputJson({});
  });

  resourceCmd
    .command('delete <id>')
    .description('Delete a location')
    .option('--dry-run', 'Show request details without executing', false)
    .action(function (this: Command, idArg: string, ...rest: unknown[]) {
      const id = parseId(idArg);
      this.setOptionValue('_entityId', id);
      return deleteHandler.call(this, idArg, ...rest);
    });
}
