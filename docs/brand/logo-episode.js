// SPDX-License-Identifier: MIT — Copyright (c) 2026 Sai Akash Neela — https://github.com/SaiAkashNeela/cartoon-short-skill
// Logo poses on the studio set with a magenta chroma-key backdrop (keyed out by compose_brand.py).
export const character = {};
export default function ({ POSE }) {
  const KEY = '#ff00ff';   // chroma key, keyed out afterwards
  return { blinks: [], punch: false, shots: [
    // 0 icon: head + shoulders, friendly smug grin, slight head tilt
    { set: 'studio', backdrop: KEY, env: 'day', pose: [[0, POSE('idle', { hz: -0.12, hx: -0.06, hy: 0.12 })]],
      face: [[0, { eyeOpen: 0.62, brow: 0.35, browA: -14, smile: 1, mouthW: 1.1, blush: 0.55, lookX: 0.15 }]],
      cam: () => ({ p: [0.35, 2.72, 6.4], l: [-0.08, 2.55, 0.9], fov: 34 }) },
    // 1 wordmark: waving, half body
    { set: 'studio', backdrop: KEY, env: 'day', pose: [[0, POSE('wave', { hz: -0.08 })]],
      face: [[0, { eyeOpen: 1, smile: 1, open: 0.45, mouthW: 1.05, blush: 0.5 }]],
      cam: () => ({ p: [0.5, 2.3, 7.0], l: [0.05, 2.15, 0.9] }) },
    // 2 alternate icon: big laugh
    { set: 'studio', backdrop: KEY, env: 'day', pose: [[0, POSE('idle', { hz: 0.1, hx: -0.12 })]],
      face: [[0, { eyeOpen: 0.05, smile: 0.9, open: 0.7, mouthW: 1.1, blush: 0.6 }]],
      cam: () => ({ p: [0.35, 2.72, 6.4], l: [-0.08, 2.55, 0.9], fov: 34 }) },
  ] };
}
