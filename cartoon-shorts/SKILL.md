---
name: cartoon-shorts
license: MIT (see LICENSE). Copyright (c) 2026 Sai Akash Neela
metadata:
  author: Sai Akash Neela
  homepage: https://github.com/SaiAkashNeela/cartoon-short-skill
description: Make animated "what if" / explainer videos starring a toon-shaded 3D cartoon character with a big expressive face, any supporting cast the story needs (doctors, bosses, friends, crowds, with optional lip-synced dialogue) and story-matched locations, rendered entirely in code with Three.js + headless Chromium + ffmpeg (no Remotion, no AI video) — vertical Shorts/TikToks/Reels up to 90 s, or landscape YouTube videos of 3–5 minutes, plus thumbnails, captions and a full YouTube publishing playbook (search-optimised titles, descriptions and tags, translations, uploads). Use this whenever the user wants a cartoon short or video, a faceless animated story, a "what if you..." / "what happens when..." video, a stickman-style explainer, "another episode" of their series, or wants such a video published or optimised on YouTube, even if they only give a topic like "do one about drinking only coffee for a week".
---

# Cartoon Shorts

Turn a topic into a finished 1080×1920 MP4: a stylized field-and-tree world, a cartoon character whose
face is redrawn every frame (brows, eyes, eye-bags, mouth, sweat, blush), camera moves per shot,
time-of-day lighting per shot, narrator voice, music, SFX, and pop-in captions with the spoken word
highlighted. Everything is deterministic code, so the same character looks identical in every episode.

The skill lives in this folder:
- `engine/` — the reusable renderer (`scene.html`), frame capture (`render.mjs`), audio/timeline builder (`audio.py`)
- `scripts/` — `new_project.sh`, `tts_piper.sh`, `prep_voice.sh`, `stills.sh`, `render_all.sh`
- `examples/` — complete working episodes (`script.json` + `episode.js`) to copy from: `stopped-sleeping` (one character,
  one set), `coffee-week` (five sets, props, word-anchored SFX) and `doctor` (a supporting cast, a street crowd, and two
  characters who speak with lip sync), `universe` (a 3-minute landscape video: the `cosmos` set, on-screen facts,
  labels, measure lines and a beat-synced score)
- `references/episode-api.md` — **read before writing `episode.js`**: poses, face params, envs, props, cameras
- `references/youtube.md` — publishing: formats, search-first titles/descriptions/tags, captions, chapters, 10-language
  localisations, thumbnails, made-for-kids, quota
- `references/voices.md` — choosing a TTS provider (connected tools, cloud APIs, local models, own recordings), recipes, voices
- `references/cast.jpg`, `sets.jpg`, `poses.jpg`, `faces.jpg`, `outfits.jpg`, `environments.jpg` — rendered sheets of every location, pose,
  expression, outfit preset and lighting look; view them when choreographing

## The character: Bobble

The default character is **Bobble** (named after his bobble hat): round white head, yellow beanie, blue hoodie (the `Classic` look), created by
Sai Akash Neela as the mascot of the **Bobble Explains** channel. A series is recognised by its character in the first
half-second, so keep one character, one outfit and one narrator voice across a user's episodes. Use Bobble as-is, or
give a user's own series its own look (`export const character = {...}`, presets in `references/outfits.jpg`).
The narration talks *about* "you"; the character acts it out.

## Branding: watermark and end card

Add a `brand` block to `script.json` to stamp the user's channel on the video:
```json
"brand": { "handle": "@TheirHandle", "name": "Their Channel", "cta": "Follow for more what-ifs", "endCard": 2.4 }
```
`handle` adds a small watermark in the top-right safe zone. `endCard` (seconds) appends an end card after the tail: the
character's avatar, the channel name, the handle and a call-to-action, with a chime. Leave out `brand` for no branding.
Only brand videos with a channel the user owns or names. The examples carry `@BobbleExplains`, which belongs to the
author; never copy it into someone else's video. `new_project.sh` strips it from the copied example for that reason.

## Format: Short or regular video

Decide this first, with the user if they haven't said:
- **Short** (`"format": "short"`, the default): vertical 1080×1920, **20–90 s**, for YouTube Shorts / TikTok / Reels.
  One escalating idea, 4–14 lines.
