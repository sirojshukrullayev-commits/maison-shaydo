// Bosh sahifa
import { boot } from '../layout.js';
import { t, tr } from '../i18n.js';
import { listCategories, listProjects, listResearch, listAchievements } from '../api.js';
import { esc, icon, safeUrl, isTouch } from '../utils.js';
import { getTokens } from '../theme.js';
import { animationsEnabled } from '../anim.js';
import { workCard } from '../components.js';

let mannequin = null;
let figureMode = '';

function heroTextHtml(s, counts) {
  const hero = s.hero;
  const word = tr(hero.word) || 'STYLE';
  return `
    <div class="hero-word" aria-hidden="true"><span class="hero-word-inner" data-split="chars">${esc(word)}</span></div>
    <div class="hero-intro" data-reveal="up" style="--d:.6s">
      <span class="eyebrow eyebrow--left">${esc(tr(hero.eyebrow))}</span>
      <h1>${esc(tr(s.about.name))}</h1>
      <a class="btn btn--light" href="/projects" data-magnetic>${esc(t('nav_projects'))}${icon('arrowRight')}</a>
    </div>
    ${tr(hero.side_text) ? `<p class="hero-side" data-reveal="fade" style="--d:.9s">${esc(tr(hero.side_text))}</p>` : ''}
    ${figureMode === '3d' ? `<div class="hero-hint" data-reveal="fade" style="--d:1.2s">${icon('refresh')}<span>${esc(t('rotate_hint'))}</span></div>` : ''}
    <span class="hero-scroll" aria-hidden="true"></span>
    <div class="hero-bar" data-reveal="up" style="--d:.8s">
      <div class="hero-stat">${icon('grid')}<div><b data-count="${counts.projects}">0</b><span>${esc(t('projects_count'))}</span></div></div>
      <div class="hero-stat">${icon('scissors')}<div><b data-count="${counts.years}" data-suffix="+">0</b><span>${esc(t('experience'))}</span></div></div>
      <div class="hero-stat">${icon('book')}<div><b data-count="${counts.research}">0</b><span>${esc(t('research_count'))}</span></div></div>
      <div class="hero-stat">${icon('award')}<div><b data-count="${counts.awards}">0</b><span>${esc(t('awards_count'))}</span></div></div>
    </div>`;
}

async function setupFigure(site) {
  const fig = document.getElementById('hero-figure');
  const hero = site.settings.hero || {};
  const app = site.settings.appearance || {};
  const img = safeUrl(hero.image_url);
  const fallback = () => {
    figureMode = 'image';
    fig.innerHTML = `<img class="hero-cutout" src="/assets/img/hero-fallback.svg" alt="">`;
  };
  if (hero.mode === 'image' && img) {
    figureMode = 'image';
    fig.innerHTML = `<img class="hero-cutout" src="${esc(img)}" alt="${esc(tr(site.settings.about.name))}">`;
    return;
  }
  if (app.three_d === false) { fallback(); return; }
  figureMode = '3d';
  try {
    const mod = await import('../three/mannequin.js');
    if (!mod.webglAvailable()) throw new Error('webgl');
    mannequin = mod.createMannequin(fig, {
      tokens: getTokens(), fit: window.innerWidth < 700 ? 0.8 : 0.9, offsetY: window.innerWidth < 700 ? -0.12 : 0,
      animate: true, autoRotate: animationsEnabled(), parallax: !isTouch(), particles: true,
    });
    fig.classList.add('is-in');
  } catch (err) {
    console.warn('3D yuklanmadi, rasm ko‘rsatiladi:', err && err.message);
    fallback();
    const hint = document.querySelector('.hero-hint');
    if (hint) hint.remove();
  }
}

function bindHeroParallax() {
  const hero = document.getElementById('hero');
  if (!hero || isTouch() || !animationsEnabled()) return;
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    const w = hero.querySelector('.hero-word-inner');
    if (w) { w.style.setProperty('--wx', `${(-x * 30).toFixed(1)}px`); w.style.setProperty('--wy', `${(-y * 16).toFixed(1)}px`); }
    const img = hero.querySelector('.hero-cutout');
    if (img) { img.style.setProperty('--fx', `${(x * 18).toFixed(1)}px`); img.style.setProperty('--fy', `${(y * 8).toFixed(1)}px`); }
  });
}

