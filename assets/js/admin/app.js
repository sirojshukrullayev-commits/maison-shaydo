// Admin panel: kirish, bo'limlar, CRUD, mavzular
import { getClient, q, errMsg, uploadFile, downscaleImage, removeFileByUrl } from './sb.js';
import { createForm, bindSlug, h, confirmDialog } from './ui.js';
import { esc, icon, toast, slugify, safeUrl } from '../utils.js';
import { tr } from '../i18n.js';
import { DEFAULT_SETTINGS, PRESETS } from '../defaults.js';
import { applyTheme, normalizeTokens, FONTS, PATTERNS } from '../theme.js';

const S = { sb: null, user: null, settings: {}, themes: [], cats: [], dirty: false, unread: 0 };
const app = document.getElementById('admin');

// ---------------- Yordamchilar ----------------
const fmtDate = (d) => { try { return new Date(d).toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return d; } };
const ok = (m) => toast(m, 'success');
const fail = (e) => toast(errMsg(e), 'error', 4500);

async function loadSettings() {
  const rows = await q(S.sb.from('settings').select('key,value'));
  const out = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  rows.forEach((r) => { out[r.key] = { ...(out[r.key] || {}), ...(r.value || {}) }; });
  S.settings = out;
  return out;
}

async function saveSettings(key, values) {
  const merged = { ...(S.settings[key] || {}), ...values };
  await q(S.sb.from('settings').upsert({ key, value: merged }, { onConflict: 'key' }));
  S.settings[key] = merged;
}

async function loadThemes() {
  S.themes = await q(S.sb.from('themes').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true }));
  return S.themes;
}

async function loadCats() {
  S.cats = await q(S.sb.from('categories').select('*').order('sort_order', { ascending: true }));
  return S.cats;
}

function activeTheme() {
  const id = S.settings.appearance?.active_theme;
  return S.themes.find((t) => t.id === id) || S.themes.find((t) => t.slug === id) || S.themes[0];
}

function markDirty(el) {
  el.addEventListener('input', () => { S.dirty = true; });
  el.addEventListener('change', () => { S.dirty = true; });
}

function setTitle(t) { document.getElementById('a-title').textContent = t; document.title = `${t} — Admin`; }
function content() { return document.getElementById('a-content'); }

function saveBar(onSave, extra = '') {
  const bar = h('div', { class: 'a-savebar' }, `${extra}<button type="button" class="abtn" data-save>${icon('check')}Saqlash</button>`);
  const btn = bar.querySelector('[data-save]');
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    const prev = btn.innerHTML;
    btn.innerHTML = '<span class="spinner spinner--sm"></span>Saqlanmoqda…';
    try { const r = await onSave(); if (r !== false) { S.dirty = false; } } catch (e) { fail(e); }
    btn.disabled = false;
    btn.innerHTML = prev;
  });
  return bar;
}

function card(title, sub = '', headExtra = '') {
  const c = h('section', { class: 'a-card' });
  c.innerHTML = `<div class="a-card-head"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${headExtra}</div><div class="a-card-body"></div>`;
  return c;
}

// ---------------- Kirish ----------------
function renderLogin(msg = '') {
  app.innerHTML = `<div class="login">
    <form class="login-card" novalidate>
      <div class="login-brand">${icon('star')}<span>${esc(S.settings.general?.site_name || 'Maison Shaydo')}</span></div>
      <h1>Admin panelga kirish</h1>
      <p class="muted">Saytni boshqarish uchun e-pochta va parolingizni kiriting.</p>
      <label class="f-row"><span class="f-label">E-pochta</span><input class="inp" type="email" name="email" autocomplete="username" required></label>
      <label class="f-row"><span class="f-label">Parol</span><span class="pw-wrap"><input class="inp" type="password" name="password" autocomplete="current-password" required><button type="button" class="icon-btn" data-pw aria-label="Parolni ko‘rsatish">${icon('eye')}</button></span></label>
      <p class="login-err" role="alert">${esc(msg)}</p>
      <button class="abtn abtn--block" type="submit">${icon('arrowRight')}Kirish</button>
      <a class="login-back" href="/">${icon('arrowLeft')}Saytga qaytish</a>
    </form></div>`;
  const form = app.querySelector('form');
  const pw = form.password;
  form.querySelector('[data-pw]').addEventListener('click', (e) => {
    pw.type = pw.type === 'password' ? 'text' : 'password';
    e.currentTarget.innerHTML = icon(pw.type === 'password' ? 'eye' : 'eyeOff');
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = form.querySelector('.login-err');
    err.textContent = '';
    const email = form.email.value.trim(); const password = pw.value;
    if (!email || !password) { err.textContent = 'E-pochta va parolni kiriting'; return; }
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.innerHTML = '<span class="spinner spinner--sm"></span>Tekshirilmoqda…';
    try {
      const { data, error } = await S.sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      S.user = data.user;
      await afterLogin();
    } catch (ex) {
      err.textContent = errMsg(ex);
      btn.disabled = false; btn.innerHTML = `${icon('arrowRight')}Kirish`;
    }
  });
}

async function afterLogin() {
  const rows = await q(S.sb.from('admins').select('user_id').eq('user_id', S.user.id));
  if (!rows.length) {
    await S.sb.auth.signOut();
    renderLogin('Bu foydalanuvchida admin huquqi yo‘q');
    return;
  }
  await Promise.all([loadSettings(), loadThemes(), loadCats()]);
  const at = activeTheme();
  if (at) applyTheme(at.tokens, { persist: false });
  renderShell();
  route();
}

// ---------------- Karkas ----------------
const NAV = [
  ['dashboard', 'home', 'Boshqaruv paneli'],
  ['label', '', 'Kontent'],
  ['home', 'layers', 'Bosh sahifa'],
  ['projects', 'grid', 'Loyihalar'],
  ['categories', 'tag', 'Toifalar'],
  ['about', 'user', 'Dizayner haqida'],
  ['research', 'book', 'Ilmiy ishlar'],
  ['achievements', 'award', 'Yutuqlar'],
  ['contact', 'phone', 'Aloqa ma’lumotlari'],
  ['messages', 'message', 'Xabarlar'],
  ['label', '', 'Ko‘rinish'],
  ['design', 'palette', 'Dizayn va mavzular'],
  ['settings', 'settings', 'Sozlamalar'],
];

function renderShell() {
  app.innerHTML = `<div class="admin">
    <aside class="a-side" id="a-side">
      <a class="a-brand" href="#/dashboard">${icon('star')}<span>${esc(S.settings.general?.site_name || 'Maison Shaydo')}<small>Admin panel</small></span></a>
      <nav class="a-nav">${NAV.map(([k, ic, label]) => (k === 'label' ? `<div class="a-nav-label">${esc(label)}</div>` : `<a href="#/${k}" data-r="${k}">${icon(ic)}<span>${esc(label)}</span>${k === 'messages' ? '<em class="badge" id="unread-badge" hidden></em>' : ''}</a>`)).join('')}</nav>
      <div class="a-side-foot">
        <a class="abtn abtn--ghost abtn--sm" href="/" target="_blank" rel="noopener">${icon('external')}Saytni ochish</a>
        <button type="button" class="abtn abtn--ghost abtn--sm" id="logout">${icon('logout')}Chiqish</button>
      </div>
    </aside>
    <div class="a-scrim" id="a-scrim"></div>
    <div class="a-main">
      <header class="a-top"><button type="button" class="icon-btn a-burger" id="a-burger" aria-label="Menyu">${icon('menu')}</button><h1 id="a-title"></h1><span class="a-user">${icon('user')}${esc(S.user?.email || '')}</span></header>
      <div class="a-content" id="a-content"></div>
    </div></div>`;
  document.getElementById('logout').addEventListener('click', async () => {
    if (!(await guard())) return;
    await S.sb.auth.signOut();
    S.user = null;
    location.hash = '';
    renderLogin();
  });
  const side = document.getElementById('a-side');
  const toggle = (o) => document.documentElement.classList.toggle('a-nav-open', o);
  document.getElementById('a-burger').addEventListener('click', () => toggle(!document.documentElement.classList.contains('a-nav-open')));
  document.getElementById('a-scrim').addEventListener('click', () => toggle(false));
  side.addEventListener('click', async (e) => {
    const a = e.target.closest('a[data-r]');
    if (!a) return;
    e.preventDefault();
    toggle(false);
    if (await guard()) { S.dirty = false; location.hash = a.getAttribute('href'); }
  });
  refreshUnread();
}

