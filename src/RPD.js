/**
 * Создание файлов РПД. В действительности функция не принимает никаких аргументов, а инициализирует переменные с аналогичными названиями.
 * @param templatesFolder - Папка контентных шаблонов.
 * @param disciplineSheet - Файл "Выгрузка  дисциплин из УП".
 * @param disciplineSheet.values[].row.year
 * @param parameterSpreadsheet - Файл "Параметры для создания РПД"
 * @param parameterSpreadsheet.competencies
 * @see getRPDCompetencies
 * @see helpers.js
 * @param parameterSpreadsheet.prerequisitesValues
 * @see getPrerequisitesValues
 * @see helpers.js
 */
function createRPD() {

    /**
     * папка контентных шаблонов
     * теперь определяется по-новому (динамически подгружается из управляющей таблицы, а не захардкожена)
     */
    var templatesFolder = getCurrentTemplatesFolder()
    /****************************************************************************************************** */


    /** RPD folder */
    var RPD_main_folder = DriveApp.getFolderById(RPD_MAIN_FOLDER_ID)
    var RPD_work_directory = createNewFolderInside(RPD_main_folder)

  // имена файлов контентных шаблонов
  var templateNames = getTemplateNames(templatesFolder);

  // файл "Выгрузка дисциплин из УП"
  var disciplineSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Дисциплины');
  // значения таблицы "Выгрузка  дисциплин из УП"
  var values = disciplineSheet.getRange('A2:AJ' + disciplineSheet.getLastRow()).getValues();

  // файл "Параметры для создания РПД"
  var parameterSpreadsheet = SpreadsheetApp.openById('1qO5RDdykeb0KjvlXeqNqNt3ZRAPlCTo0j0ClrXYkec0');
  // получаем данные компетенций
  var competencies = getRPDCompetencies(parameterSpreadsheet);
  // берем данные из файла "Параметры для создания РПД"
  var variations = getVariations(parameterSpreadsheet);
  // собираем данные о пререквизитах
  var prerequisitesValues = getPrerequisitesValues(parameterSpreadsheet);
  // получаем инфу о профессиональной области дисциплин
  var profs = getProfs(parameterSpreadsheet);


  // берем инфу о соответствии названий дисциплин и id контентных шаблонов
  // работает с каким-то своим файлом
  var connectValues = getConnectValues();

  // берем данные о дисциплинах из файла "Литература для дисциплин"
  var extraData = getExtraData();

  // дополнительные данные о дисциплинах
  var description = getDescription();


  var connect, id, name, docName, templateName;
  var files, year, doc, docBody, prerequisites;


  // пробегаемся по каждой строке файла всех дисциплин
  values.forEach(function(row, inx) {
    // работаем с дисциплинами cо значением 1 в столбце "Создать РПД"
    if (toStr(row[33]) === '1') {
      id = row[35];

      // если для дисциплины указан id контентного шаблона, то создаем РПД
      if (id) {
        name = !isEmpty(row[9]) ? row[9] : row[8];
        docName = row[0] + '_' + name;
        year = row[0].split('.')[0];
        // находим имя соответствующего дисциплине контентного шаблона
        templateName = getTemplateName(templateNames, id);

        if (templateName) {
          files = templatesFolder.getFilesByName(templateName);
          doc = files.next().makeCopy(docName, getFolder(RPD_work_directory, year, row[1], row[3]));
          docBody = DocumentApp.openById(doc.getId()).getBody();
          // получаем данные о пререквизитах
          prerequisites = getPrerequisites(values, inx, prerequisitesValues[id], connectValues);
          // наполняем данными файл контентного шаблона
          processDoc(docBody, row, competencies, extraData[id], variations, prerequisites, profs, description[id], id);
        } else {
          throw 'Не найден контентный шаблон для дисциплины ' + name + ' с id ' + id;
        }
      }
    }
  });
}


/**
 *
 */
