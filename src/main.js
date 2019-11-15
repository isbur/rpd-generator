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
    {name: 'Создать контентные шаблоны', functionName: 'createTemplatesManually'},
    {name: 'Создать РПД по столбцу "Создать РПД"', functionName: 'createRPDManually'},
    {name: 'Создать все РПД (потребуется много времени на выполнение)', functionName: 'launchGenerationProcess'}
  ]);
}


/**
 * Manual creation of content templates is still required!
 */
function createRPDManually(){
    // файл "Выгрузка дисциплин из УП"
    var disciplineSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Дисциплины');
    // значения таблицы "Выгрузка  дисциплин из УП"
    var values = disciplineSheet.getRange('A2:AJ' + disciplineSheet.getLastRow()).getValues();
    var requiredDisciplineSheetIndices = []
    values.forEach(
        function(row, inx) {
            if (toStr(row[33]) === '1') {
                requiredDisciplineSheetIndices.push(inx)
            }
        }
    )
    createRPDWith(requiredDisciplineSheetIndices)
}


/**
 * 1. Set up a trigger
 * 2. ???
 *      * Trigger must check itself whether job is finished
 */
function launchGenerationProcess() {
    ScriptApp.newTrigger("generationProcessStep")
        .timeBased()
        .everyMinutes(1)
        .create()
}


/**
 *    // 1. Open control sheet
 *
 *   * (optional) check whether another script is still working
 *
 *   ****
 *
 *   // 3. Use it as an index to generate both template and RPD
 *
 *   * (optional) dont't generate content template if it is already generated
 *
 *   * (optional) generate more RPD at once
 */
function generationProcessStep() {
    var controlSpreadsheet = SpreadsheetApp.openById(CONTROL_SPREADSHEET_ID)
    // var templatesControlSheet = controlSpreadsheet.getSheetByName("Прогресс генерации контентных шаблонов")
    var RPDControlSheet = controlSpreadsheet.getSheetByName("Прогресс генерации РПД")

    var lastDisciplineIndex = RPDControlSheet.getRange("A1").getValue()
    if (lastDisciplineIndex == "") {
        lastDisciplineIndex = 0
    } else {
        lastDisciplineIndex = parseInt(lastDisciplineIndex) + 1
    }

    
    creatTemplateWith(requiredId)
    createRPDWith(lastDisciplineIndex)

}


/**
 * Manual creation of content templates is required!
 */
function testRPDCreation(){
    createRPDWith([0])
}