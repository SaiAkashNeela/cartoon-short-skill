// SPDX-License-Identifier: MIT — Copyright (c) 2026 Sai Akash Neela — https://github.com/SaiAkashNeela/cartoon-short-skill
// "What if you drank only coffee for a week?" — one shot per script line.
export const character = {};  // Classic look: keep the same character across the channel

export default function episode({ E, CUT, D, at, dolly, POSE, fx, smooth, lerp, clamp }) {
  const hold = (name, extra = {}) => POSE(name, { bSx: -0.6, bSz: 0.15, bEx: -1.15, bEz: 0.35, ...extra });  // any pose, mug held at chest
  const shake = (u, t, k) => Math.sin(t * 43) * 0.03 * k;                                                 // mug jitter

  // word anchors (shot-relative seconds)
  const c0 = at(0, 'coffee'), ew = at(0, 'entire');
  const un = at(1, 'unstoppable'), hr = at(1, 'heart'), hb = at(1, 'hands'), lv = at(1, 'love');
  const bs = at(2, 'barely'), he = at(2, 'havent'), sh = at(2, 'shake'), sp = at(2, 'spill');
  const bd = at(3, 'body'), mu = at(3, 'muscle');
  const jt = at(4, 'just'), tw = at(4, 'twelve'), tt = at(4, 'thats'), lim = at(4, 'limit');
  const fallU = E[5] + 0.15 - CUT[5];

  return {
    shots: [
      { // 0 hook: blissful sip, then eyes snap open at camera
        set: 'kitchen', env: 'morning',          // hook: the first coffee of the week
        pose: [[0, POSE('holdMug')], [c0 - 0.7, POSE('sip')], [ew - 0.2, POSE('sip')], [ew + 0.15, hold('idle', { hz: 0.12 })]],
        face: [[0, { smile: 0.4 }], [c0 - 0.5, { eyeOpen: 0.05, smile: 0.5, blush: 0.5 }], [ew - 0.2, { eyeOpen: 0.05, smile: 0.5, blush: 0.5 }],
          [ew + 0.05, { browA: -26, brow: 0.15, smile: 0.15, mouthW: 0.7 }]],
        cam: (u) => dolly(u, D[0], [2.0, 2.45, 9.0], [1.2, 2.4, 7.0], [-0.5, 2.3, 0.5]),
        update: ({ u, props }) => { props.mug = 1; props.mugTilt = -0.9 * smooth(c0 - 0.5, c0 - 0.1, u) * (1 - smooth(ew - 0.2, ew + 0.1, u)); }
      },
      { // 1 day one: wired and loving it
        set: 'office', env: 'day',               // wired and 'productive'
        pose: [[0, hold('idle')], [un - 0.2, POSE('cheer', { bSz: 2.0 })], [hr - 0.2, POSE('cheer', { bSz: 2.0 })], [hr + 0.1, hold('hips', { bSz: 0.2 })],
          [lv - 0.4, hold('hips', { bSz: 0.2 })], [lv - 0.1, POSE('cheer', { bSz: 2.0 })]],
        face: [[0, { eyeOpen: 1, smile: 0.6 }], [un - 0.2, { eyeOpen: 1, brow: 0.3, smile: 1, open: 0.5, mouthW: 1.1 }], [hr, { wide: 1, smile: 0.9, open: 0.3, mouthW: 1 }],
          [lv - 0.3, { wide: 1, smile: 0.9, open: 0.3, mouthW: 1 }], [lv, { eyeOpen: 0.05, smile: 1, open: 0.7, mouthW: 1.1, blush: 0.6 }]],
        cam: (u) => { const c = dolly(u, D[1], [1.1, 2.45, 7.0], [0.7, 2.45, 6.2], [-0.1, 2.15, 0.9]); c.p[0] += Math.sin(u * 37) * 0.012; c.p[1] += Math.sin(u * 41) * 0.012; return c; },
        update: ({ u, t, pose, props }) => {
          props.mug = 1; fx.bounce(pose, u, 1.6, 7);
          if (u > hb - 0.1) fx.tremble(pose, t, 1.8);  // "hands buzzing"
        }
      },
      { // 2 day three: wrecked, shaking, spilling
        set: 'bedroom', env: 'night',            // can't sleep
        pose: [[0, hold('tired')], [sh - 0.3, hold('tired')], [sh, hold('tired', { lean: 0.05, hx: -0.05 })]],
        face: [[0, { eyeOpen: 0.45, bags: 0.85, brow: -0.25, smile: -0.25 }], [he, { eyeOpen: 0.45, bags: 0.85, brow: -0.6, smile: -0.5 }],
          [sh, { wide: 1, bags: 0.9, brow: -0.5, open: 0.2, mouthW: 0.6, sweat: 1, lookX: 0.4, lookY: 0.6 }], [sp + 0.6, { eyeOpen: 0.5, bags: 0.9, brow: 0.5, smile: -0.6, sweat: 1, sweatY: 40 }]],
        cam: (u) => { const c = dolly(u, D[2], [1.0, 2.8, 6.0], [0.75, 2.75, 5.3], [-0.1, 2.2, 0.9]); c.p[0] += Math.sin(u * 1.3) * 0.05; return c; },
        update: ({ u, t, pose, props }) => {
          props.mug = 1; props.cups = lerp(2, 6, smooth(0, D[2], u));
          const k = 0.6 + 2.2 * smooth(sh - 0.2, sh + 0.2, u);
          fx.tremble(pose, t, k);
          props.mugTilt = shake(u, t, k) * 4 + 0.7 * Math.max(0, Math.sin((u - sp) * 9)) * smooth(sp - 0.05, sp + 0.1, u) * (1 - smooth(sp + 0.6, sp + 0.9, u));  // the spill lurch
        }
      },
      { // 3 day five: running on empty
        set: 'street', env: 'storm',             // out in the grey, running on empty
        pose: [[0, hold('sway')], [bd - 0.2, hold('sway')], [bd + 0.3, hold('tired', { hx: 0.45, lean: 0.15 })], [mu - 0.2, hold('tired', { hx: 0.45, lean: 0.15 })], [mu + 0.1, hold('jolt', { bSz: 0.2 })]],
        face: [[0, { eyeOpen: 0.35, bags: 1, brow: -0.4, smile: -0.3, sweat: 0.6 }], [bd + 0.3, { eyeOpen: 0.7, bags: 1, brow: -0.6, smile: -0.4, lookY: 0.9 }],
          [mu, { wide: 1, bags: 1, brow: -0.6, open: 0.7, mouthW: 0.6, sweat: 1, lookY: 0.6 }]],
        cam: (u) => dolly(u, D[3], [1.3, 2.2, 8.6], [1.0, 2.1, 7.8], [-0.85, 1.6, 0.7]),
        update: ({ u, t, pose, props }) => { props.mug = 1; props.cups = lerp(6, 10, smooth(0, D[3], u)); fx.tremble(pose, t, 0.8); }
      },
      { // 4 day seven: desperate sips, cups everywhere, panic
        set: 'kitchen', env: 'dusk',             // the cup pyramid at home
        pose: [[0, POSE('holdMug')], [jt - 0.2, POSE('sip')], [tw - 0.1, POSE('sip')], [tw + 0.25, hold('scared', { bSz: 0.3, bEx: -1.4 })], [lim, hold('scared', { bSz: 0.3, bEx: -1.4, x: 0.1 })]],
        face: [[0, { eyeOpen: 0.5, bags: 1, smile: -0.3 }], [jt - 0.1, { eyeOpen: 0.05, bags: 1, smile: -0.2 }], [tw + 0.15, { wide: 1, bags: 1, brow: -0.6, open: 0.8, mouthW: 0.6, sweat: 1, lookX: -0.7, lookY: 0.7 }],
          [tt, { wide: 1, bags: 1, brow: -0.7, open: 0.5, mouthW: 0.55, sweat: 1, lookX: 0, lookY: 0 }], [lim + 0.4, { wide: 1, bags: 1, brow: -0.8, open: 0.9, mouthW: 0.6, sweat: 1, sweatY: 60 }]],
        cam: (u) => dolly(u, D[4], [1.6, 3.2, 7.4], [2.2, 3.4, 9.2], [-0.6, 1.5, 0.6], { roll: 0.06 * Math.sin(u * 1.6) + 0.04 }),
        update: ({ u, t, pose, props }) => {
          props.mug = 1;
          props.mugTilt = -0.9 * smooth(jt - 0.1, jt + 0.2, u) * (1 - smooth(tw, tw + 0.25, u));
          props.cups = lerp(10, 24, smooth(tw, tw + 1.4, u)) ;   // "twelve cups" — the pile explodes
          if (u > tw + 0.2) fx.tremble(pose, t, 1 + smooth(tt, lim, u) * 1.5);
        }
      },
      { // 5 the end: collapses... and still can't sleep
        set: 'hospital', env: 'night',           // the consequence
        pose: [[0, hold('sway')], [1.4, hold('sway', { hz: 0.2, side: 0.05 })], [fallU, hold('sway', { hx: 0.2, lean: -0.05 })], [fallU + 0.55, POSE('fallen')]],
        face: [[0, { eyeOpen: 0.35, bags: 1, smile: -0.2, sweat: 0.6 }], [fallU - 0.2, { eyeOpen: 0.15, bags: 1, smile: 0 }],
          [fallU + 0.5, { eyeOpen: 0.05, bags: 1, smile: 0 }], [fallU + 1.3, { eyeOpen: 0.05, bags: 1, smile: 0 }], [fallU + 1.45, { wide: 1, bags: 1, brow: -0.3, smile: -0.2, mouthW: 0.7 }]],
        cam: (u) => { const k = smooth(fallU + 0.2, fallU + 2.2, u); return { p: [lerp(0.9, 0.1, k), lerp(2.4, 6.6, k), lerp(6.6, 3.2, k)], l: [-0.1, lerp(2.0, 0.35, k), lerp(0.9, -0.4, k)] }; },
        update: ({ u, t, pose, face, props }) => {
          pose.fall = fx.fall(u, fallU); props.cups = 24; props.mug = u < fallU + 0.1 ? 1 : 0;
          fx.tremble(pose, t, 0.6);
          if (u > fallU + 1.45) { face.lookX = Math.sin(t * 23) * 0.5; face.lookY = Math.cos(t * 17) * 0.3; }  // wide-eyed twitching: caffeine wins
        }
      }
    ]
  };
}
