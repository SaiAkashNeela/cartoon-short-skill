# SPDX-License-Identifier: MIT — Copyright (c) 2026 Sai Akash Neela — https://github.com/SaiAkashNeela/cartoon-short-skill
"""Render the reference sheets in docs/images/ straight from the engine.

    python3 docs/gallery/build_gallery.py            (from the repo root; needs node, ffmpeg, playwright, PIL)

Each sheet is a throwaway project: a fake timeline (no voice needed), an episode with one shot per tile,
one still per shot, then the stills are tiled with labels. Re-run whenever the engine's look changes.
"""
import json, os, shutil, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ENGINE = os.path.join(ROOT, 'cartoon-shorts', 'engine')
OUT = os.path.join(ROOT, 'docs', 'images')
FONT = next((p for p in ['/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'] if os.path.exists(p)), None)
FONT_R = next((p for p in ['/usr/share/fonts/opentype/inter/Inter-Medium.otf', '/usr/share/fonts/opentype/inter/Inter-Regular.otf'] if os.path.exists(p)), FONT)
os.makedirs(OUT, exist_ok=True)
WORK = tempfile.mkdtemp(prefix='gallery-')
for f in ('scene.html', 'render.mjs', 'package.json'):
    shutil.copy(os.path.join(ENGINE, f), WORK)
subprocess.run(['npm', 'install', '--silent', '--no-audit', '--no-fund'], cwd=WORK, check=True)

EPISODE_JS = """
const DATA = %s;
export const character = %s;
export default function ({ POSE, fx }) {
  return { blinks: [], punch: false, shots: DATA.map((s) => ({
    env: s.env, pose: [[0, POSE(s.pose, s.over || {})]], face: [[0, s.face || {}]],
    cam: () => ({ p: s.p, l: s.l }),
    update: ({ t, pose, props }) => { if (s.fx) fx[s.fx](pose, t); if (s.mug) { props.mug = 1; props.mugTilt = s.pose === 'sip' ? -0.9 : 0; } }
  })) };
}
"""


def render(shots, character=None):
    """Render one still per shot; returns list of PIL images."""
    n = len(shots)
    starts = [i * 2 + 0.3 for i in range(n)]
    tl = {'fps': 30, 'duration': n * 2, 'starts': starts, 'lineEnds': [s + 1 for s in starts],
          'lines': [''] * n, 'labels': [None] * n, 'moods': [], 'words': []}
    json.dump(tl, open(os.path.join(WORK, 'timeline.json'), 'w'))
    open(os.path.join(WORK, 'episode.js'), 'w').write(EPISODE_JS % (json.dumps(shots), json.dumps(character or {})))
    times = [f'{i * 2 + 1.0:.2f}' for i in range(n)]
    subprocess.run(['node', 'render.mjs', 'stills', *times], cwd=WORK, check=True)
    return [Image.open(os.path.join(WORK, 'stills', f't_{t}.jpg')).convert('RGB') for t in times]


def sheet(name, title, subtitle, tiles, cols, crop=None, tile_w=300):
    """tiles: list of (image, label, code). crop: (x0, y0, x1, y1) box in 1080x1920 frame coords."""
    imgs = [im.crop(crop) if crop else im for im, _, _ in tiles]
    th = int(tile_w * imgs[0].height / imgs[0].width)
    lab_h, pad, head = 74, 14, 120
    rows = (len(tiles) + cols - 1) // cols
    W = cols * tile_w + (cols + 1) * pad
    H = head + rows * (th + lab_h + pad) + pad
    out = Image.new('RGB', (W, H), '#121117')
    d = ImageDraw.Draw(out)
    d.text((pad + 4, 22), title, font=ImageFont.truetype(FONT, 44), fill='#ffd93b')
    d.text((pad + 4, 76), subtitle, font=ImageFont.truetype(FONT_R, 22), fill='#b9b6c6')
    f1, f2 = ImageFont.truetype(FONT, 26), ImageFont.truetype(FONT_R, 17)
    for i, (im, (_, label, code)) in enumerate(zip(imgs, tiles)):
        r, c = divmod(i, cols)
        if r == rows - 1:  # centre a short last row
            c += (cols - (len(tiles) - r * cols)) / 2
        x = int(pad + c * (tile_w + pad)); y = head + r * (th + lab_h + pad)
        out.paste(im.resize((tile_w, th), Image.LANCZOS), (x, y))
        d.rectangle([x, y + th, x + tile_w - 1, y + th + lab_h - 6], fill='#1f1d27')
        d.text((x + 12, y + th + 8), label, font=f1, fill='#ffffff')
        d.text((x + 12, y + th + 42), code, font=f2, fill='#9a96ab')
    out.save(os.path.join(OUT, name), quality=88, optimize=True)
    print('wrote', name, out.size)


