#!/usr/bin/env node
// Minimal MCP client for verification: spawns the built server over stdio.
// Usage: mcp-call.mjs <server-entry> list
//        mcp-call.mjs <server-entry> call <tool-name> ['<json-args>']
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const [entry, action, toolName, rawArgs] = process.argv.slice(2);
if (!entry || !["list", "call"].includes(action) || (action === "call" && !toolName)) {
  console.error("usage: mcp-call.mjs <server-entry> list | call <tool-name> [json-args]");
  process.exit(64);
}

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [entry],
  env: process.env,
  stderr: "inherit",
});
const client = new Client({ name: "verify-bukku", version: "0.0.0" });

try {
  await client.connect(transport);
  if (action === "list") {
    const { tools } = await client.listTools();
    console.log(JSON.stringify({ count: tools.length, names: tools.map((t) => t.name) }, null, 2));
  } else {
    const result = await client.callTool({
      name: toolName,
      arguments: rawArgs ? JSON.parse(rawArgs) : {},
    });
    console.log(JSON.stringify(result, null, 2));
    if (result.isError) process.exitCode = 1;
  }
} catch (err) {
  console.error(`mcp-call: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 2;
} finally {
  await client.close().catch(() => {});
}
