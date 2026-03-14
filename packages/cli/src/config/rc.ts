import { readFile, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

export const RC_PATH = join(homedir(), '.bukkurc');

/**
 * Read ~/.bukkurc INI-format file into a key-value record.
 * Returns empty object if file doesn't exist.
 */
export async function readRc(): Promise<Record<string, string>> {
  let content: string;
  try {
    content = await readFile(RC_PATH, 'utf-8');
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    throw err;
  }

  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

/**
 * Write a key-value pair to ~/.bukkurc.
 * Merges with existing content and sets 0o600 permissions.
 */
export async function writeRc(key: string, value: string): Promise<void> {
  const existing = await readRc();
  existing[key] = value;

  const lines = Object.entries(existing).map(([k, v]) => `${k} = ${v}`);
  await writeFile(RC_PATH, lines.join('\n') + '\n', { mode: 0o600 });
}

/**
 * Check that ~/.bukkurc has 0o600 permissions.
 * Returns ok=true if file doesn't exist or on Windows.
 */
export async function checkPermissions(): Promise<{ ok: boolean; mode: string }> {
  if (process.platform === 'win32') {
    return { ok: true, mode: '0600' };
  }

  try {
    const st = await stat(RC_PATH);
    const mode = st.mode & 0o777;
    const modeStr = '0' + mode.toString(8);
    return { ok: mode === 0o600, mode: modeStr };
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { ok: true, mode: '0000' };
    }
    throw err;
  }
}
