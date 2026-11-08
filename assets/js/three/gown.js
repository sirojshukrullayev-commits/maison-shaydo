// Bosh sahifa uchun uzun ko'ylak: "A" harfi o'rnida turadi, etagi so'zning birinchi va oxirgi harfi ostigacha yoyiladi.
// Bir nechta ko'ylak turi bor, ular silliq o'zgarib (morph) almashadi.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  TORSO_SAMPLES, torsoR, bodyScale, deformBody, webglAvailable, fabricCanvas, weaveCanvas, radialCanvas,
  seeded, hex, MANNEQUIN_COLORS,
} from './mannequin.js';

export { webglAvailable };

export const GOWN_STYLES = [
  { id: 'gown', name: { uz: 'Bal libosi', ru: 'Бальное платье', en: 'Ball gown' } },
  { id: 'national', name: { uz: 'Milliy atlas', ru: 'Национальный атлас', en: 'National atlas' } },
  { id: 'mermaid', name: { uz: 'Suv parisi', ru: 'Русалка', en: 'Mermaid' } },
  { id: 'empire', name: { uz: 'Empir', ru: 'Ампир', en: 'Empire' } },
  { id: 'oneshoulder', name: { uz: 'Bir yelkali', ru: 'На одно плечо', en: 'One-shoulder' } },
  { id: 'pleated', name: { uz: 'Plisse', ru: 'Плиссе', en: 'Pleated' } },
];

const FABRIC_TO_STYLE = { silk: 'gown', atlas: 'national', velvet: 'mermaid', linen: 'pleated', chiffon: 'empire' };
export function styleForFabric(f) { return FABRIC_TO_STYLE[f] || 'gown'; }

// Har bir turning shakl parametrlari (oraliq qiymatlar silliq interpolyatsiya qilinadi)
const BASE = {
  top: 0.47, sweet: 0.03, shoulder: 0, collar: 0, waist: 0.3, rAmul: 1, bell: 0, mermaid: 0,
  billow: 0.12, waves: 0.022, overlay: 0, neckTrim: 1, belt: 1, hemTrim: 0, beads: 0,
};
const PARAMS = {
  gown: { ...BASE, bell: 0.85, rAmul: 1.12, beads: 1, hemTrim: 0 },
  national: { ...BASE, sweet: 0, collar: 1, rAmul: 1.0, hemTrim: 1, beads: 1, billow: 0.1 },
  mermaid: { ...BASE, sweet: 0.045, mermaid: 1, rAmul: 1.05, belt: 0, neckTrim: 0, billow: 0.14, waves: 0.028 },
  empire: { ...BASE, top: 0.5, sweet: 0.02, waist: 0.42, rAmul: 1.0, overlay: 1, belt: 1, billow: 0.13 },
  oneshoulder: { ...BASE, sweet: 0, shoulder: 0.15, rAmul: 1.0, belt: 1, neckTrim: 1, billow: 0.12 },
  pleated: { ...BASE, top: 0.49, sweet: 0.02, rAmul: 1.06, belt: 1, hemTrim: 1, billow: 0.1, waves: 0.016 },
};
const FOLDS = {
  gown: { n: 10, amp: 0.024, pleat: false },
  national: { n: 8, amp: 0.012, pleat: false },
  mermaid: { n: 12, amp: 0.02, pleat: false },
  empire: { n: 14, amp: 0.018, pleat: false },
  oneshoulder: { n: 9, amp: 0.02, pleat: false },
  pleated: { n: 64, amp: 0.009, pleat: true },
};

const V_WAIST = 0.2;
const V_HEM = 0.8;
const FLOOR = -1;

function lerp(a, b, t) { return a + (b - a) * t; }
function mixParams(a, b, t) { const o = {}; for (const k in a) o[k] = lerp(a[k], b[k], t); return o; }
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function foldVal(th, s, f) {
  if (f.pleat) return f.amp * Math.pow(s, 0.6) * (Math.abs(Math.sin(th * f.n * 0.5)) * 2 - 1);
  return f.amp * Math.pow(s, 1.3) * (0.7 * Math.sin(th * f.n + 0.6) + 0.3 * Math.sin(th * (f.n * 0.5 + 1) + 1.7));
}

// ---------- Matolar ----------
function canvas(size = 1024) { const c = document.createElement('canvas'); c.width = c.height = size; return c; }

