// Avtomatik yaratilgan: tools/seed_data.py. Baza ishlamay qolsa ham sayt shu qiymatlar bilan ochiladi.
export const PRESETS = [
 {
  "slug": "zamonaviy",
  "name": {
   "uz": "Zamonaviy",
   "ru": "Современная",
   "en": "Modern"
  },
  "sort_order": 1,
  "tokens": {
   "colors": {
    "bg": "#ffffff",
    "surface": "#f7f2ec",
    "text": "#1d1814",
    "muted": "#7c7169",
    "primary": "#6e533f",
    "accent": "#b89474",
    "heroBg": "#8d7360",
    "heroBg2": "#4f3a2c",
    "heroText": "#f6eee5",
    "dark": "#4a3628"
   },
   "fonts": {
    "heading": "Playfair Display",
    "body": "Montserrat"
   },
   "radius": 18,
   "pattern": "none",
   "fabric": "silk",
   "mannequin": "linen",
   "dark": false
  }
 },
 {
  "slug": "milliy",
  "name": {
   "uz": "Milliy",
   "ru": "Национальная",
   "en": "National"
  },
  "sort_order": 2,
  "tokens": {
   "colors": {
    "bg": "#fbf6ea",
    "surface": "#f3ead6",
    "text": "#18213f",
    "muted": "#5d6584",
    "primary": "#1f3a8a",
    "accent": "#d4a437",
    "heroBg": "#1d3285",
    "heroBg2": "#0c1640",
    "heroText": "#fdf3dc",
    "dark": "#14245e"
   },
   "fonts": {
    "heading": "Prata",
    "body": "Manrope"
   },
   "radius": 14,
   "pattern": "ornament",
   "fabric": "atlas",
   "mannequin": "linen",
   "dark": false
  }
 },
 {
  "slug": "klassik",
  "name": {
   "uz": "Klassik",
   "ru": "Классическая",
   "en": "Classic"
  },
  "sort_order": 3,
  "tokens": {
   "colors": {
    "bg": "#100e0c",
    "surface": "#1b1815",
    "text": "#f2e9d8",
    "muted": "#a89c88",
    "primary": "#c9a45c",
    "accent": "#e6cf9a",
    "heroBg": "#2a231b",
    "heroBg2": "#0a0908",
    "heroText": "#f3e6c9",
    "dark": "#211c16"
   },
   "fonts": {
    "heading": "Cormorant Garamond",
    "body": "Jost"
   },
   "radius": 4,
   "pattern": "lines",
   "fabric": "velvet",
   "mannequin": "black",
   "dark": true
  }
 },
 {
  "slug": "minimal",
  "name": {
   "uz": "Minimal",
   "ru": "Минимализм",
   "en": "Minimal"
  },
  "sort_order": 4,
  "tokens": {
   "colors": {
    "bg": "#ffffff",
    "surface": "#f4f4f2",
    "text": "#111111",
    "muted": "#6b6b6b",
    "primary": "#111111",
    "accent": "#9a9a9a",
    "heroBg": "#ececea",
    "heroBg2": "#cfcfcc",
    "heroText": "#111111",
    "dark": "#1a1a1a"
   },
   "fonts": {
    "heading": "Lora",
    "body": "Inter"
   },
   "radius": 0,
   "pattern": "none",
   "fabric": "linen",
   "mannequin": "white",
   "dark": false
  }
 },
 {
  "slug": "pastel",
  "name": {
   "uz": "Pastel",
   "ru": "Пастельная",
   "en": "Pastel"
  },
  "sort_order": 5,
  "tokens": {
   "colors": {
    "bg": "#fffafa",
    "surface": "#fbeff2",
    "text": "#3a2b33",
    "muted": "#8b7480",
    "primary": "#c0688a",
    "accent": "#a993dc",
    "heroBg": "#f2cfd9",
    "heroBg2": "#d9c4ec",
    "heroText": "#3a2b33",
    "dark": "#6d4a5e"
   },
   "fonts": {
    "heading": "Cormorant Garamond",
    "body": "Nunito"
   },
   "radius": 26,
   "pattern": "dots",
   "fabric": "chiffon",
   "mannequin": "white",
   "dark": false
  }
 }
];

