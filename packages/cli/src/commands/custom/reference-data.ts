/**
 * Reference data CLI commands.
 *
 * Reference data (tax codes, currencies, payment methods, etc.) is accessed
 * via Bukku's unified POST /v2/lists endpoint, not standard GET CRUD endpoints.
 * These are short-lived CLI commands, so no caching is needed.
 */

import { Command } from 'commander';
import { withAuth } from '../wrapper.js';
import { outputJson } from '../../output/json.js';
import { outputTable } from '../../output/table.js';

/**
 * Reference data types available from POST /v2/lists endpoint.
 */
const REFERENCE_TYPES = [
  {
    type: 'tax_codes',
    commandName: 'tax-codes',
    description: 'List tax codes (tax rate definitions)',
  },
  {
    type: 'currencies',
    commandName: 'currencies',
    description: 'List activated currencies',
  },
  {
    type: 'payment_methods',
    commandName: 'payment-methods',
    description: 'List payment methods',
  },
  {
    type: 'terms',
    commandName: 'terms',
    description: 'List payment terms',
  },
  {
    type: 'accounts',
    commandName: 'accounts',
    description: 'List accounts from chart of accounts (quick lookup)',
  },
  {
    type: 'price_levels',
    commandName: 'price-levels',
    description: 'List price levels',
  },
  {
    type: 'countries',
    commandName: 'countries',
    description: 'List countries',
  },
  {
    type: 'classification_code_list',
    commandName: 'classification-codes',
    description: 'List product classification codes (Malaysia LHDN e-Invoice)',
  },
  {
    type: 'numberings',
    commandName: 'numberings',
    description: 'List document numbering schemes',
  },
  {
    type: 'state_list',
    commandName: 'states',
    description: 'List geographic states/provinces',
  },
] as const;

/**
 * Register all reference data list commands under a `ref-data` top-level group.
 */
export function registerReferenceDataCommands(program: Command): void {
  const refDataCmd = program
    .command('ref-data')
    .description('Reference data lookups (tax codes, currencies, terms, etc.)');

  for (const { type, commandName, description } of REFERENCE_TYPES) {
    refDataCmd
      .command(commandName)
      .description(description)
      .option('--format <format>', 'Output format (json, table)', 'json')
      .action(
        withAuth(async ({ client, opts }) => {
          const result = await client.post('/v2/lists', {
            lists: [type],
            params: [],
          });

          const format = opts.format as string;
          if (format === 'table') {
            // Reference data results are keyed by type name
            const response = result as Record<string, unknown>;
            const items = (response[type] as unknown[]) || [];
            outputTable(items);
          } else {
            outputJson(result);
          }
        }),
      );
  }
}
