/**
 * KINETIX backend - Config.gs
 * Settings only. Edit the values in CFG, then run setup() once.
 * Keep this file private. Do not put it in a public GitHub repository.
 */
const CFG = {
  VERSION: '2.0.0',
  BRAND: 'KINETIX',

  ROOT_FOLDER_ID: '1_QvOlHYVLohFbNH4AyXK72XhuLqt5pGS',
  SPREADSHEET_ID: '1UjJISUjAcdJWaLRGWc9gH2QMQ8nEoXFZkX0Il0C60UE',
  ADMIN_KEY: 'kinetix-admin-2026',               // CHANGE THIS before deploying
  SITE_URL: 'https://YOUR-USERNAME.github.io/YOUR-REPO',   // your GitHub Pages address, no trailing slash

  // Each alert is sent to every recipient. Keys come from the CallMeBot activation message.
  WHATSAPP: [
    { phone: '971544564191', key: '2457694' },
    { phone: '17137087324180@lid', key: '7116817' }
  ],
  ADMIN_EMAILS: [],                              // empty = the account that owns this script

  FREE_REVISION_DAYS: 3,
  EXTRA_REVISION: 15,
  TURNAROUND_HOURS: 48,
  RUSH_HOURS: 24,
  CONTACT: { whatsappKE: '+254 758 587 881', phoneAE: '+971 54 456 4191', email: 'maxmeely@pm.me' }
};

// Must match config.js on the website. Prices here are the ones used for billing.
const SERVICES = {
  cv_standard:    { name: 'Standard CV',                    price: 40,  rush: 20, kind: 'cv' },
  cv_ats:         { name: 'ATS & Technical CV',             price: 50,  rush: 20, kind: 'cv' },
  cv_express:     { name: 'Express CV Guide',               price: 40,  rush: 20, kind: 'cv' },
  linkedin_basic: { name: 'LinkedIn Basic',                 price: 50,  rush: 20, kind: 'other' },
  linkedin_full:  { name: 'LinkedIn Full',                  price: 100, rush: 20, kind: 'other' },
  cert_single:    { name: 'Single Certificate',             price: 60,  rush: 10, kind: 'other' },
  cert_batch:     { name: 'Certificate Batch',              price: 150, rush: 20, kind: 'other' },
  doc_cleanup:    { name: 'Offer Letter / Document Cleanup', price: 40,  rush: 10, kind: 'other' },
  pkg_site:       { name: 'Site Job Package',               price: 90,  rush: 30, kind: 'cv', includesCover: true },
  pkg_career:     { name: 'Full Career Package',            price: 160, rush: 30, kind: 'cv', includesCover: true }
};
const COVER_LETTER_PRICE = 0;

const PAYMENTS = {
  mpesa:   { name: 'M-Pesa',      text: 'M-Pesa number 0758587881' },
  equity:  { name: 'Equity Bank', text: 'Equity Paybill 247247, account 0758587881' },
  cash:    { name: 'Cash',        text: 'We will arrange cash payment with you on WhatsApp' },
  card:    { name: 'Card',        text: 'We will send you a card payment link on WhatsApp' },
  binance: { name: 'Binance',     text: 'We will send you the Binance details on WhatsApp' }
};

const STATUS_LABEL = { received: 'Received', in_progress: 'In progress', review: 'Final check', delivered: 'Delivered', on_hold: 'On hold' };

const VISA_LABEL = {
  employment: 'Employment visa (UAE)', visit: 'Visit / tourist visa', cancelled: 'Visa cancelled - in UAE',
  residence_family: 'Family / dependent residence', golden: 'Golden visa / investor', freelance: 'Freelance permit',
  outside: 'Outside the UAE - requires visa', demob: 'Ready for demobilisation', noc: 'NOC available', gcc_resident: 'Resident in another GCC country'
};
const AVAIL_LABEL = { immediate: 'Immediate', '1w': 'Within 1 week', '2w': 'Within 2 weeks', '1m': '1 month notice', '2m': '2 months notice', '3m': '3 months notice' };
const EDU = {
  none: { l: 'Schooling', r: 0 }, primary: { l: 'Primary School', r: 1 }, secondary: { l: 'Secondary School Certificate', r: 2 },
  vocational: { l: 'Vocational / Trade Certificate', r: 3 }, diploma: { l: 'Diploma', r: 4 }, higher_diploma: { l: 'Higher National Diploma', r: 5 },
  bachelor: { l: "Bachelor's Degree", r: 6 }, postgrad: { l: 'Postgraduate Diploma', r: 7 }, master: { l: "Master's Degree", r: 8 }, phd: { l: 'Doctorate (PhD)', r: 9 }
};

// Visual styles. layout: single | side. ats styles never use tables or photos.
const STYLES = {
  ats_classic: { ats: true,  layout: 'single', font: 'Arial',   size: 10,   head: '#000000', accent: '#000000', gap: 8 },
  ats_compact: { ats: true,  layout: 'single', font: 'Calibri', size: 9.5,  head: '#000000', accent: '#000000', gap: 5 },
  exec_navy:   { ats: false, layout: 'single', font: 'Calibri', size: 10.5, head: '#14284b', accent: '#14284b', band: '#14284b', bandText: '#ffffff', sub: '#9fc3ff', gap: 9 },
  side_navy:   { ats: false, layout: 'side',   font: 'Calibri', size: 10.5, head: '#14284b', accent: '#14284b', side: '#14284b', sideText: '#ffffff', sideMuted: '#b9c8e6', gap: 9 },
  side_teal:   { ats: false, layout: 'side',   font: 'Calibri', size: 10.5, head: '#0f766e', accent: '#0f766e', side: '#e6f2f1', sideText: '#17323a', sideMuted: '#4b6b70', gap: 9 },
  site_bold:   { ats: false, layout: 'single', font: 'Arial',   size: 10,   head: '#2b2f36', accent: '#d97a00', band: '#2b2f36', bandText: '#ffffff', sub: '#ffb347', gap: 9 }
};
