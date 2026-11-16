'use strict';
const { load, E } = require('./run_backend');
let pass = 0, fails = [];
const ok = (c, m) => { if (c) pass++; else { fails.push(m); console.log('  FAIL', m); } };
const post = (api, body) => JSON.parse(api.doPost({ postData: { contents: typeof body === 'string' ? body : JSON.stringify(body) } }).getContent());

// ---- past tense on every catalogue duty
{
  const api = load();
  const bad = [];
  Object.values(api.CONTENT).forEach(i => Object.entries(i.roles).forEach(([r, o]) => o.tasks.forEach(t => {
    const p = api.pastTense_(t);
    if (p === t && !/^(Set|Read|Cut|Put)\b/.test(t)) bad.push(t);
  })));
  ok(bad.length === 0, 'past tense unchanged: ' + bad.slice(0, 3).join(' / '));
  const samples = ['Offload, sort and put away materials in the correct bin locations', 'Cut, fit-up, align and prepare pipe spools for welding', 'Carry out daily and weekly stock counts', 'Stand by as fire watch', 'Apply primer, intermediate and topcoat systems', 'Plan storage by item type', 'Bag items and assist customers politely', 'Collect, label and process patient specimens', 'Troubleshoot faults and recommend repairs', 'Empty bins and manage waste correctly'];
  console.log(samples.map(s => '   ' + api.pastTense_(s)).join('\n'));
}

// ---- validation: empty payload must be rejected (the old "Unknown Client" bug)
{
  const api = load();
  let r = post(api, { action: 'submit' }); ok(r.ok === false, 'empty submit rejected');
  r = post(api, { action: 'submit', service: 'cv_ats', person: { fullName: '', email: 'x', phone: '1' }, target: {} }); ok(r.ok === false, 'bad submit rejected');
  r = post(api, 'not json'); ok(r.ok === false, 'bad json handled');
  r = post(api, { action: 'nope' }); ok(r.ok === false, 'unknown action');
  ok(E.sheets.Orders === undefined || E.sheets.Orders._rows.length <= 1, 'no order row written for rejected input');
}

