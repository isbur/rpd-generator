/**
 *
 * @file Сбор титульников всех РПД в одном файле
 *
 */


// var RPD_MAIN_FOLDER_ID = '1qzgByLsm73nClqWiuYTM2dbkuDQvFhz5'
var RPD_MAIN_FOLDER_ID = '1BLupPMJ_LQfdBIa18jY5bhGN2GX6beiS';
var FILE_DIRECTORY_LEVEL = 4;



function fetchTitlePages() {
    var RPD_folder = DriveApp.getFolderById(RPD_MAIN_FOLDER_ID)
    var output_file = DriveApp.create("Титульники")

    var depth = 0
    walkThrough(RPD_folder, depth, "intermidiate folder", defaultWalkThroughAction)
}


/**
 * @param {Folder/File} generalizedFile
 */
function walkThrough(
    generalizedFile,
    depth,
    previoudGeneralizedFileType,
    WalkThroughAction
)
{
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
            walkThrough(childGeneralizedFile, depth + 1, generalizedFileType, defaultWalkThroughAction)
        }
    } else if (generalizedFileType === "file"){
        Logger.log("I'm a file");
        var doc = DocumentApp.openById(generalizedFile.getId())
        var docBody = doc.getBody()
        var docParagraphs = docBody.getParagraphs()
        docParagraphs.forEach(Logger.log(paragraph))
        var inno_position = docBody.findText("ИННОПОЛИС")
        var year_position = docBody.findText("2018", inno_position)
    } else {
        throw "Unknown generalizedFileType value"
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