import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Read-only mode
 *
 * With BUKKU_READ_ONLY=true the server registers only the tools that read
 * from Bukku: every `list-*`, `get-*` and `search-*` tool. Everything that
 * creates, updates, deletes, archives, changes a status or uploads a file is
 * left out, so the AI client never sees it and cannot call it.
 */

const READ_PREFIXES = ["list-", "get-", "search-"];

/** True if the tool only reads from Bukku. */
export function isReadTool(name: string): boolean {
  return READ_PREFIXES.some((prefix) => name.startsWith(prefix));
}

/**
 * Wrap a server so that `tool()` silently skips every tool that writes.
 * Returns the wrapped server and a counter of the tools it actually kept.
 */
export function readOnlyServer(server: McpServer): { server: McpServer; registered: () => number } {
  let kept = 0;
  const wrapped = new Proxy(server, {
    get(target, prop, receiver) {
      if (prop === "tool") {
        return (...args: unknown[]) => {
          if (!isReadTool(args[0] as string)) return undefined;
          kept++;
          return (target.tool as (...a: unknown[]) => unknown).apply(target, args);
        };
      }
      return Reflect.get(target, prop, receiver) as unknown;
    },
  });
  return { server: wrapped, registered: () => kept };
}
