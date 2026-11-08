"""Namuna (demo) rasmlarini SVG ko'rinishida yaratadi: liboslar, mato namunalari, portret, atelye, sertifikat."""
import math, random, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'img', 'demo')
os.makedirs(OUT, exist_ok=True)

def fabric_defs(fid, kind, c):
    """Mato naqshi uchun <defs> qaytaradi. c - ranglar ro'yxati."""
    if kind == 'atlas':
        # Ikat uslubidagi vertikal zigzag chiziqlar
        w = 120
        parts = [f'<pattern id="{fid}" width="{w}" height="60" patternUnits="userSpaceOnUse">',
                 f'<rect width="{w}" height="60" fill="{c[0]}"/>']
        cols = c[1:]
        x = 0
        widths = [18, 10, 22, 8, 16, 12, 20, 14]
        i = 0
        while x < w:
            bw = widths[i % len(widths)]
            col = cols[i % len(cols)]
            d = (f'M{x},0 L{x+bw},0 L{x+bw+5},15 L{x+bw},30 L{x+bw+5},45 L{x+bw},60 '
                 f'L{x},60 L{x-5},45 L{x},30 L{x-5},15 Z')
            parts.append(f'<path d="{d}" fill="{col}" opacity="0.95"/>')
            x += bw + 6
            i += 1
        parts.append('</pattern>')
        return ''.join(parts)
    if kind == 'adras':
        w = 90
        parts = [f'<pattern id="{fid}" width="{w}" height="40" patternUnits="userSpaceOnUse">',
                 f'<rect width="{w}" height="40" fill="{c[0]}"/>']
        for k, col in enumerate(c[1:]):
            x = 8 + k * 26
            parts.append(f'<path d="M{x},0 h12 l3,10 l-3,10 l3,10 l-3,10 h-12 l-3,-10 l3,-10 l-3,-10 z" fill="{col}"/>')
            parts.append(f'<rect x="{x+14}" y="0" width="2" height="40" fill="{c[1]}" opacity=".5"/>')
        parts.append('</pattern>')
        return ''.join(parts)
    if kind == 'linen':
        return (f'<pattern id="{fid}" width="8" height="8" patternUnits="userSpaceOnUse">'
                f'<rect width="8" height="8" fill="{c[0]}"/>'
                f'<path d="M0,2h8M0,6h8" stroke="{c[1]}" stroke-width=".6" opacity=".35"/>'
                f'<path d="M2,0v8M6,0v8" stroke="{c[1]}" stroke-width=".6" opacity=".25"/></pattern>')
    if kind == 'chiffon':
        return (f'<pattern id="{fid}" width="46" height="46" patternUnits="userSpaceOnUse">'
                f'<rect width="46" height="46" fill="{c[0]}"/>'
                f'<circle cx="12" cy="12" r="4" fill="{c[1]}" opacity=".55"/>'
                f'<circle cx="35" cy="34" r="3" fill="{c[2]}" opacity=".55"/>'
                f'<circle cx="34" cy="10" r="1.6" fill="{c[1]}" opacity=".5"/></pattern>')
    if kind == 'velvet':
        return (f'<linearGradient id="{fid}" x1="0" y1="0" x2="1" y2="0">'
                f'<stop offset="0" stop-color="{c[0]}"/><stop offset=".35" stop-color="{c[1]}"/>'
                f'<stop offset=".5" stop-color="{c[2]}"/><stop offset=".65" stop-color="{c[1]}"/>'
                f'<stop offset="1" stop-color="{c[0]}"/></linearGradient>')
    # silk
    return (f'<linearGradient id="{fid}" x1="0" y1="0" x2="1" y2="0">'
            f'<stop offset="0" stop-color="{c[0]}"/><stop offset=".3" stop-color="{c[1]}"/>'
            f'<stop offset=".45" stop-color="{c[2]}"/><stop offset=".6" stop-color="{c[1]}"/>'
            f'<stop offset="1" stop-color="{c[0]}"/></linearGradient>')