async function guard() {
  if (!S.dirty) return true;
  const r = await confirmDialog('Saqlanmagan o‘zgarishlar bor. Sahifadan chiqib ketsangiz, ular yo‘qoladi. Davom etasizmi?', 'Ha, chiqish');
  if (r) S.dirty = false;
  return !!r;
}
window.addEventListener('beforeunload', (e) => { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });

async function refreshUnread() {
  try {
    const { count } = await S.sb.from('messages').select('id', { count: 'exact', head: true }).eq('is_read', false);
    S.unread = count || 0;
    const b = document.getElementById('unread-badge');
    if (b) { b.textContent = S.unread; b.hidden = !S.unread; }
  } catch (e) { /* e'tiborsiz */ }
}

// ---------------- Marshrutlash ----------------
async function route() {
  if (!S.user) return;
  const parts = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('/');
  const [name, id] = parts;
  document.querySelectorAll('.a-nav a').forEach((a) => a.classList.toggle('is-active', a.dataset.r === name));
  const c = content();
  c.innerHTML = '<div class="a-loading"><span class="spinner"></span></div>';
  S.dirty = false;
  window.scrollTo(0, 0);
  try {
    if (name === 'dashboard') await viewDashboard();
    else if (name === 'home') await viewHome();
    else if (name === 'projects') { if (id) await viewProjectEdit(id); else await viewCrudList('projects'); }
    else if (CRUD[name]) { if (id) await viewCrudEdit(name, id); else await viewCrudList(name); }
    else if (name === 'about') await viewAbout();
    else if (name === 'contact') await viewContact();
    else if (name === 'messages') await viewMessages();
    else if (name === 'design') { if (id) await viewThemeEdit(id); else await viewDesign(); }
    else if (name === 'settings') await viewSettings();
    else { location.hash = '#/dashboard'; }
  } catch (e) {
    console.error(e);
    c.innerHTML = `<div class="a-card"><div class="a-card-body"><p class="a-error">${icon('close')} Xatolik: ${esc(errMsg(e))}</p><button class="abtn abtn--sm" onclick="location.reload()">Qayta yuklash</button></div></div>`;
  }
}
window.addEventListener('hashchange', route);

// ---------------- Boshqaruv paneli ----------------
async function viewDashboard() {
  setTitle('Boshqaruv paneli');
  const count = async (t, f) => { let qq = S.sb.from(t).select('id', { count: 'exact', head: true }); if (f) qq = f(qq); const { count: n } = await qq; return n || 0; };
  const [p, c, r, a, m] = await Promise.all([count('projects'), count('categories'), count('research'), count('achievements'), count('messages', (x) => x.eq('is_read', false))]);
  const last = await q(S.sb.from('messages').select('*').order('created_at', { ascending: false }).limit(3));
  const at = activeTheme();
  const stat = (n, label, ic, href) => `<a class="a-stat" href="${href}">${icon(ic)}<b>${n}</b><span>${label}</span></a>`;
  content().innerHTML = `
    <div class="a-hello">
      <div><h2>Xush kelibsiz!</h2><p>Bu yerdan saytning barcha qismini boshqarasiz: loyihalar, dizayner haqidagi ma’lumot, ilmiy ishlar, yutuqlar va sayt dizayni.</p></div>
      <a class="abtn" href="/" target="_blank" rel="noopener">${icon('external')}Saytni ko‘rish</a>
    </div>
    <div class="a-stats">
      ${stat(p, 'Loyihalar', 'grid', '#/projects')}${stat(c, 'Toifalar', 'tag', '#/categories')}${stat(r, 'Ilmiy ishlar', 'book', '#/research')}
      ${stat(a, 'Yutuqlar', 'award', '#/achievements')}${stat(m, 'Yangi xabarlar', 'message', '#/messages')}
    </div>
    <div class="a-grid2">
      <section class="a-card"><div class="a-card-head"><div><h2>Boshlash uchun</h2><p>Namuna ma’lumotlarni o‘zingiznikiga almashtiring</p></div></div>
        <div class="a-card-body"><ol class="a-steps">
          <li><a href="#/about">Dizayner haqida</a> — ism, rasm, tarjimai hol va tajriba yillarini kiriting.</li>
          <li><a href="#/projects">Loyihalar</a> — namuna loyihalarni o‘chirib, o‘z ishlaringizni rasmlari bilan qo‘shing.</li>
          <li><a href="#/research">Ilmiy ishlar</a> va <a href="#/achievements">Yutuqlar</a> — namunalarni haqiqiy ma’lumot bilan almashtiring, PDF yuklang.</li>
          <li><a href="#/contact">Aloqa</a> — telefon, manzil va ijtimoiy tarmoqlar.</li>
          <li><a href="#/design">Dizayn</a> — mavzu tanlang (hozir: <b>${esc(at ? tr(at.name) : '')}</b>).</li>
        </ol></div></section>
      <section class="a-card"><div class="a-card-head"><div><h2>So‘nggi xabarlar</h2></div><a class="abtn abtn--ghost abtn--sm" href="#/messages">Barchasi</a></div>
        <div class="a-card-body">${last.length ? last.map((x) => `<div class="msg-mini ${x.is_read ? '' : 'is-new'}"><b>${esc(x.name)}</b><span>${esc(x.contact)} · ${esc(fmtDate(x.created_at))}</span><p>${esc(x.message.slice(0, 140))}${x.message.length > 140 ? '…' : ''}</p></div>`).join('') : '<p class="muted">Hozircha xabar yo‘q.</p>'}</div></section>
    </div>`;
}

