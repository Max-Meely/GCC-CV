#!/usr/bin/env python3
"""Assemble dist/*.html from src/pages/*.html + shared assets."""
import re, shutil, pathlib, sys
R = pathlib.Path(__file__).parent; S = R/'src'; D = R/'dist'
D.mkdir(exist_ok=True)
css = (S/'shared/base.css').read_text()
sprite = (S/'shared/icons.svg.txt').read_text()
rt = (S/'shared/runtime.js').read_text()
cat = (S/'shared/catalog.js').read_text()
data = (S/'shared/data.js').read_text()
NAV = [('index.html','Home'),('intake.html','Order a CV'),('other-services.html','Other services'),('pdf-tools.html','PDF tools'),('order-status.html','Track order')]
from PIL import Image as _I
_r=_I.open(S/'kinetix-logo.png');BMW=round(34*_r.width/_r.height)
_k=_I.open(S/'kinetix-k.png');KW=round(22*_k.width/_k.height)
def page(src):
    t = src.read_text()
    m = re.match(r'<!--\s*title:(.*?)\|nav:(.*?)\|use:(.*?)-->\n', t)
    title, nav, use = [x.strip() for x in m.groups()]; body = t[m.end():]
    dm = re.search(r'<!--desc:(.*?)-->', body, re.S); desc = dm.group(1).strip() if dm else 'KINETIX - professional CVs, certificates and career documents for jobs in the UAE and GCC.'; body = re.sub(r'<!--desc:.*?-->', '', body, flags=re.S)
    hm = re.search(r'<!--head:(.*?)-->', body, re.S); head = hm.group(1) if hm else ''; body = re.sub(r'<!--head:.*?-->', '', body, flags=re.S)
    use = [u.strip() for u in use.split(',') if u.strip()]
    navh = ''.join('<a href="%s"%s>%s</a>' % (h, ' aria-current="page"' if h == nav else '', l) for h, l in NAV)
    scripts = ''
    key = src.name.replace('_gen_', '')
    if key in BANNERS:
        im, pos, chip, txt = BANNERS[key]
        body = body.replace('<main>', '<main><div class="wrap"><div class="pban"><img src="blog-img/%s.jpg" alt="" style="object-position:%s"><div class="pbt"><span class="pill">%s</span><b>%s</b></div></div></div>' % (im, pos, chip, txt), 1)
    if '<!--blogstrip-->' in body: body = body.replace('<!--blogstrip-->', (S/'blog/strip.html').read_text())
    ADM = title.startswith('Admin'); navh = '<span class="pill"><svg class="ic"><use href="#i-lock"/></svg>Admin dashboard</span>' if ADM else navh; MAN = 'admin.webmanifest' if ADM else 'manifest.webmanifest'; ATI = 'admin-touch-icon.png' if ADM else 'apple-touch-icon.png'; APPN = 'KINETIX Admin' if ADM else 'KINETIX'
    if 'catalog' in use: scripts += '<script>' + cat + '</script>\n'
    if 'sig' in use: scripts += '<script>' + (S/'shared/sig.js').read_text() + '</script>\n'
    if 'crop' in use or 'sig' in use: scripts += '<script>' + (S/'shared/crop.js').read_text() + '</script>\n'
    if 'zip' in use: scripts += '<script>' + (S/'shared/zip.js').read_text() + '</script>\n'
    if 'data' in use: scripts += '<script>' + data + '</script>\n'
    if 'i18n' in use: scripts += '<script>' + (S/'shared/i18n.js').read_text() + '</script>\n'
    if 'mrz' in use: scripts += '<script>' + (S/'shared/mrz.js').read_text() + '</script>\n<script>' + (S/'shared/ocr.js').read_text() + '</script>\n'
    out = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>{'<meta name="robots" content="noindex">' if title.startswith('Admin') else ''}<meta name="description" content="{desc}">{head}