function processDoc(doc, values, competencies, extraData, variations, prerequisites, profs, desc, id) {
  var nameEng = toStr(values[9]);
  var zExamInfo = toStr(values[30]);
  var hasExtramural = zExamInfo == '';
  var courseCode = toStr(values[1]);
  var compInx = getCompInx(courseCode);
  var disciplineCode = toStr(values[6]);
  var exam = getSemesters(values[11], false);
  var aMark = toStr(values[26]) || '90';
  var bMark = toStr(values[27]) || '80';
  var cMark = toStr(values[28]) || '70';
  var dMark = toStr(values[29]) || '0';

  var lengthInZet = Number(values[12]);
  var lengthInAch = Number(values[13]);
  var lectures = Number(values[14]);
  var practics = Number(values[15]);
  var control = Number(values[17]);
  var self = Number(values[16]);
  var contactHours = lectures + practics;

  var competenciesString = values[25];
  var competenciesArr = competenciesString.split('; ');

  // создаем соотношения компетенции - формы обучения - разделы дисциплины
  var competenciesFormsParts = getCompetenciesFormsParts(competenciesArr, extraData.forms.split('; '), extraData.parts, id);
  var competenciesNames = setCompetencies(doc, competenciesArr, competencies[compInx], competenciesFormsParts.competencies, id);

  doc.replaceText('{course_description_1}', desc.desc1);
  doc.replaceText('{course_description_2}', desc.desc2);
  doc.replaceText('{subject_area}', desc.subject);
  doc.replaceText('{course_objectives}', desc.objects);
  doc.replaceText('{z_year}', values[32]);
  doc.replaceText('{main_books}', prerequisites.mainBooks);
  doc.replaceText('{extra_books}', prerequisites.extraBooks);
  doc.replaceText('{discipline_code}', disciplineCode);
  doc.replaceText('{discipline_name}', values[7].trim());
  doc.replaceText('{name_in_russian}', values[8].trim());

  if (nameEng) {
    doc.replaceText('{name_in_english}', nameEng);
  } else {
    doc.replaceText(' / {name_in_english}', '');
  }

  doc.replaceText('{year}', values[0].split('.')[0]);
  doc.replaceText('{type_of_student}', getType(values[1]));
  doc.replaceText('{course_code}', courseCode);
  doc.replaceText('{course_name}', values[3].trim());
  doc.replaceText('{language}', 'английский');
  doc.replaceText('{exam}', exam);
  doc.replaceText('{length_in_zet}', lengthInZet);
  doc.replaceText('{length_in_ach}', lengthInAch);
  doc.replaceText('{lectures}', lectures);
  doc.replaceText('{practics}', practics);
  doc.replaceText('{control}', control);
  doc.replaceText('{self}', self);
  doc.replaceText('{form}', values[10].trim());
  doc.replaceText('{course_actions}', removeCapitals(removeDot(values[5].trim())));
  doc.replaceText('{variation_flag}', variations[getVariationInx(disciplineCode)]);
  doc.replaceText('{study_year}', getStudyYear(exam));
  doc.replaceText('{v_vo}', getPreposition(exam));
  doc.replaceText('{length_in_zet_with_words}', lengthInZet + getCreditName(lengthInZet));
  doc.replaceText('{length_in_ach_with_words}', lengthInAch + getAcademName(lengthInAch));
  doc.replaceText('{contact_hours_with_words}', contactHours + getAcademName(contactHours));
  doc.replaceText('{competitences_in_marks}', competenciesNames.join(', '));
  doc.replaceText('{prof_branch}', profs[compInx]);

  doc.replaceText('{excellent_mark}', aMark + ' - 100 баллов');
  doc.replaceText('{good_mark}', bMark + ' - ' + (aMark - 1) + ' баллов');
  doc.replaceText('{bad_mark}', cMark + ' - ' + (bMark - 1) + ' баллов');
  doc.replaceText('{lowest_mark}', dMark + ' - ' + (cMark - 1) + ' баллов');


  // TODO: behavior needs to be modified
  // 0. Сохранить поведение по умолчанию
  // 1. Ячейка N пустая – тогда надо подставить фразу "Содержание дисциплины..." и вставить содержимое ячеек O и P | уточнить насчёт фразы
  //    - Судя по всему, надо просто вставить содержимое одной из ячеек, не вставляя дополнительных фраз?
  // 2. Все три ячейки – затирать шаблон | уточнить!

  // Old behavior
  // doc.replaceText('{prerequisites}', 'Содержание дисциплины (модуля) является логическим продолжением ' + prerequisites.data);

  // C этим подходом есть такая проблема: а что, если я неправильно понял предыдущую версию скрипта, и что-то где-то сломается?
  // Надо _неинвазивно_ прилепить новое поведение.
  //    // Пусть теперь вся строка формируется в getPrerequisites()
  //    doc.replaceText('{prerequisites}', prerequisites.stringToWrite)

  // Что же в итоге
  if(prerequisites.thisIsASpecialCase === true){
      // My behvaior
      Logger.log(prerequisites.stringToWrite)
      doc.replaceText('{prerequisites}', prerequisites.stringToWrite);
  } else {
      // Old behavior
      doc.replaceText('{prerequisites}', 'Содержание дисциплины (модуля) является логическим продолжением ' + prerequisites.data + '.');
  }

  // проставляем данные заочки
  if (hasExtramural) {
    var zLengthInZet = Number(values[19]);
    var zLengthInAch = Number(values[20]);
    var zLectures = Number(values[21]);
    var zPractics = Number(values[22]);
    var zControl = Number(values[24]);
    var zSelf = Number(values[23]);
    var zContactHours = zLectures + zPractics;

    doc.replaceText('{z_exam}', getSemesters(values[18], true));
    doc.replaceText('{z_l_in_zet}', zLengthInZet);
    doc.replaceText('{z_l_in_ach}', zLengthInAch);
    doc.replaceText('{z_l}', zLectures);
    doc.replaceText('{z_p}', zPractics);
    doc.replaceText('{z_c}', values[24]);
    doc.replaceText('{z_s}', values[23]);
    doc.replaceText('{z_form}', values[10]);
    doc.replaceText('{z_att}', 2);
    doc.replaceText('{z_exam_info}', 'При заочной форме осваивается во время ' + values[18] + ' года обучения. ');
    doc.replaceText('{z_l_in_zet_with_words}', zLengthInZet + getCreditName(zLengthInZet));
    doc.replaceText('{z_l_in_ach_with_words}', zLengthInAch + getAcademName(zLengthInAch));
    doc.replaceText('{z_contact_hours_with_words}', zContactHours + getAcademName(zContactHours));
  } else {
    doc.replaceText('{z_exam}', '-');
    doc.replaceText('{z_l_in_zet}', '-');
    doc.replaceText('{z_l_in_ach}', '-');
    doc.replaceText('{z_l}', '-');
    doc.replaceText('{z_p}', '-');
    doc.replaceText('{z_c}', '-');
    doc.replaceText('{z_s}', '-');
    doc.replaceText('{z_att}', '-');
    doc.replaceText('{z_form}', '-');
    doc.replaceText('{z_l_in_zet_with_words}, {z_l_in_ach_with_words}; объем контактной работы –  {z_contact_hours_with_words}.', 'не предполагается');
  }

  if (zExamInfo == 'заочки в учебном плане нет') {
    doc.replaceText('{z_exam_info}', '');
  }

  // записываем данные об академических часах
  var tables = doc.getTables();
  var hours = extraData.hours.split(',');
  var hoursNumber = hours.length;
  var i, table, hour;
  var control1 = control - 2;
  var zControl1 = zControl - 2;
  var pLectures = [], pPractics = [], pControl = [], pSelf = [];
  var zpLectures = [], zpPractics = [], zpControl = [], zpSelf = [];

  for (i = 0; i < tables.length; i++) {
    table = tables[i];

    if (table.getText().indexOf('p1_lectures') !== -1) {
      var j, lastInx = hoursNumber - 1, isFirst = true;

      for (j = 0; j < lastInx; j++) {
        hour = Number(hours[j]);
        pLectures.push(Math.round(lectures * hour));
        pPractics.push(Math.round(practics * hour));
        pControl.push(Math.round((control1) * hour));
        pSelf.push(Math.round(self * hour));
        table.replaceText('{p' + (j + 1) + '_lectures}', pLectures[j]);
        table.replaceText('{p' + (j + 1) + '_practics}', pPractics[j]);
        table.replaceText('{p' + (j + 1) + '_control}', pControl[j]);
        table.replaceText('{p' + (j + 1) + '_self}', pSelf[j]);

        if (hasExtramural) {
          if (zLectures < hoursNumber) {
            if (isFirst) {
              zpLectures.push(0);
            } else if (getSum(zpLectures) < zLectures) {
              zpLectures.push(1);
            } else {
              zpLectures.push(0);
            }
          } else {
            zpLectures.push(Math.round(zLectures * hour));
          }

          if (zPractics < hoursNumber) {
            if (isFirst) {
              zpPractics.push(0);
            } else if (getSum(zpPractics) < zPractics) {
              zpPractics.push(1);
            } else {
              zpPractics.push(0);
            }
          } else {
            zpPractics.push(Math.round(zPractics * hour));
          }

          if (zControl1 < hoursNumber) {
            if (isFirst) {
              zpControl.push(0);
            } else if (getSum(zpControl) < zControl1) {
              zpControl.push(1);
            } else {
              zpControl.push(0);
            }
          } else {
            zpControl.push(Math.round(zControl1 * hour));
          }

          if (zSelf < hoursNumber) {
            if (isFirst) {
              zpSelf.push(0);
            } else if (getSum(zpSelf) < zSelf) {
              zpSelf.push(1);
            } else {
              zpSelf.push(0);
            }
          } else {
            zpSelf.push(Math.round(zSelf * hour));
          }

          table.replaceText('{z' + (j + 1) + '_l}', zpLectures[j]);
          table.replaceText('{z' + (j + 1) + '_p}', zpPractics[j]);
          table.replaceText('{z' + (j + 1) + '_c}', zpControl[j]);
          table.replaceText('{z' + (j + 1) + '_s}', zpSelf[j]);
        } else {
          table.replaceText('{z' + (j + 1) + '_l}', '-');
          table.replaceText('{z' + (j + 1) + '_p}', '-');
          table.replaceText('{z' + (j + 1) + '_c}', '-');
          table.replaceText('{z' + (j + 1) + '_s}', '-');
        }
        isFirst = false;
      }


      table.replaceText('{p' + hoursNumber + '_lectures}', lectures - getSum(pLectures));
      table.replaceText('{p' + hoursNumber + '_practics}', practics - getSum(pPractics));
      table.replaceText('{p' + hoursNumber + '_control}', control1 - getSum(pControl));
      table.replaceText('{p' + hoursNumber + '_self}', self - getSum(pSelf));

      if (hasExtramural) {
        table.replaceText('{z' + hoursNumber + '_l}', zLectures - getSum(zpLectures));
        table.replaceText('{z' + hoursNumber + '_p}', zPractics - getSum(zpPractics));
        table.replaceText('{z' + hoursNumber + '_c}', zControl1 - getSum(zpControl));
        table.replaceText('{z' + hoursNumber + '_s}', zSelf - getSum(zpSelf));
      } else {
        table.replaceText('{z' + hoursNumber + '_l}', '-');
        table.replaceText('{z' + hoursNumber + '_p}', '-');
        table.replaceText('{z' + hoursNumber + '_c}', '-');
        table.replaceText('{z' + hoursNumber + '_s}', '-');
      }

      break;
    }
  }

  for (var k = 0; k < hoursNumber; k++) {
    doc.replaceText('{p' + (k + 1) + '_competitences}', competenciesFormsParts.parts[k].join('; '));
  }
}


