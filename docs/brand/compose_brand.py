# SPDX-License-Identifier: MIT — Copyright (c) 2026 Sai Akash Neela — https://github.com/SaiAkashNeela/cartoon-short-skill
# Builds the Bobble Explains icons and wordmark from engine stills rendered on the studio set (see docs/brand/README.md).
import math, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops
import numpy as np
os.makedirs('out', exist_ok=True)
KEY = np.array([255, 0, 255], float)
BLACK = '/usr/share/fonts/opentype/inter/Inter-Black.otf'

def cutout(path):
    """Chroma-key the magenta backdrop with soft alpha and colour decontamination."""
    a = np.asarray(Image.open(path).convert('RGB')).astype(float)
    # how magenta a pixel is: high R and B, low G
    m = np.clip(((a[..., 0] + a[..., 2]) / 2 - a[..., 1]) / 255.0, 0, 1)
    alpha = np.clip((1 - m) * 1.6 - 0.25, 0, 1)            # 1 = character, 0 = backdrop
    alpha[m < 0.25] = 1.0
    rgb = (a - (1 - alpha[..., None]) * KEY) / np.maximum(alpha[..., None], 1e-3)   # remove magenta spill
    rgb = np.clip(rgb, 0, 255)
    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    im = Image.fromarray(out, 'RGBA')
    return im.crop(im.getbbox())

def rays(size, c1, c2, n=18, alpha=40):
    W = H = size; im = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(im)
    cx, cy, R = W / 2, H * 0.46, W
    for i in range(n):
        a0 = i * 2 * math.pi / n; a1 = a0 + math.pi / n
        d.polygon([(cx, cy), (cx + R * math.cos(a0), cy + R * math.sin(a0)), (cx + R * math.cos(a1), cy + R * math.sin(a1))], fill=c2 + (alpha,))
    return im

def radial(size, inner, outer):
    y, x = np.mgrid[0:size, 0:size]; r = np.sqrt((x - size / 2) ** 2 + (y - size * 0.46) ** 2) / (size * 0.72)
    r = np.clip(r, 0, 1)[..., None]
    c = np.array(inner) * (1 - r) + np.array(outer) * r
    return Image.fromarray(c.astype(np.uint8), 'RGB').convert('RGBA')

def shadow(img, blur=18, off=(0, 16), op=110):
    sh = Image.new('RGBA', img.size, (0, 0, 0, 0)); a = img.split()[3].point(lambda v: v * op // 255)
    sh.putalpha(a); sh = sh.filter(ImageFilter.GaussianBlur(blur)); return sh, off

def icon(cut, name, inner, outer, ray, S=1024, head_w=0.62):
    bg = radial(S, inner, outer); bg.alpha_composite(rays(S, inner, ray))
    # scale so the head (the widest part near the top) is ~62% of the canvas
    w = int(S * head_w * cut.width / (cut.width * 0.80)); im = cut.resize((w, int(cut.height * w / cut.width)), Image.LANCZOS)
    x = (S - im.width) // 2; y = int(S * 0.115)
    sh, off = shadow(im); bg.alpha_composite(sh, (x + off[0], y + off[1])); bg.alpha_composite(im, (x, y))
    bg = bg.convert('RGB'); bg.save(f'out/{name}.png'); return bg

def circle_preview(icons, names):
    W = 360 * len(icons); P = Image.new('RGB', (W, 470), '#0f0f14'); d = ImageDraw.Draw(P)
    f = ImageFont.truetype(BLACK, 22)
    for i, (ic, nm) in enumerate(zip(icons, names)):
        for sz, (dx, dy) in [(300, (30, 20)), (88, (40, 345)), (48, (150, 365))]:
            c = ic.resize((sz, sz), Image.LANCZOS); m = Image.new('L', (sz, sz), 0); ImageDraw.Draw(m).ellipse((0, 0, sz - 1, sz - 1), fill=255)
            P.paste(c, (i * 360 + dx, dy), m)
        d.text((i * 360 + 220, 380), nm, font=f, fill='#ffffff')
    P.save('out/preview_circles.png')

head = cutout('stills/t_1.00.png'); laugh = cutout('stills/t_5.00.png'); wave = cutout('stills/t_3.00.png')
a = icon(head, 'icon_blue', (96, 160, 255), (30, 60, 170), (190, 215, 255))
b = icon(head, 'icon_yellow', (255, 226, 92), (240, 150, 30), (255, 245, 200))
c = icon(laugh, 'icon_laugh_purple', (150, 110, 255), (60, 30, 150), (220, 200, 255))
circle_preview([a, b, c], ['blue', 'yellow', 'laugh'])

# wordmark: Bobble waving + BOBBLE EXPLAINS (transparent)
def sticker(img, r=9):
    """white die-cut border around a cut-out so it reads on any background"""
    pad = r + 2; base = Image.new('RGBA', (img.width + 2 * pad, img.height + 2 * pad), (0, 0, 0, 0)); base.alpha_composite(img, (pad, pad))
    a = base.split()[3].filter(ImageFilter.MaxFilter(2 * r + 1)).filter(ImageFilter.GaussianBlur(1.2))
    out = Image.new('RGBA', base.size, (255, 255, 255, 0)); out.putalpha(a); out.alpha_composite(base); return out

def wordmark(name, W=1800, H=640, dark=None):
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0) if not dark else dark)
    wv = sticker(wave.resize((int(wave.width * (H - 60) / wave.height), H - 60), Image.LANCZOS))
    sh, off = shadow(wv, 14, (0, 12), 90); im.alpha_composite(sh, (40 + off[0], 20 + off[1])); im.alpha_composite(wv, (40, 20))
    d = ImageDraw.Draw(im); x0 = 40 + wv.width + 50
    for txt, size, y, fill in [('BOBBLE', 230, 70, '#ffd93b'), ('EXPLAINS', 150, 330, '#ffffff')]:
        f = ImageFont.truetype(BLACK, size)
        for k in range(1, 4): d.text((x0, y + 4 * k), txt, font=f, fill='#0d0d10', stroke_width=22, stroke_fill='#0d0d10')
        d.text((x0, y), txt, font=f, fill=fill, stroke_width=22, stroke_fill='#0d0d10')
    if dark:  # trim to the content plus a margin
        bb = Image.new('RGBA', im.size, dark); diff = ImageChops.difference(im, bb).getbbox(); im = im.crop((0, 0, min(W, diff[2] + 50), H))
    else:
        im = im.crop(im.getbbox())
    im.save(f'out/{name}.png'); return im
t = wordmark('logo_wordmark_transparent')
m = 60; dark = Image.new('RGBA', (t.width + 2 * m, t.height + 2 * m), (18, 17, 23, 255)); dark.alpha_composite(t, (m, m))
dark.convert('RGB').save('out/logo_wordmark_on_dark.png')
light = Image.new('RGBA', dark.size, (255, 250, 236, 255)); light.alpha_composite(t, (m, m)); light.convert('RGB').save('out/logo_wordmark_on_light.png')
print('done', sorted(os.listdir('out')))