// ---------------- Bosh sahifa ----------------
async function viewHome() {
  setTitle('Bosh sahifa');
  await loadSettings();
  const hero = S.settings.hero; const home = S.settings.home;
  const c1 = card('Bosh banner (hero)', 'Sahifa ochilganda ko‘rinadigan katta qism');
  const f1 = createForm([
    { key: 'mode', label: 'Markazdagi tasvir', type: 'select', options: [{ value: '3d', label: '3D aylanuvchi maneken (animatsiyali)' }, { value: 'image', label: 'O‘zim yuklagan rasm' }] },
    { key: 'image_url', label: 'Markaziy rasm (fonsiz PNG tavsiya etiladi)', type: 'image', folder: 'hero', editorMode: 'nobg', help: '“Fon / tahrirlash” tugmasi orqali fonni olib tashlang va “Shaffof” fonni tanlang — shunda rasm harflar ustida turgandek ko‘rinadi.' },
    { key: 'word', label: 'Katta so‘z (masalan: USLUB)', type: 'i18n', required: true },
    { key: 'eyebrow', label: 'Kichik sarlavha', type: 'i18n' },
    { key: 'side_text', label: 'O‘ng tomondagi qisqa ibora', type: 'i18n' },
  ], hero);
  c1.querySelector('.a-card-body').appendChild(f1.el);
  const c2 = card('Bosh sahifa bo‘limlari');
  const f2 = createForm([
    { type: 'group', label: 'Toifalar bo‘limi' },
    { key: 'categories_label', label: 'Kichik sarlavha', type: 'i18n' },
    { key: 'categories_title', label: 'Sarlavha', type: 'i18n' },
    { key: 'categories_text', label: 'Izoh', type: 'i18n' },
    { type: 'group', label: '“Xush kelibsiz” banneri' },
    { key: 'welcome_label', label: 'Kichik sarlavha', type: 'i18n' },
    { key: 'welcome_title', label: 'Sarlavha', type: 'i18n' },
    { key: 'welcome_text', label: 'Matn', type: 'i18n', multiline: true },
    { key: 'welcome_image', label: 'Banner rasmi', type: 'image', folder: 'home', editorMode: 'original' },
  ], home);
  c2.querySelector('.a-card-body').appendChild(f2.el);
  const wrap = h('div', { class: 'a-stack' });
  wrap.append(c1, c2, saveBar(async () => {
    if (!f1.validate() || !f2.validate()) return false;
    await saveSettings('hero', f1.getValues());
    await saveSettings('home', f2.getValues());
    ok('Bosh sahifa saqlandi');
  }));
  content().innerHTML = '';
  content().appendChild(wrap);
  markDirty(wrap);
}

// ---------------- Umumiy CRUD ----------------
const yearOpts = { type: 'number', min: 1900, max: 2100 };
const CRUD = {
  projects: {
    table: 'projects', title: 'Loyihalar', single: 'loyiha', publish: true, featured: true,
    row: (r) => ({ img: r.cover_url, title: tr(r.title), meta: [S.cats.find((c) => c.id === r.category_id) ? tr(S.cats.find((c) => c.id === r.category_id).name) : 'Toifasiz', r.year].filter(Boolean).join(' · ') }),
  },
  categories: {
    table: 'categories', title: 'Toifalar', single: 'toifa',
    fields: () => [
      { key: 'name', label: 'Nomi', type: 'i18n', required: true },
      { key: 'slug', label: 'Havoladagi nomi (slug)', type: 'text', required: true, help: 'Faqat lotin harflari, raqam va chiziqcha. Masalan: milliy' },
      { key: 'image_url', label: 'Karta rasmi', type: 'image', folder: 'categories', editorMode: 'nobg' },
      { key: 'sort_order', label: 'Tartib raqami', type: 'number' },
    ],
    slug: ['name', 'slug'],
    row: (r) => ({ img: r.image_url, title: tr(r.name), meta: '/' + r.slug }),
    afterSave: loadCats,
  },
  research: {
    table: 'research', title: 'Ilmiy ishlar', single: 'ilmiy ish', publish: true,
    fields: () => [
      { key: 'title', label: 'Ilmiy ish nomi', type: 'i18n', required: true },
      { key: 'venue', label: 'Qayerda chop etilgan (jurnal, konferensiya)', type: 'i18n' },
      { key: 'year', label: 'Yili', ...yearOpts },
      { key: 'summary', label: 'Qisqa izoh (annotatsiya)', type: 'i18n', multiline: true, rows: 6 },
      { key: 'file_url', label: 'PDF fayl', type: 'file', folder: 'research', accept: 'application/pdf' },
      { key: 'link_url', label: 'Tashqi havola (ixtiyoriy)', type: 'text', placeholder: 'https://...' },
      { key: 'is_published', label: 'Saytda ko‘rinsin', type: 'toggle', default: true, text: 'Ha' },
      { key: 'sort_order', label: 'Tartib raqami', type: 'number' },
    ],
    row: (r) => ({ icon: 'book', title: tr(r.title), meta: [r.year, tr(r.venue)].filter(Boolean).join(' · ') }),
  },
  achievements: {
    table: 'achievements', title: 'Yutuqlar', single: 'yutuq', publish: true,
    fields: () => [
      { key: 'title', label: 'Yutuq nomi (diplom, sertifikat, tanlov)', type: 'i18n', required: true },
      { key: 'issuer', label: 'Kim tomonidan berilgan', type: 'i18n' },
      { key: 'year', label: 'Yili', ...yearOpts },
      { key: 'description', label: 'Izoh', type: 'i18n', multiline: true },
      { key: 'image_url', label: 'Sertifikat / diplom rasmi', type: 'image', folder: 'achievements', editorMode: 'original' },
      { key: 'is_published', label: 'Saytda ko‘rinsin', type: 'toggle', default: true, text: 'Ha' },
      { key: 'sort_order', label: 'Tartib raqami', type: 'number' },
    ],
    row: (r) => ({ img: r.image_url, icon: 'award', title: tr(r.title), meta: [r.year, tr(r.issuer)].filter(Boolean).join(' · ') }),
  },
};

async function viewCrudList(name) {
  const cfg = CRUD[name];
  setTitle(cfg.title);
  if (name === 'projects') await loadCats();
  const rows = await q(S.sb.from(cfg.table).select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true }));
  const c = card(cfg.title, `${rows.length} ta`, `<a class="abtn" href="#/${name}/new">${icon('plus')}Yangi ${esc(cfg.single)}</a>`);
  const list = h('div', { class: 'a-list' });
  const draw = () => {
    list.innerHTML = rows.length ? '' : `<div class="a-empty">${icon('layers')}<p>Hozircha hech narsa yo‘q.</p><a class="abtn abtn--sm" href="#/${name}/new">${icon('plus')}Qo‘shish</a></div>`;
    rows.forEach((r, i) => {
      const v = cfg.row(r);
      const img = safeUrl(v.img);
      const item = h('div', { class: 'a-item' + (cfg.publish && r.is_published === false ? ' is-hidden' : '') });
      item.innerHTML = `
        <div class="a-thumb">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : icon(v.icon || 'image')}</div>
        <div class="a-item-main"><a href="#/${name}/${r.id}"><b>${esc(v.title || '(nomsiz)')}</b></a><span>${esc(v.meta || '')}</span></div>
        <div class="a-item-tools">
          ${cfg.featured ? `<button type="button" class="icon-btn ${r.is_featured ? 'is-on' : ''}" data-a="feat" title="Bosh sahifada ko‘rsatish">${icon('sparkle')}</button>` : ''}
          ${cfg.publish ? `<button type="button" class="icon-btn ${r.is_published ? 'is-on' : ''}" data-a="pub" title="${r.is_published ? 'Saytda ko‘rinadi' : 'Yashirilgan'}">${icon(r.is_published ? 'eye' : 'eyeOff')}</button>` : ''}
          <button type="button" class="icon-btn" data-a="up" title="Yuqoriga" ${i === 0 ? 'disabled' : ''}>${icon('up')}</button>
          <button type="button" class="icon-btn" data-a="down" title="Pastga" ${i === rows.length - 1 ? 'disabled' : ''}>${icon('down')}</button>
          <a class="icon-btn" href="#/${name}/${r.id}" title="Tahrirlash">${icon('edit')}</a>
          <button type="button" class="icon-btn icon-btn--danger" data-a="del" title="O‘chirish">${icon('trash')}</button>
        </div>`;
      item.addEventListener('click', async (e) => {
        const b = e.target.closest('button[data-a]');
        if (!b) return;
        const a = b.dataset.a;
        try {
          if (a === 'pub' || a === 'feat') {
            const key = a === 'pub' ? 'is_published' : 'is_featured';
            await q(S.sb.from(cfg.table).update({ [key]: !r[key] }).eq('id', r.id));
            r[key] = !r[key];
            draw();
          } else if (a === 'up' || a === 'down') {
            const j = a === 'up' ? i - 1 : i + 1;
            [rows[i], rows[j]] = [rows[j], rows[i]];
            const updates = rows.map((x, k) => ({ x, k: k + 1 })).filter(({ x, k }) => x.sort_order !== k);
            await Promise.all(updates.map(({ x, k }) => q(S.sb.from(cfg.table).update({ sort_order: k }).eq('id', x.id)).then(() => { x.sort_order = k; })));
            draw();
          } else if (a === 'del') {
            if (!(await confirmDialog(`“${v.title}” o‘chirilsinmi? Bu amalni qaytarib bo‘lmaydi.`))) return;
            await q(S.sb.from(cfg.table).delete().eq('id', r.id));
            rows.splice(i, 1);
            if (cfg.afterSave) await cfg.afterSave();
            draw();
            c.querySelector('.a-card-head p').textContent = `${rows.length} ta`;
            ok('O‘chirildi');
          }
        } catch (ex) { fail(ex); }
      });
      list.appendChild(item);
    });
  };
  draw();
  c.querySelector('.a-card-body').appendChild(list);
  content().innerHTML = '';
  content().appendChild(c);
}

