#!/usr/bin/env bash
# Trim leading/trailing silence from vo_raw/<i>.wav (any format ffmpeg reads) into vo/<i>.wav (mono 44.1k s16).
# Usage: prep_voice.sh <project_dir>
set -euo pipefail
cd "${1:?usage: prep_voice.sh <project_dir>}"; mkdir -p vo
n=$(python3 -c "import json;print(len(json.load(open('script.json'))['lines']))")
for ((i=0;i<n;i++)); do
  src=$(ls vo_raw/$i.* 2>/dev/null | head -n1) || true
  [ -n "${src:-}" ] || { echo "missing vo_raw/$i.(wav|mp3)"; exit 1; }
  ffmpeg -y -loglevel error -i "$src" -af "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,apad=pad_dur=0.05" -ac 1 -ar 44100 -c:a pcm_s16le "vo/$i.wav"
  printf "line %d: %.2fs\n" $i "$(ffprobe -v error -show_entries format=duration -of csv=p=0 vo/$i.wav)"
done
