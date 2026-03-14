import { readRc } from './rc.js';

export interface ResolvedAuth {
  apiToken: string;
  companySubdomain: string;
  source: Record<string, 'flags' | 'env' | 'rc'>;
}

export class AuthMissingError extends Error {
  readonly code = 'AUTH_MISSING';
  readonly missingFields: string[];

  constructor(missingFields: string[]) {
    super(`Missing required auth: ${missingFields.join(', ')}. Set via --api-token/--company-subdomain flags, BUKKU_API_TOKEN/BUKKU_COMPANY_SUBDOMAIN env vars, or ~/.bukkurc config file.`);
    this.name = 'AuthMissingError';
    this.missingFields = missingFields;
  }
}

/**
 * Resolve auth credentials with 3-tier precedence: flags > env > rc.
 */
export async function resolveAuth(flags: {
  apiToken?: string;
  companySubdomain?: string;
}): Promise<ResolvedAuth> {
  const rc = await readRc();
  const source: Record<string, 'flags' | 'env' | 'rc'> = {};

  // Resolve apiToken: flags > env > rc
  let apiToken: string | undefined;
  if (flags.apiToken) {
    apiToken = flags.apiToken;
    source['apiToken'] = 'flags';
  } else if (process.env['BUKKU_API_TOKEN']) {
    apiToken = process.env['BUKKU_API_TOKEN'];
    source['apiToken'] = 'env';
  } else if (rc['api_token']) {
    apiToken = rc['api_token'];
    source['apiToken'] = 'rc';
  }

  // Resolve companySubdomain: flags > env > rc
  let companySubdomain: string | undefined;
  if (flags.companySubdomain) {
    companySubdomain = flags.companySubdomain;
    source['companySubdomain'] = 'flags';
  } else if (process.env['BUKKU_COMPANY_SUBDOMAIN']) {
    companySubdomain = process.env['BUKKU_COMPANY_SUBDOMAIN'];
    source['companySubdomain'] = 'env';
  } else if (rc['company_subdomain']) {
    companySubdomain = rc['company_subdomain'];
    source['companySubdomain'] = 'rc';
  }

  // Check for missing fields
  const missing: string[] = [];
  if (!apiToken) missing.push('apiToken');
  if (!companySubdomain) missing.push('companySubdomain');

  if (missing.length > 0) {
    throw new AuthMissingError(missing);
  }

  return {
    apiToken: apiToken!,
    companySubdomain: companySubdomain!,
    source,
  };
}

/**
 * Mask an API token for display.
 * Shows first 4 + ... + last 4 chars if length >= 8, otherwise ****.
 */
export function maskToken(token: string): string {
  if (token.length >= 8) {
    return token.slice(0, 4) + '...' + token.slice(-4);
  }
  return '****';
}
