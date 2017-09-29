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
            var tag = "0927";
            THSDB.Mongo01Table["PageFundsTracking"] = "PageFundsTracking" + tag;///大单追踪原始数据
            THSDB.Mongo01Table["PageData"] = "PageData" + tag;///从页面抽取的数据
            THSDB.Mongo01Table["Page"] = "Page" + tag;///页面原始数据
            THSDB.Mongo01Table["DataFundsTracking"] = "DataFundsTracking" + tag;///大单追踪原始数据
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
    TraversePager: function (db, collectionName, callbackProc, filter) {
        var callbackFind = function (summary) {
            var dataArray = summary.DataArray;
            while (0 < dataArray.length) {
                var qItem = dataArray.pop();
                var pageData = callbackProc(qItem.Page);///处理函数
             
                db.Save("testpager", pageData, function (err, res, remaining) {
                    console.log("剩余数量 " + remaining + " 当前索引页面" + summary.CurrentIndex+"  ");
                    if (0 === remaining) {
                        db.TraversePager(collectionName, {}, summary.NextIndex, summary.PageSize, callbackFind, callbackErr);
                    }
                }, 0);
            }
        }

        var callbackErr = function (err) { console.log(err) };

        db.TraversePager(collectionName, {}, 0, 100, callbackFind, callbackErr);
    },

    Save: function (db, collectionName, data, callback) {
        db.Save(collectionName, data, function () { console.log("保存完毕" + collectionName + " " + new Date().getTime());  }, 0);
    }
}



module.exports = THSDB;