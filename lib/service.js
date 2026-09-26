'use strict';

const core = require('./quiz-core');
const { scoreMcq } = require('./grade');
const sampleBanks = require('../seed/banks.json');
const fillSampleBanks = require('../seed/fill-banks.json');

const HUES = ['#6C7DFF', '#22D3EE', '#B57BFF', '#F59E0B', '#34D399', '#FB7185'];
const clean = (doc) => doc && (({ _id, ...rest }) => rest)(doc);
const unique = (items) => [...new Set(items.filter(Boolean))];
const nonempty = (value, max = 200) => String(value || '').trim().slice(0, max);

function normalizeBank(input, fill = false) {
  if (!input || typeof input !== 'object' || !Array.isArray(input.questions) || input.questions.length > 5000) {
    throw new Error('Ngân hàng đề không hợp lệ.');
  }
  const name = nonempty(input.name);
  const id = nonempty(input.id || core.slugify(name), 100);
  if (!name || !id || !/^[a-z0-9-]+$/.test(id)) throw new Error('Tên hoặc mã đề không hợp lệ.');
  const now = Date.now();
  const questions = input.questions.map((q) => {
    const text = nonempty(q.text, 5000);
    if (!text) throw new Error('Câu hỏi không được để trống.');
    if (fill) {
      const blanks = Array.isArray(q.blanks) ? q.blanks.map((x) => nonempty(x, 500)).filter(Boolean) : [];
      const auto = q.auto === undefined ? !blanks.length : Boolean(q.auto);
      if (!auto && !blanks.length) throw new Error('Câu điền chỗ trống thiếu đáp án.');
      return { id: nonempty(q.id || core.newId('f'), 80), text, blanks: auto ? [] : blanks, auto };
    }
    const options = Array.isArray(q.options) ? q.options.map((x) => nonempty(x, 2000)) : [];
    if (options.length !== 4 || options.some((x) => !x) || !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) {
      throw new Error('Mỗi câu trắc nghiệm cần 4 lựa chọn và 1 đáp án đúng.');
    }
    return { id: nonempty(q.id || core.newId(), 80), text, options, answer: q.answer };
  });
  return {
    id, name, source: input.source === 'sample' ? 'sample' : 'import',
    subject: fill ? nonempty(input.subject || 'Chung') : undefined,
    color: /^#[0-9a-f]{6}$/i.test(input.color || '') ? input.color : HUES[id.length % HUES.length],
    createdAt: Number(input.createdAt) || now, updatedAt: now, questions,
  };
}

async function uniqueId(collection, base) {
  const root = nonempty(base, 90) || 'de-thi';
  let result = root;
  for (let i = 2; await collection.findOne({ _id: result }, { projection: { _id: 1 } }); i += 1) result = `${root}-${i}`;
  return result;
}

