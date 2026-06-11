<div align="center">

# MCP Server Starter

**A minimal, production-ready [Model Context Protocol](https://modelcontextprotocol.io) server template in TypeScript.**

Clone it, add your tools, and ship an MCP server your AI assistant can use — in minutes.

[![CI](https://github.com/enzoemir1/mcp-server-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/enzoemir1/mcp-server-starter/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-compatible-7c3aed.svg)](https://modelcontextprotocol.io)

By [Automatia BCN](https://automatiabcn.com) · Barcelona

</div>

---

## Why this template

Most MCP examples are either toy snippets or buried inside a framework. This is the in-between you actually want to start a real server:

- ✅ **Typed tools** with [Zod](https://zod.dev) input schemas — validation for free
- ✅ **Two transports** — `stdio` (Claude Desktop / Cursor / Windsurf / VS Code) and **StreamableHTTP** (remote / serverless)
- ✅ **Tool + Resource + Prompt** examples — the three MCP primitives, done right
- ✅ **Real tests** — in-memory client↔server integration tests with `node:test`
- ✅ **CI** across Node 18/20/22, MIT licensed, zero bloat

## Quick start

```bash
git clone https://github.com/enzoemir1/mcp-server-starter.git
cd mcp-server-starter
npm install
npm run build
npm start          # runs on stdio
```

Run it over HTTP instead:

```bash
npm run start:http   # POST JSON-RPC to http://localhost:3000/mcp
```

Inspect it visually with the official MCP Inspector:

```bash
npm run inspect
```

## Use it with Claude Desktop / Cursor

Add this to your client's MCP config (e.g. `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "starter": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server-starter/dist/index.js"]
    }
  }
}
```

Restart the client and your tools (`echo`, `word_count`, `roll_dice`) appear.

## Add your own tool

Open [`src/tools.ts`](src/tools.ts) and copy the pattern:

```ts
server.registerTool(
  'my_tool',
  {
    title: 'My Tool',
    description: 'What it does (the model reads this to decide when to call it).',
    inputSchema: { name: z.string().describe('Who to greet') },
  },
  async ({ name }) => ({
    content: [{ type: 'text', text: `Hello, ${name}!` }],
  })
);
```

That's it — the Zod schema becomes the tool's JSON Schema automatically, inputs are validated before your handler runs, and the tool shows up in any MCP client.

## Project layout

```
src/
  index.ts    # entry point — stdio + StreamableHTTP transports
  tools.ts    # your tools, resources, and prompts (start here)
test/
  server.test.ts  # in-memory integration tests
```

## Scripts

| Script | What it does |
|--------|--------------|
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run the server on stdio |
| `npm run start:http` | Run the server on HTTP (`PORT`, default 3000) |
| `npm test` | Run the integration tests |
| `npm run inspect` | Open the MCP Inspector |

## Built something real?

This starter is the on-ramp. When you need MCP servers that are already built, tested, and registry-published, Automatia BCN ships production ones:

- **[LeadPipe MCP](https://github.com/enzoemir1/leadpipe-mcp)** — lead qualification: ingest → enrich → score → export to your CRM
- **[InvoiceFlow MCP](https://github.com/enzoemir1/invoiceflow-mcp)** — invoicing: PDF invoices, late-payment risk, reminders, cash flow
- **[ShopOps MCP](https://github.com/enzoemir1/shopops-mcp)** — e-commerce ops: inventory forecasting, pricing, RFM, anomaly detection
- **[AdOps MCP](https://github.com/enzoemir1/adops-mcp)** — ad analytics: Google & Meta Ads reporting, budget optimization, A/B testing

More at **[automatiabcn.com](https://automatiabcn.com)** — *Automate the chaos.*

## License

MIT © [Automatia BCN](https://automatiabcn.com)
