// Umumiy yordamchi funksiyalar va ikonlar

export function esc(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

// Matndagi bo'sh qatorlarni paragraflarga aylantiradi
export function paragraphs(text) {
  return String(text ?? '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    .map((p) => `<p>${esc(p).replaceAll('\n', '<br>')}</p>`).join('');
}

export function $(sel, root = document) { return root.querySelector(sel); }
export function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

export function debounce(fn, ms = 200) {
  let id;
  return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); };
}

export function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

export function slugify(s) {
  const map = { 'ʻ': '', '‘': '', '’': '', "'": '', 'ғ': 'g', 'қ': 'q', 'ў': 'o', 'ҳ': 'h' };
  const cyr = 'а:a,б:b,в:v,г:g,д:d,е:e,ё:yo,ж:j,з:z,и:i,й:y,к:k,л:l,м:m,н:n,о:o,п:p,р:r,с:s,т:t,у:u,ф:f,х:x,ц:ts,ч:ch,ш:sh,щ:sh,ъ:,ы:i,ь:,э:e,ю:yu,я:ya';
  cyr.split(',').forEach((p) => { const [a, b] = p.split(':'); map[a] = b; });
  return String(s ?? '').toLowerCase().split('').map((ch) => (ch in map ? map[ch] : ch)).join('')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'loyiha';
}

// Faqat xavfsiz havolalarga ruxsat
export function safeUrl(u) {
  const s = String(u ?? '').trim();
  if (!s) return '';
  if (s.startsWith('/') && !s.startsWith('//')) return s;
  try {
    const url = new URL(s);
    if (url.protocol === 'https:' || url.protocol === 'http:' || url.protocol === 'mailto:' || url.protocol === 'tel:') return url.href;
  } catch (e) { /* noto'g'ri havola */ }
  return '';
}

export function socialUrl(kind, v) {
  const s = String(v ?? '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return safeUrl(s);
  const h = s.replace(/^@/, '');
  const base = { instagram: 'https://instagram.com/', telegram: 'https://t.me/', facebook: 'https://facebook.com/', youtube: 'https://youtube.com/@' }[kind];
  return base ? base + encodeURIComponent(h) : '';
}

export function telHref(p) { return 'tel:' + String(p ?? '').replace(/[^\d+]/g, ''); }

export function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

export function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isTouch() {
  return window.matchMedia && window.matchMedia('(hover: none)').matches;
}

export function toast(msg, type = 'info', ms = 2600) {
  let host = document.getElementById('toasts');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toasts';
    host.className = 'toasts';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = msg;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  setTimeout(() => { el.classList.remove('is-in'); setTimeout(() => el.remove(), 400); }, ms);
}

const P = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;

export const ICONS = {
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><g stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 2.5v19M2.5 12h19M5.3 5.3l13.4 13.4M18.7 5.3L5.3 18.7"/></g></svg>',
  arrowRight: P('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  arrowLeft: P('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  arrowUpRight: P('<path d="M7 17L17 7M8 7h9v9"/>'),
  close: P('<path d="M6 6l12 12M18 6L6 18"/>'),
  menu: P('<path d="M4 8h16M4 16h16"/>'),
  globe: P('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>'),
  chevronDown: P('<path d="M6 9l6 6 6-6"/>'),
  phone: P('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/>'),
  mail: P('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
  pin: P('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  clock: P('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  instagram: P('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/>'),
  telegram: P('<path d="M21 4L3 11l6 2.2M21 4l-3 16-6.5-5.3M21 4L9 13.2m0 0V19l2.5-4.3"/>'),
  facebook: P('<path d="M15 3h-2.5A3.5 3.5 0 009 6.5V9H7v3.5h2V21h3.5v-8.5H15l.5-3.5h-3V7a1 1 0 011-1H15z"/>'),
  youtube: P('<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10 9.5v5l4.5-2.5z"/>'),
  download: P('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  link: P('<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>'),
  search: P('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.3-4.3"/>'),
  cube: P('<path d="M12 2.8l8 4.6v9.2l-8 4.6-8-4.6V7.4z"/><path d="M4 7.4l8 4.6 8-4.6M12 12v9.2"/>'),
  share: P('<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4M8.2 13.2l7.6 4"/>'),
  scissors: P('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.6 7.6L20 18M8.6 16.4L20 6"/>'),
  needle: P('<path d="M19 3L6 16l-2 5 5-2L22 6a2.1 2.1 0 00-3-3z"/><path d="M16 6l2 2"/>'),
  award: P('<circle cx="12" cy="9" r="6"/><path d="M8.5 13.8L7 22l5-3 5 3-1.5-8.2"/>'),
  book: P('<path d="M4 4.5A1.5 1.5 0 015.5 3H20v15H5.5A1.5 1.5 0 004 19.5zM4 19.5A1.5 1.5 0 005.5 21H20"/><path d="M9 7h7"/>'),
  grid: P('<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>'),
  check: P('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  plus: P('<path d="M12 5v14M5 12h14"/>'),
  edit: P('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
  trash: P('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  eye: P('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
  eyeOff: P('<path d="M3 3l18 18M10.6 6.1A9.7 9.7 0 0112 6c6 0 9.5 6 9.5 6a17 17 0 01-3 3.7M6.3 6.8A16 16 0 002.5 12S6 18 12 18a9.4 9.4 0 004.2-1"/><path d="M9.9 10a3 3 0 004.1 4.1"/>'),
  upload: P('<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>'),
  image: P('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>'),
  layers: P('<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>'),
  palette: P('<path d="M12 3a9 9 0 100 18c1.1 0 1.5-.8 1.5-1.6 0-1.2-1-1.6-1-2.6 0-.9.7-1.6 1.6-1.6H16a5 5 0 005-5c0-4-4-7.2-9-7.2z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10.5" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>'),
  settings: P('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z"/>'),
  logout: P('<path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l-5-5 5-5M5 12h11"/>'),
  home: P('<path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>'),
  message: P('<path d="M4 5h16v11H8l-4 4z"/>'),
  user: P('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>'),
  up: P('<path d="M6 15l6-6 6 6"/>'),
  down: P('<path d="M6 9l6 6 6-6"/>'),
  refresh: P('<path d="M20 12a8 8 0 11-2.3-5.7M20 4v5h-5"/>'),
  tag: P('<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>'),
  sparkle: P('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>'),
  copy: P('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>'),
  external: P('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>'),
  wand: P('<path d="M4 20L15 9M14 4v2M19 9h2M18 5l1.5-1.5M10 5l1 1M18 13l1 1"/><path d="M13 7l4 4"/>'),
  dress: P('<path d="M9 3l-1 4 2 3-4 11h12l-4-11 2-3-1-4M9 3c1 1.3 5 1.3 6 0"/>'),
};

export function icon(name, cls = '') {
  const svg = ICONS[name] || '';
  return cls ? `<span class="ico ${cls}">${svg}</span>` : `<span class="ico">${svg}</span>`;
}
