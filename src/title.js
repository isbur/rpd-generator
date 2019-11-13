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

    var depth = 0
    walkThrough(RPD_folder, depth, defaultWalkThroughAction)
}


/**
 * @param {Folder/File} generalizedFile
 */
function walkThrough(
    generalizedFile,
    depth,
    WalkThroughAction
)
{
    WalkThroughAction(generalizedFile, depth);
    if (depth <= FILE_DIRECTORY_LEVEL) {
        if (depth < FILE_DIRECTORY_LEVEL){
            var generalizedFileIterator = generalizedFile.getFolders()
        } else if (depth == FILE_DIRECTORY_LEVEL){
            var generalizedFileIterator = generalizedFile.getFiles()
        }
        while (generalizedFileIterator.hasNext()){
            var childGeneralizedFile = generalizedFileIterator.next();
            walkThrough(childGeneralizedFile, depth + 1, defaultWalkThroughAction)
        }
    } else {
        Logger.log("EXCEEDED DEPTH");
    }
}


function defaultWalkThroughAction(generalizedFile, depth) {
    Logger.log("############################")
    Logger.log("CURRENT DEPTH:")
    Logger.log(depth)
    Logger.log("MY NAME:")
    Logger.log(generalizedFile.getName())
    Logger.log("MY LOVELY CHILDREN:")
    if (depth <= FILE_DIRECTORY_LEVEL) {
        if (depth < FILE_DIRECTORY_LEVEL){
            var generalizedFileIterator = generalizedFile.getFolders()
        } else if (depth == FILE_DIRECTORY_LEVEL){
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
    } else {
        Logger.log("I'm a file");
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