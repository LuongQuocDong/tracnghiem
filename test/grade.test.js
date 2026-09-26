const test = require('node:test');
const assert = require('node:assert/strict');
const { scoreMcq } = require('../lib/grade');

test('scores submitted choices against the stored bank, ignoring a claimed score', () => {
  const bank = { questions: [
    { id: 'q1', options: ['A', 'B', 'C', 'D'], answer: 1 },
    { id: 'q2', options: ['A2', 'B2', 'C2', 'D2'], answer: 3 },
  ] };
  assert.deepEqual(scoreMcq(bank, [
    { id: 'q1', choice: 'B' },
    { id: 'q2', choice: 'A2' },
  ]), { correct: 1, total: 2 });
});

test('rejects duplicate and unknown question IDs', () => {
  const bank = { questions: [{ id: 'q1', options: ['A', 'B', 'C', 'D'], answer: 0 }] };
  assert.throws(() => scoreMcq(bank, [{ id: 'q1', choice: 'A' }, { id: 'q1', choice: 'A' }]));
  assert.throws(() => scoreMcq(bank, [{ id: 'missing', choice: 'A' }]));
});