- **Regular video** (`"format": "video"`): landscape 1920×1080, **3–5 minutes**, lands in the channel's Videos tab and
  search. It needs a real structure: hook in the first 5–10 s, 4–6 sections each starting with a labelled line (labels
  become chapters), a re-hook every 30–45 s, a payoff and a short outro. In landscape, place cameras about 35–40 %
  closer than the vertical examples (the frame is much wider), and use the extra width for two-shots and groups.
  `episode.js` gets `FORMAT`, `W` and `H` in its context to adapt.
`audio.py` warns when a Short runs past 90 s or a video is under a minute. Rendering takes about 1–4 s per frame
per worker, so a 5-minute video (9,000 frames) is roughly 1–2 hours: run it in the background.

## The model: one shot per narrated line

A Short is 4–14 lines (20–90 s, vertical); a regular video is roughly 25–45 lines (3–5 min, landscape). Each line is one shot: the camera cuts (with a whoosh + flash + zoom punch)
0.3 s before the line starts. Per shot you choose **where it happens (set)**, the time of day (env), keyframe the
character's pose and face, and give a camera move. Keyframes can be anchored to the exact moment a word is spoken (`at(line, 'word')`),
which is what makes the comedy timing land — e.g. the character nods off exactly on "switching off".

## Cast: put the other people in the story on screen

If the story involves other people (a doctor, a boss, a friend, parents, a crowd), show them. A beat like "the doctor
tells you…" lands much harder with a doctor in the frame. Declare them once in `episode.js` (`export const cast = {...}`)
and add them to any shot with `cast: { name: { pose, face, update } }`. There's no limit on the number of people; crowds
come from `{ random: <seed> }` looks. Bobble (the `hero`) stays the protagonist; leave out a shot's `pose` to cut away
from him entirely.

- **Looks:** each person is a look: outfit colours, `top: 'hoodie' | 'shirt'`, `coat` (lab coat / scrubs colour),
  `tie`, `hat: 'beanie' | 'cap' | 'hair' | 'longHair' | 'bun' | 'none'`, `hair` colour, `glasses`, `mustache`, `lashes`,
  and `height` (0.7 for a kid). Make roles readable at a glance: white coat + glasses = doctor, shirt + tie = boss,
  small + cap = kid. `references/cast.jpg` shows examples; `episode-api.md` lists every field.
- **Who talks:** narration is the default. When a character should say something, write the line in their voice and
  set `"speaker": "<name>"` on it. They get their own voice (`script.json` `"cast": { "<name>": { "name": "Dr. Patel",
  "voices": { "<provider>": "…" } } }`), their mouth moves with the audio automatically, and a name tag shows under the captions.
  Keep most lines as narration; one or two spoken lines per video is plenty.
- **Framing:** a portrait frame is narrow. Two people: stand them on `MARK.left` / `MARK.right` and shoot from z≈11. Groups:
  use `farLeft`/`farRight` and the `back*` marks and shoot from z≈14, or stagger people in depth. Turn people toward
  each other with `facing(from, to)`, which only half-turns them so faces stay readable. **Always show the speaker's
  face**: frame them three-quarter or front-on, never from behind.

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
| `cosmos` | astronomy explainers: a to-scale journey (Earth and Moon, Sun, solar system, Voyager 1, nearest star, Milky Way, Andromeda, cosmic web), with on-screen facts, labels and measure lines |
| `studio` | not for story beats: a plain backdrop (`backdrop: '#hex'`) for thumbnails, channel art and cut-outs |

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
- Total 20–90 s (4–14 lines). 30–60 s suits most topics; go longer only when the story has enough beats to escalate,
  because a long video with a flat middle loses viewers. Plain spoken English; facts should be true (Shorts get
  fact-checked in the comments).
- Optional per line: `label` (big pop-in text like "DAY 3"), `mood` (`bright` | `calm` | `eerie` | `tense` | `space` |
  `wonder`, drives the music), `energy` (0–3, how busy the music is under this line; needs a `music` block),
  `emotion` (a delivery hint for providers that support one), `speaker` (a cast name: that character says the line, lip-synced).
  Optional `sfx` cues: `{type: pop|whoosh|thud|ding|boing|riser|boom|twinkle, line, at: start|end, offset}`, or anchored
  to a spoken word: `{type: "pop", line: 3, word: "eight"}`. Optional `cast` metadata for
  speakers: `{ "<name>": { "name": "Shown on the tag", "voices": { "<provider>": "<voice for that provider>" } } }`.

