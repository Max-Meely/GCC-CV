/* Strict Google Apps Script mock. Only methods that really exist are defined, so any
   misuse (e.g. setGlyphType on a Paragraph) throws TypeError exactly as it would in production. */
'use strict';
const crypto = require('crypto');
const E = {}; // shared state
function fail(m) { throw new Error(m); }
function num(v, n) { if (typeof v !== 'number' || !isFinite(v)) fail(n + ': expected number, got ' + v); }
function color(v, n) { if (typeof v !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(v)) fail(n + ': bad colour ' + v); }
function bool(v, n) { if (typeof v !== 'boolean') fail(n + ': expected boolean, got ' + typeof v); }

const Enums = {
  ParagraphHeading: { NORMAL: 'NORMAL', HEADING1: 'H1', HEADING2: 'H2', HEADING3: 'H3', TITLE: 'TITLE' },
  GlyphType: { BULLET: 'BULLET', HOLLOW_BULLET: 'HOLLOW', SQUARE_BULLET: 'SQUARE', NUMBER: 'NUMBER' },
  HorizontalAlignment: { LEFT: 'L', RIGHT: 'R', CENTER: 'C', JUSTIFY: 'J' },
  VerticalAlignment: { TOP: 'T', CENTER: 'C', BOTTOM: 'B' },
  ElementType: { PARAGRAPH: 'PARAGRAPH', LIST_ITEM: 'LIST_ITEM', TABLE: 'TABLE', TABLE_ROW: 'TABLE_ROW', TABLE_CELL: 'TABLE_CELL', HORIZONTAL_RULE: 'HR', INLINE_IMAGE: 'IMG', BODY_SECTION: 'BODY', TEXT: 'TEXT' }
};
const has = (o, v) => Object.values(o).includes(v);

