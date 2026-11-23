#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Sai Akash Neela — https://github.com/SaiAkashNeela/cartoon-short-skill
"""Write YouTube-ready captions (and chapters) from a project's timeline.json.

    python3 captions.py <proj>        -> <proj>/captions.srt  and, for "format": "video", <proj>/chapters.txt

Captions are cut at sentence ends (and at commas once a cue has 3+ words), max 7 words, never overlap, and a lone
trailing word is merged back into its sentence. Lines spoken by a cast member start with their name tag ("DR. PATEL: …").
Chapters use each line's `label` (e.g. "DAY 3") as a chapter title; YouTube needs the first at 00:00 and at least 3,
each 10 s or longer, which this enforces. Paste chapters.txt into the description of a regular video.
"""
import json, re, sys

proj = sys.argv[1] if len(sys.argv) > 1 else '.'
tl = json.load(open(f'{proj}/timeline.json'))
words, names, spk = tl['words'], tl.get('speakerNames') or {}, tl.get('speakers') or []

def ts(t):
    h, r = divmod(max(0.0, t), 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s % 1) * 1000)) % 1000:03d}"

cues, cur = [], []
for i, w in enumerate(words):
    cur.append(w); nxt = words[i + 1] if i + 1 < len(words) else None
    if (len(cur) >= 7 or re.search(r'[.?!…]$', w['w']) or (re.search(r'[,;:]$', w['w']) and len(cur) >= 3)
            or not nxt or nxt['line'] != w['line']):
        cues.append(cur); cur = []
merged = []
for c in cues:   # merge a stranded one-word continuation back into the cue before it
    if merged and len(c) == 1 and c[0]['line'] == merged[-1][-1]['line'] and not re.search(r'[.?!…]$', merged[-1][-1]['w']):
        merged[-1] = merged[-1] + c
    else:
        merged.append(c)
out, seen_line = [], set()
for i, c in enumerate(merged):
    line = c[0]['line']; text = ' '.join(w['w'] for w in c)
    who = spk[line] if line < len(spk) else None
    if who and line not in seen_line: text = f"{names.get(who, who).upper()}: {text}"
    seen_line.add(line)
    start, end = c[0]['s'], c[-1]['e'] + 0.25
    if i + 1 < len(merged): end = min(end, merged[i + 1][0]['s'] - 0.02)
    out.append(f"{i + 1}\n{ts(start)} --> {ts(end)}\n{text}\n")
open(f'{proj}/captions.srt', 'w').write('\n'.join(out))
print(f'captions.srt: {len(out)} cues')

if tl.get('format') == 'video':
    def mmss(t): t = int(t); return f"{t // 3600}:{t % 3600 // 60:02d}:{t % 60:02d}" if t >= 3600 else f"{t // 60}:{t % 60:02d}"
    chaps = [(0.0, 'Intro')]
    for st, lab in zip(tl['starts'], tl.get('labels') or []):
        if lab and st - 0.3 - chaps[-1][0] >= 10: chaps.append((max(0.0, st - 0.3), lab.title()))
    if len(chaps) >= 3:
        open(f'{proj}/chapters.txt', 'w').write('\n'.join(f"{mmss(t)} {name}" for t, name in chaps) + '\n')
        print(f'chapters.txt: {len(chaps)} chapters')
    else:
        print('no chapters: add a `label` to the lines that start each section (YouTube needs 3+ chapters of 10 s+)')
