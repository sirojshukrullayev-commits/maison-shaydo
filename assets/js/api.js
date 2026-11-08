// Ommaviy sahifalar uchun ma'lumotlar qatlami (Supabase REST API orqali)
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { DEFAULT_SETTINGS, PRESETS } from './defaults.js';

const CACHE_PREFIX = 'ms_cache_v1:';
const memo = new Map();

async function rest(path, { method = 'GET', body, prefer, timeout = 9000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method,
      signal: ctrl.signal,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        ...(prefer ? { Prefer: prefer } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const j = await res.json(); msg = j.message || msg; } catch (e) { /* matn emas */ }
      throw new Error(msg);
    }
    if (method === 'GET') return await res.json();
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function readCache(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function writeCache(key, data) {
  try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ at: Date.now(), data })); } catch (e) { /* to'lgan bo'lishi mumkin */ }
}

// Tarmoqdan oladi, xato bo'lsa keshdan qaytaradi
async function cached(key, loader) {
  if (memo.has(key)) return memo.get(key);
  const p = (async () => {
    try {
      const data = await loader();
      writeCache(key, data);
      return data;
    } catch (err) {
      const c = readCache(key);
      if (c) return c.data;
      throw err;
    }
  })();
  memo.set(key, p);
  p.catch(() => memo.delete(key));
  return p;
}

export function peekCache(key) {
  const c = readCache(key);
  return c ? c.data : null;
}

function mergeSettings(rows) {
  const out = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  for (const r of rows || []) {
    if (r && r.key && r.value && typeof r.value === 'object') out[r.key] = { ...(out[r.key] || {}), ...r.value };
  }
  return out;
}

// Sozlamalar + faol mavzu
export async function loadSite() {
  try {
    return await cached('site', async () => {
      const [rows, themes] = await Promise.all([
        rest('settings?select=key,value'),
        rest('themes?select=id,slug,name,tokens&order=sort_order.asc'),
      ]);
      const settings = mergeSettings(rows);
      const activeId = settings.appearance?.active_theme;
      const theme = themes.find((t) => t.id === activeId) || themes.find((t) => t.slug === activeId) || themes[0] || PRESETS[0];
      return { settings, theme, ok: true };
    });
  } catch (e) {
    console.warn('Sozlamalarni yuklab bo‘lmadi:', e.message);
    return { settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)), theme: PRESETS[0], ok: false };
  }
}

export function listCategories() {
  return cached('categories', () => rest('categories?select=*&order=sort_order.asc,created_at.asc'));
}

export function listProjects() {
  return cached('projects', () => rest('projects?select=*&is_published=eq.true&order=sort_order.asc,created_at.desc'));
}

export async function getProject(slug) {
  const rows = await cached('project:' + slug, () => rest(`projects?select=*&slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&limit=1`));
  return rows && rows[0] ? rows[0] : null;
}

export function listProjectImages(projectId) {
  return cached('images:' + projectId, () => rest(`project_images?select=*&project_id=eq.${encodeURIComponent(projectId)}&order=sort_order.asc,created_at.asc`));
}

export function listResearch() {
  return cached('research', () => rest('research?select=*&is_published=eq.true&order=sort_order.asc,year.desc'));
}

export function listAchievements() {
  return cached('achievements', () => rest('achievements?select=*&is_published=eq.true&order=sort_order.asc,year.desc'));
}

export async function sendMessage({ name, contact, message }) {
  await rest('messages', { method: 'POST', body: { name, contact, message }, prefer: 'return=minimal' });
}
