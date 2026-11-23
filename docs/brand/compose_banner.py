# SPDX-License-Identifier: MIT — Copyright (c) 2026 Sai Akash Neela — https://github.com/SaiAkashNeela/cartoon-short-skill
# YouTube banner (2560x1440): logo in the all-device safe area (1546x423, centred), cast in the desktop/TV strip.
import math, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np
os.makedirs('out', exist_ok=True)
KEY = np.array([255, 0, 255], float); BLACK = '/usr/share/fonts/opentype/inter/Inter-Black.otf'; BOLD = '/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf'
W, H = 2560, 1440; SAFE = (507, 508, 2053, 931)

def cutout(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(float)
    m = np.clip(((a[..., 0] + a[..., 2]) / 2 - a[..., 1]) / 255.0, 0, 1)
    alpha = np.clip((1 - m) * 1.6 - 0.25, 0, 1); alpha[m < 0.25] = 1.0
    rgb = np.clip((a - (1 - alpha[..., None]) * KEY) / np.maximum(alpha[..., None], 1e-3), 0, 255)
    im = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), 'RGBA'); return im.crop(im.getbbox())
def sticker(img, r=8):
    pad = r + 2; base = Image.new('RGBA', (img.width + 2 * pad, img.height + 2 * pad), (0, 0, 0, 0)); base.alpha_composite(img, (pad, pad))
    a = base.split()[3].filter(ImageFilter.MaxFilter(2 * r + 1)).filter(ImageFilter.GaussianBlur(1.2))
    out = Image.new('RGBA', base.size, (255, 255, 255, 0)); out.putalpha(a); out.alpha_composite(base); return out
def place(canvas, img, h, cx, bottom):
    im = sticker(img.resize((int(img.width * h / img.height), h), Image.LANCZOS))
    P = 40  # pad the shadow layer so the blur isn't clipped into a visible box
    sh = Image.new('RGBA', (im.width + 2 * P, im.height + 2 * P), (0, 0, 0, 0)); a = Image.new('L', sh.size, 0); a.paste(im.split()[3].point(lambda v: v * 90 // 255), (P, P))
    sh.putalpha(a); sh = sh.filter(ImageFilter.GaussianBlur(12))
    x, y = int(cx - im.width / 2), int(bottom - im.height)
    canvas.alpha_composite(sh, (x + 6 - P, y + 14 - P)); canvas.alpha_composite(im, (x, y))

# background: blue radial gradient + sunburst rays
yy, xx = np.mgrid[0:H, 0:W]; r = np.clip(np.sqrt(((xx - W / 2) / 1.6) ** 2 + (yy - H / 2) ** 2) / 1100, 0, 1)[..., None]
bg = Image.fromarray((np.array([96, 160, 255]) * (1 - r) + np.array([30, 60, 170]) * r).astype(np.uint8), 'RGB').convert('RGBA')
ray = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(ray); cx, cy, R = W / 2, H / 2, 2400
for i in range(28):
    a0 = i * 2 * math.pi / 28; a1 = a0 + math.pi / 28
    d.polygon([(cx, cy), (cx + R * math.cos(a0), cy + R * math.sin(a0)), (cx + R * math.cos(a1), cy + R * math.sin(a1))], fill=(190, 215, 255, 34))
bg.alpha_composite(ray)
# soft dots
rng = np.random.RandomState(4); dots = Image.new('RGBA', (W, H)); dd = ImageDraw.Draw(dots)
for _ in range(90):
    x, y, s = rng.randint(0, W), rng.randint(0, H), rng.randint(6, 22); dd.ellipse((x, y, x + s, y + s), fill=(255, 255, 255, 40))
bg.alpha_composite(dots)

C = {n: cutout(f'stills/t_{t}.png') for n, t in [('bobble', '1.00'), ('doctor', '3.00'), ('nurse', '5.00'), ('mom', '7.00'), ('kid', '9.00'), ('boss', '11.00'), ('coworker', '13.00'), ('friend', '15.00')]}
FLOOR = 936
# cast flanking the safe area (shown on desktop + TV)
for n, h, x in [('nurse', 350, 105), ('doctor', 395, 265), ('mom', 370, 400)]: place(bg, C[n], h, x, FLOOR)
for n, h, x in [('coworker', 370, 2190), ('boss', 395, 2290), ('kid', 285, 2395), ('friend', 370, 2468)]: place(bg, C[n], h, x, FLOOR)
# logo inside the safe area (shown everywhere)
place(bg, C['bobble'], 378, 775, FLOOR - 12)
d = ImageDraw.Draw(bg); x0 = 945
def word(txt, font, size, y, fill, stroke):
    f = ImageFont.truetype(font, size)
    for k in range(1, 4): d.text((x0, y + 4 * k), txt, font=f, fill='#0d0d10', stroke_width=stroke, stroke_fill='#0d0d10')
    d.text((x0, y), txt, font=f, fill=fill, stroke_width=stroke, stroke_fill='#0d0d10')
word('BOBBLE', BLACK, 182, 528, '#ffd93b', 18)
word('EXPLAINS', BLACK, 118, 716, '#ffffff', 15)
word('What if…? Explained in under a minute.', BOLD, 46, 862, '#ffffff', 8)
bg.convert('RGB').save('out/youtube_banner.png')

# preview of what each device shows
pv = bg.convert('RGB').copy(); pd = ImageDraw.Draw(pv)
pd.rectangle((0, 508, W - 1, 931), outline='#ff4d4d', width=6); pd.rectangle(SAFE, outline='#4dff88', width=8)
f = ImageFont.truetype(BOLD, 40)
pd.text((20, 450), 'desktop shows this strip (2560x423)', font=f, fill='#ff4d4d'); pd.text((520, 945), 'phone / all devices: safe area (1546x423)', font=f, fill='#4dff88')
pd.text((20, 20), 'TV shows the full 2560x1440', font=f, fill='#ffffff')
pv.resize((1280, 720)).save('out/youtube_banner_preview.png')
print('ok')
