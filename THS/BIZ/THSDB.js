var MongoDB = require("../Core/MongoDB");

///同花顺业务数据库
var THSDB = {
    Mongo01: null,
    Mongo01Table: null,
    Mongo02: null,
    MSSQL: null,

    GetMongo01: function () {
        if (null == THSDB.Mongo01) {
            var opt = MongoDB.GetEmptyOption();
            opt.url = "mongodb://192.168.0.140:27017/ths";
            var db = MongoDB.GetInst("ths", opt);
            THSDB.Mongo01Table = {};
            var tag = "0921";
            THSDB.Mongo01Table["PageFundsTracking"] = "PageFundsTracking" + tag;///大单追踪原始数据
            THSDB.Mongo01Table["PageData"] = "PageData" + tag;///从页面抽取的数据
            THSDB.Mongo01Table["Page"] = "Page" + tag;///页面原始数据
        }
        return db;
    },

    ///遍历
    Traverse: function (db,collectionName,callback,filter) {
        db.Traverse(collectionName, {}, function (data) {
            callback(data);
        });
    }
}



module.exports = THSDB;