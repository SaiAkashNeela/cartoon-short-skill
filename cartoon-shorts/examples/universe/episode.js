// SPDX-License-Identifier: MIT — Copyright (c) 2026 Sai Akash Neela — https://github.com/SaiAkashNeela/cartoon-short-skill
// "How big is the universe?" — a 3-minute landscape video: Bobble floats outward from the Moon to the cosmic web.
// Every shot moves, and every number lands on screen on the word that says it.
export const character = {};

export default function episode({ D, at, POSE, fx, smooth, lerp, clamp, COSMOS: C }) {
  const ease = (k) => smooth(0, 1, k);
  // camera that glides from (p0, l0) to (p1, l1) over shot i
  const glide = (i, p0, p1, l0, l1 = l0, extra = {}) => (u) => {
    const k = ease(clamp(u / D[i])); return { p: p0.map((v, j) => lerp(v, p1[j], k)), l: l0.map((v, j) => lerp(v, l1[j], k)), ...extra };
  };
  // camera circling `c` at radius r and height h, from angle a0 to a1 over shot i
  const orbit = (i, c, r, h, a0, a1, look = c) => (u) => {
    const a = lerp(a0, a1, ease(clamp(u / D[i]))); return { p: [c[0] + Math.sin(a) * r, c[1] + h, c[2] + Math.cos(a) * r], l: look };
  };
  const fact = (props, u, t0, text, sub) => { if (u >= t0) props.fact = { text, sub, since: u - t0 }; };
  const up = (p, dy) => [p[0], p[1] + dy, p[2]];
  const toward = (from, to, d) => { const v = to.map((x, j) => x - from[j]), n = Math.hypot(...v); return from.map((x, j) => x + v[j] / n * d); };
  const faceCam = (pos, cam) => Math.atan2(cam[0] - pos[0], cam[2] - pos[2]);
  // Bobble floating in space at world position pos, turned toward the camera
  const floater = (pos, cam, pose, extra = {}) => POSE(pose, { x: pos[0], y: pos[1], z: pos[2], ry: faceCam(pos, cam), ...extra });
  const space = (extra) => ({ set: 'cosmos', env: 'night', ...extra });
  const helmetOn = ({ t, pose, props }) => { props.helmet = 1; fx.float(pose, t); };

  const E = [0, 0, 0], MOON = [203.7, 0, 0], SUN = [0, 0, -5000], SE = C.sunEarth, SOL = C.solar, VOY = C.voyager, STAR = C.star;
  const MW = C.galaxy, AND = C.andromeda, WEB = C.web, HERE = C.youAreHere;

  // ---- 0-1 the hook: a quiet field at night ----
  const brain = at(0, 'brain'), step = at(1, 'step');
  // ---- 2-4 the Moon ----
  const three = at(2, 'three'), every = at(3, 'every'), gap = at(3, 'gap'), light4 = at(4, 'light'), second = at(4, 'second');
  // ---- 5-8 the Sun ----
  const million5 = at(5, 'million'), hundred6 = at(6, 'hundred'), drive = at(7, 'drive'), years7 = at(7, 'years'), left8 = at(8, 'left'), eight8 = at(8, 'eight');
  // ---- 9-12 the solar system ----
  const eight9 = at(9, 'eight'), light10 = at(10, 'light'), four10 = at(10, 'four'), fifty = at(11, 'fifty'), oneDay = at(12, 'one');
  // ---- 13-14 the nearest star ----
  const four13 = at(13, 'four'), seventy = at(14, 'seventy');
  // ---- 15-19 the Milky Way ----
  const milky = at(15, 'milky'), hundreds16 = at(16, 'hundreds'), disc = at(16, 'disc'), here17 = at(17, 'here'), lap = at(18, 'lap'), dinos = at(19, 'dinosaurs');
  // ---- 20-21 Andromeda ----
  const two20 = at(20, 'two'), light21 = at(21, 'light'), humans = at(21, 'humans');
  // ---- 22-25 the universe ----
  const hundreds22 = at(22, 'hundreds'), more = at(23, 'more'), sand = at(23, 'sand'), ninety = at(24, 'ninety'), nobody = at(25, 'nobody');
  // ---- 26-27 back home ----
  const you26 = at(26, 'you'), wild = at(27, 'wild');

  // Bobble's spots in space
  const camMoon0 = [-1.2, 2.4, 16], camMoon1 = [-2.4, 2.3, 12.5];
  const bobSun = [-54, 1.0, -4912], camSunB = [-61, 3.6, -4899];
  const bobStar = [6, -0.6, -19978], camStar = [10.5, 1.4, -19964];
  const camDino = [0, 640, -39200], bobDino = toward(camDino, MW, 11).map((v, j) => v - (j === 1 ? 1.3 : 0));
  // Andromeda: side-on to the line between the galaxies (both in frame), then from just behind Andromeda
  const lerp3 = (a, b, k) => a.map((v, j) => lerp(v, b[j], k)), mid = lerp3(MW, AND, 0.5);
  const ax = AND.map((v, j) => v - MW[j]), axN = Math.hypot(ax[0], ax[2]), along = [ax[0] / axN, 0, ax[2] / axN], perp = [-along[2], 0, along[0]];
  const side = (d, h) => [mid[0] + perp[0] * d, mid[1] + h, mid[2] + perp[2] * d];
  const behindAnd = (s, p, h) => [AND[0] + along[0] * s + perp[0] * p, AND[1] + h, AND[2] + along[2] * s + perp[2] * p];

  return {
    shots: [
      { // 0 "Look up at the night sky…" — start on the stars, tilt down to Bobble gazing up
        env: 'night',
        pose: [[0, POSE('idle', { x: -0.2, z: 1.0, hx: -0.45, ry: 0.25 })], [brain - 0.2, POSE('idle', { x: -0.2, z: 1.0, hx: -0.4, ry: 0.25 })], [brain + 0.3, POSE('shrug', { x: -0.2, z: 1.0, ry: 0.15 })]],
        face: [[0, { lookY: 0.8, smile: 0.4, wide: 0.3 }], [brain, { lookY: 0, smile: 0, wide: 0.7, open: 0.25 }]],
        cam: (u) => { const k = smooth(0.4, 3.2, u); return { p: [lerp(0.4, 0.9, k), lerp(1.6, 2.5, k), lerp(8.6, 6.8, k)], l: [lerp(-0.4, -0.2, k), lerp(9, 2.1, k), lerp(-8, 0.9, k)] }; }
      },
      { // 1 "But let's try anyway. One step at a time." — helmet on, ready for launch
        env: 'night',
        pose: [[0, POSE('hips', { x: -0.2, z: 1.0 })], [step - 0.1, POSE('hips', { x: -0.2, z: 1.0 })], [step + 0.25, POSE('cheer', { x: -0.2, z: 1.0 })]],
        face: [[0, { smile: 0.8 }], [step, { smile: 1, wide: 0.4 }]],
        update: ({ u, pose, props }) => { if (u > step) { props.helmet = 1; pose.y = Math.pow(Math.max(0, u - step - 0.25), 2) * 1.4; } },
        cam: glide(1, [0.9, 2.5, 6.6], [0.6, 2.6, 5.6], [-0.2, 2.2, 0.9], [-0.2, 2.6, 0.9])
      },

      space({ // 2 THE MOON — Bobble floats by Earth, the Moon far off
        pose: [[0, floater([-4.5, 0.2, 7], camMoon0, 'wave', { ry: 0.4 })]], face: [[0, { smile: 1, blush: 0.4 }]],
        update: (o) => { helmetOn(o); fx.wave(o.pose, o.t); fact(o.props, o.u, three, '384,400 km', 'from Earth to the Moon'); },
        cam: glide(2, camMoon0, camMoon1, [-2.5, 1.6, 2], [-1.5, 1.4, 0])
      }),
      space({ // 3 every planet fits in the gap, to scale
        update: ({ u, props }) => {
          props.lineup = clamp((u - every) / (gap - every + 0.4)) * 7;
          props.measure = { from: [0, -6, 0], to: [MOON[0], -6, 0], text: 'EVERY PLANET FITS', k: smooth(0, 1.2, u) };
          props.labels = [{ pos: up(E, 4.6), text: 'EARTH' }, { pos: up(MOON, 1.8), text: 'MOON' }];
        },
        cam: glide(3, [98, 16, 222], [106, 12, 204], [102, 0, 0])
      }),
      space({ // 4 light needs over a second — a pulse crossing in real time (1.28 s)
        update: ({ u, props }) => {
          props.labels = [{ pos: up(E, 4.6), text: 'EARTH' }, { pos: up(MOON, 1.8), text: 'MOON' }];
          if (u > light4) props.pulse = { from: [3.4, 0, 0], to: [MOON[0] - 1, 0, 0], k: (u - light4) / 1.28, size: 5 };
          fact(props, u, second, '1.3 seconds', 'at the speed of light');
        },
        cam: glide(4, [70, 70, 205], [86, 58, 196], [102, 0, 0])
      }),

      space({ // 5 THE SUN — tiny Earth in front of the giant Sun
        update: ({ u, props }) => { props.labels = [{ pos: up(SE, 1.4), text: 'EARTH' }]; fact(props, u, million5 - 0.3, '1,300,000', 'Earths would fit inside the Sun'); },
        cam: glide(5, [-104, 4, -4920], [-92, 2.5, -4937], [-30, 0, -5000], [-10, 0, -5000])
      }),
      space({ // 6 150 million km — measured
        update: ({ u, props }) => {
          props.measure = { from: [SE[0], -2, SE[2]], to: [-48, -2, -4975], k: smooth(0, hundred6 + 0.6, u), text: u > hundred6 ? '150,000,000 KM' : '', sub: 'Earth to Sun' };
        },
        cam: glide(6, [-60, 70, -4820], [-40, 60, -4810], [-38, 0, -4985])
      }),
      space({ // 7 driving there takes 170 years — Bobble against the Sun
        pose: [[0, floater(bobSun, camSunB, 'sit')], [years7 - 0.2, floater(bobSun, camSunB, 'sit')], [years7 + 0.3, floater(bobSun, camSunB, 'facepalm')]],
        face: [[0, { smile: 0.5 }], [years7, { smile: -0.4, sleepy: 0.4, brow: 0.5 }]],
        update: (o) => { helmetOn(o); fact(o.props, o.u, drive + 0.4, '100 km/h', 'by car, nonstop…'); if (o.u > years7 - 0.2) o.props.fact = { text: '≈170 YEARS', sub: 'to drive to the Sun', since: o.u - years7 + 0.2 }; },
        cam: glide(7, camSunB, toward(camSunB, bobSun, 3), up(bobSun, 1.6))
      }),
      space({ // 8 sunlight is 8 minutes old — a pulse from the Sun to Earth
        update: ({ u, props }) => {
          props.labels = [{ pos: up(SE, 1.6), text: 'EARTH' }];
          if (u > left8) props.pulse = { from: [-50, 0, -4985], to: SE, k: (u - left8) / (D[8] - left8 - 0.2), size: 6 };
          fact(props, u, eight8, '8 min 20 s', "sunlight's trip to you");
        },
        cam: glide(8, [-120, 35, -4850], [-110, 28, -4860], [-40, 0, -4985])
      }),

      space({ // 9 THE SOLAR SYSTEM — orbiting the whole thing
        update: ({ u, props }) => { props.orbitSpeed = 2; fact(props, u, eight9, '8 planets', 'one star'); },
        cam: orbit(9, SOL, 95, 70, -0.4, 0.35, up(SOL, -8))
      }),
      space({ // 10 four hours to Neptune
        update: ({ u, props }) => {
          props.orbitSpeed = 2;
          if (u > light10) props.pulse = { from: SOL, to: [SOL[0] + 60, 0, SOL[2]], k: (u - light10) / (D[10] - light10 - 0.3), size: 3 };
          props.labels = [{ pos: [SOL[0] + 60, 4, SOL[2]], text: "NEPTUNE'S ORBIT" }];
          fact(props, u, four10, '4 hours', 'for sunlight to reach Neptune');
        },
        cam: glide(10, [20, 55, -9905], [34, 48, -9915], [28, -4, -10000])
      }),
      space({ // 11 Voyager 1
        update: ({ u, props }) => { props.labels = [{ pos: up(VOY, 2.4), text: 'VOYAGER 1' }]; fact(props, u, fifty, '49 years', 'flying since 1977'); },
        cam: orbit(11, VOY, 13, 2, 0.6, -0.3)
      }),
      space({ // 12 one light-day away — pull way back
        update: ({ u, props }) => { props.labels = [{ pos: up(VOY, 2.4), text: 'VOYAGER 1' }]; fact(props, u, oneDay, '1 light-day', '≈ 26 billion km from Earth'); },
        cam: glide(12, [5, 3, -14988], [80, 40, -14880], VOY)
      }),

      space({ // 13 THE NEAREST STAR
        update: ({ u, props }) => { props.labels = [{ pos: up(STAR, 8.5), text: 'PROXIMA CENTAURI' }]; fact(props, u, four13, '4.2 light-years', 'the nearest other star'); },
        cam: glide(13, [0, 6, -19940], [3, 4, -19968], STAR)
      }),
      space({ // 14 75,000 years at Voyager's speed
        pose: [[0, floater(bobStar, camStar, 'think')], [seventy, floater(bobStar, camStar, 'think')], [seventy + 0.4, floater(bobStar, camStar, 'scared')]],
        face: [[0, { smile: 0, brow: 0.3 }], [seventy, { wide: 1, open: 0.5, smile: -0.3 }]],
        update: (o) => { helmetOn(o); if (o.u > seventy) fx.tremble(o.pose, o.t, 0.6); fact(o.props, o.u, seventy, '75,000 years', "at Voyager's speed"); },
        cam: glide(14, camStar, toward(camStar, bobStar, 4), up(bobStar, 1.4))
      }),

      space({ // 15 THE MILKY WAY — the big reveal
        update: ({ u, props }) => { if (u > milky) props.labels = [{ pos: up(MW, 140), text: 'THE MILKY WAY' }]; },
        cam: glide(15, [0, 160, -39830], [0, 820, -39050], MW)
      }),
      space({ // 16 hundreds of billions of stars, 100,000 light-years across
        update: ({ u, props }) => {
          fact(props, u, hundreds16, '100s of billions', 'of stars');
          if (u > disc - 0.3) props.measure = { from: [MW[0] - 600, 20, MW[2] + 120], to: [MW[0] + 600, 20, MW[2] + 120], k: smooth(disc - 0.3, disc + 1.2, u), text: '100,000 LIGHT-YEARS' };
        },
        cam: orbit(16, MW, 980, 760, 0.1, -0.15)
      }),
      space({ // 17 "we're right about… here"
        update: ({ u, props }) => { if (u > here17 - 0.1) props.labels = [{ pos: up(HERE, 18), text: 'YOU ARE HERE' }]; props.pulse = u > here17 - 0.1 ? { from: HERE, to: HERE, k: 0, size: 26 + 8 * Math.sin(u * 6) } : null; },
        cam: glide(17, [0, 820, -39050], [HERE[0] + 90, 300, HERE[2] + 380], MW, HERE)
      }),
      space({ // 18 one lap takes 230 million years — our Sun travels around the centre
        update: ({ u, props }) => {
          const r = Math.hypot(HERE[0] - MW[0], HERE[2] - MW[2]), a0 = Math.atan2(HERE[2] - MW[2], HERE[0] - MW[0]), a = a0 + u * 0.16;
          const sun = [MW[0] + Math.cos(a) * r, 0, MW[2] + Math.sin(a) * r];
          props.pulse = { from: sun, to: sun, k: 0, size: 44 }; props.labels = [{ pos: up(sun, 22), text: 'OUR SUN' }];
          fact(props, u, lap, '230 million years', 'for one lap');
        },
        cam: glide(18, [0, 1150, -39200], [-150, 1100, -39150], MW)
      }),
      space({ // 19 the first dinosaurs
        pose: [[0, floater(bobDino, camDino, 'think')], [dinos - 0.3, floater(bobDino, camDino, 'think')], [dinos + 0.1, floater(bobDino, camDino, 'jolt')]],
        face: [[0, { brow: 0.3 }], [dinos, { wide: 1, open: 0.6, smile: 0.3 }]],
        update: (o) => { helmetOn(o); fact(o.props, o.u, dinos, 'the first dinosaurs', 'were just showing up'); },
        cam: glide(19, camDino, toward(camDino, bobDino, 2), up(bobDino, 2.3))
      }),

      space({ // 20 ANDROMEDA — both galaxies, the gap measured
        update: ({ u, props }) => {
          props.labels = [{ pos: up(MW, 180), text: 'MILKY WAY' }, { pos: up(AND, 260), text: 'ANDROMEDA' }];
          if (u > two20 - 0.3) props.measure = { from: up(MW, -120), to: up(AND, -120), k: smooth(two20 - 0.3, two20 + 1.2, u), text: '2.5 MILLION LIGHT-YEARS' };
        },
        cam: glide(20, side(7200, 2100), side(6200, 1800), mid)
      }),
      space({ // 21 its light left before humans existed — a pulse crossing the gap
        update: ({ u, props }) => {
          props.labels = [{ pos: up(MW, 180), text: 'MILKY WAY' }, { pos: up(AND, 260), text: 'ANDROMEDA' }];
          if (u > light21) props.pulse = { from: AND, to: MW, k: (u - light21) / (D[21] - light21), size: 90 };
          fact(props, u, humans - 0.2, 'before humans', 'that light set off 2.5 million years ago');
        },
        cam: glide(21, behindAnd(2200, 1800, 800), behindAnd(1800, 1400, 700), lerp3(AND, MW, 0.55), lerp3(AND, MW, 0.5))
      }),

      space({ // 22 THE UNIVERSE — hundreds of billions of galaxies
        update: ({ u, props }) => fact(props, u, hundreds22, '100s of billions', 'of galaxies'),
        cam: glide(22, [0, 600, -77200], [0, 2200, -70500], WEB)
      }),
      { // 23 more stars than grains of sand — Bobble on a beach
        set: 'beach', env: 'day',
        pose: [[0, POSE('sit', { x: -0.4, z: 1.2, ry: 0.3 })], [sand, POSE('sit', { x: -0.4, z: 1.2, ry: 0.3 })], [sand + 0.4, POSE('shrug', { x: -0.4, z: 1.2, ry: 0.2 })]],
        face: [[0, { smile: 0.5, lookY: -0.4 }], [sand, { wide: 0.8, open: 0.4, smile: 0.4, lookY: 0 }]],
        update: ({ u, props }) => fact(props, u, more, 'MORE STARS', 'than grains of sand on every beach'),
        cam: glide(23, [1.6, 2.2, 8.4], [1.0, 2.0, 6.4], [-0.4, 1.4, 1.0])
      },
      space({ // 24 the observable universe: 93 billion light-years
        update: ({ u, props }) => { fact(props, u, ninety, '93 billion', 'light-years across'); props.measure = { from: [-9000, -1500, -80000 + 4000], to: [9000, -1500, -80000 + 4000], k: smooth(0, ninety + 0.8, u), text: u > ninety ? 'THE PART WE CAN SEE' : '' }; },
        cam: glide(24, [0, 2600, -69000], [0, 3600, -67000], WEB)
      }),
      space({ // 25 nobody knows how big it all is
        update: ({ u, props }) => fact(props, u, nobody, '???', 'the whole universe'),
        cam: glide(25, [0, 3600, -67000], [1200, 5200, -66000], WEB)
      }),

      space({ // 26 AND YOU — all the way back to one tiny blue planet
        update: ({ u, props }) => { if (u > you26 - 0.2) props.labels = [{ pos: up(E, 3.9), text: 'YOU' }]; },
        cam: (u) => { const k = 1 - Math.pow(1 - clamp(u / D[26]), 3); return { p: [lerp(160, 4, k), lerp(90, 2.5, k), lerp(900, 13, k)], l: E }; }
      }),
      { // 27 "Watching a video about it. Pretty wild, right?" — back in the field
        env: 'night',
        pose: [[0, POSE('sit', { x: -0.2, z: 1.0, ry: 0.2, hx: -0.4 })], [wild - 0.3, POSE('sit', { x: -0.2, z: 1.0, ry: 0.2, hx: -0.3 })], [wild + 0.1, POSE('shrug', { x: -0.2, z: 1.0, ry: 0.1 })]],
        face: [[0, { lookY: 0.7, smile: 0.4 }], [wild, { lookY: 0, smile: 1, blush: 0.3 }]],
        cam: glide(27, [1.4, 1.9, 7.4], [0.8, 1.8, 5.8], [-0.2, 1.3, 1.0])
      }
    ]
  };
}
