# episode.js API

`episode.js` is an ES module loaded by `scene.html`. It exports a default function that receives a context
object and returns the shots. Optionally it exports `character` to restyle the outfit.

```js
export const character = { hoodie: '#3b78db', hoodieDark: '#2d5fb3', beanie: '#f4c430', beanieBand: '#e0a91c',
                           skin: '#f6f4ef', legs: '#1b1a20', shoe: '#ffffff', sole: '#e2493b' };   // all optional

export default function episode({ TL, S, E, CUT, D, at, wt, dolly, POSE, fx, smooth, lerp, clamp }) {
  return {
    shots: [ /* exactly one per script line */ ],
    blinks: [0.9, 3.4],   // optional absolute times; default = automatic blinks every ~2–5 s
    punch: true           // optional; false disables the zoom-punch + flash at cuts
  };
}
```

## Contents
1. Context object
2. Shot fields
3. Poses
4. Face parameters
5. Environments (lighting), 5b. Outfits
6. Effects (`fx`) and props
7. Cameras and the set layout
8. Extending the engine

## 1. Context object

| name | meaning |
|---|---|
| `S[i]`, `E[i]` | absolute start / end time (s) of narrated line *i* |
| `CUT[i]` | absolute start of shot *i* (= `S[i] - 0.3`, shot 0 starts at 0) |
| `D[i]` | duration of shot *i* (last shot runs to the end of the video, including the tail) |
| `at(line, word, nth=0)` | time a word starts, **relative to that line's shot** — use for keyframes |
| `wt(line, word, nth=0)` | same, absolute time |
| `TL` | the full `timeline.json` (`words`, `lines`, `labels`, `duration`, ...) |
| `dolly(u, dur, p0, p1, look, extra)` | linear camera move from `p0` to `p1` over `dur`, looking at `look` |
| `POSE(name, overrides)` | a pose from the library, with any parameters overridden |
| `fx` | procedural motion helpers (section 6) |
| `smooth(a,b,x)`, `lerp`, `clamp`, `easeOutBack` | math helpers |

All shot times (`u`) are seconds since the shot started.

## 2. Shot fields

```js
{
  env: 'golden',                                   // lighting look (section 5)
  pose: [[0, POSE('tired')], [at(2,'switching') + 0.7, POSE('nod')], ...],   // [time u, pose] keyframes
  face: [[0, { eyeOpen: 0.4, bags: 0.8 }], ...],   // [time u, face params] keyframes
  cam: (u) => ({ p: [x,y,z], l: [x,y,z], roll: 0, fov: 38 }),   // camera position, look-at, optional roll/fov
  update: ({ u, t, pose, face, props }) => { ... } // optional per-frame hook: mutate pose/face, set props
}
```
Keyframes blend with smoothstep; parameters not given fall back to the neutral defaults, so each keyframe only
needs what differs from neutral. Hold a pose by repeating it at a later time. A quick snap = two keys ~0.15 s apart.

## 3. Poses

Library (`POSE(name)`). **Look at `references/poses.jpg`** to see every pose rendered, which is quicker than
reading this table when you're picking the action for a beat:

| name | reads as |
|---|---|
| `idle` | neutral standing |
| `think` | hand on chin, other arm across belly, head tilted |
| `stretch` | both arms straight up, leaning back (yawn/stretch, triumph) |
| `hips` | hands on hips, chin up (smug, confident) |
| `cheer` | arms up in a V (celebration) |
| `point` | screen-right arm pointing out to the side, head turned that way |
| `shrug` | forearms out, palms up, head tilted ("no idea") |
| `facepalm` | hand up to face/chin, head down (disappointed) |
| `wave` | screen-right arm raised; add `fx.wave` in `update` to wave |
| `tired` | slumped shoulders, soft knees |
| `nod` | head dropped forward, knees buckling (falling asleep) |
| `jolt` | startled snap upright, arms flung out |
| `scared` | arms up defensively, recoiling, head turned (pair with `fx.tremble`) |
| `sway` | woozy lean |
| `sit` | sitting on the ground, leaning back on arms (use a lower camera) |
| `holdMug` | screen-right hand holding something at chest height (pair with `props.mug`) |
| `sip` | screen-right hand at the mouth: drinking (pair with `props.mug` + `props.mugTilt ≈ -0.9`) |
| `fallen` | lying on its back (drive `pose.fall` with `fx.fall` for a gravity fall) |

