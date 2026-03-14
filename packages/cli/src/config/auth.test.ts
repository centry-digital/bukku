import { describe, test, afterEach } from 'node:test';
import assert from 'node:assert';
import { resolveAuth, maskToken, AuthMissingError } from './auth.js';

describe('resolveAuth', () => {
  const savedEnv: Record<string, string | undefined> = {};

  afterEach(() => {
    // Restore env vars
    for (const key of ['BUKKU_API_TOKEN', 'BUKKU_COMPANY_SUBDOMAIN']) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
  });

  function saveAndClearEnv() {
    for (const key of ['BUKKU_API_TOKEN', 'BUKKU_COMPANY_SUBDOMAIN']) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  }

  test('flags override everything', async () => {
    saveAndClearEnv();
    process.env['BUKKU_API_TOKEN'] = 'env_token';
    process.env['BUKKU_COMPANY_SUBDOMAIN'] = 'env_sub';

    const auth = await resolveAuth({
      apiToken: 'flag_token',
      companySubdomain: 'flag_sub',
    });

    assert.strictEqual(auth.apiToken, 'flag_token');
    assert.strictEqual(auth.companySubdomain, 'flag_sub');
    assert.strictEqual(auth.source['apiToken'], 'flags');
    assert.strictEqual(auth.source['companySubdomain'], 'flags');
  });

  test('env vars used when no flags', async () => {
    saveAndClearEnv();
    process.env['BUKKU_API_TOKEN'] = 'env_token';
    process.env['BUKKU_COMPANY_SUBDOMAIN'] = 'env_sub';

    const auth = await resolveAuth({});

    assert.strictEqual(auth.apiToken, 'env_token');
    assert.strictEqual(auth.companySubdomain, 'env_sub');
    assert.strictEqual(auth.source['apiToken'], 'env');
    assert.strictEqual(auth.source['companySubdomain'], 'env');
  });

  test('throws AuthMissingError with code AUTH_MISSING when nothing set', async () => {
    saveAndClearEnv();

    try {
      await resolveAuth({});
      assert.fail('Should have thrown');
    } catch (err) {
      assert.ok(err instanceof AuthMissingError);
      assert.strictEqual(err.code, 'AUTH_MISSING');
      assert.ok(err.missingFields.includes('apiToken'));
      assert.ok(err.missingFields.includes('companySubdomain'));
    }
  });

  test('throws when only apiToken is missing', async () => {
    saveAndClearEnv();
    process.env['BUKKU_COMPANY_SUBDOMAIN'] = 'env_sub';

    try {
      await resolveAuth({});
      assert.fail('Should have thrown');
    } catch (err) {
      assert.ok(err instanceof AuthMissingError);
      assert.ok(err.missingFields.includes('apiToken'));
      assert.ok(!err.missingFields.includes('companySubdomain'));
    }
  });
});

describe('maskToken', () => {
  test('masks long token showing first 4 and last 4', () => {
    assert.strictEqual(maskToken('bk_abcd1234efgh'), 'bk_a...efgh');
  });

  test('masks short token completely', () => {
    assert.strictEqual(maskToken('short'), '****');
  });

  test('masks 8-char token showing first 4 and last 4', () => {
    assert.strictEqual(maskToken('12345678'), '1234...5678');
  });
});
