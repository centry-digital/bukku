import type { Command } from 'commander';
import { basename } from 'node:path';
import { access } from 'node:fs/promises';
import { withAuth } from '../wrapper.js';
import { outputJson } from '../../output/json.js';
import { outputDryRun } from '../../output/dry-run.js';
import { outputError, ExitCode } from '../../output/error.js';

/**
 * Register the file upload command.
 *
 * Uploads a file to Bukku via multipart/form-data using BukkuClient.postMultipart.
 * Validates the file exists before uploading.
 */
export function registerFileUploadCommand(program: Command): void {
  // Find or create the files group command.
  // The factory creates a 'files' group for the file entity (list only),
  // so it should already exist. If not, create it.
  let groupCmd = program.commands.find((c) => c.name() === 'files');
  if (!groupCmd) {
    groupCmd = program
      .command('files')
      .description('File uploads and attachments');
  }

  const wrappedHandler = withAuth(async ({ client, opts, auth }) => {
    const filePath = opts._filePath as string;

    // Validate file exists
    try {
      await access(filePath);
    } catch {
      outputError(
        { error: 'File not found: ' + filePath, code: 'VALIDATION_ERROR' },
        ExitCode.VALIDATION,
      );
    }

    if (opts.dryRun) {
      outputDryRun({ method: 'POST', path: '/files', token: auth.apiToken, subdomain: auth.companySubdomain, body: { file: basename(filePath) } });
      return;
    }

    const data = await client.postMultipart('/files', filePath);
    outputJson(data);
  });

  groupCmd
    .command('upload <path>')
    .description('Upload a file to Bukku')
    .option('--dry-run', 'Show request details without executing', false)
    .action(function (this: Command, pathArg: string, ...rest: unknown[]) {
      this.setOptionValue('_filePath', pathArg);
      return wrappedHandler.call(this, pathArg, ...rest);
    });
}
