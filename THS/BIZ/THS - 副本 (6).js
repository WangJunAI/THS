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
var count = 0;
///同花顺业务处理
var THS = {

    Dict: {},
    DB: null,
    QueueW: [],
    SavePageData: function (item) {
        {
            var collectionName = THS.Const.Collection.PageData;///原始页面所在集合
            var db = THS.GetDB();
            db.Save(collectionName, item, function () { console.log("保存完毕" + item.StockName) }, 0);
        }
    },
    TraversePage: function () { 
        var db = THSDB.GetMongo01();
         
        collectionName = THSDB.Mongo01Table.Page;///

        ///日志计时
        THS.Log.Start("页面遍历TraversePage " + collectionName);
        //db.Traverse(collectionName, { $or: [/*{ "ContentType": "首页概览" },*//* { "ContentType": "资金流向" },*/ /*{ "ContentType": "公司资料" }, *//*{ "ContentType": "新闻公告" },*//*{ "ContentType": "主力持仓" },*/ /*{ "ContentType": "公司大事" }, */{ "ContentType": "日线数据" }] }, function (data) {//"StockCode": "002417" 

        db.Traverse(collectionName, { $or: [/*{ "ContentType": "首页概览" },*/ { "ContentType": "资金流向" }, { "ContentType": "日线数据" }] }, function (data) {//"StockCode": "002417" { "ContentType": "首页概览" }, { "ContentType": "资金流向" }
            var res = {};
            res.StockCode = data.StockCode;
            res.StockName = data.StockName;
            res.ContentType = data.ContentType;
            console.log("Traverse 正在分析页面 " + collectionName + "  " + (++count) + "  " + res.StockCode + res.StockName + " " + data.ContentType);

            if ("首页概览" === data.ContentType) {
                var home = THSPageStock.AnalysePageHome(data);///OK
                res.Home = home;
            }
            else if ("资金流向" === data.ContentType) {
                var funds = THSPageStock.AnalysePageFunds(data);///OK
                res.Funds = funds;
            }
            else if ("公司资料" === data.ContentType) {
                var company = THSPageStock.AnalysePageCompany(data);///OK
                res.Info = company;
            }
            else if ("新闻公告" === data.ContentType) {
                var news = THSPageStock.AnalysePageNews(data);//OK
                res.News = news;
            }
            //else if ("财务分析" === data.ContentType) {
            //    //THSPageStock.AnalysePageFinance(data);
            //}
            //else if ("经营分析" === data.ContentType) {
            //    //THSPageStock.AnalysePageOperate(data);
            //}
            //else if ("股东股本" === data.ContentType) {
            //    //var holder = THSPageStock.AnalysePageHolder(data);

            //}
            else if ("主力持仓" === data.ContentType) {
                var position = THSPageStock.AnalysePagePosition(data);//OK
                res.Position = position;
            }
            else if ("公司大事" === data.ContentType) {
                var event = THSPageStock.AnalysePageEvent(data);//OK
                res.Event = event;
            }
            //else if ("分红融资" === data.ContentType) {
            //    //THSPageStock.AnalysePageBonus(data);
            //}
            //else if ("价值分析" === data.ContentType) {
            //    //THSPageStock.AnalysePageWorth(data);
            //}
            //else if ("行业分析" === data.ContentType) {
            //    //THSPageStock.AnalysePageField(data);
            //}
            else if ("日线数据" === data.ContentType) {
                var dayLine = THSPageKLine.AnalysePageDayLine(data);///OK
                res.DayLine = dayLine;
            }

            //THS.SavePageData(res);
            THS.QueueW.push(res);
            console.log("Queue.Length " + THS.QueueW.length);
        }, function (endMsg) {
            console.log("遍历结束");

            while (0 < THS.QueueW.length) {
                var q = THS.QueueW.pop();
                console.log("开始保存一个数据" + q.StockName);
                THS.SavePageData(q);
            }


            THS.Log.Stop("页面遍历TraversePage");
        }, function (errMsg) {
            console.log("出错");
        });
    },

    ///页面数据分析
    TraverseData: function () {
        ///日志计时
        THS.Log.Start("页面数据遍历TraverseData");

        var db = THS.GetDB();
        var collectionName = THS.Const.Collection.PageData;
        db.Traverse(collectionName, {}, function (data) {
            var res = {};
            res.StockCode = data.StockCode;
            res.StockName = data.StockName;

            console.log("已获取处理 TraverseData  " + collectionName + "  " + res.StockCode + "--" + res.StockName + " " + data.ContentType);
            if (data.ContentType === "首页概览") {
                //THS_BI.OverallAnalyse(res.StockCode, res.StockName, data.Home.Company);
            }
            else if (data.ContentType === "资金流向") {
                //THS_BI.FundsAnalyse(res.StockCode, res.StockName, data.Funds);
            }
            else if (data.ContentType === "日线数据") {
                //THS_BI.CalTargetStock(res.StockCode, res.StockName, data.DayLine);
                THSHistoryTest.PrepareData(data);
            }

        }, function (endMsg) {
            THS.Log.Stop("页面数据遍历TraverseData");
            console.log("遍历结束");
            //THS_BI.Save();
            var historyTest = THSHistoryTest.FindIncrease();
            for (var i = 0; i < historyTest.length; i++) {
                db.Save(THS.Const.Collection.AnalysisResult, historyTest[i], function () { console.log("历史回测数据保存完毕" + i) }, 0);
            }


        }, function (errMsg) {
            console.log("出错");
        });
    },

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

    ///清理垃圾数据
    ClearPageFundsTracking: function () {
        var db = THSDB.GetMongo01();
        collectionName = THSDB.Mongo01Table.PageFundsTracking;

        //DataTools.LogDuplicateData(db, collectionName, ["Page"]);
        DataTools.RemoveDuplicateData(db, DataTools.CollectionName, ["Page"]);
    },
 
 



 

}

module.exports = THS;