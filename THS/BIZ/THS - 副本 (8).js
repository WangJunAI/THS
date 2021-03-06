﻿var MongoDB = require("../Core/MongoDB");
var PARAM_CHECKER = require("../Core/PARAM_CHECKER");
var TOOLS = require("../Core/TOOLS")
var THS_BI = require("../BIZ/THS_BI"); 
var THSDB = require("../BIZ/THSDB");
var THSPageFundsTracking = require("../BIZ/THSPageFundsTracking");
var MemQueue = require("../Core/MemQueue");
var DataTools = require("../Core/DataTools");
var THSPageStock = require("../BIZ/THSPageStock");
var THSPageKLine = require("../BIZ/THSPageKLine");
var THSLHB = require("../BIZ/THSLHB");
var THSDataAnalyse = require("../BIZ/THSDataAnalyse");
var THSPageAnalyse = require("../BIZ/THSPageAnalyse");
var THSDataAnalyseV2 = require("../BIZ/THSDataAnalyseV2");
var THSMonitor = require("../BIZ/THSMonitor");
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
 
       // var sourceArray = [/*{ CollectionName: "DataFundsTracking1006", Filter: {} },*/ { CollectionName: "DataKLine1006", Filter: {} }, { CollectionName: "DataGGLHB1006", Filter: {} }, { CollectionName: "DataGGLHBMX1006", Filter: {} },
       ///* { CollectionName: "DataStockFunds1006", Filter: {} },*/{ CollectionName: "DataStockPage1006", Filter: { ContentType: "资金流向" } }/*,{ CollectionName: "THSDataAnalyse4", Filter: { } }*/]; ///要分析的数据集

        //var sourceArray = [{ CollectionName: "THSDataAnalyse5", Filter: { "ContentType": "上涨5%的前5日龙虎榜信息" } }]; ///要分析的数据集
        var sourceArray = [{ CollectionName: "THSDataAnalyse5", Filter: { "ContentType": "上涨5%的个股资金流向" } }]; ///要分析的数据集,前五日资金流入情况


        var callbackFind = function (pagerInfo) {
            ///获取一页数据以后
            var dataArray = pagerInfo.DataArray;
            while (0 < dataArray.length) {
                var qItem = dataArray.pop();
                ///将数据放入内存数据
                if ("DataKLine1006" === pagerInfo.CollectionName) {
                    THSDataAnalyse.LoadDataSet(pagerInfo.CollectionName, qItem);
                }
                else if ("DataGGLHB1006" === pagerInfo.CollectionName || "DataStockPage1006" === pagerInfo.CollectionName) {
                    THSDataAnalyse.LoadDataSet(pagerInfo.CollectionName, qItem, true, "StockCode");
                }
                else if ("DataGGLHBMX1006" === pagerInfo.CollectionName) {
                    THSDataAnalyse.LoadDataSet(pagerInfo.CollectionName, qItem, true, ["StockCode", "Date"]);
                } 
                else if ("THSDataAnalyse5" === pagerInfo.CollectionName) {
                    THSDataAnalyse.LoadDataSet(pagerInfo.CollectionName, qItem);
                } 
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
                //THSDataAnalyse.GetTargetStockByIncrease("5%");
                THSDataAnalyse.CalPirceTrend();
                THSDataAnalyse.Save();
            }
        }

        var callbackErr = function (err) { console.log("TraversePager " + err) };


        ///开始遍历
        var sourceItem = sourceArray.pop();
 
        db.TraversePager(sourceItem.CollectionName, sourceItem.Filter, 0, 100, callbackFind, callbackErr);
 

    },

    ///页面遍历V2
    TraversePager_Page: function () {
        return;
        var sourceDB = THSDB.GetMongo02();
        var targetDB = THSDB.GetMongo02();
        var targetCollectionName =THSDB.Mongo02Table.DataGGLHB+"V2"; //THSDB.Mongo02Table.DataStock;//THSDB.Mongo02Table.DataKLine;

        var sourceParam = MongoDB.ParamCreator.EmptyFindProcParam();
        sourceParam.DB = sourceDB;
        sourceParam.CollectionName = THSDB.Mongo02Table.PageGGLHB;//THSDB.Mongo02Table.PageStock;//THSDB.Mongo02Table.PageKLine;
        sourceParam.Filter = { };//ContentType:"资金流向"


        var callback = function (dbItem, pagerInfo) {
            var res = THSPageAnalyse.GetDataFromPage(dbItem);
            targetDB.Save(targetCollectionName, res, function (err,res,remaining) {
                console.log("存储队列剩余元素"+remaining);
            }, 0)
        }
        sourceDB.FindProc(sourceParam,callback,true);
    },

    ///页面遍历V2
    TraversePager_DataV2: function () {
 
        var sourceDB = THSDB.GetMongo02();
        var targetDB = THSDB.GetMongo02();
        var targetCollectionName = THSDB.Mongo02Table.DataInterResult;//THSDB.Mongo02Table.DataStock;//THSDB.Mongo02Table.DataKLine;//THSDB.Mongo02Table.DataGGLHB;

        var sourceParam = MongoDB.ParamCreator.EmptyFindProcParam();
        sourceParam.DB = sourceDB;
        sourceParam.CollectionName = THSDB.Mongo02Table.DataKLine;//THSDB.Mongo02Table.PageStock;//THSDB.Mongo02Table.PageKLine;//THSDB.Mongo02Table.PageGGLHB;
        sourceParam.Filter = { };


        var callback = function (dbItem, pagerInfo, isLastItem) {
            var res = THSDataAnalyseV2.LoadDataSource("日K线数据", dbItem);
            if (true === pagerInfo.IsLastPage && true === isLastItem) {
                console.log("开始分析数据...");
                THSDataAnalyseV2.GetTargetStockByIncrease("5%");
                console.log("保存中间结果...");
                THSDataAnalyseV2.SaveResult(targetDB);
            }
            //targetDB.Save(targetCollectionName, res, function (err, res, remaining) {
            //    console.log("存储队列剩余元素" + remaining);
            //}, 0)
        }
        sourceDB.FindProc(sourceParam, callback, true);
    },

    ///页面遍历V2
    TraversePager_DataV3: function () {
        return;
        var sourceDB = THSDB.GetMongo02();
        var targetDB = THSDB.GetMongo02();
        var targetCollectionName = THSDB.Mongo02Table.DataInterResult;//THSDB.Mongo02Table.DataStock;//THSDB.Mongo02Table.DataKLine;//THSDB.Mongo02Table.DataGGLHB;
        //var sourceParam1 = MongoDB.ParamCreator.EmptyFindProcParam();
        var sourceArray = [];

        //sourceArray.push({ CollectionName: "DataInterResult", Filter: { ContentType: "涨幅在5%以上的股票日线的前5日日线" }, DB: sourceDB, CacheName: "涨幅在5%以上的股票日线的前5日日线" , Pager:{ Index: 0, Size: 100 }});
        //sourceArray.push({ CollectionName: "DataGGLHB", Filter: { ContentType: "个股龙虎榜" }, DB: sourceDB, CacheName: "个股龙虎榜", Pager: { Index: 0, Size: 100 } });
        //sourceArray.push({ CollectionName: "DataGGLHB", Filter: { ContentType: "个股龙虎榜明细" }, DB: sourceDB, CacheName: "个股龙虎榜明细", Pager: { Index: 0, Size: 100 } });
        //sourceArray.push({ CollectionName: "DataStock", Filter: { ContentType: "资金流向" }, DB: sourceDB, CacheName: "资金流向", Pager: { Index: 0, Size: 100 } });
        sourceArray.push({ CollectionName: "DataInterResult", Filter: {  }, DB: sourceDB, CacheName: "涨幅在5%以上的股票日线的前5日日线", Pager: { Index: 0, Size: 100 } }); ///寻找前5日规律
          
        var callback = function (dbItem, pagerInfo, isLastItem) {
            console.log("当前遍历位置 "+pagerInfo.CollectionName+" "+ pagerInfo.CurrentIndex + " " + pagerInfo.PageSize);
            if ("DataInterResult" === pagerInfo.CollectionName && "涨幅在5%以上的股票日线的前5日日线" === pagerInfo.Filter.ContentType) { ///找这几天对应的龙虎榜信息
                THSDataAnalyseV2.LoadDataSource("涨幅在5%以上的股票日线的前5日日线", { StockCode: dbItem.StockCode, StockName: dbItem.StockName, TradingDate: dbItem.TradingDate, RefDate: dbItem.RefDate ,Interval:dbItem.Interval}, { AsDict: true, Keys: ["StockCode", "StockName", "TradingDate"] });
            }
            else if ("DataGGLHB" === pagerInfo.CollectionName && "个股龙虎榜" === pagerInfo.Filter.ContentType) {
                THSDataAnalyseV2.LoadDataSource("个股龙虎榜", dbItem);
            }
            else if ("DataGGLHB" === pagerInfo.CollectionName && "个股龙虎榜明细" === pagerInfo.Filter.ContentType) {
                THSDataAnalyseV2.LoadDataSource("个股龙虎榜明细", dbItem, { AsDict: true, Keys: "RefID" });
            }
            else if ("DataStock" === pagerInfo.CollectionName && "资金流向" === pagerInfo.Filter.ContentType) {
                THSDataAnalyseV2.LoadDataSource("资金流向", dbItem);
            }


            if (true === pagerInfo.IsLastPage && true === isLastItem) { ///若是最后一页的最后一个项目
                if (0 < sourceArray.length) {
                    console.log("开始加载下一个结果集...");
                    var param2 = sourceArray.pop();
                    sourceDB.FindProc(param2, callback, true);
                }
                else if (0 === sourceArray.length) {///若全部数据遍历完毕
                    console.log("分析及保存数据...");
                    //THSDataAnalyseV2.GetTargetStockPrev5LHB();///龙虎榜信息
                    //THSDataAnalyseV2.GetTargetStockPrev5Funds();///资金流信息
                    THSDataAnalyseV2.SaveResult(targetDB);
                    
                }
            }
        }

        ///开始第一个集合遍历
        var param1 = sourceArray.pop();
        sourceDB.FindProc(param1, callback, true);
    },

    TraversePager_DataV4: function () {
        return;
        var sourceDB = THSDB.GetMongo02();
        var targetDB = THSDB.GetMongo02();
        var targetCollectionName = THSDB.Mongo02Table.DataInterResult; 
         var sourceArray = [];

         sourceArray.push({ CollectionName: "DataInterResult", Filter: {}, DB: sourceDB, CacheName: "中间结果", Pager: { Index: 0, Size: 100 } }); ///寻找前5日规律

        var callback = function (dbItem, pagerInfo, isLastItem) {
            console.log("TraversePager_DataV4 当前遍历位置 " + pagerInfo.CollectionName + " " + pagerInfo.CurrentIndex + " " + pagerInfo.PageSize);
            if ("DataInterResult" === pagerInfo.CollectionName ) { ///找这几天对应的龙虎榜信息
                THSDataAnalyseV2.LoadDataSource("中间结果",dbItem);
            } 

            if (true === pagerInfo.IsLastPage && true === isLastItem) { ///若是最后一页的最后一个项目
                if (0 < sourceArray.length) {
                    console.log("开始加载下一个结果集...");
                    var param2 = sourceArray.pop();
                    sourceDB.FindProc(param2, callback, true);
                }
                else if (0 === sourceArray.length) {///若全部数据遍历完毕
                    console.log("分析及保存数据..."); 
                    THSDataAnalyseV2.GetLaw();
                    THSDataAnalyseV2.SaveResult(targetDB);

                }
            }
        }

        ///开始第一个集合遍历
        var param1 = sourceArray.pop();
        sourceDB.FindProc(param1, callback, true);
    },

    TraversePager_ForMonitor: function () {
     
        var sourceDB = THSDB.GetMongo02();
        var targetDB = THSDB.GetMongo02();
        var targetCollectionName = THSDB.Mongo02Table.DataInterResult;
        var sourceArray = [];

        sourceArray.push({ CollectionName: "StockBaseInfo", Filter: {}, DB: sourceDB, CacheName: "股票字典", Pager: { Index: 0, Size: 100 } }); ///寻找前5日规律

        var callback = function (dbItem, pagerInfo, isLastItem) {
            console.log("TraversePager_ForMonitor 当前遍历位置 " + pagerInfo.CollectionName + " " + pagerInfo.CurrentIndex + " " + pagerInfo.PageSize);
            if ("StockBaseInfo" === pagerInfo.CollectionName) {  
                THSMonitor.Data.Dict[dbItem.StockCode] = dbItem.StockName;
            }

            if (true === pagerInfo.IsLastPage && true === isLastItem) { ///若是最后一页的最后一个项目
                THSMonitor.WatchingLHB();
            }
        }

        ///开始第一个集合遍历
        var param1 = sourceArray.pop();
        sourceDB.FindProc(param1, callback, true);
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