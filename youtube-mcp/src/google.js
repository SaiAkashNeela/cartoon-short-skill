// SPDX-License-Identifier: MIT — Copyright (c) 2026 Sai Akash Neela — https://github.com/SaiAkashNeela/cartoon-short-skill
// OAuth client + token storage shared by the server and the one-time `auth` command.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { google } from 'googleapis';

export const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',          // upload videos
  'https://www.googleapis.com/auth/youtube',                 // manage videos, playlists, thumbnails, channel branding
  'https://www.googleapis.com/auth/youtube.force-ssl',       // read and reply to comments
  'https://www.googleapis.com/auth/yt-analytics.readonly'    // analytics reports
];

// Where credentials live: $YOUTUBE_MCP_DIR, else ~/.config/youtube-studio-mcp
export const CONFIG_DIR = process.env.YOUTUBE_MCP_DIR || path.join(os.homedir(), '.config', 'youtube-studio-mcp');
export const CLIENT_FILE = path.join(CONFIG_DIR, 'client_secret.json');
export const TOKEN_FILE = path.join(CONFIG_DIR, 'token.json');

export function loadClientConfig() {
  if (!fs.existsSync(CLIENT_FILE)) {
    throw new Error(`No OAuth client found at ${CLIENT_FILE}. Create a "Desktop app" OAuth client in Google Cloud ` +
      `(see youtube-mcp/README.md), download its JSON and save it there.`);
  }
  const raw = JSON.parse(fs.readFileSync(CLIENT_FILE, 'utf8'));
  const c = raw.installed || raw.web;
  if (!c || !c.client_id || !c.client_secret) throw new Error(`${CLIENT_FILE} is not an OAuth client JSON (expected an "installed" block).`);
  return c;
}

export function makeOAuth(redirectUri) {
  const c = loadClientConfig();
  return new google.auth.OAuth2(c.client_id, c.client_secret, redirectUri);
}

export function saveToken(token) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  const prev = fs.existsSync(TOKEN_FILE) ? JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8')) : {};
  // Google only returns a refresh_token on first consent; keep the old one when a refresh omits it
  fs.writeFileSync(TOKEN_FILE, JSON.stringify({ ...prev, ...token }, null, 2), { mode: 0o600 });
}

let cached;
export function getClients() {
  if (cached) return cached;
  const auth = makeOAuth();
  if (!fs.existsSync(TOKEN_FILE)) throw new Error('Not signed in yet. Run `npm run auth` in youtube-mcp/ once to sign in with Google.');
  auth.setCredentials(JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8')));
  auth.on('tokens', (t) => saveToken(t));   // persist refreshed access tokens
  cached = { auth, youtube: google.youtube({ version: 'v3', auth }), analytics: google.youtubeAnalytics({ version: 'v2', auth }) };
  return cached;
}
