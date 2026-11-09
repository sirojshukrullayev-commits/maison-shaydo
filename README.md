# Maison Shaydo — tikuvchi-dizayner portfolio sayti

Tikuvchi-dizayner loyihalari, u haqidagi ma'lumotlar, ilmiy ishlar va yutuqlarni ko'rsatuvchi sayt. Barcha kontent va sayt dizayni admin paneldan boshqariladi.

- **Sayt:** https://maison-shaydo.vercel.app
- **Admin panel:** https://maison-shaydo.vercel.app/admin
- **Ma'lumotlar bazasi:** Supabase (PostgreSQL + Storage + Auth)
- **Hosting:** Vercel (statik sayt, build talab qilinmaydi)

## Imkoniyatlar

**Ommaviy sahifalar:** bosh sahifa, dizayner haqida, loyihalar (portfolio), har bir loyihaning alohida sahifasi, ilmiy ishlar, aloqa.

- 3 til: o'zbek, rus, ingliz. Foydalanuvchi tanlagan til eslab qolinadi.
- Bosh sahifada "SHAYDO" so'zidagi "A" harfi o'rnida 3D ko'ylak (three.js): sekin aylanib turadi, sichqoncha yoki barmoq bilan ham aylantiriladi. Ko'rinishi faqat admin paneldagi "3D ko'ylak" bo'limidan sozlanadi.
- Loyiha sahifasida "3D'da ko'rish": loyiha matosi 3D libosga kiydiriladi.
- Animatsiyalar: harflarning paydo bo'lishi, kartalarning 3D egilishi, parallaks, magnit tugmalar, maxsus kursor, sahifalar orasidagi o'tish.
- Loyihalarni toifa, yil va qidiruv bo'yicha saralash; rasmlarni to'liq ekranda ko'rish.
- Aloqa formasi: xabarlar admin panelga tushadi.

**Admin panel (`/admin`):**

- Bosh sahifa, loyihalar, toifalar, dizayner haqida, ilmiy ishlar (PDF bilan), yutuqlar, aloqa ma'lumotlari, xabarlar, sozlamalar.
- Har bir matn UZ / RU / EN yorliqlarida kiritiladi. Tarjima bo'sh bo'lsa, o'zbekcha matn ko'rsatiladi.
- Rasm muharriri: asl rasm, fonni olib tashlash (AI yoki oddiy usul), istalgan fon rangi yoki gradient, kiyimni 3D manekenga joylash.
- Dizayn va mavzular: 5 ta tayyor mavzu (Zamonaviy, Milliy, Klassik, Minimal, Pastel), har birining ranglari, shriftlari, naqshi va 3D libosini o'zgartirish, yangi mavzu yaratish, jonli ko'rinish.
- 3D ko'ylak: siluet, yoqa, yenglar, mato, ranglar, bel bezagi, dantel chetlari, bo'yi, etak kengligi, aylanish va tezligi; 5 ta tayyor uslub va jonli ko'rinish.
- Haqiqiy ko'ylak suratidan 3D: ko'ylakning oldidan (va xohlasa orqasidan) surati yuklanadi, fon avtomatik olib tashlanadi; bosh sahifada yoki loyiha sahifasidagi "3D ko'rish" oynasida aynan shu ko'ylak yengil burilib ko'rinadi.
- Animatsiya, 3D va kursor effektlarini yoqish/o'chirish.

**Admin panelga kirish:** login `maisonshaydo` va parol. Parolni "Sozlamalar" bo'limidan almashtirish mumkin.

## Tuzilma

```
index.html, about.html, projects.html, project.html, research.html, contact.html, 404.html, admin.html
assets/css/main.css          ommaviy sahifalar uslublari
assets/css/admin.css         admin panel uslublari
assets/js/config.js          Supabase manzili va ochiq kalit
assets/js/i18n.js            interfeys tarjimalari
assets/js/theme.js           mavzu tizimi (ranglar, shriftlar, naqshlar)
assets/js/layout.js          header, footer, til tanlagich, preloader
assets/js/anim.js            animatsiyalar
assets/js/three/mannequin.js 3D maneken va libos (loyiha sahifasi)
assets/js/three/gown.js      bosh sahifadagi 3D ko'ylak (chizilgan)
assets/js/three/photodress.js haqiqiy ko'ylak suratidan 3D
assets/js/gown-config.js     3D ko'ylak sozlamalari (standart qiymatlar)
assets/js/pages/*.js         har bir sahifa skripti
assets/js/admin/*.js         admin panel, forma quruvchi, rasm muharriri
supabase/migrations/*.sql    baza sxemasi va xavfsizlik qoidalari (RLS)
supabase/seed.sql            boshlang'ich ma'lumotlar
tools/                       namuna rasmlar va sahifalarni yaratuvchi skriptlar
```

## Lokal ishga tushirish

Build kerak emas. Istalgan statik server yetarli, masalan:

```bash
npx serve .            # yoki: python3 -m http.server 8000
```

Eslatma: `/about` kabi qisqa manzillar Vercel'dagi `cleanUrls` sozlamasi orqali ishlaydi. Lokal serverda `about.html` ko'rinishida oching.

## Joylash (deploy)

Repozitoriydagi `main` tarmog'i Vercel'dagi `maison-shaydo` loyihasiga joylanadi. Har bir yangi push'dan keyin avtomatik joylanishi uchun Vercel'da GitHub akkauntini ulang: Vercel → Project Settings → Git → Connect Git Repository.

## Xavfsizlik

- Saytda faqat Supabase'ning ochiq (anon) kaliti ishlatiladi; barcha ruxsatlar bazadagi RLS qoidalari bilan cheklangan.
- Ma'lumotlarni o'zgartirish faqat `admins` jadvalidagi foydalanuvchilarga ruxsat etilgan.
- Mehmonlar faqat e'lon qilingan kontentni o'qiy oladi va aloqa formasi orqali xabar yubora oladi.
