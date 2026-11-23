#!/usr/bin/env bash
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Sai Akash Neela — https://github.com/SaiAkashNeela/cartoon-short-skill
# Create a render project: copies the engine (+ an example episode) and installs three.js.
# Usage: new_project.sh <project_dir> [example_name]   (example defaults to stopped-sleeping)
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
DIR="${1:?usage: new_project.sh <project_dir> [example]}"; EX="${2:-stopped-sleeping}"
mkdir -p "$DIR"/{vo_raw,vo,stills}
cp "$SKILL"/engine/{scene.html,render.mjs,audio.py,package.json} "$DIR"/
[ -f "$DIR/script.json" ] || python3 - "$SKILL/examples/$EX/script.json" "$DIR/script.json" <<'PY'
import json, sys  # copy the example script without its "brand" block: brand new videos with the user's own channel
s = json.load(open(sys.argv[1])); s.pop('brand', None); json.dump(s, open(sys.argv[2], 'w'), indent=1, ensure_ascii=False)
PY
[ -f "$DIR/episode.js" ] || cp "$SKILL/examples/$EX/episode.js" "$DIR/"
cd "$DIR" && npm install --silent --no-audit --no-fund >/dev/null
node -e "require('playwright')" 2>/dev/null || echo "NOTE: playwright not importable here — run: npm i playwright && npx playwright install chromium"
command -v ffmpeg >/dev/null || echo "NOTE: ffmpeg missing"
python3 -c "import numpy" 2>/dev/null || echo "NOTE: python numpy missing (pip install numpy)"
echo "project ready: $DIR"
