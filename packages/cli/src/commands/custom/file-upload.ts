import type { Command } from 'commander';
import { access } from 'node:fs/promises';
import { withAuth } from '../wrapper.js';
import { outputJson } from '../../output/json.js';
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

  const wrappedHandler = withAuth(async ({ client, opts }) => {
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

    const data = await client.postMultipart('/files', filePath);
    outputJson(data);
  });

  groupCmd
    .command('upload <path>')
    .description('Upload a file to Bukku')
    .action(function (this: Command, pathArg: string, ...rest: unknown[]) {
      this.setOptionValue('_filePath', pathArg);
      return wrappedHandler.call(this, pathArg, ...rest);
    });
}
