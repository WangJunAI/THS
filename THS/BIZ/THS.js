var MongoDB = require("../Core/MongoDB");
var PARAM_CHECKER = require("../Core/PARAM_CHECKER");
var TOOLS = require("../Core/TOOLS")
var THS_BI = require("../BIZ/THS_BI");
var THSHistoryTest = require("../BIZ/THSHistoryTest");
var THSDB = require("../BIZ/THSDB");
var THSPageFundsTracking = require("../BIZ/THSPageFundsTracking");
var MemQueue = require("../Core/MemQueue");
var DataTools = require("../Core/DataTools");
var THSPageStock = require("../BIZ/THSPageStock");
var THSPageKLine = require("../BIZ/THSPageKLine");



var $ = require('cheerio');
 
///同花顺业务处理
var THS = {
   
    ///分页遍历个股页面
    TraversePager_PageStock: function () {
        var db = THSDB.GetMongo01();
        var sourceCollectionName = "Page0921";//THSDB.Mongo01Table.Page;
        var targetCollectionName = THSDB.Mongo01Table.DataStockPage;

        var filter = { $or: [{ "ContentType": "资金流向" }] };

        var callbackFind = function (pagerInfo) {
            ///获取一页数据以后
            var dataArray = pagerInfo.DataArray;
            while (0 < dataArray.length) {
                var qItem = dataArray.pop();
                ///从页面获取数据
                ///存储数据
                var saveItem = THSPageStock.GetDataFromPage(qItem);
                saveItem.StockCode = qItem.StockCode;
                saveItem.StockName = qItem.StockName;
                saveItem.ContentType = qItem.ContentType;
                db.Save(targetCollectionName, saveItem, function (err, result, remaining) {
                    console.log(targetCollectionName + " 保存完毕 " + qItem.ContentType);
                    if (0 === remaining) {
                        db.TraversePager(sourceCollectionName, filter, pagerInfo.NextIndex, pagerInfo.PageSize, callbackFind, callbackErr);
                    }
                }, 0);

            }
        }

        var callbackErr = function (err) { console.log("TraversePager " + err) };

        db.TraversePager(sourceCollectionName, filter, 0, 100, callbackFind, callbackErr);
    },

    ///分页遍历K线图页面
    TraversePager_PageKLine: function () {
        var db = THSDB.GetMongo01();
        var sourceCollectionName = "Page0921";//THSDB.Mongo01Table.Page;
        var targetCollectionName = "DataKLine0921";THSDB.Mongo01Table.DataKLine;

        var filter = { $or: [{ "ContentType": "日线数据" }] };

        var callbackFind = function (pagerInfo) {
            ///获取一页数据以后
            var dataArray = pagerInfo.DataArray;
            while (0 < dataArray.length) {
                var qItem = dataArray.pop();
                ///从页面获取数据
                ///存储数据
                var saveItem = THSPageKLine.AnalysePageDayLine(qItem);
                saveItem.StockCode = qItem.StockCode;
                saveItem.StockName = qItem.StockName;
                db.Save(targetCollectionName, saveItem, function (err, result, remaining) {
                    console.log(targetCollectionName + "保存完毕" + qItem.ContentType);
                    if (0 === remaining) {
                        db.TraversePager(sourceCollectionName, filter, pagerInfo.NextIndex, pagerInfo.PageSize, callbackFind, callbackErr);
                    }
                }, 0);

            }
        }

        var callbackErr = function (err) { console.log("TraversePager " + err) };

        db.TraversePager(sourceCollectionName, filter, 0, 100, callbackFind, callbackErr);
    },
 
    ///分页遍历大单追踪页面数据(数据必须清洗后)
    TraversePager_FundsTracking: function () {
        var db = THSDB.GetMongo01();
        var sourceCollectionName = "PageFundsTracking0929";//THSDB.Mongo01Table.Page;
        var targetCollectionName = THSDB.Mongo01Table.DataFundsTracking;

        var filter = { $or: [{ "ContentType": "资金流向大单追踪" }] };

        var callbackFind = function (pagerInfo) {
            ///获取一页数据以后
            var dataArray = pagerInfo.DataArray;
            while (0 < dataArray.length) {
                var qItem = dataArray.pop();
                ///从页面获取数据
                ///存储数据
                var saveItem = THSPageFundsTracking.GetPageData_ddzz(qItem);

                db.Save(targetCollectionName, saveItem, function (err, result, remaining) {
                    console.log(targetCollectionName + "保存完毕" + qItem.ContentType + "  " + JSON.stringify(saveItem).substring(0, 60) + "...");
                    if (0 === remaining) {
                        db.TraversePager(sourceCollectionName, filter, pagerInfo.NextIndex, pagerInfo.PageSize, callbackFind, callbackErr);
                    }
                }, 0);

            }
        }

        var callbackErr = function (err) { console.log("TraversePager " + err) };

        db.TraversePager(sourceCollectionName, filter, 0, 100, callbackFind, callbackErr);

    },

    ///清理大单垃圾数据
    ClearPageFundsTracking: function () {
        var db = THSDB.GetMongo01();
        collectionName = THSDB.Mongo01Table.PageFundsTracking;

        //DataTools.LogDuplicateData(db, collectionName, ["Page"]);
        //DataTools.RemoveDuplicateData(db, DataTools.CollectionName, ["Page"]);
    },
 
 



 

}

module.exports = THS;