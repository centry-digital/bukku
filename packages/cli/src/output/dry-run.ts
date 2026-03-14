import { outputJson } from './json.js';

export interface DryRunOutput {
  dry_run: true;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
}

/**
 * Output a dry-run request preview without executing the API call.
 *
 * Prints method, full URL, masked auth header, and optional body as JSON to stdout.
 * Token is masked to first 3 characters + **** for safety.
 */
export function outputDryRun(opts: {
  method: string;
  path: string;
  token: string;
  subdomain: string;
  body?: unknown;
}): void {
  const maskedToken =
    opts.token.length > 6 ? opts.token.slice(0, 3) + '****' : '****';
  const output: DryRunOutput = {
    dry_run: true,
    method: opts.method,
    url: `https://api.bukku.my${opts.path}`,
    headers: {
      Authorization: `Bearer ${maskedToken}`,
      'Company-Subdomain': opts.subdomain,
    },
  };
  if (opts.body !== undefined) {
    output.body = opts.body;
  }
  outputJson(output);
}
