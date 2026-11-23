#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Sai Akash Neela — https://github.com/SaiAkashNeela/cartoon-short-skill
// One-time sign-in: opens Google's consent page, receives the code on a localhost redirect, stores a refresh token.
//   npm run auth            (pick the Google account / brand account that owns the channel)
import http from 'node:http';
import { spawn } from 'node:child_process';
import { SCOPES, TOKEN_FILE, makeOAuth, saveToken } from './google.js';

const server = http.createServer();
server.listen(0, '127.0.0.1', () => {
  const redirect = `http://127.0.0.1:${server.address().port}/`;
  const oauth = makeOAuth(redirect);
  const url = oauth.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: SCOPES });
  console.log('\nOpen this URL to sign in (it should open automatically):\n\n' + url + '\n');
  const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
  try { spawn(opener, [url], { stdio: 'ignore', detached: true }).on('error', () => {}).unref(); } catch {}

  server.on('request', async (req, res) => {
    const q = new URL(req.url, redirect).searchParams;
    if (!q.get('code') && !q.get('error')) { res.writeHead(404); return res.end(); }
    if (q.get('error')) {
      res.end('Sign-in was cancelled. You can close this tab.'); console.error('Sign-in failed:', q.get('error')); server.close(); process.exitCode = 1; return;
    }
    try {
      const { tokens } = await oauth.getToken(q.get('code'));
      if (!tokens.refresh_token) console.warn('Warning: Google returned no refresh token; remove the app at https://myaccount.google.com/permissions and run this again.');
      saveToken(tokens);
      res.end('Signed in. You can close this tab and go back to the terminal.');
      console.log(`Saved credentials to ${TOKEN_FILE} (readable only by you). The MCP server is ready.`);
    } catch (e) {
      res.end('Sign-in failed, see the terminal.'); console.error('Token exchange failed:', e.message); process.exitCode = 1;
    }
    server.close();
  });
});
