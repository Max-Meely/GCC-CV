'use strict';
// Approximate HTML rendering of the mock Google Doc tree, for eyeballing structure and content.
const fs = require('fs'), path = require('path');
const { load, E } = require('./run_backend');
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
function runsHtml(el) {
  const t = el._text, f = el._fmt; if (!t) return '&nbsp;';
  const mark = new Array(t.length).fill(null).map(() => ({}));
  el._rangeFmt.forEach(r => { for (let i = r.a; i <= r.b; i++) mark[i][r.k] = r.v; });
  let out = '', cur = '', key = null;
  const flush = () => { if (cur) { const m = mark[cur._i] || {}; } };
  for (let i = 0; i < t.length; i++) {
    const k = JSON.stringify(mark[i]);
    if (k !== key) { if (key !== null) out += '</span>'; const m = mark[i]; out += '<span style="' + (m.bold != null ? 'font-weight:' + (m.bold ? 700 : 400) + ';' : '') + (m.color ? 'color:' + m.color + ';' : '') + (m.italic != null ? 'font-style:' + (m.italic ? 'italic' : 'normal') + ';' : '') + '">'; key = k; }
    out += esc(t[i]);
  }
  return out + '</span>';
}
function blockStyle(el) {
  const f = el._fmt, p = el._para;
  return `font-family:${f.font || 'Arial'},sans-serif;font-size:${f.size || 11}pt;color:${f.color || '#222'};font-weight:${f.bold ? 700 : 400};font-style:${f.italic ? 'italic' : 'normal'};margin:${p.before || 0}pt 0 ${p.after == null ? 0 : p.after}pt 0;line-height:${(p.line || 1) * 1.2};text-align:${{ L: 'left', R: 'right', C: 'center' }[p.align] || 'left'};` + (p.indent ? `padding-left:${p.indent}pt;` : '') + (p.first != null && p.indent ? `text-indent:${p.first - p.indent}pt;` : '');
}
function node(n) {
  switch (n._type) {
    case 'PARAGRAPH': { const imgs = n._imgs.map(i => `<span style="display:inline-block;width:${i.w}pt;height:${i.h}pt;background:#9aa5b1;border-radius:4px"></span>`).join(''); return `<div style="${blockStyle(n)}">${imgs}${runsHtml(n)}</div>`; }
    case 'LIST_ITEM': return `<div style="${blockStyle(n)};display:flex;gap:6pt;padding-left:${(n._para.first || 0)}pt"><span>&bull;</span><span>${runsHtml(n)}</span></div>`;
    case 'HR': return '<hr style="border:0;border-top:1px solid #444;margin:2pt 0 3pt">';
    case 'TABLE': {
      const cols = Object.keys(n.colW).length;
      return `<table style="box-sizing:border-box;border-collapse:collapse;table-layout:fixed;width:${Object.values(n.colW).reduce((a, b) => a + b, 0) || 'auto'}pt;${n.border ? 'border:' + n.border + 'px solid #ccc' : ''}">` + n.rows.map(r => `<tr style="height:${r.minH}pt">` + r.cells.map((c, i) => `<td style="box-sizing:border-box;vertical-align:top;width:${n.colW[i] || 'auto'}pt;background:${c.bg || 'transparent'};padding:${c.pad.t || 0}pt ${c.pad.r || 0}pt ${c.pad.b || 0}pt ${c.pad.l || 0}pt;${n.border ? 'border:' + n.border + 'px solid #ccc' : ''}">${c.kids.map(node).join('')}</td>`).join('') + '</tr>').join('') + '</table>';
    }
    default: return '';
  }
}
function docHtml(d) {
  const b = d.body, m = b.m;
  return `<!doctype html><meta charset=utf-8><body style="margin:0;background:#888"><div style="width:${b.page.w}pt;min-height:${b.page.h}pt;background:#fff;margin:0 auto;box-sizing:border-box;padding:${m.t}pt ${m.r}pt ${m.b}pt ${m.l}pt">${b.kids.map(node).join('')}</div>`;
}
module.exports = { docHtml };
if (require.main === module) {
  const api = load({ fetch: () => ({ code: 200 }) });
  const names = ['ats_classic', 'ats_compact', 'exec_navy', 'side_navy', 'side_teal', 'site_bold'];
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64').toString('base64');
  names.forEach((s, i) => {
    const d = api.sampleOrder_(); d.style = s; d.person.fullName = 'Joseph Mwangi'; d.person.email = 'joseph' + i + '@example.com';
    d.target.extraSkills = 'SAP, Reach truck';
    const r = JSON.parse(api.doPost({ postData: { contents: JSON.stringify(Object.assign({ action: 'submit', photo: { type: 'image/png', data: png } }, d)) } }).getContent());
    if (!r.ok) throw new Error(JSON.stringify(r));
  });
  Object.values(E.docs).forEach(doc => { fs.writeFileSync(path.join(__dirname, 'out', doc.id + '-' + doc.name.replace(/\W+/g, '_') + '.html'), docHtml(doc)); });
  console.log(Object.values(E.docs).map(d => d.id + ' ' + d.name).join('\n'));
}
