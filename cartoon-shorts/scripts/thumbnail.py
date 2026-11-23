#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Sai Akash Neela — https://github.com/SaiAkashNeela/cartoon-short-skill
"""Make a 1280x720 YouTube thumbnail from a clean frame of the video plus 2-4 bold words.

    python3 thumbnail.py <proj> --time 31.6 --text "12 CUPS|A DAY?!" [--out thumbnail.jpg] [--side left|right]

`|` splits the text into two lines (line 1 yellow, line 2 white). The frame is rendered without captions or watermark.
Landscape projects use the frame full-bleed; vertical (Shorts) projects put the frame on one side over a blurred copy.
Keep the text to 2-4 words that add to the title rather than repeat it, and pick a moment with a big, readable face.
Note: custom thumbnails need a verified YouTube channel, and the Shorts feed shows a frame you pick in the YouTube app instead.
"""
import argparse, json, os, subprocess
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('proj'); ap.add_argument('--time', type=float, required=True); ap.add_argument('--text', required=True)
ap.add_argument('--out', default='thumbnail.jpg'); ap.add_argument('--side', choices=['left', 'right'], default='left')
a = ap.parse_args()
proj = os.path.abspath(a.proj)

env = dict(os.environ, STILLS_PNG='1', CLEAN='1')
subprocess.run(['node', 'render.mjs', 'stills', f'{a.time}'], cwd=proj, env=env, check=True)
frame = Image.open(f'{proj}/stills/t_{a.time:.2f}.png').convert('RGB')

W, H = 1280, 720
font_path = next((p for p in ['/usr/share/fonts/opentype/inter/Inter-Black.otf', '/System/Library/Fonts/Supplemental/Arial Black.ttf',
                              '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 'C:/Windows/Fonts/ariblk.ttf'] if os.path.exists(p)), None)
if frame.width > frame.height:   # landscape: full bleed + a dark gradient behind the text
    img = frame.resize((W, H), Image.LANCZOS).convert('RGBA')
    grad = Image.new('L', (W, 1)); [grad.putpixel((x, 0), int(200 * max(0, 1 - x / (W * 0.6)))) for x in range(W)]
    if a.side == 'right': grad = grad.transpose(Image.FLIP_LEFT_RIGHT)
    shade = Image.new('RGBA', (W, H), (10, 10, 20, 0)); shade.putalpha(grad.resize((W, H))); img.alpha_composite(shade)
    text_box = (40, 60, int(W * 0.58), H - 60) if a.side == 'left' else (int(W * 0.42), 60, W - 40, H - 60)
else:                             # vertical: blurred cover background, the frame on one side, text on the other
    bg = frame.resize((W, int(frame.height * W / frame.width)), Image.LANCZOS)
    bg = bg.crop((0, (bg.height - H) // 2, W, (bg.height - H) // 2 + H)).filter(ImageFilter.GaussianBlur(18))
    img = Image.blend(bg, Image.new('RGB', (W, H), (15, 15, 30)), 0.45).convert('RGBA')
    fw = int(frame.width * H / frame.height); f = frame.resize((fw, H), Image.LANCZOS)
    fx = W - fw - 30 if a.side == 'left' else 30
    img.paste(f, (fx, 0))
    text_box = (40, 60, fx - 30, H - 60) if a.side == 'left' else (fx + fw + 30, 60, W - 40, H - 60)

d = ImageDraw.Draw(img)
lines = [s.strip().upper() for s in a.text.split('|') if s.strip()][:3]
bw, bh = text_box[2] - text_box[0], text_box[3] - text_box[1]
size = 200
while size > 40:   # largest size where every line fits the box width and the block fits its height
    f = ImageFont.truetype(font_path, size) if font_path else ImageFont.load_default()
    wide = max(d.textbbox((0, 0), l, font=f, stroke_width=size // 10)[2] for l in lines)
    if wide <= bw and size * 1.08 * len(lines) <= bh: break
    size -= 6
y = text_box[1] + (bh - size * 1.08 * len(lines)) / 2
for i, l in enumerate(lines):
    fill = '#ffd93b' if i == 0 else '#ffffff'
    for k in range(1, 4): d.text((text_box[0], y + 4 * k), l, font=f, fill='#0d0d10', stroke_width=size // 10, stroke_fill='#0d0d10')
    d.text((text_box[0], y), l, font=f, fill=fill, stroke_width=size // 10, stroke_fill='#0d0d10'); y += size * 1.08
out = a.out if os.path.isabs(a.out) else os.path.join(proj, a.out)
img.convert('RGB').save(out, quality=90, optimize=True)
print(f'{out} ({os.path.getsize(out) // 1024} KB)')
