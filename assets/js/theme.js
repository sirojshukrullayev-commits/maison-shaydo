// Mavzu (tema) tizimi: ranglar, shriftlar, naqshlar va ularni sahifaga qo'llash
import { PRESETS } from './defaults.js';

// Kirill alifbosini ham qo'llab-quvvatlaydigan Google shriftlari
export const FONTS = {
  heading: {
    'Playfair Display': 'ital,wght@0,400;0,500;0,600;0,700;1,400;1,500',
    'Cormorant Garamond': 'ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500',
    'Prata': '',
    'Lora': 'ital,wght@0,400;0,500;0,600;0,700;1,400',
    'PT Serif': 'ital,wght@0,400;0,700;1,400',
    'Forum': '',
    'Philosopher': 'ital,wght@0,400;0,700;1,400',
    'Montserrat': 'ital,wght@0,300;0,400;0,500;0,600;0,700;1,400',
  },
  body: {
    'Montserrat': 'wght@300;400;500;600;700',
    'Inter': 'wght@300;400;500;600;700',
    'Manrope': 'wght@300;400;500;600;700',
    'Jost': 'wght@300;400;500;600;700',
    'Nunito': 'wght@300;400;500;600;700',
    'Raleway': 'wght@300;400;500;600;700',
    'Open Sans': 'wght@300;400;500;600;700',
    'Roboto': 'wght@300;400;500;700',
  },
};

export const PATTERNS = ['none', 'ornament', 'atlas', 'lines', 'dots'];
export const FABRICS = ['silk', 'atlas', 'velvet', 'linen', 'chiffon'];
export const MANNEQUINS = ['linen', 'black', 'white'];

const SERIF_FALLBACK = "'Times New Roman', Georgia, serif";
const SANS_FALLBACK = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

export function defaultTokens() {
  return JSON.parse(JSON.stringify(PRESETS[0].tokens));
}

// Noto'liq tokenlarni standart qiymatlar bilan to'ldirish
export function normalizeTokens(t) {
  const d = defaultTokens();
  const src = t && typeof t === 'object' ? t : {};
  const out = { ...d, ...src };
  out.colors = { ...d.colors, ...(src.colors || {}) };
  out.fonts = { ...d.fonts, ...(src.fonts || {}) };
  out.radius = Number.isFinite(+out.radius) ? Math.max(0, Math.min(40, +out.radius)) : d.radius;
  if (!PATTERNS.includes(out.pattern)) out.pattern = 'none';
  if (!FABRICS.includes(out.fabric)) out.fabric = d.fabric;
  if (!MANNEQUINS.includes(out.mannequin)) out.mannequin = d.mannequin;
  out.dark = !!out.dark;
  for (const k in out.colors) if (!isColor(out.colors[k])) out.colors[k] = d.colors[k] || '#888888';
  return out;
}

export function isColor(c) { return typeof c === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c.trim()); }

