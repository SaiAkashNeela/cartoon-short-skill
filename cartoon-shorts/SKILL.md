---
name: cartoon-shorts
license: MIT (see LICENSE). Copyright (c) 2026 Sai Akash Neela
metadata:
  author: Sai Akash Neela
  homepage: https://github.com/SaiAkashNeela/cartoon-short-skill
description: Make vertical 9:16 animated "what if" / explainer Shorts (YouTube Shorts, TikTok, Reels) starring a toon-shaded 3D cartoon character with a big expressive face, moving through story-matched locations (bedroom, kitchen, office, street, hospital, space, beach, field), narrated voiceover, procedural music/SFX and bold word-by-word captions — rendered entirely in code with Three.js + headless Chromium + ffmpeg (no Remotion, no AI video generation). Use this whenever the user wants a cartoon short, a faceless animated story video, a "what if you..." / "what happens when..." video, a stickman-style explainer, an animated narration with a character, or "another episode" of their cartoon series — even if they only give a topic like "do one about drinking only coffee for a week".
---

# Cartoon Shorts

Turn a topic into a finished 1080×1920 MP4: a stylized field-and-tree world, a cartoon character whose
face is redrawn every frame (brows, eyes, eye-bags, mouth, sweat, blush), camera moves per shot,
time-of-day lighting per shot, narrator voice, music, SFX, and pop-in captions with the spoken word
highlighted. Everything is deterministic code, so the same character looks identical in every episode.

The skill lives in this folder:
- `engine/` — the reusable renderer (`scene.html`), frame capture (`render.mjs`), audio/timeline builder (`audio.py`)
- `scripts/` — `new_project.sh`, `tts_piper.sh`, `prep_voice.sh`, `stills.sh`, `render_all.sh`
- `examples/stopped-sleeping/`, `examples/coffee-week/` — complete working episodes (`script.json` + `episode.js`) to copy from;
  the coffee one shows props (mug, cup pyramid), word-anchored SFX cues and a mug held through every pose
- `references/episode-api.md` — **read before writing `episode.js`**: poses, face params, envs, props, cameras
- `references/voices.md` — Cartesia voice details and the free Piper fallback
- `references/sets.jpg`, `poses.jpg`, `faces.jpg`, `outfits.jpg`, `environments.jpg` — rendered sheets of every location, pose,
  expression, outfit preset and lighting look; view them when choreographing

## The character: Beanie

The default character is **Beanie**: round white head, yellow beanie, blue hoodie (the `Classic` look), created by
Sai Akash Neela as the mascot of the **Beanie Explains** channel. A series is recognised by its character in the first
half-second, so keep one character, one outfit and one narrator voice across a user's episodes. Use Beanie as-is, or
give a user's own series its own look (`export const character = {...}`, presets in `references/outfits.jpg`).
The narration talks *about* "you"; the character acts it out.

## Branding: watermark and end card

Add a `brand` block to `script.json` to stamp the user's channel on the video:
```json
"brand": { "handle": "@TheirHandle", "name": "Their Channel", "cta": "Follow for more what-ifs", "endCard": 2.4 }
```
`handle` adds a small watermark in the top-right safe zone. `endCard` (seconds) appends an end card after the tail: the
character's avatar, the channel name, the handle and a call-to-action, with a chime. Leave out `brand` for no branding.
Only brand videos with a channel the user owns or names. The examples carry `@BeanieExplains`, which belongs to the
author; never copy it into someone else's video. `new_project.sh` strips it from the copied example for that reason.

## The model: one shot per narrated line

A video is 4–7 narrated lines. Each line is one shot: the camera cuts (with a whoosh + flash + zoom punch)
0.3 s before the line starts. Per shot you choose **where it happens (set)**, the time of day (env), keyframe the
character's pose and face, and give a camera move. Keyframes can be anchored to the exact moment a word is spoken (`at(line, 'word')`),
which is what makes the comedy timing land — e.g. the character nods off exactly on "switching off".

## Locations: match the set to the story

Viewers should see *where* each beat happens. A whole video in one place feels static, and a location change on each
cut is one of the cheapest ways to keep people watching. For every line, ask "where would this moment happen?"
and pick the set:

| set | use it for |
|---|---|
| `field` | outdoors, nature, walking, the default; the only set with the tree (and `props.treeEyes`) |
| `bedroom` | sleep, waking up, mornings, staying in, phones at night |
| `kitchen` | food, drinks, diets, cooking, anything you eat or drink |
| `office` | work, money, studying, screens, productivity, deadlines |
| `street` | the city, commuting, going out, crowds, night life |
| `hospital` | health consequences, the body breaking down, doctors, the "what actually happens" beat |
| `space` | space, planets, gravity, science, "what if Earth…" |
| `beach` | travel, summer, sun, heat, water, holidays |

Rules of thumb: change set when the story moves in time or place (Day 1 → Day 3), stay put for beats that continue
the same moment, pair set with env for mood (bedroom + night, kitchen + morning, street + storm), and save
`hospital` for the consequence beat. Two shots in a row in the same set are fine; a whole video in one set usually isn't.
`references/sets.jpg` shows every set; their props and safe camera framings are in `references/episode-api.md`.