/**
 * Открывает папку с результатами выгрузки,
 * затем проследует в папку с годом, затем, видимо, идут код дисциплины и название...
 * самой дисциплины? группы контентных шаблонов?
 * Если надо, то ещё и создаёт всё по дороге.
 *
 * Кажется, если хочется сделать безопасную копию, в которой можно развлекаться,
 * достаточно просто указать альтернативную папку с итоговыми результатами
 *
 * Похоже, эта функция используется только в данном файле. Мб стоит сделать класс и оформить функцию как приватный метод.
 *
 * @param rpdFolderId
 * @param {*} year
 * @param {*} dir1
 * @param {*} dir2
 */
function getFolder(rpdFolder, year, dir1, dir2) {
    /** Old behavior */
    // var rpdFolderId = RPD_MAIN_FOLDER_ID;
    // var rpdFolder = DriveApp.getFolderById(rpdFolderId)

  var yearFolder = rpdFolder.getFoldersByName(year);

  var folder1 = yearFolder.hasNext() ? yearFolder.next() : rpdFolder.createFolder(year);
  var dir1Folder = folder1.getFoldersByName(dir1);

  var folder2 = dir1Folder.hasNext() ? dir1Folder.next() : folder1.createFolder(dir1);
  var dir2Folder = folder2.getFoldersByName(dir2);

  return dir2Folder.hasNext() ? dir2Folder.next() : folder2.createFolder(dir2);
}