class TextEl {
  constructor(owner) { this.o = owner; this.runs = []; }
  getText() { return this.o._text; }
  _chk(s, e) { if (!(s >= 0 && e >= s && e < this.o._text.length)) fail('Text range out of bounds: ' + s + '-' + e + ' len ' + this.o._text.length); }
  _set(k, v, a, b) { if (a === undefined) { this.o._fmt[k] = v; this.o._rangeFmt = this.o._rangeFmt.filter(r => r.k !== k); } else { this._chk(a, b); this.o._rangeFmt.push({ k, v, a, b }); } }
  setFontFamily(f) { if (typeof f !== 'string') fail('font'); this.o._fmt.font = f; return this; }
  setFontSize(n) { num(n, 'setFontSize'); if (n <= 0) fail('size'); this.o._fmt.size = n; return this; }
  setForegroundColor(a, b, c) { if (b === undefined) { color(a, 'fg'); this._set('color', a); } else { color(c, 'fg'); this._set('color', c, a, b); } return this; }
  setBold(a, b, c) { if (b === undefined) { bool(a, 'setBold'); this._set('bold', a); } else { bool(c, 'setBold'); this._set('bold', c, a, b); } return this; }
  setItalic(a, b, c) { if (b === undefined) { bool(a, 'setItalic'); this._set('italic', a); } else { bool(c, 'setItalic'); this._set('italic', c, a, b); } return this; }
}
class Base {
  getType() { return this._type; }
  asParagraph() { if (this._type !== 'PARAGRAPH') fail('asParagraph on ' + this._type); return this; }
  asTable() { if (this._type !== 'TABLE') fail('asTable on ' + this._type); return this; }
  asListItem() { if (this._type !== 'LIST_ITEM') fail('asListItem on ' + this._type); return this; }
}
class TextBlock extends Base { // shared by Paragraph and ListItem
  constructor() { super(); this._text = ''; this._fmt = {}; this._rangeFmt = []; this._para = {}; this._imgs = []; }
  getText() { return this._text; }
  setText(t) { if (typeof t !== 'string') fail('setText needs string'); this._text = t; this._rangeFmt = []; return this; }
  editAsText() { return new TextEl(this); }
  setHeading(h) { if (!has(Enums.ParagraphHeading, h)) fail('bad heading ' + h); this._para.heading = h; return this; }
  setAlignment(a) { if (!has(Enums.HorizontalAlignment, a)) fail('bad alignment ' + a); this._para.align = a; return this; }
  setSpacingBefore(n) { num(n, 'setSpacingBefore'); this._para.before = n; return this; }
  setSpacingAfter(n) { num(n, 'setSpacingAfter'); this._para.after = n; return this; }
  setLineSpacing(n) { num(n, 'setLineSpacing'); this._para.line = n; return this; }
  setIndentStart(n) { num(n, 'setIndentStart'); this._para.indent = n; return this; }
  setIndentFirstLine(n) { num(n, 'setIndentFirstLine'); this._para.first = n; return this; }
}
class Paragraph extends TextBlock {
  constructor(t) { super(); this._type = 'PARAGRAPH'; this._text = t || ''; }
  appendInlineImage(blob) { if (!blob || !blob.getBytes) fail('appendInlineImage needs a Blob'); const i = new InlineImage(blob); this._imgs.push(i); return i; }
}
class ListItem extends TextBlock {
  constructor(t) { super(); this._type = 'LIST_ITEM'; this._text = t || ''; this._glyph = null; }
  setGlyphType(g) { if (!has(Enums.GlyphType, g)) fail('bad glyph ' + g); this._glyph = g; return this; }
}
class InlineImage extends Base {
  constructor(b) { super(); this._type = 'IMG'; this.blob = b; this.w = 100; this.h = 100; }
  setWidth(n) { num(n, 'img w'); this.w = n; return this; } setHeight(n) { num(n, 'img h'); this.h = n; return this; }
}
class HRule extends Base { constructor() { super(); this._type = 'HR'; } }
class Container extends Base {
  constructor() { super(); this.kids = []; }
  getNumChildren() { return this.kids.length; }
  getChild(i) { if (!(i >= 0 && i < this.kids.length)) fail('getChild index ' + i + ' of ' + this.kids.length); return this.kids[i]; }
  appendParagraph(t) { if (typeof t !== 'string') fail('appendParagraph needs a string'); const p = new Paragraph(t); this.kids.push(p); return p; }
  appendListItem(t) { if (typeof t !== 'string') fail('appendListItem needs a string'); const p = new ListItem(t); this.kids.push(p); return p; }
  appendHorizontalRule() { const h = new HRule(); this.kids.push(h); return h; }
  appendImage(b) { const p = new Paragraph(''); p.appendInlineImage(b); this.kids.push(p); return p._imgs[0]; }
  appendTable(cells) {
    const t = new Table(); if (cells !== undefined) {
      if (!Array.isArray(cells) || !cells.every(r => Array.isArray(r))) fail('appendTable needs string[][]');
      cells.forEach(r => { const row = new TableRow(); r.forEach(v => { if (typeof v !== 'string') fail('appendTable cell must be string, got ' + typeof v); row.cells.push(new TableCell(v)); }); t.rows.push(row); });
    } this.kids.push(t); return t;
  }
  removeChild(c) { const i = this.kids.indexOf(c); if (i < 0) fail('removeChild: not a child'); if (this.kids.length === 1) fail('cannot remove only child'); this.kids.splice(i, 1); return this; }
}
class Table extends Base {
  constructor() { super(); this._type = 'TABLE'; this.rows = []; this.colW = {}; this.border = 1; }
  getRow(i) { if (!(i >= 0 && i < this.rows.length)) fail('getRow ' + i + ' of ' + this.rows.length); return this.rows[i]; }
  getNumRows() { return this.rows.length; }
  setColumnWidth(c, w) { num(w, 'setColumnWidth'); if (!(c >= 0 && c < this.rows[0].cells.length)) fail('setColumnWidth col ' + c); if (w < 0) fail('neg width'); this.colW[c] = w; return this; }
  setBorderWidth(w) { num(w, 'setBorderWidth'); this.border = w; return this; }
  setBorderColor(c) { color(c, 'setBorderColor'); return this; }
}
class TableRow extends Base {
  constructor() { super(); this._type = 'TABLE_ROW'; this.cells = []; this.minH = 0; }
  getCell(i) { if (!(i >= 0 && i < this.cells.length)) fail('getCell ' + i + ' of ' + this.cells.length); return this.cells[i]; }
  setMinimumHeight(h) { num(h, 'setMinimumHeight'); this.minH = h; return this; }
}
class TableCell extends Container {
  constructor(t) { super(); this._type = 'TABLE_CELL'; this.kids.push(new Paragraph(t || '')); this.bg = null; this.pad = {}; this.va = null; }
  setBackgroundColor(c) { color(c, 'setBackgroundColor'); this.bg = c; return this; }
  setPaddingTop(n) { num(n, 'pad'); this.pad.t = n; return this; } setPaddingBottom(n) { num(n, 'pad'); this.pad.b = n; return this; }
  setPaddingLeft(n) { num(n, 'pad'); this.pad.l = n; return this; } setPaddingRight(n) { num(n, 'pad'); this.pad.r = n; return this; }
  setVerticalAlignment(v) { if (!has(Enums.VerticalAlignment, v)) fail('bad valign'); this.va = v; return this; }
  setWidth(n) { num(n, 'cell width'); return this; }
}
class Body extends Container {
  constructor() { super(); this._type = 'BODY'; this.kids.push(new Paragraph('')); this.page = { w: 612, h: 792 }; this.m = {}; }
  setPageWidth(n) { num(n, 'pw'); this.page.w = n; return this; } setPageHeight(n) { num(n, 'ph'); this.page.h = n; return this; }
  setMarginTop(n) { num(n, 'm'); this.m.t = n; return this; } setMarginBottom(n) { num(n, 'm'); this.m.b = n; return this; }
  setMarginLeft(n) { num(n, 'm'); this.m.l = n; return this; } setMarginRight(n) { num(n, 'm'); this.m.r = n; return this; }
}
class Doc {
  constructor(name) { this.name = name; this.body = new Body(); this.id = 'doc' + (++E.n); this.closed = false; }
  getBody() { if (this.closed) fail('document closed'); return this.body; }
  getId() { return this.id; } saveAndClose() { this.closed = true; }
}