export const DEFAULT_SETTINGS = {
 "general": {
  "site_name": "Maison Shaydo",
  "logo_url": "",
  "tagline": {
   "uz": "Tikuvchi-dizayner portfoliosi",
   "ru": "Портфолио дизайнера одежды",
   "en": "Fashion designer portfolio"
  },
  "seo_description": {
   "uz": "Tikuvchi-dizayner loyihalari, ilmiy ishlari va yutuqlari",
   "ru": "Проекты, научные работы и достижения дизайнера одежды",
   "en": "Projects, research and achievements of a fashion designer"
  },
  "footer_text": {
   "uz": "Har bir libos — o‘z egasining hikoyasi.",
   "ru": "Каждое изделие — история своего владельца.",
   "en": "Every garment tells its owner's story."
  }
 },
 "hero": {
  "mode": "3d",
  "image_url": "",
  "word": {
   "uz": "SHAYDO",
   "ru": "SHAYDO",
   "en": "SHAYDO"
  },
  "eyebrow": {
   "uz": "Tikuvchi-dizayner",
   "ru": "Дизайнер одежды",
   "en": "Fashion designer"
  },
  "side_text": {
   "uz": "Libos — so‘zsiz aytilgan hikoya",
   "ru": "Одежда — история без слов",
   "en": "Clothing is a story told without words"
  }
 },
 "home": {
  "categories_label": {
   "uz": "Toifalar bo‘yicha",
   "ru": "По категориям",
   "en": "Shop by category"
  },
  "categories_title": {
   "uz": "O‘z uslubingizni toping",
   "ru": "Найдите свой стиль",
   "en": "Find your perfect style"
  },
  "categories_text": {
   "uz": "Har bir kayfiyat, lahza va marosim uchun to‘plamlar",
   "ru": "Коллекции для любого настроения, момента и события",
   "en": "Curated collections for every mood, moment and occasion"
  },
  "welcome_label": {
   "uz": "Xush kelibsiz",
   "ru": "Добро пожаловать",
   "en": "Welcome to"
  },
  "welcome_title": {
   "uz": "Libosdan ko‘proq",
   "ru": "Больше, чем одежда",
   "en": "More than fashion"
  },
  "welcome_text": {
   "uz": "Har bir loyiha mato tanlashdan boshlanadi. Milliy an’ana va zamonaviy bichim uyg‘unligida yaratilgan liboslar bilan tanishing.",
   "ru": "Каждый проект начинается с выбора ткани. Познакомьтесь с изделиями, в которых национальные традиции сочетаются с современным кроем.",
   "en": "Every project begins with choosing the fabric. Discover garments where national tradition meets contemporary tailoring."
  },
  "welcome_image": "/assets/img/demo/atelier.svg"
 },
 "about": {
  "name": {
   "uz": "Dizayner ismi",
   "ru": "Имя дизайнера",
   "en": "Designer name"
  },
  "role": {
   "uz": "Tikuvchi-dizayner",
   "ru": "Дизайнер-модельер",
   "en": "Fashion designer & tailor"
  },
  "quote": {
   "uz": "Har bir libosda milliy an’ana va zamonaviy nafosatni uyg‘unlashtiraman.",
   "ru": "В каждом изделии я соединяю национальные традиции и современную элегантность.",
   "en": "In every garment I blend national tradition with modern elegance."
  },
  "bio": {
   "uz": "Milliy matolar va zamonaviy bichim uyg‘unligida ishlaydigan tikuvchi-dizayner. Har bir loyiha mato tanlashdan boshlanadi: atlas, adras, ipak va baxmalning tabiiy go‘zalligini zamonaviy siluetlarda ochib berish asosiy maqsad.\n\nIlmiy izlanishlar milliy kiyim an’analarini o‘rganish va ularni bugungi moda tiliga moslashtirishga qaratilgan.",
   "ru": "Дизайнер-модельер, работающий на стыке национальных тканей и современного кроя. Каждый проект начинается с выбора ткани: главная цель — раскрыть природную красоту атласа, адраса, шёлка и бархата в современных силуэтах.\n\nНаучные исследования посвящены изучению национальных традиций одежды и их адаптации к языку современной моды.",
   "en": "A fashion designer and tailor working where national fabrics meet contemporary cut. Every project begins with the fabric: the aim is to reveal the natural beauty of atlas, adras, silk and velvet in modern silhouettes.\n\nResearch focuses on studying national clothing traditions and adapting them to today's fashion language."
  },
  "photo_url": "/assets/img/demo/portrait.svg",
  "experience_years": 8,
  "skills": [
   {
    "uz": "Milliy liboslar",
    "ru": "Национальная одежда",
    "en": "National wear"
   },
   {
    "uz": "Bichish va modellashtirish",
    "ru": "Конструирование и моделирование",
    "en": "Pattern making"
   },
   {
    "uz": "Kechki liboslar",
    "ru": "Вечерние платья",
    "en": "Evening wear"
   },
   {
    "uz": "Mato tanlash",
    "ru": "Подбор тканей",
    "en": "Fabric selection"
   },
   {
    "uz": "Qo‘lda kashta",
    "ru": "Ручная вышивка",
    "en": "Hand embroidery"
   }
  ],
  "timeline": [
   {
    "year": "2016",
    "title": {
     "uz": "Kasbiy ta’lim",
     "ru": "Профессиональное образование",
     "en": "Professional education"
    },
    "text": {
     "uz": "Tikuvchilik va kiyim dizayni yo‘nalishida ta’lim.",
     "ru": "Обучение по направлению швейное дело и дизайн одежды.",
     "en": "Studies in tailoring and fashion design."
    }
   },
   {
    "year": "2019",
    "title": {
     "uz": "Shaxsiy atelye",
     "ru": "Собственное ателье",
     "en": "Own atelier"
    },
    "text": {
     "uz": "Buyurtma asosida liboslar tikish va birinchi kolleksiya.",
     "ru": "Пошив на заказ и первая коллекция.",
     "en": "Made-to-measure tailoring and the first collection."
    }
   },
   {
    "year": "2024",
    "title": {
     "uz": "Ilmiy faoliyat",
     "ru": "Научная деятельность",
     "en": "Research"
    },
    "text": {
     "uz": "Milliy matolarni zamonaviy dizaynda qo‘llash bo‘yicha izlanishlar.",
     "ru": "Исследования применения национальных тканей в современном дизайне.",
     "en": "Research on using national fabrics in contemporary design."
    }
   }
  ]
 },
 "contact": {
  "phone": "+998 90 000 00 00",
  "email": "",
  "address": {
   "uz": "Toshkent, O‘zbekiston",
   "ru": "Ташкент, Узбекистан",
   "en": "Tashkent, Uzbekistan"
  },
  "hours": {
   "uz": "Du–Sh: 9:00–19:00",
   "ru": "Пн–Сб: 9:00–19:00",
   "en": "Mon–Sat: 9:00–19:00"
  },
  "instagram": "",
  "telegram": "",
  "facebook": "",
  "youtube": "",
  "map_embed": ""
 },
 "appearance": {
  "active_theme": "zamonaviy",
  "animations": true,
  "three_d": true,
  "cursor": true
 },
 "gown": {
  "silhouette": "aline",
  "neckline": "illusion",
  "sleeves": "long",
  "fabric": "lace",
  "color": "#efe6d8",
  "lace": "#fffdf8",
  "trim": "none",
  "scallop": true,
  "spread": 100,
  "train": 40,
  "size": 25,
  "width": 45,
  "speed": 40,
  "mannequin": "linen",
  "finial": "silver",
  "sparkle": false,
  "motion": true
 }
};
