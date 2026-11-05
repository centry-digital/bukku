import { describe, test, afterEach } from "node:test";
import assert from "node:assert";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BukkuClient, allEntityConfigs, contactConfig, salesQuoteConfig } from "core";
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
  const tools = new Map<
    string,
    { description: string; schema: Record<string, unknown>; handler: Handler }
  >();
  (server as unknown as { tool: (...args: unknown[]) => void }).tool = (...args: unknown[]) => {
    tools.set(args[0] as string, {
      description: args[1] as string,
      schema: args[2] as Record<string, unknown>,
      handler: args[3] as Handler,
    });
  };
  registerCrudTools(server, client, config);
  return tools;
}

describe("CRUD factory write validation", () => {
  test("create-sales-quote refuses term_id with term_items before calling the API", async () => {
    const tool = collectTools(salesQuoteConfig).get("create-sales-quote")!;
    const result = await tool.handler({
      data: { contact_id: 1, term_id: 3, term_items: [{ term_id: 3, payment_due: "100%" }] },
    });
    assert.strictEqual(result.isError, true);
    assert.match(result.content[0]!.text, /not both/);
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

describe("CRUD factory tag filter", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  test("list-sales-quotes sends tag_ids as repeated tag_ids[] parameters", async () => {
    const urls: string[] = [];
    globalThis.fetch = (async (input: string | URL | Request) => {
      urls.push(String(input));
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    const tool = collectTools(salesQuoteConfig).get("list-sales-quotes")!;
    const result = await tool.handler({ tag_ids: [3, 5], page: 1 });
    assert.notStrictEqual(result.isError, true);
    const url = new URL(urls[0]!);
    assert.strictEqual(url.pathname, "/sales/quotes");
    assert.deepStrictEqual(url.searchParams.getAll("tag_ids[]"), ["3", "5"]);
    assert.strictEqual(url.searchParams.get("page"), "1");
  });

  test("tag_ids is offered on the 13 sales and purchase transaction lists only", () => {
    const withTags = allEntityConfigs
      .filter((c) => "tag_ids" in (collectTools(c).get(`list-${c.entity}s`)?.schema ?? {}))
      .map((c) => c.entity)
      .sort();
    assert.deepStrictEqual(withTags, [
      "delivery-order",
      "goods-received-note",
      "purchase-bill",
      "purchase-credit-note",
      "purchase-order",
      "purchase-payment",
      "purchase-refund",
      "sales-credit-note",
      "sales-invoice",
      "sales-order",
      "sales-payment",
      "sales-quote",
      "sales-refund",
    ]);
    assert.strictEqual(
      "tag_ids" in collectTools(contactConfig).get("list-contacts")!.schema,
      false,
    );
  });
});