def folds_gradient(gid, n=9, strength=.22):
    stops = []
    for i in range(n + 1):
        t = i / n
        a = strength if i % 2 else 0
        col = '#000' if i % 2 else '#fff'
        op = a if i % 2 else strength * .55
        stops.append(f'<stop offset="{t:.3f}" stop-color="{col}" stop-opacity="{op:.2f}"/>')
    return f'<linearGradient id="{gid}" x1="0" y1="0" x2="1" y2="0">{"".join(stops)}</linearGradient>'

def silhouette(style):
    """Libos konturi (path) va etak pastki nuqtasi."""
    if style == 'gown':
        return ('M330,250 C300,262 268,276 262,300 C262,350 286,390 300,470 '
                'C250,600 180,760 140,905 C300,935 500,935 660,905 C620,760 550,600 500,470 '
                'C514,390 538,350 538,300 C532,276 500,262 470,250 C440,270 360,270 330,250 Z'), 905
    if style == 'mermaid':
        return ('M332,252 C302,262 270,276 264,300 C262,352 284,392 298,470 '
                'C286,560 300,660 330,740 C280,800 230,860 200,905 C340,930 460,930 600,905 '
                'C570,860 520,800 470,740 C500,660 514,560 502,470 C516,392 538,352 536,300 '
                'C530,276 498,262 468,252 C440,272 360,272 332,252 Z'), 905
    if style == 'national':
        return ('M350,232 C320,246 274,268 262,300 C258,360 280,410 290,470 '
                'C270,600 230,760 210,900 C330,925 470,925 590,900 C570,760 530,600 510,470 '
                'C520,410 542,360 538,300 C526,268 480,246 450,232 C430,246 370,246 350,232 Z'), 900
    if style == 'chopon':
        return ('M340,236 C300,250 262,272 252,304 C246,380 262,460 268,540 '
                'C262,660 250,780 240,900 L560,900 C550,780 538,660 532,540 '
                'C538,460 554,380 548,304 C538,272 500,250 460,236 L400,420 Z'), 900
    if style == 'casual':
        return ('M330,250 C300,262 268,276 262,300 C262,350 286,392 300,470 '
                'C270,560 240,640 225,720 C340,745 460,745 575,720 C560,640 530,560 500,470 '
                'C514,392 538,350 538,300 C532,276 500,262 470,250 C440,270 360,270 330,250 Z'), 720
    if style == 'kids':
        return ('M350,330 C326,338 304,350 300,368 C300,410 316,440 324,480 '
                'C280,540 240,600 222,660 C340,690 460,690 578,660 C560,600 520,540 476,480 '
                'C484,440 500,410 500,368 C496,350 474,338 450,330 C430,344 370,344 350,330 Z'), 660
    raise ValueError(style)

