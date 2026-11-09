// Bitta loyiha sahifasi: galereya, mato, 3D ko'rinish
import { boot, setPageTitle } from '../layout.js';
import { t, tr } from '../i18n.js';
import { getProject, listProjectImages, listCategories, listProjects } from '../api.js';
import { esc, icon, safeUrl, paragraphs, toast, $, $$ } from '../utils.js';
import { workCard } from '../components.js';
import { openLightbox } from '../lightbox.js';
import { getTokens } from '../theme.js';
import { initTilt } from '../anim.js';

const slug = new URLSearchParams(location.search).get('slug') || '';
let keyNav = null;

function notFound(main) {
  main.innerHTML = `<section class="nf"><div>
    <div class="nf-code">404</div><h1>${esc(t('page_not_found'))}</h1>
    <a class="btn btn--primary" href="/projects">${esc(t('nav_projects'))}${icon('arrowRight')}</a></div></section>`;
}

function open3d(project) {
  const front = safeUrl(project.model_front);
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `<div class="modal-box">
      <button class="modal-close" type="button" aria-label="${esc(t('close'))}">${icon('close')}</button>
      <div class="modal-3d-stage"></div>
      <div class="modal-3d-cap">${front
    ? `<h3>${esc(t('model_3d_title'))}</h3><p>${esc(tr(project.title))} — ${esc(t('model_3d_text'))}</p>`
    : `<h3>${esc(t('fabric_3d_title'))}</h3><p>${esc(tr(project.fabric))} — ${esc(t('fabric_3d_text'))}</p>`}</div>
    </div>`;
  document.body.appendChild(modal);
  document.documentElement.classList.add('modal-open');
  requestAnimationFrame(() => modal.classList.add('is-open'));
  let inst = null;
  const close = () => {
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('modal-open');
    document.removeEventListener('keydown', onKey);
    setTimeout(() => { if (inst) inst.dispose(); modal.remove(); }, 400);
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  modal.querySelector('.modal-close').addEventListener('click', close);
  const stage = modal.querySelector('.modal-3d-stage');
  const showMannequin = () => import('../three/mannequin.js').then((mod) => {
    if (!mod.webglAvailable()) throw new Error('webgl');
    inst = mod.createMannequin(stage, {
      tokens: getTokens(), fit: 0.88, particles: true, autoRotate: true, parallax: false,
      fabricImage: safeUrl(project.fabric_image_url) || null,
    });
  }).catch(() => {
    stage.innerHTML = `<div class="modal-msg"><p>${esc(t('no_3d'))}</p></div>`;
  });
  if (!front) { showMannequin(); return; }
  // Haqiqiy ko'ylak suratidan 3D
  import('../three/photodress.js').then((mod) => {
    if (!mod.webglAvailable()) throw new Error('webgl');
    inst = mod.createPhotoDress(stage, {
      mode: 'fit', animate: true, front, back: safeUrl(project.model_back) || '', config: { motion: true, speed: 40 },
    });
    inst.loaded.catch(() => { if (inst) inst.dispose(); inst = null; showMannequin(); });
  }).catch(() => showMannequin());
}

async function render({ first }) {
  const main = document.getElementById('main');
  if (!slug) { notFound(main); return; }
  let project = null;
  try { project = await getProject(slug); } catch (e) {
    main.innerHTML = `<div class="container page-error"><p>${esc(t('error_load'))}</p></div>`;
    return;
  }
  if (!project) { notFound(main); return; }
  const [images, cats, all] = await Promise.all([
    listProjectImages(project.id).catch(() => []), listCategories().catch(() => []), listProjects().catch(() => []),
  ]);
  const cat = cats.find((c) => c.id === project.category_id);
  const gallery = images.map((im) => ({ src: safeUrl(im.url), caption: tr(im.caption), alt: tr(project.title) })).filter((x) => x.src);
  if (!gallery.length && safeUrl(project.cover_url)) gallery.push({ src: safeUrl(project.cover_url), alt: tr(project.title), caption: '' });
  const idx = all.findIndex((p) => p.id === project.id);
  const prev = idx > 0 ? all[idx - 1] : all[all.length - 1];
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : all[0];
  const related = all.filter((p) => p.id !== project.id && p.category_id === project.category_id).slice(0, 3);
  const fabricImg = safeUrl(project.fabric_image_url);
  setPageTitle(tr(project.title));

  main.innerHTML = `
  <section class="pd">
    <div class="container">
      <div class="pd-top" data-reveal="fade">
        <nav class="pd-crumbs" aria-label="breadcrumb"><a href="/">${esc(t('nav_home'))}</a><span>/</span><a href="/projects">${esc(t('nav_projects'))}</a>${cat ? `<span>/</span><a href="/projects?cat=${encodeURIComponent(cat.slug)}">${esc(tr(cat.name))}</a>` : ''}</nav>
        <a class="link-arrow" href="/projects">${icon('arrowLeft')}${esc(t('back'))}</a>
      </div>
      <div class="pd-grid">
        <div class="pd-gallery" data-reveal="up">
          <div class="pd-main" data-cursor="${esc(t('zoom'))}">
            ${gallery.length ? `<img id="pd-img" src="${esc(gallery[0].src)}" alt="${esc(gallery[0].alt)}">` : ''}
            <span class="zoom-btn">${icon('search')}</span>
          </div>
          ${gallery.length > 1 ? `<div class="pd-thumbs">${gallery.map((g, i) => `<button type="button" class="pd-thumb ${i === 0 ? 'is-active' : ''}" data-i="${i}" aria-label="${i + 1}"><img src="${esc(g.src)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
        </div>
        <div class="pd-info">
          ${cat ? `<span class="pd-cat" data-reveal="fade">${esc(tr(cat.name))}</span>` : ''}
          <h1 data-split>${esc(tr(project.title))}</h1>
          <div class="pd-specs" data-reveal="up">
            <div class="pd-spec"><small>${esc(t('fabric'))}</small><b>${fabricImg ? `<button type="button" class="fabric-swatch" id="fabric-swatch" aria-label="${esc(t('zoom'))}"><img src="${esc(fabricImg)}" alt=""></button>` : ''}${esc(tr(project.fabric) || '—')}</b></div>
            <div class="pd-spec"><small>${esc(t('year'))}</small><b>${esc(project.year || '—')}</b></div>
          </div>
          <div class="pd-desc" data-reveal="up">${paragraphs(tr(project.description))}</div>
          <div class="pd-actions" data-reveal="up">
            <button type="button" class="btn btn--primary" id="btn-3d" data-magnetic>${icon('cube')}${esc(t('view_3d'))}</button>
            <button type="button" class="btn btn--ghost" id="btn-share">${icon('share')}${esc(t('share'))}</button>
          </div>
        </div>
      </div>

      ${all.length > 1 ? `<nav class="pd-nav" data-reveal="up">
        <a href="/project?slug=${encodeURIComponent(prev.slug)}"><small>${icon('arrowLeft')}${esc(t('prev'))}</small><span>${esc(tr(prev.title))}</span></a>
        <a href="/project?slug=${encodeURIComponent(next.slug)}"><small>${esc(t('next'))}${icon('arrowRight')}</small><span>${esc(tr(next.title))}</span></a>
      </nav>` : ''}
    </div>
  </section>
  ${related.length ? `<section class="section">
    <div class="container">
      <div class="section-head section-head--split"><h2 data-split>${esc(t('related'))}</h2></div>
      <div class="proj-grid">${related.map((p, i) => workCard(p, cats, i, { reveal: true, delay: i * 0.1 })).join('')}</div>
    </div>
  </section>` : ''}`;

  let cur = 0;
  const img = $('#pd-img');
  const show = (i) => {
    if (!img || !gallery[i]) return;
    cur = i;
    img.classList.add('is-loading');
    const n = new Image();
    n.onload = n.onerror = () => { img.src = gallery[i].src; img.classList.remove('is-loading'); };
    n.src = gallery[i].src;
    $$('.pd-thumb', main).forEach((b) => b.classList.toggle('is-active', +b.dataset.i === i));
  };
  $$('.pd-thumb', main).forEach((b) => b.addEventListener('click', () => show(+b.dataset.i)));
  const mainBox = $('.pd-main', main);
  if (mainBox && gallery.length) mainBox.addEventListener('click', () => openLightbox(gallery, cur));
  const sw = $('#fabric-swatch');
  if (sw) sw.addEventListener('click', () => openLightbox([{ src: fabricImg, caption: tr(project.fabric), alt: tr(project.fabric) }], 0));
  $('#btn-3d').addEventListener('click', () => open3d(project));
  $('#btn-share').addEventListener('click', async () => {
    const data = { title: tr(project.title), url: location.href };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(location.href);
      toast(t('link_copied'), 'success');
    } catch (e) { /* foydalanuvchi bekor qildi */ }
  });
  keyNav = (e) => {
    if (document.querySelector('.lightbox.is-open, .modal')) return;
    if (e.key === 'ArrowRight' && gallery.length > 1) show((cur + 1) % gallery.length);
    if (e.key === 'ArrowLeft' && gallery.length > 1) show((cur - 1 + gallery.length) % gallery.length);
  };
  if (first) document.addEventListener('keydown', (e) => keyNav && keyNav(e));
  initTilt(main);
}

boot('project', render);
