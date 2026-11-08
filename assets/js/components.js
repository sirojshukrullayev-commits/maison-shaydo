// Bir nechta sahifada ishlatiladigan HTML bo'laklari
import { t, tr } from './i18n.js';
import { esc, safeUrl } from './utils.js';

export function pageHero({ label, title, text = '', count = '', crumbs = '' }) {
  return `<div class="page-hero-wrap"><section class="page-hero">
    <div class="hero-light"></div><div class="hero-pattern"></div><div class="hero-grain"></div>
    <div class="page-hero-inner">
      <div>
        ${crumbs}
        <span class="eyebrow eyebrow--left" data-reveal="fade">${esc(label)}</span>
        <h1 data-split>${esc(title)}</h1>
      </div>
      <div>
        ${count !== '' ? `<div class="page-hero-count" data-reveal="fade" style="--d:.3s">${esc(count)}</div>` : ''}
        ${text ? `<p data-reveal="up" style="--d:.4s">${esc(text)}</p>` : ''}
      </div>
    </div>
  </section></div>`;
}

export function workCard(p, cats, i = 0, { cls = '', reveal = false, delay = 0 } = {}) {
  const cat = cats.find((c) => c.id === p.category_id);
  const img = safeUrl(p.cover_url) || '/assets/img/demo/p-evening.svg';
  return `<a class="work-card ${cls}" ${reveal ? 'data-reveal="up"' : ''} style="--i:${i};--d:${delay}s" href="/project?slug=${encodeURIComponent(p.slug)}" data-cursor="${esc(t('view'))}">
    <div class="work-media" data-tilt="5"><img src="${esc(img)}" alt="${esc(tr(p.title))}" loading="lazy"><span class="work-view">${esc(t('view'))}</span><span class="tilt-glare"></span></div>
    <div class="work-meta"><span>${esc(cat ? tr(cat.name) : '')}</span><span>${esc(p.year || '')}</span></div>
    <h3 class="work-title">${esc(tr(p.title))}</h3>
  </a>`;
}