**Music that hits the cuts.** Add `"music": {"bpm": 96, "sync": true}` to `script.json` (every regular video should).
`audio.py` then moves each cut onto the beat and each labelled section onto a downbeat, builds the score in layers from
each line's `energy` (0 pad, 1 + arpeggio, 2 + bass and hats, 3 + kick and clap), restarts the chord progression at
each section, plays a riser, a half-beat drop-out and a boom into every section, and ducks the music under the voice.
Start quiet (energy 0–1 for the hook), build to 3 at the biggest reveal, and come back down for the ending. Optional keys:
`duck` (0–1, default 0.6), `level` (default 1.0), `transitions` (false turns off the automatic riser and boom). Without a
`music` block the original mood score plays and timing is unchanged.

Copy the shape of `examples/stopped-sleeping/script.json`. Show the user the script before spending voice credits
if they haven't already approved the topic/wording — it's cheap to change now and expensive after rendering.

### 2. Create the project
```bash
$SKILL/scripts/new_project.sh <proj>          # copies engine + example, npm installs three.js
```
Then overwrite `<proj>/script.json` with your script (keep the example `episode.js` until step 4).

### 3. Voice → `vo_raw/<i>.wav`, then timeline
The pipeline doesn't care which text-to-speech made the audio. Its only contract is **one audio file per script line**,
`<proj>/vo_raw/<i>.wav` (or `.mp3`, any sample rate), where `<i>` is the line's index. So use whatever the user has.

**Ask the user which TTS to use** before generating any audio, unless they've already said so in this conversation or
the project's `script.json` names a provider (`"voice": { "provider": … }`). Offer what fits their setup:
- a **connected TTS tool** in this session (e.g. a Cartesia or ElevenLabs connector): call it once per line, then download
  each result into `vo_raw/`;
- a **cloud API they have a key for**: ElevenLabs, OpenAI, Deepgram, Azure, Google or Amazon Polly. Run
  `python3 $SKILL/scripts/voice_lines.py <proj> --provider <name>`, which reads the key from an environment variable;
- a **free local model**: Piper (`$SKILL/scripts/tts_piper.sh <proj>`), Kokoro, or any other local TTS through
  `voice_lines.py --provider command --cmd '… {text} … {out} …'`;
- **their own recordings**: ask them to drop `0.wav, 1.wav, …` into `vo_raw/`.

Never ask for an API key in chat or write one into a file. Keys stay in the user's environment or secret store.
Paid providers charge per generation, so voice the script only after it's approved. Record the choice in
`script.json` (`"voice": { "provider": "elevenlabs", "voices": { "elevenlabs": "<narrator id>" } }`, and the same
`voices` map under each speaking cast member) so later episodes keep the same narrator and character voices.
Lines with a `speaker` must use that character's voice, picked to clearly differ from the narrator (gender, age,
accent). Provider recipes, voice suggestions and licence notes are in `references/voices.md`.

```bash
SPEED=1.08 $SKILL/scripts/prep_voice.sh <proj>   # trims silence (+ optional pitch-safe speed-up) -> vo/<i>.wav
cd <proj> && python3 audio.py           # -> timeline.json (word timings, labels) + audio.wav (voice+music+sfx)
```
Stay within 90 s; if the narration runs long, re-run `prep_voice.sh` with `SPEED=1.05–1.1` rather than re-voicing.
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
10–20 min and a 90 s video roughly 45–60 min; more people and indoor sets cost a little more per frame. Run it in the background and wait on its completion rather than polling. Afterwards spot-check a
few frames from the MP4 (`ffmpeg -ss <t> -i final.mp4 -frames:v 1 x.jpg`) and deliver the file (SendUserFile when available).

### 7. Thumbnail, captions, publish (optional)
- `python3 $SKILL/scripts/captions.py <proj>` → `captions.srt` (and `chapters.txt` for regular videos).
- `python3 $SKILL/scripts/thumbnail.py <proj> --time <s> --text "2–4|WORDS"` → 1280×720 thumbnail from a clean frame
  (mainly for regular videos; the Shorts feed uses a frame picked in the YouTube app).
- If a YouTube tool is available (a YouTube connector, or this repo's `youtube-mcp`), follow `references/youtube.md`:
  draft the search-first title, description and tags, show them to the user, then upload **private**, add captions,
  translations in 10 languages, the thumbnail and the playlist. The user makes it public. Without such tools, hand the user
  the metadata, `captions.srt`, `chapters.txt` and the thumbnail to add in YouTube Studio.

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
