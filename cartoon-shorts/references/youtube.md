# Publishing to YouTube

How to take a finished video to a fully optimised upload: search-first metadata, captions, translations, thumbnails and
the settings YouTube asks about. Works with any YouTube tool the session has: a hosted YouTube connector, or the repo's
own `youtube-mcp` server running locally. Nothing here needs YouTube Studio except the steps marked *(Studio)*.

## Contents
1. Formats: Shorts vs regular videos
2. Upload safely
3. Title, description, tags (search-first, VidIQ-style)
4. Captions and chapters
5. Every country: languages and localisations
6. Thumbnails
7. Made for kids, altered content, category
8. Quota budget
9. Channel setup (once)

## 1. Formats

| | Short | Regular video |
|---|---|---|
| `script.json` | `"format": "short"` (default) | `"format": "video"` |
| Frame | vertical 1080×1920 | landscape 1920×1080 |
| Length in this skill | 20–90 s, 4–14 lines | 3–5 min, roughly 25–45 lines |
| Where it lands | the Shorts feed | the Videos tab, search and suggested videos |
| Hashtag | `#shorts` | none needed |
| Chapters | no | yes (`chapters.txt`) |
| Custom thumbnail | not shown in the Shorts feed: pick a frame in the YouTube app *(Studio/app)* | `thumbnail.py` + upload |

A regular video needs more story: open with the hook in the first 5–10 s, then 4–6 sections, each with its own `label`
(they become chapters) and a re-hook ("but on day 5…") every 30–45 s, a payoff, and a 10–15 s outro with the call to
action. In landscape, cameras can sit about 35–40 % closer than in the vertical examples, because the frame is much wider.

## 2. Upload safely

- Upload **private** (or scheduled with `publish_at`), never public directly; the user flips it public. Projects that
  haven't passed YouTube's API audit can only upload private anyway.
- Remote (hosted) connectors fetch the file from a **public https URL**, not from this machine. If the user has no hosting,
  one option is to push the MP4s to a temporary branch of a repo they own, upload from the raw URL, then remove the
  files and delete the branch. Tell the user first, because the file is publicly reachable while the branch exists. A local
  `youtube-mcp` server takes a file path instead.
- Put each upload in the series playlist (`playlist_id`) and check `processingDetails` afterwards for rejection reasons.
- Never write OAuth secrets, tokens or API keys into the repo or the chat.

## 3. Title, description, tags

Think like a keyword tool: what would someone actually type into YouTube search?

**Title** (≤ 60 characters, keyword first, one emoji at the end):
- Lead with the high-volume phrasing: "What Happens If You …" gets far more searches than "What if you …".
- Add a hook word people also search: "Day by Day", "for a Week", "in 30 Days".
- Title Case. Examples: `What Happens If You Stop Sleeping? Day by Day 😴`,
  `What Happens If You Only Drink Coffee for a Week? ☕`.

**Description** (the first ~150 characters appear in search results, so put the keyword there):
```
<Title phrased as a question>? <2–3 sentences retelling the escalation with the main keywords>. <emoji>

In this animated what-if <Short|video>, <character> <what happens>, and <the takeaway>.

📌 Facts in this video
• <fact 1>
• <fact 2>
• <fact 3>
Sources: <real, checkable sources: WHO, CDC, NIH, NHS, FDA, a named study>

<chapters.txt for regular videos>

💬 What should <character> try next? Drop your what-if in the comments!
🔔 Subscribe to @<handle> for more what-ifs.
▶️ All what-ifs: https://www.youtube.com/playlist?list=<playlist id>

An animated explainer for general education, not medical advice.   (health topics)

#shorts #whatif #<topic> #<topic2> #explained                     (3–5 hashtags; no #shorts on regular videos)
```
Only cite sources you are confident exist and say what you claim. Viewers check.

