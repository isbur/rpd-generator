/**
 * @file Ни много ни мало основной файл
 */

/**
 * Добавляем к результатирующий таблице пункт меню "Скрипты"
 * с подменю "Сделать выгрузку", "Создать контентные шаблоны" и "Создать РПД"
 * при нажатии на которые запускаются соответствующие функции
 * "getDisciplines", "createTemplates", "createRPD"
 * @see getDisciplines
 * @see disciplines.js (this file)
 * @see createTemplates
 * @see templates.js
 * @see createRPD
 * @see RPD.js
 */
function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.addMenu('Скрипты', [
    {name: 'Сделать выгрузку', functionName: 'getDisciplines'},
    {name: 'Создать контентные шаблоны', functionName: 'createTemplates'},
    {name: 'Создать РПД', functionName: 'createRPD'}
  ]);
}

/**
 * Cоздание списка дисциплин из УП
 * Хотя непонятно, чего я ожидал, производя поиск здесь - ошибка-то DriveApp вываливается при запуске генерации контентных файлов... Facepalm.
 *
 * Fake parameters (интересуют в первую очередь файлы, в которые производится запись):
 * @param {Sheet} sheet - лист "Дисциплины" книги, из которой запускается скрипт. Собственно, здесь активно производится чтение-запись.
 * @param {String[]} plansIds - id файлов с учебными планами, по которым создаются... Как оказалось, добавляются строки в активный лист, с которым, вроде бы, проблем нет.
 *
 * @param {String} titleSheetId - id файла "Данные из титульных листов"
 */
function getDisciplines() {
  // файл "Выгрузка  дисциплин из УП"
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Дисциплины');

  // id файла "Данные из титульных листов"
  var titleSheetId = '1CGpDIgqJ-sSDw7tNj1D2uwJETYkGNTHnMtpyXZLVNFc';

  // сохраняем информацию столбца "Создать РПД"
  var rpdData = getRpdData(sheet);

  // очищаем результатирующую таблицу от старых данных
  clearData(sheet);

  // составляем список очных УП необходимых для обработки
  var plansIds = getPlansIds();

  // берем данные сопоставления очки заочке
  var connectOZ = getConnectOZ();

  // считываем кодировки для направлений и направленностей
  // codes[0] - кодировки направления, codes[1] - кодировки направленности
  var codes = getCodes(titleSheetId);

  // берем данные титула дисциплин
  var titles = getTitles(titleSheetId);

  // берем данные разбалловки
  var marks = getMarks();

  // берем инфу о соответствии названий дисциплин и id контентных шаблонов
  var connect = getConnectValues();

  // составляем таблицу для каждого очного уп и соответствуюшего ей заочного уп
  plansIds.forEach(function(sheetIdO) {
    // создаем таблицу для очного УП
    var table = createDisciplineTableO(sheetIdO, titles, codes, rpdData);
    var sheetIdZ = connectOZ[sheetIdO];

    // если у очного УП есть заочка, то добавляем данные по заочке
    if (sheetIdZ) {
      createDisciplineTableZ(sheetIdZ, table);
    }

    setTable(table, sheet, marks, connect, sheetIdO);
  });
}


function createDisciplineTableO(sheetId, titles, codes, rpdData) {
  var sheet = SpreadsheetApp.openById(sheetId).getSheetByName('План');
  var values = sheet.getRange(3, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  var inx = 0, j = 0, table = [];
  var currentBlock;

  // берем заголовки и удаляем их из таблицы
  var header = values[0];
  values.shift();

  values.forEach(function(row, i) {
    var block, name, blockIsTrue, disciplineIsTrue;
    var index, code1, code2, title, title0, title1, title2, title3, title5, title6,
        id, form, lecture, practice, competencies;

    block = isBlock(row[0]) ? row[0] : currentBlock;
    blockIsTrue = block && isBlockTrue(block);
    name = toStr(row[2]);
    disciplineIsTrue = isDisciplineTrue(name);

    if (blockIsTrue && disciplineIsTrue) {
      index = toStr(row[1]);
      title = titles[sheetId];
      title0 = title ? toStr(title[0]) : '';
      title1 = title ? toStr(title[2]) : '';
      title2 = title ? toStr(title[3]) : '';
      title3 = title ? toStr(title[4]) : '';
      title5 = title ? toStr(title[5]) : '';
      title6 = title ? toStr(title[6]) : '';
      code1 = title1 ? codes[0][title1] : '';
      code2 = title2 ? codes[1][title2] : '';

      id = title0 + '.' + code1 + '.' + code2 + '.' + inxToString(++inx);
      form = getCertificationForm(row);
      lecture = getLecture(row, header) || '';
      practice = getPractice(row, header) || '';
      competencies = getCompetencies(row, header);

      table[j++] = [id, title1, title2, title3, title5, title6, index,
                    name, getRussianName(name), getEnglishName(name), form[0], form[1],
                    row[6], row[9], lecture, practice, row[12], row[13],
                   '-', '-', '-', '-', '-', '-', '-', competencies,
                    '', '', '', '', '1', '', '-',
                    rpdData[title1 + title2 + title3 + index + name] || '', sheetId, ''];
    }

    currentBlock = block;
  });

  return table;
}

function createDisciplineTableZ(sheetId, table) {
  var sheet = SpreadsheetApp.openById(sheetId).getSheetByName('План');
  var values = sheet.getRange(3, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  var header = values[0];
  var currentBlock;

  values.shift();
  values.forEach(function(row, i) {
    var block, blockIsTrue, disciplineIsTrue;
    var name, id, inx, form, lecture, practice, competencies;

    block = isBlock(row[0]) ? row[0] : currentBlock;
    blockIsTrue = block && isBlockTrue(block);
    id = row[1];
    name = row[2].trim();
    disciplineIsTrue = isDisciplineTrue(name);

    if (blockIsTrue && disciplineIsTrue) {
      inx = name ? findDisciplineInx(id, name, table) : -1;

      if (inx >= 0) {
        form = getCertificationForm(row);
        lecture = getLecture(row, header) || '';
        practice = getPractice(row, header) || '';
        table[inx].splice(18, 7, form[1], row[6], row[9], lecture, practice, row[12], row[13]);
        table[inx][30] = '';
        table[inx][32] = 'При заочной форме осваивается во время ' + form[1] + ' курса обучения.';
      } else {
        Logger.log('Дисциплина "' + name + '" с id ' + id + 'найдена в заочке, но не найдена в очке УП ' + sheetId);
      }
    }

    currentBlock = block;
  });

  return table;
}

function setTable(table, sheet, marks, connectValues, sheetId) {
  table.forEach(function(row) {
    var name = toStr(row[7]);
    var rus = toStr(row[8]);
    var eng = toStr(row[9]);
    var marksRow = findMarks(marks, rus, eng);
    var id = getConnectId(toStr(name).split('/'), rus, eng, connectValues);
    var errors = [];

    if (!marksRow) {
      errors.push('Не найдена разбалловка');
    } else {
      row[26] = marksRow[1];
      row[27] = marksRow[2];
      row[28] = marksRow[3];
      row[29] = marksRow[4];
    }

    if (id === null) {
      errors.push('Не найдена дисциплина в файле соответствия');
    } else {
      row[35] = id;
    }

    row[31] = errors.join('; ');
  });

  sheet.getRange(sheet.getLastRow() + 1, 1, table.length, 36).setValues(table);
}