/**
 *
 * @file Сбор титульников всех РПД в одном файле
 *
 */


var RPD_MAIN_FOLDER_ID = '1qzgByLsm73nClqWiuYTM2dbkuDQvFhz5'


function fetchTitlePages() {
    var RPD_folder = DriveApp.getFolderById(RPD_MAIN_FOLDER_ID)
    var RPD_folder_contents_iterator = RPD_folder.getFolders()

    var depth = 1
    walkThrough(RPD_folder_contents_iterator, depth, defaultWalkThroughAction)
}


/**
 * @param {FolderIterator/FileIterator} generalizedFile
 */
function walkThrough(
    generalizedFileIterator,
    depth,
    WalkThroughAction
)
{
    while (generalizedFileIterator.hasNext()){

        generalizedFile = generalizedFileIterator.next();
        Logger.log(generalizedFile.getName());
        Logger.log(depth)
        WalkThroughAction();
        if (depth < 5) {
            var childGeneralizedFileIterator = generalizedFile.getFolders()
            walkThrough(childGeneralizedFileIterator, depth + 1, defaultWalkThroughAction)
        } else if (depth < 5) {
            var childGeneralizedFileIterator = generalizedFile.getFiles()
            walkThrough(childGeneralizedFileIterator, depth + 1, defaultWalkThroughAction)
        } else {
            return
        }

    }
}


function defaultWalkThroughAction() {
    Logger.log("I'm a function and I'm here")
    return
}