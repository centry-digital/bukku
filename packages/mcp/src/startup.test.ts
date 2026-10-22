import { describe, test } from "node:test";
import assert from "node:assert";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const execFile = promisify(execFileCb);

// Smoke-tests the bundled server, so run `npm run build` first
const MCP_ENTRY = join(dirname(fileURLToPath(import.meta.url)), "..", "build", "index.js");

describe("MCP server startup", () => {
  test("exits with code 1 and a setup checklist when env vars are missing", async () => {
    const result = await execFile("node", [MCP_ENTRY], {
      timeout: 10_000,
      env: { ...process.env, BUKKU_API_TOKEN: "", BUKKU_COMPANY_SUBDOMAIN: "" },
    }).then(
      () => ({ code: 0, stderr: "" }),
      (err: { code?: number; stderr?: string }) => ({
        code: err.code ?? 1,
        stderr: err.stderr ?? "",
      }),
    );

    assert.strictEqual(result.code, 1);
    assert.match(result.stderr, /BUKKU_API_TOKEN/);
    assert.match(result.stderr, /BUKKU_COMPANY_SUBDOMAIN/);
  });
});