MED = dict(p=[0.9, 2.3, 7.4], l=[-0.1, 1.95, 0.9], env='day')

# ---- poses ----
POSES = [
    ('idle', {}, {'smile': .2}, None, None),
    ('think', {}, {'browA': -24, 'brow': .1, 'smile': .1, 'mouthW': .7, 'lookY': -.3}, None, None),
    ('stretch', {}, {'eyeOpen': .05, 'open': .6, 'smile': .3, 'mouthW': .7}, None, None),
    ('hips', {}, {'eyeOpen': .55, 'brow': .45, 'smile': 1, 'mouthW': 1.15, 'blush': .6}, None, None),
    ('cheer', {}, {'eyeOpen': .05, 'open': .7, 'smile': 1}, None, None),
    ('point', {}, {'brow': .3, 'lookX': .8, 'smile': .4}, None, None),
    ('shrug', {}, {'brow': -.4, 'browA': -20, 'smile': -.2}, None, None),
    ('facepalm', {}, {'eyeOpen': 0, 'smile': -.6}, None, None),
    ('wave', {}, {'smile': .9, 'blush': .5}, 'wave', None),
    ('tired', {}, {'eyeOpen': .45, 'bags': .8, 'brow': -.25, 'smile': -.25}, None, None),
    ('nod', {}, {'eyeOpen': 0, 'bags': .8, 'open': .15, 'mouthW': .5}, None, None),
    ('jolt', {}, {'wide': 1, 'brow': -.5, 'open': .35, 'mouthW': .6, 'sweat': 1}, None, None),
    ('scared', {}, {'wide': 1, 'brow': -.6, 'open': .9, 'mouthW': .6, 'sweat': 1, 'lookX': -.9}, 'tremble', None),
    ('sway', {}, {'eyeOpen': .3, 'bags': 1, 'smile': -.2}, None, None),
    ('sit', {}, {'eyeOpen': .6, 'smile': .3}, None, dict(p=[0.8, 1.6, 6.2], l=[-0.1, 1.05, 0.9])),
    ('fallen', {}, {'eyeOpen': 0, 'smile': .5, 'mouthW': .6, 'blush': .8}, None, dict(p=[0.1, 6.6, 3.2], l=[-0.1, 0.35, -0.4])),
    ('walk', {'ry': 1.2}, {'smile': .4}, 'walk', None),
    ('holdMug', {}, {'smile': .5}, None, None),
    ('sip', {}, {'eyeOpen': .05, 'smile': .5, 'blush': .5}, None, None),
]
shots = []
for name, over, face, fxn, cam in POSES:
    s = dict(MED, pose='idle' if name == 'walk' else name, over=over, face=face, fx=fxn, mug=name in ('holdMug', 'sip'))
    if cam: s.update(cam)
    shots.append(s)
ims = render(shots)
codes = [f"POSE('{n}')" if n != 'walk' else "fx.walk + ry: 1.2" for n, *_ in POSES]
codes[8] = "POSE('wave') + fx.wave"; codes[12] = "POSE('scared') + fx.tremble"; codes[15] = "POSE('fallen') / fx.fall"; codes[17] = "POSE('holdMug') + props.mug"; codes[18] = "POSE('sip') + props.mugTilt"
sheet('poses.jpg', 'Poses', 'Built-in body poses — use POSE(name, overrides) in episode.js keyframes',
      [(im, n, c) for im, (n, *_), c in zip(ims, POSES, codes)], cols=6, crop=(0, 160, 1080, 1760))

