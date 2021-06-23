// этот файл содержит вспомогательные функции

function clearData(sheet) {
  var lastRow = sheet.getLastRow();

  lastRow > 2 && sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
}

function getConnectValues() {
  var connectSheetId = '11Q2M2dEQSTJYxmCsjOfIEIjrmn_CxBwub9evfd2ZE2Y';
  var connectSheet = SpreadsheetApp.openById(connectSheetId).getSheetByName('Sheet1');
  var values = connectSheet.getRange('A2:C' + connectSheet.getLastRow()).getValues();

  return values;
}

function getPlansIds() {
  var sheetId = '1Pca7e5-ofXMyTQYqumZXI0qRJd2JPQy6ZWxTn5OCpOc';
  var sheet = SpreadsheetApp.openById(sheetId).getSheetByName('Study plans');
  var values = sheet.getRange('A2:J' + sheet.getLastRow()).getValues();
  var plansIds = [];

  values.forEach(function(row) {
    if (!isEmpty(row[9]) && row[9] == '1') {
      plansIds.push(row[0]);
    }
  });

  return plansIds;
}

function getRpdData(sheet) {
  var values = sheet.getRange('B2:AH' + sheet.getLastRow()).getValues();
  var row, rpd, data = {};

  for (var i = 0; i < values.length; i++) {
    row = values[i];
    rpd = toStr(row[32]);

    if (rpd === '1') {
      data[toStr(row[0]) + toStr(row[1]) + toStr(row[2]) + toStr(row[5])+ toStr(row[6])] = rpd;
    }
  }

  return data;
}

function getConnectOZ() {
  var sheetId = '1SKMYOqxEEkjEmYXOF1pmEcmiJvS3KU292klAbxoO2KA';
  var sheet = SpreadsheetApp.openById(sheetId).getSheetByName('Лист1');
  var values = sheet.getRange('F2:G' + sheet.getLastRow()).getValues();
  var i, connect = {};

  for (i = 0; i < values.length; i++) {
    connect[values[i][0]] = values[i][1];
  }

  return connect;
}

function getCodes(sheetId) {
  var sheet = SpreadsheetApp.openById(sheetId).getSheetByName('Кодировки для id');
  var codes = sheet.getRange('B3:F13').getValues();
  var codes1 = {}; // кодировки направления
  var codes2 = {}; //кодировки направленности

  codes.forEach(function(row) {
    if (!isEmpty(row[0])) {
      codes1[toStr(row[0])] = toStr(row[1]);
    }

    codes2[toStr(row[3])] = toStr(row[4]);
  });

  return [codes1, codes2];
}

function getTitles(sheetId) {
  var sheet = SpreadsheetApp.openById(sheetId).getSheetByName('Данные титула');
  var values = sheet.getRange('B2:L' + sheet.getLastRow()).getValues();
  var titles = {};

  values.forEach(function(row) {
    titles[toStr(row[10])] = row;
  });

  return titles;
}

function getConnectId(names, nameRus, nameEng, connectValues) {
  var name1 = toStr(names[0]).toLowerCase();
  var name2 = toStr(names[1]).toLowerCase();
  var nameEng1, nameRus1;
  var i, row, rus, eng, id, isRusEqual;
  var result = [null, null];

  if (/[а-яА-ЯЁё]/.test(name1)) {
    nameRus1 = name1;
  }
  if (/[a-zA-z]/.test(name1)) {
    nameEng1 = name1;
  }

  if (name2) {
    if (/[а-яА-ЯЁё]/.test(name2)) {
      nameRus1 = name2;
    }
    if (/[a-zA-z]/.test(name2)) {
      nameEng1 = name2;
    }
  }

  for (i = 0; i < connectValues.length; i++) {
    row = connectValues[i];
    rus = toStr(row[1]).toLowerCase();
    eng = toStr(row[2]).toLowerCase();
    id = toStr(row[0]);
    isRusEqual = false;

    if (nameRus1 === rus || nameRus === rus) {
      result[0] = id;
      isRusEqual = true;
    }

    if (nameEng1 && nameEng1 === eng || nameEng && nameEng === eng) {
      result[1] = id;
 
      if (isRusEqual) {
        return id;
      }
    }
  }

  return result[0] || result[1];
}

