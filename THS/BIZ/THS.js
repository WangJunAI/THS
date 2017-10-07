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
var THSLHB = require("../BIZ/THSLHB");
var THSDataAnalyse = require("../BIZ/THSDataAnalyse");


var $ = require('cheerio');
 
///同花顺业务处理
var THS = {

    ///分页遍历个股页面
    TraversePager_PageStock: function () {
        var db = THSDB.GetMongo01();
        var sourceCollectionName = "Page1004";//THSDB.Mongo01Table.Page;
        var targetCollectionName = "DataStockPage1006";//THSDB.Mongo01Table.DataStockPage;

        var filter = { $or: [{ "ContentType": "资金流向" }, { "ContentType": "首页概览" }] };

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
        var sourceCollectionName = "PageKLine1004";//THSDB.Mongo01Table.Page;
        var targetCollectionName = "DataKLine1006"; //THSDB.Mongo01Table.DataKLine;

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
                    console.log(targetCollectionName + "保存完毕" + qItem.ContentType + " " + pagerInfo.TotalCount + " " + pagerInfo.CurrentIndex + " " + pagerInfo.PageSize + " ");
                    if (0 === remaining) {
                        db.TraversePager(sourceCollectionName, filter, pagerInfo.NextIndex, pagerInfo.PageSize, callbackFind, callbackErr);
                    }
                }, 0);

            }
        }

        var callbackErr = function (err) { console.log("TraversePager " + err) };

        db.TraversePager(sourceCollectionName, filter, 0, 100, callbackFind, callbackErr);
    },

    ///分页遍历大单追踪页面数据(数据必须清洗后)实时
    TraversePager_FundsTracking: function () {
        var db = THSDB.GetMongo01();
        var sourceCollectionName = "PageFundsTracking0929";//THSDB.Mongo01Table.Page;
        var targetCollectionName = "TestDataFundsTracking1007";//THSDB.Mongo01Table.DataFundsTracking;

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
                    console.log(targetCollectionName + "保存完毕" + qItem.ContentType + "  " + pagerInfo.TotalCount + " " + pagerInfo.CurrentIndex + " " + pagerInfo.PageSize + " ");
                    if (0 === remaining) {
                        db.TraversePager(sourceCollectionName, filter, pagerInfo.NextIndex, pagerInfo.PageSize, callbackFind, callbackErr);
                    }
                }, 0);

            }
        }

        var callbackErr = function (err) { console.log("TraversePager " + err) };

        db.TraversePager(sourceCollectionName, filter, 0, 1000, callbackFind, callbackErr);

    },

    ///分页遍历个股龙虎榜页面
    TraversePager_PageGGLHB: function () {
        var db = THSDB.GetMongo01();
        var sourceCollectionName = "PageGGLHB1004";//THSDB.Mongo01Table.Page;
        var targetCollectionName = "DataGGLHB1006";//THSDB.Mongo01Table.DataGGLHB;

        var filter = {};//{ $or: [{}] };

        var callbackFind = function (pagerInfo) {
            ///获取一页数据以后
            var dataArray = pagerInfo.DataArray;
            while (0 < dataArray.length) {
                var qItem = dataArray.pop();
                ///从页面获取数据
                ///存储数据
                var saveItem = THSLHB.GetPageData_GGLHB(qItem);
                saveItem.StockCode = qItem.StockCode;
                saveItem.StockName = qItem.StockName;
                saveItem.Url = qItem.Url;

                db.Save(targetCollectionName, saveItem, function (err, result, remaining) {
                    console.log(targetCollectionName + " 保存完毕" + qItem.ContentType + "  " + pagerInfo.TotalCount + " " + pagerInfo.CurrentIndex + " " + pagerInfo.PageSize + " ");
                    if (0 === remaining) {
                        db.TraversePager(sourceCollectionName, filter, pagerInfo.NextIndex, pagerInfo.PageSize, callbackFind, callbackErr);
                    }
                }, 0);

            }
        }

        var callbackErr = function (err) { console.log("TraversePager " + err) };

        db.TraversePager(sourceCollectionName, filter, 0, 100, callbackFind, callbackErr);

    },

    ///分页遍历个股龙虎榜明细页面
    TraversePager_PageGGLHBMX: function () {
        var db = THSDB.GetMongo01();
        var sourceCollectionName = "PageGGLHBMX1004";//THSDB.Mongo01Table.Page;
        var targetCollectionName = "DataGGLHBMX1006";//THSDB.Mongo01Table.DataGGLHB;

        var filter = {};//{ $or: [{}] };

        var callbackFind = function (pagerInfo) {
            ///获取一页数据以后
            var dataArray = pagerInfo.DataArray;
            while (0 < dataArray.length) {
                var qItem = dataArray.pop();
                ///从页面获取数据
                ///存储数据
                var saveItem = THSLHB.GetPageData_GGLHBMX(qItem);
                saveItem.StockCode = qItem.Code;
                saveItem.ParentUrl = qItem.ParentUrl;
                saveItem.Date = TOOLS.Convertor.ToDate(qItem.Date);
                saveItem.Rid = qItem.Rid;
                saveItem.Url = qItem.Url;


                db.Save(targetCollectionName, saveItem, function (err, result, remaining) {
                    console.log(targetCollectionName + " 保存完毕" + qItem.ContentType + "  " + pagerInfo.TotalCount + " " + pagerInfo.CurrentIndex + " " + pagerInfo.PageSize + " ");
                    if (0 === remaining) {
                        db.TraversePager(sourceCollectionName, filter, pagerInfo.NextIndex, pagerInfo.PageSize, callbackFind, callbackErr);
                    }
                }, 0);

            }
        }

        var callbackErr = function (err) { console.log("TraversePager " + err) };

        db.TraversePager(sourceCollectionName, filter, 0, 100, callbackFind, callbackErr);

    },

    ///分页遍历资金流向 - 个股资金 概念资金 行业资金 即时 3日 5日 10日 20日 页面
    TraversePager_PageStockFunds: function () {
        var db = THSDB.GetMongo01();
        var sourceCollectionName = "PageStockFunds1004";//THSDB.Mongo01Table.Page;
        var targetCollectionName = "DataStockFunds1006";//THSDB.Mongo01Table.DataGGLHB;

        var filter = {};//{ $or: [/*{ ContentType:"行业资金3日"}*/] };

        var callbackFind = function (pagerInfo) {
            ///获取一页数据以后
            var dataArray = pagerInfo.DataArray;
            while (0 < dataArray.length) {
                var qItem = dataArray.pop();
                ///从页面获取数据
                ///存储数据
                var saveItem = THSPageFundsTracking.GetPageData(qItem);

                db.Save(targetCollectionName, saveItem, function (err, result, remaining) {
                    console.log(targetCollectionName + " 保存完毕" + qItem.ContentType + "  " + pagerInfo.TotalCount + " " + pagerInfo.CurrentIndex + " " + pagerInfo.PageSize + " ");
                    if (0 === remaining) {
                        db.TraversePager(sourceCollectionName, filter, pagerInfo.NextIndex, pagerInfo.PageSize, callbackFind, callbackErr);
                    }
                }, 0);

            }
        }

        var callbackErr = function (err) { console.log("TraversePager " + err) };

        db.TraversePager(sourceCollectionName, filter, 0, 100, callbackFind, callbackErr);

    },

    ///数据遍历
    TraversePager_Data: function () {
        var db = THSDB.GetMongo01();
        //var sourceArray = [{ CollectionName: "DataFundsTracking1006", Filter: {} } , { CollectionName: "DataGGLHB1006", Filter: {} }, { CollectionName: "DataGGLHBMX1006", Filter: {} }, 
        //    { CollectionName: "DataKLine1006", Filter: {} }, { CollectionName: "DataStockFunds1006", Filter: {} }, { CollectionName: "DataStockPage1006", Filter: {} }]; ///要分析的数据集

        var sourceArray = [/*{ CollectionName: "DataFundsTracking1006", Filter: {} }, { CollectionName: "DataGGLHB1006", Filter: {} }, { CollectionName: "DataGGLHBMX1006", Filter: {} },*/
        { CollectionName: "DataKLine1006", Filter: {} }/*, { CollectionName: "DataStockFunds1006", Filter: {} }, { CollectionName: "DataStockPage1006", Filter: {} }*/]; ///要分析的数据集

        var callbackFind = function (pagerInfo) {
            ///获取一页数据以后
            var dataArray = pagerInfo.DataArray;
            while (0 < dataArray.length) {
                var qItem = dataArray.pop();
                ///将数据放入内存数据
                THSDataAnalyse.LoadDataSet(pagerInfo.CollectionName, qItem);
            }
            console.log("准备处理 " + pagerInfo.CollectionName + "  " + pagerInfo.TotalCount + " " + pagerInfo.CurrentIndex + " " + pagerInfo.PageSize + " " + pagerInfo.IsLastPage+" ");
            if (false === pagerInfo.IsLastPage) {///若不是最后一页
                db.TraversePager(pagerInfo.CollectionName, pagerInfo.Filter, pagerInfo.NextIndex, pagerInfo.PageSize, callbackFind, callbackErr);
            }
            else if (true === pagerInfo.IsLastPage && 0 < sourceArray.length) { ///若是当前集合最后一个页面,开始下一个集合
                var sourceItem = sourceArray.pop();
                db.TraversePager(sourceItem.CollectionName, sourceItem.Filter, 0, 100, callbackFind, callbackErr);
            }
            else if (true === pagerInfo.IsLastPage && 0 == sourceArray.length) {
                ///若是最后一个集合的最后一个页面
                console.log("开始数据分析");
                THSDataAnalyse.GetTargetStockByIncrease("5%");
                THSDataAnalyse.Save(db);
            }
        }

        var callbackErr = function (err) { console.log("TraversePager " + err) };


        ///开始遍历
        var sourceItem = sourceArray.pop();
 
        db.TraversePager(sourceItem.CollectionName, sourceItem.Filter, 0, 100, callbackFind, callbackErr);
 

    },

    Test: function () {
        var db = THSDB.GetMongo01();
        var item1 = { Date: new Date("2017/1/2 2:00:00") };
        var item2 = { Date: new Date("2017/3/2 3:00:00") };
        var item3 = { Date: new Date("2017/5/2 5:00:00") };
        var item4 = { Date: new Date("2017/6/2 16:00:00") };

        //db.Save("Test", item1, function () { }, 0);
        //db.Save("Test", item2, function () { }, 0);
        //db.Save("Test", item3, function () { }, 0);
        //db.Save("Test", item4, function () { }, 0);

        var filter = { "Date": { $gt: new Date("2017/5/2 2:00:00") } };

        db.Find("Test", filter, 0, 100, function (end) {
            for (var i = 0; i < end.DataArray.length; i++) {
                var item = end.DataArray[i];
                console.log("Date " + item.Date.toLocaleString());
            }
        });
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