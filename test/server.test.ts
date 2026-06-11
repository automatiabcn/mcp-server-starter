/**
 * Integration tests: spin up the server in-memory, connect a client, and
 * exercise the example tools end-to-end. Run with `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { registerExampleTools } from '../src/tools.js';

async function connectedClient(): Promise<Client> {
  const server = new McpServer({ name: 'test', version: '0.0.0' });
  registerExampleTools(server);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  await client.connect(clientTransport);
  return client;
}

test('lists the three example tools', async () => {
  const client = await connectedClient();
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  assert.deepEqual(names, ['echo', 'roll_dice', 'word_count']);
});

test('echo returns the message', async () => {
  const client = await connectedClient();
  const res = await client.callTool({ name: 'echo', arguments: { message: 'hi there' } });
  assert.equal((res.content as any)[0].text, 'hi there');
});

test('word_count counts correctly', async () => {
  const client = await connectedClient();
  const res = await client.callTool({
    name: 'word_count',
    arguments: { text: 'one two three' },
  });
  const data = JSON.parse((res.content as any)[0].text);
  assert.equal(data.words, 3);
  assert.equal(data.characters, 13);
  assert.equal(data.lines, 1);
});

test('roll_dice stays within bounds', async () => {
  const client = await connectedClient();
  const res = await client.callTool({
    name: 'roll_dice',
    arguments: { count: 5, sides: 6 },
  });
  const data = JSON.parse((res.content as any)[0].text);
  assert.equal(data.rolls.length, 5);
  assert.ok(data.total >= 5 && data.total <= 30);
});

test('exposes the server-info resource', async () => {
  const client = await connectedClient();
  const { resources } = await client.listResources();
  assert.ok(resources.some((r) => r.uri === 'info://server'));
});

test('exposes the explain prompt', async () => {
  const client = await connectedClient();
  const { prompts } = await client.listPrompts();
  assert.ok(prompts.some((p) => p.name === 'explain'));
});