async function viewCrudEdit(name, id) {
  const cfg = CRUD[name];
  const isNew = id === 'new';
  let row = {};
  if (!isNew) {
    const rows = await q(S.sb.from(cfg.table).select('*').eq('id', id).limit(1));
    if (!rows.length) { content().innerHTML = '<p class="a-error">Topilmadi</p>'; return; }
    row = rows[0];
  }
  setTitle(`${cfg.title} — ${isNew ? 'yangi' : 'tahrirlash'}`);
  const c = card(isNew ? `Yangi ${cfg.single}` : esc(tr(row.title || row.name) || 'Tahrirlash'), '', `<a class="abtn abtn--ghost abtn--sm" href="#/${name}">${icon('arrowLeft')}Ro‘yxatga</a>`);
  const form = createForm(cfg.fields(), row);
  if (cfg.slug) bindSlug(form, cfg.slug[0], cfg.slug[1]);
  c.querySelector('.a-card-body').appendChild(form.el);
  const wrap = h('div', { class: 'a-stack' });
  wrap.append(c, saveBar(async () => {
    if (!form.validate()) return false;
    const v = form.getValues();
    if ('slug' in v) v.slug = slugify(v.slug);
    if ('link_url' in v && v.link_url && !/^https?:\/\//.test(v.link_url)) { toast('Havola http:// yoki https:// bilan boshlanishi kerak', 'error'); return false; }
    if ('sort_order' in v && v.sort_order == null) v.sort_order = 0;
    if (isNew) {
      const created = await q(S.sb.from(cfg.table).insert(v).select().single());
      if (cfg.afterSave) await cfg.afterSave();
      ok('Qo‘shildi');
      S.dirty = false;
      location.hash = `#/${name}/${created.id}`;
    } else {
      await q(S.sb.from(cfg.table).update(v).eq('id', id));
      if (cfg.afterSave) await cfg.afterSave();
      ok('Saqlandi');
    }
  }));
  content().innerHTML = '';
  content().appendChild(wrap);
  markDirty(wrap);
}

// ---------------- Loyiha tahrirlash + rasmlar ----------------
async function viewProjectEdit(id) {
  await loadCats();
  const isNew = id === 'new';
  let row = { is_published: true, year: new Date().getFullYear(), sort_order: 0 };
  if (!isNew) {
    const rows = await q(S.sb.from('projects').select('*').eq('id', id).limit(1));
    if (!rows.length) { content().innerHTML = '<p class="a-error">Loyiha topilmadi</p>'; return; }
    row = rows[0];
  }
  setTitle(isNew ? 'Yangi loyiha' : 'Loyihani tahrirlash');
  const c = card(isNew ? 'Yangi loyiha' : esc(tr(row.title)), 'Barcha matnlarni UZ / RU / EN yorliqlarida kiriting', `<span class="a-head-tools">${!isNew ? `<a class="abtn abtn--ghost abtn--sm" href="/project?slug=${encodeURIComponent(row.slug)}" target="_blank" rel="noopener">${icon('external')}Saytda ko‘rish</a>` : ''}<a class="abtn abtn--ghost abtn--sm" href="#/projects">${icon('arrowLeft')}Ro‘yxatga</a></span>`);
  const form = createForm([
    { key: 'title', label: 'Loyiha nomi', type: 'i18n', required: true },
    { key: 'slug', label: 'Havoladagi nomi (slug)', type: 'text', required: true, help: 'Avtomatik to‘ldiriladi. Masalan: atlas-jilosi' },
    { key: 'category_id', label: 'Toifa', type: 'select', nullable: true, options: [{ value: '', label: '— Toifasiz —' }, ...S.cats.map((x) => ({ value: x.id, label: tr(x.name) }))] },
    { key: 'year', label: 'Yili', ...yearOpts },
    { key: 'description', label: 'Tavsif', type: 'i18n', multiline: true, rows: 7 },
    { type: 'group', label: 'Mato' },
    { key: 'fabric', label: 'Mato turi', type: 'i18n', placeholder: 'Masalan: Atlas (ipak)' },
    { key: 'fabric_image_url', label: 'Mato rasmi (ixtiyoriy) — 3D ko‘rinishda libosga “kiydiriladi”', type: 'image', folder: 'fabrics', editorMode: 'original' },
    { type: 'group', label: 'Ko‘rinish' },
    { key: 'is_published', label: 'Saytda ko‘rinsin', type: 'toggle', text: 'Ha' },
    { key: 'is_featured', label: 'Bosh sahifadagi “So‘nggi loyihalar”da ko‘rsatish', type: 'toggle', text: 'Ha' },
    { key: 'sort_order', label: 'Tartib raqami', type: 'number' },
  ], row);
  bindSlug(form, 'title', 'slug');
  c.querySelector('.a-card-body').appendChild(form.el);
  const wrap = h('div', { class: 'a-stack' });
  wrap.appendChild(c);
  if (!isNew) wrap.appendChild(await imagesManager(row));
  else wrap.appendChild(h('div', { class: 'a-note' }, `${icon('image')}<span>Loyihani saqlaganingizdan so‘ng rasmlar qo‘shish bo‘limi ochiladi.</span>`));
  wrap.appendChild(saveBar(async () => {
    if (!form.validate()) return false;
    const v = form.getValues();
    v.slug = slugify(v.slug);
    if (v.sort_order == null) v.sort_order = 0;
    if (isNew) {
      const created = await q(S.sb.from('projects').insert(v).select().single());
      ok('Loyiha yaratildi. Endi rasmlarni qo‘shing.');
      S.dirty = false;
      location.hash = `#/projects/${created.id}`;
    } else {
      await q(S.sb.from('projects').update(v).eq('id', row.id));
      Object.assign(row, v);
      ok('Loyiha saqlandi');
    }
  }));
  content().innerHTML = '';
  content().appendChild(wrap);
  markDirty(form.el);
}

const MODE_LABEL = { original: 'Asl', nobg: 'Fonsiz', mannequin: 'Maneken' };

async function imagesManager(project) {
  let imgs = await q(S.sb.from('project_images').select('*').eq('project_id', project.id).order('sort_order', { ascending: true }).order('created_at', { ascending: true }));
  const c = card('Rasmlar', 'Birinchi rasm yoki ★ belgilangani muqova bo‘ladi. “Tahrirlash” orqali fonni olib tashlash yoki manekenga joylash mumkin.',
    `<label class="abtn">${icon('upload')}Rasm qo‘shish<input type="file" accept="image/png,image/jpeg,image/webp" multiple hidden data-up></label>`);
  const body = c.querySelector('.a-card-body');
  const drop = h('div', { class: 'dropzone' }, `${icon('image')}<span>Rasmlarni shu yerga sudrab tashlang yoki “Rasm qo‘shish” tugmasini bosing</span>`);
  const grid = h('div', { class: 'img-grid' });
  const status = h('p', { class: 'muted img-upstatus' });
  body.append(drop, status, grid);

  const setCover = async (url) => {
    await q(S.sb.from('projects').update({ cover_url: url || null }).eq('id', project.id));
    project.cover_url = url || null;
  };
  const renumber = async () => {
    await Promise.all(imgs.map((x, k) => (x.sort_order !== k ? q(S.sb.from('project_images').update({ sort_order: k }).eq('id', x.id)).then(() => { x.sort_order = k; }) : null)));
  };
  const draw = () => {
    grid.innerHTML = '';
    if (!imgs.length) { grid.innerHTML = '<p class="muted">Hali rasm qo‘shilmagan.</p>'; return; }
    imgs.forEach((im, i) => {
      const isCover = project.cover_url === im.url;
      const tile = h('div', { class: 'img-tile' + (isCover ? ' is-cover' : '') });
      tile.innerHTML = `<div class="img-tile-media"><img src="${esc(im.url)}" alt="" loading="lazy"></div>
        <span class="mode-badge">${MODE_LABEL[im.mode] || im.mode}</span>${isCover ? '<span class="cover-badge">★ Muqova</span>' : ''}
        <div class="tile-tools">
          <button type="button" class="icon-btn" data-a="cover" title="Muqova qilish">${icon('sparkle')}</button>
          <button type="button" class="icon-btn" data-a="edit" title="Tahrirlash (fon, maneken)">${icon('wand')}</button>
          <button type="button" class="icon-btn" data-a="left" title="Chapga" ${i === 0 ? 'disabled' : ''}>${icon('arrowLeft')}</button>
          <button type="button" class="icon-btn" data-a="right" title="O‘ngga" ${i === imgs.length - 1 ? 'disabled' : ''}>${icon('arrowRight')}</button>
          <button type="button" class="icon-btn icon-btn--danger" data-a="del" title="O‘chirish">${icon('trash')}</button>
        </div>`;
      tile.addEventListener('click', async (e) => {
        const b = e.target.closest('button[data-a]');
        if (!b) return;
        try {
          const a = b.dataset.a;
          if (a === 'cover') { await setCover(im.url); draw(); ok('Muqova o‘zgartirildi'); }
          if (a === 'left' || a === 'right') {
            const j = a === 'left' ? i - 1 : i + 1;
            [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
            await renumber(); draw();
          }
          if (a === 'del') {
            if (!(await confirmDialog('Rasm o‘chirilsinmi?'))) return;
            await q(S.sb.from('project_images').delete().eq('id', im.id));
            imgs.splice(i, 1);
            if (isCover) await setCover(imgs[0]?.url || null);
            removeFileByUrl(im.url);
            if (im.original_url && im.original_url !== im.url && !imgs.some((x) => x.original_url === im.original_url)) removeFileByUrl(im.original_url);
            draw(); ok('Rasm o‘chirildi');
          }
          if (a === 'edit') {
            const { openEditor } = await import('./editor.js');
            const res = await openEditor(im.original_url || im.url, { title: 'Rasmni tahrirlash', defaultMode: im.mode === 'original' ? 'nobg' : im.mode });
            if (!res) return;
            status.textContent = 'Saqlanmoqda…';
            const url = await uploadFile(res.blob, `projects/${project.id}`, 'edited.png');
            const oldUrl = im.url;
            await q(S.sb.from('project_images').update({ url, mode: res.mode, bg_color: res.bgColor }).eq('id', im.id));
            im.url = url; im.mode = res.mode; im.bg_color = res.bgColor;
            if (project.cover_url === oldUrl) await setCover(url);
            if (oldUrl !== im.original_url) removeFileByUrl(oldUrl);
            status.textContent = '';
            draw(); ok('Rasm yangilandi');
          }
        } catch (ex) { status.textContent = ''; fail(ex); }
      });
      grid.appendChild(tile);
    });
  };
  const addFiles = async (files) => {
    const list = Array.from(files).filter((f) => /^image\//.test(f.type));
    if (!list.length) return;
    let n = 0; let done = 0;
    for (const f of list) {
      n++;
      status.textContent = `Yuklanmoqda: ${n} / ${list.length}…`;
      try {
        const small = await downscaleImage(f, 2200);
        const url = await uploadFile(small, `projects/${project.id}`, f.name);
        const created = await q(S.sb.from('project_images').insert({ project_id: project.id, url, original_url: url, mode: 'original', sort_order: imgs.length }).select().single());
        imgs.push(created);
        if (!project.cover_url) await setCover(url);
        done++;
        draw();
      } catch (ex) { fail(ex); }
    }
    status.textContent = '';
    if (done) ok(done > 1 ? `${done} ta rasm qo‘shildi` : 'Rasm qo‘shildi');
  };
  c.querySelector('[data-up]').addEventListener('change', (e) => { addFiles(e.target.files); e.target.value = ''; });
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
  drop.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));
  draw();
  return c;
}

// ---------------- Dizayner haqida ----------------
async function viewAbout() {
  setTitle('Dizayner haqida');
  await loadSettings();
  const c = card('Dizayner haqida', 'Bu ma’lumotlar “Dizayner haqida” sahifasida va bosh sahifada ko‘rinadi');
  const form = createForm([
    { key: 'name', label: 'Ism-familiya', type: 'i18n', required: true, help: 'Rus tilida kirill yozuvida kiritishingiz mumkin' },
    { key: 'role', label: 'Kasbi / unvoni', type: 'i18n' },
    { key: 'photo_url', label: 'Surat', type: 'image', folder: 'about', editorMode: 'original' },
    { key: 'experience_years', label: 'Tajriba (yil)', type: 'number', min: 0, max: 80 },
    { key: 'quote', label: 'Iqtibos / shior', type: 'i18n', multiline: true, rows: 3 },
    { key: 'bio', label: 'Tarjimai hol', type: 'i18n', multiline: true, rows: 9, help: 'Paragraflarni bo‘sh qator bilan ajrating' },
    { key: 'skills', label: 'Yo‘nalishlar (ko‘nikmalar)', type: 'list', scalar: true, addLabel: 'Yo‘nalish qo‘shish', fields: [{ key: 'value', label: '', type: 'i18n' }] },
    { key: 'timeline', label: 'Ijodiy yo‘l (ta’lim, tajriba)', type: 'list', addLabel: 'Bosqich qo‘shish', fields: [
      { key: 'year', label: 'Yil', type: 'text', placeholder: '2020' },
      { key: 'title', label: 'Sarlavha', type: 'i18n' },
      { key: 'text', label: 'Izoh', type: 'i18n', multiline: true, rows: 3 },
    ] },
  ], S.settings.about);
  c.querySelector('.a-card-body').appendChild(form.el);
  const wrap = h('div', { class: 'a-stack' });
  wrap.append(c, h('div', { class: 'a-note' }, `${icon('award')}<span>Yutuq va sertifikatlar alohida <a href="#/achievements">“Yutuqlar”</a> bo‘limida qo‘shiladi.</span>`), saveBar(async () => {
    if (!form.validate()) return false;
    const v = form.getValues();
    v.experience_years = v.experience_years || 0;
    v.skills = (v.skills || []).filter((x) => x && (x.uz || x.ru || x.en));
    v.timeline = (v.timeline || []).filter((x) => x && (x.year || x.title?.uz));
    await saveSettings('about', v);
    ok('Saqlandi');
  }));
  content().innerHTML = '';
  content().appendChild(wrap);
  markDirty(wrap);
}

// ---------------- Aloqa ----------------
async function viewContact() {
  setTitle('Aloqa ma’lumotlari');
  await loadSettings();
  const c = card('Aloqa ma’lumotlari', 'Bo‘sh qoldirilgan maydonlar saytda ko‘rsatilmaydi');
  const form = createForm([
    { key: 'phone', label: 'Telefon', type: 'text', placeholder: '+998 90 123 45 67' },
    { key: 'email', label: 'E-pochta', type: 'text', inputType: 'email' },
    { key: 'address', label: 'Manzil', type: 'i18n' },
    { key: 'hours', label: 'Ish vaqti', type: 'i18n' },
    { type: 'group', label: 'Ijtimoiy tarmoqlar (havola yoki @nom)' },
    { key: 'instagram', label: 'Instagram', type: 'text', placeholder: '@username' },
    { key: 'telegram', label: 'Telegram', type: 'text', placeholder: '@username' },
    { key: 'facebook', label: 'Facebook', type: 'text' },
    { key: 'youtube', label: 'YouTube', type: 'text' },
    { type: 'group', label: 'Xarita' },
    { key: 'map_embed', label: 'Google Maps “Embed” havolasi', type: 'textarea', rows: 3, help: 'Google Maps → Ulashish → Xaritani joylashtirish → HTML kodini nusxalab shu yerga qo‘ying.' },
  ], S.settings.contact);
  c.querySelector('.a-card-body').appendChild(form.el);
  const wrap = h('div', { class: 'a-stack' });
  wrap.append(c, saveBar(async () => {
    const v = form.getValues();
    if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) { toast('E-pochta manzili noto‘g‘ri', 'error'); return false; }
    await saveSettings('contact', v);
    ok('Saqlandi');
  }));
  content().innerHTML = '';
  content().appendChild(wrap);
  markDirty(wrap);
}

