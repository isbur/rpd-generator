/**
 * Создание контеных шаблонов
 *
 * Fake params (интересуют в первую очередь файлы, в которые производится запись):
 * @param {Folder} newTemplatesFolder - папка, в которой хранятся сгенерированные контентные шаблоны.
 * Полагаю, проблема с DriveApp в том, что происходит удаление и генерирование заново всех файлов...
 * Workaround – создавать папки сызнова у пользователя, который запускает скрипт?
 * Ну и тогда неплохо бы иметь что-то типа CleanUp, который позволит в конце сессии подчистить всё нагенерированное.
 * @see https://developers.google.com/apps-script/reference/drive/file.html#setTrashed(Boolean) - ещё один пруф
 * > Sets whether the File is in the trash of the user's Drive.
 * > ***Only the owner may trash the File.***
 * > The default for new Files is false.
 * Кстати, в таком случае мой тест ничего бы не дал – я ведь был бы хозяином своего файла.
 */
function createTemplates() {
  // файл-шаблон РПД
  var template = DriveApp.getFileById('10BziNwk_IniVfaTWQ8oeEW-6g7TEbQLehR5i7TD3_z4');

  // файлы контента дисциплин
  var files = DriveApp.getFolderById('1VS89z-O7CwRakdlKn-Tx4ZYNmfprQxEP').getFiles();

  // файл "Литература для дисциплин"
  var booksSheet = SpreadsheetApp.openById('1qms0QwsDHIHC7HaKZVMO7WFklin0sXkU_HCmUhuXnGo').getSheetByName('Sheet1');


  /**
   * Old behavior *************************************************************************
   *
   * // папка  с готовыми контентными шаблонами
   * var newTemplatesFolder = DriveApp.getFolderById('19vzun-cZz9ogk5yY9e54aoIIFtOMHN9o');
   *
   * // очищаем папку от старых файлов
   * deleteFiles(newTemplatesFolder);
   *
   ***************************************************************************************/


   /**
    * New behavior ***********************************************************************
    */
    var templatesMainFolder = DriveApp.getFolderById(CONTENT_TEMPLATES_MAIN_TEST_FOLDER_ID)
    var newTemplatesFolder = createNewFolderInside(templatesMainFolder)

    // And save new id to control spreadsheet
    var controlSpreadsheet = SpreadsheetApp.openById(CONTROL_SPREADSHEET_ID)
    var controlSheet = controlSpreadsheet.getSheetByName("Content Templates Folder")
    controlSheet.getRange("A1").setValue(newTemplatesFolder.getId())

    /*********************************************************************************** */


  // связываем id дисциплины и индекс строки файла "Литература для дисциплин"
  var booksRowInxs = getBooksRowInxs(booksSheet);

  // собираем id искомых дисциплин
  var ids = getRpdIds();

  var file, spreadsheet, name, id, newDocName, newDoc, docBody, partsData, rowInx;

  // проходим по всем файлам контента дисциплин
  while (files.hasNext()) {
    file = files.next();
    name = file.getName().split('.');
    id = name[0];

    // для каждой дисциплины из списка искомых создаем контентный шаблон
    if (ids.indexOf(id) !== -1) {
      rowInx = booksRowInxs[id];

      if (rowInx > 0) {
        spreadsheet = SpreadsheetApp.open(file);
        newDocName = 'CD_' + id + '_' + name[1];
        newDoc = template.makeCopy(newDocName, newTemplatesFolder);
        docBody = DocumentApp.openById(newDoc.getId()).getBody();
        getCharacteristic(spreadsheet, docBody);
        partsData = getPartitionData(spreadsheet, docBody);

        // сохраняем промежуточные данные, необходимые для создания РПД
        booksSheet.getRange(rowInx, 7, 1, 3).setValues([partsData]);
      } else {
        throw 'Дисциплина ' + name[1] + ' не найдена в файле "Литература для дисциплин"';
      }
    }
  }
}

function getBooksRowInxs(sheet) {
  var values = sheet.getRange('A2:A' + sheet.getLastRow()).getValues();
  var rowInx = {};

  values.forEach(function(row, inx) {
    rowInx[idToString(row[0])] = inx + 2;
  });

  return rowInx;
}

function getRpdIds() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Дисциплины');
  var values = sheet.getRange('AH2' + ':AJ' + sheet.getLastRow()).getValues();
  var ids = [];

  // составляем список id дисциплин cо значением 1 в столбце "Создать РПД"
  values.forEach(function(row) {
    if (toStr(row[0]) == '1') {
      ids.push(idToString(row[2]));
    }
  });

  return ids;
}

