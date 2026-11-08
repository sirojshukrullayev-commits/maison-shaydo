// Bosh sahifadagi realistik 3D ko'ylak.
// Ko'ylak so'zdagi "A" harfi o'rnida turadi, etagi so'zning birinchi va oxirgi harfi ostigacha tekis yoyiladi.
// Ko'rinishi admin paneldagi "3D ko'ylak" bo'limidan sozlanadi (gown-config.js).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  TORSO_SAMPLES, torsoR, bodyScale, deformBody, webglAvailable, fabricCanvas, weaveCanvas, radialCanvas,
  seeded, hex, MANNEQUIN_COLORS,
} from './mannequin.js';
import { normalizeGown } from '../gown-config.js';

export { webglAvailable };

const FLOOR = -1;
const VW = 0.16; // bel chizig'i (v)
const VH = 0.72; // etak polga tekkan joy (v)
const TILE = 1.0; // naqshning dunyo birligidagi o'lchami (4x4 gul)
const HEM_FLARE = 0.06; // etak polga tegishda biroz ochiladi
// Maneken: ozg'in va bo'yni uzun
const SLIM = 0.78; // tana kengligi koeffitsienti (ozg'in)
const NECK_Y = 0.63; // bo'yin shu balandlikdan boshlanadi
const NECK_K = 2.0; // bo'yin necha barobar uzunroq
const LIFT = (0.752 - NECK_Y) * (NECK_K - 1); // bosh qismi qancha ko'tariladi
const TOPY = 0.87 + LIFT; // eng yuqori nuqta (qopqoq sharchasi)
const unNeck = (y) => (y > NECK_Y ? NECK_Y + (y - NECK_Y) / NECK_K : y);
const bodyR = (y) => torsoR(unNeck(y)) * SLIM;
const bScale = (y) => bodyScale(unNeck(y));
const LOBE = 0.085; // dantel chetidagi har bir fistonchaning uzunligi
const NB = 1600; // chet lentasining bo'laklari

const SIL = {
  // A harfiga o'xshash: belidan etagigacha to'g'ri chiziq bo'ylab kengayadi
  aline: { bell: 0, mermaid: 0, rAmul: 1, waist: 0.36, fold: 0.02 },
  ball: { bell: 0.92, mermaid: 0, rAmul: 1.32, waist: 0.3, fold: 0.036 },
  mermaid: { bell: 0, mermaid: 1, rAmul: 1.04, waist: 0.3, fold: 0.022 },
  empire: { bell: 0.15, mermaid: 0, rAmul: 1.05, waist: 0.42, fold: 0.03 },
};

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// ---------- Dantel naqshi (choksiz takrorlanadigan) ----------
function laceMotifs() {
  const r = seeded(31);
  const N = 4;
  const out = [];
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      out.push({
        x: (i + 0.5 + (r() - 0.5) * 0.5) / N, y: (j + 0.5 + (r() - 0.5) * 0.5) / N,
        s: 0.85 + r() * 0.4, rot: r() * Math.PI * 2, leaves: 3 + Math.floor(r() * 3),
        la: Array.from({ length: 6 }, () => r() * Math.PI * 2), curl: r() < 0.5 ? 1 : -1, vr: r(),
      });
    }
  }
  return out;
}
const MOTIFS = laceMotifs();

function drawLace(g, S, st) {
  // To'r (tyul)
  if (st.net) {
    g.strokeStyle = st.net; g.lineWidth = st.netW || 1;
    const step = 11;
    g.beginPath();
    for (let y = 0; y <= S; y += step * 0.866) {
      const off = Math.round(y / (step * 0.866)) % 2 ? step / 2 : 0;
      for (let x = -step; x <= S + step; x += step) {
        g.moveTo(x + off, y); g.lineTo(x + off + step / 2, y + step * 0.866);
        g.moveTo(x + off, y); g.lineTo(x + off - step / 2, y + step * 0.866);
      }
    }
    g.stroke();
  }
  const leaf = (len, wid) => {
    g.beginPath(); g.moveTo(0, 0);
    g.quadraticCurveTo(len * 0.5, -wid, len, 0); g.quadraticCurveTo(len * 0.5, wid, 0, 0); g.closePath();
  };
  const unit = S / 4;
  for (const m of MOTIFS) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const cx = (m.x + dx) * S; const cy = (m.y + dy) * S;
        if (cx < -unit || cx > S + unit || cy < -unit || cy > S + unit) continue;
        const sc = m.s * unit / 100;
        g.save(); g.translate(cx, cy); g.rotate(m.rot); g.scale(sc, sc);
        g.lineCap = 'round'; g.lineJoin = 'round';
        // Novdalar (spiral va to'lqinli)
        g.strokeStyle = st.cord; g.lineWidth = st.cordW || 3.2;
        for (let k = 0; k < 3; k++) {
          const a = m.la[k];
          g.beginPath(); g.moveTo(Math.cos(a) * 14, Math.sin(a) * 14);
          g.bezierCurveTo(Math.cos(a) * 46 + 18 * m.curl, Math.sin(a) * 46 - 14, Math.cos(a + 0.6) * 70, Math.sin(a + 0.6) * 70, Math.cos(a + 0.9 * m.curl) * 82, Math.sin(a + 0.9 * m.curl) * 82);
          g.stroke();
          // Gajak
          const ex = Math.cos(a + 0.9 * m.curl) * 82; const ey = Math.sin(a + 0.9 * m.curl) * 82;
          g.beginPath(); g.arc(ex + 6 * m.curl, ey, 7, 0, Math.PI * 1.6 * m.curl, m.curl < 0); g.stroke();
          // Mayda nuqtalar (pikot)
          if (st.fill) { g.fillStyle = st.fill; for (let p = 1; p <= 3; p++) { g.beginPath(); g.arc(Math.cos(a) * (24 + p * 15) + 10 * m.curl, Math.sin(a) * (24 + p * 15) - 6, 2.4, 0, Math.PI * 2); g.fill(); } }
        }
        // Barglar
        for (let k = 0; k < m.leaves; k++) {
          const a = m.la[(k + 2) % 6] + k;
          g.save(); g.rotate(a); g.translate(30, 0);
          leaf(34, 11);
          if (st.fill) { g.fillStyle = st.fill; g.fill(); }
          g.strokeStyle = st.cord; g.lineWidth = st.cordW ? st.cordW * 0.7 : 2.2; g.stroke();
          g.beginPath(); g.moveTo(3, 0); g.lineTo(30, 0); g.lineWidth = 1.2; g.stroke();
          g.restore();
        }
        // Gul
        for (let p = 0; p < 6; p++) {
          g.save(); g.rotate((p / 6) * Math.PI * 2); g.translate(15, 0);
          g.beginPath(); g.ellipse(0, 0, 12, 7.5, 0, 0, Math.PI * 2);
          if (st.fill) { g.fillStyle = st.fill; g.fill(); }
          g.strokeStyle = st.cord; g.lineWidth = st.cordW ? st.cordW * 0.75 : 2.4; g.stroke();
          g.restore();
        }
        g.beginPath(); g.arc(0, 0, 6.5, 0, Math.PI * 2);
        g.fillStyle = st.center || st.cord; g.fill();
        g.restore();
      }
    }
  }
}