// ---------------- Xabarlar ----------------
async function viewMessages() {
  setTitle('Xabarlar');
  const rows = await q(S.sb.from('messages').select('*').order('created_at', { ascending: false }).limit(500));
  const c = card('Xabarlar', `${rows.length} ta xabar`);
  const list = h('div', { class: 'msg-list' });
  const contactLink = (x) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x) ? `mailto:${x}` : (/^[+\d][\d\s()-]{5,}$/.test(x) ? `tel:${x.replace(/[^\d+]/g, '')}` : ''));
  const draw = () => {
    list.innerHTML = rows.length ? '' : `<div class="a-empty">${icon('message')}<p>Hozircha xabar yo‘q. Saytdagi “Aloqa” formasi orqali yuborilgan xabarlar shu yerda ko‘rinadi.</p></div>`;
    rows.forEach((m, i) => {
      const link = contactLink(m.contact);
      const el = h('article', { class: 'msg' + (m.is_read ? '' : ' is-new') });
      el.innerHTML = `<div class="msg-head"><div><b>${esc(m.name)}</b>${link ? `<a href="${esc(link)}">${esc(m.contact)}</a>` : `<span>${esc(m.contact)}</span>`}</div><time>${esc(fmtDate(m.created_at))}</time></div>
        <p>${esc(m.message).replace(/\n/g, '<br>')}</p>
        <div class="msg-tools"><button type="button" class="abtn abtn--ghost abtn--sm" data-a="read">${icon(m.is_read ? 'eyeOff' : 'check')}${m.is_read ? 'O‘qilmagan deb belgilash' : 'O‘qildi'}</button>
        <button type="button" class="abtn abtn--ghost abtn--sm abtn--danger" data-a="del">${icon('trash')}O‘chirish</button></div>`;
      el.addEventListener('click', async (e) => {
        const b = e.target.closest('button[data-a]');
        if (!b) return;
        try {
          if (b.dataset.a === 'read') { await q(S.sb.from('messages').update({ is_read: !m.is_read }).eq('id', m.id)); m.is_read = !m.is_read; }
          if (b.dataset.a === 'del') {
            if (!(await confirmDialog('Xabar o‘chirilsinmi?'))) return;
            await q(S.sb.from('messages').delete().eq('id', m.id));
            rows.splice(i, 1);
          }
          draw(); refreshUnread();
        } catch (ex) { fail(ex); }
      });
      list.appendChild(el);
    });
  };
  draw();
  c.querySelector('.a-card-body').appendChild(list);
  content().innerHTML = '';
  content().appendChild(c);
}

