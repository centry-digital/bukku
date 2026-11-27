import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";

/**
 * The CLI and the MCP server are released together under one version (from
 * 2.2.2), so a release tag vX.Y.Z always means the same version of both.
 */
function version(pkg: string): string {
  const url = new URL(`../packages/${pkg}/package.json`, import.meta.url);
  return (JSON.parse(readFileSync(url, "utf-8")) as { version: string }).version;
}

test("bukku-cli and bukku-mcp have the same version", () => {
  assert.strictEqual(version("cli"), version("mcp"));
});
