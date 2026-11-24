#!/usr/bin/env bash
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Sai Akash Neela — https://github.com/SaiAkashNeela/cartoon-short-skill
# Briefly host a file at a public URL from a branch of a public GitHub repo you own, for upload tools that fetch
# from a URL (e.g. a hosted YouTube connector). The branch is always a single orphan commit that is force-pushed,
# so the video never stays in the repo's history: `reset` replaces it with a README-only commit.
#
#   host_tmp.sh put   <owner/repo> <branch> <file>   -> prints the raw URL (pinned to the commit, so no stale cache)
#   host_tmp.sh reset <owner/repo> <branch>          -> the branch holds only a README again
#
# Use a dedicated branch (never main). Anyone can download the file while it is up, so reset straight after the upload.
# Git author comes from GIT_AUTHOR_NAME/GIT_AUTHOR_EMAIL or your git config. GitHub rejects files over 100 MB.
set -euo pipefail
cmd="${1:?usage: host_tmp.sh put|reset <owner/repo> <branch> [file]}"; repo="${2:?owner/repo}"; branch="${3:?branch}"
[ "$branch" = main ] || [ "$branch" = master ] && { echo "refusing to force-push $branch"; exit 1; }
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
git -C "$work" init -q && git -C "$work" checkout -q --orphan "$branch"
printf 'Temporary hosting for uploads. A file appears here for a few minutes, then this branch is reset.\n' > "$work/README.md"
if [ "$cmd" = put ]; then
  f="${4:?file}"; [ -f "$f" ] || { echo "no such file: $f"; exit 1; }
  [ "$(wc -c < "$f")" -lt 100000000 ] || { echo "file is over GitHub's 100 MB limit"; exit 1; }
  cp "$f" "$work/"; msg="Temporary upload: $(basename "$f")"
else msg="Reset upload branch (no files)"; fi
git -C "$work" add -A && git -C "$work" commit -qm "$msg"
pushed=0
for i in 1 2 3 4; do git -C "$work" push -q --force "https://github.com/$repo" "$branch" && { pushed=1; break; } || sleep $((i * 2)); done
[ "$pushed" = 1 ] || { echo "push to $repo:$branch failed (no push access?)" >&2; exit 1; }
if [ "$cmd" = put ]; then
  url="https://raw.githubusercontent.com/$repo/$(git -C "$work" rev-parse HEAD)/$(basename "$f")"
  for i in $(seq 1 20); do [ "$(curl -s -o /dev/null -w '%{http_code}' -r 0-0 "$url")" = 206 ] && break; sleep 3; done
  echo "$url"
else echo "reset $repo:$branch"; fi
