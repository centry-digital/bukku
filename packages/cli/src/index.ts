import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { configCommand } from './commands/config.js';
import { registerEntityCommands } from './commands/factory.js';
import { registerReferenceDataCommands } from './commands/custom/reference-data.js';
import { registerSearchAccountsCommand } from './commands/custom/search-accounts.js';
import { registerArchiveCommands } from './commands/custom/archive.js';
import { registerLocationWriteCommands } from './commands/custom/location-write.js';
import { registerJournalEntryCommands } from './commands/custom/journal-entry.js';
import { registerFileUploadCommand } from './commands/custom/file-upload.js';

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

// Register all entity commands (list/get) from core configs
registerEntityCommands(program);

// Custom commands (reference data, search-accounts)
registerReferenceDataCommands(program);
registerSearchAccountsCommand(program);
registerArchiveCommands(program);
registerLocationWriteCommands(program);
registerJournalEntryCommands(program);
registerFileUploadCommand(program);

// Config command
program.addCommand(configCommand);

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
