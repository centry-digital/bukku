import type { Command } from 'commander';
import { validateDoubleEntry } from 'core';
import { withAuth } from '../wrapper.js';
import { outputJson } from '../../output/json.js';
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
 * Register journal entry create and update commands with double-entry validation.
 *
 * The factory generates list, get, and delete for journal entries.
 * Create and update need custom handling to validate that debits equal credits
 * before submitting to the API.
 */
export function registerJournalEntryCommands(program: Command): void {
  // Find existing accounting group and journal-entries resource
  const groupCmd = program.commands.find((c) => c.name() === 'accounting');
  if (!groupCmd) return;

  const resourceCmd = groupCmd.commands.find((c) => c.name() === 'journal-entries');
  if (!resourceCmd) return;

  // Add create subcommand
  resourceCmd
    .command('create')
    .description('Create a new journal entry')
    .option('--data <json>', 'JSON data (or pipe to stdin)')
    .action(
      withAuth(async ({ client, opts }) => {
        const body = await readJsonInput(opts) as Record<string, unknown>;

        // Validate double-entry balance if journal_items present
        if (body.journal_items && Array.isArray(body.journal_items)) {
          const validation = validateDoubleEntry(body.journal_items);
          if (!validation.valid) {
            outputError(
              { error: validation.error!, code: 'VALIDATION_ERROR' },
              ExitCode.VALIDATION,
            );
          }
        }

        const data = await client.post('/journal_entries', body);
        outputJson(data);
      }),
    );

  // Add update subcommand
  const updateHandler = withAuth(async ({ client, opts }) => {
    const id = opts._entityId as number;
    const body = await readJsonInput(opts) as Record<string, unknown>;

    // Validate double-entry balance if journal_items present in update
    if (body.journal_items && Array.isArray(body.journal_items)) {
      const validation = validateDoubleEntry(body.journal_items);
      if (!validation.valid) {
        outputError(
          { error: validation.error!, code: 'VALIDATION_ERROR' },
          ExitCode.VALIDATION,
        );
      }
    }

    const data = await client.put(`/journal_entries/${id}`, body);
    outputJson(data);
  });

  resourceCmd
    .command('update <id>')
    .description('Update a journal entry')
    .option('--data <json>', 'JSON data (or pipe to stdin)')
    .action(function (this: Command, idArg: string, ...rest: unknown[]) {
      const id = parseId(idArg);
      this.setOptionValue('_entityId', id);
      return updateHandler.call(this, idArg, ...rest);
    });
}
