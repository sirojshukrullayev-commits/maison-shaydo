// Loyihalar (portfolio) sahifasi: toifa, yil va qidiruv bo'yicha saralash
import { boot } from '../layout.js';
import { t, tr } from '../i18n.js';
import { listCategories, listProjects } from '../api.js';
import { esc, icon, debounce, $, $$ } from '../utils.js';
import { pageHero, workCard } from '../components.js';
import { initTilt } from '../anim.js';

const params = new URLSearchParams(location.search);
const filter = { cat: params.get('cat') || 'all', year: params.get('year') || 'all', q: params.get('q') || '' };

function syncUrl() {
  const p = new URLSearchParams();
  if (filter.cat !== 'all') p.set('cat', filter.cat);
  if (filter.year !== 'all') p.set('year', filter.year);
  if (filter.q) p.set('q', filter.q);
  const qs = p.toString();
  history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
}

function apply(projects, cats) {
  const grid = $('#proj-grid');
  const cat = cats.find((c) => c.slug === filter.cat);
  const q = filter.q.trim().toLowerCase();
  const list = projects.filter((p) => {
    if (filter.cat !== 'all' && (!cat || p.category_id !== cat.id)) return false;
    if (filter.year !== 'all' && String(p.year) !== filter.year) return false;
    if (q) {
      const hay = [p.title, p.description, p.fabric].map((x) => Object.values(x || {}).join(' ')).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  grid.innerHTML = list.length
    ? list.map((p, i) => workCard(p, cats, i, { cls: 'proj-card-anim' })).join('')
    : `<div class="empty" style="grid-column:1/-1">${icon('search')}<p>${esc(t('no_results'))}</p>
       <button class="btn btn--ghost btn--sm" type="button" id="reset-filters">${esc(t('reset'))}</button></div>`;
  initTilt(grid);
  $$('.chip', document).forEach((c) => c.classList.toggle('is-active', c.dataset.cat === filter.cat));
  const rf = $('#reset-filters');
  if (rf) rf.addEventListener('click', () => {
    filter.cat = 'all'; filter.year = 'all'; filter.q = '';
    $('#f-year').value = 'all'; $('#f-q').value = '';
    syncUrl(); apply(projects, cats);
  });
}

async function render() {
  const main = document.getElementById('main');
  let cats = []; let projects = [];
  try {
    [cats, projects] = await Promise.all([listCategories(), listProjects()]);
  } catch (e) {
    main.innerHTML = `${pageHero({ label: t('projects_label'), title: t('projects_title') })}<div class="container page-error"><p>${esc(t('error_load'))}</p></div>`;
    return;
  }
  const years = [...new Set(projects.map((p) => p.year).filter(Boolean))].sort((a, b) => b - a);
  const countBy = (id) => projects.filter((p) => p.category_id === id).length;
  if (filter.cat !== 'all' && !cats.some((c) => c.slug === filter.cat)) filter.cat = 'all';

  main.innerHTML = `
  ${pageHero({ label: t('projects_label'), title: t('projects_title'), text: t('projects_text'), count: String(projects.length).padStart(2, '0') })}
  <div class="filters">
    <div class="container filters-inner">
      <div class="chips" role="group" aria-label="${esc(t('category'))}">
        <button type="button" class="chip" data-cat="all">${esc(t('all'))} <small>${projects.length}</small></button>
        ${cats.map((c) => `<button type="button" class="chip" data-cat="${esc(c.slug)}">${esc(tr(c.name))} <small>${countBy(c.id)}</small></button>`).join('')}
      </div>
      <div class="filter-tools">
        <select class="select" id="f-year" aria-label="${esc(t('year'))}">
          <option value="all">${esc(t('all_years'))}</option>
          ${years.map((y) => `<option value="${y}" ${String(y) === filter.year ? 'selected' : ''}>${y}</option>`).join('')}
        </select>
        <label class="search-wrap">${icon('search')}<span class="sr-only">${esc(t('search'))}</span>
          <input class="search" id="f-q" type="search" placeholder="${esc(t('search'))}" value="${esc(filter.q)}"></label>
      </div>
    </div>
  </div>
  <section class="section" style="padding-top:0">
    <div class="container"><div class="proj-grid" id="proj-grid"></div></div>
  </section>`;

  $$('.chip', main).forEach((c) => c.addEventListener('click', () => { filter.cat = c.dataset.cat; syncUrl(); apply(projects, cats); }));
  $('#f-year').addEventListener('change', (e) => { filter.year = e.target.value; syncUrl(); apply(projects, cats); });
  $('#f-q').addEventListener('input', debounce((e) => { filter.q = e.target.value; syncUrl(); apply(projects, cats); }, 220));
  apply(projects, cats);
}

boot('projects', render);
