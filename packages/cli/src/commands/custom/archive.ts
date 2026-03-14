import type { Command } from 'commander';
import { withAuth } from '../wrapper.js';
import { outputJson } from '../../output/json.js';
import { outputError, ExitCode } from '../../output/error.js';

/**
 * Archive/unarchive configs for entities that support is_archived toggling.
 *
 * Note: locations use singular /location/{id} path (API inconsistency).
 */
const ARCHIVE_CONFIGS = [
  { group: 'contacts', resource: 'contacts', apiPath: '/contacts', description: 'contact' },
  { group: 'products', resource: 'products', apiPath: '/products', description: 'product' },
  { group: 'products', resource: 'bundles', apiPath: '/products/bundles', description: 'product bundle' },
  { group: 'accounting', resource: 'accounts', apiPath: '/accounts', description: 'account' },
  { group: 'control-panel', resource: 'locations', apiPath: '/location', description: 'location' },
] as const;

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
 * Register archive and unarchive commands for contacts, products, bundles, accounts, locations.
 *
 * These commands are added as subcommands under existing resource commands
 * created by the factory (registerEntityCommands must run first).
 */
export function registerArchiveCommands(program: Command): void {
  for (const config of ARCHIVE_CONFIGS) {
    // Find the group command (already created by factory)
    const groupCmd = program.commands.find((c) => c.name() === config.group);
    if (!groupCmd) continue;

    // Find the resource subcommand (already created by factory)
    const resourceCmd = groupCmd.commands.find((c) => c.name() === config.resource);
    if (!resourceCmd) continue;

    // Add archive subcommand
    const archiveHandler = withAuth(async ({ client, opts }) => {
      const id = opts._entityId as number;
      const data = await client.patch(`${config.apiPath}/${id}`, { is_archived: true });
      outputJson(data);
    });

    resourceCmd
      .command('archive <id>')
      .description(`Archive a ${config.description}`)
      .action(function (this: Command, idArg: string, ...rest: unknown[]) {
        const id = parseId(idArg);
        this.setOptionValue('_entityId', id);
        return archiveHandler.call(this, idArg, ...rest);
      });

    // Add unarchive subcommand
    const unarchiveHandler = withAuth(async ({ client, opts }) => {
      const id = opts._entityId as number;
      const data = await client.patch(`${config.apiPath}/${id}`, { is_archived: false });
      outputJson(data);
    });

    resourceCmd
      .command('unarchive <id>')
      .description(`Unarchive a ${config.description}`)
      .action(function (this: Command, idArg: string, ...rest: unknown[]) {
        const id = parseId(idArg);
        this.setOptionValue('_entityId', id);
        return unarchiveHandler.call(this, idArg, ...rest);
      });
  }
}
