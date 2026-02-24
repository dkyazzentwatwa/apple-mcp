import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../../src/server.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

describe('MCP Server', () => {
  let client: Client;
  let server: ReturnType<typeof createServer>;

  beforeAll(async () => {
    server = createServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    client = new Client({ name: 'test', version: '0.1' });

    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport)
    ]);
  });

  afterAll(async () => {
    await client.close();
    await server.close();
  });

  it('should register all 10 tools', async () => {
    const { tools } = await client.listTools();
    expect(tools.length).toBe(10);
  });

  it('should register the expected tool names', async () => {
    const { tools } = await client.listTools();
    const names = tools.map(t => t.name).sort();
    expect(names).toEqual([
      'calendar',
      'contacts',
      'mail',
      'maps',
      'messages',
      'notes',
      'numbers',
      'photos',
      'reminders',
      'safari',
    ]);
  });

  it('should return an error for unknown tools', async () => {
    const result = await client.callTool({ name: 'nonexistent', arguments: {} });
    expect(result.isError).toBe(true);
  });

  it('should return a validation error for invalid arguments', async () => {
    const result = await client.callTool({
      name: 'mail',
      arguments: { operation: 'send' } // missing required fields
    });
    expect(result.isError).toBe(true);
  });
});
