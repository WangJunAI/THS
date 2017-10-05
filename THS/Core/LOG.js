var MongoDB = require("./MongoDB");

var LOG = {
    Data: {},
    CollectionName: "LOG",
    db:null,
    Start: function (logName) {

        if (null === LOG.db) {
            var opt = MongoDB.GetEmptyOption();
            opt.url = "mongodb://192.168.0.140:27017/ths";
            LOG.db = MongoDB.GetInst("ths", opt);
        }

        LOG.Data[logName] = { LogName: logName, StartTime: new Date() };
    },
    Stop: function (logName) {
        LOG.Data[logName].StopTime= new Date();
        LOG.SaveToDB(logName);
    },
    SaveToDB: function (logName) {
        var itemData = LOG.Data[logName];
        itemData.Duration = itemData.StartTime - itemData.StartTime;

        LOG.db.Save(LOG.CollectionName, itemData, function (err,res,remaining) {
            delete LOG.Data[logName];
            console.log("保存" + logName);
        }, 0);
    }
};

module.exports = LOG;