function styleCanvas(id, colors) {
  if (id === 'national') return fabricCanvas('atlas', colors);
  if (id === 'empire') return fabricCanvas('chiffon', { heroBg: '#d98fa6', accent: '#fff2f5', primary: '#b85c7a' });
  const S = 1024; const cv = canvas(S); const g = cv.getContext('2d'); const rnd = seeded(5);
  if (id === 'mermaid') {
    g.fillStyle = '#4a1225'; g.fillRect(0, 0, S, S);
    for (let k = 0; k < 12000; k++) { g.fillStyle = `rgba(255,${180 + (k % 60)},200,${(rnd() * 0.05).toFixed(3)})`; g.fillRect(rnd() * S, rnd() * S, 2, 2); }
    g.globalAlpha = 0.14; g.fillStyle = '#f2c46d';
    for (let y = 48; y < S; y += 128) for (let x = (y / 128) % 2 ? 64 : 0; x < S; x += 128) {
      g.beginPath(); g.moveTo(x, y - 16); g.lineTo(x + 11, y); g.lineTo(x, y + 16); g.lineTo(x - 11, y); g.closePath(); g.fill();
    }
    g.globalAlpha = 1;
  } else if (id === 'oneshoulder') {
    const gr = g.createLinearGradient(0, 0, S, 0);
    for (let k = 0; k <= 12; k++) gr.addColorStop(k / 12, k % 2 ? '#0d5a4a' : '#06362d');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    g.globalAlpha = 0.06; for (let y = 0; y < S; y += 3) { g.fillStyle = y % 6 ? '#ffffff' : '#000000'; g.fillRect(0, y, S, 1); }
    g.globalAlpha = 1;
  } else if (id === 'pleated') {
    for (let x = 0; x < S; x += 16) {
      const gr = g.createLinearGradient(x, 0, x + 16, 0);
      gr.addColorStop(0, '#8e6a33'); gr.addColorStop(0.45, '#e8cf94'); gr.addColorStop(0.55, '#f4e2b5'); gr.addColorStop(1, '#9c7840');
      g.fillStyle = gr; g.fillRect(x, 0, 16, S);
    }
  } else {
    // gown: shampan rangli ipak
    const base = hex(colors.accent || '#b89474', 0.38); const dark = hex(colors.accent || '#b89474', -0.05);
    const gr = g.createLinearGradient(0, 0, S, 0);
    for (let k = 0; k <= 14; k++) gr.addColorStop(k / 14, k % 2 ? base : dark);
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    g.globalAlpha = 0.05; for (let y = 0; y < S; y += 4) { g.fillStyle = y % 8 ? '#ffffff' : '#000000'; g.fillRect(0, y, S, 1); }
    g.globalAlpha = 1;
  }
  return cv;
}

const MATERIAL = {
  gown: { roughness: 0.3, sheen: 1, sheenRoughness: 0.25, sheenColor: '#ffffff', clearcoat: 0.25, metalness: 0, anisotropy: 0.5, rep: [6, 3] },
  national: { roughness: 0.36, sheen: 0.8, sheenRoughness: 0.3, sheenColor: '#ffffff', clearcoat: 0.3, metalness: 0, anisotropy: 0.3, rep: [7, 3] },
  mermaid: { roughness: 0.88, sheen: 1, sheenRoughness: 0.42, sheenColor: '#f0b9c8', clearcoat: 0, metalness: 0, anisotropy: 0, rep: [6, 4] },
  empire: { roughness: 0.62, sheen: 0.55, sheenRoughness: 0.45, sheenColor: '#ffd1de', clearcoat: 0, metalness: 0, anisotropy: 0, rep: [5, 3] },
  oneshoulder: { roughness: 0.38, sheen: 0.3, sheenRoughness: 0.35, sheenColor: '#3fb193', clearcoat: 0.2, metalness: 0, anisotropy: 0.4, env: 0.55, rep: [6, 3] },
  pleated: { roughness: 0.34, sheen: 0.6, sheenRoughness: 0.3, sheenColor: '#fff3d6', clearcoat: 0.2, metalness: 0.25, anisotropy: 0.2, rep: [6, 2] },
};