function disciplineHasBothForms(name, values) {
  const except = ['физическая культура и спорт', 'элективные курсы по физической культуре и спорту'];

  return except.indexOf(name) === -1 && !isEmpty(values[3]) && (!isEmpty(values[4]) || !isEmpty(values[5]));
}

function getMarks() {
  var sheetId = '1_wVF8Nj8hDSX1K8P6eRLhtmPfMYL1RyOMkE_T17y1iA';
  var sheet = SpreadsheetApp.openById(sheetId).getSheetByName('Sheet2');

  return sheet.getRange('C2:G' + sheet.getLastRow()).getValues();
}

function getLecture(row, header) {
  var inxs = [];

  header.forEach(function(value, inx) {
    if (value === 'Лек' || value === 'лек') {
      inxs.push(inx);
    }
  });

  return getInxsSum(row, inxs);
}

function getPractice(row, header) {
  var inxs = [];

  header.forEach(function(value, inx) {
    if (value === 'Пр' || value === 'пр') {
      inxs.push(inx);
    }
  });

  return getInxsSum(row, inxs);
}

function getCompetencies(row, header) {
  var i, value;

  for (var i = 0; i < header.length; i++) {
    value = header[i];

    if (value === 'Компетенции' || value === 'компетенции') {
      return row[i];
    }
  }
}

function getCertificationForm(values) {
  const result = [];

  if (!isEmpty(values[3])) {
    result.push('экзамен', setCommas(toStr(values[3])));
  }

  if (!isEmpty(values[4])) {
    result.push('зачет', setCommas(toStr(values[4])));
  }

  if (!isEmpty(values[5])) {
    result.push('зачет с оценкой', setCommas(toStr(values[5])));
  }

  return result;
}

function splitSemesters(semesters) {
  var splitted = semesters.split(', ');
  
  if (splitted.length === 2) {
    return splitted;
  } else {
    return [semesters, semesters];
  }
}

function isBlockTrue(value) {
  var isPractice = value.indexOf('рактик') > 0;
  var isCertification = value.indexOf('ттестация') > 0;
  var isResearch = value.indexOf('аучные исследования') > 0;

  return !isPractice && !isCertification && !isResearch;
}

function findMarks(marks, rus, eng) {
  var row, name, rusName, engName;
  var result = [null, null];

  for (var i = marks.length; i--;) {
    row = marks[i];
    name = row[0].trim();
    rusName = getRussianName(name).toLowerCase();
    engName = getEnglishName(name).toLowerCase();
    
    if (rusName == rus) {
      result[0] = row;
    }

    if (!isEmpty(eng) && engName == eng) {
      result[1] = row;
    }
  }
  
  return result[0] || result[1];
}

function getPoints(number) {
  var ending = 'ов';
  var remainder = number % 10;

  if ((number < 10 || number > 20) && (remainder == 2 || remainder == 3 || remainder == 4)) {
    ending = 'а';
  } else if ((number < 10 || number > 20) && remainder == 1) {
    ending = '';
  }

  return number + ' балл' + ending;
}

function getTemplateNames() {
  var templatesFolderId = '19vzun-cZz9ogk5yY9e54aoIIFtOMHN9o';
  var templatesFolder = DriveApp.getFolderById(templatesFolderId);
  var files = templatesFolder.getFiles();
  var names = [];

  while (files.hasNext()) {
    names.push(files.next().getName());
  }

  return names;
}

