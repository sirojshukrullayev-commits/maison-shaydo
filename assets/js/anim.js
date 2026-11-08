// Animatsiyalar: paydo bo'lish, harflarga bo'lish, 3D egilish, magnit tugmalar, hisoblagichlar, parallaks, kursor
import { prefersReducedMotion, isTouch, clamp } from './utils.js';

let enabled = true;
let revealObserver = null;
let countObserver = null;
const parallaxEls = new Set();

export function animationsEnabled() { return enabled; }

export function setAnimations(on) {
  enabled = !!on && !prefersReducedMotion();
  document.documentElement.classList.toggle('no-anim', !enabled);
}

// Matnni so'z va harflarga bo'lish
export function splitText(root = document) {
  root.querySelectorAll('[data-split]:not([data-split-done])').forEach((el) => {
    const mode = el.dataset.split || 'words';
    const text = el.textContent;
    el.setAttribute('aria-label', text.trim());
    el.dataset.splitDone = '1';
    const words = text.trim().split(/\s+/);
    let i = 0;
    el.innerHTML = words.map((w) => {
      if (mode === 'chars') {
        const chars = Array.from(w).map((ch) => `<span class="ch" aria-hidden="true" style="--i:${i++}">${ch === '<' ? '&lt;' : ch === '&' ? '&amp;' : ch}</span>`).join('');
        return `<span class="w" aria-hidden="true">${chars}</span>`;
      }
      const safe = w.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      return `<span class="w" aria-hidden="true"><span class="wi" style="--i:${i++}">${safe}</span></span>`;
    }).join(' ');
  });
}

export function initReveal(root = document) {
  splitText(root);
  const els = root.querySelectorAll('[data-reveal]:not(.is-in), [data-split]:not(.is-in), [data-stagger]:not(.is-in)');
  // Stagger: ota element ichidagi bolalarga navbatma-navbat kechikish
  root.querySelectorAll('[data-stagger]').forEach((p) => {
    const step = parseFloat(p.dataset.stagger) || 0.08;
    Array.from(p.children).forEach((c, i) => c.style.setProperty('--d', `${(i * step).toFixed(2)}s`));
  });
  if (!enabled || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          revealObserver.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0 });
  }
  els.forEach((el) => revealObserver.observe(el));
}

// Raqamlarni sanash animatsiyasi
export function initCounters(root = document) {
  const els = root.querySelectorAll('[data-count]');
  const run = (el) => {
    const target = parseFloat(el.dataset.count) || 0;
    const suffix = el.dataset.suffix || '';
    if (!enabled) { el.textContent = target + suffix; return; }
    const dur = 1600;
    const t0 = performance.now();
    const step = (now) => {
      const p = clamp((now - t0) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
  if (!countObserver) {
    countObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { run(e.target); countObserver.unobserve(e.target); } });
    }, { threshold: 0.4 });
  }
  els.forEach((el) => countObserver.observe(el));
}

// Kartalarning 3D egilishi
export function initTilt(root = document) {
  if (!enabled || isTouch()) return;
  root.querySelectorAll('[data-tilt]:not([data-tilt-on])').forEach((el) => {
    el.dataset.tiltOn = '1';
    const max = parseFloat(el.dataset.tilt) || 8;
    let raf = 0;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--rx', `${(-y * max).toFixed(2)}deg`);
        el.style.setProperty('--ry', `${(x * max).toFixed(2)}deg`);
        el.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`);
        el.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`);
      });
      el.classList.add('is-tilting');
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
      el.classList.remove('is-tilting');
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
  });
}

// Kursorga ergashuvchi magnit tugmalar
export function initMagnetic(root = document) {
  if (!enabled || isTouch()) return;
  root.querySelectorAll('[data-magnetic]:not([data-mag-on])').forEach((el) => {
    el.dataset.magOn = '1';
    const s = parseFloat(el.dataset.magnetic) || 0.3;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * s}px, ${y * s}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

// Parallaks: data-parallax="0.15"
export function initParallax(root = document) {
  if (!enabled) return;
  root.querySelectorAll('[data-parallax]').forEach((el) => parallaxEls.add(el));
}

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const vh = window.innerHeight;
    parallaxEls.forEach((el) => {
      if (!el.isConnected) { parallaxEls.delete(el); return; }
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const speed = parseFloat(el.dataset.parallax) || 0.15;
      const center = r.top + r.height / 2 - vh / 2;
      el.style.setProperty('--py', `${(-center * speed).toFixed(1)}px`);
    });
    const bar = document.getElementById('scroll-progress');
    if (bar) {
      const h = document.documentElement.scrollHeight - vh;
      bar.style.transform = `scaleX(${h > 0 ? clamp(window.scrollY / h, 0, 1) : 0})`;
    }
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);

// Maxsus kursor
let cursorInit = false;
export function initCursor(on = true) {
  if (cursorInit || !on || !enabled || isTouch()) return;
  cursorInit = true;
  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.append(dot, ring);
  document.documentElement.classList.add('has-cursor');
  let mx = -100; let my = -100; let rx = -100; let ry = -100;
  window.addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px)`;
  }, { passive: true });
  const loop = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(loop);
  };
  loop();
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('a, button, [data-cursor], input, textarea, select, label');
    ring.classList.toggle('is-hover', !!t);
    const txt = e.target.closest('[data-cursor]');
    ring.dataset.label = txt ? txt.dataset.cursor : '';
  });
  document.addEventListener('pointerdown', () => ring.classList.add('is-down'));
  document.addEventListener('pointerup', () => ring.classList.remove('is-down'));
  document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { dot.style.opacity = ''; ring.style.opacity = ''; });
}

export function initAll(root = document) {
  initReveal(root);
  initCounters(root);
  initTilt(root);
  initMagnetic(root);
  initParallax(root);
  onScroll();
}
