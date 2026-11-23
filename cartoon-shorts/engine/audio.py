# SPDX-License-Identifier: MIT — Copyright (c) 2026 Sai Akash Neela — https://github.com/SaiAkashNeela/cartoon-short-skill
"""Build timeline.json (word timings, labels) and audio.wav (voice + procedural music + SFX).

Reads  script.json  and the trimmed voice lines vo/0.wav, vo/1.wav, ... (one per script line).
Run from the project directory:  python3 audio.py
"""
import json, re, wave
import numpy as np

SR = 44100
FPS = 30
script = json.load(open('script.json'))
L = script['lines']
lines = [l['text'] for l in L]
moods = [l.get('mood', 'bright') for l in L]
labels = [l.get('label') for l in L]
speakers = [l.get('speaker') for l in L]   # None = narrator; else a cast name from episode.js (lip-synced)
cast_meta = script.get('cast') or {}


def read_wav(p):
    with wave.open(p) as w:
        sr, n, ch, sw = w.getframerate(), w.getnframes(), w.getnchannels(), w.getsampwidth()
        raw = w.readframes(n)
    a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768 if sw == 2 else np.frombuffer(raw, dtype=np.float32)
    if ch > 1: a = a.reshape(-1, ch).mean(axis=1)
    t_old = np.arange(len(a)) / sr
    return np.interp(np.arange(int(len(a) * SR / sr)) / SR, t_old, a)


voices = [read_wav(f'vo/{i}.wav') for i in range(len(lines))]
pk = max(np.abs(v).max() for v in voices)
voices = [v * (0.89 / pk) for v in voices]  # normalise voice to about -1 dBFS peak

# ---- timeline ----
GAP = script.get('gaps') or ([0.35] + [0.75] * (len(lines) - 1))
starts, t = [], 0.0
for i, v in enumerate(voices):
    t += GAP[i]; starts.append(t); t += len(v) / SR
ends = [s + len(v) / SR for s, v in zip(starts, voices)]
brand = script.get('brand') or {}
end_secs = float(brand.get('endCard', 0) or 0)   # optional end card appended after the tail
end_start = t + script.get('tail', 2.6)
total = end_start + end_secs
N = int(total * SR)
voice = np.zeros(N, np.float32)
for s, v in zip(starts, voices):
    i = int(s * SR); voice[i:i + len(v)] += v