function getTemplateName(templateNames, id) {
  var templateName, i, name;
  var fullId = idToString(id);

  for (i = 0; i < templateNames.length; i++) {
    name = templateNames[i];

    if (name.indexOf(fullId) >= 0) {
      templateName = name;
      break;
    }
  }

  return templateName;
}

function deleteFiles(folder) {
  var files = folder.getFiles();

  while (files.hasNext()) {
    files.next().setTrashed(true);
  }
}

function getLanguage(name) {
  if (isSpeciaRussianDiscipline(name)) {
    return 'русский';
  } else {
    return 'английский';
  }
}

function getProf(name, profs) {
  if (isSpeciaRussianDiscipline(name)) {
    return '';
  } else {
    return ' и позволяет получить углубленные знания и навыки обучающимися для успешной профессиональной деятельности в области ' + profs;
  }
}

function isSpeciaRussianDiscipline(name) {
  var russianDisciplines = ['Физическая культура и спорт', 'Элективные курсы по физической культуре',
                            'Философия', 'История', 'Безопасность жизнедеятельности'];
  
  return russianDisciplines.indexOf(name) !== -1;
}


/**
 * Функция берёт первые три столбца каждого из листов с компетенциями
 * и собирает их в массив из трёх словарей. Судя по всему, функция
 * без проблем переживёт добавление новых компетенций: для определения
 * границ диапазона используются метод getLastRow() и свойство length
 * (в зависимости от ситуации).
 * @param {Spreadsheet} spreadSheet - Таблица с компетенциями.
 * @returns {Object[]} competencies - Массив из трёх словарей.
*/
function getRPDCompetencies(spreadSheet) {
  var sheet1 = spreadSheet.getSheetByName('Компетенции бакалавров');
  var sheet2 = spreadSheet.getSheetByName('Компетенции магистров');
  var sheet3 = spreadSheet.getSheetByName('Компетенции аспирантов');
  var values1 = sheet1.getRange('A2:C' + sheet1.getLastRow()).getValues();
  var values2 = sheet2.getRange('A2:C' + sheet2.getLastRow()).getValues();
  var values3 = sheet3.getRange('A2:C' + sheet3.getLastRow()).getValues();
  var competencies = [{}, {}, {}];
  var i, j, k, row1, row2, row3;

  for (i = 0; i < values1.length; i++) {
    row1 = values1[i];
    competencies[0][row1[1]] = {
      name: fixString(row1[0]),
      results: fixString(row1[2])
    };
  }

  for (j = 0; j < values2.length; j++) {
    row2 = values2[j];
    competencies[1][row2[1]] = {
      name: fixString(row2[0]),
      results: fixString(row2[2])
    };
  }

  for (k = 0; k < values3.length; k++) {
    row3 = values3[k];
    competencies[2][row3[1]] = {
      name: fixString(row3[0]),
      results: fixString(row3[2])
    };
  }

  return competencies;
}


function getExtraData() {
  var booksSheetID = '1qms0QwsDHIHC7HaKZVMO7WFklin0sXkU_HCmUhuXnGo';
  var booksSheet = SpreadsheetApp.openById(booksSheetID).getSheetByName('Sheet1');
  var values = booksSheet.getRange('A2:I' + booksSheet.getLastRow()).getValues();
  var i, row, data = {};

  for (i = 0; i < values.length; i++) {
    row = values[i];
    data[row[0]] = {
      hours: row[6],
      forms: row[7],
      parts: row[8]
    }
  }

  return data;
}


function getVariations(spreadSheet) {
  var sheet = spreadSheet.getSheetByName('Флаг вариативности');
  var values = sheet.getRange('B1:B4').getValues();
  var variations = [], i;

  for (i = 0; i < 4; i++) {
    variations.push(values[i][0]);
  }

  return variations;
}