function sectionsHtml(s, data) {
  const { cats, projects, research } = data;
  const home = s.home || {};
  const countBy = (id) => projects.filter((p) => p.category_id === id).length;
  const featured = (projects.filter((p) => p.is_featured).length ? projects.filter((p) => p.is_featured) : projects).slice(0, 4);
  const fabrics = [...new Set(projects.map((p) => tr(p.fabric)).filter(Boolean))];
  const words = fabrics.length >= 3 ? fabrics : ['Atlas', 'Adras', 'Ipak', 'Baxmal', 'Shifon', 'Zig‘ir'];
  const marqueeItems = [...words, ...words].map((w) => `<span class="marquee-item">${esc(w)}${icon('star')}</span>`).join('');
  const welcomeImg = safeUrl(home.welcome_image) || '/assets/img/demo/atelier.svg';

  return `
  ${cats.length ? `<section class="section" id="categories">
    <div class="container">
      <div class="section-head">
        <span class="eyebrow" data-reveal="fade">${esc(tr(home.categories_label))}</span>
        <h2 data-split>${esc(tr(home.categories_title))}</h2>
        <p data-reveal="up">${esc(tr(home.categories_text))}</p>
      </div>
      <div class="cat-grid" data-stagger="0.1">
        ${cats.map((c) => `<a class="cat-card" href="/projects?cat=${encodeURIComponent(c.slug)}" data-tilt="7" data-cursor="${esc(t('view'))}">
          <img src="${esc(safeUrl(c.image_url) || '/assets/img/demo/cat-kechki.svg')}" alt="${esc(tr(c.name))}" loading="lazy">
          <span class="cat-count">${countBy(c.id)} ${esc(t('items'))}</span>
          <span class="cat-label"><span>${esc(tr(c.name))}</span>${icon('arrowRight')}</span>
          <span class="tilt-glare"></span>
        </a>`).join('')}
      </div>
    </div>
  </section>` : ''}

  <section class="section section--tight">
    <div class="container">
      <div class="welcome" data-reveal="up">
        <div class="welcome-media"><img src="${esc(welcomeImg)}" alt="" loading="lazy" data-parallax="0.08"></div>
        <div class="welcome-body">
          <span class="eyebrow">${esc(tr(home.welcome_label))}</span>
          <h2 data-split>${esc(tr(home.welcome_title))}</h2>
          <p>${esc(tr(home.welcome_text))}</p>
          <a class="btn btn--light" href="/about" data-magnetic>${esc(t('nav_about'))}${icon('arrowRight')}</a>
        </div>
      </div>
    </div>
  </section>

  <div class="marquee" aria-hidden="true"><div class="marquee-track">${marqueeItems}</div></div>

  ${featured.length ? `<section class="section">
    <div class="container">
      <div class="section-head section-head--split">
        <div><span class="eyebrow eyebrow--left" data-reveal="fade">${esc(t('featured_label'))}</span><h2 data-split>${esc(t('featured_title'))}</h2></div>
        <a class="link-arrow" href="/projects" data-reveal="fade">${esc(t('view_all'))}${icon('arrowRight')}</a>
      </div>
      <div class="works-grid">
        ${featured.map((p, i) => workCard(p, cats, i, { reveal: true, delay: (i % 2) * 0.12 })).join('')}
      </div>
    </div>
  </section>` : ''}

  ${research.length ? `<section class="section has-pattern">
    <div class="container">
      <div class="section-head section-head--split">
        <div><span class="eyebrow eyebrow--left" data-reveal="fade">${esc(t('research_label'))}</span><h2 data-split>${esc(t('research_latest'))}</h2></div>
        <a class="link-arrow" href="/research" data-reveal="fade">${esc(t('view_all'))}${icon('arrowRight')}</a>
      </div>
      <div class="r-list" data-stagger="0.08">
        ${research.slice(0, 3).map((r) => `<a class="r-row" href="/research#r-${esc(r.id)}">
          <span class="r-year">${esc(r.year || '')}</span>
          <span><span class="r-title">${esc(tr(r.title))}</span><span class="r-venue">${esc(tr(r.venue))}</span></span>
          <span class="r-arrow">${icon('arrowUpRight')}</span>
        </a>`).join('')}
      </div>
    </div>
  </section>` : ''}

  <section class="section section--tight">
    <div class="container">
      <div class="cta" data-reveal="scale">
        <span class="cta-orb cta-orb--1"></span><span class="cta-orb cta-orb--2"></span>
        <span class="eyebrow">${esc(t('cta_label'))}</span>
        <h2 data-split>${esc(t('cta_title'))}</h2>
        <p>${esc(t('cta_text'))}</p>
        <a class="btn btn--primary" href="/contact" data-magnetic>${esc(t('cta_button'))}${icon('arrowRight')}</a>
      </div>
    </div>
  </section>`;
}

async function render({ site, first }) {
  const main = document.getElementById('main');
  const s = site.settings;
  const [cats, projects, research, awards] = await Promise.all([
    listCategories().catch(() => []), listProjects().catch(() => []),
    listResearch().catch(() => []), listAchievements().catch(() => []),
  ]);
  if (first) {
    main.innerHTML = `<div class="hero-wrap"><section class="hero" id="hero" aria-label="${esc(tr(s.hero.eyebrow))}">
        <div class="hero-light"></div><div class="hero-pattern"></div><div class="hero-grain"></div>
        <div class="hero-figure" id="hero-figure"></div>
        <div id="hero-text"></div>
      </section></div>
      <div id="home-sections"></div>`;
    await setupFigure(site);
    bindHeroParallax();
    window.addEventListener('themechange', (e) => { if (mannequin) mannequin.setTokens(e.detail); });
  }
  const counts = {
    projects: projects.length, years: Number(s.about.experience_years) || 0,
    research: research.length, awards: awards.length,
  };
  const textLayer = document.getElementById('hero-text');
  textLayer.innerHTML = heroTextHtml(s, counts);
  // So'z animatsiyasi ketma-ket bo'lishi uchun harflar orasidagi kechikish
  const wordEl = textLayer.querySelector('.hero-word-inner');
  if (wordEl) wordEl.style.setProperty('--d', '0.15s');
  document.getElementById('home-sections').innerHTML = sectionsHtml(s, { cats, projects, research });
}

boot('home', render);