# ---- word timings: find pauses in each line, map them to punctuation phrases, spread words by length ----
def speech_segments(v):
    win = int(0.02 * SR)
    e = np.sqrt(np.convolve(v ** 2, np.ones(win) / win, mode='same'))
    on = e > max(0.02, 0.08 * e.max())
    segs, inside, st, quiet = [], False, 0, 0
    for k in range(0, len(on), win // 2):
        if on[k]:
            if not inside: inside, st = True, k
            quiet = 0
        elif inside:
            quiet += win // 2
            if quiet > 0.13 * SR:
                segs.append((st / SR, (k - quiet) / SR)); inside = False
    if inside: segs.append((st / SR, len(v) / SR))
    return segs or [(0.0, len(v) / SR)]


words_out = []
for li, (text, v, s0) in enumerate(zip(lines, voices, starts)):
    phrases = [p.strip() for p in re.split(r'(?<=[.,?!;:…])\s+', text) if p.strip()]
    segs = speech_segments(v)
    while len(segs) > len(phrases):  # merge across the smallest pause until counts match
        gaps = [segs[k + 1][0] - segs[k][1] for k in range(len(segs) - 1)]
        k = gaps.index(min(gaps)); segs[k:k + 2] = [(segs[k][0], segs[k + 1][1])]
    if len(segs) != len(phrases):  # fewer pauses than phrases: treat the line as one phrase
        segs, phrases = [(segs[0][0], segs[-1][1])], [text]
    for (a, b), ph in zip(segs, phrases):
        ws = ph.split()
        weights = np.array([len(re.sub(r'\W', '', w)) + 1.5 for w in ws], float)
        edges = a + (b - a) * np.concatenate([[0], np.cumsum(weights) / weights.sum()])
        for w, x, y in zip(ws, edges[:-1], edges[1:]):
            words_out.append({'w': w, 's': round(s0 + x, 3), 'e': round(s0 + y, 3), 'line': li})

# lip-sync envelope: voice loudness per video frame, 0..1
nf = int(total * FPS) + 1
mouth = []
for f in range(nf):
    a, b = int(f / FPS * SR), int((f + 1) / FPS * SR)
    mouth.append(float(np.sqrt(np.mean(voice[a:b] ** 2))) if b <= N and b > a else 0.0)
mouth = np.array(mouth); ref = np.percentile(mouth[mouth > 0.01], 90) if (mouth > 0.01).any() else 1.0
mouth = [round(float(x), 3) for x in np.where(mouth / ref < 0.1, 0, np.clip(mouth / ref, 0, 1))]

json.dump({'fps': FPS, 'duration': round(total, 3), 'starts': [round(s, 3) for s in starts],
           'lineEnds': [round(e, 3) for e in ends], 'lines': lines, 'labels': labels, 'moods': moods,
           'words': words_out, 'speakers': speakers if any(speakers) else None,
           'speakerNames': {k: v.get('name', k) for k, v in cast_meta.items()} or None, 'mouth': mouth, 'brand': {k: brand[k] for k in ('handle', 'name', 'cta') if brand.get(k)} or None,
           'endCard': {'start': round(end_start, 3), 'seconds': end_secs} if end_secs else None},
          open('timeline.json', 'w'), indent=1)


# ---- procedural music: chord pad + pluck arpeggio (+ soft drums when bright) ----
def note(m): return 440 * 2 ** ((m - 69) / 12)
def mood_at(t):
    for i in range(len(starts) - 1, -1, -1):
        if t >= starts[i] - 0.4: return moods[i]
    return moods[0]

PROG = {'bright': [[60, 64, 67, 71], [55, 59, 62, 67], [57, 60, 64, 69], [53, 57, 60, 64]],
        'calm': [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [52, 55, 59, 62]],
        'eerie': [[57, 60, 63, 66], [56, 59, 62, 65]],
        'tense': [[52, 55, 58, 62], [53, 56, 59, 63]]}
music = np.zeros(N, np.float32)
beat = 60 / 92; bar = beat * 4
t0, k = 0.0, 0
while t0 < total - 0.5:
    md = mood_at(t0); prog = PROG.get(md, PROG['bright']); chord = prog[k % len(prog)]
    i = int(t0 * SR); n = min(int(bar * SR), N - i); tl = np.arange(n) / SR
    seg = sum(np.sin(2 * np.pi * note(m - 12 + d) * tl) * 0.05 for m in chord for d in (-0.12, 0.12))
    music[i:i + n] += seg * np.minimum(1, tl / 0.4) * np.minimum(1, (bar - tl) / 0.4) * (1.3 if md in ('eerie', 'tense') else 1.0)
    pattern = {'bright': [0, 1, 2, 3, 2, 1, 2, 3], 'calm': [0, 2, 1, 3], 'eerie': [0, 2, 1, 3], 'tense': [0, 0, 1, 0, 0, 2, 0, 3]}.get(md, [0, 1, 2, 3])
    if md != 'eerie' or k % 2 == 0:
        step = bar / len(pattern)
        for j, p in enumerate(pattern):
            si = int((t0 + j * step) * SR); ln = min(int(0.6 * SR), N - si)
            if ln <= 0: continue
            tl2 = np.arange(ln) / SR; f = note(chord[p] + (12 if md == 'bright' else 0))
            tone = sum(np.sin(2 * np.pi * f * h * tl2) / h ** 1.5 for h in (1, 2, 3))
            music[si:si + ln] += tone * np.exp(-tl2 / (0.18 if md in ('bright', 'tense') else 0.35)) * np.minimum(1, tl2 / 0.003) * 0.05
    if md in ('bright', 'tense') and t0 > starts[min(1, len(starts) - 1)] - 0.5:
        for b in range(4):
            si = int((t0 + b * beat) * SR); ln = min(int(0.25 * SR), N - si)
            if ln <= 0: continue
            tl3 = np.arange(ln) / SR
            music[si:si + ln] += np.sin(2 * np.pi * (50 + 90 * np.exp(-tl3 * 30)) * tl3) * np.exp(-tl3 * 14) * 0.22
            hi = int((t0 + b * beat + beat / 2) * SR); hl = min(int(0.05 * SR), N - hi)
            if hl > 0: music[hi:hi + hl] += np.random.RandomState(b).randn(hl) * np.exp(-np.arange(hl) / SR * 80) * 0.025
    t0 += bar; k += 1
for i, md in enumerate(moods):  # rising drone under eerie lines
    if md == 'eerie':
        a, b = int(starts[i] * SR), int(min(total, ends[i] + 0.6) * SR); tl = np.arange(b - a) / SR
        music[a:b] += np.sin(2 * np.pi * (110 + tl * 18) * tl) * 0.05 * np.minimum(1, tl)
fo = int(2.2 * SR); music[-fo:] *= np.linspace(1, 0, fo)


# ---- SFX ----
sfx = np.zeros(N, np.float32)
def add(at, sig):
    i = int(at * SR)
    if i < 0 or i >= N: return
    n = min(len(sig), N - i); sfx[i:i + n] += sig[:n]
def pop():
    tl = np.arange(int(0.18 * SR)) / SR
    return np.sin(2 * np.pi * (900 * np.exp(-tl * 18) + 200) * tl) * np.exp(-tl * 22) * 0.35
def whoosh(d=0.45):
    n = int(d * SR); x = np.random.RandomState(7).randn(n)
    bp = np.convolve(x, np.ones(8) / 8, 'same') - np.convolve(x, np.ones(60) / 60, 'same')
    return bp * np.sin(np.linspace(0, np.pi, n)) ** 2 * 0.35
def thud():
    tl = np.arange(int(0.5 * SR)) / SR
    return np.sin(2 * np.pi * (45 + 60 * np.exp(-tl * 20)) * tl) * np.exp(-tl * 9) * 0.7 + np.random.RandomState(3).randn(len(tl)) * np.exp(-tl * 40) * 0.08
def ding():
    tl = np.arange(int(0.9 * SR)) / SR
    return sum(np.sin(2 * np.pi * 1318 * h * tl) / h ** 2 for h in (1, 2.76, 5.4)) * np.exp(-tl * 5) * 0.25
def boing():
    tl = np.arange(int(0.45 * SR)) / SR
    return np.sin(2 * np.pi * (220 + 160 * np.sin(tl * 40) * np.exp(-tl * 6)) * tl) * np.exp(-tl * 6) * 0.35
SFX = {'pop': pop, 'whoosh': whoosh, 'thud': thud, 'ding': ding, 'boing': boing}

for i in range(1, len(lines)):  # whoosh into every cut, pop when a label appears
    add(starts[i] - 0.45, whoosh())
    if labels[i]: add(starts[i] - 0.05, pop())
if labels[0]: add(starts[0] - 0.05, pop())
if end_secs: add(end_start, ding())
for c in script.get('sfx', []):
    base = starts[c['line']] if c.get('at', 'start') == 'start' else ends[c['line']]
    add(base + c.get('offset', 0), SFX[c['type']]())

mix = np.tanh((voice + music * 0.55 + sfx) * 1.1) * 0.9
with wave.open('audio.wav', 'w') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print(f'duration {total:.2f}s  lines {len(lines)}')
for i, (s, e) in enumerate(zip(starts, ends)): print(f'  line {i}: {s:6.2f} -> {e:6.2f}  {lines[i]}')
