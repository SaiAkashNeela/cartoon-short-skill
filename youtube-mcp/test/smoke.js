// SPDX-License-Identifier: MIT — Copyright (c) 2026 Sai Akash Neela — https://github.com/SaiAkashNeela/cartoon-short-skill
// Smoke test without Google credentials: the server starts, lists its tools, and a tool call fails with a helpful message.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import os from 'node:os'; import path from 'node:path'; import fs from 'node:fs';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ytmcp-'));   // empty config dir: no client secret, no token
const client = new Client({ name: 'smoke', version: '0' });
await client.connect(new StdioClientTransport({ command: 'node', args: ['src/server.js'], env: { ...process.env, YOUTUBE_MCP_DIR: dir } }));
const { tools } = await client.listTools();
console.log(`${tools.length} tools:`, tools.map((t) => t.name).join(', '));
const r = await client.callTool({ name: 'channel_info', arguments: {} });
console.log('channel_info without credentials ->', r.isError ? 'error (expected):' : 'UNEXPECTED SUCCESS', r.content[0].text.slice(0, 140));
const u = await client.callTool({ name: 'upload_video', arguments: { file: '/nope.mp4', title: 't' } });
console.log('upload_video with a bad path ->', u.isError ? 'error (expected):' : 'UNEXPECTED', u.content[0].text.slice(0, 100));
await client.close(); fs.rmSync(dir, { recursive: true });
if (tools.length < 13 || !r.isError || !u.isError) process.exit(1);
