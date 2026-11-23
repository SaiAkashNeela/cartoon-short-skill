// SPDX-License-Identifier: MIT — Copyright (c) 2026 Sai Akash Neela — https://github.com/SaiAkashNeela/cartoon-short-skill
// Locations ("sets") a shot can use via `set: '<name>'`. The field set lives in scene.html; everything else is here.
//
// Layout rules every set follows, so the episode cameras keep working:
//  - the character stands around x≈-0.1, z≈0.9 facing +z; cameras look from +z
//  - the back of the set sits at z≈-3 (rooms) and the eye-catching props live in x∈[-3, 3.6] behind the character,
//    which is what a portrait frame sees; keep x∈[-0.8, 0.8], z>-0.5 clear for the character's arms
//  - scale is ~1.9 units per metre (the character is ~3.3 units tall)
// Each set returns { group, outdoor, update(t, env, night) }; `night` is 0 (day) … 1 (night) for lamps and screens.

export function buildSets({ THREE, mesh, toon, skyU }) {
  const PI = Math.PI;
  let seed = 777; const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);

  const tex = (w, h, draw, rx = 1, ry = 1) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry); t.anisotropy = 8; return t;
  };
  const box = (g, w, h, d, color, x, y, z, ol = 0.015, opts = {}) => {
    const m = mesh(new THREE.BoxGeometry(w, h, d), typeof color === 'string' ? toon(color, opts) : color, { outline: ol });
    m.position.set(x, y, z); g.add(m); return m;
  };
  const cyl = (g, r0, r1, h, color, x, y, z, ol = 0.012, seg = 20) => {
    const m = mesh(new THREE.CylinderGeometry(r0, r1, h, seg), typeof color === 'string' ? toon(color) : color, { outline: ol });
    m.position.set(x, y, z); g.add(m); return m;
  };
  const glow = (color) => new THREE.MeshBasicMaterial({ color, fog: false });
  const lamp = (g, x, y, z, color = 0xffd9a0, power = 6, range = 9) => {
    const l = new THREE.PointLight(color, 0, range, 1.2); l.position.set(x, y, z); g.add(l); return { l, power };
  };

  // window pane showing the current sky colours (shares the sky uniforms), with a moon for night shots
  const paneMat = new THREE.ShaderMaterial({
    uniforms: skyU, fog: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying vec2 vUv; void main(){ gl_FragColor = vec4(mix(bot, top, smoothstep(0., 1., vUv.y)), 1.);\n#include <colorspace_fragment>\n}'
  });
  const moons = [];
  function windowOn(g, x, y, w, h, frame = '#ffffff', z = -2.98) {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), paneMat); pane.position.set(x, y, z + 0.01); g.add(pane);
    const moonM = new THREE.Mesh(new THREE.CircleGeometry(Math.min(w, h) * 0.11, 24), new THREE.MeshBasicMaterial({ color: 0xfff4c8, transparent: true, opacity: 0, fog: false }));
    moonM.position.set(x - w * 0.3, y + h * 0.24, z + 0.02); g.add(moonM); moons.push(moonM);  // left of centre: clear of the head in close-ups
    const t = 0.14, d = 0.16;
    box(g, w + t * 2, t, d, frame, x, y + h / 2 + t / 2, z + 0.05); box(g, w + t * 2, t, d, frame, x, y - h / 2 - t / 2, z + 0.05);
    box(g, t, h, d, frame, x - w / 2 - t / 2, y, z + 0.05); box(g, t, h, d, frame, x + w / 2 + t / 2, y, z + 0.05);
    box(g, 0.07, h, 0.08, frame, x, y, z + 0.04, 0.008); box(g, w, 0.07, 0.08, frame, x, y, z + 0.04, 0.008);
    box(g, w + 0.5, 0.12, 0.35, frame, x, y - h / 2 - 0.2, z + 0.16);  // sill
    return pane;
  }
  function room(g, { floorTex, wallTex, floor = '#ffffff', wall = '#ffffff', trim = '#ffffff' }) {
    const f = mesh(new THREE.PlaneGeometry(16, 16), toon(floor, { map: floorTex }), { cast: false }); f.rotation.x = -PI / 2; f.position.set(0, 0, 4); g.add(f);
    const wm = toon(wall, { map: wallTex });
    const b = mesh(new THREE.PlaneGeometry(16, 9), wm, { cast: false }); b.position.set(0, 4.5, -3); g.add(b);
    for (const sx of [-1, 1]) { const s = mesh(new THREE.PlaneGeometry(16, 9), wm, { cast: false }); s.rotation.y = -sx * PI / 2; s.position.set(sx * 6, 4.5, 5); g.add(s); }
    box(g, 16, 0.26, 0.08, trim, 0, 0.13, -2.95, 0.008);
  }
  const plant = (g, x, z, s = 1, pot = '#d9774b', y0 = 0) => {
    cyl(g, 0.32 * s, 0.24 * s, 0.6 * s, pot, x, y0 + 0.3 * s, z);
    for (let i = 0; i < 6; i++) { const l = mesh(new THREE.IcosahedronGeometry((0.28 + rnd() * 0.15) * s, 0), toon(i % 2 ? '#4f9e3a' : '#3d8530', { flatShading: true }), { outline: 0.012 }); l.position.set(x + (rnd() - .5) * 0.5 * s, y0 + (0.8 + rnd() * 0.6) * s, z + (rnd() - .5) * 0.4 * s); g.add(l); }
  };

  // ---- textures ----
  const planks = (base) => tex(256, 256, (c) => {
    for (let y = 0; y < 256; y += 32) { c.fillStyle = base[(y / 32) % base.length]; c.fillRect(0, y, 256, 32); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, y, 256, 2);
      const off = (y * 37) % 256; c.fillRect(off, y, 2, 32); c.fillRect((off + 128) % 256, y, 2, 32); }
  }, 5, 5);
  const stripes = (a, b) => tex(128, 128, (c) => { c.fillStyle = a; c.fillRect(0, 0, 128, 128); c.fillStyle = b; for (let x = 0; x < 128; x += 32) c.fillRect(x, 0, 12, 128); }, 10, 3);
  const tiles = (tile, grout, w = 64, h = 32) => tex(256, 256, (c) => {
    c.fillStyle = grout; c.fillRect(0, 0, 256, 256); c.fillStyle = tile;
    for (let y = 0, r = 0; y < 256; y += h, r++) for (let x = -(r % 2) * w / 2; x < 256; x += w) c.fillRect(x + 2, y + 2, w - 4, h - 4);
  }, 6, 4);
  const checker = (a, b) => tex(128, 128, (c) => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { c.fillStyle = (x + y) % 2 ? a : b; c.fillRect(x * 32, y * 32, 32, 32); } }, 8, 8);
  const speckle = (base, dots, n = 900, rx = 8, ry = 8) => tex(256, 256, (c) => { c.fillStyle = base; c.fillRect(0, 0, 256, 256); for (let i = 0; i < n; i++) { c.fillStyle = dots[i % dots.length]; c.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 3, 2 + rnd() * 3); } }, rx, ry);

  const sets = {};

  // ================= bedroom =================
  {
    const g = new THREE.Group();
    room(g, { floorTex: planks(['#c98f58', '#b97f4b', '#d19c66']), wallTex: stripes('#a9c8ea', '#9bbde2'), trim: '#f4efe6' });
    windowOn(g, -1.5, 3.6, 2.2, 2.0);
    for (const x of [-2.95, -0.05]) box(g, 0.55, 3.8, 0.18, '#f08a5d', x, 3.5, -2.8, 0.015);
    box(g, 3.3, 0.08, 0.1, '#7a5a3c', -1.5, 5.45, -2.82);
    // bed
    box(g, 2.8, 2.1, 0.22, '#8a5b3a', 2.3, 1.05, -2.85);
    box(g, 2.7, 0.55, 3.8, '#9c6a44', 2.3, 0.38, -1.05);
    box(g, 2.6, 0.32, 3.7, '#f6f3ee', 2.3, 0.82, -1.05, 0.012);
    box(g, 2.68, 0.36, 2.5, '#e8655a', 2.3, 0.86, -0.35, 0.014);
    const pil = mesh(new THREE.SphereGeometry(0.5, 20, 12), toon('#ffffff'), { outline: 0.012 }); pil.scale.set(1.6, 0.42, 0.75); pil.position.set(2.3, 1.12, -2.35); g.add(pil);
    // nightstand + lamp
    box(g, 1.0, 1.1, 0.9, '#b07a4a', -2.75, 0.55, -2.4); box(g, 0.06, 0.06, 0.02, '#3a2a1a', -2.75, 0.75, -1.94, 0);
    cyl(g, 0.16, 0.2, 0.12, '#444a55', -2.75, 1.16, -2.4); cyl(g, 0.03, 0.03, 0.6, '#444a55', -2.75, 1.5, -2.4);
    const bulbB = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), glow(0x776655)); bulbB.position.set(-2.75, 1.78, -2.4); g.add(bulbB);
    const shade = mesh(new THREE.CylinderGeometry(0.28, 0.42, 0.5, 20, 1, true), toon('#f7e6c4', { side: THREE.DoubleSide }), { outline: 0.012 }); shade.position.set(-2.75, 1.9, -2.4); g.add(shade);
    const lb = lamp(g, -2.75, 1.9, -2.0, 0xffcf8a, 9, 10);
    // poster + rug
    box(g, 1.5, 1.9, 0.06, '#2b2b35', 2.3, 4.75, -2.96, 0.01);
    const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.7), toon('#ffffff', { map: tex(128, 168, (c) => {
      c.fillStyle = '#26315f'; c.fillRect(0, 0, 128, 168); c.fillStyle = '#ffd93b'; c.beginPath(); c.arc(84, 50, 22, 0, PI * 2); c.fill();
      c.fillStyle = '#e8655a'; c.beginPath(); c.moveTo(0, 168); c.lineTo(60, 90); c.lineTo(128, 168); c.fill(); c.fillStyle = '#f08a5d'; c.beginPath(); c.moveTo(40, 168); c.lineTo(100, 110); c.lineTo(160, 168); c.fill();
    }) })); poster.position.set(2.3, 4.75, -2.92); g.add(poster);
    const rug = new THREE.Mesh(new THREE.CircleGeometry(2.1, 40), toon('#f2c14e')); rug.rotation.x = -PI / 2; rug.position.set(-0.3, 0.012, 0.9); rug.receiveShadow = true; g.add(rug);
    const rug2 = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.8, 40), toon('#e0a930')); rug2.rotation.x = -PI / 2; rug2.position.set(-0.3, 0.014, 0.9); g.add(rug2);
    sets.bedroom = { group: g, outdoor: false, update: (t, e, n) => { lb.l.intensity = lb.power * n; bulbB.material.color.set(n > 0.3 ? 0xfff2c0 : 0x776655); } };
  }

  // ================= kitchen =================
  {
    const g = new THREE.Group();
    room(g, { floorTex: checker('#f3efe6', '#3a4658'), wallTex: tiles('#fbfaf6', '#d8d4cc', 48, 24), trim: '#79c7b0' });
    box(g, 12, 1.7, 1.2, '#79c7b0', 0, 0.85, -2.4);
    for (let x = -5.4; x <= 1.4; x += 1.35) { box(g, 0.03, 1.4, 0.02, '#4f9c86', x + 0.67, 0.85, -1.79, 0); box(g, 0.08, 0.3, 0.06, '#e9e4da', x + 0.45, 1.25, -1.76, 0.006); }
    box(g, 12.2, 0.14, 1.32, '#efe3cc', 0, 1.77, -2.35);
    box(g, 4.0, 1.6, 0.7, '#79c7b0', -4.3, 4.4, -2.65); box(g, 1.5, 1.6, 0.7, '#79c7b0', 1.85, 4.4, -2.65);
    windowOn(g, -0.95, 3.95, 2.4, 1.7);
    // fridge
    box(g, 1.7, 4.0, 1.4, '#e3e9f0', 3.55, 2.0, -2.3); box(g, 1.66, 0.04, 0.02, '#a9b4c2', 3.55, 2.7, -1.59, 0);
    box(g, 0.08, 0.7, 0.08, '#a9b4c2', 2.85, 3.3, -1.55, 0.006); box(g, 0.08, 0.7, 0.08, '#a9b4c2', 2.85, 1.9, -1.55, 0.006);
    // sink + faucet
    box(g, 1.3, 0.05, 0.85, '#9aa3ad', -0.95, 1.85, -2.3, 0.008);
    cyl(g, 0.05, 0.05, 0.55, '#c9d0d8', -0.95, 2.1, -2.75); box(g, 0.08, 0.08, 0.45, '#c9d0d8', -0.95, 2.36, -2.55, 0.006);
    // coffee machine
    box(g, 0.85, 1.05, 0.75, '#2b2b33', 1.45, 2.37, -2.45);
    box(g, 0.6, 0.18, 0.3, '#3d3d48', 1.45, 2.6, -2.0, 0.008);
    const carafe = cyl(g, 0.2, 0.22, 0.42, new THREE.MeshToonMaterial({ color: '#cfe8f5', transparent: true, opacity: 0.6 }), 1.45, 2.05, -2.05, 0.008);
    cyl(g, 0.18, 0.2, 0.2, '#5a3420', 1.45, 1.95, -2.05, 0);
    const led = new THREE.Mesh(new THREE.CircleGeometry(0.05, 12), glow(0xff4a3a)); led.position.set(1.75, 2.7, -2.07); g.add(led);
    // fruit bowl, plant, pendant lamp
    const bowl = mesh(new THREE.SphereGeometry(0.45, 20, 10, 0, PI * 2, PI / 2, PI / 2), toon('#4f7fd1', { side: THREE.DoubleSide }), { outline: 0.01 }); bowl.position.set(-3.0, 2.25, -2.3); g.add(bowl);
    for (const [dx, dz] of [[-0.15, 0], [0.15, 0.05], [0, -0.12]]) { const o = mesh(new THREE.SphereGeometry(0.17, 14, 10), toon('#f39a2a'), { outline: 0.008 }); o.position.set(-3.0 + dx, 2.3, -2.3 + dz); g.add(o); }
    plant(g, -4.8, -2.4, 1, '#d9774b', 1.84);
    cyl(g, 0.015, 0.015, 2.0, '#333333', -0.95, 7.0, -1.2, 0, 6);
    const pend = mesh(new THREE.CylinderGeometry(0.15, 0.55, 0.45, 20, 1, true), toon('#f4c430', { side: THREE.DoubleSide }), { outline: 0.012 }); pend.position.set(-0.95, 5.85, -1.2); g.add(pend);
    const lk = lamp(g, -0.95, 5.6, -1.0, 0xffd9a0, 10, 12);
    sets.kitchen = { group: g, outdoor: false, update: (t, e, n) => { lk.l.intensity = 2 + lk.power * n; } };
  }

  // ================= office =================
  {
    const g = new THREE.Group();
    room(g, { floorTex: speckle('#8d98a8', ['#7d8898', '#9aa5b5']), wallTex: speckle('#efe6d6', ['#e6dccb', '#f4ecdf'], 300, 6, 3), trim: '#c9bfae' });
    windowOn(g, -1.8, 4.0, 3.0, 2.5);
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.5), new THREE.MeshBasicMaterial({ transparent: true, fog: false, map: tex(300, 250, (c) => {
      for (let i = 0; i < 14; i++) { const w = 14 + rnd() * 26, h = 50 + rnd() * 140, x = i * 22 - 10; c.fillStyle = i % 2 ? '#3b4a66' : '#4a5a7a'; c.fillRect(x, 250 - h, w, h);
        c.fillStyle = 'rgba(255,220,130,0.85)'; for (let wy = 250 - h + 8; wy < 245; wy += 12) for (let wx = x + 4; wx < x + w - 4; wx += 8) if (rnd() < 0.35) c.fillRect(wx, wy, 3, 5); }
    }) })); sky.position.set(-1.8, 4.0, -2.96); g.add(sky);
    // desk, monitor, keyboard, lamp
    box(g, 2.9, 0.12, 1.3, '#b98b5e', 2.3, 1.45, -0.95);
    for (const [dx, dz] of [[-1.35, -0.55], [1.35, -0.55], [-1.35, 0.55], [1.35, 0.55]]) box(g, 0.1, 1.4, 0.1, '#7a5a3c', 2.3 + dx, 0.7, -0.95 + dz, 0.008);
    box(g, 0.9, 0.9, 1.1, '#a67b51', 3.2, 0.9, -0.95);
    box(g, 1.6, 1.0, 0.08, '#22252c', 2.2, 2.2, -1.35); cyl(g, 0.05, 0.05, 0.4, '#22252c', 2.2, 1.65, -1.38, 0.006); box(g, 0.5, 0.04, 0.3, '#22252c', 2.2, 1.52, -1.38, 0.006);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.86), new THREE.MeshBasicMaterial({ fog: false, map: tex(290, 172, (c) => {
      c.fillStyle = '#1d2433'; c.fillRect(0, 0, 290, 172); const cols = ['#6ad3ff', '#ffd93b', '#ff7a8a', '#9be05a', '#c9a6ff'];
      for (let y = 14; y < 165; y += 14) { let x = 12 + (rnd() < 0.5 ? 16 : 0); while (x < 250 && rnd() < 0.85) { const w = 14 + rnd() * 50; c.fillStyle = cols[Math.floor(rnd() * 5)]; c.fillRect(x, y, w, 6); x += w + 8; } }
    }) })); screen.position.set(2.2, 2.2, -1.30); g.add(screen);
    box(g, 1.1, 0.05, 0.38, '#3a3f4a', 2.2, 1.53, -0.6, 0.006);
    cyl(g, 0.15, 0.18, 0.06, '#e2493b', 3.4, 1.54, -1.2, 0.008); const arm = box(g, 0.05, 0.8, 0.05, '#e2493b', 3.35, 1.9, -1.2, 0.006); arm.rotation.z = 0.35;
    const dl = mesh(new THREE.ConeGeometry(0.2, 0.3, 16, 1, true), toon('#e2493b', { side: THREE.DoubleSide }), { outline: 0.008 }); dl.position.set(3.1, 2.28, -1.15); dl.rotation.z = 0.9; g.add(dl);
    const ld = lamp(g, 2.9, 2.1, -0.9, 0xffd9a0, 6, 8); const ls = lamp(g, 2.2, 2.2, -0.6, 0x8fc8ff, 2.5, 6);
    // bookshelf, plant, clock
    box(g, 1.9, 5.2, 0.8, '#8a6a48', -4.1, 2.6, -2.6);
    for (let s = 0; s < 4; s++) { box(g, 1.7, 0.08, 0.7, '#6d5236', -4.1, 0.7 + s * 1.25, -2.5, 0.006); let x = -4.85;
      while (x < -3.4) { const w = 0.1 + rnd() * 0.12, h = 0.6 + rnd() * 0.4; box(g, w, h, 0.5, ['#e2493b', '#3b78db', '#f4c430', '#3f8f4f', '#6b45c6', '#f08a24'][Math.floor(rnd() * 6)], x + w / 2, 0.74 + s * 1.25 + h / 2, -2.45, 0.006); x += w + 0.02; } }
    plant(g, 0.6, -2.4, 1.3);
    const clock = cyl(g, 0.5, 0.5, 0.08, '#ffffff', 2.3, 5.2, -2.95, 0.02, 32); clock.rotation.x = PI / 2;
    const hand1 = box(g, 0.05, 0.32, 0.02, '#15131a', 2.3, 5.34, -2.89, 0); const hand2 = box(g, 0.04, 0.22, 0.02, '#15131a', 2.38, 5.2, -2.89, 0); hand2.rotation.z = -1.4;
    sets.office = { group: g, outdoor: false, update: (t, e, n) => { ld.l.intensity = 1 + ld.power * n; ls.l.intensity = ls.power * (0.3 + n); hand1.rotation.z = -t * 0.6; } };
  }

  // ================= hospital =================
  {
    const g = new THREE.Group();
    room(g, { floorTex: speckle('#dfe8e4', ['#c9d6d0', '#eef3f0', '#b9c9c2']), wallTex: speckle('#e3f1ec', ['#dbebe5'], 200, 6, 3), trim: '#9fd3c7' });
    box(g, 16, 1.9, 0.04, '#a9dccf', 0, 0.95, -2.97, 0); box(g, 16, 0.12, 0.16, '#f4f7f6', 0, 1.95, -2.9, 0.008);
    // bed with rails and raised back
    box(g, 2.6, 0.5, 3.6, '#e8eef0', 2.3, 0.85, -1.15); for (const dx of [-1.15, 1.15]) for (const dz of [-2.7, 0.45]) cyl(g, 0.12, 0.12, 0.1, '#555b66', 2.3 + dx, 0.12, dz, 0.006);
    for (const dx of [-1.15, 1.15]) for (const dz of [-2.7, 0.45]) box(g, 0.08, 0.65, 0.08, '#c9d0d8', 2.3 + dx, 0.45, dz, 0.006);
    box(g, 2.55, 0.25, 2.2, '#9cc9e6', 2.3, 1.2, -0.35, 0.012);
    const back = box(g, 2.5, 0.22, 1.5, '#9cc9e6', 2.3, 1.55, -2.15, 0.012); back.rotation.x = -0.6;
    const pil = mesh(new THREE.SphereGeometry(0.5, 20, 12), toon('#ffffff'), { outline: 0.012 }); pil.scale.set(1.4, 0.4, 0.7); pil.position.set(2.3, 2.0, -2.45); pil.rotation.x = -0.6; g.add(pil);
    for (const dx of [-1.32, 1.32]) { box(g, 0.06, 0.06, 1.8, '#c9d0d8', 2.3 + dx, 1.65, -0.9, 0.006); for (const dz of [-1.7, -0.1]) box(g, 0.05, 0.5, 0.05, '#c9d0d8', 2.3 + dx, 1.4, dz, 0.004); }
    // heart monitor with scrolling ECG
    box(g, 1.4, 1.0, 0.28, '#3a3f4a', -1.4, 3.7, -2.82); box(g, 0.15, 0.6, 0.15, '#3a3f4a', -1.4, 3.0, -2.9, 0.006);
    const ecgTex = tex(256, 128, (c) => {
      c.fillStyle = '#071a12'; c.fillRect(0, 0, 256, 128); c.strokeStyle = 'rgba(80,200,140,0.25)'; c.lineWidth = 1;
      for (let x = 0; x < 256; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 128); c.stroke(); } for (let y = 0; y < 128; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke(); }
      c.strokeStyle = '#4dff9a'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 74);
      for (const x0 of [0, 128]) { c.lineTo(x0 + 40, 74); c.lineTo(x0 + 50, 66); c.lineTo(x0 + 58, 74); c.lineTo(x0 + 66, 74); c.lineTo(x0 + 72, 92); c.lineTo(x0 + 80, 18); c.lineTo(x0 + 88, 100); c.lineTo(x0 + 96, 74); c.lineTo(x0 + 128, 74); }
      c.stroke();
    });
    const ecg = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshBasicMaterial({ map: ecgTex, fog: false })); ecg.position.set(-1.4, 3.72, -2.67); g.add(ecg);
    // IV stand, curtain
    cyl(g, 0.03, 0.03, 4.3, '#c9d0d8', 0.95, 2.15, -1.7, 0.006); cyl(g, 0.35, 0.35, 0.05, '#555b66', 0.95, 0.05, -1.7, 0.006);
    box(g, 0.45, 0.04, 0.04, '#c9d0d8', 0.95, 4.3, -1.7, 0.004);
    box(g, 0.32, 0.55, 0.12, new THREE.MeshToonMaterial({ color: '#d8f0ff', transparent: true, opacity: 0.75 }), 1.12, 3.95, -1.7, 0.008);
    cyl(g, 0.012, 0.012, 2.4, '#d8f0ff', 1.3, 2.6, -1.6, 0, 6);
    box(g, 4.0, 0.06, 0.06, '#c9d0d8', -3.6, 5.9, -1.4, 0.004);
    for (let i = 0; i < 8; i++) { const f = box(g, 0.32, 5.0, 0.12, i % 2 ? '#6aa9d8' : '#5b9acb', -5.2 + i * 0.27, 3.4, -1.4 + (i % 2) * 0.12, 0.01); }
    const lh = lamp(g, 0.5, 6.5, 0.5, 0xe8f6ff, 6, 14);
    sets.hospital = { group: g, outdoor: false, update: (t, e, n) => { ecgTex.offset.x = (t * 0.45) % 1; lh.l.intensity = lh.power * (0.4 + 0.6 * n); } };
  }

  // ================= street (city) =================
  {
    const g = new THREE.Group();
    const walk = mesh(new THREE.PlaneGeometry(60, 12), toon('#ffffff', { map: tiles('#c9c6c0', '#a9a6a0', 128, 128) }), { cast: false }); walk.rotation.x = -PI / 2; walk.position.set(0, 0.01, 4); g.add(walk);
    walk.material.map.repeat.set(24, 5);
    box(g, 60, 0.2, 0.35, '#b3b0aa', 0, 0.1, -2.1, 0.01);
    const road = mesh(new THREE.PlaneGeometry(60, 5.6), toon('#ffffff', { map: tex(256, 64, (c) => { c.fillStyle = '#4a4d55'; c.fillRect(0, 0, 256, 64); c.fillStyle = '#f2f2f2'; c.fillRect(0, 30, 120, 4); }, 12, 1) }), { cast: false });
    road.rotation.x = -PI / 2; road.position.set(0, 0.0, -5.0); g.add(road);
    const far = mesh(new THREE.PlaneGeometry(60, 6), toon('#c9c6c0'), { cast: false }); far.rotation.x = -PI / 2; far.position.set(0, 0.01, -10.8); g.add(far);
    const litMats = [];
    for (let x = -17; x < 17;) {
      const w = 3 + rnd() * 2.6, h = 8 + rnd() * 12, colr = ['#e9b8a1', '#a9c4e8', '#f2d388', '#b9a6d9', '#9fd3c7', '#e8a0a8'][Math.floor(rnd() * 6)];
      const fac = tex(128, 256, (c) => { c.fillStyle = colr; c.fillRect(0, 0, 128, 256); c.fillStyle = 'rgba(40,50,70,0.85)'; for (let y = 16; y < 240; y += 32) for (let xx = 12; xx < 116; xx += 28) c.fillRect(xx, y, 16, 20); }, Math.max(1, Math.round(w / 2.5)), Math.max(1, Math.round(h / 5)));
      const lit = tex(128, 256, (c) => { c.fillStyle = '#000'; c.fillRect(0, 0, 128, 256); c.fillStyle = '#ffd98a'; for (let y = 16; y < 240; y += 32) for (let xx = 12; xx < 116; xx += 28) if (rnd() < 0.45) c.fillRect(xx, y, 16, 20); }, fac.repeat.x, fac.repeat.y);
      const m = new THREE.MeshToonMaterial({ color: '#ffffff', map: fac, emissive: '#ffffff', emissiveMap: lit, emissiveIntensity: 0, gradientMap: toon('#fff').gradientMap });
      litMats.push(m); box(g, w, h, 4, m, x + w / 2, h / 2, -15.5 - rnd() * 2, 0.03); x += w + 0.15;
    }
    // street lamp, bench, bin, hydrant
    cyl(g, 0.08, 0.1, 5.4, '#2f3440', 2.4, 2.7, -1.6, 0.01); box(g, 1.0, 0.08, 0.08, '#2f3440', 1.95, 5.35, -1.6, 0.006);
    box(g, 0.55, 0.18, 0.35, '#2f3440', 1.5, 5.25, -1.6, 0.008);
    const bulbS = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.25), glow(0x777766)); bulbS.position.set(1.5, 5.14, -1.6); g.add(bulbS);
    const ll = lamp(g, 1.5, 4.9, -1.2, 0xffd28a, 12, 12);
    box(g, 2.2, 0.12, 0.6, '#b07a4a', -2.7, 0.85, -1.2); box(g, 2.2, 0.55, 0.1, '#b07a4a', -2.7, 1.3, -1.5); for (const dx of [-0.9, 0.9]) box(g, 0.1, 0.85, 0.5, '#2f3440', -2.7 + dx, 0.42, -1.25, 0.006);
    cyl(g, 0.32, 0.28, 1.0, '#3f8f4f', 1.2, 0.5, -1.3); cyl(g, 0.35, 0.35, 0.08, '#2f6f3c', 1.2, 1.02, -1.3);
    cyl(g, 0.16, 0.2, 0.7, '#e2493b', -1.1, 0.35, -1.5); cyl(g, 0.12, 0.12, 0.2, '#e2493b', -1.1, 0.8, -1.5);
    for (const dx of [-0.2, 0.2]) { const n = cyl(g, 0.06, 0.06, 0.18, '#e2493b', -1.1 + dx, 0.5, -1.5, 0.006); n.rotation.z = PI / 2; }
    sets.street = { group: g, outdoor: true, update: (t, e, n) => { litMats.forEach((m) => { m.emissiveIntensity = n; }); ll.l.intensity = ll.power * n; bulbS.material.color.set(n > 0.3 ? 0xfff2c0 : 0x777766); } };
  }

  // ================= space (moon surface) =================
  {
    const g = new THREE.Group();
    const craters = tex(256, 256, (c) => {
      c.fillStyle = '#b9b6b0'; c.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 40; i++) { const x = rnd() * 256, y = rnd() * 256, r = 4 + rnd() * 18; c.fillStyle = 'rgba(90,88,84,0.45)'; c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.fill(); c.strokeStyle = 'rgba(235,232,226,0.6)'; c.lineWidth = 2; c.beginPath(); c.arc(x - 1, y - 1, r, PI * 0.9, PI * 1.9); c.stroke(); }
    }, 30, 30);
    const ground = mesh(new THREE.PlaneGeometry(500, 500), toon('#ffffff', { map: craters }), { cast: false }); ground.rotation.x = -PI / 2; g.add(ground);
    for (let i = 0; i < 12; i++) { const r = mesh(new THREE.DodecahedronGeometry(0.2 + rnd() * 0.5, 0), toon('#8f8c86', { flatShading: true }), { outline: 0.012 }); r.position.set((rnd() - 0.5) * 12, 0.1, -1.5 - rnd() * 8); if (Math.abs(r.position.x) < 1 && r.position.z > -2.5) r.position.x += 2; g.add(r); }
    for (const [x, z, s] of [[-3.5, -6, 2.4], [4.5, -9, 3.2], [-8, -14, 4]]) { const c = mesh(new THREE.TorusGeometry(s, s * 0.18, 8, 32), toon('#a9a6a0'), { outline: 0.02 }); c.rotation.x = PI / 2; c.scale.z = 0.4; c.position.set(x, 0, z); g.add(c); }
    // rocket
    const rk = new THREE.Group(); rk.position.set(2.9, 0, -2.6); g.add(rk);
    cyl(rk, 0.6, 0.6, 4.2, '#f4f4f0', 0, 2.5, 0, 0.02, 24);
    const nose = mesh(new THREE.ConeGeometry(0.6, 1.4, 24), toon('#e2493b'), { outline: 0.02 }); nose.position.y = 5.3; rk.add(nose);
    for (let i = 0; i < 3; i++) { const f = mesh(new THREE.BoxGeometry(0.1, 1.2, 0.9), toon('#e2493b'), { outline: 0.012 }); const a = i * PI * 2 / 3 + 0.4; f.position.set(Math.cos(a) * 0.7, 0.9, Math.sin(a) * 0.7); f.rotation.y = -a; rk.add(f); }
    const port = cyl(rk, 0.28, 0.28, 0.1, '#6ad3ff', 0, 3.4, 0.58, 0.02, 24); port.rotation.x = PI / 2;
    cyl(rk, 0.5, 0.7, 0.5, '#555b66', 0, 0.25, 0, 0.012);
    // flag
    cyl(g, 0.03, 0.03, 2.6, '#d8d8d8', -2.4, 1.3, -1.9, 0.006);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), toon('#ffffff', { side: THREE.DoubleSide, map: tex(110, 70, (c) => { c.fillStyle = '#3b78db'; c.fillRect(0, 0, 110, 70); c.fillStyle = '#ffd93b'; c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 9 : 22, a = -PI / 2 + i * PI / 5; c.lineTo(55 + Math.cos(a) * r, 35 + Math.sin(a) * r); } c.fill(); }) }));
    flag.position.set(-1.85, 2.25, -1.9); g.add(flag);
    // earth in the sky
    const earth = new THREE.Mesh(new THREE.SphereGeometry(16, 40, 24), new THREE.MeshBasicMaterial({ fog: false, map: tex(256, 128, (c) => {
      c.fillStyle = '#2f7fd8'; c.fillRect(0, 0, 256, 128); c.fillStyle = '#4fb04a';
      for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(rnd() * 256, 20 + rnd() * 88, 12 + rnd() * 26, 8 + rnd() * 16, rnd() * 3, 0, PI * 2); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,0.75)'; for (let i = 0; i < 14; i++) { c.beginPath(); c.ellipse(rnd() * 256, rnd() * 128, 10 + rnd() * 20, 3 + rnd() * 4, 0, 0, PI * 2); c.fill(); }
    }) }));
    earth.position.set(-38, 46, -170); g.add(earth);
    sets.space = { group: g, outdoor: true, sky: { top: '#02030a', bot: '#0c0f2a', stars: 1, moon: 0, clouds: false, fog: '#05060f', fogNear: 150, fogFar: 700,
      sun: '#ffffff', si: 2.8, hs: '#4a5070', hg: '#2a2a30', hi: 0.8 },
      update: (t) => { earth.rotation.y = t * 0.03; } };
  }

  // ================= beach =================
  {
    const g = new THREE.Group();
    const sand = mesh(new THREE.PlaneGeometry(200, 60), toon('#ffffff', { map: speckle('#f2dba5', ['#e6cc92', '#f8e6bb'], 600, 30, 10) }), { cast: false }); sand.rotation.x = -PI / 2; sand.position.set(0, 0, 25); g.add(sand);
    const wet = mesh(new THREE.PlaneGeometry(200, 1.6), toon('#d9bf86'), { cast: false }); wet.rotation.x = -PI / 2; wet.position.set(0, 0.01, -4.4); g.add(wet);
    const sea = mesh(new THREE.PlaneGeometry(800, 400), toon('#2fa7d4'), { cast: false }); sea.rotation.x = -PI / 2; sea.position.set(0, -0.02, -205); g.add(sea);
    const foam = mesh(new THREE.PlaneGeometry(200, 0.5), toon('#f4fbff'), { cast: false }); foam.rotation.x = -PI / 2; foam.position.set(0, 0.02, -5.2); g.add(foam);
    const isl = mesh(new THREE.SphereGeometry(1, 24, 12), toon('#4f9e3a'), { cast: false }); isl.scale.set(40, 9, 14); isl.position.set(-70, -3, -220); g.add(isl);
    // palm tree
    const palm = new THREE.Group(); palm.position.set(2.8, 0, -2.2); g.add(palm);
    let px = 0, py = 0;
    for (let i = 0; i < 7; i++) { const s = cyl(palm, 0.2 - i * 0.012, 0.24 - i * 0.012, 0.85, '#a27b52', px, py + 0.42, 0, 0.012, 12); s.rotation.z = 0.06 * i; px -= Math.sin(0.06 * i) * 0.85; py += Math.cos(0.06 * i) * 0.85; }
    for (let i = 0; i < 7; i++) { const a = i * PI * 2 / 7, f = mesh(new THREE.ConeGeometry(0.32, 2.6, 4), toon(i % 2 ? '#3f9a3a' : '#4fb04a', { flatShading: true }), { outline: 0.012 });
      f.position.set(px + Math.cos(a) * 1.1, py + 0.1, Math.sin(a) * 1.1); f.rotation.set(Math.sin(a) * 1.9, 0, -Math.cos(a) * 1.9); f.scale.z = 0.25; palm.add(f); }
    for (const [dx, dz] of [[0.15, 0.1], [-0.12, 0.12], [0, -0.15]]) { const co = mesh(new THREE.SphereGeometry(0.17, 12, 8), toon('#6b4a2e'), { outline: 0.008 }); co.position.set(px + dx, py - 0.15, dz); palm.add(co); }
    // umbrella + towel + ball
    cyl(g, 0.04, 0.04, 3.2, '#ffffff', -2.5, 1.6, -1.4, 0.006);
    const canopy = mesh(new THREE.ConeGeometry(1.6, 0.7, 16, 1, true), toon('#ffffff', { side: THREE.DoubleSide, map: tex(256, 16, (c) => { for (let x = 0; x < 256; x += 32) { c.fillStyle = (x / 32) % 2 ? '#ffffff' : '#e2493b'; c.fillRect(x, 0, 32, 16); } }) }), { outline: 0.015 });
    canopy.position.set(-2.5, 3.3, -1.4); g.add(canopy);
    box(g, 1.4, 0.03, 2.4, toon('#ffffff', { map: tex(64, 64, (c) => { for (let y = 0; y < 64; y += 16) { c.fillStyle = (y / 16) % 2 ? '#f4c430' : '#3b78db'; c.fillRect(0, y, 64, 16); } }) }), -2.2, 0.02, -0.7, 0.006);
    const ball = mesh(new THREE.SphereGeometry(0.3, 16, 12), toon('#ffffff', { map: tex(64, 32, (c) => { const cs = ['#e2493b', '#ffffff', '#3b78db', '#ffffff', '#f4c430', '#ffffff']; cs.forEach((cl, i) => { c.fillStyle = cl; c.fillRect(i * 64 / 6, 0, 64 / 6 + 1, 32); }); }) }), { outline: 0.01 });
    ball.position.set(1.3, 0.3, -0.6); g.add(ball);
    sets.beach = { group: g, outdoor: true, update: (t) => { foam.position.z = -5.2 + Math.sin(t * 0.9) * 0.35; } };
  }

  // ================= cosmos (deep space, for scale-of-the-universe stories) =================
  // Regions sit far apart along -z; only the regions near the camera are drawn. Positions are exported as COSMOS so
  // episodes can aim cameras and props at them. Scales are per-region (each region is internally consistent).
  //   earthMoon  z=0       Earth r=3.2 at (0,0,0), Moon r=0.87 at (203.7,0,0): the real gap at the Moon's farthest,
  //                        so the 7 planets (props.lineup = 0..7) fit between them to scale
  //   sun        z=-5000   Sun r=55 beside a tiny Earth r=0.5 (true 109:1 ratio)
  //   solar      z=-10000  Sun + 8 orbiting planets (orbits not to scale), orbit rings
  //   voyager    z=-15000  the Voyager probe, the Sun a bright dot far away
  //   star       z=-20000  a red dwarf (Proxima Centauri)
  //   galaxy     z=-40000  the Milky Way, ~60k glowing particles, radius 600; COSMOS.youAreHere marks our Sun
  //   andromeda  near the Milky Way, tilted, a little larger
  //   web        z=-80000  the cosmic web: galaxies along filaments
  const COSMOS = {};
  {
    const g = new THREE.Group();
    const regions = [];
    const region = (name, center, radius) => { const r = new THREE.Group(); r.position.set(...center); g.add(r); regions.push({ r, c: new THREE.Vector3(...center), radius }); COSMOS[name] = center; return r; };
    const glowTex = tex(128, 128, (c) => { const gr = c.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); });
    const glowSprite = (parent, color, size, pos = [0, 0, 0], opacity = 1) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      s.scale.set(size, size, 1); s.position.set(...pos); parent.add(s); return s;
    };
    const bands = (cols, rx = 1) => tex(256, 128, (c) => { for (let y = 0; y < 128; y += 4) { c.fillStyle = cols[Math.floor((Math.sin(y * 0.21) * 0.5 + 0.5) * cols.length) % cols.length]; c.fillRect(0, y, 256, 4); } }, rx, 1);
    const planetMat = {
      mercury: toon('#ffffff', { map: speckle('#9b9590', ['#7f7a76', '#b5afa9'], 400, 2, 1) }),
      venus: toon('#ffffff', { map: bands(['#e8cf98', '#d9b97a', '#f1dcae']) }),
      earth: toon('#ffffff', { map: tex(256, 128, (c) => {
        c.fillStyle = '#2f7fd8'; c.fillRect(0, 0, 256, 128); c.fillStyle = '#4fb04a';
        for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(rnd() * 256, 20 + rnd() * 88, 12 + rnd() * 26, 8 + rnd() * 16, rnd() * 3, 0, PI * 2); c.fill(); }
        c.fillStyle = '#f4f8ff'; c.fillRect(0, 0, 256, 9); c.fillRect(0, 119, 256, 9);
        c.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 14; i++) { c.beginPath(); c.ellipse(rnd() * 256, rnd() * 128, 10 + rnd() * 20, 3 + rnd() * 4, 0, 0, PI * 2); c.fill(); }
      }) }),
      moon: toon('#ffffff', { map: speckle('#c9c6c0', ['#a9a6a0', '#dcd9d3', '#8f8c86'], 500, 2, 1) }),
      mars: toon('#ffffff', { map: speckle('#c1502e', ['#a8432a', '#d9734a', '#8f3a24'], 500, 2, 1) }),
      jupiter: toon('#ffffff', { map: bands(['#d9b38c', '#b07a52', '#efe0c8', '#c99a6b', '#8c5a3a']) }),
      saturn: toon('#ffffff', { map: bands(['#e6cf9a', '#cfb07a', '#f2e2bc', '#d8bd88']) }),
      uranus: toon('#9fe3e8'), neptune: toon('#3b6fe0')
    };
    const planet = (parent, name, r, pos) => {
      const m = mesh(new THREE.SphereGeometry(r, 40, 24), planetMat[name], { outline: Math.max(0.02, r * 0.012), cast: false, recv: false }); m.position.set(...pos); parent.add(m);
      if (name === 'saturn') { const ring = new THREE.Mesh(new THREE.RingGeometry(r * 1.25, r * 2.2, 64), new THREE.MeshToonMaterial({ map: bands(['#d8c294', '#bfa676', '#e9dbb4', 'rgba(0,0,0,0)']), side: THREE.DoubleSide, transparent: true, opacity: 0.9 })); ring.rotation.x = PI / 2 - 0.16; m.add(ring); }
      if (name === 'earth') glowSprite(m, 0x6fb6ff, r * 3.2, [0, 0, 0], 0.45);
      return m;
    };
    // --- earth & moon, with the planet line-up in between
    const A = region('earthMoon', [0, 0, 0], 900);
    const earthA = planet(A, 'earth', 3.2, [0, 0, 0]); planet(A, 'moon', 0.87, [203.7, 0, 0]);
    COSMOS.moon = [203.7, 0, 0];
    const lineup = [];
    { let x = 3.2 + 1.0; for (const [n, r] of [['mercury', 1.225], ['venus', 3.04], ['mars', 1.7], ['jupiter', 35.1], ['saturn', 29.25], ['uranus', 12.74], ['neptune', 12.37]]) {
        x += r; const p = planet(A, n, r, [x, 0, 0]); p.visible = false; lineup.push(p); x += r + 0.9; } }   // ends ~8 units short of the Moon, as in reality
    // --- sun vs earth
    const B = region('sun', [0, 0, -5000], 2500);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, map: speckle('#ffb43a', ['#ffd66b', '#ff9a2a', '#ffe9a0'], 1400, 3, 2) });
    const sunB = new THREE.Mesh(new THREE.SphereGeometry(55, 64, 40), sunMat); B.add(sunB);
    glowSprite(B, 0xffc46b, 190, [0, 0, 0], 0.9); glowSprite(B, 0xff8a3a, 320, [0, 0, 0], 0.45);
    planet(B, 'earth', 0.5, [-78, 0, 40]); COSMOS.sunEarth = [-78, 0, -5000 + 40];
    // --- solar system
    const C = region('solar', [0, 0, -10000], 2500);
    const sunC = new THREE.Mesh(new THREE.SphereGeometry(5, 40, 24), sunMat); C.add(sunC); glowSprite(C, 0xffc46b, 26, [0, 0, 0], 0.95);
    const orbitPlanets = [['mercury', 0.5, 9, 4.1], ['venus', 0.9, 12.5, 1.6], ['earth', 0.95, 16, 1], ['mars', 0.7, 20, 0.53], ['jupiter', 2.6, 31, 0.084], ['saturn', 2.2, 41, 0.034], ['uranus', 1.5, 51, 0.012], ['neptune', 1.45, 60, 0.006]]
      .map(([n, r, R, w], i) => {
        const ringGeo = new THREE.BufferGeometry().setFromPoints([...Array(129)].map((_, k) => new THREE.Vector3(Math.cos(k / 128 * PI * 2) * R, 0, Math.sin(k / 128 * PI * 2) * R)));
        C.add(new THREE.Line(ringGeo, new THREE.LineBasicMaterial({ color: 0x5d6b9a, transparent: true, opacity: 0.55, fog: false })));
        return { p: planet(C, n, r, [R, 0, 0]), R, w, a0: i * 1.7 };
      });
    COSMOS.neptuneOrbit = 60;
    // --- voyager
    const Dg = region('voyager', [0, 0, -15000], 600);
    { const v = new THREE.Group(); Dg.add(v); v.rotation.set(0.3, -0.6, 0.15);
      const dish = mesh(new THREE.CylinderGeometry(1.9, 0.7, 0.35, 32), toon('#f1f2f4'), { outline: 0.03 }); dish.rotation.x = PI / 2; dish.position.z = 0.6; v.add(dish);
      v.add(mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.7, 10), toon('#d9a441'), { outline: 0.02 }));
      const boom = mesh(new THREE.CylinderGeometry(0.06, 0.06, 7, 6), toon('#cfd3da'), { outline: 0.01 }); boom.rotation.z = PI / 2; boom.position.x = 3.4; v.add(boom);
      const rtg = mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.6, 10), toon('#6b6f78'), { outline: 0.012 }); rtg.rotation.z = PI / 2; rtg.position.set(-2.2, -0.3, 0); v.add(rtg);
      const mag = mesh(new THREE.CylinderGeometry(0.03, 0.03, 9, 4), toon('#cfd3da'), { outline: 0.008 }); mag.rotation.x = 0.9; mag.position.set(0.5, 3.2, -1.5); v.add(mag); }
    glowSprite(Dg, 0xfff1c0, 6, [-260, 40, -400], 1);   // the Sun, far behind
    // --- red dwarf
    const Eg = region('star', [0, 0, -20000], 600);
    Eg.add(new THREE.Mesh(new THREE.SphereGeometry(6, 48, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, map: speckle('#ff5a3a', ['#ff7a4a', '#e8402a', '#ff9a6a'], 900, 2, 1) })));
    glowSprite(Eg, 0xff6a4a, 34, [0, 0, 0], 0.9); glowSprite(Eg, 0xff3a2a, 70, [0, 0, 0], 0.35);
    // --- galaxies
    const galaxy = (parent, R, arms, n, twist, colors, tilt = [0, 0, 0]) => {
      const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), c = new THREE.Color();
      const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) / 2;   // ~normal, -1..1
      for (let i = 0; i < n; i++) {
        const kind = rnd(), core = kind < 0.16, disk = kind > 0.72;   // bulge, diffuse disk, or spiral arm
        const r = core ? Math.abs(gauss()) * R * 0.2 : disk ? Math.pow(rnd(), 0.65) * R : Math.pow(rnd(), 0.7) * R * 0.98;
        const arm = Math.floor(rnd() * arms);
        const a = core || disk ? rnd() * PI * 2 : r / R * twist + arm * PI * 2 / arms + gauss() * (0.38 + 0.25 * (1 - r / R));
        const h = gauss() * R * (core ? 0.07 : 0.02) * (1 - 0.6 * r / R);
        const jit = R * (disk ? 0.04 : 0.025);
        pos.set([Math.cos(a) * r + gauss() * jit, h, Math.sin(a) * r + gauss() * jit], i * 3);
        c.set(core ? colors[0] : colors[1 + Math.floor(rnd() * (colors.length - 1))]); c.multiplyScalar((disk ? 0.28 : 0.5) + rnd() * 0.55); col.set([c.r, c.g, c.b], i * 3);
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: R * 0.016, map: glowTex, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      const gal = new THREE.Group(); gal.add(pts); glowSprite(gal, 0xffe2a8, R * 0.55, [0, 0, 0], 0.8); glowSprite(gal, 0xfff4dc, R * 0.22, [0, 0, 0], 0.9);
      gal.rotation.set(...tilt); parent.add(gal); return gal;
    };
    const F = region('galaxy', [0, 0, -40000], 9000);
    const milky = galaxy(F, 600, 4, 60000, 9.5, ['#fff0c8', '#9fc4ff', '#cfe0ff', '#ffffff', '#ffb6d9', '#bcd3ff']);
    COSMOS.galaxyCenter = [0, 0, -40000];
    { const a = 0.55 * 9.5 + 0.3, r = 0.55 * 600; COSMOS.youAreHere = [Math.cos(a) * r, 0, -40000 + Math.sin(a) * r]; }
    const andro = galaxy(F, 720, 2, 50000, 7.5, ['#fff4dc', '#cfe0ff', '#ffffff', '#ffd9b0'], [1.0, 0, 0.5]);
    andro.position.set(5200, 900, -2600); COSMOS.andromeda = [5200, 900, -40000 - 2600];
    // --- cosmic web
    const H = region('web', [0, 0, -80000], 16000);
    { const nodes = [...Array(70)].map(() => new THREE.Vector3((rnd() - 0.5) * 10000, (rnd() - 0.5) * 7000, (rnd() - 0.5) * 10000));
      const pts = [], cols = [], c = new THREE.Color(), palette = ['#ffffff', '#cfe0ff', '#9fc4ff', '#ffd9b0', '#ffb6d9', '#b9a6ff'];
      const g3 = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
      const push = (v, s, bright) => { pts.push(v.x + g3() * s, v.y + g3() * s, v.z + g3() * s); c.set(palette[Math.floor(rnd() * palette.length)]).multiplyScalar(bright * (0.4 + rnd() * 0.6)); cols.push(c.r, c.g, c.b); };
      const seen = new Set();
      nodes.forEach((a, ia) => { const near = nodes.map((b, ib) => [b, ib]).filter(([b]) => b !== a).sort((p, q) => a.distanceTo(p[0]) - a.distanceTo(q[0])).slice(0, 3);
        for (let k = 0; k < 650; k++) push(a, 380, 1.0);                                   // galaxy clusters at the knots
        near.forEach(([b, ib]) => { const key = Math.min(ia, ib) + '-' + Math.max(ia, ib); if (seen.has(key)) return; seen.add(key);
          for (let k = 0; k < 700; k++) push(a.clone().lerp(b, rnd()), 260 + 160 * rnd(), 0.6); }); });   // thick, foggy filaments
      for (let k = 0; k < 6000; k++) push(new THREE.Vector3((rnd() - 0.5) * 11000, (rnd() - 0.5) * 8000, (rnd() - 0.5) * 11000), 0, 0.25);   // faint field galaxies in the voids
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      H.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: 60, map: glowTex, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))); }
    // a dense star field that follows the camera (deep space has far more stars than the sky dome)
    const sf = []; for (let i = 0; i < 4000; i++) { const th = rnd() * PI * 2, ph = Math.acos(rnd() * 2 - 1), R = 2600; sf.push(Math.cos(th) * Math.sin(ph) * R, Math.cos(ph) * R, Math.sin(th) * Math.sin(ph) * R); }
    const sfGeo = new THREE.BufferGeometry(); sfGeo.setAttribute('position', new THREE.Float32BufferAttribute(sf, 3));
    const starField = new THREE.Points(sfGeo, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false, fog: false }));
    g.add(starField);
    sets.cosmos = { group: g, outdoor: true, cosmic: true,
      sky: { top: '#02030a', bot: '#070a1e', stars: 1, moon: 0, clouds: false, fog: '#02030a', fogNear: 1e6, fogFar: 2e6, sun: '#ffffff', si: 2.6, dir: [8, 3, 6], hs: '#5a6aa0', hg: '#14141c', hi: 0.55 },
      update: (t, e, n, props, camera) => {
        starField.position.copy(camera.position);
        for (const { r, c, radius } of regions) r.visible = camera.position.distanceTo(c) < radius * 1.6;
        earthA.rotation.y = t * 0.08; sunB.rotation.y = t * 0.02; sunC.rotation.y = t * 0.05;
        lineup.forEach((p, i) => { const k = Math.max(0, Math.min(1, (props.lineup || 0) - i)); p.visible = k > 0.01; p.scale.setScalar(Math.max(0.01, k < 1 ? 1 - Math.pow(1 - k, 3) : 1)); });
        const speed = props.orbitSpeed ?? 1;
        orbitPlanets.forEach(({ p, R, w, a0 }) => { const a = a0 + t * w * 0.35 * speed; p.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); });
        milky.rotation.y = -t * 0.025 * (props.galaxySpin ?? 1); andro.rotation.y = t * 0.012;
      } };
  }
  COSMOS.region = (name) => COSMOS[name];

  // ================= studio =================
  // a plain colour backdrop with no scenery (shot.backdrop, default brand yellow): thumbnails, logos, cut-outs
  // even, front-on product lighting with neutral bounce and no shadows (no shadow acne in close-ups)
  sets.studio = { group: new THREE.Group(), outdoor: false, studio: true,
    sky: { sun: '#ffffff', si: 2.0, dir: [3, 6, 10], hs: '#ffffff', hg: '#e6e4ef', hi: 1.45, stars: 0, moon: 0, clouds: false } };

  for (const k in sets) sets[k].group.visible = false;
  return { sets, moons, COSMOS };
}
