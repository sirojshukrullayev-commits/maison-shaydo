"""Boshlang'ich ma'lumotlar: mavzular, sozlamalar, namuna loyihalar.
Bu fayldan supabase/seed.sql va assets/js/defaults.js yaratiladi."""
import json, os

def L(uz, ru, en):
    return {"uz": uz, "ru": ru, "en": en}

PRESETS = [
    {"slug": "zamonaviy", "name": L("Zamonaviy", "Современная", "Modern"), "sort_order": 1, "tokens": {
        "colors": {"bg": "#ffffff", "surface": "#f7f2ec", "text": "#1d1814", "muted": "#7c7169", "primary": "#6e533f",
                   "accent": "#b89474", "heroBg": "#8d7360", "heroBg2": "#4f3a2c", "heroText": "#f6eee5", "dark": "#4a3628"},
        "fonts": {"heading": "Playfair Display", "body": "Montserrat"},
        "radius": 18, "pattern": "none", "fabric": "silk", "mannequin": "linen", "dark": False}},
    {"slug": "milliy", "name": L("Milliy", "Национальная", "National"), "sort_order": 2, "tokens": {
        "colors": {"bg": "#fbf6ea", "surface": "#f3ead6", "text": "#18213f", "muted": "#5d6584", "primary": "#1f3a8a",
                   "accent": "#d4a437", "heroBg": "#1d3285", "heroBg2": "#0c1640", "heroText": "#fdf3dc", "dark": "#14245e"},
        "fonts": {"heading": "Prata", "body": "Manrope"},
        "radius": 14, "pattern": "ornament", "fabric": "atlas", "mannequin": "linen", "dark": False}},
    {"slug": "klassik", "name": L("Klassik", "Классическая", "Classic"), "sort_order": 3, "tokens": {
        "colors": {"bg": "#100e0c", "surface": "#1b1815", "text": "#f2e9d8", "muted": "#a89c88", "primary": "#c9a45c",
                   "accent": "#e6cf9a", "heroBg": "#2a231b", "heroBg2": "#0a0908", "heroText": "#f3e6c9", "dark": "#211c16"},
        "fonts": {"heading": "Cormorant Garamond", "body": "Jost"},
        "radius": 4, "pattern": "lines", "fabric": "velvet", "mannequin": "black", "dark": True}},
    {"slug": "minimal", "name": L("Minimal", "Минимализм", "Minimal"), "sort_order": 4, "tokens": {
        "colors": {"bg": "#ffffff", "surface": "#f4f4f2", "text": "#111111", "muted": "#6b6b6b", "primary": "#111111",
                   "accent": "#9a9a9a", "heroBg": "#ececea", "heroBg2": "#cfcfcc", "heroText": "#111111", "dark": "#1a1a1a"},
        "fonts": {"heading": "Lora", "body": "Inter"},
        "radius": 0, "pattern": "none", "fabric": "linen", "mannequin": "white", "dark": False}},
    {"slug": "pastel", "name": L("Pastel", "Пастельная", "Pastel"), "sort_order": 5, "tokens": {
        "colors": {"bg": "#fffafa", "surface": "#fbeff2", "text": "#3a2b33", "muted": "#8b7480", "primary": "#c0688a",
                   "accent": "#a993dc", "heroBg": "#f2cfd9", "heroBg2": "#d9c4ec", "heroText": "#3a2b33", "dark": "#6d4a5e"},
        "fonts": {"heading": "Cormorant Garamond", "body": "Nunito"},
        "radius": 26, "pattern": "dots", "fabric": "chiffon", "mannequin": "white", "dark": False}},
]

