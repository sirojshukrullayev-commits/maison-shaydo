// Rasmlarni to'liq ekranda ko'rish (lightbox)
import { esc, icon } from './utils.js';
import { t } from './i18n.js';

let box = null;
let items = [];
let index = 0;
let lastFocus = null;

function ensure() {
  if (box) return box;
  box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.hidden = true;
  box.innerHTML = `
    <button class="lb-close" type="button" aria-label="${esc(t('close'))}">${icon('close')}</button>
    <button class="lb-nav lb-prev" type="button" aria-label="${esc(t('prev'))}">${icon('arrowLeft')}</button>
    <figure class="lb-stage"><img alt=""><figcaption></figcaption></figure>
    <button class="lb-nav lb-next" type="button" aria-label="${esc(t('next'))}">${icon('arrowRight')}</button>
    <div class="lb-count"></div>`;
  document.body.appendChild(box);
  box.querySelector('.lb-close').addEventListener('click', close);
  box.querySelector('.lb-prev').addEventListener('click', () => go(-1));
  box.querySelector('.lb-next').addEventListener('click', () => go(1));
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
  const img = box.querySelector('img');
  img.addEventListener('click', () => box.classList.toggle('is-zoom'));
  let sx = null;
  box.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    sx = null;
  });
  document.addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  });
  return box;
}

function show() {
  const it = items[index];
  if (!it) return;
  const img = box.querySelector('img');
  box.classList.remove('is-zoom');
  img.classList.remove('is-in');
  img.onload = () => img.classList.add('is-in');
  img.src = it.src;
  img.alt = it.alt || '';
  box.querySelector('figcaption').textContent = it.caption || '';
  box.querySelector('.lb-count').textContent = items.length > 1 ? `${index + 1} / ${items.length}` : '';
  box.querySelectorAll('.lb-nav').forEach((b) => { b.hidden = items.length < 2; });
}

function go(d) {
  if (items.length < 2) return;
  index = (index + d + items.length) % items.length;
  show();
}

export function openLightbox(list, start = 0) {
  ensure();
  items = list;
  index = start;
  lastFocus = document.activeElement;
  box.hidden = false;
  document.documentElement.classList.add('lb-open');
  requestAnimationFrame(() => box.classList.add('is-open'));
  show();
  box.querySelector('.lb-close').focus();
}

export function close() {
  if (!box) return;
  box.classList.remove('is-open');
  document.documentElement.classList.remove('lb-open');
  // Yopilgandan keyin ko'rinmas qatlam sahifani to'sib qolmasligi uchun butunlay yashiriladi
  setTimeout(() => { if (!box.classList.contains('is-open')) box.hidden = true; }, 300);
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
