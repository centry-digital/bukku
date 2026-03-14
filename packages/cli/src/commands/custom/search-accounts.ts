/**
 * Search accounts custom command.
 *
 * Provides filtered search of the chart of accounts via GET /accounts.
 * Registered under the `accounting` group command.
 */

import type { Command } from 'commander';
import { withAuth } from '../wrapper.js';
import { outputJson } from '../../output/json.js';
import { outputTable } from '../../output/table.js';

/**
 * Register the search-accounts command under the existing `accounting` group.
 */
export function registerSearchAccountsCommand(program: Command): void {
  // Find the accounting group (created by registerEntityCommands)
  let accountingCmd = program.commands.find((c) => c.name() === 'accounting');
  if (!accountingCmd) {
    accountingCmd = program
      .command('accounting')
      .description('Chart of accounts and journal entries');
  }

  accountingCmd
    .command('search-accounts')
    .description('Search and filter accounts from the chart of accounts')
    .option('--search <text>', 'Search by name, code, or description')
    .option('--category <cat>', 'Filter by category (assets, liabilities, equity, income, expenses)')
    .option('--is-archived', 'Include archived accounts', false)
    .option('--sort-by <field>', 'Sort by field (code, name, balance)')
    .option('--sort-dir <dir>', 'Sort direction (asc, desc)')
    .option('--page <n>', 'Page number')
    .option('--limit <n>', 'Items per page')
    .option('--format <format>', 'Output format (json, table)', 'json')
    .action(
      withAuth(async ({ client, opts }) => {
        const params: Record<string, string | number | undefined> = {};

        if (opts.search != null) params.search = opts.search as string;
        if (opts.category != null) params.category = opts.category as string;
        if (opts.isArchived) params.is_archived = 'true';
        if (opts.sortBy != null) params.sort_by = opts.sortBy as string;
        if (opts.sortDir != null) params.sort_dir = opts.sortDir as string;
        if (opts.page != null) params.page = Number(opts.page);
        if (opts.limit != null) params.page_size = Number(opts.limit);

        const result = await client.get('/accounts', params);
        const format = opts.format as string;

        if (format === 'table') {
          const response = result as Record<string, unknown>;
          const items = (response['accounts'] as unknown[]) || [];
          outputTable(items, ['account']);
        } else {
          outputJson(result);
        }
      }),
    );
}
