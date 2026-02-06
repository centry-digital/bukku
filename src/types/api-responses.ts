/**
 * Shared API Response Type Helpers
 *
 * These types wrap Bukku API responses and MCP tool result formats
 */

/**
 * Generic API response type for successful Bukku API calls
 * Used throughout the codebase to type-check API responses
 */
export type BukkuApiResponse<T> = T;

/**
 * MCP Tool Result format
 * All MCP tool handlers must return this structure
 */
export interface ToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}