async function callService(db, method, args, context) {
  const banks = db.collection('banks');
  const fills = db.collection('fill_banks');
  const students = db.collection('students');
  const history = db.collection('history');
  const a = args || [];
  switch (method) {
    case 'allBanks': return (await banks.find({}).sort({ name: 1 }).toArray()).map(clean);
    case 'getBank': return clean(await banks.findOne({ _id: a[0] }));
    case 'upsertBank': {
      const bank = normalizeBank(a[0]);
      await banks.replaceOne({ _id: bank.id }, { _id: bank.id, ...bank }, { upsert: true });
      return bank;
    }
    case 'removeBank': return (await banks.deleteOne({ _id: a[0] })).deletedCount;
    case 'uniqueId': return uniqueId(banks, a[0]);
    case 'seedSamples': {
      let added = 0;
      for (const sample of sampleBanks) {
        const bank = normalizeBank({ ...sample, source: 'sample' });
        const result = await banks.updateOne({ _id: bank.id }, { $setOnInsert: { _id: bank.id, ...bank } }, { upsert: true });
        added += result.upsertedCount;
      }
      for (const sample of fillSampleBanks) {
        const bank = normalizeBank({ ...sample, source: 'sample' }, true);
        const result = await fills.updateOne({ _id: bank.id }, { $setOnInsert: { _id: bank.id, ...bank } }, { upsert: true });
        added += result.upsertedCount;
      }
      return { added, issues: [] };
    }
    case 'hasSample': return Boolean(sampleBanks.find((b) => b.id === a[0]));
    case 'restoreSample': {
      const sample = sampleBanks.find((b) => b.id === a[0]);
      if (!sample) return null;
      const bank = normalizeBank({ ...sample, source: 'sample' });
      await banks.replaceOne({ _id: bank.id }, { _id: bank.id, ...bank }, { upsert: true });
      return bank;
    }
    case 'allFillBanks': return (await fills.find({}).sort({ name: 1 }).toArray()).map(clean);
    case 'getFillBank': return clean(await fills.findOne({ _id: a[0] }));
    case 'upsertFillBank': {
      const bank = normalizeBank(a[0], true);
      await fills.replaceOne({ _id: bank.id }, { _id: bank.id, ...bank }, { upsert: true });
      return bank;
    }
    case 'removeFillBank': return (await fills.deleteOne({ _id: a[0] })).deletedCount;
    case 'uniqueFillId': return uniqueId(fills, a[0]);
    case 'fillSubjects': return unique(await fills.distinct('subject'));
    case 'allStudents': return (await students.find({}).sort({ name: 1 }).toArray()).map(clean);
    case 'upsertStudent': {
      const s = a[0] || {};
      const doc = { id: nonempty(s.id || core.newId('s'), 80), name: nonempty(s.name), battalion: nonempty(s.battalion), company: nonempty(s.company), className: nonempty(s.className) };
      if (Object.values(doc).some((v) => !v)) throw new Error('Thông tin học viên chưa đầy đủ.');
      await students.replaceOne({ _id: doc.id }, { _id: doc.id, ...doc }, { upsert: true });
      return doc;
    }
    case 'removeStudent': return (await students.deleteOne({ _id: a[0] })).deletedCount;
    case 'importStudents': {
      if (!Array.isArray(a[0]) || a[0].length > 10000) throw new Error('Danh sách học viên không hợp lệ.');
      let added = 0;
      for (const s of a[0]) {
        const filter = { battalion: nonempty(s.battalion), company: nonempty(s.company), className: nonempty(s.className), name: nonempty(s.name) };
        if (Object.values(filter).some((v) => !v)) continue;
        if (!(await students.findOne(filter))) {
          const id = nonempty(s.id || core.newId('s'), 80);
          await students.insertOne({ _id: id, id, ...filter });
          added += 1;
        }
      }
      return added;
    }
    case 'battalions': return unique(await students.distinct('battalion'));
    case 'companies': return unique(await students.distinct('company', { battalion: a[0] }));
    case 'classes': return unique(await students.distinct('className', { battalion: a[0], company: a[1] }));
    case 'studentsIn': return (await students.find({ battalion: a[0], company: a[1], className: a[2] }).sort({ name: 1 }).toArray()).map(clean);
    case 'history': return (await history.find(context.isAdmin ? {} : { visitorId: context.visitorId }).sort({ at: -1 }).limit(5000).toArray()).map(clean);
    case 'addHistory': {
      const e = a[0] || {};
      const fill = e.mode === 'fill';
      const bank = await (fill ? fills : banks).findOne({ _id: e.bankId });
      if (!bank) throw new Error('Không tìm thấy đề thi.');
      let score;
      if (fill) {
        const total = Number(e.total), correct = Number(e.correct);
        if (!Number.isInteger(total) || !Number.isInteger(correct) || total < 1 || total > bank.questions.length || correct < 0 || correct > total) throw new Error('Kết quả không hợp lệ.');
        score = { total, correct };
      } else score = scoreMcq(bank, e.responses);
      const doc = {
        visitorId: context.visitorId, bankId: bank.id, bankName: bank.name,
        mode: ['stage', 'personal', 'fill'].includes(e.mode) ? e.mode : 'personal',
        studentName: nonempty(e.studentName), studentId: nonempty(e.studentId, 80),
        battalion: nonempty(e.battalion), company: nonempty(e.company), className: nonempty(e.className),
        total: score.total, correct: score.correct,
        seconds: Math.max(0, Math.min(86400, Number(e.seconds) || 0)), at: Date.now(),
      };
      if (!doc.studentName) throw new Error('Vui lòng nhập tên trước khi nộp bài.');
      await history.insertOne(doc);
      return { correct: doc.correct, total: doc.total, at: doc.at };
    }
    case 'clearHistory': return (await history.deleteMany(context.isAdmin ? {} : { visitorId: context.visitorId })).deletedCount;
    case 'exportAll': return JSON.stringify({ kind: 'tracnghiem-backup', version: 1, exportedAt: Date.now(), banks: await callService(db, 'allBanks', [], context), fillBanks: await callService(db, 'allFillBanks', [], context), roster: await callService(db, 'allStudents', [], context), history: await callService(db, 'history', [], context) });
    case 'importAll': {
      let data;
      try { data = JSON.parse(a[0]); } catch { return { ok: false, error: 'File không phải JSON hợp lệ.' }; }
      if (data.kind !== 'tracnghiem-backup') return { ok: false, error: 'File không phải dữ liệu TracNghiem.' };
      const result = { ok: true, banksAdded: 0, fillAdded: 0, studentsAdded: 0, historyAdded: 0 };
      for (const bank of (data.banks || []).slice(0, 100)) { await callService(db, 'upsertBank', [bank], context); result.banksAdded += 1; }
      for (const bank of (data.fillBanks || []).slice(0, 100)) { await callService(db, 'upsertFillBank', [bank], context); result.fillAdded += 1; }
      if (Array.isArray(data.roster)) result.studentsAdded = await callService(db, 'importStudents', [data.roster], context);
      if (Array.isArray(data.history)) {
        for (const entry of data.history.slice(0, 10000)) {
          if (!entry || typeof entry !== 'object' || !entry.bankId || !entry.studentName || !Number.isFinite(Number(entry.at))) continue;
          const filter = { bankId: nonempty(entry.bankId, 100), studentName: nonempty(entry.studentName), at: Number(entry.at) };
          if (!(await history.findOne(filter, { projection: { _id: 1 } }))) {
            const { _id, ...safeEntry } = entry;
            await history.insertOne({ ...safeEntry, ...filter, visitorId: context.visitorId });
            result.historyAdded += 1;
          }
        }
      }
      return result;
    }
    case 'parseQuestions': return core.parseQuestions(a[0]);
    case 'parseFillQuestions': return core.parseFillQuestions(a[0]);
    case 'parseRoster': return core.parseRoster(a[0]);
    case 'autoBlank': return core.autoBlank(a[0]);
    case 'slugify': return core.slugify(a[0]);
    case 'exportTxt': return core.exportTxt(a[0]);
    case 'exportFillTxt': return core.exportFillTxt(a[0]);
    case 'exportRosterTxt': return core.exportRosterTxt(a[0]);
    case 'rosterTemplate': return core.ROSTER_TEMPLATE;
    case 'fillTemplate': return core.FILL_TEMPLATE;
    default: throw new Error('Phương thức không được hỗ trợ.');
  }
}

module.exports = { callService, normalizeBank };
