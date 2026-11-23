# Voices

The pipeline needs one audio file per script line in `<proj>/vo_raw/<i>.wav` (or `.mp3`). `prep_voice.sh` trims
silence and converts to `vo/<i>.wav`; `audio.py` peak-normalises the voice, so input loudness doesn't matter.

## Cartesia (preferred)

Requires the Cartesia MCP connector. Generating a line spends a small amount of the user's Cartesia credit, so
voice the script only once it has been approved.

Per line:
```
text_to_speech(
  transcript = line.text,
  voice_id   = "23112795-d54e-4560-9568-791a87c30201",      # Darius, "Engaging Narrator" (US, husky storyteller)
  model_id   = default (sonic-3.5),
  language   = "en",
  emotion    = line.emotion,                                 # e.g. curious, content, neutral, mysterious, calm, excited, sad
  output_format = { container: "wav", encoding: "pcm_s16le", sample_rate: 44100 }
)
```
The hosted connector returns `download_url` (valid 24 h) rather than a local file:
`curl -sSL -o <proj>/vo_raw/<i>.wav "<download_url>"`. Fire all lines' calls in parallel.

Other narrators that suit this format (search with `list_voices(language="en", q="narrat")`):
- Romeo `f688c0a6-dddd-48ba-8246-c099d494a162`: calm, smooth storyteller
- Damon `dbfa416f-d5c3-4006-854b-235ef6bdf4fd`: deep documentary gravitas
- Quentin `5568a7df-e5ab-4442-9fae-2e9ba1b15ad8`: polished British narrator

`speed` (0.6–1.5) tightens pacing. Shorts generally do better slightly fast (1.05–1.1).

## Piper (free, offline fallback)

`scripts/tts_piper.sh <proj> [voice]` installs `piper-tts` if needed, downloads the voice model once to
`~/.cache/piper-voices` (from huggingface.co, ~120 MB for `en_US-ryan-high`), and voices every line. Quality is
decent but flatter than Cartesia. Other voices: `en_US-lessac-high`, `en_GB-alan-medium`, and so on (any name from
the rhasspy/piper-voices repo).