# ---- faces ----
FACES = [
    ('neutral', {}), ('laugh', {'eyeOpen': .05, 'smile': .8, 'open': .7, 'mouthW': 1.1}),
    ('smug', {'eyeOpen': .55, 'brow': .45, 'browA': -18, 'smile': 1, 'mouthW': 1.15, 'blush': .6}),
    ('curious', {'browA': -24, 'brow': .1, 'smile': .1, 'mouthW': .7}),
    ('shocked', {'wide': 1, 'brow': -.6, 'open': .9, 'mouthW': .6, 'sweat': 1}),
    ('angry', {'brow': 1, 'smile': -.6, 'eyeOpen': .7, 'mouthW': .9}),
    ('worried', {'brow': -.7, 'smile': -.4, 'sweat': 1, 'lookX': -.5}),
    ('sad', {'brow': -.8, 'smile': -.8, 'eyeOpen': .6, 'lookY': .5}),
    ('tired', {'eyeOpen': .4, 'bags': .9, 'brow': -.25, 'smile': -.3}),
    ('yawn', {'eyeOpen': .05, 'open': 1, 'mouthW': .6, 'smile': .2}),
    ('asleep', {'eyeOpen': 0, 'smile': .5, 'mouthW': .6, 'blush': .8}),
    ('embarrassed', {'blush': 1, 'smile': .3, 'lookX': .8, 'browY': -10, 'sweat': .8}),
]
CLOSE = dict(p=[0.45, 2.72, 4.2], l=[-0.12, 2.58, 0.9], env='day')
ims = render([dict(CLOSE, pose='idle', face=f) for _, f in FACES])
fmt = lambda f: ', '.join(f'{k}:{v}' for k, v in list(f.items())[:2]) or '(defaults)'
sheet('faces.jpg', 'Expressions', 'Face keyframes — any mix of eyeOpen, wide, brow, browA, smile, open, mouthW, bags, sweat, blush, lookX/Y',
      [(im, n, fmt(f)) for im, (n, f) in zip(ims, FACES)], cols=6, crop=(90, 440, 990, 1340), tile_w=260)

# ---- outfits: one render per character look ----
OUTFITS = [
    ('Beanie (Classic)', {}, 'hips', {'eyeOpen': .55, 'brow': .45, 'smile': 1, 'blush': .6}),
    ('Ember', {'hoodie': '#d9412b', 'hoodieDark': '#a92f1f', 'beanie': '#2f2f36', 'beanieBand': '#1f1f25', 'sole': '#2f2f36'}, 'cheer', {'eyeOpen': .05, 'open': .7, 'smile': 1}),
    ('Midnight', {'hoodie': '#26252e', 'hoodieDark': '#18171e', 'beanie': '#e2493b', 'beanieBand': '#b8352a'}, 'think', {'browA': -24, 'brow': .2, 'smile': .1, 'mouthW': .7}),
    ('Bubblegum', {'hoodie': '#f28cb8', 'hoodieDark': '#d66a99', 'beanie': '#ffffff', 'beanieBand': '#e9e9ef', 'sole': '#f28cb8'}, 'wave', {'smile': .9, 'blush': .7}),
    ('Forest', {'hoodie': '#3f8f4f', 'hoodieDark': '#2f6f3c', 'beanie': '#8a5a34', 'beanieBand': '#6d4426'}, 'point', {'brow': .3, 'lookX': .8, 'smile': .4}),
    ('Royal', {'hoodie': '#6b45c6', 'hoodieDark': '#5233a0', 'beanie': '#33c4b0', 'beanieBand': '#26a090', 'sole': '#33c4b0'}, 'shrug', {'brow': -.4, 'browA': -20, 'smile': -.2}),
    ('Sunset', {'hoodie': '#f08a24', 'hoodieDark': '#c96c12', 'beanie': '#3b78db', 'beanieBand': '#2d5fb3'}, 'stretch', {'eyeOpen': .05, 'open': .6, 'smile': .3, 'mouthW': .7}),
    ('Frost', {'hoodie': '#e9eef5', 'hoodieDark': '#c9d3e0', 'beanie': '#4fb6e8', 'beanieBand': '#3594c2', 'sole': '#4fb6e8'}, 'scared', {'wide': 1, 'brow': -.6, 'open': .9, 'mouthW': .6, 'sweat': 1}),
]
tiles = []
for name, look, pose, face in OUTFITS:
    im = render([dict(MED, pose=pose, face=face, fx='wave' if pose == 'wave' else None)], character=look)[0]
    tiles.append((im, name, (f"hoodie {look['hoodie']}" if look else 'default colours')))