// ---------------- Dizayn va mavzular ----------------
const COLOR_LABELS = {
  bg: 'Sahifa foni', surface: 'Kartalar foni', text: 'Asosiy matn', muted: 'Ikkinchi darajali matn',
  primary: 'Asosiy rang (tugmalar)', accent: 'Urg‘u rangi (chiziq, belgi)', heroBg: 'Banner — 1-rang', heroBg2: 'Banner — 2-rang',
  heroText: 'Banner matni', dark: 'To‘q bloklar va footer',
};
const PATTERN_LABELS = { none: 'Naqshsiz', ornament: 'Milliy ornament (girih)', atlas: 'Atlas (ikat)', lines: 'Ingichka chiziqlar', dots: 'Nuqtalar' };
const FABRIC_LABELS = { silk: 'Ipak — kechki ko‘ylak', atlas: 'Atlas — milliy ko‘ylak', velvet: 'Baxmal — “suv parisi”', linen: 'Zig‘ir — midi ko‘ylak', chiffon: 'Shifon — qisqa ko‘ylak' };
const MANNEQUIN_LABELS = { linen: 'Zig‘ir rang', white: 'Oq', black: 'Qora' };

let fontsLoaded = false;
function loadAllFonts() {
  if (fontsLoaded) return;
  fontsLoaded = true;
  const names = Object.keys(FONTS.heading);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?' + names.map((n) => 'family=' + n.replace(/ /g, '+')).join('&') + '&display=swap';
  document.head.appendChild(link);
}

