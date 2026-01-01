#!/usr/bin/env bun
/**
 * Apple MCP Tools Server
 *
 * An MCP server providing access to Apple apps:
 * - Contacts: Search and retrieve contacts
 * - Notes: Search, list, and create notes
 * - Messages: Send, read, schedule messages
 * - Mail: Read, search, and send emails
 * - Reminders: Search, create, and manage reminders
 * - Calendar: Search, list, and create events
 * - Maps: Search locations, get directions
 * - Safari: Bookmarks, reading list, tabs
 * - Photos: Search, list albums, get recent photos
 *
 * @version 2.0.0
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();

  // Filter stdout to ensure only JSON messages pass through
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: string | Uint8Array, ...rest: unknown[]): boolean => {
    const str = chunk.toString();

    // Only allow JSON-RPC messages through stdout
    if (str.trim().startsWith('{') && str.includes('"jsonrpc"')) {
      return originalStdoutWrite(chunk, ...rest as [BufferEncoding?, ((err?: Error | null) => void)?]);
    }

    // Redirect non-JSON output to stderr for debugging
    if (str.trim()) {
      process.stderr.write(str);
    }

    return true;
  }) as typeof process.stdout.write;

  await server.connect(transport);

  console.error('Apple MCP Server v2.0.0 started');
  console.error(`Available tools: contacts, notes, messages, mail, reminders, calendar, maps, safari, photos`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
