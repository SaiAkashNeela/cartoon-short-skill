# Bobble Explains brand kit

| File | Use |
|---|---|
| `icon_blue.png` (1024×1024) | profile picture for YouTube / Instagram / TikTok (circle-safe, no text) |
| `icon_yellow.png`, `icon_laugh_purple.png` | alternate profile pictures |
| `logo_wordmark_transparent.png` | logo with transparent background for banners, thumbnails, overlays |
| `logo_wordmark_on_dark.png`, `logo_wordmark_on_light.png` | the same on solid backgrounds |
| `youtube_banner.png` (2560×1440) | YouTube channel banner: logo inside the 1546×423 all-device safe area, cast visible on desktop and TV |
| `youtube_banner_preview.png` | the banner with the device crop areas marked |
| `watermark.png` (300×300) | round Bobble badge used as the YouTube subscribe watermark |

Bobble and the *Bobble Explains* name and artwork belong to Sai Akash Neela. The code that makes them is MIT; please
brand your own channel with your own character and name.

## Regenerating

The character art is rendered by the engine itself, so it always matches the videos:
```bash
S=cartoon-shorts; P=/tmp/brand
$S/scripts/new_project.sh $P && cp docs/brand/logo-episode.js $P/episode.js
echo '{"fps":30,"duration":6,"starts":[0.3,2.3,4.3],"lineEnds":[1.3,3.3,5.3],"lines":["","",""],"labels":[null,null,null],"moods":[],"words":[]}' > $P/timeline.json
(cd $P && STILLS_PNG=1 node render.mjs stills 1.0 3.0 5.0 && python3 $OLDPWD/docs/brand/compose_brand.py)   # -> $P/out/
# banner: same steps with banner-episode.js, 8 shots (timeline starts 0.3, 2.3, ... 14.3), stills at 1.0, 3.0 ... 15.0,
# then compose_banner.py
```
