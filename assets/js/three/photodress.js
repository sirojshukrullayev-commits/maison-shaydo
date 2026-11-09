// Haqiqiy ko'ylak fotosuratidan 3D: oldi (va orqa) rasmdagi siluet bo'yicha hajmli qobiq yasaladi,
// rasm uning ustiga o'raladi. Oldidan va orqasidan qaralganda — aynan fotosuratdagi ko'ylak.
// Bosh sahifada "A" harfi o'rnida (mode: 'slot') yoki loyiha sahifasidagi oynada (mode: 'fit') ishlaydi.
import * as THREE from 'three';
import { webglAvailable, radialCanvas } from './mannequin.js';
import { normalizeGown } from '../gown-config.js';

export { webglAvailable };

const ROWS = 180; // balandlik bo'yicha qatorlar
const SEG = 56; // har bir yarim aylana bo'laklari
const DEPTH = 0.62; // chuqurlik / kenglik nisbati
const PAD = 1.0; // qobiq aynan siluet chegarasida — chetlar rasm bilan uzluksiz

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Rasm yuklanmadi'));
    img.src = src;
  });
}

// Rasmdagi ko'ylak siluetini o'lchash: har bir qatorda chap va o'ng chegara
function analyze(img) {
  const maxH = 900;
  const k = Math.min(1, maxH / img.naturalHeight);
  const w = Math.max(1, Math.round(img.naturalWidth * k)); const h = Math.max(1, Math.round(img.naturalHeight * k));
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, w, h);
  const data = g.getImageData(0, 0, w, h).data;
  const TH = 40;
  // Butun ko'ylak chegarasi
  let top = -1; let bottom = -1; let minX = w; let maxX = -1;
  const rowL = new Int32Array(h).fill(-1); const rowR = new Int32Array(h).fill(-1);
  let opaque = 0;
  for (let y = 0; y < h; y++) {
    let l = -1; let r = -1;
    const base = y * w * 4;
    for (let x = 0; x < w; x++) if (data[base + x * 4 + 3] > TH) { l = x; break; }
    if (l >= 0) for (let x = w - 1; x >= l; x--) if (data[base + x * 4 + 3] > TH) { r = x; break; }
    if (l >= 0) {
      rowL[y] = l; rowR[y] = r;
      if (top < 0) top = y; bottom = y;
      if (l < minX) minX = l; if (r > maxX) maxX = r;
      opaque++;
    }
  }
  if (top < 0 || bottom - top < 20) throw new Error('Rasmda ko‘ylak topilmadi (fon shaffof bo‘lishi kerak)');
  // Fon olib tashlanmagan bo'lsa (deyarli hamma joy to'liq) — ogohlantirish
  const fullRows = opaque / h;
  const solid = rowL[Math.round((top + bottom) / 2)] === 0 && rowR[Math.round((top + bottom) / 2)] === w - 1 && fullRows > 0.98;
  if (solid) throw new Error('Rasm foni olib tashlanmagan');
  // Qatorlar bo'yicha markaz va yarim kenglik (rasm piksellarida, asl o'lchamga qaytariladi)
  const rows = [];
  const hh = bottom - top;
  let lastC = (rowL[top] + rowR[top]) / 2;
  for (let i = 0; i <= ROWS; i++) {
    const t = i / ROWS;
    const y0 = Math.round(top + t * hh);
    // Qo'shni bir necha qatorning eng kengi (ingichka bo'shliqlarda uzilmasin)
    let l = Infinity; let r = -Infinity;
    for (let d = -2; d <= 2; d++) {
      const yy = Math.min(bottom, Math.max(top, y0 + d));
      if (rowL[yy] >= 0) { l = Math.min(l, rowL[yy]); r = Math.max(r, rowR[yy]); }
    }
    if (!Number.isFinite(l)) { rows.push({ c: lastC, hw: 0 }); continue; }
    const c = (l + r) / 2; lastC = c;
    rows.push({ c: c / k, hw: ((r - l) / 2 + 1.5) / k });
  }
  // Juda keskin o'zgarishlarni silliqlash
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 1; i < rows.length - 1; i++) {
      rows[i].hw = Math.max(rows[i].hw, (rows[i - 1].hw + rows[i + 1].hw) / 2 * 0.98);
    }
  }
  // Aylanish o'qi: pastki yarmining o'rtacha markazi (etak va bel)
  let axis = 0; let n = 0;
  for (let i = Math.round(ROWS * 0.25); i <= ROWS; i++) if (rows[i].hw > 0) { axis += rows[i].c; n++; }
  axis = n ? axis / n : (minX + maxX) / 2 / k;
  return {
    img, W: img.naturalWidth, H: img.naturalHeight, top: top / k, bottom: bottom / k,
    minX: minX / k, maxX: maxX / k, rows, axis,
  };
}

