import { Command } from 'commander';
import { readRc, writeRc, checkPermissions } from '../config/rc.js';
import { maskToken } from '../config/auth.js';

const VALID_KEYS = ['api_token', 'company_subdomain'] as const;
type ValidKey = (typeof VALID_KEYS)[number];

function isValidKey(key: string): key is ValidKey {
  return (VALID_KEYS as readonly string[]).includes(key);
}

export const configCommand = new Command('config')
  .description('Manage CLI configuration');

// config set <key> <value>
configCommand
  .command('set')
  .description('Set a config value')
  .argument('<key>', 'Config key (api_token, company_subdomain)')
  .argument('<value>', 'Config value')
  .action(async (key: string, value: string) => {
    if (!isValidKey(key)) {
      console.error(JSON.stringify({
        error: 'Invalid config key',
        code: 'VALIDATION_ERROR',
        details: { valid_keys: [...VALID_KEYS] },
      }));
      process.exit(4);
    }

    await writeRc(key, value);
    console.log(JSON.stringify({ ok: true, key, message: 'Config updated' }));

    const perms = await checkPermissions();
    if (!perms.ok) {
      console.error(`Warning: ~/.bukkurc has permissions ${perms.mode}, expected 0600. Run: chmod 600 ~/.bukkurc`);
    }
  });

// config show
configCommand
  .command('show')
  .description('Show resolved configuration')
  .action(async function (this: Command) {
    const rc = await readRc();

    // Resolve each field with precedence: flags > env > rc
    const parentOpts = this.parent?.parent?.opts<{
      apiToken?: string;
      companySubdomain?: string;
    }>() ?? {};

    const config: Record<string, { value: string | null; source: string }> = {};

    // api_token
    if (parentOpts.apiToken) {
      config['api_token'] = { value: maskToken(parentOpts.apiToken), source: 'flags' };
    } else if (process.env['BUKKU_API_TOKEN']) {
      config['api_token'] = { value: maskToken(process.env['BUKKU_API_TOKEN']), source: 'env' };
    } else if (rc['api_token']) {
      config['api_token'] = { value: maskToken(rc['api_token']), source: 'rc' };
    } else {
      config['api_token'] = { value: null, source: 'not set' };
    }

    // company_subdomain
    if (parentOpts.companySubdomain) {
      config['company_subdomain'] = { value: parentOpts.companySubdomain, source: 'flags' };
    } else if (process.env['BUKKU_COMPANY_SUBDOMAIN']) {
      config['company_subdomain'] = { value: process.env['BUKKU_COMPANY_SUBDOMAIN'], source: 'env' };
    } else if (rc['company_subdomain']) {
      config['company_subdomain'] = { value: rc['company_subdomain'], source: 'rc' };
    } else {
      config['company_subdomain'] = { value: null, source: 'not set' };
    }

    console.log(JSON.stringify({ config }));
  });
