// SPDX-License-Identifier: MIT — Copyright (c) 2026 Sai Akash Neela — https://github.com/SaiAkashNeela/cartoon-short-skill
// "What if you never went to the doctor?" — Bobble plus a supporting cast; Mom and the doctor speak (lip-synced).
export const character = {};  // Bobble, Classic look

export const cast = {
  mom: { top: 'shirt', hoodie: '#e8655a', hoodieDark: '#c84d43', hat: 'longHair', hair: '#2b1d14', lashes: true },
  doctor: { coat: '#ffffff', hoodie: '#4a7fc1', hat: 'hair', hair: '#2b1d14', glasses: true },
  nurse: { coat: '#7fc8c0', hoodie: '#5aa9a0', hat: 'bun', hair: '#5a3a22', lashes: true },
  boss: { top: 'shirt', hoodie: '#f4f1ea', hoodieDark: '#d9d4c8', tie: '#e2493b', hat: 'none', mustache: true, hair: '#4a4a52', legs: '#2d3a5a', height: 1.06 },
  coworker: { top: 'shirt', hoodie: '#6b45c6', hoodieDark: '#5233a0', hat: 'longHair', hair: '#a8642a', glasses: true, lashes: true },
  ...Object.fromEntries([...Array(5)].map((_, i) => ['p' + i, { random: i + 21 }]))
};

