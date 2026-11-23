#!/usr/bin/env bash
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
python3 - "$CACHE/$V.onnx" <<'PY'
import json, subprocess, sys
for i, l in enumerate(json.load(open('script.json'))['lines']):
    subprocess.run([sys.executable, '-m', 'piper', '-m', sys.argv[1], '-f', f'vo_raw/{i}.wav', '--length-scale', '0.95', '--sentence-silence', '0.25'],
                   input=l['text'].encode(), check=True, capture_output=True)
    print('voiced line', i)
PY
