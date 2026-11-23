#!/usr/bin/env bash
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Sai Akash Neela — https://github.com/SaiAkashNeela/cartoon-short-skill
# Free offline fallback voice (Piper). Writes vo_raw/<i>.wav for every line in script.json.
# Usage: tts_piper.sh <project_dir> [voice]   voice default: en_US-ryan-high
set -euo pipefail
cd "${1:?usage: tts_piper.sh <project_dir> [voice]}"; V="${2:-en_US-ryan-high}"
python3 -c "import piper" 2>/dev/null || pip install -q piper-tts
CACHE="$HOME/.cache/piper-voices"; mkdir -p "$CACHE" vo_raw
IFS=- read -r LOC NAME QUAL <<< "$V"; LANG2="${LOC%%_*}"
for f in "$V.onnx" "$V.onnx.json"; do
  [ -s "$CACHE/$f" ] || curl -sSL -o "$CACHE/$f" "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/$LANG2/$LOC/$NAME/$QUAL/$f"
done
# each cast member can have its own voice: script.json "cast": { "doctor": { "voices": { "piper": "en_US-lessac-high" } } }
python3 - "$CACHE" "$V" <<'PY'
import json, os, subprocess, sys
cache, default = sys.argv[1], sys.argv[2]
s = json.load(open('script.json')); cast = s.get('cast') or {}
def model(v):
    loc, name, qual = v.split('-'); lang = loc.split('_')[0]
    for f in (v + '.onnx', v + '.onnx.json'):
        if not os.path.exists(os.path.join(cache, f)):
            subprocess.run(['curl', '-sSL', '-o', os.path.join(cache, f), f'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/{lang}/{loc}/{name}/{qual}/{f}'], check=True)
    return os.path.join(cache, v + '.onnx')
for i, l in enumerate(s['lines']):
    c = cast.get(l.get('speaker')) or {}
    v = (c.get('voices') or {}).get('piper') or c.get('piper') or default
    subprocess.run([sys.executable, '-m', 'piper', '-m', model(v), '-f', f'vo_raw/{i}.wav', '--length-scale', '0.95', '--sentence-silence', '0.25'],
                   input=l['text'].encode(), check=True, capture_output=True)
    print('voiced line', i, 'with', v)
PY