sheet('outfits.jpg', 'Outfits', "Restyle the character per series — export const character = { hoodie, hoodieDark, beanie, beanieBand, ... }",
      tiles, cols=4, crop=(0, 160, 1080, 1760))
json.dump({n: l for n, l, *_ in OUTFITS}, open(os.path.join(OUT, 'outfits.json'), 'w'), indent=1)

# ---- environments ----
ENVS = ['day', 'morning', 'golden', 'dusk', 'night', 'storm']
WIDE = dict(p=[2.0, 2.45, 9.0], l=[-0.7, 2.45, 0])
ims = render([dict(WIDE, env=e, pose='hips', face={'smile': .4}) for e in ENVS])
sheet('environments.jpg', 'Lighting', "Per-shot env: '<name>' — switching env between shots shows time passing",
      [(im, e, f"env: '{e}'") for im, e in zip(ims, ENVS)], cols=6, crop=(0, 0, 1080, 1920), tile_w=240)

# ---- frames from a finished episode (optional): build_gallery.py <final.mp4> ----
def episode_sheet(mp4, name, title, beats, gif=None, gif_span=None):
    tiles = []
    for t, label, what in beats:
        f = os.path.join(WORK, f'ep_{name}_{t}.jpg')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(t), '-i', mp4, '-frames:v', '1', f], check=True)
        tiles.append((Image.open(f).convert('RGB'), label, what))
    sheet(name, title, f'Frames from the finished example episode ({os.path.basename(mp4)})', tiles, cols=6, tile_w=240)
    if gif:
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(gif_span[0]), '-t', str(gif_span[1]), '-i', mp4, '-vf',
                        'fps=10,scale=270:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4',
                        os.path.join(OUT, gif)], check=True)


# ---- frames from finished episodes (optional): build_gallery.py <sleep.mp4> [<coffee.mp4>] ----
if len(sys.argv) > 1:
    episode_sheet(sys.argv[1], 'episode.jpg', 'Example: "What if you stopped sleeping?"',
                  [(1.6, 'Hook', 'think + curious'), (5.4, 'Day 1', 'hips + smug'), (10.9, 'Day 3', 'nod (microsleep)'),
                   (11.4, 'Day 3', 'jolt awake'), (16.9, 'Day 5', 'tree eyes + scared'), (26.5, 'Night', 'fallen + zzz')],
                  gif='preview.gif', gif_span=(8.0, 10.5))
if len(sys.argv) > 2:
    episode_sheet(sys.argv[2], 'episode-coffee.jpg', 'Example: "What if you drank only coffee for a week?"',
                  [(1.6, 'Hook', 'sip + props.mug'), (8.6, 'Day 1', 'wired + tremble'), (18.4, 'Day 3', 'spill lurch'),
                   (23.7, 'Day 5', 'storm + cups'), (31.6, 'Day 7', 'cup pyramid'), (40.5, 'End', 'fallen, wide awake')],
                  gif='preview-coffee.gif', gif_span=(29.5, 9.0))

# the skill ships the sheets Claude should look at while choreographing
for f in ('poses.jpg', 'faces.jpg', 'outfits.jpg', 'environments.jpg'):
    shutil.copy(os.path.join(OUT, f), os.path.join(ROOT, 'cartoon-shorts', 'references', f))
shutil.rmtree(WORK)
