// 3D maneken va libos (three.js). Mavzu ranglariga va mato turiga moslashadi.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

// ---------- Yordamchilar ----------
export function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
export function hex(c, f = 0) {
  const col = new THREE.Color(c);
  if (f > 0) col.lerp(new THREE.Color('#ffffff'), f);
  if (f < 0) col.lerp(new THREE.Color('#000000'), -f);
  return '#' + col.getHexString();
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function bump(y, a, b) { if (y <= a || y >= b) return 0; return Math.sin(Math.PI * (y - a) / (b - a)); }

// Maneken tanasi profili (radius, balandlik), pastdan tepaga
export const TORSO_PTS = [
  [0.0, 0.0], [0.23, 0.0], [0.25, 0.02], [0.262, 0.08], [0.255, 0.15], [0.225, 0.24], [0.2, 0.3],
  [0.212, 0.36], [0.24, 0.43], [0.238, 0.48], [0.222, 0.53], [0.205, 0.565], [0.18, 0.6],
  [0.12, 0.63], [0.07, 0.65], [0.058, 0.68], [0.056, 0.74], [0.07, 0.75], [0.0, 0.752],
];
const torsoCurve = new THREE.SplineCurve(TORSO_PTS.map(([r, y]) => new THREE.Vector2(r, y)));
export const TORSO_SAMPLES = torsoCurve.getPoints(120);

export function torsoR(y) {
  // Profil bo'yicha radiusni chiziqli interpolyatsiya (faqat tananing yon qismi)
  let best = 0;
  for (let i = 1; i < TORSO_SAMPLES.length - 1; i++) {
    const a = TORSO_SAMPLES[i - 1]; const b = TORSO_SAMPLES[i];
    if ((y >= a.y && y <= b.y) || (y <= a.y && y >= b.y)) {
      const t = b.y === a.y ? 0 : (y - a.y) / (b.y - a.y);
      best = Math.max(best, a.x + (b.x - a.x) * t);
    }
  }
  return best;
}

// Tana shaklini ovallashtirish va yelkalarni kengaytirish
export function bodyScale(y) {
  const sh = bump(y, 0.47, 0.645);
  const below = smooth(0.1, -0.7, y); // etakda yumaloqlashadi
  const sx = (1.18 * (1 + 0.3 * sh)) * (1 - below) + 1.0 * below;
  const sz = (0.8 * (1 - 0.12 * sh)) * (1 - below) + 0.95 * below;
  return [sx, sz];
}

export function deformBody(geo) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const [sx, sz] = bodyScale(y);
    p.setX(i, p.getX(i) * sx);
    p.setZ(i, p.getZ(i) * sz * (p.getZ(i) < 0 ? 0.94 : 1));
  }
  geo.computeVertexNormals();
}

// Mato turiga qarab libos uslubi
const DRESS_STYLE = { silk: 'gown', atlas: 'national', velvet: 'mermaid', linen: 'midi', chiffon: 'short' };

function dressProfile(style) {
  const top = style === 'national' ? 0.625 : 0.47;
  const hem = { gown: -0.9, national: -0.88, mermaid: -0.9, midi: -0.5, short: -0.32 }[style] ?? -0.9;
  const hemR = { gown: 0.56, national: 0.46, mermaid: 0.52, midi: 0.42, short: 0.44 }[style] ?? 0.5;
  const pts = [];
  const steps = 70;
  for (let i = 0; i <= steps; i++) {
    const y = hem + (top - hem) * (i / steps);
    let r;
    if (y >= 0.08) {
      r = torsoR(y) + 0.009;
    } else {
      const t = (0.08 - y) / (0.08 - hem);
      const base = torsoR(0.08) + 0.009;
      if (style === 'mermaid') {
        const k = t < 0.62 ? t * 0.08 : 0.05 + Math.pow((t - 0.62) / 0.38, 1.6) * 1.0;
        r = base + (hemR - base) * Math.min(1, k);
      } else if (style === 'short') {
        r = base + (hemR - base) * Math.pow(t, 0.7);
      } else {
        r = base + (hemR - base) * Math.pow(t, 1.15);
      }
    }
    pts.push(new THREE.Vector2(r, y));
  }
  // Yelkadan yuqorida bo'yinga yopishuvchi yoqa
  if (style === 'national') pts.push(new THREE.Vector2(0.066, 0.66));
  return { pts, top, hem };
}

