'use strict';

const publicMethods = new Set([
  'allBanks', 'getBank', 'allFillBanks', 'getFillBank', 'fillSubjects',
  'battalions', 'companies', 'classes', 'studentsIn',
  'history', 'addHistory', 'clearHistory', 'hasSample',
  'uniqueId', 'uniqueFillId', 'parseQuestions', 'parseFillQuestions',
  'parseRoster', 'autoBlank', 'slugify', 'exportTxt', 'exportFillTxt',
  'exportRosterTxt', 'rosterTemplate', 'fillTemplate', 'authStatus',
  'loginAdmin', 'logoutAdmin',
]);

const adminMethods = new Set([
  'upsertBank', 'removeBank', 'restoreSample', 'seedSamples',
  'upsertFillBank', 'removeFillBank',
  'allStudents', 'upsertStudent', 'removeStudent', 'importStudents',
  'exportAll', 'importAll',
]);

function canUseMethod(method, isAdmin) {
  return publicMethods.has(method) || (isAdmin && adminMethods.has(method));
}

module.exports = { canUseMethod };
