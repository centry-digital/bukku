import { describe, test } from "node:test";
import assert from "node:assert";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BukkuClient, contactConfig, salesQuoteConfig } from "core";
import type { CrudEntityConfig } from "core";
import { registerCrudTools } from "./factory.js";

type ToolResult = { isError?: boolean; content: { type: string; text: string }[] };
type Handler = (params: Record<string, unknown>) => Promise<ToolResult>;

/**
 * Registers an entity's CRUD tools and records each tool's description and
 * handler. The client points at a dummy company; the tests below only call
 * handlers on paths that return before a request is sent.
 */
function collectTools(config: CrudEntityConfig) {
  const server = new McpServer({ name: "bukku-test", version: "0.0.0" });
  const client = new BukkuClient({ apiToken: "test-token", companySubdomain: "test" });
  const tools = new Map<string, { description: string; handler: Handler }>();
  (server as unknown as { tool: (...args: unknown[]) => void }).tool = (...args: unknown[]) => {
    tools.set(args[0] as string, {
      description: args[1] as string,
      handler: args[3] as Handler,
    });
  };
  registerCrudTools(server, client, config);
  return tools;
}

describe("CRUD factory write validation", () => {
  test("create-sales-quote refuses a top-level term_id before calling the API", async () => {
    const tool = collectTools(salesQuoteConfig).get("create-sales-quote")!;
    const result = await tool.handler({ data: { contact_id: 1, term_id: 3 } });
    assert.strictEqual(result.isError, true);
    assert.match(result.content[0]!.text, /term_items/);
  });

  test("update-contact refuses a body without contact_code", async () => {
    const tool = collectTools(contactConfig).get("update-contact")!;
    const result = await tool.handler({ id: 7, data: { legal_name: "Acme Sdn Bhd" } });
    assert.strictEqual(result.isError, true);
    assert.match(result.content[0]!.text, /contact_code is required/);
  });

  test("create and update descriptions carry the write rules", () => {
    const quoteTools = collectTools(salesQuoteConfig);
    assert.match(quoteTools.get("create-sales-quote")!.description, /term_items/);
    assert.match(quoteTools.get("update-sales-quote")!.description, /term_items/);
    assert.match(collectTools(contactConfig).get("create-contact")!.description, /contact_code/);
  });
});
