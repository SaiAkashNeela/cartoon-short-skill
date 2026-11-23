#!/usr/bin/env bash
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Sai Akash Neela — https://github.com/SaiAkashNeela/cartoon-short-skill
# Render every frame in parallel chunks, concatenate, and mux with audio.wav.
# Usage: [MAX_MB=95] render_all.sh <project_dir> [out.mp4] [workers]
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
# keep the file under MAX_MB (default 95) so it fits GitHub-hosted uploads (100 MB file limit); YouTube re-encodes anyway
MAX_MB="${MAX_MB:-95}"
if [ "$(wc -c < "$OUT")" -gt $(( MAX_MB * 1000000 )) ]; then
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")
  vk=$(python3 -c "print(int($MAX_MB * 8000 * 0.94 / $dur - 192))")   # kbit/s for video, leaving room for audio + container
  echo "$(( $(wc -c < "$OUT") / 1000000 )) MB is over ${MAX_MB} MB: re-encoding video at ${vk} kbit/s"
  ffmpeg -y -loglevel error -i "$OUT" -c:v libx264 -preset slow -b:v "${vk}k" -maxrate "$(( vk * 3 / 2 ))k" -bufsize "$(( vk * 2 ))k" \
    -pix_fmt yuv420p -c:a copy -movflags +faststart "$(dirname "$OUT")/fit_$(basename "$OUT")" && mv "$(dirname "$OUT")/fit_$(basename "$OUT")" "$OUT"
fi
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height -of compact "$OUT"
echo "done: $(pwd)/$OUT"
