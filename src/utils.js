/**
 * @file этот файл содержит переиспользуемые функции,
 *  которые используются в других задачах
 *
 */


function toStr(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return value.toString().trim();
}

function isBlock(value) {
  if (isEmpty(value)) {
    return false;
  }

  var hasName = value.indexOf('Блок') === 0;
  var hasNumber = value[0] === 'Б' && /\d/.test(value[1]);
  var isElective = value.indexOf('акультативы') > 0 || value.indexOf('ФТД') > -1;

  return hasName || hasNumber || isElective;
}

function strToNum(str) {
  var number = Number(str);

  return isNaN(number) ? 0 : number;
}

function getInxsSum(row, inxs) {
  return inxs.reduce(function(sum, value) {
    return sum + strToNum(row[value]);
  }, 0);
}

function getSum(array) {
  return array.reduce(function(sum, value) {
    return sum + value;
  }, 0);
}

function inxToString(inx) {
  var str = toStr(inx);
  var zeroNumber = 3 - str.length;
  var i;

  for (i = 0; i < zeroNumber; i++) {
    str = '0' + str;
  }

  return str;
}

function findDisciplineInx(id, name, table) {
  var i, row;

  for (i = 0; i < table.length; i++) {
    row = table[i];

    if (row[6] == id
        || row[8] == getRussianName(name)
        || !isEmpty(row[9]) && row[9] == getEnglishName(name)) {
      return i;
    }
  }

  // возвращаем -1, если не нашли дисциплину
  return -1;
}

function getRussianName(name) {
  var names = name.split('/');
  var name1 = names[0].trim();
  var name2 = names[1] && names[1].trim();

  if (/[а-яА-ЯЁё]/.test(name1)) {
    return name1;
  }

  if (name2 && /[а-яА-ЯЁё]/.test(name2)) {
    return name2;
  }

  return '';
}

function getEnglishName(name) {
  var names = name.split('/');
  var name1 = names[0].trim();
  var name2 = names[1] && names[1].trim();

  if (/[a-zA-z]/.test(name1) && !/[а-яА-ЯЁё]/.test(name1)) {
    return name1;
  }

  if (name2 && /[a-zA-z]/.test(name2) && !/[а-яА-ЯЁё]/.test(name2)) {
    return name2;
  }

  return '';
}

function isDisciplineTrue(value) {
  return !isEmpty(value) && value.indexOf('исциплины по выбору') === -1;
}


function isEmpty(value) {
  return toStr(value).length === 0;
}

function setCommas(str) {
  var result = str;

  if (str.length > 1 && str.indexOf(',') === -1) {
    result = str.split('').join(', ');
  }

  return result;
}

function fixString(str) {
  var result = str.toString();

  result = result.replace(/\t/g, '');
  result = result.replace(/ +/g, ' ');
  result = result.replace(/\n+/gm, '\n');
  result = result.replace(/\r+/gm, '\r');
  result = result.replace(/(\r\n)+/g, '\r\n');
  result = result.replace(/\r\n/g, '\n');
  result = result.replace(/\n /g, '\n');
  result = result.replace(/ \n/g, '\n');

  return result.trim();
}

function strToOneLine(str) {
  return str.replace(/\n/g, ' ');
}

function idToString(id) {
  var str = toStr(id);
  var zeroNumber = 3 - str.length;
  var i;

  for (i = 0; i < zeroNumber; i++) {
    str = '0' + str;
  }

  return str;
}

function removeCapitals(str) {
  return str.replace(/^[А-ЯA-Z]/gm, function(char) {
    return char.toLowerCase();
  });
}

function removeDot(str) {
  return str.replace(/\.$/, "");
}

function addDot(str) {
  return str[str.length - 1] !== '.' ? str + '.' : str;
}

function setSemicolons(str) {
  var result = str.replace(/[^;]$/gm, '$&;');

  return result.slice(0, -1);
}

function getConjunction(arr1, arr2) {
  var result = [];

  if (arr1 === undefined) {
    return arr2;
  } else {
    for (var i = 0; i < arr1.length; i++) {
      result[i] = arr1[i] && arr2[i];
    }
  }

  return result;
}


/**
 * Создаёт новую папку в указанной по правилу "launch" + текущее время
 * @param {Folder} folder Внимательно! Нужна папка, а не id
 */
function createNewFolderInside(folder){
    var currentTime = new Date().toLocaleString()
    return folder.createFolder("launch " + currentTime)
}