// ---------- Protsedural matolar ----------
function makeCanvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

export function fabricCanvas(kind, colors) {
  const S = 1024;
  const cv = makeCanvas(S);
  const g = cv.getContext('2d');
  const rnd = seeded(7);
  if (kind === 'atlas') {
    const pal = ['#e6194b', '#f8c630', '#1fa37a', '#ffffff', colors.primary, '#3a7bd5', '#f58231'];
    g.fillStyle = colors.heroBg2 || '#14205a';
    g.fillRect(0, 0, S, S);
    let x = 0; let i = 0;
    while (x < S) {
      const w = 26 + Math.floor(rnd() * 60);
      g.fillStyle = pal[i % pal.length];
      for (let y = 0; y < S; y += 32) {
        const j1 = (rnd() - 0.5) * 18; const j2 = (rnd() - 0.5) * 18;
        g.beginPath();
        g.moveTo(x + j1, y); g.lineTo(x + w + j2, y);
        g.lineTo(x + w + j2 + 9, y + 16); g.lineTo(x + w + j2, y + 32);
        g.lineTo(x + j1, y + 32); g.lineTo(x + j1 - 9, y + 16); g.closePath();
        g.fill();
      }
      x += w + 10 + Math.floor(rnd() * 14);
      i++;
    }
    // Ipak yaltirashi
    const sh = g.createLinearGradient(0, 0, S, 0);
    for (let k = 0; k <= 8; k++) sh.addColorStop(k / 8, k % 2 ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.08)');
    g.fillStyle = sh; g.fillRect(0, 0, S, S);
  } else if (kind === 'velvet') {
    const base = colors.dark || '#17121c';
    g.fillStyle = hex(base, -0.35); g.fillRect(0, 0, S, S);
    for (let k = 0; k < 9000; k++) {
      g.fillStyle = `rgba(255,255,255,${(rnd() * 0.05).toFixed(3)})`;
      g.fillRect(rnd() * S, rnd() * S, 2, 2);
    }
    // Zarrin naqsh nuqtalari
    g.fillStyle = hex(colors.accent, 0.1);
    g.globalAlpha = 0.18;
    for (let yy = 40; yy < S; yy += 128) for (let xx = (yy / 128) % 2 ? 64 : 0; xx < S; xx += 128) {
      g.beginPath(); g.moveTo(xx, yy - 14); g.lineTo(xx + 10, yy); g.lineTo(xx, yy + 14); g.lineTo(xx - 10, yy); g.closePath(); g.fill();
    }
    g.globalAlpha = 1;
  } else if (kind === 'linen') {
    g.fillStyle = '#e8dfcf'; g.fillRect(0, 0, S, S);
    for (let y = 0; y < S; y += 3) { g.fillStyle = `rgba(120,100,70,${(0.04 + rnd() * 0.07).toFixed(3)})`; g.fillRect(0, y, S, 1); }
    for (let x2 = 0; x2 < S; x2 += 3) { g.fillStyle = `rgba(255,255,255,${(0.03 + rnd() * 0.08).toFixed(3)})`; g.fillRect(x2, 0, 1, S); }
  } else if (kind === 'chiffon') {
    const gr = g.createLinearGradient(0, 0, 0, S);
    gr.addColorStop(0, hex(colors.heroBg, 0.25)); gr.addColorStop(1, hex(colors.heroBg, 0.05));
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    for (let k = 0; k < 90; k++) {
      const fx = rnd() * S; const fy = rnd() * S; const r = 6 + rnd() * 9;
      g.fillStyle = k % 3 ? hex(colors.accent, 0.35) : '#ffffff';
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        g.beginPath(); g.arc(fx + Math.cos(a) * r * 0.8, fy + Math.sin(a) * r * 0.8, r * 0.55, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = hex(colors.primary, 0.3); g.beginPath(); g.arc(fx, fy, r * 0.35, 0, Math.PI * 2); g.fill();
    }
  } else {
    // silk
    const base = colors.accent; const dark = colors.primary;
    const gr = g.createLinearGradient(0, 0, S, 0);
    const stops = 10;
    for (let k = 0; k <= stops; k++) gr.addColorStop(k / stops, k % 2 ? hex(base, 0.18) : hex(dark, 0.05));
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    g.globalAlpha = 0.05;
    for (let k = 0; k < S; k += 4) { g.fillStyle = k % 8 ? '#ffffff' : '#000000'; g.fillRect(0, k, S, 1); }
    g.globalAlpha = 1;
  }
  return cv;
}

export function weaveCanvas(color) {
  const cv = makeCanvas(256);
  const g = cv.getContext('2d');
  g.fillStyle = color; g.fillRect(0, 0, 256, 256);
  const rnd = seeded(3);
  for (let y = 0; y < 256; y += 2) { g.fillStyle = `rgba(0,0,0,${(rnd() * 0.06).toFixed(3)})`; g.fillRect(0, y, 256, 1); }
  for (let x = 0; x < 256; x += 2) { g.fillStyle = `rgba(255,255,255,${(rnd() * 0.07).toFixed(3)})`; g.fillRect(x, 0, 1, 256); }
  return cv;
}

export function radialCanvas(inner, outer) {
  const cv = makeCanvas(256);
  const g = cv.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, inner); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  return cv;
}

