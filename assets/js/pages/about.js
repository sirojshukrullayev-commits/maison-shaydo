// Dizayner haqida sahifasi
import { boot } from '../layout.js';
import { t, tr } from '../i18n.js';
import { listProjects, listResearch, listAchievements } from '../api.js';
import { esc, icon, safeUrl, paragraphs, $$ } from '../utils.js';
import { openLightbox } from '../lightbox.js';
import { pageHero } from '../components.js';

async function render({ site }) {
  const main = document.getElementById('main');
  const a = site.settings.about || {};
  const [projects, research, awards] = await Promise.all([
    listProjects().catch(() => []), listResearch().catch(() => []), listAchievements().catch(() => []),
  ]);
  const photo = safeUrl(a.photo_url) || '/assets/img/demo/portrait.svg';
  const skills = Array.isArray(a.skills) ? a.skills.map((s) => tr(s)).filter(Boolean) : [];
  const timeline = Array.isArray(a.timeline) ? a.timeline.filter((x) => x && (x.year || tr(x.title))) : [];
  const years = Number(a.experience_years) || 0;

  main.innerHTML = `
  ${pageHero({ label: t('about_label'), title: tr(a.name), text: tr(a.role) })}

  <section class="section">
    <div class="container about-grid">
      <div class="about-photo" data-reveal="left">
        <div class="about-photo-frame" data-tilt="4"><img src="${esc(photo)}" alt="${esc(tr(a.name))}" data-parallax="0.06"><span class="tilt-glare"></span></div>
        ${years ? `<div class="about-badge"><svg class="about-badge-ring" viewBox="0 0 160 160" aria-hidden="true"><defs><path id="ring" d="M80,80 m-68,0 a68,68 0 1,1 136,0 a68,68 0 1,1 -136,0"/></defs><text font-size="10.5" letter-spacing="3.2" fill="currentColor"><textPath href="#ring">${esc((t('experience') + ' • ').repeat(3).toUpperCase())}</textPath></text></svg><div><b data-count="${years}" data-suffix="+">0</b><span>${esc(t('experience'))}</span></div></div>` : ''}
      </div>
      <div class="about-text">
        <span class="eyebrow eyebrow--left role" data-reveal="fade">${esc(tr(a.role))}</span>
        <h2 data-split>${esc(tr(a.name))}</h2>
        ${tr(a.quote) ? `<blockquote class="quote" data-reveal="up">${esc(tr(a.quote))}</blockquote>` : ''}
        <div class="bio" data-reveal="up">${paragraphs(tr(a.bio))}</div>
        ${skills.length ? `<ul class="skills" data-stagger="0.06">${skills.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
        <div class="stats" data-reveal="up">
          <div class="stat"><b data-count="${projects.length}">0</b><span>${esc(t('projects_count'))}</span></div>
          <div class="stat"><b data-count="${research.length}">0</b><span>${esc(t('research_count'))}</span></div>
          <div class="stat"><b data-count="${awards.length}">0</b><span>${esc(t('awards_count'))}</span></div>
        </div>
      </div>
    </div>
  </section>

  ${timeline.length ? `<section class="section has-pattern">
    <div class="container">
      <div class="section-head">
        <span class="eyebrow" data-reveal="fade">${esc(t('journey_label'))}</span>
        <h2 data-split>${esc(t('journey_title'))}</h2>
      </div>
      <div class="timeline">
        ${timeline.map((x, i) => `<div class="tl-item" data-reveal="${i % 2 ? 'right' : 'left'}">
          <div class="tl-year">${esc(x.year || '')}</div>
          <div class="tl-body"><h3>${esc(tr(x.title))}</h3><p>${esc(tr(x.text))}</p></div>
        </div>`).join('')}
      </div>
    </div>
  </section>` : ''}

  ${awards.length ? `<section class="section" id="awards">
    <div class="container">
      <div class="section-head">
        <span class="eyebrow" data-reveal="fade">${esc(t('awards_label'))}</span>
        <h2 data-split>${esc(t('awards_title'))}</h2>
      </div>
      <div class="awards-grid" data-stagger="0.1">
        ${awards.map((w, i) => {
          const img = safeUrl(w.image_url);
          return `<button type="button" class="award-card" data-award="${i}" data-tilt="5" ${img ? `data-cursor="${esc(t('zoom'))}"` : ''}>
            <div class="award-media">${img ? `<img src="${esc(img)}" alt="${esc(tr(w.title))}" loading="lazy">` : `<span class="award-icon">${icon('award')}</span>`}
              ${w.year ? `<span class="award-year">${esc(w.year)}</span>` : ''}</div>
            <div class="award-body"><h3>${esc(tr(w.title))}</h3>
              ${tr(w.issuer) ? `<p><b>${esc(t('issued_by'))}:</b> ${esc(tr(w.issuer))}</p>` : ''}
              ${tr(w.description) ? `<p>${esc(tr(w.description))}</p>` : ''}</div>
            <span class="tilt-glare"></span>
          </button>`;
        }).join('')}
      </div>
    </div>
  </section>` : ''}`;

  const imgs = awards.map((w) => ({ src: safeUrl(w.image_url), caption: tr(w.title), alt: tr(w.title) }));
  $$('[data-award]', main).forEach((b) => b.addEventListener('click', () => {
    const i = +b.dataset.award;
    const list = imgs.filter((x) => x.src);
    if (!imgs[i].src) return;
    openLightbox(list, list.indexOf(imgs[i]));
  }));
}

boot('about', render);
