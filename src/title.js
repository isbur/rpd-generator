/**
 *
 * @file Сбор титульников всех РПД в одном файле
 *
 */


// var RPD_MAIN_FOLDER_ID = '1qzgByLsm73nClqWiuYTM2dbkuDQvFhz5'
 var RPD_MAIN_FOLDER_ID = '1BLupPMJ_LQfdBIa18jY5bhGN2GX6beiS';
// var RPD_MAIN_FOLDER_ID = '1vnftIwZ06iueU6tdwjLf0GVdFJtPUQ3-';   // 2015 only
var CONTROL_SPREADSHEET_ID = '1jtOo9-VtaE8D1B6UErDgdprW3SoeGo20ZDkarnubV2Q'
var TITLE_PAGES_FILE_ID = '1GWrST6ZnD5HowJuDEhTC9mBaOsprhMLOEY_yb46Qy5E'
var PROCESSED_FILES_LIMIT = 30
var ATTEMPTS_TO_START_EXECUTION = 10

var global_execution_flag = true;
var global_next_folder = RPD_MAIN_FOLDER_ID
var global_file_counter = 0;


function launchTitlePagesFetching() {

    var RPD_folder = DriveApp.getFolderById(RPD_MAIN_FOLDER_ID)
    var control_spreadsheet = SpreadsheetApp.openById('1jtOo9-VtaE8D1B6UErDgdprW3SoeGo20ZDkarnubV2Q')
    var control_sheet = control_spreadsheet.getSheetByName("Control Variables")
    var freshStartFlag = control_sheet.getRange("B1").getValue()


    var count = 0
    while( control_sheet.getRange("B4").getValue() == 1) {   // Flag that shows that some instance of script is still working
        Logger.log(count)
        Utilities.sleep(1000)
        count = count + 1
        if (count > ATTEMPTS_TO_START_EXECUTION) {
            throw "Exceeded maximum amount of attempts to launch script! Maybe something is blocking it."
        }
    }
    control_sheet.getRange("B4").setValue(1)
    if (freshStartFlag == 1) {
        ScriptApp.newTrigger('launchTitlePagesFetching')
            .forSpreadsheet(control_spreadsheet)
            .onChange()
            .create()
        control_sheet.getRange("B1").setValue(0)    // Fresh start flag
        control_sheet.getRange("B2").setValue(1)    // Next folder number
        var start_folder = walkDeeper(RPD_folder, "intermidiate folder")
        var start_point = start_folder.getFiles()
    } else {
        var continuationToken = control_sheet.getRange("B3")
        var start_point = DriveApp.continueFileIterator(continuationToken)

        if (!start_point.hasNext()){
            var next_folder_number = control_sheet.getRange("B2").getValue()
            var folder_sheet = control_spreadsheet.getSheetByName("Folders")
            var next_folder_name = folder_sheet.getRange(2+next_folder_number, 1).getValue()
            if (next_folder_name == "") {
                return
            }
            global_next_folder = RPD_folder.getFoldersByName(next_folder_name).next()
            var start_folder = walkDeeper(global_next_folder, "intermidiate folder", 0)
            start_point = start_folder.getFiles()
            control_sheet.getRange("B2").setValue(next_folder_number + 1)
        }
    }


    var continuationToken = walkThroughDirectory(start_point)

    var token_dump_sheet = control_spreadsheet.getSheetByName("Token Dump")
    token_dump_sheet.insertRowAfter(1)
    token_dump_sheet.getRange("A2").setValue(Date.now())
    token_dump_sheet.getRange("B2").setValue(continuationToken)

    control_sheet.getRange("B3").setValue(continuationToken)

}


function walkThroughDirectory(fileIterator){
    while (fileIterator.hasNext() && global_execution_flag){
        file = fileIterator.next()
        extractTitlePageFromDoc(file)
        global_file_counter = global_file_counter + 1
        if (global_file_counter > PROCESSED_FILES_LIMIT){
            global_execution_flag = false
        }
    }
}