**Tags** (12–15, under 500 characters in total): the exact title phrase, 3–4 long-tail variants people search ("what
happens if you don't sleep", "how long can you go without sleep"), 3–4 topic terms ("sleep deprivation", "microsleep"),
then the series tags ("what if", "what if shorts", "animated explainer", "science explained", "<channel name>", "shorts").

Also set `category_id: 27` (Education), `default_language: en` and `default_audio_language: en`.

## 4. Captions and chapters

`python3 $SKILL/scripts/captions.py <proj>` writes `captions.srt` from the exact word timings, with speaker name tags.
Upload it as the `en` caption track (YouTube indexes captions for search, and offers auto-translated captions in every
language from it). For regular videos it also writes `chapters.txt` from the line labels; paste it into the description.

## 5. Every country: languages and localisations

Videos are available in every country unless a region restriction is set, so don't set one. To reach viewers in their
own language, add translated titles and descriptions. Viewers whose YouTube language matches then see them. Default set:

| code | language | natural "what happens if" phrasing |
|---|---|---|
| `es` | Spanish | ¿Qué pasa si…? |
| `pt` | Portuguese (Brazil) | O que acontece se você…? |
| `hi` | Hindi | अगर आप … तो क्या होगा? |
| `fr` | French | Que se passe-t-il si tu… ? |
| `de` | German | Was passiert, wenn du …? |
| `id` | Indonesian | Apa yang terjadi jika kamu…? |
| `ar` | Arabic | ماذا يحدث إذا …؟ |
| `ru` | Russian | Что будет, если …? |
| `ja` | Japanese | …したらどうなる？ |
| `ko` | Korean | …하면 어떻게 될까? |

Translate for meaning, not word by word, using the phrasing people search in that language. Keep each translation
shorter than the English description: the hook, the takeaway, the subscribe line, the disclaimer and local hashtags. Set
all of them in **one** `videos.update` call (`part=snippet,localizations`), resending the full English snippet so
nothing is cleared. One call per language costs ten times the quota.

## 6. Thumbnails

`python3 $SKILL/scripts/thumbnail.py <proj> --time <s> --text "LINE ONE|LINE TWO" --side left|right` renders a clean
frame (no captions or watermark) and adds 2–4 huge words: a big readable face, plus text on the side *away* from the faces,
and words that add to the title ("12 CUPS A DAY?!") rather than repeat it. Upload with the thumbnail tool (needs a
**verified** channel). For Shorts, the Shorts feed uses a frame chosen in the YouTube mobile app instead *(app)*.

## 7. Made for kids, altered content, category

- **Made for kids** is a legal declaration (COPPA), not a rating: is the video *primarily aimed at children*? Kid-friendly
  is not the same thing. A general-audience explainer (caffeine overdoses, hospitals, hallucinations) is **not made for
  kids**. Marking a video "made for kids" turns off comments, the notification bell, end screens, personalised ads and
  more, and steers it to YouTube Kids. Ask the user if unsure, and never guess "yes" to unlock reach.
- **Altered or synthetic content**: clearly animated cartoons that couldn't be mistaken for real people or events don't
  need the label (`contains_synthetic_media: false`). Set it to true if a video shows realistic-looking synthetic people,
  places or events, or a cloned real voice.
- **Category** 27 (Education) for explainers; 24 (Entertainment) for pure comedy.

## 8. Quota budget

Default: 10,000 units a day per API project (resets at midnight Pacific). Approximate costs: upload 1,600; video update
50 (one update can carry all localisations); caption upload 400; thumbnail 50; playlist insert 50; reads 1. Three uploads
with captions and localisations use about 7,000. Spread bigger batches over days.

## 9. Channel setup (once)

Banner (`docs/brand/` shows how to make one: 2560×1440 with the logo in the 1546×423 safe area), description with search
keywords, channel keywords, a round watermark (subscribe button on videos), a series playlist, and the profile picture,
which can only be set in YouTube Studio *(Studio)*. Verify the channel (phone) to unlock custom thumbnails and long uploads.