// ---------- Asosiy sahna ----------
export function createGown(container, opts = {}) {
  const o = { tokens: {}, animate: true, quality: 'high', style: null, cycleMs: 7500, ...opts };
  if (!webglAvailable()) throw new Error('WebGL mavjud emas');
  const NU = o.quality === 'low' ? 120 : 180;
  const NV = o.quality === 'low' ? 96 : 140;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, o.quality === 'low' ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  const cnv = renderer.domElement;
  cnv.className = 'mannequin-canvas gown-canvas';
  container.appendChild(cnv);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  if ('environmentIntensity' in scene) scene.environmentIntensity = 0.6;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x333333, 0.5);
  const key = new THREE.DirectionalLight(0xfff1e2, 2.4); key.position.set(2.5, 3.5, 4);
  const rimL = new THREE.DirectionalLight(0xffffff, 2.2); rimL.position.set(-3.5, 2, -2);
  const rimR = new THREE.DirectionalLight(0xffffff, 1.6); rimR.position.set(3.5, 1.5, -2.5);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(-2, 0, 4);
  scene.add(hemi, key, rimL, rimR, fill);

  const root = new THREE.Group();
  scene.add(root);
  const disposables = [];
  const track = (x) => { disposables.push(x); return x; };

  // Maneken tanasi (yelka va bo'yin ko'rinib turadi)
  const torsoGeo = track(new THREE.LatheGeometry(TORSO_SAMPLES, 96));
  deformBody(torsoGeo);
  const weave = track(new THREE.CanvasTexture(weaveCanvas('#ffffff')));
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping; weave.repeat.set(6, 4); weave.colorSpace = THREE.SRGBColorSpace;
  const bodyMat = track(new THREE.MeshStandardMaterial({ color: MANNEQUIN_COLORS.linen, map: weave, roughness: 0.85 }));
  root.add(new THREE.Mesh(torsoGeo, bodyMat));
  const woodMat = track(new THREE.MeshStandardMaterial({ color: '#3b2a1f', roughness: 0.4, metalness: 0.1 }));
  const cap = new THREE.Mesh(track(new THREE.CylinderGeometry(0.074, 0.07, 0.03, 48)), woodMat); cap.position.y = 0.765;
  const knob = new THREE.Mesh(track(new THREE.SphereGeometry(0.03, 32, 16)), woodMat); knob.position.y = 0.792;
  root.add(cap, knob);

  // ----- Ko'ylak yuzasi (to'r) -----
  function makeGrid(nu, nv) {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array((nu + 1) * (nv + 1) * 3);
    const uv = new Float32Array((nu + 1) * (nv + 1) * 2);
    const idx = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const k = j * (nu + 1) + i;
      uv[k * 2] = i / nu; uv[k * 2 + 1] = 1 - j / nv;
      if (i < nu && j < nv) {
        const a = k; const b = k + 1; const c = k + nu + 1; const d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx);
    return track(g);
  }

  const dressGeo = makeGrid(NU, NV);
  const dressMat = track(new THREE.MeshPhysicalMaterial({ side: THREE.DoubleSide, roughness: 0.3, sheen: 1 }));
  const dress = new THREE.Mesh(dressGeo, dressMat);
  dress.frustumCulled = false;
  root.add(dress);

  // Shifon ustki qatlam (Empir turi uchun)
  const NVO = Math.round(NV * (1 - V_WAIST));
  const overGeo = makeGrid(NU, NVO);
  const overMat = track(new THREE.MeshPhysicalMaterial({ side: THREE.DoubleSide, color: '#f7d6df', roughness: 0.55, sheen: 1, sheenColor: new THREE.Color('#ffe9ef'), transparent: true, opacity: 0, depthWrite: false }));
  const over = new THREE.Mesh(overGeo, overMat);
  over.frustumCulled = false;
  root.add(over);

  // Zarrin hoshiyalar (yoqa, kamar, etak chegarasi)
  const trimMat = () => track(new THREE.MeshStandardMaterial({ color: '#d4a437', roughness: 0.22, metalness: 1, transparent: true, opacity: 1, side: THREE.DoubleSide }));
  const TRIMS = [
    { key: 'neckTrim', v0: 0, v1: 0.012 },
    { key: 'belt', v0: V_WAIST - 0.01, v1: V_WAIST + 0.008 },
    { key: 'hemTrim', v0: V_HEM - 0.016, v1: V_HEM - 0.002 },
  ].map((t) => {
    const geo = makeGrid(NU, 3);
    const mat = trimMat();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    root.add(mesh);
    return { ...t, geo, mat, mesh };
  });

  // Ko'krakdagi munchoqlar
  const BEADS = 160;
  const beadGeo = track(new THREE.SphereGeometry(0.0065, 10, 8));
  const beadMat = track(new THREE.MeshStandardMaterial({ color: '#e8c56a', roughness: 0.2, metalness: 1 }));
  const beads = new THREE.InstancedMesh(beadGeo, beadMat, BEADS);
  beads.frustumCulled = false;
  root.add(beads);
  const beadPts = [];
  { const r = seeded(21); for (let i = 0; i < BEADS; i++) beadPts.push({ th: (r() - 0.5) * Math.PI * 1.3, v: 0.03 + r() * (V_WAIST - 0.05) }); }

  // Uchqunlar
  const NP = 120;
  const ppos = new Float32Array(NP * 3);
  const pr = seeded(9);
  const pseed = [];
  for (let i = 0; i < NP; i++) {
    const a = pr() * Math.PI * 2; const rr = 0.4 + pr() * 1.3;
    ppos[i * 3] = Math.cos(a) * rr; ppos[i * 3 + 1] = -1 + pr() * 2.1; ppos[i * 3 + 2] = Math.sin(a) * rr * 0.6;
    pseed.push(0.03 + pr() * 0.06);
  }
  const pg = track(new THREE.BufferGeometry());
  pg.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
  const dotTex = track(new THREE.CanvasTexture(radialCanvas('rgba(255,255,255,1)', 'rgba(255,255,255,0)')));
  const pm = track(new THREE.PointsMaterial({ size: 0.026, map: dotTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffe7b8', opacity: 0.85 }));
  const points = new THREE.Points(pg, pm);
  points.frustumCulled = false;
  scene.add(points);

  // ----- Holat -----
  const L = { rA: 0.5, aL: 1.6, aR: 2.2, bz: 0.62, unfurl: 0 };
  const ids = GOWN_STYLES.map((s) => s.id);
  let cur = o.style && PARAMS[o.style] ? o.style : 'gown';
  let P = { ...PARAMS[cur] };
  let morph = null; // {from, to, t0, dur, swapped}
  let foldA = FOLDS[cur]; let foldB = FOLDS[cur]; let foldM = 0;
  let unfurlStart = 0; let layoutReady = false;
  let time = 0; let burst = 0;
  let listeners = [];
  let paused = false; let lastSwitch = performance.now();
  let tokens = o.tokens || {};
  let tex = null;

  function surf(th, v, layer, out) {
    const sn = Math.sin(th); const cs = Math.cos(th);
    let x; let y; let z;
    if (v <= V_WAIST) {
      const s = v / V_WAIST;
      let top = P.top - P.sweet * Math.pow(Math.max(0, cs), 6) + P.shoulder * Math.pow(Math.max(0, sn), 2);
      top += (0.655 - top) * P.collar;
      y = top + (P.waist - top) * s;
      const r = torsoR(y) + 0.012;
      const [sx, sz] = bodyScale(y);
      x = sn * r * sx; z = cs * r * sz * (cs < 0 ? 0.94 : 1);
    } else {
      // Etakning "A" qismi
      const sk = Math.min(1, (v - V_WAIST) / (V_HEM - V_WAIST));
      const yEnd = FLOOR + 0.045;
      const fa = sk;
      const fb = 1 - Math.pow(1 - sk, 2.4);
      const fm = sk < 0.62 ? 0.06 * sk / 0.62 : 0.06 + 0.94 * Math.pow((sk - 0.62) / 0.38, 1.6);
      const f = fa * Math.max(0, 1 - P.bell - P.mermaid) + fb * P.bell + fm * P.mermaid;
      const rw = torsoR(P.waist) + 0.014;
      const rA = L.rA * P.rAmul;
      const fold = lerp(foldVal(th, sk, foldA), foldVal(th, sk, foldB), foldM);
      const sway = o.animate ? 0.008 * sk * sk * Math.sin(time * 1.1 + th * 3) : 0;
      const lay = layer ? 0.024 : 0;
      if (v <= V_HEM) {
        y = P.waist + (yEnd - P.waist) * sk;
        let r = rw + (rA - rw) * f;
        const hipMin = (0.262 + 0.016) + (0.235 - 0.278) * Math.min(1, Math.max(0, (0.08 - y) / 0.6));
        if (y > 0.08) r = Math.max(r, torsoR(y) + 0.014); else r = Math.max(r, hipMin);
        r += fold + sway + lay;
        const [sx, sz] = bodyScale(y);
        x = sn * r * sx; z = cs * r * sz * (cs < 0 && y > 0 ? 0.94 : 1);
      } else {
        // Yoyilgan etak: harflar ostiga tarqaladi
        const s = (v - V_HEM) / (1 - V_HEM);
        const rEnd = rA + fold + sway + lay;
        const [sxA, szA] = bodyScale(yEnd);
        const xA = sn * rEnd * sxA; const zA = cs * rEnd * szA;
        const u = L.unfurl;
        const ax = sn >= 0 ? L.aR : L.aL;
        const axE = rEnd + (ax - rEnd) * u;
        const bzE = rEnd + (L.bz - rEnd) * u;
        const e = 1 - Math.pow(1 - s, 1.7);
        x = xA + (sn * axE - xA) * e;
        z = zA + (cs * bzE * 0.95 - zA) * e;
        const side = Math.abs(sn);
        const tt = o.animate ? time : 0;
        const wave = P.waves * s * (1.6 * Math.sin(th * 5 + tt * 1.1 + s * 3) + 0.8 * Math.sin(th * 11 - tt * 1.7 + s * 6));
        const ruffle = 0.014 * Math.pow(s, 3) * Math.sin(th * 46 + tt * 2.4);
        const curl = 0.05 * Math.pow(s, 4) * side;
        y = yEnd * (1 - s) + FLOOR * s
          + u * (P.billow * Math.sin(Math.PI * Math.pow(s, 0.85)) * (0.4 + 0.6 * side) + wave + ruffle + curl)
          + (layer ? 0.012 : 0);
        // Chetidagi burmalar gorizontal yo'nalishda ham
        const rf = 1 + u * 0.012 * Math.pow(s, 2) * Math.sin(th * 23 + tt * 1.3);
        x *= rf; z *= rf;
      }
    }
    out[0] = x; out[1] = y; out[2] = z;
  }

  const tmp = [0, 0, 0];
  function fillGrid(geo, nu, nv, v0, v1, layer, push = 0) {
    const p = geo.attributes.position.array;
    for (let j = 0; j <= nv; j++) {
      const v = v0 + (v1 - v0) * (j / nv);
      for (let i = 0; i <= nu; i++) {
        const th = -Math.PI + (i / nu) * Math.PI * 2;
        surf(th, v, layer, tmp);
        const k = (j * (nu + 1) + i) * 3;
        if (push) {
          const r = Math.hypot(tmp[0], tmp[2]) || 1;
          const sc = 1 + push / r;
          p[k] = tmp[0] * sc; p[k + 1] = tmp[1]; p[k + 2] = tmp[2] * sc;
        } else { p[k] = tmp[0]; p[k + 1] = tmp[1]; p[k + 2] = tmp[2]; }
      }
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
  }

  const m4 = new THREE.Matrix4();
  function updateGeometry() {
    fillGrid(dressGeo, NU, NV, 0, 1, 0);
    if (P.overlay > 0.01) fillGrid(overGeo, NU, NVO, V_WAIST, 1, 1);
    over.visible = P.overlay > 0.01;
    overMat.opacity = 0.3 * P.overlay;
    TRIMS.forEach((t) => {
      const a = P[t.key];
      t.mesh.visible = a > 0.02;
      t.mat.opacity = a;
      if (t.mesh.visible) fillGrid(t.geo, NU, 3, t.v0, t.v1, 0, 0.004);
    });
    beads.visible = P.beads > 0.02;
    if (beads.visible) {
      for (let i = 0; i < BEADS; i++) {
        const b = beadPts[i];
        surf(b.th, b.v, 0, tmp);
        const r = Math.hypot(tmp[0], tmp[2]) || 1;
        const sc = 1 + 0.004 / r;
        const s = P.beads;
        m4.makeScale(s, s, s).setPosition(tmp[0] * sc, tmp[1], tmp[2] * sc);
        beads.setMatrixAt(i, m4);
      }
      beads.instanceMatrix.needsUpdate = true;
    }
  }

  function applyMaterial(id) {
    const colors = tokens.colors || {};
    const m = MATERIAL[id];
    if (tex) tex.dispose();
    tex = new THREE.CanvasTexture(styleCanvas(id, {
      primary: colors.primary || '#6e533f', accent: colors.accent || '#b89474',
      heroBg: colors.heroBg || '#8d7360', heroBg2: colors.heroBg2 || '#1d2a6b', dark: colors.dark || '#2b2118',
    }));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(m.rep[0], m.rep[1]);
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    dressMat.map = tex;
    dressMat.roughness = m.roughness;
    dressMat.metalness = m.metalness;
    dressMat.sheen = m.sheen;
    dressMat.sheenRoughness = m.sheenRoughness;
    dressMat.sheenColor = new THREE.Color(m.sheenColor);
    dressMat.clearcoat = m.clearcoat;
    if ('anisotropy' in dressMat) dressMat.anisotropy = m.anisotropy;
    dressMat.envMapIntensity = m.env ?? 1;
    dressMat.needsUpdate = true;
    const gold = id === 'oneshoulder' ? '#e9cf8a' : hex(colors.accent || '#d4a437', 0.05);
    TRIMS.forEach((t) => t.mat.color.set(id === 'national' ? '#e2b54e' : gold));
  }

  function setTokens(t) {
    tokens = t || {};
    const colors = tokens.colors || {};
    const accent = colors.accent || '#d4a437';
    rimL.color.set(hex(accent, 0.35));
    rimR.color.set(hex(colors.heroText || '#ffffff', 0.1));
    hemi.color.set(hex(colors.heroText || '#ffffff', 0.2));
    hemi.groundColor.set(hex(colors.heroBg2 || '#333333', -0.2));
    bodyMat.color.set(MANNEQUIN_COLORS[tokens.mannequin] || MANNEQUIN_COLORS.linen);
    woodMat.color.set(tokens.dark ? accent : '#3b2a1f');
    pm.color.set(hex(accent, 0.45));
    applyMaterial(morph && !morph.swapped ? morph.from : cur);
    needs = true;
  }

  function setStyle(id, user = false) {
    if (user) { paused = false; lastSwitch = performance.now(); }
    if (!PARAMS[id] || (id === cur && !morph)) return;
    const from = morph ? morph.to : cur;
    if (id === from) return;
    morph = { fromP: { ...P }, from, to: id, t0: performance.now(), dur: o.animate ? 1500 : 1, swapped: false };
    foldA = { ...FOLDS[from] }; foldB = FOLDS[id]; foldM = 0;
    cur = id;
    lastSwitch = performance.now();
    if (user) paused = false;
    listeners.forEach((fn) => fn(id));
  }

  function nextStyle() {
    const i = ids.indexOf(morph ? morph.to : cur);
    setStyle(ids[(i + 1) % ids.length]);
  }

  // Tartib: DOMdagi harflar joylashuvi (piksel) asosida kamera va etak kengligini moslash
  let W = 1; let H = 1;
  let lay = null;
  function setLayout(l) {
    lay = l;
    applyLayout();
    if (!layoutReady) {
      layoutReady = true;
      unfurlStart = performance.now() + (o.animate ? 450 : -10000);
    }
    needs = true;
  }

  function applyLayout() {
    const r = container.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    renderer.setSize(W, H, false);
    cnv.style.width = '100%'; cnv.style.height = '100%';
    camera.aspect = W / H;
    if (!lay) {
      const k = 1.95 / (H * 0.8);
      const d = (k * H) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
      camera.position.set(0, -0.08, d); camera.lookAt(0, -0.08, 0); camera.updateProjectionMatrix();
      return;
    }
    const floorPx = lay.baselinePx + lay.capPx * 0.1;
    // Telefonda harflar kichik bo'lgani uchun ko'ylak nisbatan balandroq
    const skirtPx = lay.capPx * (W < 700 ? 2.3 : 1.45);
    let k = 1.3 / skirtPx;
    const minTop = lay.minTop || 90;
    if (floorPx - 1.85 / k < minTop) k = 1.85 / Math.max(80, floorPx - minTop);
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const d = (k * H) / (2 * tan);
    const camX = -(lay.aPx - W / 2) * k;
    const camY = FLOOR + (floorPx - H / 2) * k;
    camera.position.set(camX, camY, d);
    camera.lookAt(camX, camY, 0);
    camera.far = d + 20;
    camera.updateProjectionMatrix();
    // Perspektiva tufayli old qismi kattaroq ko'rinadi — ozgina kamaytiramiz
    const persp = d / (d + 0.35);
    L.rA = Math.min(0.75, Math.max(0.38, (lay.letterW / 2) * k * 1.08));
    L.aL = Math.max(L.rA + 0.2, (lay.aPx - lay.leftPx) * k * 1.04 * persp);
    L.aR = Math.max(L.rA + 0.2, (lay.rightPx - lay.aPx) * k * 1.04 * persp);
    L.bz = Math.min(0.75, Math.max(0.46, L.rA * 1.12));
  }

  // Kursorga qarab yengil burilish
  let mx = 0; let rotY = 0;
  const onMove = (e) => { mx = (e.clientX / window.innerWidth - 0.5) * 2; };
  window.addEventListener('pointermove', onMove, { passive: true });

  let raf = 0; let visible = true; let needs = true; let disposed = false; let last = performance.now();
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!visible || document.hidden) return;
    let geoDirty = false;
    if (o.animate) { time += dt; geoDirty = true; }
    // Ochilish (etak yoyilishi)
    if (layoutReady && L.unfurl < 1) {
      const t = Math.min(1, Math.max(0, (now - unfurlStart) / 2400));
      L.unfurl = easeOut(t);
      geoDirty = true;
    }
    // Turlar almashinuvi
    if (morph) {
      const t = Math.min(1, (now - morph.t0) / morph.dur);
      const e = easeInOut(t);
      P = mixParams(morph.fromP, PARAMS[morph.to], e);
      foldM = e;
      if (!morph.swapped && t >= 0.5) { morph.swapped = true; applyMaterial(morph.to); burst = 1; }
      if (t >= 1) { P = { ...PARAMS[morph.to] }; foldA = FOLDS[morph.to]; foldM = 0; morph = null; }
      geoDirty = true;
    } else if (o.animate && !paused && layoutReady && L.unfurl >= 1 && now - lastSwitch > o.cycleMs) {
      nextStyle();
    }
    // Burilish
    const target = o.animate ? mx * 0.16 + Math.sin(time * 0.35) * 0.05 : 0;
    rotY += (target - rotY) * 0.04;
    root.rotation.y = rotY;
    // Uchqunlar
    if (o.animate) {
      burst *= 0.96;
      const pa = points.geometry.attributes.position;
      for (let i = 0; i < NP; i++) {
        let y = pa.getY(i) + dt * pseed[i] * (1 + burst * 6);
        if (y > 1.2) y = -1;
        pa.setY(i, y);
      }
      pa.needsUpdate = true;
      points.rotation.y += dt * 0.04;
    }
    if (geoDirty || needs) {
      updateGeometry();
      renderer.render(scene, camera);
      needs = false;
    }
  }

  const io = 'IntersectionObserver' in window ? new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0.01 }) : null;
  io && io.observe(container);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => { applyLayout(); needs = true; }) : null;
  ro ? ro.observe(container) : window.addEventListener('resize', applyLayout);

  applyLayout();
  setTokens(tokens);
  applyMaterial(cur);
  updateGeometry();
  raf = requestAnimationFrame(frame);
  container.classList.add('has-3d', 'is-gown');

  return {
    canvas: cnv,
    styles: GOWN_STYLES,
    setLayout,
    setTokens,
    setStyle: (id) => setStyle(id, true),
    next: nextStyle,
    getStyle: () => (morph ? morph.to : cur),
    onStyle(fn) { listeners.push(fn); },
    pause(p) { paused = !!p; if (!p) lastSwitch = performance.now(); },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      io && io.disconnect(); ro && ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      if (tex) tex.dispose();
      disposables.forEach((d) => d.dispose && d.dispose());
      envRT.dispose(); pmrem.dispose(); renderer.dispose();
      cnv.remove();
      container.classList.remove('has-3d', 'is-gown');
      listeners = [];
      void disposed;
    },
  };
}
