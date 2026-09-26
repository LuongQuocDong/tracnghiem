'use strict';

const publicMethods = new Set([
  'allBanks', 'listBanks', 'getBank', 'allFillBanks', 'listFillBanks', 'getFillBank', 'fillSubjects', 'homeSummary', 'bootstrap',
  'battalions', 'companies', 'classes', 'studentsIn',
  'history', 'addHistory', 'clearHistory', 'hasSample',
  'uniqueId', 'uniqueFillId', 'parseQuestions', 'parseFillQuestions',
  'parseRoster', 'autoBlank', 'autoBlanks', 'slugify', 'exportTxt', 'exportFillTxt',
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
