/**
 * Exit codes for CLI.
 */
export const ExitCode = {
  SUCCESS: 0,
  GENERAL: 1,
  AUTH: 2,
  API: 3,
  VALIDATION: 4,
} as const;

/**
 * Structured CLI error shape written to stderr.
 */
export interface CliError {
  error: string;
  code: string;
  details?: unknown;
}

/**
 * Map error code strings to numeric exit codes.
 */
export function mapExitCode(errorCode: string): number {
  switch (errorCode) {
    case 'AUTH_MISSING':
      return ExitCode.AUTH;
    case 'API_ERROR':
    case 'API_HTTP_ERROR':
      return ExitCode.API;
    case 'VALIDATION_ERROR':
      return ExitCode.VALIDATION;
    default:
      return ExitCode.GENERAL;
  }
}

/**
 * Write structured error JSON to stderr and exit with code.
 */
export function outputError(err: CliError, exitCode: number): never {
  process.stderr.write(JSON.stringify(err) + '\n');
  process.exit(exitCode);
}
