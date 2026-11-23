// SPDX-License-Identifier: MIT — Copyright (c) 2026 Sai Akash Neela — https://github.com/SaiAkashNeela/cartoon-short-skill
// Banner cast: Bobble + 7 characters on the studio set with a magenta chroma-key backdrop (keyed by compose_banner.py).
export const character = {};
export const cast = {
  doctor: { coat: '#ffffff', hoodie: '#4a7fc1', hat: 'hair', hair: '#2b1d14', glasses: true },
  nurse: { coat: '#7fc8c0', hoodie: '#5aa9a0', hat: 'bun', hair: '#5a3a22', lashes: true },
  mom: { top: 'shirt', hoodie: '#e8655a', hoodieDark: '#c84d43', hat: 'longHair', hair: '#2b1d14', lashes: true },
  kid: { hat: 'cap', beanie: '#e2493b', beanieBand: '#ffffff', hoodie: '#f4c430', hoodieDark: '#e0a91c', height: 0.72 },
  boss: { top: 'shirt', hoodie: '#f4f1ea', hoodieDark: '#d9d4c8', tie: '#e2493b', hat: 'none', mustache: true, hair: '#4a4a52', legs: '#2d3a5a', height: 1.06 },
  coworker: { top: 'shirt', hoodie: '#6b45c6', hoodieDark: '#5233a0', hat: 'longHair', hair: '#a8642a', glasses: true, lashes: true },
  friend: { hat: 'cap', beanie: '#3f8f4f', beanieBand: '#2f6f3c', hoodie: '#26252e', hoodieDark: '#18171e' },
};
export default function ({ POSE, fx }) {
  const KEY = '#ff00ff', CAM = () => ({ p: [0.4, 1.9, 7.6], l: [-0.1, 1.75, 0.9] });
  const solo = (name, pose, face, over = {}, wave = false) => ({ set: 'studio', backdrop: KEY, env: 'day', cam: CAM,
    cast: { [name]: { pose: [[0, POSE(pose, { x: -0.1, z: 0.9, ...over })]], face: [[0, face]], update: wave ? ({ t, pose }) => fx.wave(pose, t) : undefined } } });
  return { blinks: [], punch: false, shots: [
    { set: 'studio', backdrop: KEY, env: 'day', cam: CAM, pose: [[0, POSE('cheer')]], face: [[0, { eyeOpen: 0.05, smile: 1, open: 0.6, mouthW: 1.1, blush: 0.5 }]] },
    solo('doctor', 'think', { brow: 0.2, smile: 0.4 }, { ry: 0.35 }),
    solo('nurse', 'wave', { smile: 1, blush: 0.5 }, { ry: 0.3 }, true),
    solo('mom', 'hips', { smile: 0.8, eyeOpen: 0.7 }, { ry: 0.35 }),
    solo('kid', 'cheer', { eyeOpen: 0.05, smile: 1, open: 0.6 }, { ry: -0.3 }),
    solo('boss', 'point', { brow: 0.8, smile: 0.2, eyeOpen: 0.7 }, { ry: -0.5 }),
    solo('coworker', 'shrug', { browA: -24, smile: 0.3 }, { ry: -0.35 }),
    solo('friend', 'wave', { smile: 1 }, { ry: -0.3 }, true),
  ] };
}
