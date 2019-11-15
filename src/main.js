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

    /** RPD folder */
    var RPD_main_folder = DriveApp.getFolderById(RPD_MAIN_FOLDER_ID)
    var RPD_work_directory = createNewFolderInside(RPD_main_folder)

    createRPD(RPD_work_directory, requiredDisciplineSheetIndices)
}


/**
 * 1. Set up a trigger
 * 2. ???
 *      * Trigger must check itself whether job is finished
 */
function launchGenerationProcess() {

    var controlSheet = SpreadsheetApp.openById(CONTROL_SPREADSHEET_ID).getSheetByName("Прогресс генерации РПД")
    var templatesFolder = getNewTemplatesFolder()
    var RPD_folder = getNewRPD_folder()
    controlSheet.getRange("A2:C2").setValues([0, templatesFolder.getId(), RPD_folder.getId()])

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

    RPDcontrolSheet = new RPDcontrolSheet()
    DisciplinesSheet = new DisciplinesSheet()


    var lastDisciplineIndex = RPDcontrolSheet.getLastDisciplineIndex()
    var newDisciplineIndex = lastDisciplineIndex + 1

    var templatesFolder = RPDcontrolSheet.getTemplatesFolder()
    var RPD_folder = RPDcontrolSheet.getRPD_folder()

    var contentTemplateId = DisciplinesSheet.getContentTemlpateId(newDisciplineIndex)
    if (check_whether_content_template_was_already_generated(contentTemplateId) === false) {
        createTemplates(templatesFolder, contentTemplateId)
    }
    createRPD(RPD_folder, lastDisciplineIndex + 1)

    this.check_whether_content_template_was_already_generated = function(){
        var fileIterator = templatesFolder.searchFiles(contentTemplateId)
        return fileIterator.hasNext()
    }
}


/**
 *
 */
function RPDcontrolSheet () {

    var controlSheet = SpreadsheetApp.openById(CONTROL_SPREADSHEET_ID).getSheetByName("Прогресс генерации РПД")

    /**
     *
     */
    this.getLastDisciplineIndex = function () {
        var lastDisciplineIndex = getDatumFromCell("A2")
        if (lastDisciplineIndex == "") {
            throw "lastDisciplineIndex cell is empty!"
        } else {
            lastDisciplineIndex = parseInt(lastDisciplineIndex) + 1
        }
        return lastDisciplineIndex
    }

    this.getTemplatesFolder = function () {
        return getFolderById(getDatumFromCell("B2"))
    }

    this.setTemplatesFolder = function (value) {
        setDatumToCell("B2", value)
    }

    this.getRPD_folder = function () {
        return getFolderById(getDatumFromCell("C2"))
    }

    this.setRPD_folder = function (value) {
        setDatumToCell("C2", value)
    }

    this.getDatumFromCell = function (address){
        return controlSheet.getRange(address).getValue()
    }

    this.setDatumToCell = function (address, value){
        return controlSheet.getRange(address).setValue(value)
    }

    this.getFolderById = function (folderId){
        return DriveApp.openById(folderId)
    }
}


/**
 * Manual creation of content templates is required!
 */
function testRPDCreation(){
    createRPDWith([0])
}