SETTINGS = {
    "general": {
        "site_name": "Maison Shaydo",
        "logo_url": "",
        "tagline": L("Tikuvchi-dizayner portfoliosi", "Портфолио дизайнера одежды", "Fashion designer portfolio"),
        "seo_description": L("Tikuvchi-dizayner loyihalari, ilmiy ishlari va yutuqlari",
                             "Проекты, научные работы и достижения дизайнера одежды",
                             "Projects, research and achievements of a fashion designer"),
        "footer_text": L("Har bir libos — o‘z egasining hikoyasi.", "Каждое изделие — история своего владельца.",
                         "Every garment tells its owner's story."),
    },
    "hero": {
        "mode": "3d",
        "image_url": "",
        "word": L("SHAYDO", "SHAYDO", "SHAYDO"),
        "eyebrow": L("Tikuvchi-dizayner", "Дизайнер одежды", "Fashion designer"),
        "side_text": L("Libos — so‘zsiz aytilgan hikoya", "Одежда — история без слов", "Clothing is a story told without words"),
    },
    "home": {
        "categories_label": L("Toifalar bo‘yicha", "По категориям", "Shop by category"),
        "categories_title": L("O‘z uslubingizni toping", "Найдите свой стиль", "Find your perfect style"),
        "categories_text": L("Har bir kayfiyat, lahza va marosim uchun to‘plamlar",
                             "Коллекции для любого настроения, момента и события",
                             "Curated collections for every mood, moment and occasion"),
        "welcome_label": L("Xush kelibsiz", "Добро пожаловать", "Welcome to"),
        "welcome_title": L("Libosdan ko‘proq", "Больше, чем одежда", "More than fashion"),
        "welcome_text": L("Har bir loyiha mato tanlashdan boshlanadi. Milliy an’ana va zamonaviy bichim uyg‘unligida yaratilgan liboslar bilan tanishing.",
                          "Каждый проект начинается с выбора ткани. Познакомьтесь с изделиями, в которых национальные традиции сочетаются с современным кроем.",
                          "Every project begins with choosing the fabric. Discover garments where national tradition meets contemporary tailoring."),
        "welcome_image": "/assets/img/demo/atelier.svg",
    },
    "about": {
        "name": L("Dizayner ismi", "Имя дизайнера", "Designer name"),
        "role": L("Tikuvchi-dizayner", "Дизайнер-модельер", "Fashion designer & tailor"),
        "quote": L("Har bir libosda milliy an’ana va zamonaviy nafosatni uyg‘unlashtiraman.",
                   "В каждом изделии я соединяю национальные традиции и современную элегантность.",
                   "In every garment I blend national tradition with modern elegance."),
        "bio": L("Milliy matolar va zamonaviy bichim uyg‘unligida ishlaydigan tikuvchi-dizayner. Har bir loyiha mato tanlashdan boshlanadi: atlas, adras, ipak va baxmalning tabiiy go‘zalligini zamonaviy siluetlarda ochib berish asosiy maqsad.\n\nIlmiy izlanishlar milliy kiyim an’analarini o‘rganish va ularni bugungi moda tiliga moslashtirishga qaratilgan.",
                 "Дизайнер-модельер, работающий на стыке национальных тканей и современного кроя. Каждый проект начинается с выбора ткани: главная цель — раскрыть природную красоту атласа, адраса, шёлка и бархата в современных силуэтах.\n\nНаучные исследования посвящены изучению национальных традиций одежды и их адаптации к языку современной моды.",
                 "A fashion designer and tailor working where national fabrics meet contemporary cut. Every project begins with the fabric: the aim is to reveal the natural beauty of atlas, adras, silk and velvet in modern silhouettes.\n\nResearch focuses on studying national clothing traditions and adapting them to today's fashion language."),
        "photo_url": "/assets/img/demo/portrait.svg",
        "experience_years": 8,
        "skills": [L("Milliy liboslar", "Национальная одежда", "National wear"),
                   L("Bichish va modellashtirish", "Конструирование и моделирование", "Pattern making"),
                   L("Kechki liboslar", "Вечерние платья", "Evening wear"),
                   L("Mato tanlash", "Подбор тканей", "Fabric selection"),
                   L("Qo‘lda kashta", "Ручная вышивка", "Hand embroidery")],
        "timeline": [
            {"year": "2016", "title": L("Kasbiy ta’lim", "Профессиональное образование", "Professional education"),
             "text": L("Tikuvchilik va kiyim dizayni yo‘nalishida ta’lim.", "Обучение по направлению швейное дело и дизайн одежды.", "Studies in tailoring and fashion design.")},
            {"year": "2019", "title": L("Shaxsiy atelye", "Собственное ателье", "Own atelier"),
             "text": L("Buyurtma asosida liboslar tikish va birinchi kolleksiya.", "Пошив на заказ и первая коллекция.", "Made-to-measure tailoring and the first collection.")},
            {"year": "2024", "title": L("Ilmiy faoliyat", "Научная деятельность", "Research"),
             "text": L("Milliy matolarni zamonaviy dizaynda qo‘llash bo‘yicha izlanishlar.", "Исследования применения национальных тканей в современном дизайне.", "Research on using national fabrics in contemporary design.")},
        ],
    },
    "contact": {
        "phone": "+998 90 000 00 00",
        "email": "",
        "address": L("Toshkent, O‘zbekiston", "Ташкент, Узбекистан", "Tashkent, Uzbekistan"),
        "hours": L("Du–Sh: 9:00–19:00", "Пн–Сб: 9:00–19:00", "Mon–Sat: 9:00–19:00"),
        "instagram": "", "telegram": "", "facebook": "", "youtube": "",
        "map_embed": "",
    },
    "appearance": {"active_theme": "zamonaviy", "animations": True, "three_d": True, "cursor": True},
    # Bosh sahifadagi 3D ko'ylak (assets/js/gown-config.js dagi GOWN_DEFAULTS bilan bir xil)
    "gown": {"silhouette": "aline", "neckline": "illusion", "sleeves": "long", "fabric": "lace", "color": "#efe6d8",
             "lace": "#fffdf8", "trim": "none", "scallop": True, "spread": 100, "train": 40, "size": 25, "width": 45, "speed": 40, "mannequin": "linen",
             "finial": "silver", "sparkle": False, "motion": True,
             "source": "procedural", "photo_front": "", "photo_back": "", "project_id": ""},
}

