import { Command } from 'commander';
import { allEntityConfigs } from 'core';
import type { CrudEntityConfig, BukkuPaging } from 'core';
import { withAuth } from './wrapper.js';
import { outputJson } from '../output/json.js';
import { outputTable } from '../output/table.js';
import { readJsonInput } from '../input/json.js';

/**
 * Map entity name to CLI resource subcommand name.
 * Explicit mapping is more maintainable than prefix-stripping heuristics.
 */
const RESOURCE_NAME_MAP: Record<string, string> = {
  'sales-invoice': 'invoices',
  'sales-quote': 'quotes',
  'sales-order': 'orders',
  'sales-credit-note': 'credit-notes',
  'sales-payment': 'payments',
  'sales-refund': 'refunds',
  'delivery-order': 'delivery-orders',
  'purchase-bill': 'bills',
  'purchase-order': 'orders',
  'purchase-credit-note': 'credit-notes',
  'purchase-payment': 'payments',
  'purchase-refund': 'refunds',
  'goods-received-note': 'goods-received-notes',
  'bank-money-in': 'money-in',
  'bank-money-out': 'money-out',
  'bank-transfer': 'transfers',
  'contact': 'contacts',
  'contact-group': 'groups',
  'product': 'products',
  'product-bundle': 'bundles',
  'product-group': 'groups',
  'journal-entry': 'journal-entries',
  'account': 'accounts',
  'file': 'files',
  'location': 'locations',
  'tag': 'tags',
  'tag-group': 'tag-groups',
};

/**
 * Group descriptions for top-level CLI command groups.
 */
const GROUP_DESCRIPTIONS: Record<string, string> = {
  sales: 'Sales invoices, quotes, orders, credit notes, payments, refunds',
  purchases: 'Purchase bills, orders, credit notes, payments, refunds',
  banking: 'Bank transactions and transfers',
  contacts: 'Customers, suppliers, and contacts',
  products: 'Products, bundles, and product groups',
  accounting: 'Chart of accounts and journal entries',
  files: 'File uploads and attachments',
  'control-panel': 'Locations, tags, and tag groups',
};

/**
 * Convert a flag name with hyphens to underscore parameter name.
 * e.g., "contact-id" -> "contact_id"
 */
function toParamName(flag: string): string {
  return flag.replace(/-/g, '_');
}

/**
 * Convert an underscore parameter name to a hyphenated flag name.
 * e.g., "contact_id" -> "contact-id"
 */
function toFlagName(param: string): string {
  return param.replace(/_/g, '-');
}

/**
 * Add the `list` subcommand to a resource command.
 */