def dress_svg(name, style, kind, colors, bg=('#efe6dc', '#c9b29b'), trim=None, form='#e8dccb', transparent=False):
    path, hem = silhouette(style)
    kid = style == 'kids'
    top = 330 if kid else 230
    neck_y = top - 70
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">',
             '<defs>',
             f'<radialGradient id="bg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="{bg[0]}"/>'
             f'<stop offset="1" stop-color="{bg[1]}"/></radialGradient>',
             f'<linearGradient id="light" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/>'
             f'<stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>',
             fabric_defs('fab', kind, colors),
             folds_gradient('folds'),
             f'<linearGradient id="form" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b9a68f"/>'
             f'<stop offset=".45" stop-color="{form}"/><stop offset="1" stop-color="#a8957f"/></linearGradient>',
             '<linearGradient id="pole" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e5a46"/>'
             '<stop offset=".5" stop-color="#d9c2a0"/><stop offset="1" stop-color="#5b4938"/></linearGradient>',
             f'<clipPath id="dress"><path d="{path}"/></clipPath>',
             '<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>',
             '</defs>',
             '' if transparent else '<rect width="800" height="1000" fill="url(#bg)"/>',
             '' if transparent else '<path d="M0,0 L520,0 L800,520 L800,1000 Z" fill="url(#light)" opacity=".7"/>',
             '<ellipse cx="400" cy="955" rx="230" ry="26" fill="#000" opacity=".18" filter="url(#soft)"/>']
    # Stend
    parts.append(f'<rect x="393" y="{hem-20}" width="14" height="{945-hem+20}" fill="url(#pole)"/>')
    parts.append('<path d="M400,945 L300,968 M400,945 L500,968 M400,945 L400,975" stroke="#5b4938" stroke-width="8" stroke-linecap="round"/>')
    # Maneken bo'yni
    s = .8 if kid else 1
    parts.append(f'<rect x="{400-26*s:.0f}" y="{neck_y}" width="{52*s:.0f}" height="{80}" rx="10" fill="url(#form)"/>')
    parts.append(f'<rect x="{400-34*s:.0f}" y="{neck_y-16}" width="{68*s:.0f}" height="22" rx="10" fill="#4a3a2c"/>')
    parts.append(f'<ellipse cx="400" cy="{neck_y-20}" rx="{14*s:.0f}" ry="9" fill="#3a2d22"/>')
    # Libos
    parts.append(f'<path d="{path}" fill="url(#fab)"/>')
    parts.append(f'<g clip-path="url(#dress)"><rect x="100" y="150" width="600" height="800" fill="url(#folds)" opacity=".9"/>'
                 f'<rect x="100" y="150" width="600" height="800" fill="url(#light)" opacity=".5"/></g>')
    if trim:
        parts.append(f'<path d="{path}" fill="none" stroke="{trim}" stroke-width="5" opacity=".9"/>')
        if style in ('national', 'chopon'):
            parts.append(f'<path d="M352,236 C372,262 428,262 448,236" fill="none" stroke="{trim}" stroke-width="9"/>')
        if style == 'chopon':
            parts.append(f'<path d="M400,420 L400,900" stroke="{trim}" stroke-width="7"/>')
    # Bel chizig'i
    waist = 480 if kid else 470
    parts.append(f'<path d="M{300 if not kid else 324},{waist} C360,{waist+14} 440,{waist+14} {500 if not kid else 476},{waist}" '
                 f'fill="none" stroke="#000" stroke-opacity=".18" stroke-width="3"/>')
    parts.append('</svg>')
    with open(os.path.join(OUT, name), 'w') as f:
        f.write(''.join(parts))

def swatch_svg(name, kind, colors):
    parts = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400"><defs>',
             fabric_defs('fab', kind, colors), folds_gradient('folds', 5, .18),
             '</defs><rect width="400" height="400" fill="url(#fab)"/>',
             '<rect width="400" height="400" fill="url(#folds)"/></svg>']
    with open(os.path.join(OUT, name), 'w') as f:
        f.write(''.join(parts))

ATLAS = ['#2a1d5c', '#e6194b', '#f8c630', '#1fa37a', '#ffffff', '#3a7bd5']
ADRAS = ['#6b2d2d', '#d9a441', '#2f5d50', '#f1e3c6']

dress_svg('p-atlas.svg', 'national', 'atlas', ATLAS, bg=('#f3e9d8', '#c7ab86'), trim='#d4a437')
dress_svg('p-evening.svg', 'gown', 'silk', ['#5a1e2b', '#8e2f45', '#c76a7f'], bg=('#efe4dc', '#b99a87'))
dress_svg('p-casual.svg', 'casual', 'linen', ['#d9c7aa', '#8c7a5f'], bg=('#f2ece4', '#cdbba5'))
dress_svg('p-chopon.svg', 'chopon', 'adras', ADRAS, bg=('#efe5d6', '#b8996f'), trim='#d9a441')
dress_svg('p-velvet.svg', 'mermaid', 'velvet', ['#120f1c', '#2b2140', '#5d4a86'], bg=('#e9e1dc', '#a8958c'))
dress_svg('p-kids.svg', 'kids', 'chiffon', ['#fbe3ea', '#e9a3b8', '#b8a1e3'], bg=('#fbf3f0', '#e3cfc8'))
dress_svg('p-evening-2.svg', 'gown', 'silk', ['#2d3c5a', '#4b6390', '#9db3d8'], bg=('#ece6e0', '#ad9a8a'))
dress_svg('p-atlas-2.svg', 'gown', 'atlas', ['#0f3d3e', '#f2b134', '#e94f37', '#ffffff', '#1c7c7d'], bg=('#f1e7d7', '#bfa27c'), trim='#f2b134')

