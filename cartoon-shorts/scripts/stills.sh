#!/usr/bin/env bash
# Render preview stills at given times and tile them into stills/sheet.jpg (look at it before the full render).
# Usage: stills.sh <project_dir> <t1> <t2> ...
set -euo pipefail
cd "${1:?usage: stills.sh <project_dir> <times...>}"; shift
node render.mjs stills "$@"
args=(); f=""; i=0
for t in "$@"; do args+=(-i "stills/t_$(printf '%.2f' "$t").jpg"); f+="[$i]"; i=$((i+1)); done
ffmpeg -y -loglevel error "${args[@]}" -filter_complex "${f}hstack=$i,scale=$((400*i)):-1" stills/sheet.jpg
echo "contact sheet: $(pwd)/stills/sheet.jpg"
