# Voices: bring your own TTS

The pipeline is TTS-agnostic. All it needs is **one audio file per script line** in `<proj>/vo_raw/`, named by line index
(`0.wav`, `1.mp3`, …), in any format and at any sample rate ffmpeg reads. `prep_voice.sh` trims the silence and normalises
the format, and `audio.py` peak-normalises the loudness. So any provider works, and so do recordings of a real person.

## Contents
1. Ask first, then remember the choice
2. Options at a glance
3. Recipes (connected tools, `voice_lines.py`, Piper, Kokoro, own recordings)
4. Voices for characters (dialogue)
5. Licences and costs

## 1. Ask first, then remember the choice

Ask the user which TTS they want before generating audio, unless the conversation or `script.json` already says.
Then record it, so the next episode sounds the same:
```json
"voice": { "provider": "elevenlabs", "voices": { "elevenlabs": "<narrator voice id>" } },
"cast":  { "doctor": { "name": "Dr. Patel", "voices": { "elevenlabs": "<doctor voice id>" } } }
```
Voice ids only mean something to one provider, which is why they're stored per provider.

## 2. Options at a glance

| Option | Good for | Needs |
|---|---|---|
| Connected TTS tool (Cartesia, ElevenLabs, … connector) | best quality with no setup, when one is connected | the connector; uses the user's credits |
| ElevenLabs API | very expressive narration, huge voice library | `ELEVENLABS_API_KEY` |
| OpenAI TTS | simple, cheap, good default voices | `OPENAI_API_KEY` |
| Deepgram Aura | fast, natural conversational voices | `DEEPGRAM_API_KEY` |
| Azure Speech | many languages and neural voices | `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` |
| Google Cloud TTS | many languages, WaveNet/Neural2 voices | `gcloud` login or `GOOGLE_ACCESS_TOKEN` |
| Amazon Polly | AWS users | a configured `aws` CLI |
| Piper (local, bundled script) | free, offline, no account | ~60–120 MB model download per voice |
| Kokoro (local) | free, offline, very natural for its size | `pip install kokoro soundfile` |
| Own recordings | a real narrator, the user's own voice | a microphone |

## 3. Recipes

**Connected TTS tool.** Call its text-to-speech tool once per line (in parallel). Ask for WAV or MP3 at 44.1 kHz where it
lets you choose, and pass the line's `emotion` if it supports one. Save each result as `vo_raw/<i>.<ext>`: some
connectors return a local file, others a download link (`curl -sSL -o vo_raw/<i>.wav "<url>"`). The examples in this repo
were voiced this way with Cartesia (narrator *Darius*, an engaging storyteller voice).

**Cloud APIs with `scripts/voice_lines.py`.** One command voices every line, picking narrator and character voices from
`script.json`. Keys come only from environment variables:
```bash
export ELEVENLABS_API_KEY=…            # set by the user in their own shell or secret store, never pasted into chat
python3 $SKILL/scripts/voice_lines.py <proj> --provider elevenlabs --voice <narrator_id> --cast-voice doctor=<id>
python3 $SKILL/scripts/voice_lines.py <proj> --provider openai --voice ash          # gpt-4o-mini-tts by default
python3 $SKILL/scripts/voice_lines.py <proj> --provider azure  --voice en-US-GuyNeural
python3 $SKILL/scripts/voice_lines.py <proj> --provider google --voice en-US-Neural2-D
python3 $SKILL/scripts/voice_lines.py <proj> --provider polly  --voice Matthew
python3 $SKILL/scripts/voice_lines.py <proj> --provider deepgram --voice aura-2-thalia-en
python3 $SKILL/scripts/voice_lines.py <proj> --provider openai --dry-run           # show the requests without sending
python3 $SKILL/scripts/voice_lines.py <proj> --provider openai --only 3            # re-voice just line 3
```
**Any other TTS** (a local model, a CLI, a company endpoint) goes through `--provider command`. The template gets
`{text}`, `{out}` and `{voice}` substituted (shell-quoted) and must write the audio to `{out}`:
```bash
python3 $SKILL/scripts/voice_lines.py <proj> --provider command --ext wav \
  --cmd 'echo {text} | python3 -m piper -m ~/.cache/piper-voices/en_US-ryan-high.onnx -f {out}'
```

**Piper (bundled).** `$SKILL/scripts/tts_piper.sh <proj> [voice]` installs `piper-tts`, downloads the voice once to
`~/.cache/piper-voices`, and voices every line. A speaking cast member uses `cast.<name>.voices.piper` (e.g.
`en_US-lessac-high`). Browse voices in the rhasspy/piper-voices repository on Hugging Face.

**Kokoro (local).** Write a few lines of Python with the `kokoro` package (`KPipeline(lang_code='a')`, a voice such as
`af_heart` or `am_michael`), save each line with `soundfile` to `vo_raw/<i>.wav`, or wrap it in a small CLI and use
`--provider command`. Check the project's README for the current API.

**Own recordings.** Ask the user to record each line separately, in order, as `vo_raw/0.wav`, `vo_raw/1.wav`, … A phone
voice memo is fine. Leave a breath between sentences, because captions are timed from the pauses.

## 4. Voices for characters (dialogue)

Lines with `"speaker": "<name>"` are spoken by that cast member and lip-synced to them. Give each speaking character a voice
that's clearly different from the narrator (gender, age, accent, energy), matching the role: a calm older doctor, an
excitable kid, a gruff boss. Keep one voice per character across episodes. `voice_lines.py` stops with a clear message if a
speaking character has no voice for the chosen provider, instead of quietly reusing the narrator's.

## 5. Licences and costs

- Hosted providers bill per character or second and set their own terms for commercial use and monetised content.
  Check the user's plan before publishing.
- Local models carry their own licences: Piper's code is MIT but **each voice model has its own licence** (see its model
  card), and Kokoro's weights are Apache-2.0. Some popular open models (e.g. Coqui XTTS) are **non-commercial only**.
- Only clone or imitate a real person's voice with their permission.