CATEGORIES = [
    {"slug": "milliy", "name": L("Milliy liboslar", "Национальная одежда", "National wear"), "image_url": "/assets/img/demo/cat-milliy.svg", "sort_order": 1},
    {"slug": "kechki", "name": L("Kechki liboslar", "Вечерние платья", "Evening wear"), "image_url": "/assets/img/demo/cat-kechki.svg", "sort_order": 2},
    {"slug": "kundalik", "name": L("Kundalik kiyimlar", "Повседневная одежда", "Everyday wear"), "image_url": "/assets/img/demo/cat-kundalik.svg", "sort_order": 3},
    {"slug": "bolalar", "name": L("Bolalar kiyimlari", "Детская одежда", "Kidswear"), "image_url": "/assets/img/demo/cat-bolalar.svg", "sort_order": 4},
]

PROJECTS = [
    {"slug": "atlas-jilosi", "category": "milliy", "year": 2025, "is_featured": True, "sort_order": 1,
     "title": L("Atlas jilosi", "Сияние атласа", "Atlas Glow"),
     "description": L("Marg‘ilon atlasidan tikilgan uzun ko‘ylak. Yoqa va etak zarrin hoshiya bilan bezatilgan, bichimi esa zamonaviy A-siluetda.",
                      "Длинное платье из маргиланского атласа. Ворот и подол украшены золотой каймой, крой — современный А-силуэт.",
                      "A long dress in Margilan atlas silk. The collar and hem carry a golden trim, cut in a modern A-line silhouette."),
     "fabric": L("Atlas (ipak)", "Атлас (шёлк)", "Atlas (silk)"), "fabric_image_url": "/assets/img/demo/fabric-atlas.svg",
     "images": ["/assets/img/demo/p-atlas.svg", "/assets/img/demo/p-atlas-2.svg"]},
    {"slug": "tungi-nafosat", "category": "kechki", "year": 2025, "is_featured": True, "sort_order": 2,
     "title": L("Tungi nafosat", "Ночная элегантность", "Evening Grace"),
     "description": L("Tabiiy ipakdan kechki ko‘ylak: belga yopishgan ustki qism va yengil to‘lqinlanuvchi keng etak.",
                      "Вечернее платье из натурального шёлка: облегающий лиф и лёгкая струящаяся юбка.",
                      "An evening gown in natural silk: a fitted bodice and a light, flowing skirt."),
     "fabric": L("Tabiiy ipak", "Натуральный шёлк", "Natural silk"), "fabric_image_url": "/assets/img/demo/fabric-silk.svg",
     "images": ["/assets/img/demo/p-evening.svg", "/assets/img/demo/p-evening-2.svg"]},
    {"slug": "adras-chopon", "category": "milliy", "year": 2024, "is_featured": True, "sort_order": 3,
     "title": L("Adras chopon", "Чапан из адраса", "Adras Chapan"),
     "description": L("An’anaviy chopon bichimi zamonaviy uzunlik va ingichka belbog‘ bilan qayta talqin qilingan.",
                      "Традиционный крой чапана, переосмысленный в современной длине с тонким поясом.",
                      "A traditional chapan cut reinterpreted with a modern length and a slim belt."),
     "fabric": L("Adras", "Адрас", "Adras"), "fabric_image_url": "/assets/img/demo/fabric-adras.svg",
     "images": ["/assets/img/demo/p-chopon.svg"]},
    {"slug": "baxmal-kecha", "category": "kechki", "year": 2024, "is_featured": True, "sort_order": 4,
     "title": L("Baxmal kecha", "Бархатная ночь", "Velvet Night"),
     "description": L("“Suv parisi” siluetidagi baxmal ko‘ylak: qomatni ta’kidlaydi va pastda keng ochiladi.",
                      "Бархатное платье силуэта «русалка»: подчёркивает фигуру и расширяется книзу.",
                      "A mermaid-silhouette velvet gown that follows the figure and flares at the hem."),
     "fabric": L("Baxmal", "Бархат", "Velvet"), "fabric_image_url": "/assets/img/demo/fabric-velvet.svg",
     "images": ["/assets/img/demo/p-velvet.svg"]},
    {"slug": "bahor-nafasi", "category": "kundalik", "year": 2023, "is_featured": False, "sort_order": 5,
     "title": L("Bahor nafasi", "Дыхание весны", "Spring Breeze"),
     "description": L("Zig‘ir matosidan yengil kundalik ko‘ylak: qulay bichim va tabiiy rang.",
                      "Лёгкое повседневное платье из льна: удобный крой и натуральный цвет.",
                      "A light everyday dress in linen: comfortable cut and natural colour."),
     "fabric": L("Zig‘ir", "Лён", "Linen"), "fabric_image_url": "/assets/img/demo/fabric-linen.svg",
     "images": ["/assets/img/demo/p-casual.svg"]},
    {"slug": "kichik-malika", "category": "bolalar", "year": 2023, "is_featured": False, "sort_order": 6,
     "title": L("Kichik malika", "Маленькая принцесса", "Little Princess"),
     "description": L("Bolalar uchun bayramona ko‘ylak: shifon qatlamli etak va yumshoq astar.",
                      "Праздничное детское платье: многослойная юбка из шифона и мягкая подкладка.",
                      "A festive children's dress with a layered chiffon skirt and soft lining."),
     "fabric": L("Shifon", "Шифон", "Chiffon"), "fabric_image_url": "/assets/img/demo/fabric-chiffon.svg",
     "images": ["/assets/img/demo/p-kids.svg"]},
]

