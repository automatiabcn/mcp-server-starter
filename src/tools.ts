/**
 * Example tools, a resource, and a prompt.
 *
 * This file is where you build your MCP server. Each tool is:
 *   1. registered with a name, description, and a Zod input schema, and
 *   2. backed by a handler that returns MCP content.
 *
 * Delete the examples and add your own — the pattern stays the same.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/** Small helper so every tool returns the same shape. */
function text(value: string) {
  return { content: [{ type: 'text' as const, text: value }] };
}

export function registerExampleTools(server: McpServer): void {
  // ── Tool 1: echo — the smallest possible tool ────────────────────────────
  server.registerTool(
    'echo',
    {
      title: 'Echo',
      description: 'Echo back the provided message. The "hello world" of MCP tools.',
      inputSchema: { message: z.string().describe('The message to echo back') },
    },
    async ({ message }) => text(message)
  );

  // ── Tool 2: word_count — shows real logic + a richer input schema ─────────
  server.registerTool(
    'word_count',
    {
      title: 'Word Count',
      description: 'Count words, characters, and lines in a block of text.',
      inputSchema: {
        text: z.string().describe('The text to analyze'),
        ignoreWhitespace: z
          .boolean()
          .default(false)
          .describe('If true, the character count excludes whitespace'),
      },
    },
    async ({ text: input, ignoreWhitespace }) => {
      const words = input.trim() ? input.trim().split(/\s+/).length : 0;
      const chars = ignoreWhitespace ? input.replace(/\s/g, '').length : input.length;
      const lines = input ? input.split(/\r\n|\r|\n/).length : 0;
      return text(
        JSON.stringify({ words, characters: chars, lines }, null, 2)
      );
    }
  );

  // ── Tool 3: roll_dice — shows non-deterministic output + validation ──────
  server.registerTool(
    'roll_dice',
    {
      title: 'Roll Dice',
      description: 'Roll N dice with S sides each and return the rolls and total.',
      inputSchema: {
        count: z.number().int().min(1).max(100).default(1).describe('Number of dice'),
        sides: z.number().int().min(2).max(1000).default(6).describe('Sides per die'),
      },
    },
    async ({ count, sides }) => {
      const rolls = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides));
      const total = rolls.reduce((a, b) => a + b, 0);
      return text(JSON.stringify({ rolls, total }, null, 2));
    }
  );

  // 👉 Add your own tool here. Copy the pattern above:
  //    server.registerTool('my_tool', { title, description, inputSchema }, handler)

  // ── Resource: expose read-only data at a URI ─────────────────────────────
  server.registerResource(
    'server-info',
    'info://server',
    {
      title: 'Server Info',
      description: 'Metadata about this MCP server.',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              name: 'mcp-server-starter',
              builtBy: 'Automatia BCN',
              docs: 'https://automatiabcn.com',
              tools: ['echo', 'word_count', 'roll_dice'],
            },
            null,
            2
          ),
        },
      ],
    })
  );

  // ── Prompt: a reusable, parameterized prompt template ────────────────────
  server.registerPrompt(
    'explain',
    {
      title: 'Explain',
      description: 'Ask the model to explain a topic at a chosen level.',
      argsSchema: {
        topic: z.string().describe('What to explain'),
        level: z
          .enum(['child', 'beginner', 'expert'])
          .default('beginner')
          .describe('Target audience level'),
      },
    },
    ({ topic, level }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Explain "${topic}" to a ${level}. Be clear, concrete, and concise.`,
          },
        },
      ],
    })
  );
}
