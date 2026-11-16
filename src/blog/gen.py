import sys, re, json, html, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from posts import POSTS, CATS
P = pathlib.Path(__file__).parent.parent / 'pages'
BASE = 'https://max-meely.github.io/GCC-CV/'
for f in P.glob('_gen_blog*.html'): f.unlink()
e = html.escape
def md(t): return re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', e(t, quote=False))
def words(p):
    n = 0
    for k, v in p['body']: n += len(' '.join(v).split()) if isinstance(v, list) else len(v.split())
    return n
def rt(p): return max(1, round(words(p) / 200))
def fdate(d):
    import datetime; return datetime.date.fromisoformat(d).strftime('%d %b %Y').lstrip('0')
PH = {'CV Tips':('blocks','50% 60%'),'ATS':('meeting','30% 40%'),'Site Jobs':('site','60% 40%'),'Visa and Documents':('handshake','45% 70%'),'LinkedIn':('team','50% 40%'),'Interviews':('handshake','70% 30%')}
PS = {'cv-for-gulf-employers':('cv-closeup','50% 36%'),'what-is-ats':('cv-flatlay','18% 30%'),'job-performer-not-helper':('site','60% 40%'),'documents-before-you-apply':('handover','50% 42%'),'site-safety-certificates':('team','50% 40%'),'cv-mistakes-gulf':('cv-review','50% 52%'),'visa-status-on-cv':('handshake','45% 70%'),'read-a-job-advert':('cv-clipboard','50% 58%'),'linkedin-quick-wins':('portrait','50% 26%'),'site-interview-prep':('interview','60% 40%')}
def ph(p):
    f, pos = PS.get(p['slug']) or PH[p['cat']]; return 'blog-img/%s.jpg' % f, pos
def img(p, cls='bimg'):
    ic, a, b = CATS[p['cat']]; f, pos = ph(p)
    return '<div class="%s" style="background:linear-gradient(135deg,%s,%s)"><img src="%s" alt="" loading="lazy" style="object-position:%s"><span class="bbadge" style="background:linear-gradient(135deg,%s,%s)"><svg class="ic"><use href="#i-%s"/></svg></span></div>' % (cls, a, b, f, pos, a, b, ic)
def tag(p):
    ic, a, b = CATS[p['cat']]
    return '<span class="btag" style="background:linear-gradient(135deg,%s,%s)">%s</span>' % (a, b, e(p['cat']))
def meta(p): return '<div class="bmeta">%s<span>%s</span><span>&middot;</span><span>%d min read</span></div>' % (tag(p), fdate(p['date']), rt(p))
POSTS.sort(key=lambda p: p['date'], reverse=True)
slugs = {p['slug']: p for p in POSTS}
# ---- index
def slide(p):
    f, pos = ph(p)
    return '<a class="bslide" href="blog-%s.html" data-cat="%s"><img src="%s" alt="" style="object-position:%s"><div class="bov"><div class="bmeta">%s<span>%s</span><span>&middot;</span><span>%d min read</span></div><h2>%s</h2><p>%s</p><span class="bmore">Read article <svg class="ic"><use href="#i-arrow"/></svg></span></div></a>' % (p['slug'], e(p['cat']), f, pos, tag(p), fdate(p['date']), rt(p), e(p['title']), e(p['excerpt']))
