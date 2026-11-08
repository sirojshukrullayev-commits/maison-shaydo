// Ilmiy ishlar sahifasi
import { boot } from '../layout.js';
import { t, tr } from '../i18n.js';
import { listResearch } from '../api.js';
import { esc, icon, safeUrl, paragraphs } from '../utils.js';
import { pageHero } from '../components.js';

async function render() {
  const main = document.getElementById('main');
  let list = [];
  try { list = await listResearch(); } catch (e) {
    main.innerHTML = `${pageHero({ label: t('research_label'), title: t('research_title') })}<div class="container page-error"><p>${esc(t('error_load'))}</p></div>`;
    return;
  }
  main.innerHTML = `
  ${pageHero({ label: t('research_label'), title: t('research_title'), text: t('research_text'), count: String(list.length).padStart(2, '0') })}
  <section class="section">
    <div class="container">
      ${list.length ? `<div class="research-list">
        ${list.map((r) => {
          const pdf = safeUrl(r.file_url);
          const link = safeUrl(r.link_url);
          return `<article class="research-card" id="r-${esc(r.id)}" data-reveal="up">
            <div class="research-year">${esc(r.year || '')}</div>
            <div>
              ${tr(r.venue) ? `<span class="research-venue">${icon('book')}${esc(tr(r.venue))}</span>` : ''}
              <h2>${esc(tr(r.title))}</h2>
              ${paragraphs(tr(r.summary))}
              ${pdf || link ? `<div class="research-actions">
                ${pdf ? `<a class="btn btn--primary btn--sm" href="${esc(pdf)}" target="_blank" rel="noopener" download>${icon('download')}${esc(t('download_pdf'))}</a>` : ''}
                ${link ? `<a class="btn btn--ghost btn--sm" href="${esc(link)}" target="_blank" rel="noopener">${icon('external')}${esc(t('open_link'))}</a>` : ''}
              </div>` : ''}
            </div>
          </article>`;
        }).join('')}
      </div>` : `<div class="empty">${icon('book')}<p>${esc(t('empty'))}</p></div>`}
    </div>
  </section>`;
  if (location.hash) {
    const el = document.getElementById(location.hash.slice(1));
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400);
  }
}

boot('research', render);
