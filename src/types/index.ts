/**
 * Common types used across the Apple MCP Tools
 */

export interface ToolResponse {
  content: Array<{ type: 'text'; text: string }>;
  isError: boolean;
}

export interface SuccessResult {
  success: boolean;
  message: string;
}