def card(p): return '<a class="bcard" href="blog-%s.html" data-cat="%s" data-s="%s">%s<div class="bt">%s<h3>%s</h3><p>%s</p><span class="bmore">Read article <svg class="ic"><use href="#i-arrow"/></svg></span></div></a>' % (p['slug'], e(p['cat']), e((p['title'] + ' ' + p['excerpt'] + ' ' + p['cat']).lower()), img(p), meta(p), e(p['title']), e(p['excerpt']))
cats = list(CATS)
idx = '''<!-- title:Blog | KINETIX GCC CV|nav:blog.html|use: -->
<!--desc:Practical, honest advice for job seekers in the UAE and GCC: CV tips, ATS, site job documents, visas, LinkedIn and interviews.-->
<!--head:<link rel="canonical" href="%sblog.html"><meta property="og:title" content="KINETIX Blog"><meta property="og:description" content="Practical advice for job seekers in the UAE and GCC."><meta property="og:type" content="website">-->
<main><div class="wrap" style="display:block">
<div class="bhero phero" style="--bg:url(blog-img/team.jpg);--pos:50%% 40%%"><h1>The KINETIX Blog</h1><p class="muted">Practical, honest advice for job seekers in the UAE and GCC.</p>
<div class="bsearch"><svg class="ic"><use href="#i-search"/></svg><input id="q" type="search" placeholder="Search articles, e.g. visa, ATS, H2S" aria-label="Search articles"></div>
<a class="bweb" id="web" target="_blank" rel="noopener" hidden><svg class="ic"><use href="#i-search"/></svg><span></span></a>
<div class="bchips" id="chips"><button class="bchip" type="button" aria-pressed="true" data-k="">All</button>%s</div></div>
<section class="bslider" id="sl" aria-label="Featured articles"><div class="btrack" id="trk">%s</div><button class="bnav prev" type="button" aria-label="Previous"><svg class="ic" style="transform:rotate(180deg)"><use href="#i-arrow"/></svg></button><button class="bnav next" type="button" aria-label="Next"><svg class="ic"><use href="#i-arrow"/></svg></button><div class="bdots" id="dots"></div></section>
<div class="bgrid" id="grid">%s</div>
<p class="bempty" id="none" hidden>No articles match your search. Try the web search button above.</p>
<div class="bcta"><h2>Need a CV that gets read?</h2><p>We write clean, ATS-friendly CVs for Gulf employers. 24 to 48 hour delivery.</p><div class="row"><a class="btn" href="order.html">Order a CV</a><a class="btn ghost" href="samples.html">See sample CVs</a></div></div>
</div></main>
<!--script-->
(function(){var q=document.getElementById('q'),chips=document.querySelectorAll('.bchip'),cards=[].slice.call(document.querySelectorAll('#grid .bcard')),sl=document.getElementById('sl'),none=document.getElementById('none'),cat='';
function run(){var s=q.value.trim().toLowerCase(),n=0;sl.hidden=!!(s||cat);cards.forEach(function(c){var ok=(!cat||c.dataset.cat===cat)&&(!s||c.dataset.s.indexOf(s)>-1);c.hidden=!ok;if(ok)n++});none.hidden=n>0;var w=document.getElementById('web');w.hidden=!s;if(s){w.href='https://www.google.com/search?q='+encodeURIComponent(s);w.lastChild.textContent='Search the web for "'+q.value.trim()+'"'}}
var trk=document.getElementById('trk'),sd=[].slice.call(trk.children),dots=document.getElementById('dots'),cur=0,tm;
sd.forEach(function(_,i){var d=document.createElement('button');d.type='button';d.setAttribute('aria-label','Slide '+(i+1));d.onclick=function(){go(i)};dots.appendChild(d)});
function go(i){cur=(i+sd.length)%%sd.length;trk.scrollTo({left:cur*trk.clientWidth,behavior:'smooth'});mark()}
function mark(){[].forEach.call(dots.children,function(d,i){d.className=i===cur?'on':''})}
trk.addEventListener('scroll',function(){var i=Math.round(trk.scrollLeft/trk.clientWidth);if(i!==cur){cur=i;mark()}},{passive:true});
sl.querySelector('.prev').onclick=function(){go(cur-1)};sl.querySelector('.next').onclick=function(){go(cur+1)};
function play(){clearInterval(tm);if(!matchMedia('(prefers-reduced-motion:reduce)').matches)tm=setInterval(function(){go(cur+1)},5500)}
sl.addEventListener('mouseenter',function(){clearInterval(tm)});sl.addEventListener('mouseleave',play);sl.addEventListener('touchstart',function(){clearInterval(tm)},{passive:true});mark();play();
q.addEventListener('input',run);chips.forEach(function(b){b.addEventListener('click',function(){chips.forEach(function(x){x.setAttribute('aria-pressed','false')});b.setAttribute('aria-pressed','true');cat=b.dataset.k;run()})})})();
''' % (BASE, ''.join('<button class="bchip" type="button" aria-pressed="false" data-k="%s">%s</button>' % (e(c), e(c)) for c in cats),
 ''.join(slide(p) for p in POSTS[:5]),
 ''.join(card(p) for p in POSTS))
