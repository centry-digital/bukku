import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { configCommand } from './commands/config.js';
import { registerEntityCommands } from './commands/factory.js';

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

// Config command
program.addCommand(configCommand);

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