function getCompetenciesFormsParts(competencies, forms, partsStr, id) {
  var formsNumber = forms.length;
  var competenciesForms = [], partsCompetencies = [];
  var formsSorted, formsCount = [], formsConjunction = [];

  forms.forEach(function(form, inx) {
    formsCount[inx] = {
      count: 0,
      name: form,
      originalInx: inx
    }
  });

  var parts = partsStr.split('.\n').map(function(part, inx) {
    var partForms = part.split('~ ')[1].split('; ');
    var formInx, result = new Array(formsNumber);
    partsCompetencies[inx] = [];

    for (var i = 0; i < partForms.length; i++) {
      formInx = forms.indexOf(partForms[i]);
      formsCount[formInx].count++;
      result[formInx] = true;
    }

    return result;
  });

  forms.forEach(function(form, inx) {
    var part;

    for (var i = 0; i < parts.length; i++) {
      part = parts[i];

      if (part[inx]) {
        formsConjunction[inx] = getConjunction(formsConjunction[inx], part);
      }
    }
  });

  var formsSorted = formsCount.sort(function(a, b) {
    return b.count - a.count;
  });

  competencies.forEach(function(comp, inx) {
    var formInx = formsSorted[inx % formsNumber].originalInx;
    competenciesForms[inx] = formsConjunction[formInx].reduce(function(result, current, inx) {
      current && result.push(forms[inx]);
      return result;
    }, []);

    for (var i = 0; i < parts.length; i++) {
      if (parts[i][formInx]) {
        partsCompetencies[i].push(comp);
      }
    }
  });

  return {
    parts: partsCompetencies,
    competencies: competenciesForms
  };
}

