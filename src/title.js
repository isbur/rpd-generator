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

var global_execution_flag = true;
var global_file_counter = 0;



function fetchTitlePages() {
    var RPD_folder = DriveApp.getFolderById(RPD_MAIN_FOLDER_ID)
    var output_doc = DocumentApp.create("Титульники")
    var output_doc_id = output_doc.getId()

    var depth = 0
    walkThrough(RPD_folder, depth, "intermidiate folder", defaultWalkThroughAction, output_doc)
    output_doc.saveAndClose()

    var output_file = DriveApp.getFileById(output_doc_id)
    RPD_folder.addFile(output_file)
}


/**
 * @param {Folder/File} generalizedFile
 */
function walkThrough(
    generalizedFile,
    depth,
    previoudGeneralizedFileType,
    WalkThroughAction,
    output_doc
)
{
    if (global_execution_flag === false) {
        return
    }

    var generalizedFileType = determineGeneralizedFileType(generalizedFile, previoudGeneralizedFileType);
    WalkThroughAction(generalizedFile, depth, generalizedFileType);

    if (generalizedFileType.indexOf("folder")>-1) {
        if (generalizedFileType === "intermidiate folder"){
            var generalizedFileIterator = generalizedFile.getFolders()
        } else if (generalizedFileType === "final folder"){
            var generalizedFileIterator = generalizedFile.getFiles()
        } else {
            throw "Unknown generalizedFile directory type"
        }
        while (generalizedFileIterator.hasNext()){
            var childGeneralizedFile = generalizedFileIterator.next();
            walkThrough(childGeneralizedFile, depth + 1, generalizedFileType, defaultWalkThroughAction, output_doc)
        }
    } else if (generalizedFileType == "file"){
        Logger.log("I'm a file");
        global_file_counter = global_file_counter + 1
        if (global_file_counter > PROCESSED_FILES_LIMIT){
            global_execution_flag = false
        }

        var doc = DocumentApp.openById(generalizedFile.getId())
        var docBody = doc.getBody()

        var output_body = output_doc.getBody()
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

    } else {
        throw "Unknown generalizedFileType value"
    }
}


function recoursevlyFindPreviousSiblingAndAppend(elem, body){
    Logger.log(elem)
    if (elem === null) {
        return
    }
    recoursevlyFindPreviousSiblingAndAppend(elem.getPreviousSibling(), body)
    appendElem(elem, body)
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