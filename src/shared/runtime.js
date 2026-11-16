(function () {
  var W = window, D = document;
  var KX = W.KX = {};
  KX.$ = function (s, r) { return (r || D).querySelector(s); };
  KX.$$ = function (s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); };
  KX.cfg = W.KX_CONFIG || {};
  KX.icon = function (n) { return '<svg class="ic" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; };
  KX.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  /* ---------- currency ---------- */
  var CUR = { c: 'AED' }, RATES = {};
  (KX.cfg.currencies || [{ c: 'AED', s: 'AED ', rate: 1, dp: 0, step: 1 }]).forEach(function (x) { RATES[x.c] = x; });
  KX.currencies = function () { return KX.cfg.currencies || [RATES.AED]; };
  KX.cur = function () { return CUR.c; };
  function num(v, dp) { var t = v.toFixed(dp); if (dp && /\.0+$/.test(t)) t = t.replace(/\.0+$/, ''); var p = t.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return p.join('.'); }
  KX.conv = function (aed) { var r = RATES[CUR.c] || RATES.AED, v = aed * r.rate; if (r.step) v = Math.round(v / r.step) * r.step; return v; };
  KX.money = function (n) { n = Number(n) || 0; var r = RATES[CUR.c] || RATES.AED; if (CUR.c === 'AED') return 'AED ' + num(n, 0); return '\u2248 ' + r.s + num(KX.conv(n), r.dp); };
  KX.moneyRange = function (a, b) { if (!b) return KX.money(a); if (CUR.c === 'AED') return 'AED ' + a + ' - ' + b; var r = RATES[CUR.c]; return '\u2248 ' + r.s + num(KX.conv(a), r.dp) + ' - ' + num(KX.conv(b), r.dp); };
  KX.renderPrices = function () {
    KX.$$('[data-aed]').forEach(function (e) { var a = +e.getAttribute('data-aed'), b = e.getAttribute('data-aed2'); e.textContent = b ? KX.moneyRange(a, +b) : KX.money(a); });
    KX.$$('[data-curnote]').forEach(function (e) { e.hidden = CUR.c === 'AED'; });
  };
  function liveRates() {
    var st = KX.store.get('kx-rates'), now = Date.now(), cached = null;
    try { cached = st && JSON.parse(st); } catch (e) {}
    function apply(r) { Object.keys(RATES).forEach(function (k) { if (k !== 'AED' && r[k] > 0) RATES[k].rate = r[k]; }); KX.renderPrices(); D.dispatchEvent(new CustomEvent('kx-currency')); }
    if (cached && now - cached.t < 12 * 3600 * 1000) return apply(cached.r);
    if (!W.fetch) return;
    var ctl = W.AbortController ? new AbortController() : null, to = setTimeout(function () { if (ctl) ctl.abort(); }, 6000);
    W.fetch('https://open.er-api.com/v6/latest/AED', ctl ? { signal: ctl.signal } : {}).then(function (r) { return r.json(); }).then(function (j) { clearTimeout(to); if (j && j.rates && j.rates.USD) { KX.store.set('kx-rates', JSON.stringify({ t: now, r: j.rates })); apply(j.rates); } }).catch(function () { clearTimeout(to); });
  }
  KX.setCur = function (c) {
    if (!RATES[c]) c = 'AED'; CUR.c = c; KX.store.set('kx-cur', c);
    var s = KX.$('#cur'); if (s) s.value = c;
    KX.renderPrices(); D.dispatchEvent(new CustomEvent('kx-currency'));
    if (c !== 'AED') liveRates();
  };
  KX.initCur = function () {
    var s = KX.$('#cur'); if (!s) return;
    s.innerHTML = KX.currencies().map(function (x) { return '<option value="' + x.c + '">' + x.c + '</option>'; }).join('');
    var saved = KX.store.get('kx-cur'); if (saved && RATES[saved]) CUR.c = saved;
    s.value = CUR.c; s.addEventListener('change', function () { KX.setCur(s.value); });
    if (CUR.c !== 'AED') liveRates();
  };
  /* ---------- copy to clipboard ---------- */
  KX.copy = function (text, btn) {
    function ok() { if (btn) { var h = btn.getAttribute('data-h') || btn.innerHTML; btn.setAttribute('data-h', h); btn.classList.add('done'); btn.innerHTML = KX.icon('check') + 'Copied'; setTimeout(function () { btn.classList.remove('done'); btn.innerHTML = h; }, 1600); } KX.toast('Copied'); }
    function fb() { var t = D.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;left:-9999px'; D.body.appendChild(t); t.select(); try { D.execCommand('copy'); ok(); } catch (e) { KX.toast(text); } D.body.removeChild(t); }
    if (navigator.clipboard && W.isSecureContext) navigator.clipboard.writeText(text).then(ok, fb); else fb();
  };
  D.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-copy]'); if (b) { e.preventDefault(); KX.copy(b.getAttribute('data-copy'), b); } });
  /* payment details block (used on home, order form and confirmation) */
  KX.payLines = function (p) {
    var qr = p.qr ? '<a href="' + p.qr + '" target="_blank" rel="noopener" class="qrbox"><img src="' + p.qr + '" alt="Binance Pay QR code. Scan with the Binance app." loading="lazy"></a><div class="small muted" style="text-align:center;margin:4px 0 8px">Scan with the Binance app, or tap to enlarge</div>' : '';
    if (!p.lines || !p.lines.length) return qr || '<div class="small muted">Details are sent on WhatsApp.</div>';
    return qr + p.lines.map(function (l) {
      return '<div class="kv"><span class="k">' + KX.esc(l[0]) + '</span><span class="row" style="gap:8px"><b>' + KX.esc(l[1]) + '</b>' + (l[2] ? '<button type="button" class="copy" data-copy="' + KX.esc(l[1]) + '" aria-label="Copy ' + KX.esc(l[0]) + '">' + KX.icon('copy') + 'Copy</button>' : '') + '</span></div>';
    }).join('');
  };
  KX.waLink = function (k, text) { var c = KX.cfg.contacts || {}, n = String(k === 'ae' ? c.phoneAE : c.whatsappKE || '').replace(/\D/g, ''); return 'https://wa.me/' + n + (text ? '?text=' + encodeURIComponent(text) : ''); };
  KX.store = {
    get: function (k) { try { return W.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { W.localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { W.localStorage.removeItem(k); } catch (e) {} }
  };
  /* theme */
  KX.theme = function () {
    var t = KX.store.get('kx-theme');
    if (!t) t = (W.matchMedia && W.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    D.documentElement.setAttribute('data-theme', t);
    var b = KX.$('#theme'); if (b) b.innerHTML = KX.icon(t === 'dark' ? 'sun' : 'moon');
    return t;
  };
  KX.toggleTheme = function () { var n = D.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; KX.store.set('kx-theme', n); KX.theme(); };
  /* toast */
  var tt;
  KX.toast = function (m) { var t = KX.$('#toast'); if (!t) return; t.textContent = m; t.style.display = 'block'; clearTimeout(tt); tt = setTimeout(function () { t.style.display = 'none'; }, 2600); };
  /* backend */
  KX.ready = function () { var u = KX.cfg.SCRIPT_URL || ''; return /^https:\/\/script\.google(usercontent)?\.com\//.test(u); };
  KX.api = function (action, payload, opt) {
    opt = opt || {};
    return new Promise(function (res, rej) {
      if (!KX.ready()) return rej(new Error('The site is not connected yet. Add the Apps Script URL to config.js.'));
      var x = new XMLHttpRequest();
      x.open('POST', KX.cfg.SCRIPT_URL, true);
      x.setRequestHeader('Content-Type', 'text/plain;charset=utf-8');
      x.timeout = opt.timeout || 120000;
      /* No upload listeners on purpose: they force a CORS preflight, which Apps Script cannot answer. */
      x.onload = function () {
        var j; try { j = JSON.parse(x.responseText); } catch (e) { return rej(new Error('The server returned an unexpected reply. The Apps Script deployment may be out of date (Deploy > Manage deployments > New version).')); }
        if (j && j.ok === false) return rej(Object.assign(new Error(j.error || 'Request failed'), { data: j }));
        res(j);
      };
      x.onerror = function () { rej(new Error('Could not reach the server. Check your connection, or re-deploy the Apps Script as "Anyone".')); };
      x.ontimeout = function () { rej(new Error('The server took too long to answer. Your order may still have been received - check your order status in a few minutes before resending.')); };
      var body = Object.assign({ action: action }, payload || {});
      x.send(JSON.stringify(body));
      if (opt.onUp) { var n = 0, up = setInterval(function () { n++; opt.onUp(Math.min(0.9, n * 0.08)); }, 700); setTimeout(function () { clearInterval(up); try { opt.onUp(1, true); } catch (e) {} }, 6000); }
    });
  };
  /* images */
  KX.readB64 = function (f) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result).split(',')[1] || ''); }; r.onerror = rej; r.readAsDataURL(f); }); };
  KX.shrink = function (file, max, q) {
    max = max || 1600; q = q || 0.78;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return KX.readB64(file).then(function (b) { return { b64: b, type: file.type || 'application/octet-stream', size: file.size }; });
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var s = Math.min(1, max / Math.max(im.width, im.height)), c = D.createElement('canvas');
        c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
        var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        var d = c.toDataURL('image/jpeg', q); res({ b64: d.split(',')[1], type: 'image/jpeg', size: Math.round(d.length * 0.75), thumb: s < 1 ? null : d });
      };
      im.onerror = function () { URL.revokeObjectURL(url); KX.readB64(file).then(function (b) { res({ b64: b, type: file.type, size: file.size }); }, rej); };
      im.src = url;
    });
  };
  KX.fill = function (sel, list, ph) {
    sel.innerHTML = (ph ? '<option value="">' + KX.esc(ph) + '</option>' : '') + list.map(function (o) { var v = typeof o === 'string' ? o : o.k, l = typeof o === 'string' ? o : o.l; return '<option value="' + KX.esc(v) + '">' + KX.esc(l) + '</option>'; }).join('');
  };
  KX.svc = function (k) { var l = KX.cfg.services || []; for (var i = 0; i < l.length; i++) if (l[i].k === k) return l[i]; return null; };
  KX.init = function () {
    KX.theme();
    var b = KX.$('#theme'); if (b) b.addEventListener('click', KX.toggleTheme);
    KX.$$('[data-year]').forEach(function (e) { e.textContent = new Date().getFullYear(); });


  /* floating back-to-top button on long pages */
  (function () {
    if (!document.querySelector('.prose') && !document.getElementById('posts')) return;
    var t = document.createElement('button'); t.id = 'kxtop'; t.type = 'button'; t.setAttribute('aria-label', 'Back to top'); t.innerHTML = '<svg class="ic" style="transform:rotate(180deg)"><use href="#i-down"/></svg>';
    t.onclick = function () { window.scrollTo({ top: 0, behavior: 'smooth' }); }; document.body.appendChild(t);
    window.addEventListener('scroll', function () { t.classList.toggle('on', window.scrollY > 500); }, { passive: true });
  })();
  /* site menu: browse every page */
  (function () {
    var btn = document.getElementById('menubtn'), dlg = document.getElementById('sitemenu'), xb = document.getElementById('menux');
    if (!btn || !dlg) return;
    btn.addEventListener('click', function () { try { dlg.showModal(); } catch (e) { dlg.setAttribute('open', ''); } });
    if (xb) xb.onclick = function () { dlg.close(); };
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  })();
  /* share the site itself (not an order) - native share sheet, or copy the link */
  (function () {
    var bs = [].slice.call(document.querySelectorAll('[data-share]'));
    if (!bs.length) return;
    bs.forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        var url = location.origin + '/', title = 'KINETIX - CVs and documents for the UAE and GCC';
        if (navigator.share) { navigator.share({ title: title, url: url }).catch(function () {}); return; }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () { KX.toast('Link copied - share it with a friend'); }, function () { KX.toast(url); });
        } else KX.toast(url);
      });
    });
  })();
  /* PWA: register the service worker and offer "Install app" */
  (function () {
    window.addEventListener('load', function () { kxOffline(); });
    var bs = [].slice.call(document.querySelectorAll('[data-install]')), ev = null;
    if (!bs.length) return;
    if ((window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone) { bs.forEach(function (b) { b.hidden = true; }); return; }
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); ev = e; });
    window.addEventListener('appinstalled', function () { bs.forEach(function (b) { b.hidden = true; }); KX.toast('App installed'); });
    function help() {
      var ua = navigator.userAgent, m = /iphone|ipad|ipod/i.test(ua) ? 'On iPhone or iPad, open this site in <b>Safari</b>, tap the <b>Share</b> button, then <b>Add to Home Screen</b>.' : /android/i.test(ua) ? 'Tap the <b>menu (three dots)</b> in Chrome, then <b>Install app</b> or <b>Add to Home screen</b>.' : 'In Chrome or Edge, click the <b>install icon</b> at the right end of the address bar, or open the browser menu and choose <b>Install KINETIX</b>.';
      var s = document.createElement('div'); s.className = 'kxsheet'; s.setAttribute('role', 'dialog'); s.innerHTML = '<b>Install the KINETIX app</b><p>' + m + '</p><div class="r"><button type="button" class="btn sm pri">Got it</button></div>'; document.body.appendChild(s); setTimeout(function () { s.classList.add('on'); }, 30); s.querySelector('button').onclick = function () { s.classList.remove('on'); setTimeout(function () { s.remove(); }, 400); };
    }
    bs.forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); if (ev) { ev.prompt(); ev.userChoice && ev.userChoice.then(function () { ev = null; }); } else help(); }); });
  })();
    KX.$$('[data-c]').forEach(function (e) {
      var c = KX.cfg.contacts || {}, k = e.getAttribute('data-c');
      if (k === 'wa') { e.href = KX.waLink('ke', 'Hello KINETIX, I have a question.'); e.target = '_blank'; e.rel = 'noopener'; }
      if (k === 'wa-ae') { e.href = KX.waLink('ae', 'Hello KINETIX, I have a question.'); e.target = '_blank'; e.rel = 'noopener'; }
      if (k === 'mail') { e.href = 'mailto:' + (c.email || ''); }
      if (!e.hasAttribute('data-keep') && !e.children.length) e.textContent = k === 'mail' ? c.email : 'WhatsApp';
    });
    KX.$$('[data-email]').forEach(function (e) { e.textContent = (KX.cfg.contacts || {}).email || ''; });
    KX.initCur(); KX.renderPrices();
    KX.widget();
  };
  /* ---------- floating contact widget ---------- */
  KX.widget = function () {
    if (/admin\.html$/.test(location.pathname) || KX.$('#kxw')) return;
    var c = KX.cfg.contacts || {}, w = D.createElement('div'); w.id = 'kxw'; w.setAttribute('data-open', 'false');
    w.innerHTML = '<div class="panel" id="kxp" role="dialog" aria-label="Contact KINETIX"><h3>Chat with KINETIX</h3><div class="sub">We usually reply within a few hours.</div>' +
      '<a class="cl" href="' + KX.waLink('ae', 'Hello KINETIX, I have a question.') + '" target="_blank" rel="noopener"><span class="ico wa sm">' + KX.icon('wa') + '</span><div><b>WhatsApp</b><span>Fastest replies. Calls welcome too.</span></div></a>' +
      '<a class="cl" href="' + KX.waLink('ke', 'Hello KINETIX, I have a question.') + '" target="_blank" rel="noopener"><span class="ico wa sm">' + KX.icon('wa') + '</span><div><b>WhatsApp (Kenya line)</b><span>Messages only.</span></div></a>' +
      '<a class="cl" href="mailto:' + KX.esc(c.email || '') + '"><span class="ico pm sm">' + KX.icon('proton') + '</span><div><b>Proton Mail</b><span>' + KX.esc(c.email || '') + '</span></div></a>' +
      '<a class="cl" href="#" data-install hidden><span class="ico am sm">' + KX.icon('down') + '</span><div><b>Install the app</b><span>Quick access from your home screen.</span></div></a>' +
      '<a class="cl" href="order-status.html"><span class="ico gr sm">' + KX.icon('clock') + '</span><div><b>Track your order</b><span>Use your reference number.</span></div></a></div>' +
      '<button type="button" class="fab" aria-expanded="false" aria-controls="kxp" aria-label="Contact us">' + KX.icon('msg') + '</button>';
    D.body.appendChild(w);
    var b = w.querySelector('.fab');
    function set(o) { w.setAttribute('data-open', o ? 'true' : 'false'); b.setAttribute('aria-expanded', o ? 'true' : 'false'); b.innerHTML = KX.icon(o ? 'x' : 'msg'); }
    b.addEventListener('click', function () { set(w.getAttribute('data-open') !== 'true'); });
    D.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
    D.addEventListener('click', function (e) { if (!w.contains(e.target)) set(false); });
  };
  /* ---------- PDF engine + thumbnails ---------- */
  var pjsP = null;
  KX.pdfjs = function () { if (!pjsP) pjsP = import('./pdf.min.mjs').then(function (m) { m.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.mjs'; return m; }).catch(function () { pjsP = null; throw new Error('Could not load the PDF viewer engine.'); }); return pjsP; };
  KX.pdfThumb = function (file, w) {
    w = w || 240;
    return KX.pdfjs().then(function (J) { return file.arrayBuffer().then(function (b) { return J.getDocument({ data: b }).promise; }); }).then(function (doc) {
      return doc.getPage(1).then(function (pg) {
        var v1 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: w / v1.width }), c = D.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
        var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
        return pg.render({ canvasContext: g, viewport: vp }).promise.then(function () { var u = c.toDataURL('image/jpeg', .7); c.width = c.height = 0; return { thumb: u, pages: doc.numPages }; });
      });
    });
  };
  /* ---------- upload grid with thumbnails, arrows and drag to arrange ---------- */
  KX.fileGrid = function (host, getList, setList, onChange) {
    function mv(i, j) { var l = getList().slice(); if (j < 0 || j >= l.length || i === j) return; var x = l.splice(i, 1)[0]; l.splice(j, 0, x); setList(l); draw(); onChange && onChange(); }
    function draw() {
      var l = getList(); host.innerHTML = '';
      l.forEach(function (f, i) {
        var d = D.createElement('div'); d.className = 'file'; d.draggable = true; d.setAttribute('data-i', i);
        d.innerHTML = '<span class="no">' + (i + 1) + '</span>' + (f.thumb ? '<img alt="" src="' + f.thumb + '">' : '<div class="th">' + KX.icon(/pdf/.test(f.type) ? 'file' : 'image') + '</div>') +
          '<div class="nm" title="' + KX.esc(f.name) + '">' + KX.esc(f.name) + '</div><div class="muted" style="font-size:.72rem">' + (f.pages ? f.pages + ' page' + (f.pages > 1 ? 's' : '') + ' &middot; ' : '') + (f.size / 1024 < 1024 ? Math.round(f.size / 1024) + ' KB' : (f.size / 1048576).toFixed(1) + ' MB') + '</div>' +
          '<button type="button" class="x" aria-label="Remove ' + KX.esc(f.name) + '">&times;</button><div class="mv"><button type="button" data-d="-1" aria-label="Move earlier">' + KX.icon('left') + '</button><button type="button" data-d="1" aria-label="Move later">' + KX.icon('right') + '</button></div>';
        d.querySelector('.x').onclick = function () { setList(getList().filter(function (x) { return x.id !== f.id; })); draw(); onChange && onChange(); };
        Array.prototype.forEach.call(d.querySelectorAll('.mv button'), function (b) { b.onclick = function () { mv(i, i + (+b.getAttribute('data-d'))); }; });
        d.addEventListener('dragstart', function (e) { d.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(i)); } catch (x) {} host._from = i; });
        d.addEventListener('dragend', function () { d.classList.remove('dragging'); Array.prototype.forEach.call(host.children, function (c) { c.classList.remove('dropb'); }); });
        d.addEventListener('dragover', function (e) { if (host._from == null) return; e.preventDefault(); d.classList.add('dropb'); });
        d.addEventListener('dragleave', function () { d.classList.remove('dropb'); });
        d.addEventListener('drop', function (e) { if (host._from == null) return; e.preventDefault(); e.stopPropagation(); var a = host._from; host._from = null; mv(a, i); });
        host.appendChild(d);
      });
    }
    draw(); return draw;
  };
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', KX.init); else KX.init();
})();