RESEARCH = [
    {"year": 2025, "sort_order": 1, "link_url": "",
     "title": L("Ilmiy maqola nomi (namuna)", "Название научной статьи (образец)", "Research paper title (sample)"),
     "venue": L("Jurnal yoki konferensiya nomi", "Название журнала или конференции", "Journal or conference name"),
     "summary": L("Bu namuna yozuv. Admin paneldagi “Ilmiy ishlar” bo‘limidan haqiqiy ilmiy ishingizni qo‘shing va PDF faylini yuklang.",
                  "Это пример записи. Добавьте реальную научную работу и PDF-файл в разделе «Научные работы» админ-панели.",
                  "This is a sample entry. Add your real research and upload its PDF in the “Research” section of the admin panel.")},
    {"year": 2024, "sort_order": 2, "link_url": "",
     "title": L("Konferensiya tezisi nomi (namuna)", "Название тезисов конференции (образец)", "Conference abstract title (sample)"),
     "venue": L("Konferensiya nomi", "Название конференции", "Conference name"),
     "summary": L("Qisqa izoh: tadqiqot mavzusi, maqsadi va asosiy natijalari.",
                  "Краткое описание: тема, цель и основные результаты исследования.",
                  "Short summary: the topic, aim and main results of the study.")},
]

ACHIEVEMENTS = [
    {"year": 2025, "sort_order": 1, "image_url": "/assets/img/demo/award.svg",
     "title": L("Diplom yoki sertifikat nomi (namuna)", "Название диплома или сертификата (образец)", "Diploma or certificate title (sample)"),
     "issuer": L("Beruvchi tashkilot", "Выдавшая организация", "Issuing organisation"),
     "description": L("Yutuq haqida qisqa ma’lumot.", "Краткая информация о достижении.", "A short note about the achievement.")},
    {"year": 2024, "sort_order": 2, "image_url": "/assets/img/demo/award.svg",
     "title": L("Ko‘rik-tanlov g‘olibi (namuna)", "Победитель конкурса (образец)", "Competition winner (sample)"),
     "issuer": L("Tanlov tashkilotchisi", "Организатор конкурса", "Competition organiser"),
     "description": L("Yutuq haqida qisqa ma’lumot.", "Краткая информация о достижении.", "A short note about the achievement.")},
]

