#!/usr/bin/env node
/**
 * mcp-server-starter — a minimal, production-ready MCP server.
 *
 * Transports:
 *   - stdio (default)   → for Claude Desktop, Cursor, Windsurf, VS Code, etc.
 *   - StreamableHTTP    → set MCP_TRANSPORT=http (PORT defaults to 3000)
 *
 * Built by Automatia BCN — https://automatiabcn.com
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from 'node:http';
import { registerExampleTools } from './tools.js';

const SERVER_NAME = 'mcp-server-starter';
const SERVER_VERSION = '1.0.0';

function buildServer(): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });
  registerExampleTools(server);
  return server;
}

async function runStdio(): Promise<void> {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdout is reserved for the protocol; log to stderr.
  console.error(`${SERVER_NAME} v${SERVER_VERSION} running on stdio`);
}

async function runHttp(): Promise<void> {
  const port = Number(process.env.PORT) || 3000;

  const httpServer = createServer(async (req, res) => {
    if (req.url !== '/mcp') {
      res.writeHead(404).end('Not found. POST to /mcp');
      return;
    }
    // Stateless mode: a fresh server + transport per request. Simple and
    // horizontally scalable. For sessions, pass a sessionIdGenerator instead.
    try {
      const server = buildServer();
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      res.on('close', () => {
        transport.close();
        server.close();
      });
      await server.connect(transport);

      // Bound the request body so an unbounded/malicious payload can't exhaust
      // memory. 4 MiB is generous for JSON-RPC; raise it if your tools need it.
      const MAX_BODY_BYTES = 4 * 1024 * 1024;
      let body = '';
      let size = 0;
      for await (const chunk of req) {
        size += (chunk as Buffer).length;
        if (size > MAX_BODY_BYTES) {
          res.writeHead(413).end('Payload too large');
          return;
        }
        body += chunk;
      }
      await transport.handleRequest(req, res, body ? JSON.parse(body) : undefined);
    } catch (err) {
      console.error('Request error:', err);
      if (!res.headersSent) res.writeHead(500).end('Internal server error');
    }
  });

  httpServer.listen(port, () => {
    console.error(`${SERVER_NAME} v${SERVER_VERSION} listening on http://localhost:${port}/mcp`);
  });
}

const transport = (process.env.MCP_TRANSPORT || 'stdio').toLowerCase();
const run = transport === 'http' ? runHttp : runStdio;

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
