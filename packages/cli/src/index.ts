import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { configCommand } from './commands/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkg = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'),
) as { version: string };

const program = new Command();

program
  .name('bukku')
  .version(pkg.version)
  .description('Bukku accounting CLI');

// Global options
program
  .option('--api-token <token>', 'API token')
  .option('--company-subdomain <subdomain>', 'Company subdomain');

// Command groups (placeholders for Phase 14)
program.command('sales').description('Sales invoices, quotes, orders, credit notes, payments, refunds');
program.command('purchases').description('Purchase bills, orders, credit notes, payments, refunds');
program.command('banking').description('Bank accounts and transactions');
program.command('contacts').description('Customers, suppliers, and contacts');
program.command('products').description('Products and services');
program.command('accounting').description('Chart of accounts, journal entries, tax codes');
program.command('files').description('File uploads and attachments');
program.command('settings').description('Company settings and preferences');

// Config command
program.addCommand(configCommand);

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