function addListCommand(resourceCmd: Command, config: CrudEntityConfig): void {
  const listCmd = resourceCmd
    .command('list')
    .description(`List ${config.description}s`);

  // Standard options
  listCmd
    .option('--limit <n>', 'Maximum items per page', undefined)
    .option('--page <n>', 'Page number', undefined)
    .option('--search <text>', 'Search text', undefined)
    .option('--date-from <date>', 'Filter from date (YYYY-MM-DD)', undefined)
    .option('--date-to <date>', 'Filter to date (YYYY-MM-DD)', undefined)
    .option('--status <status>', 'Filter by status', undefined)
    .option('--sort-by <field>', 'Sort by field', undefined)
    .option('--sort-dir <dir>', 'Sort direction (asc, desc)', undefined)
    .option('--all', 'Fetch all pages', false)
    .option('--format <format>', 'Output format (json, table)', 'json');

  // Entity-specific filter options
  if (config.listFilters) {
    for (const filter of config.listFilters) {
      const flagName = toFlagName(filter);
      // Skip filters that duplicate standard options
      if (['search', 'status'].includes(filter)) continue;
      listCmd.option(`--${flagName} <value>`, `Filter by ${filter}`, undefined);
    }
  }

  listCmd.action(
    withAuth(async ({ client, opts }) => {
      // Build query params
      const params: Record<string, string | number | undefined> = {};

      if (opts.limit != null) params.page_size = Number(opts.limit);
      if (opts.page != null) params.page = Number(opts.page);
      if (opts.search != null) params.search = opts.search as string;
      if (opts.dateFrom != null) params.date_from = opts.dateFrom as string;
      if (opts.dateTo != null) params.date_to = opts.dateTo as string;
      if (opts.status != null) params.status = opts.status as string;
      if (opts.sortBy != null) params.sort_by = opts.sortBy as string;
      if (opts.sortDir != null) params.sort_dir = opts.sortDir as string;

      // Entity-specific filters
      if (config.listFilters) {
        for (const filter of config.listFilters) {
          if (['search', 'status'].includes(filter)) continue;
          // Commander camelCases the flag: "contact-id" -> "contactId"
          const camelKey = toFlagName(filter)
            .replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
          if (opts[camelKey] != null) {
            params[filter] = opts[camelKey] as string;
          }
        }
      }

      const format = opts.format as string;

      if (opts.all) {
        // Auto-pagination: fetch all pages
        const pageSize = params.page_size ?? 100;
        params.page_size = pageSize;
        params.page = 1;

        const firstResponse = await client.get(config.apiBasePath, params) as Record<string, unknown>;
        const paging = firstResponse.paging as BukkuPaging;
        const allItems = [...(firstResponse[config.pluralKey] as unknown[] || [])];

        const totalPages = Math.ceil(paging.total / paging.per_page);

        if (totalPages > 1) {
          process.stderr.write(`Fetching page 1/${totalPages}...\n`);
        }

        for (let page = 2; page <= totalPages; page++) {
          process.stderr.write(`Fetching page ${page}/${totalPages}...\n`);
          params.page = page;
          const response = await client.get(config.apiBasePath, params) as Record<string, unknown>;
          const items = response[config.pluralKey] as unknown[] || [];
          allItems.push(...items);
        }

        if (format === 'table') {
          outputTable(allItems, [config.entity]);
        } else {
          outputJson(allItems);
        }
      } else {
        const data = await client.get(config.apiBasePath, params);

        if (format === 'table') {
          const response = data as Record<string, unknown>;
          const items = response[config.pluralKey] as unknown[] || [];
          outputTable(items, [config.entity]);
        } else {
          outputJson(data);
        }
      }
    }),
  );
}

/**
 * Add the `get` subcommand to a resource command.
 */
function addGetCommand(resourceCmd: Command, config: CrudEntityConfig): void {
  const getCmd = resourceCmd
    .command('get <id>')
    .description(`Get a single ${config.description} by ID`);

  getCmd.option('--format <format>', 'Output format (json, table)', 'json');

  // Commander passes (id, options, command) to action.
  // withAuth ignores positional args, so we wrap with a thin function
  // that captures the id and stores it before delegating to withAuth.
  const wrappedHandler = withAuth(async ({ client, opts }) => {
    const parsedId = opts._entityId as number;

    const data = await client.get(`${config.apiBasePath}/${parsedId}`);
    const format = opts.format as string;

    if (format === 'table') {
      const response = data as Record<string, unknown>;
      const item = response[config.singularKey] as unknown;
      outputTable(item ? [item] : [], [config.entity]);
    } else {
      outputJson(data);
    }
  });

  getCmd.action(function (this: Command, idArg: string, ...rest: unknown[]) {
    const parsedId = parseInt(idArg, 10);

    if (isNaN(parsedId) || parsedId <= 0) {
      process.stderr.write(
        JSON.stringify({ error: 'ID must be a positive integer', code: 'VALIDATION_ERROR' }) + '\n',
      );
      process.exit(4);
    }

    // Stash parsed id into the command's opts so withAuth handler can access it
    this.setOptionValue('_entityId', parsedId);
    return wrappedHandler.call(this, idArg, ...rest);
  });
}

/**
 * Add the `create` subcommand to a resource command.
 */
function addCreateCommand(resourceCmd: Command, config: CrudEntityConfig): void {
  const createCmd = resourceCmd
    .command('create')
    .description(`Create a new ${config.description}`)
    .option('--data <json>', 'JSON data (or pipe to stdin)');

  createCmd.action(
    withAuth(async ({ client, opts }) => {
      const body = await readJsonInput(opts);
      const data = await client.post(config.apiBasePath, body);
      outputJson(data);
    }),
  );
}

/**
 * Add the `update` subcommand to a resource command.
 */
