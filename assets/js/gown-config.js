// Bosh sahifadagi 3D ko'ylak sozlamalari (admin paneldan o'zgartiriladi)
export const GOWN_DEFAULTS = {
  silhouette: 'aline',
  neckline: 'illusion',
  sleeves: 'long',
  fabric: 'lace',
  color: '#efe6d8',
  lace: '#fffdf8',
  trim: 'none',
  scallop: true,
  spread: 100,
  train: 40,
  size: 25,
  width: 45,
  speed: 40,
  mannequin: 'linen',
  finial: 'silver',
  sparkle: false,
  motion: true,
  // Ko'ylak manbasi: chizilgan 3D, yuklangan haqiqiy rasm yoki loyihadagi rasm
  source: 'procedural',
  photo_front: '',
  photo_back: '',
  project_id: '',
};

export const GOWN_OPTIONS = {
  silhouette: { aline: 'A-siluet (rasmdagidek)', ball: 'Bal libosi (keng, hajmli)', mermaid: 'Suv parisi (qomatga yopishgan)', empire: 'Empir (beli baland)' },
  neckline: { illusion: 'Yelkadan tushgan, shaffof to‘rli', strapless: 'Ochiq yelka (yuraksimon)', collar: 'Yopiq yoqa (milliy)', oneshoulder: 'Bir yelkali' },
  sleeves: { long: 'Uzun shaffof yenglar', none: 'Yengsiz' },
  fabric: { lace: 'Dantel (kruzheva)', silk: 'Ipak', satin: 'Atlas-satin (yaltiroq)', velvet: 'Baxmal', atlas: 'Milliy atlas (ikat)', chiffon: 'Shifon (gulli)', pleated: 'Plisse (burmali)' },
  trim: { none: 'Yo‘q', gold: 'Zarrin', silver: 'Kumush' },
  mannequin: { linen: 'Zig‘ir rang', white: 'Oq', black: 'Qora' },
  finial: { silver: 'Kumush', gold: 'Oltin', wood: 'Yog‘och' },
  source: { procedural: 'Chizilgan 3D ko‘ylak (pastdagi sozlamalar)', photo: 'Haqiqiy ko‘ylak rasmidan 3D', project: 'Loyihadagi ko‘ylak rasmidan 3D' },
};

export function normalizeGown(c) {
  const o = { ...GOWN_DEFAULTS, ...(c && typeof c === 'object' ? c : {}) };
  for (const k in GOWN_OPTIONS) if (!(o[k] in GOWN_OPTIONS[k])) o[k] = GOWN_DEFAULTS[k];
  const hex = (v, d) => (/^#[0-9a-f]{6}$/i.test(v || '') ? v : d);
  o.color = hex(o.color, GOWN_DEFAULTS.color);
  o.lace = hex(o.lace, GOWN_DEFAULTS.lace);
  o.spread = Math.max(0, Math.min(100, Number(o.spread) || 0));
  o.train = Math.max(0, Math.min(100, Number.isFinite(+o.train) ? +o.train : GOWN_DEFAULTS.train));
  const pct = (v, d) => Math.max(0, Math.min(100, Number.isFinite(+v) && v !== '' && v !== null ? +v : d));
  o.size = pct(o.size, GOWN_DEFAULTS.size);
  o.width = pct(o.width, GOWN_DEFAULTS.width);
  o.speed = pct(o.speed, GOWN_DEFAULTS.speed);
  o.scallop = !!o.scallop; o.sparkle = !!o.sparkle; o.motion = o.motion !== false;
  const url = (v) => (typeof v === 'string' && /^(https:\/\/|\/)/.test(v.trim()) ? v.trim() : '');
  o.photo_front = url(o.photo_front); o.photo_back = url(o.photo_back);
  o.project_id = typeof o.project_id === 'string' ? o.project_id : '';
  return o;
}
