var SCRIPT_HOSTING_FILE_ID = '1epqwNq3wFuOMA-bH28GO_SlIJCif8Ov-XE0T7lmWohA'  // Выгрузка  дисциплин из УП v2
var NEW_CONTENT_TEMLATES_FOLDER_ID = '19vzun-cZz9ogk5yY9e54aoIIFtOMHN9o'


function folderCheck(folder_id) {
    var folder = DriveApp.getFolderById(folder_id)
    folder.createFile('New Text File', 'Hello, world!');
}


function spreadsheetCheck(fileIdToCheck) {
    try {
        var file = SpreadsheetApp.openFileById(fileIdToCheck)
        file.insertSheet()
        file.deleteActiveSheet()
    } catch (error) {
        Logger.log(error)
    }
}


function launchTests() {
  // For some reason doesn't do anything – instead it's better to use "getActiveSpreadsheet()"
    // spreadsheetCheck(scriptHostingFileId)


}