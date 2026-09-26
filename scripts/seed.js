'use strict';

require('dotenv').config({ path: '.env.local' });
const { database } = require('../lib/mongo');
const { normalizeBank } = require('../lib/service');
const samples = require('../seed/banks.json');
const fillSamples = require('../seed/fill-banks.json');

async function main() {
  const db = await database();
  const collection = db.collection('banks');
  let added = 0;
  for (const sample of samples) {
    const bank = normalizeBank({ ...sample, source: 'sample' });
    const result = await collection.updateOne({ _id: bank.id }, { $setOnInsert: { _id: bank.id, ...bank } }, { upsert: true });
    if (result.upsertedCount) added += 1;
  }
  const fillCollection = db.collection('fill_banks');
  let fillAdded = 0;
  for (const sample of fillSamples) {
    const bank = normalizeBank({ ...sample, source: 'sample' }, true);
    const result = await fillCollection.updateOne({ _id: bank.id }, { $setOnInsert: { _id: bank.id, ...bank } }, { upsert: true });
    if (result.upsertedCount) fillAdded += 1;
  }
  await db.collection('history').createIndex({ visitorId: 1, at: -1 });
  await db.collection('history').createIndex({ at: -1 });
  console.log(`Đã thêm ${added} môn trắc nghiệm và ${fillAdded} bộ điền chỗ trống.`);
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(`Không thể nạp đề mẫu: ${error.message}`);
  process.exit(1);
});
