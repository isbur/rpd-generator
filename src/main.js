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
    {name: 'Запустить процесс создания всех РПД заново', functionName: 'startNewGenerationProcess'}
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
function startNewGenerationProcess() {

    disciplinesSheet = new DisciplinesSheet()
    controlSheet = new RPDcontrolSheet()

    var templatesFolder = getNewTemplatesFolder()
    var RPD_folder = getNewRPD_folder()
    var milestone = disciplinesSheet.getNumberOfItems() - 1 // Milestone is the index of last row
    // var milestone = 0

    controlSheet.setDatumToCell("B2", templatesFolder.getId())
    controlSheet.setDatumToCell("C2", RPD_folder.getId())
    controlSheet.setDatumToCell{"D2", milestone}

    cleanAllTriggers()
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
        var disciplineIndex = RPDcontrolSheet.getNextDisciplineIndex()
        generateSingleRPD(RPDcontrolSheet, DisciplinesSheet, disciplineIndex)
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
function generateSingleRPD(RPDcontrolSheet, DisciplinesSheet, newDisciplineIndex) {

    this.check_whether_content_template_was_already_generated = function(id_without_zeros){
        var search_term = "title contains 'CD_"+idToString(id_without_zeros)+"'"  // contains performs prefix search (as stated in)
        console.log(search_term)
        var fileIterator = templatesFolder.searchFiles(search_term)
        return fileIterator.hasNext()
    }

    //var lastDisciplineIndex = RPDcontrolSheet.getLastDisciplineIndex()
    //var newDisciplineIndex = lastDisciplineIndex + 1
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
        RPDcontrolSheet.reportError(newDisciplineIndex)
        // throw error
    }

    var milestone = RPDcontrolSheet.getMilestone()
    if(newDisciplineIndex == milestone) {
        console.log("reached milestone...")
        cleanAllTriggers()
    }
    RPDcontrolSheet.reportSuccess(newDisciplineIndex)
}


/**
 * Manual creation of content templates is required!
 */
function testRPDCreation(){
    createRPDWith([0])
}