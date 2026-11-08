// Aloqa sahifasi: ma'lumotlar va xabar yuborish formasi
import { boot, socialsHtml } from '../layout.js';
import { t, tr } from '../i18n.js';
import { sendMessage } from '../api.js';
import { esc, icon, telHref, $ } from '../utils.js';
import { pageHero } from '../components.js';

// Faqat Google Maps "embed" havolalariga ruxsat beriladi
function mapSrc(v) {
  const s = String(v || '').trim();
  const m = s.match(/src=["']([^"']+)["']/);
  const url = m ? m[1] : s;
  try {
    const u = new URL(url);
    if (u.protocol === 'https:' && /(^|\.)google\.[a-z.]+$/.test(u.hostname) && u.pathname.startsWith('/maps/embed')) return u.href;
  } catch (e) { /* noto'g'ri havola */ }
  return '';
}

let sentAt = 0;

async function render({ site }) {
  const main = document.getElementById('main');
  const c = site.settings.contact || {};
  const map = mapSrc(c.map_embed);
  const cards = [
    c.phone && { ico: 'phone', label: t('phone'), value: c.phone, href: telHref(c.phone) },
    c.email && { ico: 'mail', label: t('email'), value: c.email, href: `mailto:${c.email}` },
    tr(c.address) && { ico: 'pin', label: t('address'), value: tr(c.address) },
    tr(c.hours) && { ico: 'clock', label: t('hours'), value: tr(c.hours) },
  ].filter(Boolean);
  const socials = socialsHtml(c);

  main.innerHTML = `
  ${pageHero({ label: t('contact_label'), title: t('contact_title'), text: t('contact_text') })}
  <section class="section">
    <div class="container">
      <div class="contact-grid">
        <div>
          <div class="info-cards" data-stagger="0.08">
            ${cards.map((x) => x.href
              ? `<a class="info-card" href="${esc(x.href)}">${icon(x.ico)}<div><small>${esc(x.label)}</small><b>${esc(x.value)}</b></div></a>`
              : `<div class="info-card">${icon(x.ico)}<div><small>${esc(x.label)}</small><b>${esc(x.value)}</b></div></div>`).join('')}
          </div>
          ${socials ? `<div class="contact-socials" data-reveal="up"><h4>${esc(t('follow'))}</h4>${socials}</div>` : ''}
        </div>
        <div class="form-card" id="form-card" data-reveal="up">
          <h2>${esc(t('contact_title'))}</h2>
          <form id="contact-form" novalidate>
            <div class="field"><input id="f-name" name="name" type="text" maxlength="120" autocomplete="name" placeholder=" " required><label for="f-name">${esc(t('form_name'))}</label></div>
            <div class="field"><input id="f-contact" name="contact" type="text" maxlength="160" autocomplete="email" placeholder=" " required><label for="f-contact">${esc(t('form_contact'))}</label></div>
            <div class="field"><textarea id="f-message" name="message" maxlength="4000" placeholder=" " required></textarea><label for="f-message">${esc(t('form_message'))}</label></div>
            <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
            <p class="form-error" id="form-error" role="alert"></p>
            <button class="btn btn--primary" type="submit" id="f-submit" data-magnetic>${esc(t('send'))}${icon('arrowRight')}</button>
          </form>
          <div class="form-success" aria-live="polite">
            <div>
              <svg class="check-anim" viewBox="0 0 90 90" aria-hidden="true"><circle cx="45" cy="45" r="41"/><path d="M28 46l11 11 23-24"/></svg>
              <h3>${esc(t('sent_title'))}</h3>
              <p class="muted">${esc(t('sent_text'))}</p>
              <button type="button" class="btn btn--ghost btn--sm" id="f-again">${esc(t('send_again'))}</button>
            </div>
          </div>
        </div>
      </div>
      ${map ? `<div class="map-wrap" data-reveal="up"><iframe src="${esc(map)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="${esc(t('address'))}" allowfullscreen></iframe></div>` : ''}
    </div>
  </section>`;

  const form = $('#contact-form');
  const err = $('#form-error');
  const card = $('#form-card');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.textContent = '';
    const fd = new FormData(form);
    if (fd.get('website')) return; // bot
    const name = String(fd.get('name') || '').trim();
    const contact = String(fd.get('contact') || '').trim();
    const message = String(fd.get('message') || '').trim();
    form.querySelectorAll('.field').forEach((f) => f.classList.remove('has-error'));
    let bad = false;
    if (!name) { $('#f-name').parentElement.classList.add('has-error'); bad = true; }
    if (contact.length < 3) { $('#f-contact').parentElement.classList.add('has-error'); bad = true; }
    if (!message) { $('#f-message').parentElement.classList.add('has-error'); bad = true; }
    if (bad) { err.textContent = t('form_invalid'); return; }
    if (Date.now() - sentAt < 15000) { card.classList.add('is-sent'); return; }
    const btn = $('#f-submit');
    btn.disabled = true;
    btn.firstChild.textContent = t('sending');
    try {
      await sendMessage({ name, contact, message });
      sentAt = Date.now();
      form.reset();
      card.classList.add('is-sent');
    } catch (ex) {
      err.textContent = t('send_error');
    } finally {
      btn.disabled = false;
      btn.firstChild.textContent = t('send');
    }
  });
  $('#f-again').addEventListener('click', () => card.classList.remove('is-sent'));
}

boot('contact', render);