export default function episode({ D, at, dolly, POSE, fx, smooth, lerp, MARK, facing }) {
  const L = MARK.left, R = MARK.right;
  const put = (m, extra = {}) => ({ x: m[0], z: m[1], ...extra });
  const still = (pose, face, extra) => ({ pose: [[0, pose]], face: [[0, face]], ...extra });

  // word anchors (shot-relative seconds)
  const doc0 = at(0, 'doctor'), great = at(1, 'great'), checks = at(1, 'checkups'), who = at(1, 'who');
  const really = at(2, 'really');
  const creep = at(3, 'creeping'), noSym = at(3, 'no');
  const tooth = at(4, 'toothache'), sleep = at(4, 'sleep');
  const wrong = at(5, 'wrong'), go = at(5, 'so');
  const caught = at(6, 'caught'), simple = at(6, 'simple');
  const early = at(7, 'early');
  const book = at(8, 'book'), thanks = at(8, 'thanks');

  // a street crowd walking past in the storm
  const crowd = {};
  [[-2.6, -0.4, 1], [2.4, -0.6, -1], [-1.6, -1.5, 1], [1.5, -1.7, -1], [-3.4, -2.6, 1]].forEach(([x, z, dir], i) => {
    crowd['p' + i] = { pose: [[0, POSE('idle', { x, z, ry: dir * 1.3 })], [D[5], POSE('idle', { x: x + dir * 2.2, z, ry: dir * 1.3 })]],
      face: [[0, { smile: -0.1, eyeOpen: 0.8 }]], update: ({ t, pose }) => fx.walk(pose, t + i * 0.7, 1, 6.5) };
  });

  return {
    shots: [
      { // 0 hook: waking up feeling invincible
        set: 'bedroom', env: 'morning',
        pose: [[0, POSE('stretch')], [doc0 - 0.4, POSE('stretch', { hx: -0.3 })], [doc0, POSE('think')]],
        face: [[0, { eyeOpen: 0.05, open: 0.6, smile: 0.3, mouthW: 0.7 }], [doc0 - 0.5, { eyeOpen: 0.05, open: 0.3, smile: 0.4, mouthW: 0.7 }],
          [doc0 + 0.05, { browA: -26, brow: 0.15, smile: 0.1, mouthW: 0.7 }]],
        cam: (u) => dolly(u, D[0], [1.0, 2.45, 7.2], [0.6, 2.45, 6.2], [-0.1, 2.15, 0.9])
      },
      { // 1 YEAR 1: thriving at work; check-ups? pfft
        set: 'office', env: 'day',
        pose: [[0, POSE('hips')], [great - 0.2, POSE('cheer')], [checks - 0.2, POSE('cheer')], [checks + 0.15, POSE('shrug')], [who + 0.3, POSE('shrug', { hz: 0.25 })]],
        face: [[0, { eyeOpen: 0.6, brow: 0.3, smile: 0.9 }], [great - 0.1, { eyeOpen: 0.05, smile: 1, open: 0.6, mouthW: 1.1 }],
          [checks, { eyeOpen: 0.55, brow: 0.4, browA: -20, smile: 0.7, mouthW: 1 }], [who + 0.2, { eyeOpen: 0.45, brow: 0.5, smile: 0.9, blush: 0.4 }]],
        cast: { coworker: still(POSE('idle', { x: -1.6, z: -1.4, ry: 0.4 }), { smile: 0.4 }) },
        cam: (u) => dolly(u, D[1], [1.0, 2.5, 8.2], [0.7, 2.5, 7.0], [-0.2, 2.15, 0.6]),
        update: ({ u, pose }) => { if (u > great) fx.bounce(pose, u, 1.2, 6); }
      },
      { // 2 Mom (speaks): get that looked at — Bobble waves it off
        set: 'kitchen', env: 'morning',
        pose: [[0, POSE('idle', put(L, { ry: facing(L, R) }))], [really, POSE('shrug', put(L, { ry: facing(L, R) }))]],
        face: [[0, { smile: 0.3 }], [really, { eyeOpen: 0.5, lookY: -0.7, brow: 0.3, smile: -0.1, mouthW: 0.8 }]],
        cast: { mom: { pose: [[0, POSE('hips', put(R, { ry: facing(R, L) }))]], face: [[0, { brow: -0.45, smile: -0.2, lookX: -0.4 }]] } },
        cam: (u) => dolly(u, D[2], [0.3, 2.6, 10.8], [0.6, 2.6, 8.6], [0.3, 2.3, 1.3])
      },
      { // 3 YEAR 3: stress, rising blood pressure... and you feel totally fine
        set: 'office', env: 'golden',
        pose: [[0, POSE('scared', { z: 1.6 })], [noSym - 0.3, POSE('scared', { z: 1.6 })], [noSym, POSE('hips', { z: 1.6 })]],
        face: [[0, { wide: 1, sweat: 1, brow: -0.5, open: 0.3, mouthW: 0.6 }], [noSym - 0.2, { wide: 1, sweat: 1, brow: -0.5 }],
          [noSym + 0.1, { eyeOpen: 0.55, brow: 0.4, smile: 1, blush: 0.4, sweat: 0.6 }]],
        cast: {
          boss: { pose: [[0, POSE('point', { x: 1.15, z: 0.9, ry: -0.6 })]], face: [[0, { brow: 1, smile: -0.7, eyeOpen: 0.7, open: 0.5, mouthW: 0.8 }]],
            update: ({ t, pose, face }) => { pose.bSz += Math.sin(t * 9) * 0.08; face.open = 0.35 + 0.3 * Math.abs(Math.sin(t * 11)); } },
          coworker: still(POSE('shrug', { x: -1.35, z: 0.8, ry: 0.5 }), { browA: -24, smile: -0.1 })
        },
        cam: (u) => dolly(u, D[3], [0.0, 2.7, 11.8], [0.0, 2.7, 10.4], [-0.1, 2.1, 0.9]),
        update: ({ u, t, pose }) => { if (u < noSym) fx.tremble(pose, t, 0.6 + smooth(creep, noSym, u)); }
      },
      { // 4 YEAR 5: toothache at night, can't sleep
        set: 'bedroom', env: 'night',
        pose: [[0, POSE('facepalm', { hx: 0.1 })], [sleep - 0.3, POSE('facepalm', { hx: 0.1 })], [sleep, POSE('tired', { bSx: -1.4, bSz: 0.05, bEx: -2.45, bEz: 0.45 })]],
        face: [[0, { eyeOpen: 0.05, brow: -0.7, smile: -0.8, mouthW: 0.7, sweat: 0.7 }], [tooth, { eyeOpen: 0.05, brow: -0.9, smile: -0.9, mouthW: 0.6, sweat: 1 }],
          [sleep, { eyeOpen: 0.45, bags: 1, brow: -0.6, smile: -0.7, sweat: 1, sweatY: 40 }]],
        cam: (u) => { const c = dolly(u, D[4], [1.0, 2.9, 6.0], [0.75, 2.9, 5.2], [-0.15, 2.4, 0.9]); c.p[0] += Math.sin(u * 1.3) * 0.04; return c; },
        update: ({ u, t, pose }) => { if (u > tooth - 0.2) fx.tremble(pose, t, 0.8); }
      },
      { // 5 YEAR 10: something's wrong; you finally go
        set: 'street', env: 'storm',
        pose: [[0, POSE('sway', { x: -0.1, z: 1.0 })], [wrong, POSE('scared', { x: -0.1, z: 1.0 })], [go, POSE('tired', { x: -0.1, z: 1.0 })], [D[5], POSE('tired', { x: -0.1, z: 2.3 })]],  // walks toward camera
        face: [[0, { eyeOpen: 0.4, bags: 1, brow: -0.4, smile: -0.4 }], [wrong, { wide: 1, bags: 1, brow: -0.6, open: 0.4, mouthW: 0.6, sweat: 1 }],
          [go + 0.2, { eyeOpen: 0.6, bags: 1, brow: -0.5, smile: -0.5, sweat: 1 }]],
        cast: crowd,
        cam: (u) => dolly(u, D[5], [0.3, 3.2, 13.0], [0.6, 3.1, 11.8], [0.1, 1.9, 0.3]),
        update: ({ u, t, pose }) => { if (u > go) fx.walk(pose, t, 0.9, 6); }
      },
      { // 6 the doctor (speaks): should have come years ago
        set: 'hospital', env: 'day',
        pose: [[0, POSE('scared', put(L, { ry: facing(L, R) }))], [simple, POSE('tired', put(L, { ry: facing(L, R), hx: 0.2 }))]],
        face: [[0, { wide: 1, brow: -0.6, sweat: 1, lookX: 0.5 }], [simple, { eyeOpen: 0.5, bags: 0.6, brow: -0.7, smile: -0.6, lookY: 0.6 }]],
        cast: {
          doctor: { pose: [[0, POSE('think', put(R, { ry: facing(R, L) }))], [caught, POSE('shrug', put(R, { ry: facing(R, L) }))]],
            face: [[0, { brow: -0.2, smile: -0.1, lookX: -0.4 }], [caught, { brow: -0.45, smile: -0.3, lookX: -0.4 }]] },
          nurse: still(POSE('idle', { x: -0.2, z: -1.3, ry: 0.15 }), { brow: -0.4, smile: -0.2 })
        },
        cam: (u) => dolly(u, D[6], [0.2, 2.8, 10.6], [0.7, 2.75, 7.8], [0.45, 2.35, 1.4])
      },
      { // 7 the lesson: caught early
        set: 'hospital', env: 'day',
        pose: [[0, POSE('tired', put(L, { ry: facing(L, R), hx: 0.2 }))], [early, POSE('idle', put(L, { ry: 0.2 }))]],
        face: [[0, { eyeOpen: 0.5, bags: 0.6, brow: -0.7, smile: -0.6, lookY: 0.6 }], [early, { browA: -18, brow: 0.1, smile: 0.2, mouthW: 0.8 }]],
        cast: { doctor: still(POSE('hips', put(R, { ry: facing(R, L) })), { smile: 0.4, lookX: -0.4 }) },
        cam: (u) => dolly(u, D[7], [-1.3, 2.9, 6.2], [-1.15, 2.9, 5.4], [-0.95, 2.5, 1.5])
      },
      { // 8 book the check-up: everyone together, waving
        set: 'field', env: 'day',
        pose: [[0, POSE('cheer')], [book + 0.3, POSE('point', { ry: -0.1 })], [thanks - 0.1, POSE('wave')]],
        face: [[0, { eyeOpen: 0.05, smile: 1, open: 0.6, mouthW: 1.1 }], [book + 0.2, { eyeOpen: 0.6, brow: 0.3, smile: 0.9 }], [thanks, { eyeOpen: 0.05, smile: 1, blush: 0.6 }]],
        cast: {
          mom: { pose: [[0, POSE('wave', { x: -1.45, z: 1.8, ry: 0.35 })]], face: [[0, { smile: 1, blush: 0.5 }]], update: ({ t, pose }) => fx.wave(pose, t + 0.5) },
          doctor: { pose: [[0, POSE('wave', { x: 1.3, z: 1.8, ry: -0.35 })]], face: [[0, { smile: 0.9 }]], update: ({ t, pose }) => fx.wave(pose, t) },
          nurse: still(POSE('cheer', { x: 0.75, z: -0.3, ry: -0.2 }), { eyeOpen: 0.05, smile: 1, open: 0.5 })
        },
        cam: (u) => dolly(u, D[8], [0.0, 2.8, 13.8], [0.0, 2.7, 12.6], [-0.1, 2.2, 1.2]),
        update: ({ t, pose, u }) => { if (u > thanks - 0.1) fx.wave(pose, t); }
      }
    ]
  };
}
