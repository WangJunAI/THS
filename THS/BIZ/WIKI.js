var MongoDB = require("../Core/MongoDB");
var PARAM_CHECKER = require("../Core/PARAM_CHECKER");
var TOOLS = require("../Core/TOOLS")

var $ = require('cheerio');
var count = 0;
///同花顺业务处理
var WIKI = {
    GetDB: function () {
        var opt = MongoDB.GetEmptyOption();
        opt.url = "mongodb://192.168.0.140:27017/wiki";
        var db = MongoDB.GetInst("wiki", opt);
        if (null === WIKI.DB) {
            WIKI.DB = db;
        }
        return WIKI.DB;
    },
    Const: {
        Collection: {
            Tag: "0912",
            Index: "index" + "", ///原始页面,
            Log: "Log" + "0912",///性能日志
        }
    },
    Log: {
        data: {},
        ///开始计时
        Start: function (logItemName) {
            WIKI.Log.data[logItemName] = { StartTime: new Date() };
        },
        ///
        Stop: function (logItemName) {
            WIKI.Log.data[logItemName].StopTime = new Date();
            WIKI.Log.data[logItemName].ItemName = logItemName;
            WIKI.Log.data[logItemName].Duration = WIKI.Log.data[logItemName].StopTime - WIKI.Log.data[logItemName].StartTime;
            var collectionName = WIKI.Const.Collection.Log;
            var db = WIKI.GetDB();
            db.Save(collectionName, WIKI.Log.data[logItemName], function () {
                delete WIKI.Log.data[logItemName];
            }, 0);
        }
    },
    Dict: {},
    DB: null, 
    TraverseIndex: function () {
        var db = WIKI.GetDB();
        var collectionName = WIKI.Const.Collection.Index;

        ///日志计时
        WIKI.Log.Start("页面遍历WIKI Index");

        db.Traverse(collectionName, {}, function (data) {//"StockCode": "002417" 
            if (typeof (data.Content) === "string") {
                var content = data.Content.split(/:/g);
                var item = {};
                for (var i = 0; i < content.length; i++) {
                    item["C" + i] = content[i];
                }
                db.Save("Keyword", item, function () { }, 0);
            }
            else {
                db.Save("Exception", data, function () { }, 0);
            }
        }, function (endMsg) {
            console.log("遍历结束");
            WIKI.Log.Stop("页面遍历WIKI Index");
        }, function (errMsg) {
            console.log("出错");
        });
    },
 

}

module.exports = WIKI;