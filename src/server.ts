import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { ZodError } from 'zod';

import { tools, handlers } from './tools/index.js';

export function createServer() {
  const server = new Server(
    {
      name: 'Apple MCP Tools',
      version: '2.0.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  // Register list tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // Register call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const handler = handlers[name];

    if (!handler) {
      return {
        content: [{
          type: 'text' as const,
          text: `Unknown tool: ${name}. Available tools: ${Object.keys(handlers).join(', ')}`
        }],
        isError: true
      };
    }

    try {
      return await handler(args);
    } catch (error) {
      // Handle Zod validation errors specially
      if (error instanceof ZodError) {
        const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
        return {
          content: [{
            type: 'text' as const,
            text: `Invalid arguments for ${name}: ${issues}`
          }],
          isError: true
        };
      }

      // Log detailed error to stderr for debugging, return sanitized message to client
      console.error(`Error executing ${name}:`, error);
      return {
        content: [{
          type: 'text' as const,
          text: `Error executing ${name}. Please check the tool arguments and try again.`
        }],
        isError: true
      };
    }
  });

  return server;
}
