var MongoDB = require("../Core/MongoDB");
var PARAM_CHECKER = require("../Core/PARAM_CHECKER")

///同花顺业务数据库
var THSDB = {
    Mongo01: null,
    Mongo01Table: null,
    Mongo02Table: null,
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

            ///个股龙虎榜
            THSDB.Mongo01Table["PageGGLHB"] = "PageGGLHB" + tag;///个股龙虎榜页面
            THSDB.Mongo01Table["PageGGLHBMX"] = "PageGGLHBMX" + tag;///个股龙虎榜页面
            THSDB.Mongo01Table["DataGGLHB"] = "DataGGLHB" + tag;///个股龙虎榜页面数据
            THSDB.Mongo01Table["DataGGLHBMX"] = "DataGGLHBMX" + tag;///个股龙虎榜页面数据

            THSDB.Mongo01Table["THSBI"] = "THSBI" + tag;///个股龙虎榜页面数据

        }
        return db;
    },

    ///第二版龙虎榜数据库
    GetMongo02: function () {
        if (null == THSDB.Mongo02) {
            var opt = MongoDB.GetEmptyOption();
            opt.url = "mongodb://192.168.0.140:27017/THSV2";
            var db = MongoDB.GetInst("THSV2", opt);
            THSDB.Mongo02Table = {};
            THSDB.Mongo02Table["PageFundsStock"] = "PageFundsStock";///个股资金榜单
            THSDB.Mongo02Table["PageGGLHB"] = "PageGGLHB";///龙虎榜页面
            THSDB.Mongo02Table["PageKLine"] = "PageKLine";///日线图页面
            THSDB.Mongo02Table["PageStock"] = "PageStock";///个股页面

            THSDB.Mongo02Table["DataFundsStock"] = "DataFundsStock";///个股资金榜单
            THSDB.Mongo02Table["DataGGLHB"] = "DataGGLHB";///龙虎榜页面
            THSDB.Mongo02Table["DataKLine"] = "DataKLine";///日线图页面
            THSDB.Mongo02Table["DataStock"] = "DataStock";///个股页面

            THSDB.Mongo02Table["DataBI"] = "DataBI";///分析结果
            THSDB.Mongo02Table["DataInterResult"] = "DataInterResult";///分析结果

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