// Uch tilli interfeys: o'zbek, rus, ingliz.
export const LANGS = [
  { code: 'uz', short: 'UZ', label: 'O‘zbekcha' },
  { code: 'ru', short: 'RU', label: 'Русский' },
  { code: 'en', short: 'EN', label: 'English' },
];

const DICT = {
  uz: {
    nav_home: 'Bosh sahifa', nav_about: 'Dizayner haqida', nav_about_short: 'Haqida', nav_projects: 'Loyihalar',
    nav_research: 'Ilmiy ishlar', nav_contact: 'Aloqa', menu: 'Menyu', language: 'Til',
    view_all: 'Barchasini ko‘rish', view_project: 'Loyihani ko‘rish', view: 'Ko‘rish', read_more: 'Batafsil',
    back: 'Orqaga', next: 'Keyingi', prev: 'Oldingi', close: 'Yopish', loading: 'Yuklanmoqda…',
    error_load: 'Ma’lumotlarni yuklab bo‘lmadi. Internet aloqasini tekshirib, sahifani yangilang.',
    empty: 'Hozircha bu yerda hech narsa yo‘q.', no_results: 'Tanlangan shartlar bo‘yicha loyiha topilmadi.',
    year: 'Yil', category: 'Toifa', fabric: 'Mato', all: 'Barchasi', all_years: 'Barcha yillar', search: 'Qidirish…',
    download_pdf: 'PDF yuklab olish', open_link: 'Havolani ochish',
    projects_count: 'Loyihalar', experience: 'Yillik tajriba', research_count: 'Ilmiy ishlar', awards_count: 'Yutuqlar',
    scroll: 'Pastga', share: 'Ulashish', link_copied: 'Havola nusxalandi', view_3d: '3D’da ko‘rish',
    rotate_hint: 'Aylantirish uchun suring', page_not_found: 'Sahifa topilmadi', go_home: 'Bosh sahifaga qaytish',
    related: 'O‘xshash loyihalar', gallery: 'Galereya', details: 'Tafsilotlar', all_rights: 'Barcha huquqlar himoyalangan.',
    cta_label: 'Hamkorlik', cta_title: 'Keling, birgalikda o‘zingizga xos libos yaratamiz',
    cta_text: 'Buyurtma, hamkorlik yoki ilmiy loyiha bo‘yicha savollaringiz bo‘lsa, yozing.',
    cta_button: 'Bog‘lanish', skills: 'Yo‘nalishlar', journey_label: 'Ijodiy yo‘l', journey_title: 'Tajriba va ta’lim',
    awards_label: 'E’tirof', awards_title: 'Yutuqlar va sertifikatlar', issued_by: 'Beruvchi',
    about_label: 'Dizayner', research_label: 'Ilm-fan', research_title: 'Ilmiy ishlar',
    research_text: 'Maqolalar, tezislar va tadqiqot natijalari',
    projects_label: 'Portfolio', projects_title: 'Loyihalar', projects_text: 'Har bir libos — alohida hikoya',
    featured_label: 'Tanlangan ishlar', featured_title: 'So‘nggi loyihalar',
    contact_label: 'Aloqa', contact_title: 'Biz bilan bog‘laning', contact_text: 'Savol, taklif yoki buyurtma uchun xabar qoldiring',
    form_name: 'Ismingiz', form_contact: 'Telefon yoki e-pochta', form_message: 'Xabaringiz', send: 'Yuborish',
    sending: 'Yuborilmoqda…', sent_title: 'Rahmat!', sent_text: 'Xabaringiz yuborildi. Tez orada javob beramiz.',
    send_error: 'Xabarni yuborib bo‘lmadi. Iltimos, qaytadan urinib ko‘ring.', form_invalid: 'Iltimos, barcha maydonlarni to‘g‘ri to‘ldiring.',
    send_again: 'Yana yozish', phone: 'Telefon', email: 'E-pochta', address: 'Manzil', hours: 'Ish vaqti', follow: 'Ijtimoiy tarmoqlar',
    research_latest: 'So‘nggi ilmiy ishlar', open_project: 'Ochish', fabric_3d_title: 'Mato 3D ko‘rinishda',
    fabric_3d_text: 'Loyiha matosi maneken ustida. Sichqoncha yoki barmoq bilan aylantiring.',
    no_3d: 'Brauzeringiz 3D ko‘rinishni qo‘llab-quvvatlamaydi.', items: 'ta',
    filter: 'Saralash', reset: 'Tozalash', copy_link: 'Havolani nusxalash', zoom: 'Kattalashtirish',
  },
  ru: {
    nav_home: 'Главная', nav_about: 'О дизайнере', nav_about_short: 'О дизайнере', nav_projects: 'Проекты',
    nav_research: 'Научные работы', nav_contact: 'Контакты', menu: 'Меню', language: 'Язык',
    view_all: 'Смотреть все', view_project: 'Смотреть проект', view: 'Смотреть', read_more: 'Подробнее',
    back: 'Назад', next: 'Следующий', prev: 'Предыдущий', close: 'Закрыть', loading: 'Загрузка…',
    error_load: 'Не удалось загрузить данные. Проверьте подключение к интернету и обновите страницу.',
    empty: 'Здесь пока ничего нет.', no_results: 'По выбранным условиям проекты не найдены.',
    year: 'Год', category: 'Категория', fabric: 'Ткань', all: 'Все', all_years: 'Все годы', search: 'Поиск…',
    download_pdf: 'Скачать PDF', open_link: 'Открыть ссылку',
    projects_count: 'Проекты', experience: 'Лет опыта', research_count: 'Научные работы', awards_count: 'Достижения',
    scroll: 'Вниз', share: 'Поделиться', link_copied: 'Ссылка скопирована', view_3d: 'Смотреть в 3D',
    rotate_hint: 'Проведите, чтобы вращать', page_not_found: 'Страница не найдена', go_home: 'На главную',
    related: 'Похожие проекты', gallery: 'Галерея', details: 'Детали', all_rights: 'Все права защищены.',
    cta_label: 'Сотрудничество', cta_title: 'Давайте вместе создадим ваш особенный образ',
    cta_text: 'Если у вас есть вопросы по заказу, сотрудничеству или научному проекту — напишите.',
    cta_button: 'Связаться', skills: 'Направления', journey_label: 'Творческий путь', journey_title: 'Опыт и образование',
    awards_label: 'Признание', awards_title: 'Достижения и сертификаты', issued_by: 'Выдано',
    about_label: 'Дизайнер', research_label: 'Наука', research_title: 'Научные работы',
    research_text: 'Статьи, тезисы и результаты исследований',
    projects_label: 'Портфолио', projects_title: 'Проекты', projects_text: 'Каждое изделие — отдельная история',
    featured_label: 'Избранные работы', featured_title: 'Последние проекты',
    contact_label: 'Контакты', contact_title: 'Свяжитесь с нами', contact_text: 'Оставьте сообщение с вопросом, предложением или заказом',
    form_name: 'Ваше имя', form_contact: 'Телефон или e-mail', form_message: 'Сообщение', send: 'Отправить',
    sending: 'Отправка…', sent_title: 'Спасибо!', sent_text: 'Сообщение отправлено. Мы скоро ответим.',
    send_error: 'Не удалось отправить сообщение. Попробуйте ещё раз.', form_invalid: 'Пожалуйста, заполните все поля правильно.',
    send_again: 'Написать ещё', phone: 'Телефон', email: 'E-mail', address: 'Адрес', hours: 'Часы работы', follow: 'Соцсети',
    research_latest: 'Последние научные работы', open_project: 'Открыть', fabric_3d_title: 'Ткань в 3D',
    fabric_3d_text: 'Ткань проекта на манекене. Вращайте мышью или пальцем.',
    no_3d: 'Ваш браузер не поддерживает 3D-просмотр.', items: 'шт.',
    filter: 'Фильтр', reset: 'Сбросить', copy_link: 'Скопировать ссылку', zoom: 'Увеличить',
  },
  en: {
    nav_home: 'Home', nav_about: 'About', nav_about_short: 'About', nav_projects: 'Projects',
    nav_research: 'Research', nav_contact: 'Contact', menu: 'Menu', language: 'Language',
    view_all: 'View all', view_project: 'View project', view: 'View', read_more: 'Read more',
    back: 'Back', next: 'Next', prev: 'Previous', close: 'Close', loading: 'Loading…',
    error_load: 'Could not load data. Check your internet connection and refresh the page.',
    empty: 'Nothing here yet.', no_results: 'No projects match the selected filters.',
    year: 'Year', category: 'Category', fabric: 'Fabric', all: 'All', all_years: 'All years', search: 'Search…',
    download_pdf: 'Download PDF', open_link: 'Open link',
    projects_count: 'Projects', experience: 'Years of experience', research_count: 'Research works', awards_count: 'Awards',
    scroll: 'Scroll', share: 'Share', link_copied: 'Link copied', view_3d: 'View in 3D',
    rotate_hint: 'Drag to rotate', page_not_found: 'Page not found', go_home: 'Back to home',
    related: 'Related projects', gallery: 'Gallery', details: 'Details', all_rights: 'All rights reserved.',
    cta_label: 'Collaboration', cta_title: 'Let’s create a garment that is truly yours',
    cta_text: 'Questions about orders, collaboration or the research project? Write to us.',
    cta_button: 'Get in touch', skills: 'Expertise', journey_label: 'Journey', journey_title: 'Experience & education',
    awards_label: 'Recognition', awards_title: 'Awards & certificates', issued_by: 'Issued by',
    about_label: 'Designer', research_label: 'Science', research_title: 'Research',
    research_text: 'Papers, abstracts and research results',
    projects_label: 'Portfolio', projects_title: 'Projects', projects_text: 'Every garment is its own story',
    featured_label: 'Selected works', featured_title: 'Latest projects',
    contact_label: 'Contact', contact_title: 'Get in touch', contact_text: 'Leave a message with a question, idea or order',
    form_name: 'Your name', form_contact: 'Phone or e-mail', form_message: 'Message', send: 'Send',
    sending: 'Sending…', sent_title: 'Thank you!', sent_text: 'Your message has been sent. We will reply soon.',
    send_error: 'Could not send the message. Please try again.', form_invalid: 'Please fill in all fields correctly.',
    send_again: 'Write again', phone: 'Phone', email: 'E-mail', address: 'Address', hours: 'Working hours', follow: 'Social media',
    research_latest: 'Latest research', open_project: 'Open', fabric_3d_title: 'Fabric in 3D',
    fabric_3d_text: 'The project fabric on a mannequin. Drag with mouse or finger to rotate.',
    no_3d: 'Your browser does not support 3D view.', items: 'items',
    filter: 'Filter', reset: 'Reset', copy_link: 'Copy link', zoom: 'Zoom',
  },
};

const KEY = 'ms_lang';

function detect() {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q && DICT[q]) return q;
    const s = localStorage.getItem(KEY);
    if (s && DICT[s]) return s;
  } catch (e) { /* storage yopiq bo'lishi mumkin */ }
  return 'uz';
}

let current = detect();
document.documentElement.lang = current;

export function getLang() { return current; }

export function setLang(code) {
  if (!DICT[code] || code === current) return;
  current = code;
  try { localStorage.setItem(KEY, code); } catch (e) { /* e'tiborsiz */ }
  document.documentElement.lang = code;
  window.dispatchEvent(new CustomEvent('langchange', { detail: code }));
}

export function t(key, vars) {
  let s = (DICT[current] && DICT[current][key]) ?? DICT.uz[key] ?? key;
  if (vars) for (const k in vars) s = s.replaceAll(`{${k}}`, vars[k]);
  return s;
}

// Bazadagi {uz, ru, en} ko'rinishidagi matndan joriy tildagisini olish
export function tr(obj, lang = current) {
  if (obj == null) return '';
  if (typeof obj === 'string' || typeof obj === 'number') return String(obj);
  return obj[lang] || obj.uz || obj.ru || obj.en || '';
}
