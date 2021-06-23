// добавляем к результатирующий таблице пункт меню "Скрипты"
// с подменю "Сделать выгрузку", "Создать контентные шаблоны" и "Создать РПД" 
// при нажатии на которые запускаются соответствующие функции
// "getDisciplines", "createTemplates", "createRPD"
function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();  
  ss.addMenu('Скрипты', [
    {name: 'Сделать выгрузку', functionName: 'getDisciplines'},    
    {name: 'Создать контентные шаблоны', functionName: 'createTemplates'},
    {name: 'Создать РПД', functionName: 'createRPD'},
    {name: 'Сделать выгрузку ТЕСТ', functionName: 'getDisciplinesTest'},
    {name: 'Создать контентные шаблоны ТЕСТ', functionName: 'createTemplatesTest'},
    {name: 'Создать РПД ТЕСТ', functionName: 'createRPDTest'},
  ]);
}

function getDisciplinesTest() {
  getDisciplines(true);
}

// создание списка дисциплин из уп
function getDisciplines(isTest) {
  // файл "Выгрузка  дисциплин из УП"
  var sheetName = isTest ? 'Дисциплины ТЕСТ' : 'Дисциплины';
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  
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
        id, rusName, form, semesters, semValues, lecture, practice, competencies;
    var hasBothForms, isEnglish;
    
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
      hasBothForms = disciplineHasBothForms(name.toLowerCase(), row);
      isEnglish = name.toLowerCase() === 'иностранный язык';
      semesters = form[1];
      lecture = getLecture(row, header) || '';
      practice = getPractice(row, header) || '';
      competencies = getCompetencies(row, header);
      rusName = getRussianName(name);
      
      table[j++] = [id, title1, title2, title3, title5, title6, index,
                    name, rusName, getEnglishName(name), form[0], semesters,
                    row[6], row[9], lecture, practice, row[12], row[13],
                   '-', '-', '-', '-', '-', '-', '-', competencies,
                    '', '', '', '', '1', '', '-',
                    rpdData[title1 + title2 + title3 + index + name] || '', sheetId, ''];
                    
      if (isEnglish || hasBothForms) {
        if (hasBothForms) {
          semValues = [semesters, form[3]];
         } else {
          semValues = splitSemesters(semesters);
        }
    
        table[j-1].splice(11, 7, semValues[0], row[6]/2, row[9]/2, lecture/2, practice/2, row[12]/2, row[13]/2);
        table[j++] = [id, title1, title2, title3, title5, title6, index,
                    name, rusName, getEnglishName(name), form[2] || form[0], semValues[1],
                    row[6]/2, row[9]/2, lecture/2, practice/2, row[12]/2, row[13]/2,
                   '-', '-', '-', '-', '-', '-', '-', competencies,
                    '', '', '', '', '1', '', '-',
                    rpdData[title1 + title2 + title3 + index + name] || '', sheetId, ''];
      }
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
    var name, id, inx, form, semesters, semValues, lecture, practice, competencies;
    var hasBothForms, isEnglish;
    
    block = isBlock(row[0]) ? row[0] : currentBlock;
    blockIsTrue = block && isBlockTrue(block);
    id = row[1];
    name = toStr(row[2]);
    disciplineIsTrue = isDisciplineTrue(name);
    
    if (blockIsTrue && disciplineIsTrue) {
      inx = name ? findDisciplineInx(id, name, table) : -1;
      
      if (inx >= 0) {
        form = getCertificationForm(row);
        hasBothForms = (inx + 1 < table.length) && table[inx][0] === table[inx + 1][0];
        isEnglish = name.toLowerCase() === 'иностранный язык';
        semesters = form[1];
        lecture = getLecture(row, header) || '';
        practice = getPractice(row, header) || '';
        
        if (isEnglish || hasBothForms) {
          if (form[3]) {
            semValues = [semesters, form[3]];
          } else {
            semValues = splitSemesters(semesters);
          }
 
          table[inx].splice(18, 7, semValues[0], row[6]/2, row[9]/2, lecture/2, practice/2, row[12]/2, row[13]/2);
          table[inx][30] = '';
          table[inx][32] = 'При заочной форме осваивается во время ' + semValues[0] + ' курса обучения.';
          table[inx + 1].splice(18, 7, semValues[1], row[6]/2, row[9]/2, lecture/2, practice/2, row[12]/2, row[13]/2);
          table[inx + 1][30] = '';
          table[inx + 1][32] = 'При заочной форме осваивается во время ' + semValues[1] + ' курса обучения.';
        } else {
          table[inx].splice(18, 7, semesters, row[6], row[9], lecture, practice, row[12], row[13]);
          table[inx][30] = '';
          table[inx][32] = 'При заочной форме осваивается во время ' + semesters + ' курса обучения.';
        }
      } else {
        Logger.log('Дисциплина "' + name + '" с id ' + id + 'найдена в заочке, но не найдена в очке УП ' + sheetId);
      }
    }
    
    currentBlock = block;
  });
  
  return table;
}

function setTable(table, sheet, marks, connectValues, sheetId) {
  table.forEach(function(row, inx) {
    var name = toStr(row[7]);
    var rus = toStr(row[8]).toLowerCase();
    var eng = toStr(row[9]).toLowerCase();
    var marksRow = findMarks(marks, rus, eng);
    var id = getConnectId(toStr(name).split('/'), rus, eng, connectValues);
    var errors = [];
    var hasBothForms;
    var prevRow = table[inx - 1];
    
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
      hasBothForms = inx > 0 && row[0] === table[inx - 1][0];
      
      if (hasBothForms) {
        if (parseInt(row[11]) >= parseInt(prevRow[11])) {
          row[35] = id + 'д';
        } else {
          row[35] = id;
          table[inx - 1][35] = id + 'д';
        }  
      } else {
        row[35] = id;
      }    
    }
    
    row[31] = errors.join('; ');
  });

  sheet.getRange(sheet.getLastRow() + 1, 1, table.length, 36).setValues(table);
}