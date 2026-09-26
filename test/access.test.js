const test = require('node:test');
const assert = require('node:assert/strict');
const { canUseMethod } = require('../lib/access');

test('students can read banks and save attempts but cannot edit shared data', () => {
  assert.equal(canUseMethod('allBanks', false), true);
  assert.equal(canUseMethod('listBanks', false), true);
  assert.equal(canUseMethod('listFillBanks', false), true);
  assert.equal(canUseMethod('homeSummary', false), true);
  assert.equal(canUseMethod('bootstrap', false), true);
  assert.equal(canUseMethod('autoBlanks', false), true);
  assert.equal(canUseMethod('addHistory', false), true);
  assert.equal(canUseMethod('upsertBank', false), false);
  assert.equal(canUseMethod('importAll', false), false);
  assert.equal(canUseMethod('allStudents', false), false);
  assert.equal(canUseMethod('unknownMethod', true), false);
});