function addUpdateCommand(resourceCmd: Command, config: CrudEntityConfig): void {
  const updateCmd = resourceCmd
    .command('update <id>')
    .description(`Update a ${config.description}`)
    .option('--data <json>', 'JSON data (or pipe to stdin)');

  const wrappedHandler = withAuth(async ({ client, opts }) => {
    const parsedId = opts._entityId as number;
    const body = await readJsonInput(opts);
    const data = await client.put(`${config.apiBasePath}/${parsedId}`, body);
    outputJson(data);
  });

  updateCmd.action(function (this: Command, idArg: string, ...rest: unknown[]) {
    const parsedId = parseInt(idArg, 10);

    if (isNaN(parsedId) || parsedId <= 0) {
      process.stderr.write(
        JSON.stringify({ error: 'ID must be a positive integer', code: 'VALIDATION_ERROR' }) + '\n',
      );
      process.exit(4);
    }

    this.setOptionValue('_entityId', parsedId);
    return wrappedHandler.call(this, idArg, ...rest);
  });
}

/**
 * Add the `delete` subcommand to a resource command.
 */
function addDeleteCommand(resourceCmd: Command, config: CrudEntityConfig): void {
  const deleteCmd = resourceCmd
    .command('delete <id>')
    .description(`Delete a ${config.description}`);

  const wrappedHandler = withAuth(async ({ client, opts }) => {
    const parsedId = opts._entityId as number;
    await client.delete(`${config.apiBasePath}/${parsedId}`);
    outputJson({});
  });

  deleteCmd.action(function (this: Command, idArg: string, ...rest: unknown[]) {
    const parsedId = parseInt(idArg, 10);

    if (isNaN(parsedId) || parsedId <= 0) {
      process.stderr.write(
        JSON.stringify({ error: 'ID must be a positive integer', code: 'VALIDATION_ERROR' }) + '\n',
      );
      process.exit(4);
    }

    this.setOptionValue('_entityId', parsedId);
    return wrappedHandler.call(this, idArg, ...rest);
  });
}

/**
 * Add the `status` subcommand to a resource command.
 * Used for entities that support status transitions (e.g., draft -> posted).
 */
function addStatusCommand(resourceCmd: Command, config: CrudEntityConfig): void {
  const statusCmd = resourceCmd
    .command('status <id>')
    .description(`Update status of a ${config.description}`)
    .requiredOption('--status <status>', 'New status value');

  const wrappedHandler = withAuth(async ({ client, opts }) => {
    const parsedId = opts._entityId as number;
    const status = opts.status as string;
    const data = await client.patch(`${config.apiBasePath}/${parsedId}`, { status });
    outputJson(data);
  });

  statusCmd.action(function (this: Command, idArg: string, ...rest: unknown[]) {
    const parsedId = parseInt(idArg, 10);

    if (isNaN(parsedId) || parsedId <= 0) {
      process.stderr.write(
        JSON.stringify({ error: 'ID must be a positive integer', code: 'VALIDATION_ERROR' }) + '\n',
      );
      process.exit(4);
    }

    this.setOptionValue('_entityId', parsedId);
    return wrappedHandler.call(this, idArg, ...rest);
  });
}

/**
 * Register all entity CRUD commands on the Commander program.
 *
 * Iterates allEntityConfigs from core, creates group and resource subcommands,
 * and adds list/get subcommands based on each entity's supported operations.
 */
export function registerEntityCommands(program: Command): void {
  for (const config of allEntityConfigs) {
    if (!config.cliGroup) continue;

    const groupName = config.cliGroup;
    const resourceName = RESOURCE_NAME_MAP[config.entity];
    if (!resourceName) continue;

    // Find or create the group command
    let groupCmd = program.commands.find((c) => c.name() === groupName);
    if (!groupCmd) {
      groupCmd = program
        .command(groupName)
        .description(GROUP_DESCRIPTIONS[groupName] || groupName);
    }

    // Create resource subcommand under the group
    const resourceCmd = groupCmd
      .command(resourceName)
      .description(`Manage ${config.description}s`);

    // Add list subcommand if supported
    if (config.operations.includes('list')) {
      addListCommand(resourceCmd, config);
    }

    // Add get subcommand if supported
    if (config.operations.includes('get')) {
      addGetCommand(resourceCmd, config);
    }

    // Add create subcommand if supported
    if (config.operations.includes('create')) {
      addCreateCommand(resourceCmd, config);
    }

    // Add update subcommand if supported
    if (config.operations.includes('update')) {
      addUpdateCommand(resourceCmd, config);
    }

    // Add delete subcommand if supported
    if (config.operations.includes('delete')) {
      addDeleteCommand(resourceCmd, config);
    }

    // Add status subcommand if entity supports status updates
    if (config.hasStatusUpdate) {
      addStatusCommand(resourceCmd, config);
    }
  }
}
