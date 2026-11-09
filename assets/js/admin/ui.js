// Admin interfeysi uchun forma quruvchi, modal oynalar va tasdiqlash
import { esc, icon, toast, slugify } from '../utils.js';
import { uploadFile, downscaleImage, errMsg } from './sb.js';

export const LANG_TABS = [['uz', 'UZ'], ['ru', 'RU'], ['en', 'EN']];

export function h(tag, attrs = {}, html = '') {
  const el = document.createElement(tag);
  for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  if (html) el.innerHTML = html;
  return el;
}

function row(f, inner) {
  const wrap = h('div', { class: `f-row f-${f.type}${f.wide ? ' f-wide' : ''}` });
  if (f.label) wrap.appendChild(h('label', { class: 'f-label' }, `${esc(f.label)}${f.required ? ' <i>*</i>' : ''}`));
  if (inner) wrap.appendChild(inner);
  if (f.help) wrap.appendChild(h('p', { class: 'f-help' }, esc(f.help)));
  return wrap;
}

function textField(f, v) {
  const input = h(f.multiline ? 'textarea' : 'input', {
    class: 'inp', type: f.multiline ? null : (f.type === 'number' ? 'number' : f.inputType || 'text'),
    placeholder: f.placeholder || '', min: f.min, max: f.max, step: f.step, rows: f.rows || 4,
  });
  input.value = v ?? '';
  const wrap = row(f, input);
  return {
    el: wrap, input,
    get: () => {
      if (f.type === 'number') return input.value === '' ? null : Number(input.value);
      return input.value.trim();
    },
    set: (x) => { input.value = x ?? ''; },
    validate: () => !f.required || input.value.trim() !== '',
  };
}

function i18nField(f, v) {
  const val = (v && typeof v === 'object') ? { ...v } : { uz: typeof v === 'string' ? v : '' };
  const box = h('div', { class: 'i18n' });
  const tabs = h('div', { class: 'i18n-tabs' });
  const inputs = {};
  let active = 'uz';
  LANG_TABS.forEach(([code, label]) => {
    const b = h('button', { type: 'button', class: 'i18n-tab' + (code === 'uz' ? ' is-active' : ''), 'data-l': code }, `${label}<span class="dot"></span>`);
    b.addEventListener('click', () => {
      active = code;
      tabs.querySelectorAll('.i18n-tab').forEach((x) => x.classList.toggle('is-active', x.dataset.l === code));
      Object.entries(inputs).forEach(([c, el]) => { el.hidden = c !== code; });
      inputs[code].focus();
    });
    tabs.appendChild(b);
    const inp = h(f.multiline ? 'textarea' : 'input', { class: 'inp', rows: f.rows || 5, placeholder: code === 'uz' ? (f.placeholder || '') : 'Tarjima (ixtiyoriy)', 'data-l': code });
    inp.value = val[code] || '';
    inp.hidden = code !== 'uz';
    const mark = () => b.classList.toggle('is-filled', inp.value.trim() !== '');
    inp.addEventListener('input', mark);
    mark();
    inputs[code] = inp;
  });
  box.appendChild(tabs);
  Object.values(inputs).forEach((el) => box.appendChild(el));
  const wrap = row(f, box);
  return {
    el: wrap, inputs,
    get: () => { const o = {}; for (const c in inputs) o[c] = inputs[c].value.trim(); return o; },
    set: (x) => { for (const c in inputs) { inputs[c].value = (x && x[c]) || ''; inputs[c].dispatchEvent(new Event('input')); } },
    validate: () => !f.required || inputs.uz.value.trim() !== '',
    focus: () => inputs[active].focus(),
  };
}

function selectField(f, v) {
  const sel = h('select', { class: 'inp' });
  (f.options || []).forEach((o) => {
    const opt = h('option', { value: o.value }, esc(o.label));
    sel.appendChild(opt);
  });
  sel.value = v ?? (f.options?.[0]?.value ?? '');
  if (v != null && sel.value !== String(v)) sel.value = f.options?.[0]?.value ?? '';
  return { el: row(f, sel), input: sel, get: () => (sel.value === '' && f.nullable ? null : sel.value), set: (x) => { sel.value = x ?? ''; }, validate: () => true };
}

