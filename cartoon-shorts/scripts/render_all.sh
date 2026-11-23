#!/usr/bin/env bash
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Sai Akash Neela — https://github.com/SaiAkashNeela/cartoon-short-skill
# Render every frame in parallel chunks, concatenate, and mux with audio.wav.
# Usage: render_all.sh <project_dir> [out.mp4] [workers]
# Takes ~1-4 s/frame per worker on CPU (SwiftShader); run it in the background for long videos.
set -euo pipefail
cd "${1:?usage: render_all.sh <project_dir> [out.mp4] [workers]}"
OUT="${2:-final.mp4}"; W="${3:-$(( $(nproc) > 1 ? $(nproc) - 1 : 1 ))}"
N=$(python3 -c "import json;print(int(json.load(open('timeline.json'))['duration']*30))")
echo "rendering $N frames with $W workers"
pids=(); : > list.txt
for ((k=0;k<W;k++)); do
  a=$(( N*k/W )); b=$(( N*(k+1)/W ))
  node render.mjs frames $a $b "chunk$k.mp4" > "chunk$k.log" 2>&1 & pids+=($!)
  echo "file chunk$k.mp4" >> list.txt
done
fail=0; for p in "${pids[@]}"; do wait "$p" || fail=1; done
[ $fail -eq 0 ] || { echo "a render worker failed:"; tail -n 5 chunk*.log; exit 1; }
ffmpeg -y -loglevel error -f concat -safe 0 -i list.txt -i audio.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"
rm -f chunk*.mp4 chunk*.log list.txt
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height -of compact "$OUT"
echo "done: $(pwd)/$OUT"