function themePreview(t) {
  const k = normalizeTokens(t.tokens).colors;
  const f = normalizeTokens(t.tokens).fonts;
  return `<div class="th-prev" style="background:linear-gradient(160deg, ${k.heroBg}, ${k.heroBg2}); color:${k.heroText}">
    <span class="th-aa" style="font-family:'${esc(f.heading)}', serif">Aa</span>
    <span class="th-font">${esc(f.heading)} / ${esc(f.body)}</span>
    <div class="th-sw">${['bg', 'surface', 'primary', 'accent', 'text', 'dark'].map((x) => `<i style="background:${k[x]}"></i>`).join('')}</div>
  </div>`;
}

async function viewDesign() {
  setTitle('Dizayn va mavzular');
  loadAllFonts();
  await Promise.all([loadSettings(), loadThemes()]);
  const app0 = S.settings.appearance || {};
  const c1 = card('Umumiy ko‘rinish', 'Animatsiya va effektlarni yoqish yoki o‘chirish');
  const f1 = createForm([
    { key: 'animations', label: 'Animatsiyalar (paydo bo‘lish, harakat)', type: 'toggle', text: 'Yoqilgan', default: true },
    { key: 'three_d', label: '3D maneken (bosh sahifada)', type: 'toggle', text: 'Yoqilgan', default: true },
    { key: 'cursor', label: 'Maxsus kursor effekti', type: 'toggle', text: 'Yoqilgan', default: true },
  ], app0);
  c1.querySelector('.a-card-body').appendChild(f1.el);
  c1.appendChild(saveBar(async () => { await saveSettings('appearance', f1.getValues()); ok('Saqlandi'); }));

  const c2 = card('Mavzular', 'Bitta bosish bilan butun saytning ranglari, shriftlari va naqshlari o‘zgaradi', `<button type="button" class="abtn" data-new>${icon('plus')}Yangi mavzu</button>`);
  const grid = h('div', { class: 'th-grid' });
  const active = activeTheme();
  const draw = () => {
    grid.innerHTML = '';
    S.themes.forEach((t) => {
      const isActive = active && t.id === (activeTheme() || {}).id;
      const el = h('div', { class: 'th-card' + (isActive ? ' is-active' : '') });
      el.innerHTML = `${themePreview(t)}
        <div class="th-body"><b>${esc(tr(t.name) || 'Mavzu')}</b><span>${isActive ? '<em class="pill pill--ok">Faol</em>' : ''}${t.is_builtin ? '<em class="pill">Tayyor</em>' : '<em class="pill pill--alt">Maxsus</em>'}</span></div>
        <div class="th-tools">
          ${isActive ? '' : `<button type="button" class="abtn abtn--sm" data-a="use">${icon('check')}Faollashtirish</button>`}
          <a class="abtn abtn--ghost abtn--sm" href="#/design/${t.id}">${icon('edit')}Tahrirlash</a>
          <button type="button" class="icon-btn" data-a="copy" title="Nusxa olish">${icon('copy')}</button>
          ${t.is_builtin ? '' : `<button type="button" class="icon-btn icon-btn--danger" data-a="del" title="O‘chirish">${icon('trash')}</button>`}
        </div>`;
      el.addEventListener('click', async (e) => {
        const b = e.target.closest('button[data-a]');
        if (!b) return;
        try {
          if (b.dataset.a === 'use') { await saveSettings('appearance', { active_theme: t.id }); applyTheme(t.tokens, { persist: false }); ok(`“${tr(t.name)}” mavzusi faollashtirildi`); draw(); }
          if (b.dataset.a === 'copy') {
            const name = { uz: `${tr(t.name, 'uz')} (nusxa)`, ru: `${tr(t.name, 'ru')} (копия)`, en: `${tr(t.name, 'en')} (copy)` };
            const created = await q(S.sb.from('themes').insert({ name, tokens: t.tokens, is_builtin: false, sort_order: 100 + S.themes.length }).select().single());
            S.themes.push(created); draw(); ok('Nusxa yaratildi');
          }
          if (b.dataset.a === 'del') {
            if ((activeTheme() || {}).id === t.id) { toast('Faol mavzuni o‘chirib bo‘lmaydi. Avval boshqasini faollashtiring.', 'error'); return; }
            if (!(await confirmDialog(`“${tr(t.name)}” mavzusi o‘chirilsinmi?`))) return;
            await q(S.sb.from('themes').delete().eq('id', t.id));
            S.themes = S.themes.filter((x) => x.id !== t.id); draw(); ok('O‘chirildi');
          }
        } catch (ex) { fail(ex); }
      });
      grid.appendChild(el);
    });
  };
  draw();
  c2.querySelector('.a-card-body').appendChild(grid);
  c2.querySelector('[data-new]').addEventListener('click', async () => {
    try {
      const base = activeTheme() || { tokens: PRESETS[0].tokens };
      const created = await q(S.sb.from('themes').insert({ name: { uz: 'Yangi mavzu', ru: 'Новая тема', en: 'New theme' }, tokens: base.tokens, is_builtin: false, sort_order: 100 + S.themes.length }).select().single());
      location.hash = `#/design/${created.id}`;
    } catch (ex) { fail(ex); }
  });
  const wrap = h('div', { class: 'a-stack' });
  wrap.append(c2, c1);
  content().innerHTML = '';
  content().appendChild(wrap);
}

