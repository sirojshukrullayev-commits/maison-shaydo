// 404 sahifasi
import { boot } from '../layout.js';
import { t } from '../i18n.js';
import { esc, icon } from '../utils.js';

boot('notfound', () => {
  document.getElementById('main').innerHTML = `<section class="nf"><div>
    <div class="nf-code" data-reveal="scale">404</div>
    <h1 data-split>${esc(t('page_not_found'))}</h1>
    <a class="btn btn--primary" href="/" data-magnetic>${esc(t('go_home'))}${icon('arrowRight')}</a>
  </div></section>`;
});