function toggleField(f, v) {
  const lab = h('label', { class: 'switch' });
  const cb = h('input', { type: 'checkbox' });
  cb.checked = v == null ? !!f.default : !!v;
  lab.appendChild(cb);
  lab.appendChild(h('span', { class: 'switch-ui' }));
  lab.appendChild(h('span', { class: 'switch-text' }, esc(f.text || '')));
  const wrap = row(f, lab);
  return { el: wrap, input: cb, get: () => cb.checked, set: (x) => { cb.checked = !!x; }, validate: () => true };
}

function colorField(f, v) {
  const box = h('div', { class: 'color-inp' });
  const c = h('input', { type: 'color' });
  const tx = h('input', { class: 'inp', type: 'text', maxlength: 7, spellcheck: 'false' });
  const norm = (x) => (/^#[0-9a-f]{6}$/i.test(x || '') ? x : (/^#[0-9a-f]{3}$/i.test(x || '') ? '#' + x.slice(1).split('').map((ch) => ch + ch).join('') : '#000000'));
  c.value = norm(v); tx.value = norm(v);
  c.addEventListener('input', () => { tx.value = c.value; box.dispatchEvent(new Event('change', { bubbles: true })); });
  tx.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(tx.value)) { c.value = tx.value; box.dispatchEvent(new Event('change', { bubbles: true })); } });
  box.append(c, tx);
  return { el: row(f, box), get: () => c.value, set: (x) => { c.value = norm(x); tx.value = norm(x); }, validate: () => true };
}

function rangeField(f, v) {
  const box = h('div', { class: 'range-inp' });
  const r = h('input', { type: 'range', min: f.min ?? 0, max: f.max ?? 100, step: f.step ?? 1 });
  const out = h('output');
  r.value = v ?? f.min ?? 0;
  out.textContent = r.value + (f.unit || '');
  r.addEventListener('input', () => { out.textContent = r.value + (f.unit || ''); });
  box.append(r, out);
  return { el: row(f, box), get: () => Number(r.value), set: (x) => { r.value = x; out.textContent = x + (f.unit || ''); }, validate: () => true };
}

