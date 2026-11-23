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
# "music": {"bpm": 96, "style": "space", "sync": true}  ->  every cut lands on a beat, every labelled section on a bar
MUS = script.get('music') or {}
BPM = float(MUS.get('bpm', 92)); BEAT = 60 / BPM; BAR = BEAT * 4
SYNC = bool(MUS.get('sync'))
CUT_LEAD = 0.3   # scene.html cuts to a line's shot 0.3 s before its first word


def snap(x, grid, earliest):
    """Nearest grid point to x that is not before `earliest`."""
    k = round(x / grid)
    while k * grid < earliest - 1e-6: k += 1
    return k * grid


starts, t = [], 0.0
for i, v in enumerate(voices):
    if i and SYNC:   # move the cut onto the grid, keeping at least ~0.4 s of breath after the previous line
        cut = snap(t + GAP[i] - CUT_LEAD, BAR if labels[i] else BEAT, t + 0.4 - CUT_LEAD)
        t = cut + CUT_LEAD
    else:
        t += GAP[i]
    starts.append(t); t += len(v) / SR
ends = [s + len(v) / SR for s, v in zip(starts, voices)]
brand = script.get('brand') or {}
end_secs = float(brand.get('endCard', 0) or 0)   # optional end card appended after the tail
end_start = t + script.get('tail', 2.6)
if SYNC: end_start = snap(end_start, BAR, end_start - BEAT)   # the end card lands on a downbeat
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

fmt = script.get('format', 'short')
if fmt == 'short' and total > 90.5:
    print(f'WARNING: {total:.1f}s is over the 90 s Shorts limit used by this skill; trim lines or use SPEED, or make it "format": "video"')
if fmt == 'video' and total < 60:
    print(f'NOTE: {total:.1f}s is short for a regular video (aim for 3-5 min); consider "format": "short"')

json.dump({'fps': FPS, 'format': fmt, 'duration': round(total, 3), 'starts': [round(s, 3) for s in starts],
           'lineEnds': [round(e, 3) for e in ends], 'lines': lines, 'labels': labels, 'moods': moods,
           'words': words_out, 'speakers': speakers if any(speakers) else None,
           'speakerNames': {k: v.get('name', k) for k, v in cast_meta.items()} or None, 'mouth': mouth, 'brand': {k: brand[k] for k in ('handle', 'name', 'cta') if brand.get(k)} or None,
           'endCard': {'start': round(end_start, 3), 'seconds': end_secs} if end_secs else None,
           'music': {'bpm': BPM, 'sync': SYNC} if MUS else None},
          open('timeline.json', 'w'), indent=1)


# ---- procedural music ----
# Without a "music" block: the original mood score (chord pad + pluck arpeggio, soft drums when bright).
# With one: a layered score locked to the same beat grid as the cuts. Each line's "energy" (0-3) picks the layers
# (0 pad, 1 + arpeggio, 2 + bass and hats, 3 + kick and clap); each labelled section starts on a downbeat with the
# progression back on its first chord, after a riser, a half-beat drop-out and a boom. The music ducks under the voice.
def note(m): return 440 * 2 ** ((m - 69) / 12)
def mood_at(t):
    for i in range(len(starts) - 1, -1, -1):
        if t >= starts[i] - 0.4: return moods[i]
    return moods[0]

PROG = {'bright': [[60, 64, 67, 71], [55, 59, 62, 67], [57, 60, 64, 69], [53, 57, 60, 64]],
        'calm': [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [52, 55, 59, 62]],
        'eerie': [[57, 60, 63, 66], [56, 59, 62, 65]],
        'tense': [[52, 55, 58, 62], [53, 56, 59, 63]],
        'space': [[57, 60, 64, 71], [53, 57, 60, 64], [48, 55, 64, 67], [55, 59, 62, 69]],     # Am9  Fmaj7  Cadd9  G6/9
        'wonder': [[53, 57, 60, 64, 71], [50, 57, 60, 64, 69]]}                                # Fmaj7#11  Dm9
music = np.zeros(N, np.float32)
CUTS = [0.0] + [s - CUT_LEAD for s in starts[1:]]
def line_at(t):
    i = 0
    for k, c in enumerate(CUTS):
        if t >= c - 1e-6: i = k
    return i