function findDiscipline(values, nameRus, nameEng, planCode, code, semester) {
  var row, names, rus, eng, rusEng;
  var engNameIsTrue, nameIsTrue, planCodeIsTrue, codeIsTrue, semesterIsTrue;

  for (var i = 0; i < values.length; i++) {
    row = values[i];
    names = row[7].split(' / ');
    rus = toStr(row[8]);
    eng = toStr(row[9]);
    rusEng = toStr(row[7]);
    planCodeIsTrue = row[0].indexOf(planCode) === 0;
    codeIsTrue = toStr(row[1]).indexOf(code) === 0;
    semesterIsTrue = semester - toStr(row[11]).slice(-1) > 0;
    engNameIsTrue = nameEng && nameEng == eng || toStr(names[0]) && nameEng == toStr(names[0]) || names[1] && nameEng == toStr(names[1]);
    nameIsTrue = nameRus == rus || engNameIsTrue || nameRus == rusEng || nameEng == rusEng;

    if (nameIsTrue && planCodeIsTrue && codeIsTrue && semesterIsTrue) {
      return rus + (eng ? ' / ' + eng : '');
    }
  }
}


/**
 *
 * @param {Object[][]} values - преобразованное в массив содержимое таблицы "Выгрузка дисциплин из УП"
 * @param {Integer} inx - индекс дисциплины в values, обрабатываемой в данной итерации цикла в главной функции
 * @param {datum} prerequisites - элемент массива data, полученного от функции getPrerequisitesValue(), состоит из пяти полей
 * @param {*} connect
 *
 * @returns {datum++} prerequisites
 */
function getPrerequisites(values, inx, prerequisites, connect) {
  var idList = prerequisites.list;
  var value = values[inx];
  var planCode = value[0].slice(0, -4);
  var code = toStr(value[1]);
  var semester = toStr(value[11]).slice(-1);
  var discipline, row, result = [];
  var prefix = 'Содержание дисциплины (модуля) является логическим продолжением ';
  
  for (var i = 0; i < idList.length; i++) {    
    for (var j = 0; j < connect.length; j++) {
      row = connect[j];

      if (row[0] == idList[i]) {
        discipline = findDiscipline(values, row[1].trim(), row[2].trim(), planCode, code, semester);

        if (discipline) {
          result.push(discipline);
          break;
        }
      }
    }
  }

  if (result.length) {
    prerequisites.data = prefix + 'изучения дисциплин: ' + result.join(', ') + '.';
  } else {
    if (code == '09.03.01') {
      prerequisites.data = prerequisites.bachelor ? prefix + prerequisites.bachelor + '.' : '';
    } else {
      prerequisites.data = prerequisites.master ? prefix + prerequisites.master + '.' : '';
    }
  }

  return prerequisites;
}


/**
 * Просто выдирает нужный кусок с данными, основные преобразования производятся в getPrerequisites()
 * @see getPrerequisites()
 *
 * @param {Spreadsheet} spreadSheet
 * @see https://docs.google.com/spreadsheets/d/1qO5RDdykeb0KjvlXeqNqNt3ZRAPlCTo0j0ClrXYkec0/edit?usp=sharing - Файл "Параметры для создания РПД"
 *
 * @returns data[]
 */
function getPrerequisitesValues(spreadSheet) {
  var sheet = spreadSheet.getSheetByName('Параметры контентных файлов');
  var values = sheet.getRange('A2:P' + sheet.getLastRow()).getValues();
  var i, row, data = {};

  for (i = 0; i < values.length; i++) {
    row = values[i];
    data[row[0]] = {
      list: row[13].toString().split(', '), // N
      bachelor: strToOneLine(fixString(row[14])), // O
      master: strToOneLine(fixString(row[15])), // P
      mainBooks: fixString(row[3]),
      extraBooks: fixString(row[12])
    }
  }

  return data;
}


