'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { callService } = require('../lib/service');

const db = { collection: () => ({}) };

test('generates blanks for a whole quiz in one service call', async () => {
  const texts = Array.from({ length: 30 }, (_, index) => `Tim khoe ${index}`);
  const result = await callService(db, 'autoBlanks', [texts], {});
  assert.equal(result.length, texts.length);
  result.forEach((item, index) => {
    assert.equal(typeof item.text, 'string');
    assert.ok(item.text.includes('___'));
    assert.ok(item.blanks.length >= 1);
    assert.notEqual(item.text, texts[index]);
  });
});

test('rejects an oversized blank generation batch', async () => {
  await assert.rejects(() => callService(db, 'autoBlanks', [Array(101).fill('Tim khoe')], {}), /không hợp lệ/);
});
