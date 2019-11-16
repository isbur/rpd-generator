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

    /**
     * папка контентных шаблонов
     * теперь определяется по-новому (динамически подгружается из управляющей таблицы, а не захардкожена)
     */
    var templatesFolder = getCurrentTemplatesFolder()
    /****************************************************************************************************** */

    createRPD(RPD_work_directory, templatesFolder, requiredDisciplineSheetIndices)
}


/**
 * 1. Set up a trigger
 * 2. ???
 *      * Trigger job must check itself whether the whole task is finished
 */
function launchGenerationProcess() {

    var disciplinesSheet = new DisciplinesSheet

    var controlSheet = SpreadsheetApp.openById(CONTROL_SPREADSHEET_ID).getSheetByName("Прогресс генерации РПД")
    var templatesFolder = getNewTemplatesFolder()
    var RPD_folder = getNewRPD_folder()
    var milestone = disciplinesSheet.getNumberOfItems() - 1 // Milestone is the index of last row
    // var milestone = 0
    controlSheet.getRange("A2:D2").setValues([  // Strange... I've already changed these strings...
        [-1, templatesFolder.getId(), RPD_folder.getId(), milestone]
    ])

    setNewTriggerWithTimeoutInMinutes(5)
}


function changeTriggerTimeout() {
    cleanAllTriggers()
    setNewTriggerWithTimeoutInMinutes(5)
}


/**
 * Function needed to make it possible to change trigger parameters without restarting the whole job
 * @param {Integer} timeout
 */
function setNewTriggerWithTimeoutInMinutes(timeout) {
    ScriptApp.newTrigger("generationProcessStep")
        .timeBased()
        .everyMinutes(timeout)
        .create()
}


function cleanAllTriggers(){
    var triggers = ScriptApp.getUserTriggers(SpreadsheetApp.getActiveSpreadsheet())
    triggers.forEach(
        function (trigger) {
            ScriptApp.deleteTrigger(trigger)
        }
    )
}


function generationProcessStep() {
    var initialMoment = Date.now()
    RPDcontrolSheet = new RPDcontrolSheet()
    DisciplinesSheet = new DisciplinesSheet()
    while (Date.now() - initialMoment < LAUNCH_GENERATION_SCRIPT_TIMEOUT - 20 * 1000) {
        var before = Date.now()
        generateSingleRPD(RPDcontrolSheet, DisciplinesSheet)
        var after = Date.now()
        console.log("Proceeded to next RPD.")
        console.log(Math.floor((after-before)/1000).toString())
    }
}


/**
 *    // 1. Open control sheet
 *
 *   * (optional) check whether another script is still working
 *
 *   ****
 *
 *   // 3. Use it as an index to generate both template and RPD
 *         * check whether content template  is already generated
 *
 *   * (optional) generate more RPD at once
 */
function generateSingleRPD(RPDcontrolSheet, DisciplinesSheet) {

    this.check_whether_content_template_was_already_generated = function(id_without_zeros){
        var search_term = "title contains 'CD_"+isToString(id_without_zeros)+"'"  // contains performs prefix search (as stated in)
        console.log(search_term)
        var fileIterator = templatesFolder.searchFiles(search_term)
        return fileIterator.hasNext()
    }

    var lastDisciplineIndex = RPDcontrolSheet.getLastDisciplineIndex()
    var newDisciplineIndex = lastDisciplineIndex + 1
    console.log("Processing next discipline")
    console.log(newDisciplineIndex)

    var templatesFolder = RPDcontrolSheet.getTemplatesFolder()
    var RPD_folder = RPDcontrolSheet.getRPD_folder()
    console.log(templatesFolder.getId())
    console.log(RPD_folder.getId())

    var contentTemplateId = DisciplinesSheet.getContentTemlpateId(newDisciplineIndex)
    console.log("ContentTemplateId")
    console.log(contentTemplateId)
    if (this.check_whether_content_template_was_already_generated(contentTemplateId) === false) {
        console.log("Creating new content template...")
        createTemplates(templatesFolder, [contentTemplateId])
    }

    try {
        createRPD(RPD_folder, templatesFolder, [newDisciplineIndex])
    } catch(error) {
        RPDcontrolSheet.reportFailedDiscipline(newDisciplineIndex)
        RPDcontrolSheet.updateLastDisciplineIndex()
        throw error
    }

    var milestone = RPDcontrolSheet.getMilestone()
    if(newDisciplineIndex == milestone) {
        console.log("reached milestone...")
        cleanAllTriggers()
    }
    RPDcontrolSheet.updateLastDisciplineIndex()
}


/**
 *
 */
function RPDcontrolSheet () {

    var controlSheet = SpreadsheetApp.openById(CONTROL_SPREADSHEET_ID).getSheetByName("Прогресс генерации РПД")

    /**
     *
     */
    this.reportFailedDiscipline = function(index){
        this.setDatumToCell(
            "E2",
            this.getDatumFromCell("E2") + ";" + index
        )
    }

    this.getMilestone = function() {
        return this.getDatumFromCell("D2")
    }

    this.getLastDisciplineIndex = function () {
        var lastDisciplineIndex = this.getDatumFromCell("A2")
        if (lastDisciplineIndex === "") {
            throw "lastDisciplineIndex cell is empty!"
        } else {
            lastDisciplineIndex = parseInt(lastDisciplineIndex)
        }
        return lastDisciplineIndex
    }

    this.updateLastDisciplineIndex = function () {
        this.setDatumToCell("A2", parseInt(this.getDatumFromCell("A2")) + 1 )
    }

    this.getTemplatesFolder = function () {
        return this.getFolderById(this.getDatumFromCell("B2"))
    }

    this.setTemplatesFolder = function (value) {
        this.setDatumToCell("B2", value)
    }

    this.getRPD_folder = function () {
        return this.getFolderById(this.getDatumFromCell("C2"))
    }

    this.setRPD_folder = function (value) {
        this.setDatumToCell("C2", value)
    }

    this.getDatumFromCell = function (address){
        return controlSheet.getRange(address).getValue()
    }

    this.setDatumToCell = function (address, value){
        return controlSheet.getRange(address).setValue(value)
    }

    this.getFolderById = function (folderId){
        return DriveApp.getFolderById(folderId)
    }
}


/**
 * Manual creation of content templates is required!
 */
function testRPDCreation(){
    createRPDWith([0])
}