export const MANNEQUIN_COLORS = { linen: '#e6d8c3', black: '#262322', white: '#f2efea' };

// ---------- Asosiy sahna ----------
export function createMannequin(container, opts = {}) {
  const o = {
    tokens: null, dress: true, autoRotate: true, interactive: true, particles: true,
    fit: 0.92, parallax: true, preserve: false, fabricImage: null, rotation: -0.35, offsetY: 0,
    animate: true, ...opts,
  };
  if (!webglAvailable()) throw new Error('WebGL mavjud emas');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: o.preserve, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const canvas = renderer.domElement;
  canvas.className = 'mannequin-canvas';
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  if ('environmentIntensity' in scene) scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  const target = new THREE.Vector3(0, -0.08 + o.offsetY, 0);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x333333, 0.55);
  const key = new THREE.DirectionalLight(0xfff3e6, 2.2); key.position.set(2.4, 3.2, 3.2);
  const rim = new THREE.DirectionalLight(0xffffff, 2.6); rim.position.set(-3, 2.2, -2.6);
  const fill = new THREE.DirectionalLight(0xffffff, 0.6); fill.position.set(-2.5, 0.5, 2.5);
  scene.add(hemi, key, rim, fill);

  const root = new THREE.Group();
  root.rotation.y = o.rotation;
  scene.add(root);

  const disposables = [];
  const track = (x) => { disposables.push(x); return x; };

  // Tana
  const torsoGeo = track(new THREE.LatheGeometry(TORSO_SAMPLES, 96));
  deformBody(torsoGeo);
  const weaveTex = track(new THREE.CanvasTexture(weaveCanvas('#ffffff')));
  weaveTex.wrapS = weaveTex.wrapT = THREE.RepeatWrapping;
  weaveTex.repeat.set(6, 4);
  weaveTex.colorSpace = THREE.SRGBColorSpace;
  const bodyMat = track(new THREE.MeshStandardMaterial({ color: MANNEQUIN_COLORS.linen, map: weaveTex, roughness: 0.88, metalness: 0 }));
  const torso = new THREE.Mesh(torsoGeo, bodyMat);
  root.add(torso);

  const woodMat = track(new THREE.MeshStandardMaterial({ color: '#3b2a1f', roughness: 0.45, metalness: 0.1 }));
  const metalMat = track(new THREE.MeshStandardMaterial({ color: '#b08d57', roughness: 0.28, metalness: 1 }));
  const cap = new THREE.Mesh(track(new THREE.CylinderGeometry(0.074, 0.07, 0.03, 48)), woodMat);
  cap.position.y = 0.765;
  const knob = new THREE.Mesh(track(new THREE.SphereGeometry(0.03, 32, 16)), woodMat);
  knob.position.y = 0.792;
  const pole = new THREE.Mesh(track(new THREE.CylinderGeometry(0.013, 0.013, 1.0, 24)), metalMat);
  pole.position.y = -0.5;
  const base = new THREE.Mesh(track(new THREE.CylinderGeometry(0.2, 0.235, 0.035, 64)), metalMat);
  base.position.y = -0.985;
  const hub = new THREE.Mesh(track(new THREE.CylinderGeometry(0.03, 0.04, 0.05, 24)), metalMat);
  hub.position.y = -0.95;
  root.add(cap, knob, pole, base, hub);

  // Pol soyasi
  const shadowTex = track(new THREE.CanvasTexture(radialCanvas('rgba(0,0,0,0.55)', 'rgba(0,0,0,0)')));
  const shadow = new THREE.Mesh(track(new THREE.PlaneGeometry(1.7, 1.7)), track(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.003;
  scene.add(shadow);

  // Libos
  let dress = null; let dressData = null; let trims = [];
  const dressMat = track(new THREE.MeshPhysicalMaterial({ side: THREE.DoubleSide, roughness: 0.4, sheen: 1, sheenRoughness: 0.3 }));
  const trimMat = track(new THREE.MeshStandardMaterial({ color: '#d4a437', roughness: 0.25, metalness: 1 }));
  let fabricTex = null;
  let fabricKind = 'silk';

  function buildDress(kind) {
    if (dress) { root.remove(dress); dress.geometry.dispose(); trims.forEach((m) => { root.remove(m); m.geometry.dispose(); }); trims = []; }
    if (!o.dress) { dress = null; return; }
    const style = DRESS_STYLE[kind] || 'gown';
    const prof = dressProfile(style);
    const geo = new THREE.LatheGeometry(prof.pts, 128);
    const p = geo.attributes.position;
    const base = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i); const y = p.getY(i); const z = p.getZ(i);
      base[i * 3] = Math.hypot(x, z); base[i * 3 + 1] = y; base[i * 3 + 2] = Math.atan2(x, z);
    }
    dressData = { base, top: prof.top, hem: prof.hem, style };
    dress = new THREE.Mesh(geo, dressMat);
    root.add(dress);
    updateDress(0);
    // Zarrin hoshiyalar: yoqa/ko'krak va bel
    const addTrim = (y, extra = 0.004, tube = 0.0065) => {
      const r = (y >= 0.08 ? torsoR(y) + 0.009 : 0.27) + extra;
      const tg = new THREE.TorusGeometry(r, tube, 10, 120);
      tg.rotateX(Math.PI / 2);
      tg.translate(0, y, 0);
      const tp = tg.attributes.position;
      for (let i = 0; i < tp.count; i++) {
        const [sx, sz] = bodyScale(tp.getY(i));
        tp.setX(i, tp.getX(i) * sx);
        tp.setZ(i, tp.getZ(i) * sz * (tp.getZ(i) < 0 ? 0.94 : 1));
      }
      tg.computeVertexNormals();
      const m = new THREE.Mesh(tg, trimMat);
      trims.push(m); root.add(m);
    };
    if (style === 'national') { addTrim(0.64, -0.004, 0.008); addTrim(0.3, 0.003); }
    else if (style !== 'short') { addTrim(prof.top - 0.003); addTrim(0.3, 0.003); }
    else addTrim(0.3, 0.003);
  }

  function updateDress(time) {
    if (!dress) return;
    const p = dress.geometry.attributes.position;
    const { base, top, hem } = dressData;
    for (let i = 0; i < p.count; i++) {
      const r0 = base[i * 3]; const y = base[i * 3 + 1]; const th = base[i * 3 + 2];
      const depth = Math.min(1, Math.max(0, (0.08 - y) / (0.08 - hem)));
      const folds = depth * 0.022 * Math.sin(th * 11 + 0.6) + depth * depth * 0.012 * Math.sin(th * 5 + 1.7);
      const sway = time ? depth * depth * 0.012 * Math.sin(time * 1.3 + th * 3 + y * 3) : 0;
      const r = r0 + folds + sway;
      const [sx, sz] = bodyScale(y);
      const x = Math.sin(th) * r * sx;
      let z = Math.cos(th) * r * sz;
      if (z < 0 && y > 0.0) z *= 0.94;
      p.setXYZ(i, x, y, z);
    }
    p.needsUpdate = true;
    dress.geometry.computeVertexNormals();
    void top;
  }

  function applyFabric(kind, colors) {
    fabricKind = kind;
    if (!o.fabricImage) {
      if (fabricTex) fabricTex.dispose();
      fabricTex = new THREE.CanvasTexture(fabricCanvas(kind, colors));
      fabricTex.colorSpace = THREE.SRGBColorSpace;
      fabricTex.wrapS = fabricTex.wrapT = THREE.RepeatWrapping;
      fabricTex.repeat.set(kind === 'atlas' ? 3 : 2, kind === 'atlas' ? 2 : 2);
      fabricTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      dressMat.map = fabricTex;
    }
    const preset = {
      silk: { roughness: 0.32, sheen: 1, sheenRoughness: 0.22, sheenColor: '#ffffff', clearcoat: 0.15 },
      atlas: { roughness: 0.38, sheen: 0.8, sheenRoughness: 0.3, sheenColor: '#ffffff', clearcoat: 0.2 },
      velvet: { roughness: 0.92, sheen: 1, sheenRoughness: 0.45, sheenColor: colors.accent, clearcoat: 0 },
      linen: { roughness: 0.95, sheen: 0.25, sheenRoughness: 0.8, sheenColor: '#ffffff', clearcoat: 0 },
      chiffon: { roughness: 0.6, sheen: 0.7, sheenRoughness: 0.4, sheenColor: '#ffffff', clearcoat: 0 },
    }[kind] || {};
    dressMat.roughness = preset.roughness;
    dressMat.sheen = preset.sheen;
    dressMat.sheenRoughness = preset.sheenRoughness;
    dressMat.sheenColor = new THREE.Color(preset.sheenColor);
    dressMat.clearcoat = preset.clearcoat;
    dressMat.transparent = kind === 'chiffon';
    dressMat.opacity = kind === 'chiffon' ? 0.94 : 1;
    dressMat.needsUpdate = true;
    buildDress(kind);
  }

  // Zarrachalar (uchqunlar)
  let points = null;
  if (o.particles) {
    const N = 140;
    const pos = new Float32Array(N * 3);
    const rnd = seeded(11);
    for (let i = 0; i < N; i++) {
      const a = rnd() * Math.PI * 2; const r = 0.55 + rnd() * 0.9;
      pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = -1 + rnd() * 2.2; pos[i * 3 + 2] = Math.sin(a) * r;
    }
    const pg = track(new THREE.BufferGeometry());
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dot = track(new THREE.CanvasTexture(radialCanvas('rgba(255,255,255,1)', 'rgba(255,255,255,0)')));
    const pm = track(new THREE.PointsMaterial({ size: 0.028, map: dot, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffffff', opacity: 0.85 }));
    points = new THREE.Points(pg, pm);
    scene.add(points);
  }

  function setTokens(tokens) {
    const t = tokens || {};
    const colors = t.colors || {};
    const accent = colors.accent || '#d4a437';
    rim.color.set(hex(accent, 0.35));
    hemi.color.set(hex(colors.heroText || '#ffffff', 0.2));
    hemi.groundColor.set(hex(colors.heroBg2 || '#333333', -0.2));
    bodyMat.color.set(MANNEQUIN_COLORS[t.mannequin] || MANNEQUIN_COLORS.linen);
    const metal = t.dark ? accent : '#b08d57';
    metalMat.color.set(metal);
    trimMat.color.set(t.fabric === 'linen' ? hex(colors.primary || '#6e533f', 0.1) : hex(accent, 0.05));
    if (points) points.material.color.set(hex(accent, 0.25));
    applyFabric(t.fabric || 'silk', { primary: colors.primary || '#6e533f', accent, heroBg: colors.heroBg || '#d8c3b0', heroBg2: colors.heroBg2 || '#20180f', dark: colors.dark || '#2b2118' });
    requestRender();
  }

  function setFabricImage(url) {
    o.fabricImage = url || null;
    if (!url) { setTokens(o.tokens); return Promise.resolve(); }
    return new Promise((resolve) => {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      loader.load(url, (tex) => {
        if (fabricTex) fabricTex.dispose();
        fabricTex = tex;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(3, 3);
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        dressMat.map = tex;
        dressMat.needsUpdate = true;
        requestRender();
        resolve();
      }, undefined, () => { o.fabricImage = null; setTokens(o.tokens); resolve(); });
    });
  }

  // O'lcham va kamera
  let width = 1; let height = 1;
  function fitCamera() {
    camera.aspect = width / height;
    const H = 1.95; const W = 1.25;
    const vf = THREE.MathUtils.degToRad(camera.fov);
    const distH = (H / 2) / Math.tan(vf / 2) / o.fit;
    const hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
    const distW = (W / 2) / Math.tan(hf / 2) / o.fit;
    camDist = Math.max(distH, distW);
    camera.position.set(0, 0.05 + o.offsetY, camDist);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }
  let camDist = 4;
  function resize() {
    const r = container.getBoundingClientRect();
    width = Math.max(1, Math.round(r.width));
    height = Math.max(1, Math.round(r.height));
    renderer.setSize(width, height, false);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    fitCamera();
    requestRender();
  }

  // Boshqaruv
  let dragging = false; let lastX = 0; let vel = 0; let idleT = 0;
  let mx = 0; let my = 0; let cx = 0; let cy = 0;
  const onDown = (e) => { dragging = true; lastX = e.clientX; vel = 0; canvas.setPointerCapture?.(e.pointerId); canvas.classList.add('is-grab'); };
  const onMove = (e) => {
    if (dragging) {
      const dx = e.clientX - lastX; lastX = e.clientX;
      root.rotation.y += dx * 0.008; vel = dx * 0.008; idleT = 0;
      requestRender();
    }
  };
  const onUp = () => { dragging = false; canvas.classList.remove('is-grab'); };
  const onHover = (e) => {
    const r = container.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    my = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };
  if (o.interactive) {
    canvas.style.touchAction = 'pan-y';
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }
  if (o.parallax) window.addEventListener('pointermove', onHover, { passive: true });

  // Render sikli
  let raf = 0; let visible = true; let last = performance.now(); let needs = true; let disposed = false;
  const clock = { t: 0 };
  function requestRender() { needs = true; if (!o.animate) renderFrame(); }
  function renderFrame() { if (!disposed) renderer.render(scene, camera); }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!visible || document.hidden) return;
    clock.t += dt;
    if (!dragging) {
      if (Math.abs(vel) > 0.0001) { root.rotation.y += vel; vel *= 0.94; }
      else if (o.autoRotate) { idleT += dt; root.rotation.y += dt * 0.22 * Math.min(1, idleT); }
    }
    if (o.parallax) {
      cx += (mx * 0.18 - cx) * 0.05; cy += (my * 0.08 - cy) * 0.05;
      camera.position.x = cx; camera.position.y = 0.05 + o.offsetY - cy;
      camera.lookAt(target);
    }
    if (dress) updateDress(clock.t);
    if (points) {
      points.rotation.y += dt * 0.05;
      const pa = points.geometry.attributes.position;
      for (let i = 0; i < pa.count; i++) {
        let y = pa.getY(i) + dt * (0.04 + (i % 7) * 0.006);
        if (y > 1.25) y = -1;
        pa.setY(i, y);
      }
      pa.needsUpdate = true;
    }
    renderFrame();
    needs = false;
  }

  const io = 'IntersectionObserver' in window ? new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0.01 }) : null;
  io && io.observe(container);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => resize()) : null;
  ro ? ro.observe(container) : window.addEventListener('resize', resize);

  o.tokens = o.tokens || {};
  resize();
  setTokens(o.tokens);
  if (o.fabricImage) setFabricImage(o.fabricImage);
  if (o.animate) raf = requestAnimationFrame(loop); else renderFrame();
  container.classList.add('has-3d');

  return {
    canvas,
    setTokens(t) { o.tokens = t || {}; setTokens(o.tokens); },
    setFabricImage,
    setDress(on) { o.dress = !!on; buildDress(fabricKind); requestRender(); },
    setRotation(rad) { root.rotation.y = rad; requestRender(); },
    getRotation() { return root.rotation.y; },
    setAutoRotate(on) { o.autoRotate = !!on; },
    render: renderFrame,
    // Joriy ko'rinishni rasmga olish (PNG data URL)
    snapshot(w, h) {
      const pw = width; const ph = height;
      const pr = renderer.getPixelRatio();
      renderer.setPixelRatio(1);
      width = w; height = h;
      renderer.setSize(w, h, false);
      fitCamera();
      renderer.render(scene, camera);
      const url = renderer.domElement.toDataURL('image/png');
      renderer.setPixelRatio(pr);
      width = pw; height = ph;
      renderer.setSize(pw, ph, false);
      fitCamera();
      renderer.render(scene, camera);
      return url;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      io && io.disconnect();
      ro && ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('pointermove', onHover);
      if (dress) dress.geometry.dispose();
      trims.forEach((m) => m.geometry.dispose());
      if (fabricTex) fabricTex.dispose();
      disposables.forEach((d) => d.dispose && d.dispose());
      envRT.dispose(); pmrem.dispose();
      renderer.dispose();
      canvas.remove();
      container.classList.remove('has-3d');
    },
  };
}