dress_svg('../hero-fallback.svg', 'gown', 'silk', ['#7a5a43', '#b08a68', '#e2c6a6'], transparent=True)

# Toifa kartalari
dress_svg('cat-milliy.svg', 'national', 'atlas', ['#1b2a6b', '#e6194b', '#f8c630', '#14a19b', '#ffffff'], bg=('#f6eee2', '#d8c3a5'), trim='#d4a437')
dress_svg('cat-kechki.svg', 'mermaid', 'silk', ['#3b2418', '#7a4a33', '#c49272'], bg=('#f4ede6', '#d3c1b0'))
dress_svg('cat-kundalik.svg', 'casual', 'linen', ['#c8b79a', '#7d6b52'], bg=('#f5f0ea', '#d9ccbc'))
dress_svg('cat-bolalar.svg', 'kids', 'chiffon', ['#fde8d7', '#f4a582', '#9fc5e8'], bg=('#fcf6f1', '#e8d8cc'))

swatch_svg('fabric-atlas.svg', 'atlas', ATLAS)
swatch_svg('fabric-adras.svg', 'adras', ADRAS)
swatch_svg('fabric-silk.svg', 'silk', ['#5a1e2b', '#8e2f45', '#c76a7f'])
swatch_svg('fabric-linen.svg', 'linen', ['#d9c7aa', '#8c7a5f'])
swatch_svg('fabric-velvet.svg', 'velvet', ['#120f1c', '#2b2140', '#5d4a86'])
swatch_svg('fabric-chiffon.svg', 'chiffon', ['#fbe3ea', '#e9a3b8', '#b8a1e3'])