def q(v):
    """SQL literal."""
    if v is None:
        return 'null'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, (dict, list)):
        return "'" + json.dumps(v, ensure_ascii=False).replace("'", "''") + "'::jsonb"
    return "'" + str(v).replace("'", "''") + "'"

def build_sql():
    out = ["-- Boshlang'ich ma'lumotlar (mavzular, sozlamalar, namuna kontent)"]
    for p in PRESETS:
        out.append(f"insert into public.themes (slug, name, tokens, is_builtin, sort_order) values ({q(p['slug'])}, {q(p['name'])}, {q(p['tokens'])}, true, {p['sort_order']}) on conflict (slug) do update set name = excluded.name, tokens = excluded.tokens;")
    for k, v in SETTINGS.items():
        if k == 'appearance':
            continue
        out.append(f"insert into public.settings (key, value) values ({q(k)}, {q(v)}) on conflict (key) do nothing;")
    app = dict(SETTINGS['appearance'])
    app_json = json.dumps({k: v for k, v in app.items() if k != 'active_theme'}, ensure_ascii=False)
    out.append("insert into public.settings (key, value) select 'appearance', "
               f"'{app_json}'::jsonb || jsonb_build_object('active_theme', t.id::text) from public.themes t where t.slug = 'zamonaviy' on conflict (key) do nothing;")
    for c in CATEGORIES:
        out.append(f"insert into public.categories (slug, name, image_url, sort_order) values ({q(c['slug'])}, {q(c['name'])}, {q(c['image_url'])}, {c['sort_order']}) on conflict (slug) do nothing;")
    for p in PROJECTS:
        out.append("insert into public.projects (slug, title, description, fabric, fabric_image_url, year, category_id, cover_url, is_featured, sort_order) "
                   f"select {q(p['slug'])}, {q(p['title'])}, {q(p['description'])}, {q(p['fabric'])}, {q(p['fabric_image_url'])}, {p['year']}, c.id, {q(p['images'][0])}, {q(p['is_featured'])}, {p['sort_order']} "
                   f"from public.categories c where c.slug = {q(p['category'])} on conflict (slug) do nothing;")
        for i, img in enumerate(p['images']):
            out.append(f"insert into public.project_images (project_id, url, original_url, mode, sort_order) select p.id, {q(img)}, {q(img)}, 'original', {i} from public.projects p where p.slug = {q(p['slug'])} and not exists (select 1 from public.project_images pi where pi.project_id = p.id and pi.url = {q(img)});")
    for r in RESEARCH:
        out.append(f"insert into public.research (title, venue, summary, year, link_url, sort_order) values ({q(r['title'])}, {q(r['venue'])}, {q(r['summary'])}, {r['year']}, {q(r['link_url'])}, {r['sort_order']});")
    for a in ACHIEVEMENTS:
        out.append(f"insert into public.achievements (title, issuer, description, year, image_url, sort_order) values ({q(a['title'])}, {q(a['issuer'])}, {q(a['description'])}, {a['year']}, {q(a['image_url'])}, {a['sort_order']});")
    return '\n'.join(out) + '\n'

def build_js():
    return ("// Avtomatik yaratilgan: tools/seed_data.py. Baza ishlamay qolsa ham sayt shu qiymatlar bilan ochiladi.\n"
            f"export const PRESETS = {json.dumps(PRESETS, ensure_ascii=False, indent=1)};\n\n"
            f"export const DEFAULT_SETTINGS = {json.dumps(SETTINGS, ensure_ascii=False, indent=1)};\n")

if __name__ == '__main__':
    root = os.path.join(os.path.dirname(__file__), '..')
    with open(os.path.join(root, 'supabase', 'seed.sql'), 'w') as f:
        f.write(build_sql())
    os.makedirs(os.path.join(root, 'assets', 'js'), exist_ok=True)
    with open(os.path.join(root, 'assets', 'js', 'defaults.js'), 'w') as f:
        f.write(build_js())
    # Lokal test uchun to'liq namuna baza
    with open('/tmp/seed.json', 'w') as f:
        json.dump({"PRESETS": PRESETS, "SETTINGS": SETTINGS, "CATEGORIES": CATEGORIES, "PROJECTS": PROJECTS,
                   "RESEARCH": RESEARCH, "ACHIEVEMENTS": ACHIEVEMENTS}, f, ensure_ascii=False)
    print('seed ok')