The narrator is not the character (the script talks *about* "you"), so the mouth is animated by
expression keyframes, not lip-synced to the voice. Keep it that way unless the user wants the character to talk.

## Workflow

Use a project directory outside any git repo the user cares about (e.g. a temp or scratch directory). `$SKILL` below is this folder.

### 1. Write the script → `script.json`
Good Shorts scripts are short and visual:
- **Line 0 is the hook**, a question under ~3 s: "What if you just... stopped sleeping?"
- 3–5 escalation beats, each something the character can *physically show* (stretch smugly, nod off, recoil
  in fear, collapse). If a line has no visual action, rewrite it.
- A punchy closing line, then ~2.5 s of tail for the payoff animation.
- Total 20–45 s. Plain spoken English; facts should be true (Shorts get fact-checked in the comments).
- Optional per line: `label` (big pop-in text like "DAY 3"), `mood` (`bright` | `calm` | `eerie` | `tense`, drives
  the music), `emotion` (passed to Cartesia). Optional `sfx` cues: `{type: pop|whoosh|thud|ding|boing, line, at: start|end, offset}`.

Copy the shape of `examples/stopped-sleeping/script.json`. Show the user the script before spending voice credits
if they haven't already approved the topic/wording — it's cheap to change now and expensive after rendering.

### 2. Create the project
```bash
$SKILL/scripts/new_project.sh <proj>          # copies engine + example, npm installs three.js
```
Then overwrite `<proj>/script.json` with your script (keep the example `episode.js` until step 4).

### 3. Voice → `vo_raw/<i>.wav`, then timeline
- **Cartesia (preferred when the Cartesia MCP is connected):** one `text_to_speech` call per line with
  `output_format {container: wav, encoding: pcm_s16le, sample_rate: 44100}`, `language: en`, and the line's
  `emotion`; then `curl -sSL -o <proj>/vo_raw/<i>.wav <download_url>`. Default narrator: Darius
  `23112795-d54e-4560-9568-791a87c30201`. Details and alternatives in `references/voices.md`.
- **Free fallback:** `$SKILL/scripts/tts_piper.sh <proj>` (offline neural voice, ~120 MB model download once).

```bash
SPEED=1.08 $SKILL/scripts/prep_voice.sh <proj>   # trims silence (+ optional pitch-safe speed-up) -> vo/<i>.wav
cd <proj> && python3 audio.py           # -> timeline.json (word timings, labels) + audio.wav (voice+music+sfx)
```
Aim for 25–45 s; if the narration runs long, re-run `prep_voice.sh` with `SPEED=1.05–1.1` rather than re-voicing.
`audio.py` prints each line's start/end. Word timings come from detecting the pauses in each line and mapping them
to its punctuation, so punctuate the script the way it should be spoken.

### 4. Choreograph → `episode.js`
Read `references/episode-api.md`, then write one shot per line. Work from the story: for each line decide
*where it happens* (set), *what the character does*, *what face they make*, *what the light is*, and *where the camera is*. Anchor the key
beats to words with `at(line, 'word')`. Start from `examples/coffee-week/episode.js`: it moves through five sets, and its camera positions are known-good
framings.

### 5. Preview stills (always, before the full render)
```bash
$SKILL/scripts/stills.sh <proj> 1.2 5.5 10.6 16.9 26.5    # times in seconds -> <proj>/stills/sheet.jpg
```
Pick one or two times per shot, including the exact word-anchored beats. Look at the sheet and check:
the face is visible (not the beanie top or back of head), the character isn't cut off by the frame edge,
captions (they sit at ~62–72 % of the height) don't hide the key action, labels don't collide with the head,
and the expression reads at phone size. Fix and re-run — a still costs ~1 s, the full render costs minutes.

### 6. Render
```bash
$SKILL/scripts/render_all.sh <proj> final.mp4      # parallel workers, then mux with audio.wav
```
Rendering is CPU WebGL (SwiftShader): ~1–4 s per frame per worker, so a 30 s video (900 frames) takes roughly
10–20 min. Run it in the background and wait on its completion rather than polling. Afterwards spot-check a
few frames from the MP4 (`ffmpeg -ss <t> -i final.mp4 -frames:v 1 x.jpg`) and deliver the file (SendUserFile when available).

## Gotchas
- `episode.js` must return exactly as many shots as `script.json` has lines; the page logs an error otherwise.
- Changing the script or voice changes all timings: re-run `prep_voice.sh` + `audio.py`, and prefer word anchors over
  hard-coded seconds so the choreography survives that.
- `at()` matches the start of a word, case-insensitive, punctuation and apostrophes ignored (`at(2, 'havent')` finds "haven't").
  A missing word throws, and the renderer exits immediately with the message — read it and fix the anchor.
  Use the third argument for the nth occurrence.
- Poses blend with smoothstep between keyframes; a "snap" (jolt, flinch) is just two keyframes ~0.15–0.2 s apart.
- When the character turns (`ry`), the face turns with the head — for walks use `ry: ±1.2` (three-quarter) so the face stays readable.
- Captions use the system font Inter (weight 800); if it's missing the browser falls back to a generic sans.
- Keep a series' character consistent; when designing new ones, make them original. Don't recreate another channel's mascot.