# Portret (abstrakt siluet)
with open(os.path.join(OUT, 'portrait.svg'), 'w') as f:
    f.write('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000"><defs>
<radialGradient id="bg" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="#efe4d8"/><stop offset="1" stop-color="#a88c74"/></radialGradient>
<linearGradient id="sk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6d5544"/><stop offset="1" stop-color="#3d2e24"/></linearGradient>
<linearGradient id="cl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a6a52"/><stop offset="1" stop-color="#4d3a2d"/></linearGradient>
</defs><rect width="800" height="1000" fill="url(#bg)"/>
<path d="M0,0 L560,0 L800,480 L800,1000 Z" fill="#fff" opacity=".12"/>
<ellipse cx="400" cy="330" rx="118" ry="140" fill="url(#sk)"/>
<path d="M300,300 C300,170 500,160 510,300 C540,250 520,150 400,150 C270,150 250,260 300,300 Z" fill="#2b201a"/>
<path d="M372,455 h56 v70 h-56z" fill="url(#sk)"/>
<path d="M160,1000 C170,760 260,560 400,540 C540,560 630,760 640,1000 Z" fill="url(#cl)"/>
<path d="M360,545 L400,640 L440,545" fill="none" stroke="#d4b48c" stroke-width="6"/>
<circle cx="400" cy="700" r="5" fill="#d4b48c"/><circle cx="400" cy="760" r="5" fill="#d4b48c"/>
</svg>''')

# Atelye (kiyim ilgich)
garments = []
cols = ['#e9dfd2', '#cbb59a', '#a88a6c', '#8a6b52', '#f2ebe2', '#b99d80', '#6f5442', '#ddd0bf', '#c4a989', '#9c7e64']
x = 170
for i, col in enumerate(cols):
    w = 46 + (i % 3) * 6
    h = 330 + (i * 37) % 90
    garments.append(f'<path d="M{x+w/2},288 l-6,-14 a10,10 0 1,1 12,0" fill="none" stroke="#9a8060" stroke-width="3"/>')
    garments.append(f'<path d="M{x},300 Q{x+w/2},288 {x+w},300 L{x+w+8},{300+h} Q{x+w/2},{310+h} {x-8},{300+h} Z" fill="{col}"/>')
    garments.append(f'<path d="M{x+w*0.3},305 L{x+w*0.25},{300+h}" stroke="#000" stroke-opacity=".08" stroke-width="5"/>')
    x += w - 2
with open(os.path.join(OUT, 'atelier.svg'), 'w') as f:
    f.write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800"><defs>
<radialGradient id="bg" cx="40%" cy="40%" r="80%"><stop offset="0" stop-color="#8a6d57"/><stop offset="1" stop-color="#3b2b20"/></radialGradient>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8925a"/><stop offset=".5" stop-color="#f0d49a"/><stop offset="1" stop-color="#9c7740"/></linearGradient>
</defs><rect width="800" height="800" fill="url(#bg)"/>
<rect x="120" y="262" width="580" height="12" rx="6" fill="url(#g)"/>
<rect x="128" y="262" width="10" height="470" fill="url(#g)"/><rect x="682" y="262" width="10" height="470" fill="url(#g)"/>
<rect x="100" y="728" width="620" height="10" rx="5" fill="url(#g)"/>
{''.join(garments)}
<g opacity=".9"><path d="M60,800 C40,640 70,560 90,520 C100,600 96,700 110,800 Z" fill="#3d5a3a"/>
<path d="M30,800 C40,700 20,610 40,560 C70,640 70,720 70,800 Z" fill="#4f6f48"/></g>
</svg>''')

# Sertifikat
with open(os.path.join(OUT, 'award.svg'), 'w') as f:
    f.write('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600"><defs>
<linearGradient id="p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbf6ee"/><stop offset="1" stop-color="#eadfcd"/></linearGradient>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2c27a"/><stop offset=".5" stop-color="#b58a3c"/><stop offset="1" stop-color="#f1d998"/></linearGradient>
</defs><rect width="800" height="600" fill="#5a4334"/>
<rect x="40" y="40" width="720" height="520" fill="url(#p)"/>
<rect x="62" y="62" width="676" height="476" fill="none" stroke="url(#g)" stroke-width="4"/>
<rect x="74" y="74" width="652" height="452" fill="none" stroke="url(#g)" stroke-width="1.5"/>
<rect x="250" y="140" width="300" height="18" rx="9" fill="#cdb894"/>
<rect x="180" y="200" width="440" height="34" rx="6" fill="#8a6d57" opacity=".85"/>
<rect x="220" y="262" width="360" height="10" rx="5" fill="#cdb894"/><rect x="260" y="286" width="280" height="10" rx="5" fill="#cdb894"/>
<rect x="140" y="440" width="160" height="6" rx="3" fill="#b9a587"/><rect x="500" y="440" width="160" height="6" rx="3" fill="#b9a587"/>
<circle cx="400" cy="420" r="46" fill="url(#g)"/><circle cx="400" cy="420" r="34" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>
<path d="M378,460 l-14,52 l22,-12 l14,20 l0,-56 z M422,460 l14,52 l-22,-12 l-14,20 l0,-56 z" fill="#a33b3b"/>
</svg>''')

# Favicon
with open(os.path.join(OUT, '..', 'favicon.svg'), 'w') as f:
    f.write('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#5e4636"/>
<g stroke="#f5ede4" stroke-width="4" stroke-linecap="round"><path d="M32 14v36M14 32h36M19.3 19.3l25.4 25.4M44.7 19.3L19.3 44.7"/></g></svg>''')

print('ok', sorted(os.listdir(OUT)))