(P / '_gen_blog.html').write_text(idx)
# ---- posts
for p in POSTS:
    toc = [(i, v) for i, (k, v) in enumerate(p['body']) if k == 'h2']
    out = []; n = 0
    for k, v in p['body']:
        if k == 'p': out.append('<p>%s</p>' % md(v))
        elif k == 'h2': out.append('<h2 id="s%d">%s</h2>' % (n, md(v))); n += 1
        elif k == 'ul': out.append('<ul>%s</ul>' % ''.join('<li>%s</li>' % md(x) for x in v))
        elif k == 'ol': out.append('<ol>%s</ol>' % ''.join('<li>%s</li>' % md(x) for x in v))
        elif k == 'tip': out.append('<div class="bcall tip"><svg class="ic" style="color:#22a559"><use href="#i-spark"/></svg><div><b>Tip.</b> %s</div></div>' % md(v))
        elif k == 'warn': out.append('<div class="bcall warn"><svg class="ic" style="color:#d97706"><use href="#i-shield"/></svg><div><b>Be careful.</b> %s</div></div>' % md(v))
    tocs = '<nav class="btoc" aria-label="In this article"><b>In this article</b>%s</nav>' % ''.join('<a href="#s%d">%s</a>' % (i, e(re.sub(r'\*\*','',v))) for i, (_, v) in enumerate(toc)) if len(toc) >= 3 else ''
    keys = '<div class="bkeys"><b>Key points</b><ul>%s</ul></div>' % ''.join('<li>%s</li>' % e(x) for x in p['keys'])
    rel = [x for x in POSTS if x['slug'] != p['slug']]
    rel = sorted(rel, key=lambda x: (x['cat'] != p['cat'], -int(x['date'].replace('-', ''))))[:3]
    url = BASE + 'blog-%s.html' % p['slug']
    ld = json.dumps({'@context': 'https://schema.org', '@type': 'Article', 'headline': p['title'], 'datePublished': p['date'], 'description': p['excerpt'], 'author': {'@type': 'Organization', 'name': 'KINETIX GCC CV'}, 'publisher': {'@type': 'Organization', 'name': 'KINETIX GCC CV'}, 'mainEntityOfPage': url})
    head = '<link rel="canonical" href="%s"><meta property="og:title" content="%s"><meta property="og:description" content="%s"><meta property="og:type" content="article"><script type="application/ld+json">%s</script>' % (url, e(p['title']), e(p['excerpt']), ld.replace('</', '<\\/'))
    share = '<div class="bshare"><button class="btn ghost" type="button" id="sh"><svg class="ic"><use href="#i-share"/></svg>Share</button><button class="btn ghost" type="button" id="cp"><svg class="ic"><use href="#i-copy"/></svg>Copy link</button><a class="btn ghost" id="wa" target="_blank" rel="noopener" href="#"><svg class="ic" style="color:#22a559"><use href="#i-wa"/></svg>WhatsApp</a></div>'
    page = '''<!-- title:%s | KINETIX Blog|nav:blog.html|use: -->
<!--desc:%s-->
<!--head:%s-->
<div class="bprog" id="bp"></div>
<main><div class="wrap" style="display:block"><article class="bpost card prose">
<a href="blog.html" class="row" style="gap:6px;text-decoration:none;font-size:.9rem"><svg class="ic"><use href="#i-back"/></svg>All articles</a>
%s<h1>%s</h1>%s
%s%s%s%s
<div class="bcta"><h2>Want us to do it for you?</h2><p>Send your details and get a clean, professional CV in 24 to 48 hours.</p><div class="row"><a class="btn" href="order.html">Order a CV</a><a class="btn ghost" href="samples.html">See samples</a></div></div>
</article>
<h2 style="max-width:760px;margin:30px auto 14px">Keep reading</h2><div class="bgrid" style="max-width:1000px;margin:0 auto">%s</div></div></main>
<!--script-->
(function(){var bp=document.getElementById('bp'),a=document.querySelector('.bpost');function pr(){var r=a.getBoundingClientRect(),h=r.height-innerHeight;bp.style.width=Math.max(0,Math.min(100,(-r.top/Math.max(h,1))*100))+'%%'}addEventListener('scroll',pr,{passive:true});pr();
var u=location.href.split('#')[0],t=document.title;document.getElementById('wa').href='https://wa.me/?text='+encodeURIComponent(t+' '+u);
document.getElementById('cp').onclick=function(){(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(function(){KX.toast&&KX.toast('Link copied')},function(){prompt('Copy this link',u)})};
document.getElementById('sh').onclick=function(){if(navigator.share)navigator.share({title:t,url:u}).catch(function(){});else document.getElementById('cp').click()}})();
''' % (e(p['title']), e(p['excerpt']), head, meta(p), e(p['title']), img(p), keys, tocs, ''.join(out), share, ''.join(card(x) for x in rel))
    (P / ('_gen_blog-%s.html' % p['slug'])).write_text(page)
strip = '<div class="bgrid">%s</div>' % ''.join(card(p) for p in POSTS[:3])
(P.parent / 'blog' / 'strip.html').write_text(strip)
print('blog', len(POSTS))
