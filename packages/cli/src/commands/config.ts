import { Command } from 'commander';

export const configCommand = new Command('config')
  .description('Manage CLI configuration');

// Subcommands (set/show) implemented in Task 2
