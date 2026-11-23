# cartoon-short-skill

A Claude skill that turns a topic into a finished vertical (1080×1920) animated Short: toon-shaded 3D world,
an expressive cartoon character, narrator voice, procedural music and SFX, and word-by-word captions. It's all
rendered in code with **Three.js + headless Chromium + ffmpeg**: no Remotion and no AI video generation.

Example output: *"What if you stopped sleeping?"* (27 s). The full episode is in `cartoon-shorts/examples/stopped-sleeping/`.

## Install

Copy the `cartoon-shorts/` folder into a skills directory, e.g. `~/.claude/skills/cartoon-shorts/`, or into a
project's `.claude/skills/`. Then ask Claude for something like *"make a what-if short about drinking only coffee for a week"*.

Requirements on the machine that renders: Node 18+, `ffmpeg`, Python 3 with `numpy`, and Playwright with Chromium
(`npm i playwright && npx playwright install chromium`, or set `CHROMIUM_PATH`). The voice comes from Cartesia
(MCP connector) or the free offline Piper fallback.

## Manual use

```bash
S=cartoon-shorts
$S/scripts/new_project.sh ~/my-short           # engine + example episode
# write ~/my-short/script.json, put voice lines in ~/my-short/vo_raw/0.wav, 1.wav, ...
#   (or generate them offline: $S/scripts/tts_piper.sh ~/my-short)
$S/scripts/prep_voice.sh ~/my-short
(cd ~/my-short && python3 audio.py)            # timeline.json + audio.wav
# write ~/my-short/episode.js (see cartoon-shorts/references/episode-api.md)
$S/scripts/stills.sh ~/my-short 1 5 10 15      # preview contact sheet
$S/scripts/render_all.sh ~/my-short final.mp4  # full render
```

## Layout

```
cartoon-shorts/
  SKILL.md                     workflow Claude follows
  engine/scene.html            Three.js renderer: set, character rig, procedural face, lighting, captions
  engine/render.mjs            headless Chromium frame capture -> ffmpeg
  engine/audio.py              word timings + procedural music/SFX mix
  scripts/                     new_project, tts_piper, prep_voice, stills, render_all
  references/episode-api.md    poses, face params, environments, cameras
  references/voices.md         Cartesia + Piper voice setup
  examples/stopped-sleeping/   complete example episode
```