function getCharacteristic(spreadsheet, docBody) {
  var sheet = spreadsheet.getSheetByName('Характеристики дисциплины');
  var values = sheet.getRange(4, 2, 36, 4).getValues();

  var subject_branch = strToOneLine(fixString(values[0][0]));
  var specific_topics = strToOneLine(fixString(values[4][0]));
  var course_goal = strToOneLine(fixString(values[9][0]));
  var remember_results = fixString(values[19][0]);
  var understand_results = fixString(values[23][0]);
  var apply_results = fixString(values[27][0]);
  var practics_points = fixString(values[33][3]) || getPoints(50);
  var control_points = fixString(values[34][3]) || getPoints(30);
  var exam_points = fixString(values[35][3]) || getPoints(20);

  docBody.replaceText('{subject_branch}', removeCapitals(removeDot(subject_branch)));
  docBody.replaceText('{specific_topics}', removeCapitals(removeDot(specific_topics)));
  docBody.replaceText('{course_goal}', removeCapitals(addDot(course_goal)));
  docBody.replaceText('{remember_results}', addDot(setSemicolons(removeCapitals(remember_results))));
  docBody.replaceText('{understand_results}', addDot(setSemicolons(removeCapitals(understand_results))));
  docBody.replaceText('{apply_results}', addDot(setSemicolons(removeCapitals(apply_results))));
  docBody.replaceText('{practics_points}', practics_points);
  docBody.replaceText('{control_points}', control_points);
  docBody.replaceText('{exam_points}', exam_points);
}

function getPartitionData(spreadsheet, docBody) {
  var sheet = spreadsheet.getSheetByName('Разделы курса'),
      parts = [], partition_data = [], i, name, hours, hoursSum,
      values = sheet.getRange(5, 3, 7, 2).getValues();

  for (i = 0; i < 7; i ++) {
    name = strToOneLine(fixString(values[i][0]));
    hours = fixString(values[i][1]);

    if (isEmpty(name)) {
      break;
    } else {
      parts.push(name);
      hours && partition_data.push(Number(hours));
    }
  }

  var partsNumber = parts.length;
  var remainPartsNumber = 7 - partsNumber;

  docBody.getTables().forEach(function(table) {
    if (table.getText().indexOf('p1_name') !== -1) {
      var rowNumber = table.getNumRows(),
          rowInx = rowNumber - 1,
          deletedRowNumber = 0;

      for (var j = 0; j < partsNumber; j++) {
        table.replaceText('{p' + (j + 1) + '_name}', parts[j]);
      }

      while(deletedRowNumber < remainPartsNumber) {
        if (table.getRow(rowInx).getText().indexOf('{p' + (7 - deletedRowNumber) + '_name}') !== -1) {
          deletedRowNumber++;
          table.removeRow(rowInx)
        }

        rowInx--;
      }
    }
  });

  var partitionData = processPartitionData(spreadsheet, docBody, parts);
  var result = [,partitionData.forms, partitionData.parts];

  if (partition_data && partition_data.length) {
    hoursSum = partition_data.reduce(function(sum, hours) {
      return sum + hours;
    }, 0);
    result[0] = partition_data.map(function(hours) {
      return Math.round(hours * 100 / hoursSum) / 100;
    }).join(',');
  } else {
    result[0] = 'часы не заданы';
  }

  return result;
}

function processPartitionData(spreadsheet, docBody, parts) {
  var partControlForms = new Array([], [], [], [], [], [], []),
      controlFormsSet = [], j, controlFormParts = [], formName,
      controlFormsSetLowerCase = [],
      partControlFormsStr = '';

  parts.forEach(function(part, inx) {
    var sheet = spreadsheet.getSheetByName('Раздел ' + (inx + 1)),
        values = sheet.getRange(5, 2, 33, 1).getValues(),
        topics = fixString(values[0][0]),
        controlData = fixString(values[16][0]),
        practicsData = fixString(values[24][0]),
        controlQuestions = fixString(values[32][0]);

    var controlForms = sheet.getRange('B10:D17').getValues(),
        form, i, name;

    for (i = 0; i < 8; i++) {
      form = controlForms[i];
      name = form[0];

      if (form[2] == 1) {
        partControlForms[inx].push(name);

        if (controlFormsSet.indexOf(name) === -1) {
          controlFormsSet.push(name);
        }
      }
    }

    docBody.replaceText('{p' + (inx + 1) + '_control_forms}', partControlForms[inx].join(';\n'));
    docBody.replaceText('{p' + (inx + 1) + '_topics}', topics);
    docBody.replaceText('{p' + (inx + 1) + '_control_data}', controlData);
    docBody.replaceText('{p' + (inx + 1) + '_practics_data}', practicsData);
    docBody.replaceText('{p' + (inx + 1) + '_control_questions}', controlQuestions);
    partControlFormsStr += part + '~ ' + partControlForms[inx].join('; ') + '.\n';
  });

  for (j = 0; j < controlFormsSet.length; j++) {
    formName = controlFormsSet[j];
    controlFormParts.push((j + 1) + '. ' + formName + ': ' + getParts(parts, partControlForms, formName));
    controlFormsSetLowerCase.push(removeCapitals(controlFormsSet[j]));
  }

  docBody.replaceText('{control_forms_list}', controlFormsSetLowerCase.join(', '));
  docBody.replaceText('{control_forms}', controlFormParts.join(';\n') + '.');

  return {
    forms: controlFormsSet.join('; '),
    parts: partControlFormsStr.replace(/.\n$/, '')
  };
}

function getParts(parts, partForms, formName) {
  var result = [];

  partForms.forEach(function(forms, inx) {
    if (forms.indexOf(formName) !== -1) {
      result.push(parts[inx]);
    }
  });

  return result.join(', ');
}