class Blob {
  constructor(bytes, type, name) { this.bytes = bytes; this.type = type; this.name = name || ''; }
  getBytes() { return this.bytes; } getContentType() { return this.type; } getName() { return this.name; }
  setName(n) { this.name = n; return this; } copyBlob() { return new Blob(this.bytes, this.type, this.name); }
}
class File {
  constructor(id, blob, parent) { this.id = id; this.blob = blob; this.parent = parent; this.trashed = false; }
  getName() { return this.blob.name; } getUrl() { return 'https://drive.mock/file/' + this.id; } getId() { return this.id; }
  getBlob() { return this.blob.copyBlob(); } setTrashed(b) { this.trashed = b; return this; }
  getAs(mime) { if (mime !== 'application/pdf') fail('getAs supports PDF here'); const d = E.docs[this.id]; if (!d) fail('getAs on non-doc'); return new Blob(Buffer.from('%PDF-mock ' + d.name), 'application/pdf', this.blob.name.replace(/\.[^.]+$/, '') + '.pdf'); }
}
class Folder {
  constructor(name, parent) { this.id = 'fld' + (++E.n); this.name = name; this.files = []; this.sub = []; E.folders[this.id] = this; }
  getName() { return this.name; } getUrl() { return 'https://drive.google.com/drive/folders/' + this.id; } getId() { return this.id; }
  createFolder(n) { const f = new Folder(n, this); this.sub.push(f); return f; }
  createFile(a, b, c) { // real Folder.createFile has two overloads: (blob) or (name, content-string, mimeType)
    const blob = a instanceof Blob ? a : new Blob(Buffer.from(String(b == null ? '' : b), 'utf8'), c || 'text/plain', a);
    const f = new File('fil' + (++E.n), blob, this); E.files[f.id] = f; this.files.push(f); return f;
  }
  getFiles() { let i = 0; const a = this.files.filter(f => !f.trashed); return { hasNext: () => i < a.length, next: () => a[i++] }; }
}

