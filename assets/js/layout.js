// Sahifa karkasi: header, mobil menyu, til tanlagich, footer, preloader, sahifa o'tishlari
import { LANGS, getLang, setLang, t, tr } from './i18n.js';
import { loadSite, peekCache } from './api.js';
import { applyTheme } from './theme.js';
import { DEFAULT_SETTINGS, PRESETS } from './defaults.js';
import { esc, icon, safeUrl, socialUrl, telHref, $, $$ } from './utils.js';
import { initAll, setAnimations, initCursor } from './anim.js';

const NAV = [
  { key: 'home', href: '/', label: 'nav_home' },
  { key: 'about', href: '/about', label: 'nav_about' },
  { key: 'projects', href: '/projects', label: 'nav_projects' },
  { key: 'research', href: '/research', label: 'nav_research' },
  { key: 'contact', href: '/contact', label: 'nav_contact' },
];

let state = { site: null, page: '', render: null };

function brandHtml(general) {
  const logo = safeUrl(general.logo_url);
  const name = esc(general.site_name || 'Maison Shaydo');
  return `<a class="brand" href="/" aria-label="${name}">
    ${logo ? `<img class="brand-logo" src="${esc(logo)}" alt="">` : `<span class="brand-star">${icon('star')}</span>`}
    <span class="brand-name">${name}</span></a>`;
}

function langMenuHtml(cls = '') {
  const cur = getLang();
  const curL = LANGS.find((l) => l.code === cur) || LANGS[0];
  return `<div class="lang ${cls}">
    <button class="lang-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="${esc(t('language'))}">
      ${icon('globe')}<span>${curL.short}</span>${icon('chevronDown', 'lang-chev')}
    </button>
    <ul class="lang-menu" role="menu">
      ${LANGS.map((l) => `<li role="none"><button type="button" role="menuitemradio" aria-checked="${l.code === cur}" data-lang="${l.code}" class="${l.code === cur ? 'is-active' : ''}"><b>${l.short}</b><span>${esc(l.label)}</span></button></li>`).join('')}
    </ul>
  </div>`;
}

function headerHtml(site) {
  const g = site.settings.general;
  return `<div class="container header-inner">
    ${brandHtml(g)}
    <nav class="main-nav" aria-label="${esc(t('menu'))}">
      ${NAV.map((n) => `<a href="${n.href}" class="${n.key === state.page ? 'is-active' : ''}" ${n.key === state.page ? 'aria-current="page"' : ''}>${esc(t(n.key === 'about' ? 'nav_about_short' : n.label))}</a>`).join('')}
    </nav>
    <div class="header-actions">
      ${langMenuHtml()}
      <button class="burger" type="button" aria-label="${esc(t('menu'))}" aria-expanded="false" aria-controls="mobile-menu"><span></span><span></span></button>
    </div>
  </div>`;
}

function mobileMenuHtml(site) {
  const c = site.settings.contact;
  return `<div class="mobile-menu-inner">
    <nav class="mobile-nav" aria-label="${esc(t('menu'))}">
      ${NAV.map((n, i) => `<a href="${n.href}" style="--i:${i}" class="${n.key === state.page ? 'is-active' : ''}"><small>0${i + 1}</small>${esc(t(n.label))}</a>`).join('')}
    </nav>
    <div class="mobile-menu-foot">
      <div class="mobile-langs">${LANGS.map((l) => `<button type="button" data-lang="${l.code}" class="${l.code === getLang() ? 'is-active' : ''}">${l.short}</button>`).join('')}</div>
      ${c.phone ? `<a href="${telHref(c.phone)}">${esc(c.phone)}</a>` : ''}
      ${c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ''}
    </div>
  </div>`;
}