/* Offline/cache consent + update notice */
function kxOffline() {
  var D = document, LS = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; };
  if (location.protocol.indexOf('http') !== 0) return;
  var ADMIN = /admin\.html/.test(location.pathname);
  function sheet(html) { var b = D.createElement('div'); b.className = 'kxsheet'; b.setAttribute('role', 'dialog'); b.innerHTML = html; D.body.appendChild(b); setTimeout(function () { b.classList.add('on'); }, 30); return b; }
  var reg = null;
  function send(m) { try { navigator.serviceWorker.ready.then(function (r) { if (r.active) r.active.postMessage(m); }); } catch (e) {} }
  try { if ('serviceWorker' in navigator) { navigator.serviceWorker.addEventListener('message', function (e) { if (e.data && e.data.precached != null && window.kxPre) KX.toast(e.data.precached >= e.data.total - 1 ? 'PDF tools are ready offline' : 'Some tools could not be saved. Try again online.'); }); navigator.serviceWorker.register('sw.js').then(function (r) { reg = r; var c = LS('kx-cache'); if (c === 'yes' || c === 'no') send({ consent: c }); }).catch(function () {}); } } catch (e) {}
  if (ADMIN) return;
  function precache() { window.kxPre = true; fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (x) { return x.json(); }).then(function (j) { send({ consent: 'yes' }); send({ precache: j.offline || [] }); }).catch(function () {}); }
  function dots(nw) {
    var path = (location.pathname.split('/').pop() || 'index.html'), seen = []; try { seen = JSON.parse(LS('kx-seen') || '[]'); } catch (e) {}
    if (nw.indexOf(path) > -1 && seen.indexOf(path) < 0) { seen.push(path); LS('kx-seen', JSON.stringify(seen)); }
    var un = nw.filter(function (x) { return seen.indexOf(x) < 0; }); if (!un.length) return;
    [].slice.call(D.querySelectorAll('a[href]')).forEach(function (a) {
      var h = (a.getAttribute('href') || '').split('#')[0].split('?')[0].split('/').pop();
      if (a.querySelector('.kxdot') || a.closest('.kxsheet')) return;
      if (un.indexOf(h) > -1 || (h === 'pdf-tools.html' && !a.classList.contains('fc'))) { var d = D.createElement('i'); d.className = 'kxdot'; d.setAttribute('aria-label', 'New'); var t = a.querySelector('b') || a; t.appendChild(d); }
    });
  }
  function checkUpdate() {
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j) return; dots(j.new || []); var seen = LS('kx-ver'); if (!seen) { LS('kx-ver', j.v); return; } if (seen === j.v) return;
      var b = sheet('<b>' + KX.esc(j.title || 'We updated KINETIX') + '</b><ul>' + (j.notes || []).map(function (n) { return '<li>' + KX.esc(n) + '</li>'; }).join('') + '</ul><div class="r"><button type="button" class="btn sm" data-a="x">Later</button><button type="button" class="btn sm pri" data-a="u">Update now</button></div>');
      b.addEventListener('click', function (e) { var a = e.target.getAttribute && e.target.getAttribute('data-a'); if (!a) return; LS('kx-ver', j.v); if (a === 'u') { try { if (window.caches) caches.keys().then(function (k) { return Promise.all(k.map(function (x) { return caches.delete(x); })); }).then(function () { location.reload(); }); else location.reload(); } catch (x) { location.reload(); } } else b.classList.remove('on'); });
    }).catch(function () {});
  }
  var c = LS('kx-cache');
  if (c === 'yes' || c === 'no') { /* already chosen */ }
  else setTimeout(function () {
    var b = sheet('<b>Allow offline mode?</b><p>Saves pages on your device so the site opens faster and works with weak signal, and lets us tell you when we add something new. You can change this anytime by clearing site data.</p><div class="r"><button type="button" class="btn sm" data-a="n">Don\'t allow</button><button type="button" class="btn sm pri" data-a="y">Allow</button></div>');
    b.addEventListener('click', function (e) { var a = e.target.getAttribute && e.target.getAttribute('data-a'); if (!a) return; LS('kx-cache', a === 'y' ? 'yes' : 'no'); b.classList.remove('on'); if (a === 'y') { precache(); KX.toast('Saving PDF tools for offline use...'); } else { send({ consent: 'no' }); } });
  }, 1800);
  checkUpdate();
}