def place(buf, at, sig):
    i = int(round(at * SR))
    if i < 0: sig, i = sig[-i:], 0
    n = min(len(sig), len(buf) - i)
    if n > 0: buf[i:i + n] += sig[:n]


def layered_music():
    rng = np.random.RandomState(11)
    DEF_E = {'calm': 1, 'bright': 2, 'tense': 3, 'eerie': 0, 'space': 1, 'wonder': 0}
    energy = [int(l.get('energy', DEF_E.get(m, 1))) for l, m in zip(L, moods)]
    sec_bars = sorted({0} | {int(CUTS[i] / BAR + 1e-6) for i in range(len(L)) if labels[i]})
    pad, arp, low, drums = (np.zeros(N, np.float32) for _ in range(4))
    nbars = int(total / BAR) + 1
    hat_src = np.diff(rng.randn(int(0.06 * SR) + 1))                       # a bright noise burst
    for k in range(nbars):
        t0 = k * BAR
        i = line_at(t0 + 0.01); md = moods[i]; prog = PROG.get(md, PROG['space'])
        sec = max(s for s in sec_bars if s <= k)
        slow = 2 if md in ('space', 'wonder', 'calm', 'eerie') else 1         # bars per chord
        chord = prog[((k - sec) // slow) % len(prog)]
        e_bar = energy[i]
        # pad: detuned chord an octave down, overlapping the next bar by 0.4 s so changes are seamless
        n = int((BAR + 0.4) * SR); tl = np.arange(n) / SR
        env = np.minimum(1, tl / 0.5) * np.minimum(1, (BAR + 0.4 - tl) / 0.4)
        wob = 1 + 0.25 * np.sin(2 * np.pi * 0.25 * (t0 + tl))
        seg = sum(np.sin(2 * np.pi * note(m - 12 + d) * tl + d) for m in chord for d in (-0.1, 0.1)) * 0.032
        if e_bar >= 2: seg += sum(np.sin(2 * np.pi * note(m + 12) * tl) for m in chord[:3]) * 0.008   # shimmer
        place(pad, t0, seg * env * wob)
        root = chord[0] - 24 if chord[0] >= 52 else chord[0] - 12
        for j in range(16):                                                   # 16th-note grid
            tj = t0 + j * BEAT / 4
            if tj >= total - 0.3: break
            e = energy[line_at(tj + 0.01)]
            if e >= 1 and (j % 2 == 0 or e >= 2):                             # arpeggio: 8ths, 16ths from energy 2
                pat = [0, 2, 1, 3, 2, 1, 3, 2]
                m = chord[pat[(j // (1 if e >= 2 else 2)) % len(pat)] % len(chord)] + 12
                ln = int(0.5 * SR); tt = np.arange(ln) / SR; f = note(m)
                tone = sum(np.sin(2 * np.pi * f * h * tt) / h ** 1.6 for h in (1, 2, 3))
                place(arp, tj, tone * np.exp(-tt / 0.16) * np.minimum(1, tt / 0.004) * (0.045 if j % 4 == 0 else 0.032))
            if e >= 2 and j % 2 == 0:                                         # pulsing sub bass on 8ths
                ln = int(BEAT / 2 * 0.95 * SR); tt = np.arange(ln) / SR; f = note(root)
                place(low, tj, (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(4 * np.pi * f * tt)) * np.minimum(1, tt / 0.01) * np.exp(-tt * 3) * 0.11)
            if e >= 2 and j % 4 == 2:                                         # offbeat hat
                place(drums, tj, hat_src * np.exp(-np.arange(len(hat_src)) / SR * 70) * 0.05)
            if e >= 3 and j % 4 == 0:                                         # soft four-on-the-floor kick
                tt = np.arange(int(0.3 * SR)) / SR
                place(drums, tj, np.sin(2 * np.pi * (48 + 80 * np.exp(-tt * 28)) * tt) * np.exp(-tt * 11) * 0.3)
            if e >= 3 and j in (4, 12):                                       # clap on 2 and 4
                c = rng.randn(int(0.12 * SR)); tt = np.arange(len(c)) / SR
                place(drums, tj, np.convolve(c, [1, -1], 'same') * np.exp(-tt * 30) * 0.05)
    # echo on the arpeggio (dotted 8th), then everything together
    for dly, g in ((0.75 * BEAT, 0.32), (1.5 * BEAT, 0.14)):
        d = int(dly * SR); arp[d:] += arp[:-d].copy() * g
    out = pad + arp + low + drums
    # section transitions: drop the music for half a beat before the downbeat (the riser and boom are SFX)
    for i in range(1, len(L)):
        if labels[i]:
            a, b = int((CUTS[i] - BEAT / 2) * SR), int(CUTS[i] * SR)
            if a > 0: out[a:b] *= np.linspace(1, 0.15, b - a) ** 2
    return out


if MUS:
    music = layered_music()
else:
    beat, bar = BEAT, BAR
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
def riser(d=None):
    d = d or (BAR if MUS else 2.0); n = int(d * SR); tl = np.arange(n) / SR; x = tl / d
    nz = np.random.RandomState(5).randn(n); nz = nz - np.convolve(nz, np.ones(30) / 30, 'same')
    sweep = np.sin(2 * np.pi * np.cumsum(180 + 900 * x ** 2) / SR)
    return (nz * 0.10 + sweep * 0.05) * x ** 2.2
def boom():
    tl = np.arange(int(2.0 * SR)) / SR; nz = np.random.RandomState(9).randn(len(tl))
    crash = np.convolve(nz, [1, -1], 'same') * np.exp(-tl * 2.2) * 0.05
    return np.sin(2 * np.pi * (34 + 40 * np.exp(-tl * 6)) * tl) * np.exp(-tl * 2.0) * 0.55 + crash
def twinkle():
    out = np.zeros(int(0.8 * SR))
    for k, m in enumerate((88, 91, 95, 100)):
        tl = np.arange(int(0.5 * SR)) / SR; s = int(k * 0.07 * SR)
        out[s:s + len(tl)] += np.sin(2 * np.pi * note(m) * tl) * np.exp(-tl * 9) * 0.06
    return out
SFX = {'pop': pop, 'whoosh': whoosh, 'thud': thud, 'ding': ding, 'boing': boing, 'riser': riser, 'boom': boom, 'twinkle': twinkle}
def norm(w): return re.sub(r"[^a-z0-9]", '', w.lower())
def word_time(line, word, nth=0):
    hits = [w for w in words_out if w['line'] == line and norm(w['w']) == norm(word)]
    if len(hits) <= nth: raise SystemExit(f'sfx: word "{word}" not found in line {line}: {lines[line]}')
    return hits[nth]['s']

for i in range(1, len(lines)):  # whoosh into every cut, pop when a label appears
    add(starts[i] - 0.45, whoosh())
    if labels[i]: add(starts[i] - 0.05, pop())
if labels[0]: add(starts[0] - 0.05, pop())
if end_secs: add(end_start, ding())
if MUS.get('transitions', True) and MUS:   # riser into every labelled section, boom on its downbeat
    for i in range(1, len(lines)):
        if labels[i]:
            r = riser(); add(CUTS[i] - len(r) / SR, r); add(CUTS[i], boom())
for c in script.get('sfx', []):   # {"type": "pop", "line": 3, "word": "eight"} or {"type": "thud", "line": 3, "at": "end"}
    if c.get('word'): base = word_time(c['line'], c['word'], c.get('nth', 0))
    else: base = starts[c['line']] if c.get('at', 'start') == 'start' else ends[c['line']]
    add(base + c.get('offset', 0), SFX[c['type']]())

if MUS:   # duck the music under the voice (fast attack, slow release), so it can sit louder between lines
    blk = int(0.01 * SR); nb = N // blk
    rms = np.sqrt((voice[:nb * blk].reshape(nb, blk) ** 2).mean(axis=1)); ref = np.percentile(rms[rms > 0.01], 80) if (rms > 0.01).any() else 1
    lvl = np.clip(rms / ref, 0, 1); env = np.zeros(nb); cur = 0.0
    for k in range(nb):
        cur += (lvl[k] - cur) * (0.5 if lvl[k] > cur else 0.04); env[k] = cur
    gain = 1 - float(MUS.get('duck', 0.6)) * np.interp(np.arange(N) / blk, np.arange(nb), env)
    music = music * gain * float(MUS.get('level', 1.0))
mix = np.tanh((voice + music * 0.55 + sfx) * 1.1) * 0.9
with wave.open('audio.wav', 'w') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print(f'duration {total:.2f}s  lines {len(lines)}')
for i, (s, e) in enumerate(zip(starts, ends)): print(f'  line {i}: {s:6.2f} -> {e:6.2f}  {lines[i]}')
