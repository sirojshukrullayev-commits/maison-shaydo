// Rasm muharriri: asl rasm, fonni olib tashlash (AI yoki oddiy usul), fon rangi, 3D manekenga joylash
import { esc, icon, toast } from '../utils.js';
import { CDN } from '../config.js';
import { getTokens } from '../theme.js';
import { loadImage } from './sb.js';
import { h } from './ui.js';

const MAX_WORK = 1600;
const MAN_W = 1200;
const MAN_H = 1500;

function toCanvas(img, max = MAX_WORK) {
  const w = img.naturalWidth || img.width; const hh = img.naturalHeight || img.height;
  const s = Math.min(1, max / Math.max(w, hh));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(hh * s));
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c;
}

function canvasToBlob(c, type = 'image/png', q = 0.92) {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Rasmni saqlab bo‘lmadi'))), type, q));
}

// Shaffof bo'lmagan qism chegarasigacha qirqish
function cropToContent(c, pad = 0.004) {
  const ctx = c.getContext('2d');
  const { width: W, height: H } = c;
  const d = ctx.getImageData(0, 0, W, H).data;
  let x0 = W; let y0 = H; let x1 = -1; let y1 = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (d[(y * W + x) * 4 + 3] > 12) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
  }
  if (x1 < 0) return c;
  const p = Math.round(Math.max(x1 - x0, y1 - y0) * pad);
  x0 = Math.max(0, x0 - p); y0 = Math.max(0, y0 - p); x1 = Math.min(W - 1, x1 + p); y1 = Math.min(H - 1, y1 + p);
  const out = document.createElement('canvas');
  out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
  out.getContext('2d').drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

// Oddiy usul: chetlardan boshlab fon rangiga yaqin piksellarni o'chirish
function simpleRemove(base, tol) {
  const W = base.width; const H = base.height;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.drawImage(base, 0, 0);
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  const sample = (sx, sy) => {
    let r = 0; let g = 0; let b = 0; let n = 0;
    for (let y = sy; y < Math.min(H, sy + 6); y++) for (let x = sx; x < Math.min(W, sx + 6); x++) { const i = (y * W + x) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
    return [r / n, g / n, b / n];
  };
  const seeds = [sample(0, 0), sample(Math.max(0, W - 6), 0), sample(0, Math.max(0, H - 6)), sample(Math.max(0, W - 6), Math.max(0, H - 6)), sample(Math.floor(W / 2), 0)];
  const t2 = tol * tol;
  const isBg = (i) => {
    const r = d[i]; const g = d[i + 1]; const b = d[i + 2];
    for (const s of seeds) { const dr = r - s[0]; const dg = g - s[1]; const db = b - s[2]; if (dr * dr + dg * dg + db * db < t2) return true; }
    return false;
  };
  const mask = new Uint8Array(W * H);
  const queue = new Int32Array(W * H);
  let qh = 0; let qt = 0;
  const push = (p) => { if (!mask[p] && isBg(p * 4)) { mask[p] = 1; queue[qt++] = p; } };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (qh < qt) {
    const p = queue[qh++]; const x = p % W; const y = (p - x) / W;
    if (x > 0) push(p - 1); if (x < W - 1) push(p + 1); if (y > 0) push(p - W); if (y < H - 1) push(p + W);
  }
  // Qirralarni yumshatish (3x3 o'rtacha)
  const alpha = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) alpha[p] = mask[p] ? 0 : 255;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const p = y * W + x;
      let s = 0;
      for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) s += alpha[p + yy * W + xx];
      d[p * 4 + 3] = Math.round(s / 9);
    }
  }
  for (let x = 0; x < W; x++) { d[x * 4 + 3] = alpha[x]; d[((H - 1) * W + x) * 4 + 3] = alpha[(H - 1) * W + x]; }
  ctx.putImageData(img, 0, 0);
  return cropToContent(c);
}