export function socialsHtml(c, cls = 'socials') {
  const items = ['instagram', 'telegram', 'facebook', 'youtube']
    .map((k) => ({ k, url: socialUrl(k, c[k]) })).filter((x) => x.url);
  if (!items.length) return '';
  return `<div class="${cls}">${items.map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener" aria-label="${x.k}">${icon(x.k)}</a>`).join('')}</div>`;
}

function footerHtml(site) {
  const g = site.settings.general;
  const c = site.settings.contact;
  const year = new Date().getFullYear();
  return `<div class="container footer-grid">
      <div class="footer-brand">
        ${brandHtml(g)}
        <p>${esc(tr(g.footer_text))}</p>
        ${socialsHtml(c)}
      </div>
      <div class="footer-col">
        <h4>${esc(t('menu'))}</h4>
        ${NAV.map((n) => `<a href="${n.href}">${esc(t(n.label))}</a>`).join('')}
      </div>
      <div class="footer-col">
        <h4>${esc(t('nav_contact'))}</h4>
        ${c.phone ? `<a href="${telHref(c.phone)}">${icon('phone')}${esc(c.phone)}</a>` : ''}
        ${c.email ? `<a href="mailto:${esc(c.email)}">${icon('mail')}${esc(c.email)}</a>` : ''}
        ${tr(c.address) ? `<span>${icon('pin')}${esc(tr(c.address))}</span>` : ''}
        ${tr(c.hours) ? `<span>${icon('clock')}${esc(tr(c.hours))}</span>` : ''}
      </div>
    </div>
    <div class="footer-mark" aria-hidden="true">${esc(g.site_name || 'Maison Shaydo')}</div>
    <div class="container footer-bottom">
      <span>© ${year} ${esc(g.site_name || '')}. ${esc(t('all_rights'))}</span>
      <a class="footer-admin" href="/admin" rel="nofollow">Admin</a>
    </div>`;
}

function bindHeader() {
  const header = $('#site-header');
  const menu = $('#mobile-menu');
  const burger = $('.burger', header);
  const setMenu = (open) => {
    document.documentElement.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('is-open')); }
    else { menu.classList.remove('is-open'); setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 450); }
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('.mobile-nav a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));

  $$('.lang', header).forEach((wrap) => {
    const btn = $('.lang-btn', wrap);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = !wrap.classList.contains('is-open');
      wrap.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });
  $$('[data-lang]').forEach((b) => b.addEventListener('click', () => { setLang(b.dataset.lang); setMenu(false); }));
}

document.addEventListener('click', () => {
  $$('.lang.is-open').forEach((w) => { w.classList.remove('is-open'); const b = $('.lang-btn', w); if (b) b.setAttribute('aria-expanded', 'false'); });
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    $$('.lang.is-open').forEach((w) => w.classList.remove('is-open'));
    if (document.documentElement.classList.contains('menu-open')) $('.burger')?.click();
  }
});

// Footerdagi katta yozuv har qanday nom uzunligida ekranga sig'adi
function fitFooterMark() {
  const m = document.querySelector('.footer-mark');
  if (!m) return;
  m.style.fontSize = '';
  const sw = m.scrollWidth; const cw = m.clientWidth;
  if (cw && sw > cw) m.style.fontSize = `${(parseFloat(getComputedStyle(m).fontSize) * cw) / sw * 0.97}px`;
}
let fitTimer = 0;
window.addEventListener('resize', () => { clearTimeout(fitTimer); fitTimer = setTimeout(fitFooterMark, 150); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitFooterMark);

function renderChrome() {
  const site = state.site;
  const header = $('#site-header');
  header.innerHTML = headerHtml(site);
  $('#mobile-menu').innerHTML = mobileMenuHtml(site);
  $('#site-footer').innerHTML = footerHtml(site);
  fitFooterMark();
  bindHeader();
  const g = site.settings.general;
  const pageTitle = document.body.dataset.title ? t(document.body.dataset.title) : '';
  if (!state.customTitle) document.title = pageTitle ? `${pageTitle} — ${g.site_name}` : `${g.site_name} — ${tr(g.tagline)}`;
  let md = document.querySelector('meta[name="description"]');
  if (md) md.content = tr(g.seo_description);
}

export function setPageTitle(title) {
  state.customTitle = true;
  document.title = `${title} — ${state.site?.settings?.general?.site_name || ''}`;
}

function onHeaderScroll() {
  const h = $('#site-header');
  if (!h) return;
  h.classList.toggle('is-scrolled', window.scrollY > 30);
}
window.addEventListener('scroll', onHeaderScroll, { passive: true });

// Ichki havolalarda yumshoq sahifa o'tishi
function bindTransitions() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download') || a.dataset.noTransition !== undefined) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    let url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
    if (document.documentElement.classList.contains('no-anim')) return;
    e.preventDefault();
    document.documentElement.classList.add('is-leaving');
    setTimeout(() => { location.href = url.href; }, 380);
  });
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) document.documentElement.classList.remove('is-leaving');
  });
}

function hidePreloader() {
  const pl = $('#preloader');
  if (!pl) return;
  pl.classList.add('is-done');
  setTimeout(() => pl.remove(), 900);
  try { sessionStorage.setItem('ms_seen', '1'); } catch (e) { /* e'tiborsiz */ }
}

function ensureShell() {
  if (!$('#site-header')) {
    const h = document.createElement('header');
    h.id = 'site-header';
    h.className = 'site-header';
    document.body.prepend(h);
  }
  if (!$('#mobile-menu')) {
    const m = document.createElement('div');
    m.id = 'mobile-menu';
    m.className = 'mobile-menu';
    m.hidden = true;
    $('#site-header').after(m);
  }
  if (!$('#site-footer')) {
    const f = document.createElement('footer');
    f.id = 'site-footer';
    f.className = 'site-footer';
    document.body.appendChild(f);
  }
  if (!$('#scroll-progress')) {
    const p = document.createElement('div');
    p.id = 'scroll-progress';
    p.className = 'scroll-progress';
    document.body.appendChild(p);
  }
  if (!$('.page-curtain')) {
    const c = document.createElement('div');
    c.className = 'page-curtain';
    c.setAttribute('aria-hidden', 'true');
    document.body.appendChild(c);
  }
  let seen = false;
  try { seen = sessionStorage.getItem('ms_seen') === '1'; } catch (e) { /* e'tiborsiz */ }
  const pl = $('#preloader');
  if (pl && seen) pl.remove();
}

// Admin paneldan jonli ko'rish (iframe) uchun mavzu xabarlari
function listenPreview() {
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin) return;
    const d = e.data;
    if (d && d.type === 'ms-theme-preview' && d.tokens) applyTheme(d.tokens, { persist: false });
  });
}

/**
 * Sahifani ishga tushirish.
 * @param {string} page - joriy sahifa kaliti
 * @param {(ctx:{site:object, first:boolean}) => Promise<void>|void} render - sahifa kontentini chizish
 */
export async function boot(page, render) {
  state.page = page;
  state.render = render;
  ensureShell();
  bindTransitions();
  listenPreview();
  document.body.classList.add('page-' + page);

  // Keshdan tezkor ko'rinish
  const cachedSite = peekCache('site');
  state.site = cachedSite || { settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)), theme: PRESETS[0] };
  setAnimations(state.site.settings.appearance?.animations !== false);
  renderChrome();
  onHeaderScroll();

  const fresh = await loadSite();
  state.site = fresh;
  const app = fresh.settings.appearance || {};
  applyTheme(fresh.theme?.tokens);
  setAnimations(app.animations !== false);
  renderChrome();
  try {
    await render({ site: fresh, first: true });
  } catch (err) {
    console.error(err);
    const main = $('#main');
    if (main && !main.innerHTML.trim()) main.innerHTML = `<div class="container page-error"><p>${esc(t('error_load'))}</p></div>`;
  }
  initAll();
  initCursor(app.cursor !== false);
  setTimeout(hidePreloader, 250);
  document.documentElement.classList.add('is-ready');
  if (window.parent !== window) {
    try { window.parent.postMessage({ type: 'ms-preview-ready' }, location.origin); } catch (e) { /* e'tiborsiz */ }
  }

  window.addEventListener('langchange', async () => {
    renderChrome();
    try { await render({ site: state.site, first: false }); } catch (err) { console.error(err); }
    initAll();
  });
}

export function getSite() { return state.site; }