/**
 * We assume that there is only one folder containing files
 * @param {Folder/File}
 */
function walkDeeper(
    generalizedFile, previousGeneralizedFileType, depth
)
{
    var generalizedFileType = determineGeneralizedFileType(generalizedFile, previousGeneralizedFileType);
    defaultWalkThroughAction(generalizedFile, depth, generalizedFileType);

    if (generalizedFileType.indexOf("folder")>-1) {
        if (generalizedFileType === "intermidiate folder"){
            var generalizedFileIterator = generalizedFile.getFolders()
        } else if (generalizedFileType === "final folder"){
            return generalizedFile
        } else {
            throw "Unknown generalizedFile directory type"
        }
        while (generalizedFileIterator.hasNext()){
            var childGeneralizedFile = generalizedFileIterator.next();
            return walkDeeper(childGeneralizedFile, generalizedFileType, depth + 1)
        }
    } else if (generalizedFileType == "file"){
        throw "We've got too deep!"
    } else {
        throw "Unknown generalizedFileType value"
    }
}


function extractTitlePageFromDoc(file) {
    var doc = DocumentApp.openById(file.getId())
    var docBody = doc.getBody()

    var target_doc = DocumentApp.openById(TITLE_PAGES_FILE_ID)
    var output_body = target_doc.getBody()

    var previous_elem = docBody.getChild(0)
    var n = docBody.getNumChildren()

    for (var i = 1; i < n; i++) {
        var elem = docBody.getChild(i).copy()
        appendElem(elem, output_body)
        if (previous_elem.getText() == "ИННОПОЛИС") {
            Logger.log("Matched INNO")
            if (elem.getText() == "2018 г.") {
                Logger.log("Matched 2018!")
                break
            }
        }
        previous_elem = elem

    }

    output_body.appendPageBreak

    doc.saveAndClose()
    target_doc.saveAndClose()
}


function appendElem(elem, body){
    switch (elem.getType()) {
        case DocumentApp.ElementType.PARAGRAPH:
            // Logger.log(elem.getText())
            body.appendParagraph(elem)
            break
        case DocumentApp.ElementType.INLINE_IMAGE:
            body.appendImage(elem)
            break
        case DocumentApp.ElementType.TABLE:
            body.appendTable(elem)
            break
    }
}


function defaultWalkThroughAction(generalizedFile, depth, generalizedFileType) {

    if (generalizedFileType !== "file") {
        Logger.log("############################")
        Logger.log("CURRENT DEPTH:")
        Logger.log(depth)
        Logger.log("MY NAME:")
        Logger.log(generalizedFile.getName())
        Logger.log("MY LOVELY CHILDREN:")
        if (generalizedFileType.indexOf("folder")>-1) {
            if (generalizedFileType === "intermidiate folder"){
                var generalizedFileIterator = generalizedFile.getFolders()
            } else if (generalizedFileType === "final folder"){
                var generalizedFileIterator = generalizedFile.getFiles()
            }
            var count = 0
            while (generalizedFileIterator.hasNext()){

                var childGeneralizedFile = generalizedFileIterator.next();
                Logger.log(childGeneralizedFile.getName());

                count = count + 1

            }
            Logger.log("AMOUNT:")
            Logger.log(count)
        }
    }
    return
}


var test_id = '1UOpkGeYo5ls_Hc8_8qWA-aDdB6HnVot2'
function minimalExample(){
    var RPD_folder = DriveApp.getFolderById(test_id)
    var contents = folder.getFiles();
    while(contents.hasNext()){
        var file = contents.next()
        Logger.log(file.getName())
    }
}


function determineGeneralizedFileType(generalizedFile, previousGeneralizedFileType){
    if (previousGeneralizedFileType === "final folder") {
        return ("file")
    } else if (previousGeneralizedFileType.indexOf("folder")>-1) {
        contents_iterator = generalizedFile.getFolders()
        if (contents_iterator.hasNext()){
            return "intermidiate folder"
        } else {
            return "final folder"
        }
    } else {
        throw "Unknown object type"
    }
}