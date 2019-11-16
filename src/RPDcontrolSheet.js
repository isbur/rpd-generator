/**
 *
 */
function RPDcontrolSheet () {

    var controlSheet = SpreadsheetApp.openById(CONTROL_SPREADSHEET_ID).getSheetByName("Прогресс генерации РПД")


    this.reportFailedDiscipline = function(index){
        this.setDatumToCell(
            "E2",
            this.getDatumFromCell("E2") + ";" + index
        )
    }

    this.getMilestone = function() {
        return this.getDatumFromCell("D2")
    }

    /**
     * It's time to think about its behavior
     *
     * First of all we need to write, say, "success" after finishing RPD
     * Second, "error" - in such case
     *
     * О, пусть "force" будет для человечески указанной перезаписи
     */
    this.reportSuccess(disciplineIndex){
        controlSheet.getRange(disciplineIndex+1,1).setValue("success")
    }

    this.reportError(disciplineIndex){
        controlSheet.getRange(disciplineIndex+1,1).setValue("error")
    }

    this.getNextDisciplineIndex = function () {
        var disciplinesStatuses = this.getColumn(1)
        if(disciplinesStatuses.indexOf("force") !== -1){
            return disciplinesStatuses.indexOf("force")
        } else {
            return disciplinesStatuses.length
        }
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

    this.getColumn(columnNumber){
        var data = controlSheet.getRange(1, columnNumber, controlSheet.getLastRow()).getValues()
        data.forEach(
            function(datum, i){
                data[i] = data[i][0]
            }
        )
        return data
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
