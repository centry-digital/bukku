import { describe, test, afterEach } from 'node:test';
import assert from 'node:assert';
import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const execFile = promisify(execFileCb);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use built JS for integration tests (source uses .js imports for Node16 module resolution)
const CLI_ENTRY = join(__dirname, '..', '..', 'build', 'index.js');
const PKG = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf-8'),
) as { version: string };

interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

async function runCli(...args: string[]): Promise<RunResult> {
  try {
    const { stdout, stderr } = await execFile(
      'node',
      [CLI_ENTRY, ...args],
      {
        timeout: 10_000,
        env: {
          ...process.env,
          // Clear auth env vars to avoid interference
          BUKKU_API_TOKEN: '',
          BUKKU_COMPANY_SUBDOMAIN: '',
        },
      },
    );
    return { stdout, stderr, exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: e.stdout || '',
      stderr: e.stderr || '',
      exitCode: e.code || 1,
    };
  }
}

describe('CLI integration', () => {
  test('bukku --version outputs version from package.json', async () => {
    const result = await runCli('--version');
    assert.ok(
      result.stdout.trim().includes(PKG.version),
      `Expected version ${PKG.version} in stdout: ${result.stdout}`,
    );
    assert.strictEqual(result.exitCode, 0);
  });

  test('bukku --help lists all command groups', async () => {
    const result = await runCli('--help');
    const output = result.stdout;
    for (const group of [
      'sales',
      'purchases',
      'banking',
      'contacts',
      'products',
      'accounting',
      'files',
      'settings',
      'config',
    ]) {
      assert.ok(output.includes(group), `Expected "${group}" in help output`);
    }
    assert.strictEqual(result.exitCode, 0);
  });

  test('bukku sales --help contains sales description', async () => {
    const result = await runCli('sales', '--help');
    assert.ok(
      result.stdout.includes('Sales') || result.stdout.includes('sales') || result.stdout.includes('invoices'),
      `Expected sales description in output: ${result.stdout}`,
    );
    assert.strictEqual(result.exitCode, 0);
  });

  test('bukku config set with invalid key exits non-zero', async () => {
    const result = await runCli('config', 'set', 'invalid_key', 'some_value');
    assert.ok(result.exitCode !== 0, `Expected non-zero exit code, got ${result.exitCode}`);
    assert.ok(
      result.stderr.includes('VALIDATION_ERROR'),
      `Expected VALIDATION_ERROR in stderr: ${result.stderr}`,
    );
  });

  describe('bukku config set with valid key', () => {
    let tempHome: string;

    afterEach(async () => {
      if (tempHome) {
        await rm(tempHome, { recursive: true, force: true });
      }
    });

    test('config set api_token with temp HOME succeeds', async () => {
      tempHome = await mkdtemp(join(tmpdir(), 'bukku-cli-test-'));

      try {
        const { stdout, stderr } = await execFile(
          'node',
          [CLI_ENTRY, 'config', 'set', 'api_token', 'test_token_123'],
          {
            timeout: 10_000,
            env: {
              ...process.env,
              HOME: tempHome,
              BUKKU_API_TOKEN: '',
              BUKKU_COMPANY_SUBDOMAIN: '',
            },
          },
        );
        const parsed = JSON.parse(stdout);
        assert.strictEqual(parsed.ok, true);
        assert.strictEqual(parsed.key, 'api_token');
      } catch (err: unknown) {
        const e = err as { stdout?: string; stderr?: string; code?: number };
        assert.fail(
          `config set failed with code ${e.code}: stdout=${e.stdout} stderr=${e.stderr}`,
        );
      }
    });
  });
});
