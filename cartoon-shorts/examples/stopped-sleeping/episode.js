// SPDX-License-Identifier: MIT — Copyright (c) 2026 Sai Akash Neela — https://github.com/SaiAkashNeela/cartoon-short-skill
// "What if you stopped sleeping?" — one shot per script line.
// ctx: TL, S (line starts), E (line ends), CUT (shot starts), D (shot durations), at(line, word) -> shot-relative time,
//      wt(line, word) -> absolute time, dolly(u, dur, p0, p1, look), POSE(name, overrides), fx helpers, smooth/lerp/clamp.

export const character = {};  // Bobble, in his Classic look (blue hoodie, yellow beanie): the star of Bobble Explains

export default function episode({ E, CUT, D, at, dolly, POSE, fx, smooth, lerp }) {
  const sw = at(2, 'switching'), wo = at(2, 'without');   // day 3 microsleeps land on these words
  const ys = at(3, 'you');                                 // day 5 hallucination starts on "You start seeing"
  const fallU = E[4] + 0.15 - CUT[4];                      // collapse right after the last word

  return {
    shots: [
      { // 0 hook: curious, hand on chin
        env: 'day',
        pose: [[0, POSE('think')]],
        face: [[0, { brow: -0.1, browA: -22, smile: -0.05, lookX: 0.15, lookY: -0.3 }], [1.0, { brow: 0.15, browA: -26, smile: 0.1, mouthW: 0.7, lookX: 0, lookY: 0 }]],
        cam: (u) => dolly(u, D[0], [2.2, 2.5, 9.6], [1.4, 2.35, 7.4], [-0.7, 2.45, 0])
      },
      { // 1 day one: yawn-stretch, then smug hands on hips
        env: 'morning',
        pose: [[0, POSE('stretch')], [1.0, POSE('stretch', { hx: -0.3 })], [1.7, POSE('hips')], [D[1], POSE('hips', { hz: 0.06 })]],
        face: [[0, { eyeOpen: 0.05, open: 0.6, smile: 0.3, mouthW: 0.7 }], [1.2, { eyeOpen: 0.05, open: 0.3, smile: 0.3, mouthW: 0.7 }], [1.8, { eyeOpen: 0.62, brow: 0.35, smile: 0.9, mouthW: 1.1 }],
          [3.0, { eyeOpen: 0.55, brow: 0.45, browA: -18, smile: 1, mouthW: 1.15, blush: 0.6 }]],
        cam: (u) => dolly(u, D[1], [1.1, 2.45, 7.0], [0.7, 2.45, 6.2], [-0.1, 2.15, 0.9]),
        update: ({ u, pose }) => { if (u > 1.8) fx.bounce(pose, u); }
      },
      { // 2 day three: nods off and jolts awake, twice
        env: 'golden',
        pose: [[0, POSE('tired')], [sw - 0.6, POSE('tired')], [sw + 0.7, POSE('nod')], [sw + 0.9, POSE('jolt')], [sw + 1.3, POSE('tired')],
          [wo - 0.8, POSE('tired')], [wo + 0.05, POSE('nod')], [wo + 0.25, POSE('jolt')], [wo + 0.8, POSE('tired', { hz: -0.05 })]],
        face: [[0, { eyeOpen: 0.45, bags: 0.8, brow: -0.25, smile: -0.25, mouthW: 0.8 }], [sw - 0.6, { eyeOpen: 0.4, bags: 0.8, brow: -0.25, smile: -0.25, mouthW: 0.8 }],
          [sw + 0.65, { eyeOpen: 0, bags: 0.8, brow: -0.1, smile: 0, open: 0.15, mouthW: 0.5 }], [sw + 0.8, { wide: 1, bags: 0.8, brow: -0.5, open: 0.35, mouthW: 0.6, sweat: 1 }],
          [sw + 1.3, { wide: 1, bags: 0.8, brow: -0.5, open: 0.1, mouthW: 0.5, sweat: 1 }], [sw + 1.6, { eyeOpen: 0.4, bags: 0.85, brow: -0.25, smile: -0.3 }],
          [wo, { eyeOpen: 0, bags: 0.85, smile: 0, open: 0.15, mouthW: 0.5 }], [wo + 0.15, { wide: 1, bags: 0.9, brow: -0.5, open: 0.4, mouthW: 0.6, sweat: 1 }],
          [wo + 0.7, { eyeOpen: 0.5, bags: 0.9, brow: 0.5, smile: -0.5, mouthW: 0.9 }]],
        cam: (u) => { const c = dolly(u, D[2], [1.0, 2.95, 5.8], [0.7, 2.95, 5.2], [-0.15, 2.4, 0.9]); c.p[0] += Math.sin(u * 1.3) * 0.05; c.p[1] += Math.sin(u * 0.9) * 0.04; return c; }
      },
      { // 3 day five: the tree opens its eyes
        env: 'dusk',
        pose: [[0, POSE('tired')], [ys + 0.25, POSE('tired')], [ys + 0.6, POSE('scared', { x: 0.05, z: 1.1 })], [D[3], POSE('scared', { x: 0.15, z: 1.2, hy: 0.55 })]],
        face: [[0, { eyeOpen: 0.4, bags: 1, smile: -0.3 }], [ys + 0.35, { eyeOpen: 0.4, bags: 1, smile: -0.3 }],
          [ys + 0.5, { wide: 1, bags: 1, brow: -0.6, open: 0.9, mouthW: 0.6, sweat: 1, lookX: -0.9 }], [D[3], { wide: 1, bags: 1, brow: -0.7, open: 0.8, mouthW: 0.55, sweat: 1, lookX: -0.9, sweatY: 60 }]],
        cam: (u) => dolly(u, D[3], [1.6, 2.8, 10.4], [1.9, 2.8, 9.2], [-0.85, 2.7, 0.2], { roll: 0.09 * Math.sin(u * 1.7) + 0.05 }),
        update: ({ u, t, pose, props }) => {
          props.treeEyes = smooth(ys - 0.1, ys + 0.15, u) * (Math.abs(u - ys - 1.3) < 0.09 ? 0 : 1);  // blink once
          if (u > ys + 0.5) fx.tremble(pose, t);
        }
      },
      { // 4 night: sways, collapses, sleeps
        env: 'night',
        pose: [[0, POSE('sway')], [1.2, POSE('sway', { hz: 0.2, side: 0.05 })], [2.4, POSE('sway', { hz: -0.25, hx: 0.5 })], [fallU, POSE('sway', { hx: 0.2, lean: -0.05 })], [fallU + 0.55, POSE('fallen')]],
        face: [[0, { eyeOpen: 0.3, bags: 1, smile: -0.2 }], [2.5, { eyeOpen: 0.2, bags: 1, smile: -0.1 }], [fallU - 0.3, { eyeOpen: 0.15, bags: 1, smile: 0 }],
          [fallU + 0.2, { eyeOpen: 0, bags: 0.6, smile: 0.25, mouthW: 0.6 }], [fallU + 1.2, { eyeOpen: 0, bags: 0.3, smile: 0.5, mouthW: 0.6, blush: 0.8 }]],
        cam: (u) => { const k = smooth(fallU + 0.2, fallU + 2.2, u); return { p: [lerp(0.9, 0.1, k), lerp(2.4, 6.6, k), lerp(6.6, 3.2, k)], l: [-0.1, lerp(2.0, 0.35, k), lerp(0.9, -0.4, k)] }; },
        update: ({ u, pose, props }) => { pose.fall = fx.fall(u, fallU); props.zzz = fallU + 1.3; }
      }
    ]
  };
}
