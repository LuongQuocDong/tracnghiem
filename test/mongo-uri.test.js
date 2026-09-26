'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { toStandardAtlasUri } = require('../lib/mongo-uri');

test('resolves Atlas SRV and TXT records over HTTPS into a standard URI', async () => {
  const calls = [];
  const lookup = async (name, type) => {
    calls.push({ name, type });
    if (type === 'SRV') return [
      { type: 33, data: '0 0 27017 node-00.pmtptfg.mongodb.net.' },
      { type: 33, data: '0 0 27017 node-01.pmtptfg.mongodb.net.' },
    ];
    return [{ type: 16, data: '"authSource=admin&replicaSet=atlas-test-shard-0"' }];
  };
  const uri = await toStandardAtlasUri(
    'mongodb+srv://user:p%40ss@tracnghiemapp.pmtptfg.mongodb.net/?appName=tracnghiemapp', lookup,
  );
  assert.equal(uri,
    'mongodb://user:p%40ss@node-00.pmtptfg.mongodb.net:27017,node-01.pmtptfg.mongodb.net:27017/?appName=tracnghiemapp&tls=true&authSource=admin&replicaSet=atlas-test-shard-0');
  assert.deepEqual(calls, [
    { name: '_mongodb._tcp.tracnghiemapp.pmtptfg.mongodb.net', type: 'SRV' },
    { name: 'tracnghiemapp.pmtptfg.mongodb.net', type: 'TXT' },
  ]);
});

test('rejects an SRV host outside the Atlas parent domain', async () => {
  const lookup = async (_name, type) => type === 'SRV'
    ? [{ type: 33, data: '0 0 27017 unexpected.example.com' }]
    : [];
  await assert.rejects(
    toStandardAtlasUri('mongodb+srv://user:pass@tracnghiemapp.pmtptfg.mongodb.net/', lookup),
    /SRV host không hợp lệ/,
  );
});