<link rel="manifest" href="{MAN}"><meta name="theme-color" content="#071633"><link rel="icon" href="favicon.png"><link rel="apple-touch-icon" href="{ATI}"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="{APPN}">
<script>try{{var t=localStorage.getItem('kx-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t)}}catch(e){{}}</script>
<style>{css}</style></head><body>{sprite}
<header class="top"><div class="wrap"><a class="brand" href="index.html" aria-label="KINETIX home"><img class="bm" src="kinetix-logo.png" alt="" width="{BMW}" height="34"><span class="wm" aria-hidden="true"><img src="kinetix-k.png" alt="" width="{KW}" height="22">INETIX</span></a><nav class="nav" aria-label="Main">{navh}</nav><div class="tools">{'' if ADM else '<button class="tt" id="menubtn" type="button" aria-haspopup="dialog" aria-label="Browse all pages"><svg class="ic"><use href="#i-menu"/></svg></button><button class="tt" type="button" data-share aria-label="Share KINETIX"><svg class="ic"><use href="#i-share"/></svg></button><button class="tt kxapp" type="button" data-install aria-label="Install the KINETIX app"><svg class="ic"><use href="#i-down"/></svg><span>App</span></button>'}<span class="curwrap"><svg class="ic"><use href="#i-globe"/></svg><select class="curs" id="cur" aria-label="Currency"><option>AED</option></select></span><button class="tt" id="theme" type="button" aria-label="Switch light or dark mode"></button></div></div></header>
{'' if ADM else '''<dialog id="sitemenu" aria-label="Browse KINETIX">
<div class="row sp" style="margin-bottom:6px"><b style="font-size:1.1rem">Browse KINETIX</b><button type="button" class="tt" id="menux" aria-label="Close menu"><svg class="ic"><use href="#i-x"/></svg></button></div>
<div class="smgrid">
<div><h3>Get started</h3><a href="index.html">Home</a><a href="how-it-works.html">How it works</a><a href="intake.html">Order a CV</a><a href="other-services.html">Other services</a><a href="samples.html">Sample CVs</a></div>
<div><h3>Free PDF tools</h3><a href="pdf-tools.html">All free PDF tools</a><a href="pdf-fill.html">Fill and sign PDF</a><a href="signature-tool.html">Signature maker</a><a href="pdf-unlock.html">PDF password remover</a><a href="pdf-help.html">Free help ticket</a><a href="tutorials.html">Video tutorials</a></div>
<div><h3>Company</h3><a href="about.html">What we do</a><a href="blog.html">Blog</a><a href="contact.html">Contact us</a><a href="order-status.html">Track your order</a></div>
<div><h3>Legal</h3><a href="terms.html">Terms of Service</a><a href="privacy.html">Privacy Policy</a><a href="legal-notice.html">Legal Notice</a><a href="copyright.html">Copyright Notice</a></div>
</div></dialog>'''}
{body.split('<!--script-->')[0]}
<footer><div class="wrap" style="display:block"><div class="row" style="gap:6px 18px;margin-bottom:12px"><a href="terms.html">Terms of Service</a><a href="privacy.html">Privacy Policy</a><a href="legal-notice.html">Legal Notice</a><a href="copyright.html">Copyright Notice</a><a href="blog.html">Blog</a><a href="samples.html">Sample CVs</a><a href="contact.html">Contact Us</a><a href="#" data-install>Install app</a></div><div class="row sp"><span>&copy; <span data-year></span> KINETIX GCC CV. All rights reserved.</span><span class="row" style="gap:8px 18px"><a class="row" style="gap:7px" data-c="wa-ae" data-keep href="#"><svg class="ic" style="color:#22a559"><use href="#i-wa"/></svg>WhatsApp us</a><a class="row" style="gap:7px" data-c="mail" data-keep href="#"><svg class="ic" style="color:#8b5cf6"><use href="#i-proton"/></svg><span data-email></span></a></span></div></div></footer>
<div id="toast" role="status" aria-live="polite"></div>
<script src="config.js"></script>
<script>{rt}</script>
{scripts}{('<script>' + body.split('<!--script-->')[1] + '</script>') if '<!--script-->' in body else ''}
</body></html>'''
    return out
names = []
import json
BANNERS = {'how-it-works.html':('cv-clipboard','50% 58%','How it works','Three simple steps, from your details to a finished CV.'),
 'samples.html':('cv-flatlay','18% 30%','Sample CVs','Real layouts. Browse by industry and style.'),
 'other-services.html':('portrait','50% 26%','LinkedIn and certificates','Look credible before the recruiter even calls.'),
 'document-cleanup.html':('handover','50% 42%','Document cleanup','Clean, consistent documents ready to send.'),
 'document-merge.html':('cv-closeup','50% 36%','Certificate batch','All your certificates, in one tidy file.'),
 'contact.html':('duo','50% 40%','Contact us','Talk to a real person. We usually reply within hours.')}
PRESETS = {
 'other-services.html': dict(TITLE='Other services', NAV='other-services.html', H1='LinkedIn and certificates', INTRO='Order a LinkedIn profile rewrite or professionally laid-out certificates. Send what you have and we will confirm the details on WhatsApp.', DETAILLABEL='Your LinkedIn link, target job, or certificate details', PLACEHOLDER='e.g. linkedin.com/in/yourname, target role, countries', FILELABEL='Your current CV, certificates or documents (optional)', P=dict(keys=['linkedin_basic','linkedin_full','cert_single','cert_batch'], needFiles='')),
 'document-cleanup.html': dict(TITLE='Document cleanup', NAV='other-services.html', H1='Offer letter and document cleanup', INTRO='Send a document that needs tidying: alignment, fonts, spacing and a consistent professional layout. We return it clean and ready to use.', DETAILLABEL='What should we fix?', PLACEHOLDER='e.g. fix the layout, align the text, make the pages consistent', FILELABEL='Document to clean up', P=dict(keys=['doc_cleanup'], needFiles='Please attach the document you want cleaned up.')),
 'document-merge.html': dict(TITLE='Merge documents', NAV='other-services.html', H1='Certificate batch and merge', INTRO='Send several certificates or documents and receive them arranged in the order you choose, in one consistent layout and a single file.', DETAILLABEL='Order and instructions', PLACEHOLDER='e.g. passport first, then certificates newest to oldest', FILELABEL='Files to combine', P=dict(keys=['cert_batch','cert_single'], needFiles='Please attach the files you want arranged.')),
}
tpl = (S/'pages/_order.tpl').read_text()
for fn, v in PRESETS.items():
    t = tpl
    for k in ('TITLE','NAV','H1','INTRO','DETAILLABEL','PLACEHOLDER','FILELABEL'): t = t.replace('@@%s@@' % k, v[k])
    t = t.replace('/*PRESET*/{}', json.dumps(v['P']))
    (S/'pages'/('_gen_'+fn)).write_text(t)
import subprocess,sys
subprocess.check_call([sys.executable, str(S/'blog/gen.py')])
for f in sorted((S/'pages').glob('*.html')):
    nm = f.name.replace('_gen_', '')
    html = page(f)  # LAZYFIX
    cnt = [0]
    def _lz(m):
        t = m.group(0); cnt[0] += 1
        if 'loading=' in t or cnt[0] <= 2: return t
        return t[:-1] + ' loading="lazy" decoding="async">' if not t.endswith('/>') else t[:-2] + ' loading="lazy" decoding="async"/>'
    html = re.sub(r'<img\b[^>]*>', _lz, html)
    mm = re.search(r'--bg:url\((blog-img/[\w-]+\.jpg)\)', html)
    if mm: html = html.replace('</title>', '</title><link rel="preload" as="image" href="%s">' % mm.group(1), 1)
    (D/nm).write_text(html); names.append(nm)
[shutil.copy(v, D/v.name) for v in (S/'vendor').iterdir()]; shutil.copy(S/'config.js', D/'config.js'); [shutil.copy(S/f, D/f) for f in ('admin.webmanifest','admin-icon-192.png','admin-icon-512.png','admin-icon-maskable.png','admin-touch-icon.png','how-to-order.mp4','how-to-order.jpg','kinetix-logo.png','kinetix-k.png','binance-pay.png','binance-logo.png','favicon.png','apple-touch-icon.png','icon-192.png','icon-512.png','icon-maskable-512.png','manifest.webmanifest','sw.js')]
for n in names: print(n, (D/n).stat().st_size)

(D/'robots.txt').write_text('User-agent: *\nAllow: /\nDisallow: /admin.html\nSitemap: https://max-meely.github.io/GCC-CV/sitemap.xml\n')
sm=['https://max-meely.github.io/GCC-CV/'+('' if n=='index.html' else n) for n in sorted(names) if not n.startswith('admin')]
(D/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>%s</loc></url>'%u for u in sm)+'</urlset>')

shutil.copy(S/'google3a18f8ef6aff8771.html', D/'google3a18f8ef6aff8771.html')
import hashlib as _hl, json as _js, time as _t
_h=_hl.md5()
for _f in sorted(D.glob('*.html')): _h.update(_f.read_bytes())
_wn=_js.loads((S/'whatsnew.json').read_text())
(D/'version.json').write_text(_js.dumps({'v':_h.hexdigest()[:10],'date':_t.strftime('%Y-%m-%d'),'title':_wn['title'],'notes':_wn['notes'],'new':_wn.get('new',[]),'offline':['pdf-tools.html','pdf-fill.html','signature-tool.html','pdf-unlock.html','pdf-lib.min.js','pdf.min.mjs','pdf.worker.min.mjs','kinetix-logo.png','kinetix-k.png','favicon.png','icon-192.png','manifest.webmanifest']}))
import shutil as _sh
(D/'blog-img').mkdir(exist_ok=True)
[_sh.copy(f, D/'blog-img'/f.name) for f in (S/'blog-img').iterdir()]
(D/'tutorials').mkdir(exist_ok=True)
[_sh.copy(f, D/'tutorials'/f.name) for f in (S/'tutorials').iterdir()]