function setCompetencies(doc, competencies, compInfo, forms, id) {
  var compNumber = competencies.length;
  var remainNumber = 22 - compNumber;
  var competenceName;
  var competenciesNames = [];
  var tables = doc.getTables();
  var i, j, table;

  for (i = 0; i < tables.length; i++) {
    table = tables[i];

    if (table.getText().indexOf('k1_code') !== -1) {
      var rowNumber = table.getNumRows(),
          rowInx = rowNumber - 1,
          deletedRowNumber = 0,
          code;

      for (j = 0; j < compNumber; j++) {
        code = competencies[j].trim();
        table.replaceText('{k' + (j + 1) + '_code}', code);

        if (compInfo[code]) {
          table.replaceText('{k' + (j + 1) + '_name}', compInfo[code].name);
          table.replaceText('{k' + (j + 1) + '_results}', compInfo[code].results);
        }

        table.replaceText('{k' + (j + 1) + '_methods}', forms[j].join('; '));
        competenceName = getCompetenceName(code);

        if (competenciesNames.indexOf(competenceName) === -1) {
          competenciesNames.push(competenceName);
        }
      }

      while(deletedRowNumber < remainNumber) {
        if (table.getRow(rowInx).getText().indexOf('{k' + (22 - deletedRowNumber) + '_code}') !== -1) {
          deletedRowNumber++;
          table.removeRow(rowInx)
        }

        rowInx--;
      }

      break;
    }
  }

  return competenciesNames;
}