function shadeMaterial(tex, dark) {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: tex }, uDark: { value: dark } },
    vertexShader: `varying vec2 vUv; varying float vFace;
      void main() {
        vUv = uv;
        vec3 n = normalize(normalMatrix * normal);
        vFace = n.z;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `uniform sampler2D map; uniform float uDark; varying vec2 vUv; varying float vFace;
      void main() {
        vec4 c = texture2D(map, vUv);
        if (c.a < 0.45) discard;
        // Kameraga qaragan joy rasmdagidek, yon tomonlar tabiiy ravishda qorong'ilashadi
        float s = mix(uDark, 1.0, pow(clamp(vFace, 0.0, 1.0), 0.75));
        gl_FragColor = vec4(c.rgb * s, 1.0);
        #include <colorspace_fragment>
      }`,
    side: THREE.FrontSide,
  });
}

export function createPhotoDress(container, opts = {}) {
  const o = { animate: true, quality: 'high', config: null, front: '', back: '', mode: 'slot', ...opts };
  if (!webglAvailable()) throw new Error('WebGL mavjud emas');
  let C = normalizeGown(o.config);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, o.quality === 'low' ? 2 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  const cnv = renderer.domElement;
  cnv.className = 'mannequin-canvas gown-canvas photo-dress-canvas';
  container.appendChild(cnv);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -5000, 5000);
  camera.position.set(0, 0, 1000);
  const root = new THREE.Group();
  const model = new THREE.Group();
  root.add(model);
  scene.add(root);
  const disposables = [];
  const track = (x) => { disposables.push(x); return x; };

  // Pastdagi yumshoq soya (kameraga qaragan yassi oval)
  const shadowTex = track(new THREE.CanvasTexture(radialCanvas('rgba(0,0,0,0.75)', 'rgba(0,0,0,0)')));
  const shadow = new THREE.Mesh(track(new THREE.PlaneGeometry(1, 1)), track(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.5 })));
  shadow.renderOrder = -1;
  scene.add(shadow);

  let info = null; // { objW, objH, meshes }
  let W = 1; let H = 1; let lay = null; let box = null;

  function buildMesh(front, back) {
    model.clear();
    const texF = track(new THREE.Texture(front.img)); texF.colorSpace = THREE.SRGBColorSpace; texF.anisotropy = renderer.capabilities.getMaxAnisotropy(); texF.needsUpdate = true;
    let texB = texF;
    if (back) { texB = track(new THREE.Texture(back.img)); texB.colorSpace = THREE.SRGBColorSpace; texB.anisotropy = texF.anisotropy; texB.needsUpdate = true; }
    const H0 = front.bottom - front.top;
    // Dunyo birligi = old rasm pikseli; pastki nuqta y=0, o'q x=0
    const half = (isBack) => {
      const nU = SEG + 1; const nV = ROWS + 1;
      const pos = new Float32Array(nU * nV * 3); const uv = new Float32Array(nU * nV * 2);
      for (let j = 0; j < nV; j++) {
        const t = j / ROWS;
        const rf = front.rows[j];
        const cx = rf.c - front.axis; const hw = rf.hw * PAD;
        const d = Math.max(rf.hw, 1) * DEPTH;
        const y = (1 - t) * H0;
        let rb = null;
        if (back) rb = back.rows[Math.min(ROWS, Math.max(0, Math.round(t * ROWS)))];
        for (let i = 0; i < nU; i++) {
          const a = isBack ? Math.PI / 2 + (i / SEG) * Math.PI : -Math.PI / 2 + (i / SEG) * Math.PI;
          const s = Math.sin(a); const cz = Math.cos(a);
          const k = j * nU + i;
          pos[k * 3] = cx + hw * s; pos[k * 3 + 1] = y; pos[k * 3 + 2] = d * cz;
          let px; let py;
          if (isBack && back) {
            // Orqa rasmda chap-o'ng teskari
            px = rb.c - s * rb.hw * PAD; py = back.top + t * (back.bottom - back.top);
            uv[k * 2] = px / back.W; uv[k * 2 + 1] = 1 - py / back.H;
          } else {
            px = rf.c + s * rf.hw * PAD; py = front.top + t * H0;
            uv[k * 2] = px / front.W; uv[k * 2 + 1] = 1 - py / front.H;
          }
        }
      }
      const idx = [];
      for (let j = 0; j < ROWS; j++) for (let i = 0; i < SEG; i++) {
        const a = j * nU + i; const b = a + 1; const c = a + nU; const dd = c + 1;
        // Tashqi tomonga qaragan uchburchaklar
        idx.push(a, b, c, b, dd, c);
      }
      const g = track(new THREE.BufferGeometry());
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    };
    const darkness = 0.6;
    const mF = new THREE.Mesh(half(false), track(shadeMaterial(texF, darkness)));
    const mB = new THREE.Mesh(half(true), track(shadeMaterial(texB, back ? darkness : darkness * 0.92)));
    // Uchburchak yo'nalishini tekshirish: oldingi yarmi kameraga qarab turishi kerak
    for (const m of [mF, mB]) {
      const n = m.geometry.attributes.normal; const p = m.geometry.attributes.position;
      const mid = (Math.round(ROWS * 0.7) * (SEG + 1) + (SEG >> 1));
      const outward = p.getZ(mid) * n.getZ(mid) + p.getX(mid) * n.getX(mid);
      if (outward < 0) {
        const ix = m.geometry.index.array;
        for (let q = 0; q < ix.length; q += 3) { const tmp = ix[q + 1]; ix[q + 1] = ix[q + 2]; ix[q + 2] = tmp; }
        m.geometry.index.needsUpdate = true;
        m.geometry.computeVertexNormals();
      }
    }
    mF.frustumCulled = false; mB.frustumCulled = false;
    model.add(mF, mB);
    let maxHw = 0; for (const r of front.rows) maxHw = Math.max(maxHw, Math.abs(r.c - front.axis) + r.hw);
    info = { objW: maxHw * 2, objH: H0, hem: front.rows[ROWS].hw * 2 || maxHw * 2 };
  }

  function solve() {
    const r = container.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    renderer.setSize(W, H, false);
    cnv.style.width = '100%'; cnv.style.height = '100%';
    camera.left = -W / 2; camera.right = W / 2; camera.top = H / 2; camera.bottom = -H / 2;
    camera.updateProjectionMatrix();
    if (!info) return;
    let s; let cx; let bottomPx;
    if (o.mode === 'fit' || !lay) {
      s = Math.min((H * 0.86) / info.objH, (W * 0.84) / info.objW);
      cx = W / 2; bottomPx = H * 0.93;
    } else {
      // "A" harfi o'rnida: bo'yi admin sozlamasidan, eni harf joyidan oshmaydi
      const targetH = lay.capPx * (1.1 + 1.7 * (C.size / 100));
      const maxW = lay.letterW * (0.72 + 0.3 * (C.width / 100));
      s = Math.min(targetH / info.objH, maxW / info.objW);
      bottomPx = lay.baselinePx + lay.capPx * 0.03;
      const minTop = lay.minTop || 90;
      if (bottomPx - info.objH * s < minTop) s = Math.max(0.05, (bottomPx - minTop) / info.objH);
      cx = lay.aPx;
    }
    root.scale.setScalar(s);
    root.position.set(cx - W / 2, H / 2 - bottomPx, 0);
    shadow.scale.set(info.hem * s * 1.25, Math.max(10, info.hem * s * 0.12), 1);
    shadow.position.set(cx - W / 2, H / 2 - bottomPx + 2, -500);
    const half = (info.objW * s) / 2;
    box = { x0: cx - half, x1: cx + half, y0: bottomPx - info.objH * s, y1: bottomPx + 10 };
    needs = true;
  }

  function setLayout(l) { lay = l; solve(); reveal(); }
  function setConfig(c) { C = normalizeGown(c); if (!spinning()) clock = 0; solve(); }

  // ----- Harakat -----
  // Fotosuratdan yasalgan ko'ylak yon tomondan taxminiy ko'rinadi, shuning uchun u oldi tomoni bilan
  // yengil chayqaladi; orqa rasm bo'lsa, vaqti-vaqti bilan tez burilib orqasini ham ko'rsatadi.
  const spinning = () => !!(o.animate && C.motion);
  let hasBack = false;
  let user = 0; let vel = 0; let dragging = false; let dragX = 0; let lastDragT = 0; let resumeAt = 0; let clock = 0;
  const smoothstep = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
  function autoAngle(t) {
    if (!spinning()) return 0;
    const sp = 0.35 + 1.3 * (C.speed / 100); // tezlik koeffitsienti
    const sway = 0.4 * Math.sin(t * 0.7 * sp);
    if (!hasBack) return sway;
    // Old (7 s) → burilish (1.4 s) → orqa (5 s) → burilish (1.4 s)
    const hold1 = 7 / sp; const tr = 1.4; const hold2 = 5 / sp;
    const cyc = hold1 + tr + hold2 + tr;
    const x = t % cyc;
    let base = 0;
    if (x < hold1) base = 0;
    else if (x < hold1 + tr) base = Math.PI * smoothstep((x - hold1) / tr);
    else if (x < hold1 + tr + hold2) base = Math.PI;
    else base = Math.PI + Math.PI * smoothstep((x - hold1 - tr - hold2) / tr);
    return base + sway * 0.8;
  }
  const inBox = (e) => {
    if (!box) return false;
    const r = container.getBoundingClientRect();
    const x = e.clientX - r.left; const y = e.clientY - r.top;
    return x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1;
  };
  const host = o.mode === 'fit' ? container : (container.closest('.hero') || container.parentElement || container);
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
      user += d; needs = true;
      vel = d / Math.max(0.008, (now - lastDragT) / 1000);
      lastDragT = now;
    } else if (e.pointerType === 'mouse' && o.mode !== 'fit') {
      const can = o.animate && inBox(e);
      if (can !== host.classList.contains('can-spin')) {
        host.classList.toggle('can-spin', can);
        document.documentElement.classList.toggle('cursor-spin', can);
      }
    }
  };
  const onUp = () => {
    if (!dragging) return;
    dragging = false; resumeAt = performance.now() + 900;
    host.classList.remove('is-spinning');
  };
  host.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);

  let raf = 0; let visible = true; let needs = true; let last = performance.now(); let ready = false; let hold = null;
  function reveal() {
    if (!ready || cnv.classList.contains('is-ready')) return;
    renderer.render(scene, camera); needs = false;
    requestAnimationFrame(() => cnv.classList.add('is-ready'));
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!visible || document.hidden || !ready) return;
    let dirty = needs;
    if (hold !== null) {
      root.rotation.y = hold;
    } else {
      if (spinning()) { clock += dt; dirty = true; }
      if (!dragging) {
        // Qo'yib yuborilgach: inersiya, so'ng eng yaqin old/orqa holatga qaytadi
        vel *= Math.pow(0.03, dt); user += vel * dt;
        if (now > resumeAt) {
          const step = hasBack ? Math.PI : Math.PI * 2;
          const target = Math.round(user / step) * step;
          if (Math.abs(target - user) > 1e-4) { user += (target - user) * Math.min(1, dt * 3); dirty = true; } else user = target;
        }
        if (Math.abs(vel) > 1e-3) dirty = true;
      }
      const a = autoAngle(clock) + user;
      if (a !== root.rotation.y) { root.rotation.y = a; dirty = true; }
    }
    if (dirty) { renderer.render(scene, camera); needs = false; }
  }
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0.01 }) : null;
  io && io.observe(container);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => solve()) : null;
  ro ? ro.observe(container) : window.addEventListener('resize', solve);

  container.classList.add('has-3d', 'is-gown');
  solve();
  raf = requestAnimationFrame(frame);

  const loaded = (async () => {
    const [fi, bi] = await Promise.all([loadImage(o.front), o.back ? loadImage(o.back).catch(() => null) : Promise.resolve(null)]);
    const front = analyze(fi);
    let back = null;
    if (bi) { try { back = analyze(bi); } catch (e) { back = null; } }
    buildMesh(front, back);
    hasBack = !!back;
    ready = true;
    solve();
    if (lay || o.mode === 'fit') reveal();
  })();

  return {
    canvas: cnv,
    kind: 'photo',
    loaded,
    setLayout,
    setConfig,
    setTokens() {},
    getConfig: () => ({ ...C }),
    // Ma'lum burchakka burish (admin ko'rinishi va sinov uchun)
    setAngle(a) { hold = a; needs = true; },
    dispose() {
      cancelAnimationFrame(raf);
      io && io.disconnect(); ro && ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      host.removeEventListener('pointerdown', onDown);
      host.classList.remove('can-spin', 'is-spinning');
      document.documentElement.classList.remove('cursor-spin');
      disposables.forEach((d) => d.dispose && d.dispose());
      renderer.dispose();
      cnv.remove();
      container.classList.remove('has-3d', 'is-gown');
    },
  };
}