async function viewThemeEdit(id) {
  loadAllFonts();
  await Promise.all([loadSettings(), loadThemes()]);
  const th = S.themes.find((t) => t.id === id);
  if (!th) { location.hash = '#/design'; return; }
  setTitle('Mavzuni tahrirlash');
  const tk = normalizeTokens(th.tokens);
  const flat = { name: th.name, ...Object.fromEntries(Object.entries(tk.colors).map(([k, v]) => ['c_' + k, v])), heading: tk.fonts.heading, body: tk.fonts.body, radius: tk.radius, pattern: tk.pattern, fabric: tk.fabric, mannequin: tk.mannequin, dark: tk.dark };
  const fontOpts = (list) => Object.keys(list).map((n) => ({ value: n, label: n }));
  const form = createForm([
    { key: 'name', label: 'Mavzu nomi', type: 'i18n', required: true },
    { type: 'group', label: 'Ranglar' },
    ...Object.keys(COLOR_LABELS).map((k) => ({ key: 'c_' + k, label: COLOR_LABELS[k], type: 'color' })),
    { type: 'group', label: 'Shriftlar va shakl' },
    { key: 'heading', label: 'Sarlavhalar shrifti', type: 'select', options: fontOpts(FONTS.heading) },
    { key: 'body', label: 'Matn shrifti', type: 'select', options: fontOpts(FONTS.body) },
    { key: 'radius', label: 'Burchaklar yumaloqligi', type: 'range', min: 0, max: 36, unit: 'px' },
    { key: 'pattern', label: 'Fon naqshi', type: 'select', options: PATTERNS.map((p) => ({ value: p, label: PATTERN_LABELS[p] })) },
    { key: 'dark', label: 'To‘q (qorong‘i) mavzu', type: 'toggle', text: 'Ha' },
    { type: 'group', label: '3D maneken' },
    { key: 'fabric', label: 'Libos matosi va bichimi', type: 'select', options: Object.keys(FABRIC_LABELS).map((p) => ({ value: p, label: FABRIC_LABELS[p] })) },
    { key: 'mannequin', label: 'Maneken rangi', type: 'select', options: Object.keys(MANNEQUIN_LABELS).map((p) => ({ value: p, label: MANNEQUIN_LABELS[p] })) },
  ], flat);
  const tokensFrom = () => {
    const v = form.getValues();
    const colors = {};
    Object.keys(COLOR_LABELS).forEach((k) => { colors[k] = v['c_' + k]; });
    return normalizeTokens({ colors, fonts: { heading: v.heading, body: v.body }, radius: v.radius, pattern: v.pattern, fabric: v.fabric, mannequin: v.mannequin, dark: v.dark });
  };
  const layout = h('div', { class: 'th-edit' });
  const left = card(esc(tr(th.name)), th.is_builtin ? 'Tayyor mavzu — o‘zgartirishlarni istalgan vaqtda asl holiga qaytarish mumkin' : 'Maxsus mavzu', `<a class="abtn abtn--ghost abtn--sm" href="#/design">${icon('arrowLeft')}Mavzular</a>`);
  left.querySelector('.a-card-body').appendChild(form.el);
  const right = h('div', { class: 'th-preview' }, `<div class="th-preview-bar"><span>${icon('eye')}Jonli ko‘rinish</span><div class="th-dev"><button type="button" class="is-active" data-w="100%">Kompyuter</button><button type="button" data-w="390px">Telefon</button></div></div><div class="th-frame-wrap"><iframe title="Ko‘rinish" src="/?preview=1"></iframe></div>`);
  const iframe = right.querySelector('iframe');
  const push = () => { try { iframe.contentWindow.postMessage({ type: 'ms-theme-preview', tokens: tokensFrom() }, location.origin); } catch (e) { /* hali yuklanmagan */ } };
  iframe.addEventListener('load', () => setTimeout(push, 600));
  const onReady = (e) => { if (e.origin === location.origin && e.data && e.data.type === 'ms-preview-ready') push(); };
  window.addEventListener('message', onReady);
  window.addEventListener('hashchange', () => window.removeEventListener('message', onReady), { once: true });
  let tm;
  form.el.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(push, 120); });
  form.el.addEventListener('change', () => { clearTimeout(tm); tm = setTimeout(push, 120); });
  right.querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => {
    right.querySelectorAll('[data-w]').forEach((x) => x.classList.toggle('is-active', x === b));
    iframe.style.width = b.dataset.w;
  }));
  layout.append(left, right);
  const preset = th.is_builtin ? PRESETS.find((p) => p.slug === th.slug) : null;
  const extra = preset ? '<button type="button" class="abtn abtn--ghost" data-reset>' + icon('refresh') + 'Asl holiga qaytarish</button>' : '';
  const bar = saveBar(async () => {
    if (!form.validate()) return false;
    const tokens = tokensFrom();
    await q(S.sb.from('themes').update({ name: form.getValues().name, tokens }).eq('id', th.id));
    th.tokens = tokens; th.name = form.getValues().name;
    if ((activeTheme() || {}).id === th.id) applyTheme(tokens, { persist: false });
    ok('Mavzu saqlandi');
  }, extra + `<button type="button" class="abtn abtn--ghost" data-activate>${icon('check')}Saqlash va faollashtirish</button>`);
  bar.querySelector('[data-activate]').addEventListener('click', async () => {
    try {
      if (!form.validate()) return;
      const tokens = tokensFrom();
      await q(S.sb.from('themes').update({ name: form.getValues().name, tokens }).eq('id', th.id));
      th.tokens = tokens;
      await saveSettings('appearance', { active_theme: th.id });
      applyTheme(tokens, { persist: false });
      S.dirty = false;
      ok('Saqlandi va faollashtirildi');
    } catch (ex) { fail(ex); }
  });
  const rb = bar.querySelector('[data-reset]');
  if (rb) rb.addEventListener('click', async () => {
    if (!(await confirmDialog('Mavzu asl ranglari va shriftlariga qaytarilsinmi?', 'Qaytarish'))) return;
    try {
      await q(S.sb.from('themes').update({ tokens: preset.tokens, name: preset.name }).eq('id', th.id));
      S.dirty = false;
      ok('Asl holiga qaytarildi');
      route();
    } catch (ex) { fail(ex); }
  });
  const wrap = h('div', { class: 'a-stack' });
  wrap.append(layout, bar);
  content().innerHTML = '';
  content().appendChild(wrap);
  markDirty(form.el);
}

// ---------------- Sozlamalar ----------------
async function viewSettings() {
  setTitle('Sozlamalar');
  await loadSettings();
  const c1 = card('Sayt ma’lumotlari');
  const f1 = createForm([
    { key: 'site_name', label: 'Sayt nomi (brend)', type: 'text', required: true },
    { key: 'logo_url', label: 'Logotip (ixtiyoriy, fonsiz PNG yoki SVG)', type: 'image', folder: 'brand', editorMode: 'nobg', accept: 'image/png,image/jpeg,image/webp,image/svg+xml' },
    { key: 'tagline', label: 'Qisqa shior (brauzer sarlavhasida)', type: 'i18n' },
    { key: 'seo_description', label: 'Qidiruv tizimlari uchun tavsif', type: 'i18n', multiline: true, rows: 3 },
    { key: 'footer_text', label: 'Pastki qismdagi matn', type: 'i18n' },
  ], S.settings.general);
  c1.querySelector('.a-card-body').appendChild(f1.el);
  c1.appendChild(saveBar(async () => { if (!f1.validate()) return false; await saveSettings('general', f1.getValues()); ok('Saqlandi'); }));

  const c2 = card('Parolni o‘zgartirish', `Kirish: ${esc(S.user?.email || '')}`);
  const f2 = createForm([
    { key: 'p1', label: 'Yangi parol (kamida 8 belgi)', type: 'text', inputType: 'password' },
    { key: 'p2', label: 'Yangi parolni takrorlang', type: 'text', inputType: 'password' },
  ], {});
  c2.querySelector('.a-card-body').appendChild(f2.el);
  const pbar = saveBar(async () => {
    const { p1, p2 } = f2.getValues();
    if (p1.length < 8) { toast('Parol kamida 8 belgidan iborat bo‘lsin', 'error'); return false; }
    if (p1 !== p2) { toast('Parollar mos kelmadi', 'error'); return false; }
    const { error } = await S.sb.auth.updateUser({ password: p1 });
    if (error) throw error;
    f2.ctrls.p1.set(''); f2.ctrls.p2.set('');
    ok('Parol o‘zgartirildi');
  });
  pbar.querySelector('[data-save]').innerHTML = `${icon('check')}Parolni yangilash`;
  c2.appendChild(pbar);
  const wrap = h('div', { class: 'a-stack' });
  wrap.append(c1, c2);
  content().innerHTML = '';
  content().appendChild(wrap);
  markDirty(f1.el);
}

// ---------------- Ishga tushirish ----------------
async function init() {
  app.innerHTML = '<div class="a-loading a-loading--full"><span class="spinner"></span><p>Admin panel yuklanmoqda…</p></div>';
  try {
    S.sb = await getClient();
  } catch (e) {
    app.innerHTML = `<div class="login"><div class="login-card"><h1>Ulanib bo‘lmadi</h1><p class="muted">Supabase kutubxonasini yuklab bo‘lmadi. Internet aloqasini tekshirib, sahifani yangilang.</p><button class="abtn" onclick="location.reload()">Qayta urinish</button></div></div>`;
    return;
  }
  try {
    const { data } = await S.sb.auth.getSession();
    if (data.session) { S.user = data.session.user; await afterLogin(); return; }
  } catch (e) { console.warn(e); }
  renderLogin();
}

init();
