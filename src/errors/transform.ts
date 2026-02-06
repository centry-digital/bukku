/**
 * HTTP to MCP Error Transformation
 * Converts HTTP error responses into conversational MCP error messages
 */

export interface MCPErrorResponse {
  isError: true;
  content: Array<{ type: 'text'; text: string }>;
}

export function transformHttpError(
  status: number | null,
  body: unknown,
  operation: string
): MCPErrorResponse {
  throw new Error('Not implemented');
}

export function transformNetworkError(
  error: unknown,
  operation: string
): MCPErrorResponse {
  throw new Error('Not implemented');
}
