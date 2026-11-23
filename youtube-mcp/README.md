# youtube-studio-mcp

An MCP server that lets Claude manage **your own YouTube channel** through the official YouTube Data API v3 and
YouTube Analytics API: upload Shorts and videos, edit titles and descriptions, schedule publishing, set thumbnails, manage
playlists, read and reply to comments, pull analytics, and update the channel banner and description.

It runs **on your own computer** (Claude Code or Claude Desktop), signs in with your Google account once, and keeps the
token in a private file on that machine. Nothing is sent anywhere except Google's APIs.

| Tool | What it does |
|---|---|
| `channel_info` | title, handle, description, keywords, subscriber/view/video counts |
| `list_videos` | recent uploads with privacy, schedule and stats |
| `video_details` | everything about one video, including processing or rejection status |
| `upload_video` | resumable upload with title, description, tags, privacy, scheduled `publish_at`, category, made-for-kids, thumbnail |
| `update_video` | change any of the above on an existing video |
| `set_thumbnail` | custom thumbnail (needs a verified channel; not shown in the Shorts feed) |
| `list_playlists`, `create_playlist`, `add_to_playlist` | organise episodes into series |
| `list_comments`, `reply_to_comment` | read comments on a video or the whole channel, reply as the channel |
| `analytics_report` | views, watch time, average view duration, subscribers… by day, video, country, traffic source |
| `set_channel_banner` | upload and apply a 2560×1440 banner |
| `update_channel` | channel description, keywords, country |

## Before you start: what YouTube allows through the API

- **Uploads from a new, unaudited API project are locked to private.** Google restricts videos uploaded through any API
  project created after July 2020 to private viewing until the project passes the free **YouTube API Services audit**
  (search "YouTube API Services Audit and Quota Extension Form"). Until then, upload as private and switch to public in
  YouTube Studio. Everything else (metadata, playlists, comments, analytics, banner) works straight away.
- **Quota:** 10,000 units a day by default. An upload costs about 1,600, so roughly 6 uploads a day. Reads are cheap.
  The same form can request more.
- **Not possible through the API:** changing the profile picture, and custom thumbnails in the Shorts feed.

## Setup (about 10 minutes, once)

1. **Google Cloud project.** In the Google Cloud console, create a project (e.g. "bobble-youtube").
2. **Enable the APIs.** In *APIs & Services → Library*, enable **YouTube Data API v3** and **YouTube Analytics API**.
3. **Consent screen.** Configure the OAuth consent screen / *Google Auth Platform*: user type **External**, your app name
   and email, and add your own Google account as a **test user**.
   - While the app is in *Testing*, Google expires the sign-in after **7 days** (run `npm run auth` again). To avoid that,
     set the publishing status to *In production*. For personal use you'll just see an "unverified app" warning when
     you sign in.
4. **OAuth client.** In *Credentials → Create credentials → OAuth client ID*, choose **Desktop app**, then download
   the JSON and save it as:
   - macOS / Linux: `~/.config/youtube-studio-mcp/client_secret.json`
   - Windows: `%USERPROFILE%\.config\youtube-studio-mcp\client_secret.json`
   - or anywhere, with `YOUTUBE_MCP_DIR=/that/folder`
5. **Install and sign in:**
   ```bash
   cd youtube-mcp
   npm install
   npm run auth        # opens Google sign-in; pick the account (or brand account) that owns the channel
   npm test            # optional: checks the server starts and lists its tools
   ```
6. **Connect it to Claude.**
   - Claude Code: `claude mcp add youtube-studio -- node /absolute/path/to/youtube-mcp/src/server.js`
   - Claude Desktop, in `claude_desktop_config.json`:
     ```json
     { "mcpServers": { "youtube-studio": { "command": "node", "args": ["/absolute/path/to/youtube-mcp/src/server.js"] } } }
     ```

Then ask things like *"upload ~/Videos/coffee.mp4 as a private Short with a good title and description"*, *"schedule it
for Friday 6pm UK time"*, *"how did my last 5 Shorts do this week?"* or *"reply to new comments on the doctor episode"*.

## Security

- The OAuth client JSON and `token.json` live only in the config folder, and the token file is readable only by you.
  Never commit them (this folder's `.gitignore` and the default location keep them out of the repo).
- Revoke access any time at Google Account → Security → *Third-party apps with account access*.
- The tool descriptions tell Claude to confirm with you before anything goes public, gets posted, or changes the
  channel. Comment text from viewers is treated as data, not instructions.

## License

MIT © 2026 Sai Akash Neela. Uses `@modelcontextprotocol/sdk` (MIT), `googleapis` (Apache-2.0) and `zod` (MIT).
YouTube is a trademark of Google LLC; this project is not affiliated with or endorsed by Google.