async function loadBgLib() {
  let lastErr = null;
  for (const url of CDN.bgRemoval) {
    try { return await import(url); } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('Kutubxona yuklanmadi');
}

// 2D zaxira maneken (3D ishlamasa)
function drawFallbackMannequin(ctx, W, H, color) {
  const col = { linen: '#e6d8c3', black: '#2a2624', white: '#f2efea' }[color] || '#e6d8c3';
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.beginPath(); ctx.ellipse(W / 2, H * 0.94, W * 0.17, H * 0.018, 0, 0, Math.PI * 2); ctx.fill();
  const pole = ctx.createLinearGradient(W / 2 - 8, 0, W / 2 + 8, 0);
  pole.addColorStop(0, '#6e5a46'); pole.addColorStop(0.5, '#d9c2a0'); pole.addColorStop(1, '#5b4938');
  ctx.fillStyle = pole; ctx.fillRect(W / 2 - 8, H * 0.5, 16, H * 0.43);
  ctx.fillStyle = '#b08d57';
  ctx.beginPath(); ctx.ellipse(W / 2, H * 0.935, W * 0.15, H * 0.012, 0, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createLinearGradient(W * 0.3, 0, W * 0.7, 0);
  g.addColorStop(0, '#000'); g.addColorStop(0.08, col); g.addColorStop(0.5, col); g.addColorStop(0.92, col); g.addColorStop(1, '#000');
  ctx.fillStyle = g;
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(W * 0.46, H * 0.14); ctx.lineTo(W * 0.54, H * 0.14); ctx.lineTo(W * 0.545, H * 0.165);
  ctx.bezierCurveTo(W * 0.62, H * 0.17, W * 0.67, H * 0.18, W * 0.665, H * 0.22);
  ctx.bezierCurveTo(W * 0.66, H * 0.28, W * 0.64, H * 0.3, W * 0.62, H * 0.34);
  ctx.bezierCurveTo(W * 0.6, H * 0.38, W * 0.65, H * 0.44, W * 0.645, H * 0.5);
  ctx.lineTo(W * 0.355, H * 0.5);
  ctx.bezierCurveTo(W * 0.35, H * 0.44, W * 0.4, H * 0.38, W * 0.38, H * 0.34);
  ctx.bezierCurveTo(W * 0.36, H * 0.3, W * 0.34, H * 0.28, W * 0.335, H * 0.22);
  ctx.bezierCurveTo(W * 0.33, H * 0.18, W * 0.38, H * 0.17, W * 0.455, H * 0.165);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3b2a1f';
  ctx.fillRect(W * 0.455, H * 0.125, W * 0.09, H * 0.02);
  ctx.restore();
}

export async function openEditor(src, { title = 'Rasm', defaultMode = 'nobg' } = {}) {
  let srcBlob = null; let img;
  try {
    if (src instanceof Blob) { srcBlob = src; img = await loadImage(URL.createObjectURL(src)); }
    else img = await loadImage(src);
  } catch (e) {
    toast('Rasmni muharrirga yuklab bo‘lmadi', 'error');
    return null;
  }
  const base = toCanvas(img);
  const tokens = getTokens();
  const st = {
    mode: defaultMode, cutout: null, changed: false,
    bg: { type: 'color', c1: '#ffffff', c2: tokens.colors.surface || '#f2ece4', grad: false },
    shadow: true, tol: 40,
    man: { color: tokens.mannequin || 'linen', rot: 0, img: null, inst: null, holder: null, failed: false },
    g: { x: 0.5, top: 0.165, s: 0.44, r: 0 },
  };

  return new Promise((resolve) => {
    const ov = h('div', { class: 'amodal ed-modal' });
    const swatches = ['transparent', '#ffffff', '#f5f1ea', tokens.colors.surface, tokens.colors.heroBg, tokens.colors.heroBg2, tokens.colors.accent, tokens.colors.primary, '#111111']
      .filter((v, i, a) => v && a.indexOf(v) === i);
    ov.innerHTML = `<div class="ed">
      <div class="ed-stage"><canvas class="ed-canvas"></canvas>
        <div class="ed-busy" hidden><div class="spinner"></div><p class="ed-busy-text"></p><div class="ed-progress"><i></i></div></div>
        <p class="ed-drag-hint" hidden>${icon('layers')} Kiyimni sichqoncha yoki barmoq bilan suring</p>
      </div>
      <aside class="ed-panel">
        <div class="ed-head"><h3>${esc(title)}</h3><button type="button" class="icon-btn" data-act="close" aria-label="Yopish">${icon('close')}</button></div>
        <div class="ed-tabs">
          <button type="button" data-mode="original">${icon('image')}Asl rasm</button>
          <button type="button" data-mode="nobg">${icon('wand')}Fonsiz</button>
          <button type="button" data-mode="mannequin">${icon('dress')}Maneken</button>
        </div>
        <div class="ed-body">
          <div class="ed-sec" data-show="original"><p class="muted">Rasm o‘zgarishsiz saqlanadi.</p></div>
          <div class="ed-sec" data-show="nobg mannequin">
            <h4>1. Fonni olib tashlash</h4>
            <div class="ed-row">
              <button type="button" class="abtn abtn--sm" data-act="ai">${icon('sparkle')}Avtomatik (AI)</button>
              <button type="button" class="abtn abtn--sm abtn--ghost" data-act="simple">${icon('wand')}Oddiy usul</button>
            </div>
            <label class="ed-range">Oddiy usul sezgirligi <input type="range" min="8" max="140" value="40" data-k="tol"><output>40</output></label>
            <p class="f-help">AI usuli birinchi marta modelni yuklab oladi (bir necha daqiqa). Oddiy usul bir xil rangli fon (oq devor, mato) uchun tez ishlaydi.</p>
            <p class="ed-state"></p>
          </div>
          <div class="ed-sec" data-show="mannequin">
            <h4>2. Maneken</h4>
            <div class="ed-row ed-seg" data-k="mancolor">
              <button type="button" data-v="linen">Zig‘ir</button><button type="button" data-v="white">Oq</button><button type="button" data-v="black">Qora</button>
            </div>
            <label class="ed-range">Maneken burchagi <input type="range" min="-40" max="40" value="0" data-k="manrot"><output>0°</output></label>
            <h4>3. Kiyim joylashuvi</h4>
            <label class="ed-range">O‘lcham <input type="range" min="15" max="110" value="44" data-k="gs"><output>44%</output></label>
            <label class="ed-range">Burish <input type="range" min="-30" max="30" value="0" data-k="gr"><output>0°</output></label>
            <label class="ed-range">Balandlik <input type="range" min="0" max="60" value="16" data-k="gt"><output>16%</output></label>
            <button type="button" class="abtn abtn--sm abtn--ghost" data-act="center">${icon('refresh')}Markazga qaytarish</button>
          </div>
          <div class="ed-sec" data-show="nobg mannequin">
            <h4>Fon</h4>
            <div class="ed-swatches">${swatches.map((c) => `<button type="button" class="sw ${c === 'transparent' ? 'sw--clear' : ''}" data-c="${c}" style="${c === 'transparent' ? '' : `background:${c}`}" title="${c === 'transparent' ? 'Shaffof' : c}"></button>`).join('')}
              <label class="sw sw--pick" title="Istalgan rang">${icon('palette')}<input type="color" data-k="c1" value="#ffffff"></label></div>
            <label class="switch"><input type="checkbox" data-k="grad"><span class="switch-ui"></span><span class="switch-text">Gradient</span></label>
            <label class="ed-color2" hidden>Ikkinchi rang <input type="color" data-k="c2" value="${esc(st.bg.c2)}"></label>
            <label class="switch"><input type="checkbox" data-k="shadow" checked><span class="switch-ui"></span><span class="switch-text">Yumshoq soya</span></label>
          </div>
        </div>
        <div class="ed-foot"><button type="button" class="abtn abtn--ghost" data-act="close">Bekor qilish</button><button type="button" class="abtn" data-act="save">${icon('check')}Saqlash</button></div>
      </aside></div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('is-open'));
    const $ = (s) => ov.querySelector(s);
    const $$ = (s) => Array.from(ov.querySelectorAll(s));
    const view = $('.ed-canvas');
    const stage = $('.ed-stage');
    const busyEl = $('.ed-busy');

    const busy = (text, p) => {
      if (text === false) { busyEl.hidden = true; return; }
      busyEl.hidden = false;
      $('.ed-busy-text').textContent = text;
      $('.ed-progress i').style.width = `${Math.round((p || 0) * 100)}%`;
      $('.ed-progress').hidden = p == null;
    };

    const fillBg = (ctx, W, H) => {
      if (st.bg.type === 'transparent') return;
      if (st.bg.grad) {
        const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
        g.addColorStop(0, st.bg.c1); g.addColorStop(1, st.bg.c2);
        ctx.fillStyle = g;
      } else ctx.fillStyle = st.bg.c1;
      ctx.fillRect(0, 0, W, H);
    };
    const softShadow = (ctx, cx, cy, rx, ry) => {
      if (!st.shadow) return;
      ctx.save();
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
      g.addColorStop(0, 'rgba(0,0,0,.28)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.translate(cx, cy); ctx.scale(1, ry / rx); ctx.translate(-cx, -cy);
      ctx.beginPath(); ctx.arc(cx, cy, rx, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    function compose() {
      const c = document.createElement('canvas');
      if (st.mode === 'original' || !st.cutout) {
        c.width = base.width; c.height = base.height;
        c.getContext('2d').drawImage(base, 0, 0);
        return c;
      }
      const ctx = c.getContext('2d');
      if (st.mode === 'nobg') {
        const cut = st.cutout;
        const pad = Math.round(Math.max(cut.width, cut.height) * 0.08);
        c.width = cut.width + pad * 2; c.height = cut.height + pad * 2;
        fillBg(ctx, c.width, c.height);
        softShadow(ctx, c.width / 2, pad + cut.height - cut.height * 0.01, cut.width * 0.42, cut.height * 0.035);
        ctx.drawImage(cut, pad, pad);
        return c;
      }
      // maneken
      c.width = MAN_W; c.height = MAN_H;
      fillBg(ctx, MAN_W, MAN_H);
      if (st.man.img) ctx.drawImage(st.man.img, 0, 0, MAN_W, MAN_H);
      else drawFallbackMannequin(ctx, MAN_W, MAN_H, st.man.color);
      const cut = st.cutout;
      const gw = st.g.s * MAN_W; const gh = gw * (cut.height / cut.width);
      const cx = st.g.x * MAN_W; const cy = st.g.top * MAN_H + gh / 2;
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(st.g.r * Math.PI / 180);
      ctx.shadowColor = st.shadow ? 'rgba(0,0,0,.25)' : 'transparent';
      ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
      ctx.drawImage(cut, -gw / 2, -gh / 2, gw, gh);
      ctx.restore();
      return c;
    }

    function render() {
      const out = compose();
      view.width = out.width; view.height = out.height;
      view.getContext('2d').drawImage(out, 0, 0);
      const r = stage.getBoundingClientRect();
      const s = Math.min((r.width - 40) / out.width, (r.height - 40) / out.height);
      view.style.width = `${Math.max(50, out.width * s)}px`;
      view.style.height = `${Math.max(50, out.height * s)}px`;
      $('.ed-state').textContent = st.cutout ? '✓ Fon olib tashlangan' : 'Fon hali olib tashlanmagan';
      $('.ed-drag-hint').hidden = !(st.mode === 'mannequin' && st.cutout);
    }

    async function refreshMannequin() {
      if (st.man.failed) { st.man.img = null; render(); return; }
      busy('3D maneken tayyorlanmoqda…');
      try {
        if (!st.man.inst) {
          const mod = await import('../three/mannequin.js');
          if (!mod.webglAvailable()) throw new Error('webgl');
          st.man.holder = h('div', { class: 'ed-offscreen' });
          document.body.appendChild(st.man.holder);
          st.man.inst = mod.createMannequin(st.man.holder, {
            tokens: { ...tokens, mannequin: st.man.color }, dress: false, particles: false, animate: false,
            interactive: false, parallax: false, preserve: true, autoRotate: false, rotation: 0, fit: 0.92,
          });
        } else st.man.inst.setTokens({ ...tokens, mannequin: st.man.color });
        st.man.inst.setRotation(st.man.rot * Math.PI / 180);
        const url = st.man.inst.snapshot(MAN_W, MAN_H);
        st.man.img = await loadImage(url);
      } catch (e) {
        console.warn('3D maneken ishlamadi:', e);
        st.man.failed = true; st.man.img = null;
        toast('3D maneken yuklanmadi, oddiy maneken ishlatiladi', 'info', 3500);
      }
      busy(false);
      render();
    }

    function setMode(m) {
      st.mode = m;
      $$('.ed-tabs button').forEach((b) => b.classList.toggle('is-active', b.dataset.mode === m));
      $$('.ed-sec').forEach((s) => { s.hidden = !s.dataset.show.split(' ').includes(m); });
      if (m === 'mannequin' && !st.man.img && !st.man.failed) refreshMannequin();
      else render();
    }

    async function runAI() {
      busy('AI kutubxonasi yuklanmoqda…', 0);
      try {
        const mod = await loadBgLib();
        const fn = mod.removeBackground || mod.default;
        if (typeof fn !== 'function') throw new Error('removeBackground topilmadi');
        const blob = await canvasToBlob(base, 'image/png');
        const out = await fn(blob, {
          progress: (key, cur, total) => busy(`Model yuklanmoqda… ${total ? Math.round((cur / total) * 100) : 0}%`, total ? cur / total : 0),
          output: { format: 'image/png' },
          proxyToWorker: false,
        });
        busy('Ishlov berilmoqda…');
        const resImg = await loadImage(URL.createObjectURL(out));
        st.cutout = cropToContent(toCanvas(resImg));
        st.changed = true;
        toast('Fon olib tashlandi', 'success');
      } catch (e) {
        console.warn('AI fon olib tashlash ishlamadi:', e);
        toast('AI ishlamadi. “Oddiy usul” tugmasini sinab ko‘ring.', 'error', 4500);
      }
      busy(false);
      render();
    }

    function runSimple() {
      busy('Fon olib tashlanmoqda…');
      setTimeout(() => {
        try { st.cutout = simpleRemove(base, st.tol); st.changed = true; } catch (e) { toast('Xato: ' + e.message, 'error'); }
        busy(false);
        render();
      }, 30);
    }

    // Kiyimni sudrab joylashtirish
    let drag = null;
    view.addEventListener('pointerdown', (e) => {
      if (st.mode !== 'mannequin' || !st.cutout) return;
      view.setPointerCapture(e.pointerId);
      drag = { x: e.clientX, y: e.clientY, gx: st.g.x, gt: st.g.top };
    });
    view.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const r = view.getBoundingClientRect();
      st.g.x = Math.min(1, Math.max(0, drag.gx + (e.clientX - drag.x) / r.width));
      st.g.top = Math.min(0.9, Math.max(-0.2, drag.gt + (e.clientY - drag.y) / r.height));
      const gt = $('[data-k="gt"]');
      gt.value = Math.round(st.g.top * 100); gt.nextElementSibling.textContent = `${gt.value}%`;
      render();
    });
    const endDrag = () => { drag = null; };
    view.addEventListener('pointerup', endDrag);
    view.addEventListener('pointercancel', endDrag);

    const close = (val) => {
      ov.classList.remove('is-open');
      window.removeEventListener('resize', render);
      setTimeout(() => {
        ov.remove();
        if (st.man.inst) st.man.inst.dispose();
        if (st.man.holder) st.man.holder.remove();
      }, 250);
      resolve(val);
    };

    ov.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-act], [data-mode], [data-c], .ed-seg [data-v]');
      if (!b) return;
      if (b.dataset.mode) setMode(b.dataset.mode);
      else if (b.dataset.c) {
        if (b.dataset.c === 'transparent') st.bg.type = 'transparent';
        else { st.bg.type = 'color'; st.bg.c1 = b.dataset.c; }
        $$('.sw').forEach((x) => x.classList.toggle('is-active', x === b));
        render();
      } else if (b.dataset.v) {
        st.man.color = b.dataset.v;
        $$('.ed-seg [data-v]').forEach((x) => x.classList.toggle('is-active', x === b));
        refreshMannequin();
      } else if (b.dataset.act === 'close') close(null);
      else if (b.dataset.act === 'ai') runAI();
      else if (b.dataset.act === 'simple') runSimple();
      else if (b.dataset.act === 'center') {
        st.g = { x: 0.5, top: 0.165, s: 0.44, r: 0 };
        [['gs', 44, '%'], ['gr', 0, '°'], ['gt', 16, '%']].forEach(([k, v, u]) => { const i = $(`[data-k="${k}"]`); i.value = v; i.nextElementSibling.textContent = v + u; });
        render();
      } else if (b.dataset.act === 'save') {
        try {
          if (st.mode === 'original') {
            if (srcBlob) { close({ blob: srcBlob, mode: 'original', bgColor: null }); return; }
            close(null); return;
          }
          if (!st.cutout) { toast('Avval fonni olib tashlang (AI yoki oddiy usul)', 'error'); return; }
          const out = compose();
          const transparent = st.bg.type === 'transparent';
          const blob = await canvasToBlob(out, transparent ? 'image/png' : 'image/jpeg', 0.92);
          close({ blob, mode: st.mode, bgColor: transparent ? null : st.bg.c1 });
        } catch (err) { toast(err.message, 'error'); }
      }
    });
    ov.addEventListener('input', (e) => {
      const k = e.target.dataset.k;
      if (!k) return;
      const v = e.target.value;
      const out = e.target.nextElementSibling;
      if (k === 'tol') { st.tol = +v; out.textContent = v; return; }
      if (k === 'gs') { st.g.s = v / 100; out.textContent = `${v}%`; }
      if (k === 'gr') { st.g.r = +v; out.textContent = `${v}°`; }
      if (k === 'gt') { st.g.top = v / 100; out.textContent = `${v}%`; }
      if (k === 'manrot') { st.man.rot = +v; out.textContent = `${v}°`; }
      if (k === 'c1') { st.bg.type = 'color'; st.bg.c1 = v; $$('.sw').forEach((x) => x.classList.remove('is-active')); }
      if (k === 'c2') st.bg.c2 = v;
      if (k === 'grad') { st.bg.grad = e.target.checked; $('.ed-color2').hidden = !st.bg.grad; if (st.bg.type === 'transparent') st.bg.type = 'color'; }
      if (k === 'shadow') st.shadow = e.target.checked;
      render();
    });
    ov.addEventListener('change', (e) => { if (e.target.dataset.k === 'manrot') refreshMannequin(); });
    window.addEventListener('resize', render);

    $$(`.ed-seg [data-v="${st.man.color}"]`).forEach((x) => x.classList.add('is-active'));
    $$('.sw')[1]?.classList.add('is-active');
    setMode(st.mode);
  });
}