Raw parameters (radians) for custom poses or overrides — "A" limbs are on screen-left, "B" on screen-right when facing camera:

| param | effect |
|---|---|
| `x`, `z` | position on the ground (default -0.1, 0.9). Animate between keys to move the character |
| `ry` | facing; 0 = toward camera, ±1.2 = three-quarter turn (use while walking) |
| `hipY` | raise/lower whole body (negative = crouch) |
| `lean`, `side`, `twist` | torso pitch (+ forward) / roll / yaw |
| `hx`, `hy`, `hz` | head pitch (+ looks down) / yaw / roll |
| `aSx`/`bSx` | arm swing (negative = forward/up in front) |
| `aSz`/`bSz` | arm raise to the side (positive = outward; ~2.7 = straight up) |
| `aEx`/`bEx` | elbow bend (negative bends forearm forward/up) |
| `aEz`/`bEz` | forearm bend toward the body (positive) |
| `lHx`/`rHx`, `lK`/`rK` | hip swing (negative = leg forward), knee bend (positive) |
| `fall` | 0 standing → 1 lying on back (pivots at the feet) |

## 4. Face parameters

`references/faces.jpg` shows 12 ready-made expressions with their parameters.

| param | range | effect |
|---|---|---|
| `eyeOpen` | 0–1 | <0.12 draws closed "sleep" arcs; 0.4–0.6 = heavy-lidded (tired, smug) |
| `wide` | 0 / 1 | shocked eyes: white circles with tiny pupils (overrides eyeOpen) |
| `brow` | -1…1 | + = angry/smug (inner ends down), − = worried/sad |
| `browY` | px | move both brows (negative = raised) |
| `browA` | px | raise only the screen-left brow (negative = up) → skeptical/curious |
| `lookX`, `lookY` | -1…1 | pupil direction |
| `smile` | -1…1 | mouth curve (negative = frown) |
| `open` | 0–1 | open mouth (gasp, yawn, yell) |
| `mouthW` | ~0.5–1.2 | mouth width (small "o" = 0.5 with open 0.3) |
| `bags` | 0–1 | purple eye bags |
| `sweat`, `sweatY` | 0–1, px | sweat drop and how far it has slid down |
| `blush` | 0–1 | cheek blush |

Useful combos: smug `{eyeOpen:.55, brow:.45, smile:1, blush:.6}` · shocked `{wide:1, brow:-.6, open:.9, mouthW:.6, sweat:1}` ·
curious `{browA:-24, brow:.1, smile:.1, mouthW:.7}` · asleep `{eyeOpen:0, smile:.5, mouthW:.6, blush:.8}` · annoyed `{eyeOpen:.5, brow:.5, smile:-.5}`.

## 5. Environments

`references/environments.jpg` shows all six.

`env` per shot: `day`, `morning` (warm, bright), `golden` (late afternoon), `dusk` (purple/pink, a few stars),
`night` (dark blue, stars, moon), `storm` (grey, flat). Changing env between shots is the cheapest way to show time passing.

## 5b. Outfits

`references/outfits.jpg` shows these presets; paste one as `export const character = {...}`:

```js
Classic   {}                                                                                   // blue hoodie, yellow beanie
Ember     { hoodie: '#d9412b', hoodieDark: '#a92f1f', beanie: '#2f2f36', beanieBand: '#1f1f25', sole: '#2f2f36' }
Midnight  { hoodie: '#26252e', hoodieDark: '#18171e', beanie: '#e2493b', beanieBand: '#b8352a' }
Bubblegum { hoodie: '#f28cb8', hoodieDark: '#d66a99', beanie: '#ffffff', beanieBand: '#e9e9ef', sole: '#f28cb8' }
Forest    { hoodie: '#3f8f4f', hoodieDark: '#2f6f3c', beanie: '#8a5a34', beanieBand: '#6d4426' }
Royal     { hoodie: '#6b45c6', hoodieDark: '#5233a0', beanie: '#33c4b0', beanieBand: '#26a090', sole: '#33c4b0' }
Sunset    { hoodie: '#f08a24', hoodieDark: '#c96c12', beanie: '#3b78db', beanieBand: '#2d5fb3' }
Frost     { hoodie: '#e9eef5', hoodieDark: '#c9d3e0', beanie: '#4fb6e8', beanieBand: '#3594c2', sole: '#4fb6e8' }
```
Keep one outfit per series so viewers recognise the character from episode to episode.