function getDescription() {
  var sheet = SpreadsheetApp.openById('1O-bEjNnFtJgFHlypgtU6rGNYGrLKVy5hSj6V9IK0sDQ').getSheetByName('Лист1');
  var values = sheet.getRange('A2:I' + sheet.getLastRow()).getValues();
  var i, row, data = {};

  for (i = 0; i < values.length; i++) {
    row = values[i];
    data[row[0]] = {
      desc1: row[3],
      desc2: row[4],
      subject: row[5],
      objects: row[6]
    };
  }

  return data;
}

function getProfs(spreadSheet) {
  var sheet = spreadSheet.getSheetByName('Профессиональная область');
  var values = sheet.getRange('B2:B4').getValues();
  var i, data = [];

  for (i = 0; i < values.length; i++) {
    data.push(values[i][0]);
  }

  return data;
}

function getCompInx(code) {
  var inx;

  if (code == '09.03.01' || code == '230100.62') {
    inx = 0;
  }

  if (code == '09.04.01') {
    inx = 1;
  }

  if (code == '09.06.01') {
    inx = 2;
  }

  if (inx == undefined) {
    throw 'Неизвестный код направления подготовки ' + code;
  }

  return inx;
}

function getSemesters(str, shouldRemoveDuplicates) {
  if (str.length > 1 && str.indexOf(',') === -1) {
    if (shouldRemoveDuplicates) {
      str = removeDuplicates(str);
    }

    str = str.split('').join(', ');
  }

  return str;
}

function getType(code) {
  var type;

  if (code == '09.03.01' || code == '230100.62') {
    type = 'бакалавр';
  }

  if (code == '09.04.01') {
    type = 'магистр';
  }

  if (code == '09.06.01') {
    type = 'аспирант';
  }

  if (!type) {
    Logger.log('Wrong type of student with code ' + code)
  }

  return type;
}

function getVariationInx(code) {
  if (code.indexOf('В.ДВ') !== -1) {
    return 2;
  } else if (code.indexOf('В') !== -1) {
    return 1;
  } else if (code.indexOf('Б') !== -1) {
    return 0;
  } else {
    return 3;
  }
}

function getStudyYear(year) {
  var str = toStr(year);
  var years = [];

  if (str.indexOf('1') !== -1 || str.indexOf('2') !== -1) {
    years.push('1');
  }

  if (str.indexOf('3') !== -1 || str.indexOf('4') !== -1) {
    years.push('2');
  }

  if (str.indexOf('5') !== -1 || str.indexOf('6') !== -1) {
    years.push('3');
  }

  if (str.indexOf('7') !== -1 || str.indexOf('8') !== -1) {
    years.push('4');
  }

  return years.join(', ');
}

function getPreposition(str) {
  var number = toStr(str).split(', ')[0];
  var preposition = 'в';

  if (number === '2') {
    preposition = 'во';
  }

  return preposition;
}

function getCreditName(number) {
  var name = 'зачетных единиц';
  var remainder = number % 10;

  if ((number < 10 || number > 20) && (remainder == 2 || remainder == 3 || remainder == 4)) {
    name = 'зачетных единицы';
  } else if ((number < 10 || number > 20) && remainder == 1) {
    name = 'зачетная единица';
  }

  return  ' ' + name;
}

function getAcademName(number) {
  var name = 'академических часов';
  var remainder = number % 10;

  if ((number < 10 || number > 20) && (remainder == 2 || remainder == 3 || remainder == 4)) {
    name = 'академических часа';
  } else if ((number < 10 || number > 20) && remainder == 1) {
    name = 'академический час';
  }

  return ' ' + name;
}

function getCompetenceName(code) {
  if (code.indexOf('ОК') === 0) {
    return 'общекультурные';
  }

  if (code.indexOf('ОПК') === 0) {
    return 'общепрофессиональные';
  }

  if (code.indexOf('ПК') === 0) {
    return 'профессиональные';
  }

  if (code.indexOf('УК') === 0) {
    return 'универсальные';
  }

  if (code.indexOf('ПСК') === 0) {
    return 'профессионально-специализированные';
  }
}