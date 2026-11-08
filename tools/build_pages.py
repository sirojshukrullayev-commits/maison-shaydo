"""HTML sahifalarini bitta shablondan yaratadi (bosh qism hamma sahifada bir xil bo'lishi uchun)."""
import os
ROOT = os.path.join(os.path.dirname(__file__), '..')

EARLY = """<script>(function(){try{var d=document.documentElement,c=localStorage.getItem('ms_theme_css');if(c){var s=document.createElement('style');s.id='theme-early';s.textContent=c;document.head.appendChild(s);}var f=localStorage.getItem('ms_theme_fonts')||'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Montserrat:wght@300;400;500;600;700&display=swap';var l=document.createElement('link');l.id='theme-fonts';l.rel='stylesheet';l.href=f;document.head.appendChild(l);var m=JSON.parse(localStorage.getItem('ms_theme_meta')||'{}');d.dataset.pattern=m.pattern||'none';d.dataset.dark=m.dark?'1':'0';var g=localStorage.getItem('ms_lang');if(g)d.lang=g;}catch(e){}})();</script>"""

IMPORTMAP = """<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>"""

PRELOADER = """<div id="preloader" class="preloader" aria-hidden="true"><div class="preloader-inner">
  <svg class="preloader-star" viewBox="0 0 24 24"><g stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M12 2.5v19M2.5 12h19M5.3 5.3l13.4 13.4M18.7 5.3L5.3 18.7"/></g></svg>
  <div class="preloader-name"><span id="pl-name">Maison Shaydo</span></div><div class="preloader-bar"></div></div></div>
<script>(function(){try{if(sessionStorage.getItem('ms_seen')==='1'){var p=document.getElementById('preloader');p&&p.remove();return;}var s=JSON.parse(localStorage.getItem('ms_cache_v1:site')||'null');var n=s&&s.data&&s.data.settings&&s.data.settings.general&&s.data.settings.general.site_name;if(n)document.getElementById('pl-name').textContent=n;}catch(e){}})();</script>"""

# Bosh sahifadagi 3D ko'ylak uchun three.js oldindan yuklanadi
PRELOAD_3D = '<link rel="modulepreload" href="https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js" crossorigin>'

def page(name, script, body_cls='', title_key='', preloader=True, preload_3d=False):
    html = f"""<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Maison Shaydo</title>
<meta name="description" content="Tikuvchi-dizayner loyihalari, ilmiy ishlari va yutuqlari">
<meta name="theme-color" content="#4f3a2c">
<meta property="og:type" content="website">
<meta property="og:title" content="Maison Shaydo">
<meta property="og:image" content="/assets/img/og.jpg">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://uvwcpzanokhxuvmphhox.supabase.co" crossorigin>
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
{EARLY}
{IMPORTMAP}
<link rel="stylesheet" href="/assets/css/main.css">
<script type="module" src="/assets/js/pages/{script}.js"></script>
{PRELOAD_3D if preload_3d else ''}
</head>
<body class="{body_cls}" data-title="{title_key}">
{PRELOADER if preloader else ''}
<header id="site-header" class="site-header"></header>
<div id="mobile-menu" class="mobile-menu" hidden></div>
<main id="main"></main>
<footer id="site-footer" class="site-footer"></footer>
<noscript><div style="padding:120px 24px;text-align:center">Saytdan foydalanish uchun brauzeringizda JavaScript yoqilgan bo‘lishi kerak.</div></noscript>
</body>
</html>
"""
    with open(os.path.join(ROOT, name), 'w') as f:
        f.write(html)

page('index.html', 'home', 'has-hero', '', preload_3d=True)
page('about.html', 'about', 'has-hero', 'nav_about')
page('projects.html', 'projects', 'has-hero', 'nav_projects')
page('project.html', 'project', '', 'nav_projects', preloader=False)
page('research.html', 'research', 'has-hero', 'nav_research')
page('contact.html', 'contact', 'has-hero', 'nav_contact')
page('404.html', 'notfound', '', 'page_not_found', preloader=False)
print('pages ok')
