var MongoDB = require("../Core/MongoDB");
var PARAM_CHECKER = require("../Core/PARAM_CHECKER")

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
            var tag = "0929";
            THSDB.Mongo01Table["PageFundsTracking"] = "PageFundsTracking" + tag;///大单追踪原始数据
            THSDB.Mongo01Table["PageData"] = "PageData" + tag;///从页面抽取的数据
            THSDB.Mongo01Table["Page"] = "Page" + tag;///页面原始数据
            THSDB.Mongo01Table["DataFundsTracking"] = "DataFundsTracking" + tag;///大单追踪原始数据
            THSDB.Mongo01Table["DataKLine"] = "DataKLine" + tag;///页面原始数据
            THSDB.Mongo01Table["DataStockPage"] = "DataStockPage" + tag;///个股页面
        }
        return db;
    },

    ///遍历
    Traverse: function (db,collectionName,callback,filter) {
        db.Traverse(collectionName, {}, function (data) {
            callback(data);
        });
    }, 
    ///遍历
    TraversePager: function (db, collectionName, callbackProc, filter,nextPager) {

        var callbackFind = function (summary) {
            ///获取一页数据以后
            var dataArray = summary.DataArray;
            while (0 < dataArray.length) {
                var qItem = dataArray.pop();
                callbackProc(qItem, summary);///处理函数
            }
        }

        var callbackErr = function (err) { console.log("TraversePager " + err) };

        if (PARAM_CHECKER.IsObject(nextPager) && PARAM_CHECKER.IsInt(nextPager.NextIndex) && PARAM_CHECKER.IsInt(nextPager.PageSize)) {
            console.log("正在获取" + collectionName + " " + nextPager.NextIndex);
            db.TraversePager(collectionName, {}, nextPager.NextIndex, nextPager.PageSize, callbackFind, callbackErr);
        }
        else {
            db.TraversePager(collectionName, {}, 0, 100, callbackFind, callbackErr);
        }

    },

    Save: function (db, collectionName, data, callback) {
        db.Save(collectionName, data, function () { console.log("保存完毕" + collectionName + " " + new Date().getTime());  }, 0);
    },

    ///删除数据库中的重复数据
    RemoveDuplicateData: function (collectionName) {

    }
}



module.exports = THSDB;