// ---- full submit in every style, with photo and files
const styles = ['ats_classic', 'ats_compact', 'exec_navy', 'side_navy', 'side_teal', 'site_bold'];
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64').toString('base64');
{
  const api = load({ fetch: u => u.includes('callmebot') ? { code: 200, text: 'Message queued' } : { code: 200 } });
  styles.forEach((s, i) => {
    const d = api.sampleOrder_(); d.style = s; d.person.fullName = 'Test Person ' + (i + 1); d.person.email = 'p' + i + '@example.com';
    const r = post(api, Object.assign({ action: 'submit', photo: { type: 'image/png', data: png }, files: [{ name: 'a.png', type: 'image/png', data: png }, { name: 'b.pdf', type: 'application/pdf', data: Buffer.from('%PDF-1.4').toString('base64') }] }, d));
    ok(r.ok === true, s + ' submit ok: ' + JSON.stringify(r));
    ok(r.ref === 'KTX-000' + (i + 1), s + ' ref sequence ' + r.ref);
    ok(!r.warnings.length, s + ' no warnings: ' + r.warnings);
  });
  const o = E.sheets.Orders._rows;
  ok(o.length === 7, 'orders rows=' + o.length);
  const hdr = o[0], row = o[1], col = n => row[hdr.indexOf(n)];
  ok(col('Ref') === 'KTX-0001' && col('Total') === 50 && col('Status') === 'received' && col('Paid') === 'unpaid', 'row values ' + [col('Ref'), col('Total'), col('Status')]);
  const folder = Object.values(E.folders).find(f => f.name.startsWith('KTX-0001'));
  const names = folder.files.map(f => f.getName());
  console.log('   files:', names.join(', '));
  ok(names.some(n => /_CV_.*\.pdf$/.test(n)) && names.some(n => /_CV_.*\.docx$/.test(n)), 'CV pdf+docx');
  ok(names.some(n => /Cover_Letter_.*\.pdf$/.test(n)), 'cover letter');
  ok(names.some(n => /Client_Summary/.test(n)), 'summary');
  ok(names.some(n => /Certificate_1_/.test(n)) && names.some(n => /Photo/.test(n)), 'uploads + photo saved');
  ok(!Object.values(E.docs).some(d => !d.closed), 'all docs closed');
  ok(Object.keys(E.docs).every(id => E.files[id].trashed), 'temp docs trashed');
  ok(E.fetches.filter(f => f.url.includes('callmebot')).length === 12, 'whatsapp sent to 2 numbers x 6 = ' + E.fetches.filter(f => f.url.includes('callmebot')).length);
  const urls = E.fetches.filter(f => f.url.includes('callmebot')).slice(0, 2).map(f => f.url);
  ok(/phone=971544564191&/.test(urls[0]) && /apikey=2457694/.test(urls[0]), 'whatsapp #1 url');
  ok(/phone=17137087324180%40lid/.test(urls[1]) && /apikey=7116817/.test(urls[1]), 'whatsapp #2 url ' + urls[1]);
  ok(E.mail.length === 12, 'emails (6 admin + 6 client) = ' + E.mail.length);
  ok(E.mail.some(m => m.to === 'p0@example.com' && /KTX-0001/.test(m.subject)), 'client confirmation');

  // duplicate resend returns the same ref
  const d = api.sampleOrder_(); d.style = 'ats_classic'; d.person.fullName = 'Test Person 1'; d.person.email = 'p0@example.com';
  const r2 = post(api, Object.assign({ action: 'submit' }, d));
  ok(r2.ok && r2.ref === 'KTX-0001' && r2.duplicate, 'duplicate resend returns same ref');

  // status lookup
  let s = post(api, { action: 'status', ref: 'KTX-0001', contact: 'p0@example.com' });
  ok(s.ok && s.order.status === 'received' && s.order.service.includes('ATS'), 'status by email');
  s = post(api, { action: 'status', ref: 'KTX-0001', contact: '+971 50 123 4567' }); ok(s.ok, 'status by phone');
  s = post(api, { action: 'status', ref: 'KTX-0001', contact: 'other@example.com' }); ok(!s.ok, 'status wrong contact rejected');
  s = post(api, { action: 'status', ref: "KTX-0001' OR 1=1", contact: 'p0@example.com' }); ok(!s.ok, 'status bad ref rejected');
  ok(s.order === undefined, 'no data leak on failure');

  // revision
  let rv = post(api, { action: 'revision', ref: 'KTX-0001', contact: 'p0@example.com', message: 'Please fix my job title', files: [{ name: 'x.png', type: 'image/png', data: png }] });
  ok(rv.ok && rv.free === true, 'first revision free');
  rv = post(api, { action: 'revision', ref: 'KTX-0001', contact: 'p0@example.com', message: 'Another change please' });
  ok(rv.ok && rv.free === false && rv.fee === 15, 'second revision paid');

  // admin
  let a = post(api, { action: 'admin_list', key: 'wrong' }); ok(!a.ok, 'admin wrong key');
  a = post(api, { action: 'admin_list', key: api.CFG.ADMIN_KEY }); ok(a.ok && a.orders.length === 6 && a.orders[0].ref === 'KTX-0006', 'admin list newest first');
  a = post(api, { action: 'admin_get', key: api.CFG.ADMIN_KEY, ref: 'KTX-0002' }); ok(a.ok && a.order.folder.includes('drive'), 'admin get');
  a = post(api, { action: 'admin_update', key: api.CFG.ADMIN_KEY, ref: 'KTX-0001', status: 'delivered', paid: 'paid', note: 'Sent', sendFiles: true });
  ok(a.ok && /emailed/.test(a.message), 'admin update + email files: ' + a.message);
  const att = E.mail.filter(m => m.attachments);
  // PDF-only by default (office:true not passed) - the client gets the CV PDF + cover PDF, not the Word copies.
  ok(att.length === 1 && att[0].attachments.length === 2, 'emailed attachments default (cv pdf + cover pdf) = ' + (att[0] && att[0].attachments.length));
  a = post(api, { action: 'admin_update', key: api.CFG.ADMIN_KEY, ref: 'KTX-0002', status: 'delivered', paid: 'paid', sendFiles: true, office: true });
  ok(a.ok && /emailed/.test(a.message), 'admin update + email files with office opt-in: ' + a.message);
  const att2 = E.mail.filter(m => m.attachments && m.to === 'p1@example.com');
  ok(att2.length === 1 && att2[0].attachments.length === 2 + 2, 'emailed attachments with office:true (cv pdf/docx + cover pdf/docx) = ' + (att2[0] && att2[0].attachments.length));
  s = post(api, { action: 'status', ref: 'KTX-0001', contact: 'p0@example.com' }); ok(s.order.status === 'delivered' && s.order.paid === 'paid' && s.order.note === 'Sent', 'status reflects admin update');

  // other service order
  let od = post(api, { action: 'order', service: 'linkedin_basic', name: 'Amina Yusuf', email: 'amina@example.com', phone: '+254 700 000 000', pay: 'mpesa', details: 'linkedin.com/in/amina', files: [{ name: 'cv.pdf', type: 'application/pdf', data: Buffer.from('%PDF').toString('base64') }], rush: true });
  ok(od.ok && od.ref === 'KTX-0007', 'other order ref ' + JSON.stringify(od));
  const lastRow = E.sheets.Orders._rows[E.sheets.Orders._rows.length - 1]; ok(lastRow[o[0].indexOf('Total')] === 70, 'other order total 50+20');
  od = post(api, { action: 'order', service: 'cv_ats', name: 'X', email: 'x@y.com', phone: '1234567' }); ok(!od.ok, 'cv service rejected in order endpoint');
}

