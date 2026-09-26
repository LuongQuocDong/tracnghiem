'use strict';

require('dotenv').config({ path: '.env.local' });
const assert = require('node:assert/strict');

const cookies = new Map();
async function rpc(method, ...args) {
  const response = await fetch('http://localhost:3000/api/rpc', {
    method: 'POST', headers: { 'content-type': 'application/json', cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; ') },
    body: JSON.stringify({ method, args }),
  });
  for (const cookie of response.headers.getSetCookie()) {
    const [name, value] = cookie.split(';')[0].split('=');
    cookies.set(name, value);
  }
  return { status: response.status, body: await response.json() };
}

async function main() {
  assert.equal((await rpc('authStatus')).body.result.admin, false);
  const banks = (await rpc('allBanks')).body.result;
  assert.ok(banks.length >= 1);
  assert.ok((await rpc('allFillBanks')).body.result.length >= 1);
  assert.equal((await rpc('upsertBank', banks[0])).status, 403);
  const q = banks[0].questions[0];
  const saved = await rpc('addHistory', {
    bankId: banks[0].id, mode: 'personal', studentName: 'Kiểm thử hệ thống',
    responses: [{ id: q.id, choice: q.options[q.answer] }], seconds: 1,
  });
  assert.equal(saved.body.result.correct, 1);
  assert.equal((await rpc('history')).body.result.length, 1);
  assert.equal((await rpc('clearHistory')).body.result, 1);
  assert.equal((await rpc('history')).body.result.length, 0);
  if (process.env.ADMIN_PASSWORD) {
    assert.equal((await rpc('loginAdmin', process.env.ADMIN_PASSWORD)).body.result.admin, true);
    assert.equal((await rpc('allStudents')).status, 200);
    assert.equal((await rpc('logoutAdmin')).body.result.admin, false);
  }
  console.log('API smoke check passed: banks, authorization, scoring, private history, admin login.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