function canvas(S = 1024) { const c = document.createElement('canvas'); c.width = c.height = S; return c; }
function rgba(hx, a) { const c = new THREE.Color(hx); return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`; }

function laceColorCanvas(base, lace) {
  const S = 1024; const cv = canvas(S); const g = cv.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  // Yengil soya — naqshga hajm beradi
  g.save(); g.translate(2.5, 3);
  drawLace(g, S, { cord: rgba(hex(base, -0.28), 0.35), fill: rgba(hex(base, -0.22), 0.25) });
  g.restore();
  drawLace(g, S, { net: rgba(lace, 0.2), cord: rgba(lace, 1), fill: rgba(lace, 0.82), center: rgba(hex(lace, -0.08), 1) });
  return cv;
}
function laceMaskCanvas(netAlpha) {
  const S = 1024; const cv = canvas(S); const g = cv.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
  drawLace(g, S, { net: `rgba(255,255,255,${netAlpha})`, netW: 1.4, cord: '#fff', fill: 'rgba(255,255,255,.95)', center: '#fff' });
  return cv;
}
function laceBumpCanvas() {
  const S = 1024; const cv = canvas(S); const g = cv.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
  if ('filter' in g) g.filter = 'blur(1.2px)';
  drawLace(g, S, { net: 'rgba(255,255,255,.18)', cord: '#fff', fill: 'rgba(255,255,255,.62)', center: '#fff', cordW: 4 });
  return cv;
}

// Etak chetidagi dantel lenta: ikki fistoncha, ichida gullar, chetida ip va pikotlar
function borderCanvas(lace, mask) {
  const Wd = 1024; const Hd = 256;
  const cv = document.createElement('canvas'); cv.width = Wd; cv.height = Hd;
  const g = cv.getContext('2d');
  g.fillStyle = mask ? '#000' : lace; g.fillRect(0, 0, Wd, Hd);
  const top = Hd * 0.42; const ry = Hd * 0.5;
  const lobes = [256, 768];
  const shape = () => {
    g.beginPath(); g.rect(-4, -4, Wd + 8, top + 4);
    lobes.forEach((cx) => { g.moveTo(cx + 256, top); g.ellipse(cx, top, 256, ry, 0, 0, Math.PI); });
  };
  g.save(); shape(); g.clip();
  if (mask) {
    g.fillStyle = 'rgba(255,255,255,.82)'; g.fillRect(0, 0, Wd, Hd);
    // Ichki gullar (lenta bo'ylab takrorlanadi)
    g.save(); g.scale(1, 0.5); drawLace(g, Wd, { cord: '#fff', fill: 'rgba(255,255,255,.95)', center: '#fff', cordW: 5 }); g.restore();
  } else {
    g.save(); g.scale(1, 0.5); drawLace(g, Wd, { cord: rgba(hex(lace, -0.12), 0.9), fill: rgba(hex(lace, 0.4), 0.95), center: rgba(hex(lace, -0.16), 1), cordW: 5 }); g.restore();
  }
  g.restore();
  // Chetdagi qalin ip va mayda pikot halqalar
  g.lineWidth = 9; g.strokeStyle = mask ? '#fff' : hex(lace, -0.05);
  lobes.forEach((cx) => { g.beginPath(); g.ellipse(cx, top, 248, ry - 8, 0, 0.02, Math.PI - 0.02); g.stroke(); });
  g.lineWidth = 4; g.strokeStyle = mask ? '#fff' : hex(lace, -0.1);
  g.beginPath(); g.moveTo(0, top * 0.18); g.lineTo(Wd, top * 0.18); g.stroke();
  g.fillStyle = mask ? '#fff' : hex(lace, -0.05);
  lobes.forEach((cx) => {
    for (let k = 1; k < 18; k++) {
      const a = (k / 18) * Math.PI;
      g.beginPath(); g.arc(cx + Math.cos(a) * 262, top + Math.sin(a) * (ry + 4), 6, 0, Math.PI * 2); g.fill();
    }
  });
  return cv;
}

function fabricColorCanvas(kind, base, lace) {
  if (kind === 'lace') return laceColorCanvas(base, lace);
  if (kind === 'atlas') return fabricCanvas('atlas', { primary: base, heroBg2: '#1d2a6b' });
  if (kind === 'chiffon') return fabricCanvas('chiffon', { heroBg: base, accent: lace, primary: hex(base, -0.25) });
  const S = 1024; const cv = canvas(S); const g = cv.getContext('2d'); const r = seeded(4);
  if (kind === 'velvet') {
    g.fillStyle = hex(base, -0.15); g.fillRect(0, 0, S, S);
    for (let k = 0; k < 14000; k++) { g.fillStyle = `rgba(255,255,255,${(r() * 0.05).toFixed(3)})`; g.fillRect(r() * S, r() * S, 2, 2); }
  } else if (kind === 'pleated') {
    for (let x = 0; x < S; x += 16) {
      const gr = g.createLinearGradient(x, 0, x + 16, 0);
      gr.addColorStop(0, hex(base, -0.3)); gr.addColorStop(0.45, hex(base, 0.12)); gr.addColorStop(0.55, hex(base, 0.22)); gr.addColorStop(1, hex(base, -0.22));
      g.fillStyle = gr; g.fillRect(x, 0, 16, S);
    }
  } else {
    const gr = g.createLinearGradient(0, 0, S, 0);
    const n = kind === 'satin' ? 8 : 14;
    for (let k = 0; k <= n; k++) gr.addColorStop(k / n, k % 2 ? hex(base, kind === 'satin' ? 0.05 : 0.06) : hex(base, -0.03));
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    g.globalAlpha = 0.045; for (let y = 0; y < S; y += 4) { g.fillStyle = y % 8 ? '#fff' : '#000'; g.fillRect(0, y, S, 1); }
    g.globalAlpha = 1;
  }
  return cv;
}

const FABRIC_MAT = {
  lace: { roughness: 0.62, sheen: 1, sheenRoughness: 0.5, clearcoat: 0, metalness: 0, anisotropy: 0, bump: 0.55 },
  silk: { roughness: 0.32, sheen: 1, sheenRoughness: 0.25, clearcoat: 0.2, metalness: 0, anisotropy: 0.5, bump: 0 },
  satin: { roughness: 0.26, sheen: 0.45, sheenRoughness: 0.3, clearcoat: 0.45, metalness: 0, anisotropy: 0.55, bump: 0 },
  velvet: { roughness: 0.9, sheen: 1, sheenRoughness: 0.42, clearcoat: 0, metalness: 0, anisotropy: 0, bump: 0 },
  atlas: { roughness: 0.36, sheen: 0.8, sheenRoughness: 0.3, clearcoat: 0.3, metalness: 0, anisotropy: 0.3, bump: 0 },
  chiffon: { roughness: 0.62, sheen: 0.7, sheenRoughness: 0.4, clearcoat: 0, metalness: 0, anisotropy: 0, bump: 0 },
  pleated: { roughness: 0.34, sheen: 0.6, sheenRoughness: 0.3, clearcoat: 0.2, metalness: 0.2, anisotropy: 0.2, bump: 0 },
};

// ---------- Asosiy sahna ----------
export function createGown(container, opts = {}) {
  const o = { tokens: {}, animate: true, quality: 'high', config: null, tilt: 17, ...opts };
  if (!webglAvailable()) throw new Error('WebGL mavjud emas');
  const NU = o.quality === 'low' ? 150 : 230;
  const NV = o.quality === 'low' ? 110 : 170;
  let C = normalizeGown(o.config);
  let tokens = o.tokens || {};

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, o.quality === 'low' ? 1.6 : 1.8));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  const cnv = renderer.domElement;
  cnv.className = 'mannequin-canvas gown-canvas';
  container.appendChild(cnv);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  if ('environmentIntensity' in scene) scene.environmentIntensity = 0.42;

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 80);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x2a2018, 0.5);
  const key = new THREE.DirectionalLight(0xfff4e8, 2.3); key.position.set(2.2, 3.4, 4.2);
  const fill = new THREE.DirectionalLight(0xf2ecff, 0.75); fill.position.set(-3, 1.2, 3.5);
  const rimL = new THREE.DirectionalLight(0xffffff, 1.8); rimL.position.set(-3.5, 2.6, -2.5);
  const rimR = new THREE.DirectionalLight(0xffffff, 1.3); rimR.position.set(3.4, 1.8, -2.6);
  const top = new THREE.SpotLight(0xffffff, 18, 12, 0.5, 0.6, 1.6); top.position.set(0, 4.5, 1.5); top.target.position.set(0, -0.6, 0);
  scene.add(hemi, key, fill, rimL, rimR, top, top.target);

  const root = new THREE.Group();
  scene.add(root);
  const disposables = [];
  const track = (x) => { disposables.push(x); return x; };

  // Maneken
  const torsoGeo = track(new THREE.LatheGeometry(TORSO_SAMPLES, 120));
  deformBody(torsoGeo);
  {
    const tp = torsoGeo.attributes.position;
    for (let i = 0; i < tp.count; i++) {
      const y = tp.getY(i);
      tp.setXYZ(i, tp.getX(i) * SLIM, y > NECK_Y ? NECK_Y + (y - NECK_Y) * NECK_K : y, tp.getZ(i) * SLIM);
    }
    torsoGeo.computeVertexNormals();
  }
  const weave = track(new THREE.CanvasTexture(weaveCanvas('#ffffff')));
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping; weave.repeat.set(7, 5); weave.colorSpace = THREE.SRGBColorSpace;
  const bodyMat = track(new THREE.MeshStandardMaterial({ color: MANNEQUIN_COLORS.linen, map: weave, roughness: 0.86 }));
  root.add(new THREE.Mesh(torsoGeo, bodyMat));
  const metalMat = track(new THREE.MeshStandardMaterial({ color: '#d7d9dc', roughness: 0.18, metalness: 1 }));
  const capM = new THREE.Mesh(track(new THREE.CylinderGeometry(0.068, 0.062, 0.024, 48)), metalMat); capM.position.y = 0.762 + LIFT;
  const rod = new THREE.Mesh(track(new THREE.CylinderGeometry(0.009, 0.009, 0.06, 16)), metalMat); rod.position.y = 0.8 + LIFT;
  const ball = new THREE.Mesh(track(new THREE.SphereGeometry(0.026, 32, 20)), metalMat); ball.position.y = 0.842 + LIFT;
  const collar = new THREE.Mesh(track(new THREE.TorusGeometry(0.02, 0.006, 10, 32)), metalMat); collar.rotation.x = Math.PI / 2; collar.position.y = 0.778 + LIFT;
  root.add(capM, rod, ball, collar);

  // To'r (grid) geometriyasi
  function makeGrid(nu, nv, withColor = false) {
    const g = new THREE.BufferGeometry();
    const n = (nu + 1) * (nv + 1);
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    if (withColor) g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
    const idx = [];
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i; const b = a + 1; const c = a + nu + 1; const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    g.setIndex(idx);
    return track(g);
  }

  // Materiallar
  const dressMat = track(new THREE.MeshPhysicalMaterial({ side: THREE.DoubleSide, vertexColors: true, roughness: 0.6, sheen: 1 }));
  const sheerMat = track(new THREE.MeshPhysicalMaterial({ side: THREE.DoubleSide, transparent: true, depthWrite: false, roughness: 0.6, sheen: 1, sheenRoughness: 0.5 }));
  const bandMat = track(new THREE.MeshPhysicalMaterial({ side: THREE.DoubleSide, transparent: true, alphaTest: 0.35, roughness: 0.62, sheen: 1, sheenRoughness: 0.5 }));
  const trimMat = track(new THREE.MeshStandardMaterial({ color: '#d4a437', roughness: 0.22, metalness: 1, side: THREE.DoubleSide }));

  // Pol ustidagi yumshoq soya (etakni "yerga" o'tqazadi)
  const shadowTex = track(new THREE.CanvasTexture(radialCanvas('rgba(0,0,0,0.85)', 'rgba(0,0,0,0)')));
  const shadowMat = track(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.38 }));
  const shadow = new THREE.Mesh(track(new THREE.PlaneGeometry(2, 2)), shadowMat);
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = FLOOR - 0.004; shadow.renderOrder = -1;
  root.add(shadow);

  const dressGeo = makeGrid(NU, NV, true);
  const dress = new THREE.Mesh(dressGeo, dressMat);
  const NI = 14;
  const illGeo = makeGrid(NU, NI);
  const illusion = new THREE.Mesh(illGeo, sheerMat);
  const topBandGeo = makeGrid(NU, 4);
  const topBand = new THREE.Mesh(topBandGeo, bandMat);
  const shBandGeo = makeGrid(NU, 4);
  const shBand = new THREE.Mesh(shBandGeo, bandMat);
  const beltGeo = makeGrid(NU, 3);
  const belt = new THREE.Mesh(beltGeo, trimMat);
  const NSU = 48; const NSV = 60;
  const sleeveGeos = [makeGrid(NSU, NSV), makeGrid(NSU, NSV)];
  const sleeves = sleeveGeos.map((g) => new THREE.Mesh(g, sheerMat));
  // Etak chetidagi dantel lenta (yoy uzunligi bo'yicha bir tekis fistonchalar)
  const borderGeo = track(new THREE.BufferGeometry());
  borderGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((NB + 1) * 2 * 3), 3));
  borderGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((NB + 1) * 2 * 2), 2));
  borderGeo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array((NB + 1) * 2 * 3), 3));
  { const idx = []; for (let i = 0; i < NB; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } borderGeo.setIndex(idx); }
  for (let i = 0; i < (NB + 1) * 2; i++) borderGeo.attributes.normal.setXYZ(i, 0, 1, 0);
  const borderMat = track(new THREE.MeshPhysicalMaterial({ side: THREE.DoubleSide, transparent: true, alphaTest: 0.05, depthWrite: false, roughness: 0.6, sheen: 1, sheenRoughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.renderOrder = 1;
  [dress, illusion, topBand, shBand, belt, border, ...sleeves].forEach((m) => { m.frustumCulled = false; root.add(m); });
  illusion.renderOrder = 2; sleeves.forEach((s) => { s.renderOrder = 3; });

  // Uchqunlar
  const NP = 90;
  const ppos = new Float32Array(NP * 3); const pr = seeded(9); const pseed = [];
  for (let i = 0; i < NP; i++) {
    const a = pr() * Math.PI * 2; const rr = 0.4 + pr() * 1.4;
    ppos[i * 3] = Math.cos(a) * rr; ppos[i * 3 + 1] = -1 + pr() * 2.1; ppos[i * 3 + 2] = Math.sin(a) * rr * 0.6;
    pseed.push(0.03 + pr() * 0.05);
  }
  const pg = track(new THREE.BufferGeometry()); pg.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
  const dotTex = track(new THREE.CanvasTexture(radialCanvas('rgba(255,255,255,1)', 'rgba(255,255,255,0)')));
  const pm = track(new THREE.PointsMaterial({ size: 0.022, map: dotTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffe9c2', opacity: 0.8 }));
  const points = new THREE.Points(pg, pm); points.frustumCulled = false;
  scene.add(points);

  // ----- Shakl -----
  const L = { rA: 0.5, aX: 0.6, bF: 0.7, bB: 0.45, unfurl: 1 };
  const phase = [0.4, 2.1, 4.3, 1.2];
  let S = SIL.aline;

  function bodiceTop(th) {
    const sn = Math.sin(th); const cs = Math.cos(th);
    if (C.neckline === 'illusion') return 0.515 - 0.012 * Math.pow(Math.max(0, cs), 4);
    if (C.neckline === 'collar') return 0.7;
    if (C.neckline === 'oneshoulder') return 0.47 + 0.15 * Math.pow(Math.max(0, sn), 2) - 0.02 * Math.pow(Math.max(0, cs), 6);
    return 0.472 - 0.038 * Math.pow(Math.max(0, cs), 6);
  }
  function onBody(th, y, off, out) {
    const r = bodyR(y) + off;
    const [sx, sz] = bScale(y);
    const cs = Math.cos(th);
    out[0] = Math.sin(th) * r * sx; out[1] = y; out[2] = cs * r * sz * (cs < 0 ? 0.94 : 1);
  }
  function foldPattern(th, s) {
    if (C.fabric === 'pleated') return Math.abs(Math.sin(th * 34)) * 2 - 1;
    return 0.52 * Math.sin(th * 7 + phase[0] + s * 0.8) + 0.3 * Math.sin(th * 12 + phase[1] - s * 1.1) + 0.18 * Math.sin(th * 21 + phase[2]);
  }

  // Asosiy yuza: th — aylana burchagi, v — yoqadan etak chetigacha
  const res = { x: 0, y: 0, z: 0, f: 0 };
  function surf(th, v) {
    const sn = Math.sin(th); const cs = Math.cos(th);
    const waist = S.waist;
    if (v <= VW) {
      const s = v / VW;
      const topY = bodiceTop(th);
      const y = topY + (waist - topY) * s;
      const tmp = [0, 0, 0];
      onBody(th, y, 0.011, tmp);
      res.x = tmp[0]; res.y = y; res.z = tmp[2]; res.f = 0;
      return res;
    }
    const rw = bodyR(waist) + 0.013;
    // Har qanday siluetda etak "A" harfi joyidan chiqmaydi
    const rA = Math.min(L.rA * S.rAmul, (L.aX - 0.005) / (1 + HEM_FLARE) - S.fold);
    const ampMax = C.fabric === 'pleated' ? 0.009 : S.fold;
    if (v <= VH) {
      const s = (v - VW) / (VH - VW);
      const y = waist + (FLOOR + 0.02 - waist) * s;
      const fa = s; const fb = 1 - Math.pow(1 - s, 2.5);
      const fm = s < 0.6 ? 0.06 * s / 0.6 : 0.06 + 0.94 * Math.pow((s - 0.6) / 0.4, 1.6);
      const f = fa * Math.max(0, 1 - S.bell - S.mermaid) + fb * S.bell + fm * S.mermaid;
      let r = rw + (rA - rw) * f;
      const hipMin = (0.278 + (0.235 - 0.278) * Math.min(1, Math.max(0, (0.08 - y) / 0.6))) * SLIM;
      if (y > 0.08) r = Math.max(r, bodyR(y) + 0.013); else r = Math.max(r, S.mermaid > 0.5 ? hipMin : 0.2);
      const fp = foldPattern(th, s);
      const amp = ampMax * Math.pow(s, 1.15);
      r += amp * fp + rA * HEM_FLARE * Math.pow(smooth(0.78, 1, s), 2);
      const [sx, sz] = bScale(y);
      res.x = sn * r * sx; res.y = y; res.z = cs * r * sz * (cs < 0 && y > 0 ? 0.94 : 1); res.f = fp * Math.pow(s, 1.15);
      return res;
    }
    // Polga tekis yoyilgan etak
    const s = (v - VH) / (1 - VH);
    const fp = foldPattern(th, 1);
    const rEnd = rA * (1 + HEM_FLARE) + ampMax * fp;
    const [sxA, szA] = bScale(FLOOR + 0.02);
    const x0 = sn * rEnd * sxA; const z0 = cs * rEnd * szA;
    const spread = (C.spread / 100) * L.unfurl;
    const ax = L.aX;
    const trainBack = o.animate ? L.bB + (L.aX - L.bB) * (C.train / 100) : L.bB + (L.bB * 2.2) * (C.train / 100);
    const bz = lerp(trainBack, L.bF, smooth(-0.35, 0.35, cs));
    const aE = rEnd + (Math.max(ax, rEnd) - rEnd) * spread;
    const bE = rEnd + (Math.max(bz, rEnd) - rEnd) * spread;
    const xE = sn * aE; const zE = cs * bE;
    const e = 1 - Math.pow(1 - s, 1.25);
    const fade = Math.pow(1 - s, 1.6);
    const rr = 1 + (ampMax * 0.6 * fp * fade) / Math.max(0.2, Math.hypot(x0, z0));
    res.x = lerp(x0, xE, e) * rr;
    res.z = lerp(z0, zE, e) * rr;
    res.y = FLOOR + 0.02 * Math.pow(1 - s, 2) + 0.03 * (0.5 + 0.5 * fp) * Math.sin(Math.PI * Math.min(1, s * 1.4)) * (1 - s) + 0.006 * Math.sin(Math.PI * s);
    res.f = fp * fade - 0.9 * Math.pow(1 - s, 6);
    return res;
  }

  const tmp3 = [0, 0, 0];
  function updateDress() {
    const p = dressGeo.attributes.position.array;
    const uv = dressGeo.attributes.uv.array;
    const col = dressGeo.attributes.color.array;
    for (let j = 0; j <= NV; j++) {
      const v = j / NV;
      for (let i = 0; i <= NU; i++) {
        const th = -Math.PI + (i / NU) * Math.PI * 2;
        const q = surf(th, v);
        const k = (j * (NU + 1) + i) * 3;
        p[k] = q.x; p[k + 1] = q.y; p[k + 2] = q.z;
        // Burmalardagi soya (ambient occlusion)
        const shade = 1 - 0.16 * Math.max(0, -q.f) + 0.04 * Math.max(0, q.f) - (v > VH ? 0.03 : 0);
        col[k] = col[k + 1] = col[k + 2] = Math.max(0.6, Math.min(1.08, shade));
      }
    }
    // Naqsh cho'zilmasligi uchun UV ikki yo'nalishda ham haqiqiy yoy uzunligi bo'yicha (chok orqada)
    for (let j = 0; j <= NV; j++) {
      let acc = 0;
      const half = NU >> 1;
      for (let i = half; i <= NU; i++) {
        const k = j * (NU + 1) + i;
        if (i > half) { const a = k * 3; const b = a - 3; acc += Math.hypot(p[a] - p[b], p[a + 1] - p[b + 1], p[a + 2] - p[b + 2]); }
        uv[k * 2] = acc / TILE;
      }
      acc = 0;
      for (let i = half; i >= 0; i--) {
        const k = j * (NU + 1) + i;
        if (i < half) { const a = k * 3; const b = a + 3; acc += Math.hypot(p[a] - p[b], p[a + 1] - p[b + 1], p[a + 2] - p[b + 2]); }
        uv[k * 2] = -acc / TILE;
      }
    }
    for (let i = 0; i <= NU; i++) {
      let acc = 0;
      for (let j = 0; j <= NV; j++) {
        const k = j * (NU + 1) + i;
        if (j > 0) {
          const a = k * 3; const b = (k - NU - 1) * 3;
          acc += Math.hypot(p[a] - p[b], p[a + 1] - p[b + 1], p[a + 2] - p[b + 2]);
        }
        uv[k * 2 + 1] = -acc / TILE;
      }
    }
    if (C.scallop) updateBorder();
    // Soya o'lchami etak bilan birga o'zgaradi
    const sp = (C.spread / 100) * L.unfurl;
    const ax = L.rA + (L.aX - L.rA) * sp;
    const back = o.animate ? L.bB + (L.aX - L.bB) * (C.train / 100) : L.bB + L.bB * 2.2 * (C.train / 100);
    const bz = L.rA + (Math.max(L.bF, back) - L.rA) * sp;
    shadow.scale.set(ax * 1.12, bz * 1.12, 1);
    dressGeo.attributes.position.needsUpdate = true;
    dressGeo.attributes.uv.needsUpdate = true;
    dressGeo.attributes.color.needsUpdate = true;
    dressGeo.computeVertexNormals();
  }

  const NS = 2400;
  const ex = new Float32Array(NS + 1); const ez = new Float32Array(NS + 1); const ecum = new Float32Array(NS + 1);
  function updateBorder() {
    for (let k = 0; k <= NS; k++) {
      const q = surf(-Math.PI + (k / NS) * Math.PI * 2, 1);
      ex[k] = q.x; ez[k] = q.z;
      ecum[k] = k ? ecum[k - 1] + Math.hypot(ex[k] - ex[k - 1], ez[k] - ez[k - 1]) : 0;
    }
    const total = ecum[NS];
    const lobes = Math.max(8, Math.round(total / LOBE / 2) * 2);
    const p = borderGeo.attributes.position.array; const uv = borderGeo.attributes.uv.array;
    const wIn = 0.06; const wOut = 0.05;
    let k = 0;
    for (let i = 0; i <= NB; i++) {
      const target = (i / NB) * total;
      while (k < NS - 1 && ecum[k + 1] < target) k++;
      const t = (target - ecum[k]) / Math.max(1e-6, ecum[k + 1] - ecum[k]);
      const x = lerp(ex[k], ex[k + 1], t); const z = lerp(ez[k], ez[k + 1], t);
      let tx = ex[k + 1] - ex[k]; let tz = ez[k + 1] - ez[k];
      const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
      // Tashqi normal (y o'qi atrofida)
      const nx = tz; const nz = -tx;
      const sgn = (x * nx + z * nz) >= 0 ? 1 : -1;
      const a = i * 6;
      p[a] = x - nx * sgn * wIn; p[a + 1] = FLOOR + 0.004; p[a + 2] = z - nz * sgn * wIn;
      p[a + 3] = x + nx * sgn * wOut; p[a + 4] = FLOOR + 0.002; p[a + 5] = z + nz * sgn * wOut;
      const u = (i / NB) * (lobes / 2);
      uv[i * 4] = u; uv[i * 4 + 1] = 1; uv[i * 4 + 2] = u; uv[i * 4 + 3] = 0;
    }
    borderGeo.attributes.position.needsUpdate = true; borderGeo.attributes.uv.needsUpdate = true;
  }

  function fillBand(geo, nv, fn) {
    const p = geo.attributes.position.array; const uv = geo.attributes.uv.array;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= NU; i++) {
      const th = -Math.PI + (i / NU) * Math.PI * 2;
      fn(th, j / nv, tmp3);
      const k = j * (NU + 1) + i;
      p[k * 3] = tmp3[0]; p[k * 3 + 1] = tmp3[1]; p[k * 3 + 2] = tmp3[2];
      uv[k * 2] = (i / NU) * (2 * Math.PI * 0.27) / (TILE * 0.5); uv[k * 2 + 1] = tmp3[1] / (TILE * 0.5);
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.uv.needsUpdate = true;
    geo.computeVertexNormals();
  }

  function sleevePoint(side, t, phi, out) {
    // Yelkadan bilakkacha bir oz tashqariga egilgan naycha
    const P0 = [side * 0.282 * SLIM, 0.575, -0.004]; const P1 = [side * 0.33 * SLIM, 0.3, 0.02]; const P2 = [side * 0.318 * SLIM, 0.035, 0.05];
    const a = (1 - t) * (1 - t); const b = 2 * (1 - t) * t; const c = t * t;
    const cx = a * P0[0] + b * P1[0] + c * P2[0];
    let cy = a * P0[1] + b * P1[1] + c * P2[1];
    const cz = a * P0[2] + b * P1[2] + c * P2[2];
    let r = (0.058 * (1 - t) + 0.036 * t) * 0.9;
    if (t < 0.1) r *= 1 + 0.35 * (1 - t / 0.1);
    if (t > 0.97 && C.scallop) cy -= 0.008 * Math.abs(Math.sin(phi * 6));
    out[0] = cx + Math.cos(phi) * r; out[1] = cy; out[2] = cz + Math.sin(phi) * r * 0.85;
  }

  function updateParts() {
    const ill = C.neckline === 'illusion';
    const withSleeves = C.sleeves === 'long' && (C.neckline === 'illusion' || C.neckline === 'collar');
    illusion.visible = ill;
    shBand.visible = ill;
    topBand.visible = C.fabric === 'lace' || ill;
    belt.visible = C.trim !== 'none';
    sleeves.forEach((s) => { s.visible = withSleeves; });
    if (ill) {
      fillBand(illGeo, NI, (th, s, out) => onBody(th, lerp(0.505, 0.6, s), 0.007, out));
      fillBand(shBandGeo, 4, (th, s, out) => {
        let y = lerp(0.578, 0.608, s);
        if (s === 0 && C.scallop) y -= 0.009 * Math.abs(Math.sin(th * 30));
        onBody(th, y, 0.011, out);
      });
    }
    if (topBand.visible) {
      fillBand(topBandGeo, 4, (th, s, out) => {
        const t0 = bodiceTop(th);
        let y = lerp(t0 - 0.006, t0 + 0.014, s);
        if (s === 1 && C.scallop) y += 0.008 * Math.abs(Math.sin(th * 30));
        onBody(th, y, 0.0125, out);
      });
    }
    if (belt.visible) fillBand(beltGeo, 3, (th, s, out) => onBody(th, lerp(S.waist - 0.008, S.waist + 0.008, s), 0.016, out));
    if (withSleeves) {
      sleeveGeos.forEach((geo, si) => {
        const side = si === 0 ? -1 : 1;
        const p = geo.attributes.position.array; const uv = geo.attributes.uv.array;
        for (let j = 0; j <= NSV; j++) for (let i = 0; i <= NSU; i++) {
          const phi = (i / NSU) * Math.PI * 2;
          sleevePoint(side, j / NSV, phi, tmp3);
          const k = j * (NSU + 1) + i;
          p[k * 3] = tmp3[0]; p[k * 3 + 1] = tmp3[1]; p[k * 3 + 2] = tmp3[2];
          uv[k * 2] = (i / NSU) * (2 * Math.PI * 0.05) / (TILE * 0.5); uv[k * 2 + 1] = -(j / NSV) * 0.56 / (TILE * 0.5);
        }
        geo.attributes.position.needsUpdate = true; geo.attributes.uv.needsUpdate = true;
        geo.computeVertexNormals();
      });
    }
  }

  // ----- Matolar -----
  let texs = [];
  function applyMaterials() {
    matSig = MAT_KEYS.map((k) => C[k]).join('|');
    texs.forEach((t) => t.dispose());
    texs = [];
    const mk = (cv, srgb = true) => {
      const t = new THREE.CanvasTexture(cv);
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texs.push(t);
      return t;
    };
    const m = FABRIC_MAT[C.fabric];
    const colorTex = mk(fabricColorCanvas(C.fabric, C.color, C.lace));
    if (C.fabric !== 'lace') colorTex.repeat.set(C.fabric === 'atlas' ? 0.6 : 0.8, 0.8);
    dressMat.map = colorTex;
    dressMat.bumpMap = m.bump ? mk(laceBumpCanvas(), false) : null;
    dressMat.bumpScale = m.bump || 1;
    dressMat.roughness = m.roughness; dressMat.metalness = m.metalness;
    dressMat.sheen = m.sheen; dressMat.sheenRoughness = m.sheenRoughness;
    dressMat.sheenColor = new THREE.Color(C.fabric === 'velvet' ? hex(C.color, 0.45) : '#ffffff');
    dressMat.clearcoat = m.clearcoat;
    if ('anisotropy' in dressMat) dressMat.anisotropy = m.anisotropy;
    dressMat.needsUpdate = true;
    // Shaffof to'r va dantel qismlar (yenglar, yoqa)
    const laceCol = mk(laceColorCanvas(hex(C.lace, -0.04), C.lace));
    sheerMat.map = laceCol;
    sheerMat.alphaMap = mk(laceMaskCanvas(0.32), false);
    sheerMat.color.set('#ffffff');
    sheerMat.sheenColor = new THREE.Color('#ffffff');
    sheerMat.needsUpdate = true;
    bandMat.map = laceCol;
    bandMat.alphaMap = mk(laceMaskCanvas(0.55), false);
    bandMat.needsUpdate = true;
    const bc = mk(borderCanvas(C.lace, false)); bc.wrapT = THREE.ClampToEdgeWrapping;
    const bm = mk(borderCanvas(C.lace, true), false); bm.wrapT = THREE.ClampToEdgeWrapping;
    borderMat.map = bc; borderMat.alphaMap = bm;
    borderMat.needsUpdate = true;
    border.visible = !!C.scallop;
    trimMat.color.set(C.trim === 'silver' ? '#d9dcdf' : '#d9ad52');
    metalMat.color.set(C.finial === 'gold' ? '#d8b25e' : C.finial === 'wood' ? '#4a3324' : '#d7d9dc');
    metalMat.metalness = C.finial === 'wood' ? 0.1 : 1;
    metalMat.roughness = C.finial === 'wood' ? 0.5 : 0.18;
    bodyMat.color.set(MANNEQUIN_COLORS[C.mannequin] || MANNEQUIN_COLORS.linen);
    points.visible = !!C.sparkle;
  }

  function setTokens(t) {
    tokens = t || {};
    const colors = tokens.colors || {};
    rimL.color.set(hex(colors.accent || '#d4a437', 0.45));
    rimR.color.set(hex(colors.heroText || '#ffffff', 0.15));
    hemi.color.set(hex(colors.heroText || '#ffffff', 0.25));
    hemi.groundColor.set(hex(colors.heroBg2 || '#2a2018', -0.25));
    pm.color.set(hex(colors.accent || '#d4a437', 0.5));
    needs = true;
  }

  // ----- Kamera: so'zdagi harflarga moslash -----
  let W = 1; let H = 1; let lay = null; let layoutReady = false;
  let box = null;
  const spinning = () => !!(o.animate && C.motion);
  const vtmp = new THREE.Vector3();
  const ray = new THREE.Raycaster();
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -FLOOR);
  function place(tx, ty, d) {
    const ph = THREE.MathUtils.degToRad(o.tilt);
    camera.position.set(tx, ty + d * Math.sin(ph), d * Math.cos(ph));
    camera.lookAt(tx, ty, 0);
    camera.updateMatrixWorld();
  }
  function proj(x, y, z) { vtmp.set(x, y, z).project(camera); return [(vtmp.x + 1) / 2 * W, (1 - vtmp.y) / 2 * H]; }
  function floorHit(px, py) {
    ray.setFromCamera(new THREE.Vector2((px / W) * 2 - 1, -(py / H) * 2 + 1), camera);
    const out = new THREE.Vector3();
    return ray.ray.intersectPlane(floorPlane, out) ? out : null;
  }

  function solve() {
    const r = container.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    renderer.setSize(W, H, false);
    cnv.style.width = '100%'; cnv.style.height = '100%';
    camera.aspect = W / H; camera.updateProjectionMatrix();
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    if (!lay) { place(0, -0.2, 2.2 / tan); return; }
    const floorPx = lay.baselinePx + lay.capPx * 0.02;
    // Ko'ylak baland va nafis: umumiy bo'yi harf balandligidan ancha katta
    // Bo'yi: harf balandligidan ancha katta, lekin etak "A" joyiga sig'ib, A shakli saqlanadi
    // O'lchami admin paneldan: 0% — harf balandligicha, 100% — ~2.8 barobar
    const totalPx = Math.min(lay.capPx * (1.1 + 1.7 * (C.size / 100)), lay.letterW * 2.4);
    let skirtPx = totalPx * ((0.3 - FLOOR) / (TOPY - FLOOR));
    const solveFor = (spx) => {
      let tx = 0; let ty = -0.4; let d = (1.3 * H) / (spx * 2 * tan);
      for (let it = 0; it < 10; it++) {
        place(tx, ty, d);
        const pf = proj(0, FLOOR, 0); const pw = proj(0, 0.3, 0);
        d *= (pf[1] - pw[1]) / spx;
        place(tx, ty, d);
        const q = proj(0, FLOOR, 0);
        const k = (2 * d * tan) / H;
        tx += (q[0] - lay.aPx) * k;
        ty -= (q[1] - floorPx) * k;
      }
      place(tx, ty, d);
    };
    solveFor(skirtPx);
    const minTop = lay.minTop || 90;
    const topPy = proj(0, TOPY, 0)[1];
    if (topPy < minTop) {
      skirtPx *= (floorPx - minTop) / Math.max(40, floorPx - topPy);
      solveFor(skirtPx);
    }
    // Etak faqat "A" harfi uchun ajratilgan joyda qoladi — qo'shni harflarga tarqalmaydi
    const lh = floorHit(lay.aPx - lay.letterW / 2, floorPx); const rh = floorHit(lay.aPx + lay.letterW / 2, floorPx);
    const hw = lh && rh ? (rh.x - lh.x) / 2 : 0.6;
    // Etak kengligi admin paneldan (A harfi kengligining 55–95%)
    L.rA = Math.min(0.95, Math.max(0.22, hw * (0.55 + 0.4 * (C.width / 100))));
    L.aX = Math.max(L.rA * (1 + HEM_FLARE) + 0.01, Math.min(hw - 0.04, L.rA * 1.2));
    L.bF = L.rA * 1.45;
    L.bB = L.rA * 1.1;
    // Ko'ylak aylanganda etak yon tomonga — harflar ustiga chiqmasligi uchun aylana ichida qoladi
    if (o.animate) { L.bF = Math.min(L.bF, L.aX); L.bB = Math.min(L.bB, L.aX * 0.62); }
    // Ko'ylak egallagan ekran sohasi (sichqoncha bilan aylantirish uchun)
    const t = proj(0, TOPY, 0); const b = proj(0, FLOOR, 0);
    const half = Math.abs(proj(L.aX, FLOOR, 0)[0] - b[0]);
    box = { x0: b[0] - half, x1: b[0] + half, y0: t[1], y1: b[1] + 20 };
  }

  function setLayout(l) {
    lay = l;
    solve();
    rebuild();
    if (!layoutReady) { layoutReady = true; reveal(); }
  }

  function rebuild() { S = SIL[C.silhouette] || SIL.aline; updateDress(); updateParts(); needs = true; }

  const MAT_KEYS = ['fabric', 'color', 'lace', 'trim', 'finial', 'mannequin', 'sparkle', 'scallop'];
  let matSig = '';
  function setConfig(c) {
    C = normalizeGown(c);
    if (!spinning() && !dragging) { rotY = 0; vel = 0; root.rotation.y = 0; }
    const sig = MAT_KEYS.map((k) => C[k]).join('|');
    if (sig !== matSig) applyMaterials();
    solve();
    rebuild();
  }

  // ----- Animatsiya: 3D aylanish -----
  // Avtomatik aylanadi; sichqoncha yoki barmoq bilan ko'ylakni ushlab aylantirish mumkin.
  let rotY = 0; let vel = 0; let dragging = false; let dragX = 0; let lastDragT = 0; let resumeAt = 0;
  const period = () => 30 - 24 * (C.speed / 100); // bir marta to'liq aylanish (soniya)
  const inBox = (e) => {
    if (!box) return false;
    const r = container.getBoundingClientRect();
    const x = e.clientX - r.left; const y = e.clientY - r.top;
    return x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1;
  };
  const host = container.closest('.hero') || container.parentElement || container;
  const onDown = (e) => {
    if (!o.animate || e.button > 0 || !inBox(e) || e.target.closest('a, button, input, select, textarea')) return;
    dragging = true; dragX = e.clientX; lastDragT = performance.now(); vel = 0;
    host.classList.add('is-spinning');
  };
  const onMove = (e) => {
    if (dragging) {
      const now = performance.now();
      const d = (e.clientX - dragX) * 0.011;
      dragX = e.clientX;
      rotY += d; root.rotation.y = rotY; needs = true;
      vel = d / Math.max(0.008, (now - lastDragT) / 1000);
      lastDragT = now;
    } else if (e.pointerType === 'mouse') {
      const can = o.animate && inBox(e);
      if (can !== host.classList.contains('can-spin')) {
        host.classList.toggle('can-spin', can);
        document.documentElement.classList.toggle('cursor-spin', can);
      }
    }
  };
  const onUp = () => {
    if (!dragging) return;
    dragging = false; resumeAt = performance.now() + 1200;
    host.classList.remove('is-spinning');
  };
  host.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);

  let raf = 0; let visible = true; let needs = true; let last = performance.now();
  // Kuchsiz qurilmalarda piksel zichligi avtomatik kamaytiriladi
  let slowFrames = 0; let fastFrames = 0; let dpr = renderer.getPixelRatio();
  function adapt(dt) {
    if (dt > 0.034) { slowFrames++; fastFrames = 0; } else { fastFrames++; if (fastFrames > 240) slowFrames = 0; }
    if (slowFrames > 45 && dpr > 1) {
      dpr = Math.max(1, dpr - 0.35); slowFrames = 0;
      renderer.setPixelRatio(dpr); renderer.setSize(W, H, false);
    }
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!visible || document.hidden || !compiled) return;
    let dirty = needs;
    if (spinning() && !dragging) {
      const auto = (Math.PI * 2) / period();
      // Qo'yib yuborilgandan keyin inersiya bilan sekinlashib, yana o'z tezligiga qaytadi
      vel *= Math.pow(0.04, dt);
      const w = now < resumeAt ? vel : vel + auto * Math.min(1, (now - resumeAt) / 1500 + (Math.abs(vel) < 0.05 ? 1 : 0));
      rotY += w * dt; root.rotation.y = rotY; dirty = true;
    } else if (!spinning() && !dragging && rotY !== 0) {
      // Aylanish o'chirilgan bo'lsa, qo'yib yuborilgach ko'ylak asta-sekin oldi tomoniga qaytadi
      vel *= Math.pow(0.04, dt); rotY += vel * dt;
      if (now > resumeAt) {
        const target = Math.round(rotY / (Math.PI * 2)) * Math.PI * 2;
        rotY += (target - rotY) * Math.min(1, dt * 2.5);
        if (Math.abs(target - rotY) < 1e-3 && Math.abs(vel) < 0.01) { rotY = 0; vel = 0; }
      }
      root.rotation.y = rotY; dirty = true;
    }
    if (points.visible && o.animate) {
      const pa = points.geometry.attributes.position;
      for (let i = 0; i < NP; i++) { let y = pa.getY(i) + dt * pseed[i]; if (y > 1.2) y = -1; pa.setY(i, y); }
      pa.needsUpdate = true; points.rotation.y -= dt * 0.04; dirty = true;
    }
    if (dirty) {
      renderer.render(scene, camera); needs = false;
      if (spinning()) adapt(dt);
    }
  }

  const io = 'IntersectionObserver' in window ? new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0.01 }) : null;
  io && io.observe(container);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => { solve(); rebuild(); }) : null;
  ro ? ro.observe(container) : window.addEventListener('resize', () => { solve(); rebuild(); });

  solve();
  setTokens(tokens);
  applyMaterials();
  rebuild();
  // Sheyderlar fon rejimida kompilyatsiya qilinadi — sahifa qotib qolmaydi
  let compiled = false;
  function reveal() {
    if (!compiled || !layoutReady || cnv.classList.contains('is-ready')) return;
    renderer.render(scene, camera); needs = false;
    // Birinchi kadr tayyor bo'lgach ko'ylak yumshoq paydo bo'ladi
    requestAnimationFrame(() => cnv.classList.add('is-ready'));
  }
  const done = () => { compiled = true; needs = true; reveal(); };
  if (renderer.compileAsync && renderer.extensions.has('KHR_parallel_shader_compile')) renderer.compileAsync(scene, camera).then(done, done); else done();
  raf = requestAnimationFrame(frame);
  container.classList.add('has-3d', 'is-gown');

  return {
    canvas: cnv,
    setLayout,
    setConfig,
    setTokens,
    getConfig: () => ({ ...C }),
    dispose() {
      cancelAnimationFrame(raf);
      io && io.disconnect(); ro && ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      host.removeEventListener('pointerdown', onDown);
      host.classList.remove('can-spin', 'is-spinning');
      document.documentElement.classList.remove('cursor-spin');
      texs.forEach((t) => t.dispose());
      disposables.forEach((d) => d.dispose && d.dispose());
      envRT.dispose(); pmrem.dispose(); renderer.dispose();
      cnv.remove();
      container.classList.remove('has-3d', 'is-gown');
    },
  };
}
