// Renders scene.html frame-by-frame in headless Chromium (SwiftShader WebGL) and pipes JPEGs to ffmpeg.
// Usage (from the project dir):
//   node render.mjs stills 1.0 4.2 ...        -> stills/t_<time>.jpg
//   node render.mjs frames <from> <to> <out>  -> encodes frames [from,to) to <out>.mp4
// Set CHROMIUM_PATH to use a specific Chrome/Chromium binary.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { console.error('playwright not found: run `npm i playwright && npx playwright install chromium` in the project dir'); process.exit(1); }

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;

const [mode, ...args] = process.argv.slice(2);
const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('console', (m) => { if (m.type() === 'error') console.error('PAGE:', m.text()); });
page.on('pageerror', (e) => { console.error('PAGEERR:', e.message); process.exit(1); });  // fail fast instead of waiting for READY
await page.goto(`http://localhost:${port}/scene.html`);
await page.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
const stage = await page.$('#stage');

if (mode === 'stills') {
  fs.mkdirSync(path.join(ROOT, 'stills'), { recursive: true });
  for (const t of args.map(Number)) {
    await page.evaluate((t) => window.setTime(t), t);
    await stage.screenshot({ path: path.join(ROOT, 'stills', `t_${t.toFixed(2)}.jpg`), type: 'jpeg', quality: 85 });
  }
} else {
  const FPS = 30; const [from, to, out] = [Number(args[0]), Number(args[1]), args[2]];
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = from; f < to; f++) {
    await page.evaluate((t) => window.setTime(t), f / FPS);
    const buf = await stage.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - from) % 30 === 0) console.log(`${out}: frame ${f}/${to} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
}
await browser.close(); server.close();