// Rasm maydoni: yuklash, muharrirda tahrirlash, o'chirish
function imageField(f, v) {
  let url = v || '';
  const box = h('div', { class: 'img-field' });
  const prev = h('div', { class: 'img-prev' });
  const actions = h('div', { class: 'img-actions' });
  const file = h('input', { type: 'file', accept: f.accept || 'image/png,image/jpeg,image/webp', hidden: true });
  const status = h('span', { class: 'img-status' });
  const btnUp = h('button', { type: 'button', class: 'abtn abtn--sm' }, `${icon('upload')}Yuklash`);
  const btnEdit = h('button', { type: 'button', class: 'abtn abtn--sm abtn--ghost' }, `${icon('wand')}Fon / tahrirlash`);
  const btnDel = h('button', { type: 'button', class: 'abtn abtn--sm abtn--ghost abtn--danger' }, `${icon('trash')}`);
  btnDel.title = 'Rasmni olib tashlash';
  const urlInp = h('input', { class: 'inp inp--sm', type: 'text', placeholder: 'yoki rasm havolasini kiriting (https://...)' });
  const draw = () => {
    prev.innerHTML = url ? `<img src="${esc(url)}" alt="">` : `<div class="img-empty">${icon('image')}<span>Rasm tanlanmagan</span></div>`;
    btnEdit.hidden = !url || f.editor === false;
    btnDel.hidden = !url;
    urlInp.value = url.startsWith('http') ? url : '';
  };
  const setBusy = (b, msg = '') => { box.classList.toggle('is-busy', b); status.textContent = msg; btnUp.disabled = b; btnEdit.disabled = b; };
  const doUpload = async (blob, name) => {
    setBusy(true, 'Yuklanmoqda…');
    try {
      const small = blob.type === 'image/svg+xml' ? blob : await downscaleImage(blob, f.max || 2000);
      url = await uploadFile(small, f.folder || 'images', name);
      draw();
      box.dispatchEvent(new Event('change', { bubbles: true }));
      toast('Rasm yuklandi', 'success');
    } catch (e) { toast(errMsg(e), 'error', 4000); } finally { setBusy(false); }
  };
  btnUp.addEventListener('click', () => file.click());
  file.addEventListener('change', async () => {
    const fl = file.files[0];
    file.value = '';
    if (!fl) return;
    if (f.editorOnUpload && f.editor !== false) {
      const { openEditor } = await import('./editor.js');
      const res = await openEditor(fl, { title: f.label, defaultMode: f.editorMode, transparent: !!f.transparent });
      if (res) await doUpload(res.blob, 'edited.png');
    } else await doUpload(fl, fl.name);
  });
  btnEdit.addEventListener('click', async () => {
    const { openEditor } = await import('./editor.js');
    const res = await openEditor(url, { title: f.label, defaultMode: f.editorMode, transparent: !!f.transparent });
    if (res) await doUpload(res.blob, 'edited.png');
  });
  btnDel.addEventListener('click', () => { url = ''; draw(); box.dispatchEvent(new Event('change', { bubbles: true })); });
  urlInp.addEventListener('change', () => { const x = urlInp.value.trim(); if (!x || /^https:\/\//.test(x)) { url = x; draw(); } else toast('Havola https:// bilan boshlanishi kerak', 'error'); });
  actions.append(btnUp, btnEdit, btnDel, status);
  box.append(prev, h('div', { class: 'img-side' }), file);
  box.lastChild.previousSibling.append(actions, urlInp);
  draw();
  return { el: row(f, box), get: () => url || '', set: (x) => { url = x || ''; draw(); }, validate: () => !f.required || !!url };
}

function fileField(f, v) {
  let url = v || '';
  const box = h('div', { class: 'file-field' });
  const info = h('div', { class: 'file-info' });
  const file = h('input', { type: 'file', accept: f.accept || 'application/pdf', hidden: true });
  const btn = h('button', { type: 'button', class: 'abtn abtn--sm' }, `${icon('upload')}Fayl yuklash`);
  const del = h('button', { type: 'button', class: 'abtn abtn--sm abtn--ghost abtn--danger' }, icon('trash'));
  const draw = () => {
    info.innerHTML = url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${icon('download')}${esc(decodeURIComponent(url.split('/').pop()))}</a>` : '<span class="muted">Fayl yuklanmagan</span>';
    del.hidden = !url;
  };
  btn.addEventListener('click', () => file.click());
  file.addEventListener('change', async () => {
    const fl = file.files[0];
    file.value = '';
    if (!fl) return;
    if (fl.size > 25 * 1024 * 1024) { toast('Fayl 25 MB dan katta bo‘lmasin', 'error'); return; }
    btn.disabled = true; info.textContent = 'Yuklanmoqda…';
    try { url = await uploadFile(fl, f.folder || 'files', fl.name); toast('Fayl yuklandi', 'success'); } catch (e) { toast(errMsg(e), 'error', 4000); }
    btn.disabled = false; draw();
  });
  del.addEventListener('click', () => { url = ''; draw(); });
  box.append(info, btn, del, file);
  draw();
  return { el: row(f, box), get: () => url || '', set: (x) => { url = x || ''; draw(); }, validate: () => !f.required || !!url };
}

function listField(f, v) {
  const items = [];
  const box = h('div', { class: 'list-field' });
  const listEl = h('div', { class: 'list-items' });
  const add = h('button', { type: 'button', class: 'abtn abtn--sm abtn--ghost' }, `${icon('plus')}${esc(f.addLabel || 'Qo‘shish')}`);
  const redraw = () => { listEl.innerHTML = ''; items.forEach((it, i) => { it.el.querySelector('.li-num').textContent = i + 1; listEl.appendChild(it.el); }); };
  const addItem = (val) => {
    const form = createForm(f.fields, val || {});
    const card = h('div', { class: 'list-item' });
    const head = h('div', { class: 'li-head' }, `<span class="li-num"></span>`);
    const tools = h('div', { class: 'li-tools' });
    const up = h('button', { type: 'button', class: 'icon-btn', title: 'Yuqoriga' }, icon('up'));
    const down = h('button', { type: 'button', class: 'icon-btn', title: 'Pastga' }, icon('down'));
    const rm = h('button', { type: 'button', class: 'icon-btn icon-btn--danger', title: 'O‘chirish' }, icon('trash'));
    tools.append(up, down, rm);
    head.appendChild(tools);
    card.append(head, form.el);
    const it = { el: card, form };
    up.addEventListener('click', () => { const i = items.indexOf(it); if (i > 0) { items.splice(i, 1); items.splice(i - 1, 0, it); redraw(); } });
    down.addEventListener('click', () => { const i = items.indexOf(it); if (i < items.length - 1) { items.splice(i, 1); items.splice(i + 1, 0, it); redraw(); } });
    rm.addEventListener('click', () => { const i = items.indexOf(it); items.splice(i, 1); redraw(); });
    items.push(it);
    redraw();
  };
  (Array.isArray(v) ? v : []).forEach((x) => addItem(f.scalar ? { value: x } : x));
  add.addEventListener('click', () => addItem({}));
  box.append(listEl, add);
  return {
    el: row(f, box),
    get: () => items.map((it) => { const val = it.form.getValues(); return f.scalar ? val.value : val; }),
    set: () => {},
    validate: () => items.every((it) => it.form.validate(true)),
  };
}

const FIELD_TYPES = { text: textField, number: textField, textarea: (f, v) => textField({ ...f, multiline: true }, v), i18n: i18nField, select: selectField, toggle: toggleField, color: colorField, range: rangeField, image: imageField, file: fileField, list: listField };

/**
 * Maydonlar ro'yxatidan forma yaratadi.
 * Har bir maydon: {key, label, type, required, help, ...}
 * type: 'group' bo'lsa — sarlavha.
 */
export function createForm(fields, values = {}) {
  const el = h('div', { class: 'aform' });
  const ctrls = {};
  fields.forEach((f) => {
    if (f.type === 'group') { el.appendChild(h('h3', { class: 'f-group' }, esc(f.label))); return; }
    const make = FIELD_TYPES[f.type] || textField;
    const c = make(f, values[f.key]);
    ctrls[f.key] = c;
    el.appendChild(c.el);
  });
  return {
    el, ctrls,
    getValues() { const o = {}; for (const k in ctrls) o[k] = ctrls[k].get(); return o; },
    validate(silent = false) {
      let ok = true;
      for (const k in ctrls) {
        const good = ctrls[k].validate();
        ctrls[k].el.classList.toggle('has-error', !good);
        if (!good && ok && !silent) { ok = false; ctrls[k].el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
        if (!good) ok = false;
      }
      if (!ok && !silent) toast('Majburiy maydonlarni to‘ldiring', 'error');
      return ok;
    },
  };
}

// Sarlavhadan slug avtomatik
export function bindSlug(form, fromKey, slugKey) {
  const src = form.ctrls[fromKey];
  const dst = form.ctrls[slugKey];
  if (!src || !dst) return;
  let touched = !!dst.get();
  dst.input.addEventListener('input', () => { touched = true; });
  src.inputs.uz.addEventListener('input', () => { if (!touched) dst.set(slugify(src.inputs.uz.value)); });
}

// Modal oyna
export function modal({ title = '', body = null, wide = false, actions = [] } = {}) {
  return new Promise((resolve) => {
    const ov = h('div', { class: 'amodal' });
    const box = h('div', { class: 'amodal-box' + (wide ? ' is-wide' : '') });
    const head = h('div', { class: 'amodal-head' }, `<h3>${esc(title)}</h3>`);
    const x = h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Yopish' }, icon('close'));
    head.appendChild(x);
    const content = h('div', { class: 'amodal-body' });
    if (typeof body === 'string') content.innerHTML = body; else if (body) content.appendChild(body);
    const foot = h('div', { class: 'amodal-foot' });
    const close = (val) => { ov.classList.remove('is-open'); document.removeEventListener('keydown', onKey); setTimeout(() => ov.remove(), 250); resolve(val); };
    actions.forEach((a) => {
      const b = h('button', { type: 'button', class: `abtn ${a.cls || ''}` }, a.label);
      b.addEventListener('click', async () => {
        if (a.onClick) { const r = await a.onClick(); if (r === false) return; close(r === undefined ? a.value : r); } else close(a.value);
      });
      foot.appendChild(b);
    });
    const onKey = (e) => { if (e.key === 'Escape') close(null); };
    document.addEventListener('keydown', onKey);
    x.addEventListener('click', () => close(null));
    ov.addEventListener('mousedown', (e) => { if (e.target === ov) close(null); });
    box.append(head, content);
    if (actions.length) box.appendChild(foot);
    ov.appendChild(box);
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('is-open'));
  });
}

export function confirmDialog(text, okLabel = 'O‘chirish') {
  return modal({
    title: 'Tasdiqlang', body: `<p>${esc(text)}</p>`,
    actions: [{ label: 'Bekor qilish', cls: 'abtn--ghost', value: false }, { label: okLabel, cls: 'abtn--danger', value: true }],
  });
}