function makeSheet(name) {
  const rows = [];
  return {
    _rows: rows, _name: name, _frozen: 0,
    getLastRow() { return rows.length; },
    getLastColumn() { return rows.reduce((m, r) => Math.max(m, r.length), 0); },
    appendRow(a) { if (!Array.isArray(a)) fail('appendRow needs array'); rows.push(a.slice()); },
    setFrozenRows(n) { this._frozen = n; },
    getRange(r, c, nr, nc) {
      nr = nr || 1; nc = nc || 1; if (r < 1 || c < 1) fail('bad range');
      return {
        getValues() { const out = []; for (let i = 0; i < nr; i++) { const row = []; for (let j = 0; j < nc; j++) row.push((rows[r - 1 + i] || [])[c - 1 + j] ?? ''); out.push(row); } return out; },
        setValues(v) { v.forEach((row, i) => row.forEach((x, j) => { while (rows.length < r + i) rows.push([]); rows[r - 1 + i][c - 1 + j] = x; })); },
        setValue(x) { while (rows.length < r) rows.push([]); rows[r - 1][c - 1] = x; },
        setFontWeight(w) { if (!['bold', 'normal'].includes(w)) fail('fontWeight'); }
      };
    },
    getDataRange() { // real sheets always have at least one row/column, even when empty
      return this.getRange(1, 1, Math.max(1, rows.length), Math.max(1, this.getLastColumn()));
    }
  };
}

function install(opts) {
  opts = opts || {};
  E.n = 0; E.docs = {}; E.files = {}; E.folders = {}; E.sheets = {}; E.props = {}; E.cache = {}; E.mail = []; E.fetches = []; E.log = [];
  const g = {};
  g.DocumentApp = Object.assign({
    create(name) { const d = new Doc(name); E.docs[d.id] = d; E.files[d.id] = new File(d.id, new Blob(Buffer.from(''), 'application/vnd.google-apps.document', name), null); return d; }
  }, Enums);
  g.DriveApp = {
    getFolderById(id) { return E.folders[id] || (id === 'ROOT' ? new Folder('ROOT') : fail('folder not found ' + id)); },
    getFileById(id) { return E.files[id] || fail('file not found ' + id); }
  };
  g.SpreadsheetApp = { openById(id) { return {
    getSheetByName(n) { return E.sheets[n] || null; },
    insertSheet(n) { E.sheets[n] = makeSheet(n); return E.sheets[n]; }
  }; } };
  g.Utilities = {
    base64Decode(s) { return Array.from(Buffer.from(s, 'base64')); },
    base64EncodeWebSafe(s) { return Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'); },
    newBlob(bytes, type, name) { return new Blob(Buffer.from(bytes), type, name); },
    formatDate(d, tz, fmt) { if (fmt !== 'yyyy-MM-dd') fail('mock formatDate'); return d.toISOString().slice(0, 10); },
    sleep() {}
  };
  g.Session = { getScriptTimeZone: () => 'Asia/Dubai', getEffectiveUser: () => ({ getEmail: () => 'owner@example.com' }) };
  g.PropertiesService = { getScriptProperties: () => ({ getProperty: k => E.props[k] ?? null, setProperty: (k, v) => { E.props[k] = String(v); } }) };
  g.CacheService = { getScriptCache: () => ({ get: k => E.cache[k] ?? null, put: (k, v) => { E.cache[k] = v; } }) };
  g.LockService = { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) };
  g.ScriptApp = { getOAuthToken: () => 'tok' };
  g.ContentService = { MimeType: { JSON: 'JSON' }, createTextOutput(s) { return { _s: s, setMimeType(m) { return this; }, getContent() { return s; } }; } };
  g.MailApp = { sendEmail(o) { if (!o || !o.to || !o.subject || !o.htmlBody) fail('sendEmail needs to/subject/htmlBody'); E.mail.push(o); } };
  g.UrlFetchApp = { fetch(url, o) {
    E.fetches.push({ url, o });
    const r = (opts.fetch && opts.fetch(url, o)) || { code: 200, text: 'OK' };
    return { getResponseCode: () => r.code, getContentText: () => r.text || '', getBlob: () => new Blob(Buffer.from('docx-mock'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'x.docx') };
  } };
  g.Logger = { log(s) { E.log.push(s); } };
  g.console = console;
  new Folder('ROOT'); // fld1
  return { g, E };
}
module.exports = { install, E, Blob };
