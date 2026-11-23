#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Sai Akash Neela — https://github.com/SaiAkashNeela/cartoon-short-skill
"""Voice every line of script.json with the user's own TTS, writing vo_raw/<i>.<ext> (the pipeline's only contract).

    python3 voice_lines.py <proj> --provider <name> [--voice V] [--model M] [--cmd TEMPLATE] [--only 0,3] [--dry-run]

Providers (API keys are read from environment variables, never from files or arguments):
  elevenlabs  ELEVENLABS_API_KEY        --voice <voice_id>        --model eleven_multilingual_v2 (default)
  openai      OPENAI_API_KEY            --voice alloy|ash|nova|…  --model gpt-4o-mini-tts (default)
  deepgram    DEEPGRAM_API_KEY          --voice aura-2-thalia-en (a Deepgram Aura model name)
  azure       AZURE_SPEECH_KEY, AZURE_SPEECH_REGION               --voice en-US-GuyNeural
  google      GOOGLE_ACCESS_TOKEN (or a logged-in gcloud)         --voice en-US-Neural2-D
  polly       the aws CLI, already configured                     --voice Matthew
  command     any local/other TTS:  --cmd 'my-tts --voice {voice} --out {out} --text {text}'
              ({text}, {out}, {voice} are substituted shell-quoted; the command must write the file at {out})
For Cartesia (via its MCP connector) or Piper (scripts/tts_piper.sh) use those routes instead.

Voices are provider-specific, so script.json stores them per provider:
  "voice": { "voices": { "elevenlabs": "<narrator id>", "openai": "ash" } },
  "cast":  { "doctor": { "name": "Dr. Patel", "voices": { "elevenlabs": "<id>", "openai": "onyx" } } }
Narrator lines use --voice, else voice.voices.<provider>, else the provider's default voice. A line with
"speaker": "<name>" uses --cast-voice <name>=<id>, else cast.<name>.voices.<provider>; if neither is set the script stops
rather than letting a character silently borrow the narrator's voice.
"""
import argparse, base64, json, os, shlex, subprocess, sys, urllib.request
from xml.sax.saxutils import escape


def http(url, headers, body, dry):
    if dry:
        shown = {k: ('***' if k.lower() in ('authorization', 'xi-api-key', 'ocp-apim-subscription-key') else v) for k, v in headers.items()}
        print('  POST', url, shown, (body if isinstance(body, str) else json.dumps(body))[:160]); return b''
    data = body.encode() if isinstance(body, str) else json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=120) as r: return r.read()
    except urllib.error.HTTPError as e:
        sys.exit(f'{url} -> HTTP {e.code}: {e.read()[:300].decode(errors="replace")}')


def need(var):
    v = os.environ.get(var)
    if not v: sys.exit(f'set {var} in the environment first (never paste keys into chat or files)')
    return v


