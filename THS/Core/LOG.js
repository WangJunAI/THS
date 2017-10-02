var MongoDB = require("./MongoDB");

var LOG = {
    Data: {},
    CollectionName:"LOG",
    Start: function (logName) {
        LOG.Data[logName] = { LogName: logName, StartTime: new Date() };
    },
    Stop: function (logName) {
        LOG.Data[logName].StopTime: new Date();
        LOG.SaveToDB(logName);
    },
    SaveToDB: function (logName) {
        var opt = MongoDB.GetEmptyOption();
        opt.url = "mongodb://192.168.0.140:27017/ths";
        var db = MongoDB.GetInst("ths", opt);
        db.Save(LOG.CollectionName, itemData, function () {
            delete LOG.Data[logName];
        }, 0);
    }


};