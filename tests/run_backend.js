'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const { install, E } = require('./gas_mock');
const dir = path.join(__dirname, '..', 'backend');

function load(opts) {
  const { g } = install(opts);
  const ctx = vm.createContext(g);
  // Apps Script shares one global scope across files; const/let are visible to later files.
  const src = ['Config.gs', 'Content.gs', 'Main.gs', 'Cv.gs'].map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n;\n') +
    '\n;globalThis.__api = { CFG, SERVICES, STYLES, CONTENT, doPost, doGet, setup, testCv, testSubmit, sampleOrder_, pastTense_, contentFor_, normalizeCv_, findRole_, summaryFor_, coverTextFor_, certsOrdered_, handleSubmit_ };';
  vm.runInContext(src, ctx, { filename: 'backend.gs' });
  // point config at the mock root folder (fld1)
  ctx.__api.CFG.ROOT_FOLDER_ID = 'fld1';
  return ctx.__api;
}
module.exports = { load, E };