def synth(provider, text, voice, model, out_base, args):
    """Returns the written file path."""
    if provider == 'elevenlabs':
        key = '***' if args.dry_run else need('ELEVENLABS_API_KEY')
        if not voice: sys.exit('ElevenLabs needs a voice id: --voice <id> or voice.voices.elevenlabs in script.json')
        audio = http(f'https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128',
                     {'xi-api-key': key, 'Content-Type': 'application/json'}, {'text': text, 'model_id': model or 'eleven_multilingual_v2'}, args.dry_run)
        ext = 'mp3'
    elif provider == 'openai':
        key = '***' if args.dry_run else need('OPENAI_API_KEY')
        audio = http('https://api.openai.com/v1/audio/speech', {'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
                     {'model': model or 'gpt-4o-mini-tts', 'voice': voice or 'alloy', 'input': text, 'response_format': 'wav'}, args.dry_run)
        ext = 'wav'
    elif provider == 'deepgram':
        key = '***' if args.dry_run else need('DEEPGRAM_API_KEY')
        audio = http(f'https://api.deepgram.com/v1/speak?model={voice or "aura-2-thalia-en"}&encoding=linear16&sample_rate=24000&container=wav',
                     {'Authorization': f'Token {key}', 'Content-Type': 'application/json'}, {'text': text}, args.dry_run)
        ext = 'wav'
    elif provider == 'azure':
        key = '***' if args.dry_run else need('AZURE_SPEECH_KEY'); region = os.environ.get('AZURE_SPEECH_REGION', 'eastus')
        ssml = f'<speak version="1.0" xml:lang="en-US"><voice name="{escape(voice or "en-US-GuyNeural")}">{escape(text)}</voice></speak>'
        audio = http(f'https://{region}.tts.speech.microsoft.com/cognitiveservices/v1',
                     {'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'riff-44100hz-16bit-mono-pcm',
                      'User-Agent': 'cartoon-shorts'}, ssml, args.dry_run)
        ext = 'wav'
    elif provider == 'google':
        tok = '***' if args.dry_run else (os.environ.get('GOOGLE_ACCESS_TOKEN') or subprocess.run(['gcloud', 'auth', 'print-access-token'], capture_output=True, text=True, check=True).stdout.strip())
        v = voice or 'en-US-Neural2-D'
        res = http('https://texttospeech.googleapis.com/v1/text:synthesize', {'Authorization': f'Bearer {tok}', 'Content-Type': 'application/json'},
                   {'input': {'text': text}, 'voice': {'languageCode': '-'.join(v.split('-')[:2]), 'name': v},
                    'audioConfig': {'audioEncoding': 'LINEAR16', 'sampleRateHertz': 44100}}, args.dry_run)
        audio = base64.b64decode(json.loads(res)['audioContent']) if res else b''
        ext = 'wav'
    elif provider == 'polly':
        ext = 'mp3'; out = f'{out_base}.{ext}'
        cmd = ['aws', 'polly', 'synthesize-speech', '--engine', model or 'neural', '--voice-id', voice or 'Matthew', '--output-format', 'mp3', '--text', text, out]
        if args.dry_run: print('  RUN', ' '.join(shlex.quote(c) for c in cmd)); return out
        subprocess.run(cmd, check=True, capture_output=True); return out
    elif provider == 'command':
        if not args.cmd: sys.exit('--provider command needs --cmd "… {text} … {out} …"')
        ext = args.ext; out = f'{out_base}.{ext}'
        cmd = args.cmd.format(text=shlex.quote(text), out=shlex.quote(out), voice=shlex.quote(voice or ''))
        if args.dry_run: print('  RUN', cmd); return out
        subprocess.run(cmd, shell=True, check=True)
        if not os.path.exists(out): sys.exit(f'the command did not write {out}')
        return out
    else:
        sys.exit(f'unknown provider {provider}')
    out = f'{out_base}.{ext}'
    if not args.dry_run: open(out, 'wb').write(audio)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('proj'); ap.add_argument('--provider', required=True)
    ap.add_argument('--voice'); ap.add_argument('--model'); ap.add_argument('--cmd'); ap.add_argument('--ext', default='wav')
    ap.add_argument('--cast-voice', action='append', default=[], metavar='NAME=VOICE', help='voice for a speaking cast member (repeatable)')
    ap.add_argument('--only', help='comma-separated line numbers to (re)voice'); ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()
    os.chdir(args.proj); os.makedirs('vo_raw', exist_ok=True)
    s = json.load(open('script.json')); cast = s.get('cast') or {}; narr = s.get('voice') or {}
    only = {int(x) for x in args.only.split(',')} if args.only else None
    cli_cast = dict(kv.split('=', 1) for kv in args.cast_voice)
    for i, line in enumerate(s['lines']):
        if only is not None and i not in only: continue
        sp = line.get('speaker')
        if sp:
            voice = cli_cast.get(sp) or ((cast.get(sp) or {}).get('voices') or {}).get(args.provider)
            if not voice:
                sys.exit(f'line {i} is spoken by "{sp}" but no {args.provider} voice is set for them: add '
                         f'cast.{sp}.voices.{args.provider} to script.json or pass --cast-voice {sp}=<voice>')
        else:
            voice = args.voice or (narr.get('voices') or {}).get(args.provider)   # None -> the provider's default
        for old in os.listdir('vo_raw'):  # a re-voiced line replaces any earlier file for that index
            if old.split('.')[0] == str(i) and not args.dry_run: os.remove(os.path.join('vo_raw', old))
        out = synth(args.provider, line['text'], voice, args.model, f'vo_raw/{i}', args)
        print(f'line {i} ({sp or "narrator"}, voice {voice}) -> {out}')


if __name__ == '__main__':
    main()
