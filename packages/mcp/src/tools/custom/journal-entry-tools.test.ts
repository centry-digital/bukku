import { describe, test } from "node:test";
import assert from "node:assert";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BukkuClient } from "core";
import { registerJournalEntryTools } from "./journal-entry-tools.js";

type ToolResult = { isError?: boolean; content: { type: string; text: string }[] };
type Handler = (params: Record<string, unknown>) => Promise<ToolResult>;

/**
 * Registers the journal entry tools against a stub client that records every request, so
 * the tests can prove a refused entry never reaches the API.
 */
function collectTools() {
  const server = new McpServer({ name: "bukku-test", version: "0.0.0" });
  const calls: { method: string; path: string; body: unknown }[] = [];
  const client = {
    post: async (path: string, body: unknown) => {
      calls.push({ method: "POST", path, body });
      return { transaction: { id: 1 } };
    },
    put: async (path: string, body: unknown) => {
      calls.push({ method: "PUT", path, body });
      return { transaction: { id: 1 } };
    },
  } as unknown as BukkuClient;
  const handlers = new Map<string, Handler>();
  (server as unknown as { tool: (...args: unknown[]) => void }).tool = (...args: unknown[]) => {
    handlers.set(args[0] as string, args[3] as Handler);
  };
  registerJournalEntryTools(server, client);
  return { handlers, calls };
}

const unbalanced = [
  { account_id: 1, debit_amount: 100 },
  { account_id: 2, credit_amount: 90 },
];
const balanced = [
  { account_id: 1, debit_amount: 100 },
  { account_id: 2, credit_amount: 100 },
];

describe("MCP journal entry tools", () => {
  test("create-journal-entry refuses an unbalanced entry before calling the API", async () => {
    const { handlers, calls } = collectTools();
    const result = await handlers.get("create-journal-entry")!({
      data: { date: "2026-10-22", journal_items: unbalanced },
    });
    assert.strictEqual(result.isError, true);
    assert.match(result.content[0]!.text, /100\.00.*90\.00.*10\.00/);
    assert.strictEqual(calls.length, 0);
  });

  test("create-journal-entry refuses a single line before calling the API", async () => {
    const { handlers, calls } = collectTools();
    const result = await handlers.get("create-journal-entry")!({
      data: { date: "2026-10-22", journal_items: [{ account_id: 1, debit_amount: 0 }] },
    });
    assert.strictEqual(result.isError, true);
    assert.match(result.content[0]!.text, /at least 2 line items/);
    assert.strictEqual(calls.length, 0);
  });

  test("create-journal-entry sends a balanced entry unchanged", async () => {
    const { handlers, calls } = collectTools();
    const data = { date: "2026-10-22", journal_items: balanced };
    const result = await handlers.get("create-journal-entry")!({ data });
    assert.notStrictEqual(result.isError, true);
    assert.deepStrictEqual(calls, [{ method: "POST", path: "/journal_entries", body: data }]);
  });

  test("update-journal-entry refuses unbalanced line items before calling the API", async () => {
    const { handlers, calls } = collectTools();
    const result = await handlers.get("update-journal-entry")!({
      id: 5,
      data: { journal_items: unbalanced },
    });
    assert.strictEqual(result.isError, true);
    assert.strictEqual(calls.length, 0);
  });

  test("update-journal-entry passes an update without line items through", async () => {
    const { handlers, calls } = collectTools();
    const result = await handlers.get("update-journal-entry")!({
      id: 5,
      data: { description: "Corrected memo" },
    });
    assert.notStrictEqual(result.isError, true);
    assert.deepStrictEqual(calls, [
      { method: "PUT", path: "/journal_entries/5", body: { description: "Corrected memo" } },
    ]);
  });
});