export function hexToRgb(hex) {
  let h = String(hex || '#000').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function onColor(hex) { return luminance(hex) > 0.45 ? '#141210' : '#ffffff'; }

function kebab(s) { return s.replace(/[A-Z0-9]+/g, (m) => '-' + m.toLowerCase()); }

export function fontStack(name, kind) {
  return `'${name}', ${kind === 'heading' && !FONTS.body[name] ? SERIF_FALLBACK : SANS_FALLBACK}`;
}

export function fontsHref(tokens) {
  const fams = [];
  const add = (name, spec) => {
    if (!name) return;
    const fam = name.replace(/ /g, '+');
    fams.push('family=' + fam + (spec ? ':' + spec : ''));
  };
  const h = tokens.fonts.heading;
  const b = tokens.fonts.body;
  add(h, FONTS.heading[h] ?? FONTS.body[h] ?? '');
  if (b !== h) add(b, FONTS.body[b] ?? FONTS.heading[b] ?? '');
  return 'https://fonts.googleapis.com/css2?' + fams.join('&') + '&display=swap';
}

// Naqsh uchun SVG fon (data URI)
export function patternSvg(kind, color) {
  const c = encodeURIComponent(color);
  let svg = '';
  if (kind === 'ornament') {
    // Sakkiz qirrali yulduz va romb — girih naqshi
    svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'><g fill='none' stroke='${c}' stroke-width='1.1'><path d='M48 18l8.5 21.5L78 48l-21.5 8.5L48 78l-8.5-21.5L18 48l21.5-8.5z'/><path d='M48 30l5 13 13 5-13 5-5 13-5-13-13-5 13-5z'/><path d='M0 0l12 12M96 0L84 12M0 96l12-12M96 96L84 84'/><circle cx='48' cy='48' r='3'/><path d='M0 48h10M86 48h10M48 0v10M48 86v10'/></g></svg>`;
  } else if (kind === 'atlas') {
    svg = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='40' viewBox='0 0 60 40'><g fill='${c}'><path d='M6 0h8l3 10-3 10 3 10-3 10H6l-3-10 3-10-3-10z'/><path d='M32 0h5l3 10-3 10 3 10-3 10h-5l-3-10 3-10-3-10z' opacity='.6'/></g></svg>`;
  } else if (kind === 'lines') {
    svg = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><path d='M-7 7l14-14M0 28L28 0M21 35l14-14' stroke='${c}' stroke-width='.8'/></svg>`;
  } else if (kind === 'dots') {
    svg = `<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 22 22'><circle cx='3' cy='3' r='1.4' fill='${c}'/><circle cx='14' cy='14' r='1' fill='${c}' opacity='.7'/></svg>`;
  } else return 'none';
  return `url("data:image/svg+xml,${svg.replace(/"/g, "'").replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/\s+/g, ' ')}")`;
}

export function cssFromTokens(tokens) {
  const t = normalizeTokens(tokens);
  const c = t.colors;
  const lines = [];
  for (const k in c) lines.push(`--c-${kebab(k)}:${c[k]}`);
  const rgb = (h) => hexToRgb(h).join(',');
  lines.push(`--c-text-rgb:${rgb(c.text)}`, `--c-bg-rgb:${rgb(c.bg)}`, `--c-primary-rgb:${rgb(c.primary)}`,
    `--c-accent-rgb:${rgb(c.accent)}`, `--c-hero-text-rgb:${rgb(c.heroText)}`, `--c-dark-rgb:${rgb(c.dark)}`);
  lines.push(`--c-on-primary:${onColor(c.primary)}`, `--c-on-accent:${onColor(c.accent)}`, `--c-on-dark:${onColor(c.dark)}`);
  lines.push(`--radius:${t.radius}px`);
  lines.push(`--font-h:${fontStack(t.fonts.heading, 'heading')}`, `--font-b:${fontStack(t.fonts.body, 'body')}`);
  lines.push(`--pattern:${patternSvg(t.pattern, c.accent)}`, `--pattern-hero:${patternSvg(t.pattern, c.heroText)}`);
  return `:root{${lines.join(';')}}`;
}

let currentTokens = null;
export function getTokens() { return currentTokens || normalizeTokens(null); }

export function applyTheme(tokens, { persist = true } = {}) {
  const t = normalizeTokens(tokens);
  currentTokens = t;
  const css = cssFromTokens(t);
  let st = document.getElementById('theme-vars');
  if (!st) {
    st = document.createElement('style');
    st.id = 'theme-vars';
    document.head.appendChild(st);
  }
  st.textContent = css;
  const early = document.getElementById('theme-early');
  if (early) early.remove();
  const root = document.documentElement;
  root.dataset.pattern = t.pattern;
  root.dataset.dark = t.dark ? '1' : '0';
  root.style.colorScheme = t.dark ? 'dark' : 'light';
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
  meta.content = t.colors.heroBg2;
  const href = fontsHref(t);
  let link = document.getElementById('theme-fonts');
  if (!link) {
    link = document.createElement('link');
    link.id = 'theme-fonts';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (link.getAttribute('href') !== href) link.setAttribute('href', href);
  if (persist) {
    try {
      localStorage.setItem('ms_theme_css', css);
      localStorage.setItem('ms_theme_fonts', href);
      localStorage.setItem('ms_theme_meta', JSON.stringify({ pattern: t.pattern, dark: t.dark }));
    } catch (e) { /* e'tiborsiz */ }
  }
  window.dispatchEvent(new CustomEvent('themechange', { detail: t }));
  return t;
}

export function presetBySlug(slug) {
  return PRESETS.find((p) => p.slug === slug) || PRESETS[0];
}