## 6. Effects and props

`fx` helpers mutate the pose inside `update` (they add on top of the keyframed pose):

| helper | use |
|---|---|
| `fx.fall(u, start, dur=.55)` | returns a value for `pose.fall`: gravity fall starting at `start` with a little bounce |
| `fx.tremble(pose, t, k)` | fear shaking |
| `fx.bounce(pose, u, k)` | happy/smug bouncing |
| `fx.walk(pose, t, k, speed)` | walk cycle (move `x` between keyframes at the same time; set `ry`) |
| `fx.wave(pose, t, k)` | waving forearm (with the `wave` pose) |
| `fx.shake(pose, t, k)` / `fx.nodYes(pose, t, k)` | head "no" / "yes" |

Props (set in `update`, reset every frame):
- `props.treeEyes = 0..1` — glowing eyes open in the tree trunk (hallucination/creepy beat). `props.treeLook` = pupil drift.
- `props.zzz = u0` — floating "Z" sprites start rising from the head at shot time `u0` (sleep payoff).
- `props.mug = 1` — a mug follows the screen-right hand. `props.mugTilt` tilts it (≈ -0.9 to drink, small positive
  jerks for a spill). Colour via `character.mug`. To keep the hand on the mug in any pose, override the B arm:
  `POSE('tired', { bSx: -0.6, bSz: 0.15, bEx: -1.15, bEz: 0.35 })`.
- `props.cups = 0..24` — a pyramid of takeaway cups beside the character (screen-left, x≈-1.45) builds bottom-up, one
  cup per unit, popping in as the value passes each integer; the last 3 lie knocked over in front. Animate it with
  `lerp(a, b, smooth(...))` and add `pop` SFX cues for the fast part. Frame it with a look-at around x≈-0.8.

## 7. Cameras and the set layout

World units are about a metre. The character stands at x≈-0.1, z≈0.9 (feet at y=0, head centre y≈2.55, top of
beanie ≈3.3). The big tree trunk is at x=-2.9, z=-1.4 (its eyes prop sits on the trunk at y≈3.3), a fence and wheat
field run behind at z≈-14, the camera looks from +z. Frame is portrait (38° vertical FOV).

Known-good framings (from the example):

| shot | `p` (camera) | `l` (look at) |
|---|---|---|
| wide with tree | `[2.2, 2.5, 9.6]` → `[1.4, 2.35, 7.4]` | `[-0.7, 2.45, 0]` |
| medium full body | `[1.1, 2.45, 7.0]` → `[0.7, 2.45, 6.2]` | `[-0.1, 2.15, 0.9]` |
| close-up head+torso | `[1.0, 2.95, 5.8]` → `[0.7, 2.95, 5.2]` | `[-0.15, 2.4, 0.9]` |
| character + tree trunk eyes | `[1.6, 2.8, 10.4]` → `[1.9, 2.8, 9.2]` | `[-0.85, 2.7, 0.2]` (+ `roll` wobble) |
| overhead on the fallen character | `[0.1, 6.6, 3.2]` | `[-0.1, 0.35, -0.4]` |
| sitting | lower the camera to y≈1.4 and look at y≈1.0 | |

Slow push-ins (`dolly` over the whole shot) keep every shot alive; add small `Math.sin(u)` drift for handheld
nervousness, or `roll` for a disoriented dutch angle.

## 8. Extending the engine

`engine/scene.html` is plain Three.js; new props or sets go there:
- build meshes with `mesh(geometry, toon(color), { outline: 0.02 })` to match the outlined cel-shaded look;
- expose the prop through the `props` object in `setTime` (add a default, then apply it after `shot.update`), so
  episodes can drive it per frame;
- keep everything a pure function of time `t` — frames are rendered out of order by parallel workers, so no state may
  carry over from one frame to the next.
