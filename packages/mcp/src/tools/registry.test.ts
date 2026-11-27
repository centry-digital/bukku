import { describe, test } from "node:test";
import assert from "node:assert";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BukkuClient } from "core";
import { registerAllTools } from "./registry.js";

/**
 * Registers every tool against a real McpServer (no network calls are made
 * until a tool is invoked) and records the names passed to server.tool().
 */
function registerAndCollect(options: { readOnly?: boolean } = {}): {
  count: number;
  names: string[];
} {
  const server = new McpServer({ name: "bukku-test", version: "0.0.0" });
  const client = new BukkuClient({ apiToken: "test-token", companySubdomain: "test" });

  const names: string[] = [];
  const originalTool = server.tool.bind(server) as (...args: unknown[]) => unknown;
  (server as unknown as { tool: (...args: unknown[]) => unknown }).tool = (...args: unknown[]) => {
    names.push(args[0] as string);
    return originalTool(...args);
  };

  const count = registerAllTools(server, client, options);
  return { count, names };
}

describe("registerAllTools", () => {
  test("returned count matches the number of tools actually registered", () => {
    const { count, names } = registerAndCollect();
    assert.strictEqual(count, names.length);
  });

  test("registers a non-trivial number of tools", () => {
    const { count } = registerAndCollect();
    assert.ok(count > 100, `Expected over 100 tools, got ${count}`);
  });

  test("tool names are unique", () => {
    const { names } = registerAndCollect();
    const duplicates = names.filter((name, i) => names.indexOf(name) !== i);
    assert.deepStrictEqual(duplicates, []);
  });

  test("tool names are kebab-case", () => {
    const { names } = registerAndCollect();
    const invalid = names.filter((name) => !/^[a-z]+(-[a-z]+)*$/.test(name));
    assert.deepStrictEqual(invalid, []);
  });
});

describe("registerAllTools in read-only mode", () => {
  test("registers only list, get and search tools", () => {
    const { names } = registerAndCollect({ readOnly: true });
    const writes = names.filter((name) => !/^(list|get|search)-/.test(name));
    assert.deepStrictEqual(writes, []);
  });

  test("keeps every read tool of the full set", () => {
    const full = registerAndCollect().names.filter((name) => /^(list|get|search)-/.test(name));
    const { names } = registerAndCollect({ readOnly: true });
    assert.deepStrictEqual([...names].sort(), [...full].sort());
  });

  test("returned count matches the tools actually kept", () => {
    const { count, names } = registerAndCollect({ readOnly: true });
    assert.strictEqual(count, names.length);
    assert.ok(names.includes("list-sales-invoices"));
    assert.ok(names.includes("search-accounts"));
    assert.ok(!names.includes("create-sales-invoice"));
    assert.ok(!names.includes("upload-file"));
  });
});