// ---- resilience: WhatsApp down, docx export down, mail quota -> order still succeeds with warnings
{
  const api = load({ fetch: u => u.includes('callmebot') ? { code: 500, text: 'down' } : { code: 403 } });
  const d = api.sampleOrder_();
  const r = post(api, Object.assign({ action: 'submit' }, d));
  ok(r.ok === true && r.warnings.includes('whatsapp'), 'order survives whatsapp failure: ' + JSON.stringify(r));
  const folder = Object.values(E.folders).find(f => f.name.startsWith('KTX-0001'));
  ok(folder.files.some(f => /_CV_.*\.pdf$/.test(f.getName())) && !folder.files.some(f => /\.docx$/.test(f.getName())), 'pdf kept when docx export fails');
  ok(E.sheets.Log._rows.some(r => String(r[1]) === 'WHATSAPP_FAIL'), 'failures logged');
}
// ---- fallback: if a styled renderer throws, plain ATS still delivers
{
  const api = load();
  api.STYLES.side_navy.font = 123; // setFontFamily(123) -> mock throws
  const d = api.sampleOrder_(); d.style = 'side_navy';
  const r = post(api, Object.assign({ action: 'submit' }, d));
  const folder = Object.values(E.folders).find(f => f.name.startsWith('KTX-0001'));
  ok(r.ok && folder.files.some(f => /_CV_.*\.pdf$/.test(f.getName())), 'fallback style still produced a CV');
}
// ---- self-healing: old sheet with missing columns / wrong order
{
  const api = load();
  const sh = E.sheets.Orders || null;
  const { install } = require('./gas_mock');
}
console.log(fails.length ? '\nFAILED ' + fails.length + ' / passed ' + pass : '\nALL PASSED (' + pass + ' checks)');
process.exit(fails.length ? 1 : 0);
