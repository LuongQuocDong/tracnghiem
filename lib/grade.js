'use strict';

function scoreMcq(bank, responses) {
  if (!bank || !Array.isArray(responses) || !responses.length || responses.length > 1000) {
    throw new Error('Bài làm không hợp lệ.');
  }
  const byId = new Map(bank.questions.map((q) => [q.id, q]));
  const seen = new Set();
  let correct = 0;
  for (const response of responses) {
    const q = byId.get(response.id);
    if (!q || seen.has(response.id) || typeof response.choice !== 'string') {
      throw new Error('Bài làm chứa câu hỏi không hợp lệ.');
    }
    seen.add(response.id);
    if (response.choice === q.options[q.answer]) correct += 1;
  }
  return { correct, total: responses.length };
}

module.exports = { scoreMcq };
