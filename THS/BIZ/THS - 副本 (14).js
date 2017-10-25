var MongoDB = require("../Core/MongoDB");
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
var WJMutilTask = require("../Core/WJMutilTask");
 
///同花顺业务处理
var THS = {
 
    ///页面遍历V2 一次性计算完全部数据
    TraversePager_PageV2: function () {

        var sourceDB = THSDB.GetMongo02();
        var targetDB = THSDB.GetMongo02();
        var targetCollectionMap = { "PageKLine": "DataKLine", "PageGGLHB": "DataGGLHB", "PageStock": "DataStockDD" };
        var sourceArray = [];

        //sourceArray.push({ CollectionName: "PageKLine", Filter: {  }, DB: sourceDB, Pager: { Index: 0, Size: 100 } });
        //sourceArray.push({ CollectionName: "PageGGLHB", Filter: {  }, DB: sourceDB, Pager: { Index: 0, Size: 100 } });
        sourceArray.push({ CollectionName: "PageStock", Filter: { "ContentType":"首页概览" }, DB: sourceDB, Pager: { Index: 0, Size: 100 } });


        var callback = function (dbItem, pagerInfo, isLastItem) {
            console.log("TraversePager_PageV2 当前遍历位置 " + pagerInfo.CollectionName + " " + pagerInfo.CurrentIndex + " " + pagerInfo.PageSize);

            var res = THSPageAnalyse.GetDataFromPage(dbItem, pagerInfo);
 
            targetDB.Save(targetCollectionMap[pagerInfo.CollectionName], res, function (err, res, remaining) {
                if (0 === remaining) {
                    if (0 < sourceArray.length) {
                        ///若没有结束 开始处理第二个集合
                        var param2 = sourceArray.shift();

                        sourceDB.FindProc(param2, callback, true);
                        console.log("开始加载下一个结果集... " + param2.CollectionName);

                    }
                    else if (0 === sourceArray.length) {///若全部数据遍历完毕
                        console.log("数据遍历完毕");
                    }
                }
            });


           
        }

        ///开始第一个集合遍历
        var param1 = sourceArray.shift();
        sourceDB.FindProc(param1, callback, true);
    },

    TraversePager_MutilDTo2D: function () {

        var sourceDB = THSDB.GetMongo02();
        var targetDB = THSDB.GetMongo02();
        var targetCollectionMap = { "DataKLine": "DataKLine2D", "DataGGLHB": "DataGGLHB2D", "DataStock": "DataStock2D" };
        var sourceArray = [];

        sourceArray.push({ CollectionName: "DataKLine", Filter: {}, DB: sourceDB, Pager: { Index: 0, Size: 1 } });
        sourceArray.push({ CollectionName: "DataGGLHB", Filter: {}, DB: sourceDB, Pager: { Index: 0, Size: 1 } });
        sourceArray.push({ CollectionName: "DataStock", Filter: {}, DB: sourceDB, Pager: { Index: 0, Size: 1 } });


        var callback = function (dbItem, pagerInfo, isLastItem) {
            console.log("TraversePager_MutilDTo2D 当前遍历位置 " + pagerInfo.CollectionName + " " + pagerInfo.CurrentIndex + " " + pagerInfo.PageSize);

            var arr = TOOLS.JSON.MultiDTo2D(dbItem);///二维化
            while (0 < arr.length) {
                var arrItem = arr.shift(); 

                targetDB.Save(targetCollectionMap[pagerInfo.CollectionName], arrItem, function (err, res, remaining) {
                    if (0 === remaining) {
                        if (0 < sourceArray.length) {
                            ///若没有结束 开始处理第二个集合
                            var param2 = sourceArray.shift();

                            sourceDB.FindProc(param2, callback, true);
                            console.log("开始加载下一个结果集... " + param2.CollectionName);

                        }
                        else if (0 === sourceArray.length) {///若全部数据遍历完毕
                            console.log("数据遍历完毕");
                        }
                    }
                });
            }





        }

        ///开始第一个集合遍历
        var param1 = sourceArray.shift();
        sourceDB.FindProc(param1, callback, true);
    },

    ///页面遍历V2 一次性计算完全部数据
    TraversePager_Data: function () {
 
        var sourceDB = THSDB.GetMongo02();
        var targetDB = THSDB.GetMongo02();
        var targetCollectionName = THSDB.Mongo02Table.DataInterResult;
        var sourceArray = [];

        sourceArray.push({ CollectionName: "DataKLine", Filter: { ContentType: "日线数据" }, DB: sourceDB, Pager: { Index: 0, Size: 100 } });
        sourceArray.push({ CollectionName: "DataGGLHB", Filter: { ContentType: "个股龙虎榜" }, DB: sourceDB,   Pager: { Index: 0, Size: 100 } });
        sourceArray.push({ CollectionName: "DataGGLHB", Filter: { ContentType: "个股龙虎榜明细" }, DB: sourceDB,  Pager: { Index: 0, Size: 100 } });
        sourceArray.push({ CollectionName: "DataStock", Filter: { ContentType: "资金流向" }, DB: sourceDB,  Pager: { Index: 0, Size: 100 } });
  
          
        var callback = function (dbItem, pagerInfo, isLastItem) {
            console.log("TraversePager_DataV3 当前遍历位置 "+pagerInfo.CollectionName+" "+ pagerInfo.CurrentIndex + " " + pagerInfo.PageSize);
            if ("DataKLine" === pagerInfo.CollectionName && "日线数据" === pagerInfo.Filter.ContentType) { 
                THSDataAnalyseV2.LoadDataSource("日线数据", dbItem); ///加载日线数据，用于查找目标股票日K线
                ///制作日线字典
                for (var k = 0; k < dbItem.Data.length; k++) {
                    var dataItem = dbItem.Data[k];
                    dataItem.Key = dbItem.StockCode + dbItem.StockName + dataItem.TradingDate.toString();
                    THSDataAnalyseV2.LoadDataSource("日线数据字典", dataItem, { AsDict: true, Keys: "Key" });
                }

            }
            else if ("DataGGLHB" === pagerInfo.CollectionName && "个股龙虎榜" === pagerInfo.Filter.ContentType) {
                THSDataAnalyseV2.LoadDataSource("个股龙虎榜", dbItem);
            }
            else if ("DataGGLHB" === pagerInfo.CollectionName && "个股龙虎榜明细" === pagerInfo.Filter.ContentType) {
                 ///制作个股龙虎榜明细字典
                for (var k = 0; k < dbItem.Rows.length; k++) {
                    var rowItem = dbItem.Rows[k];
                    if (7 === TOOLS.JSON.KeyCount(rowItem)) {
                        rowItem.TradingDate = new Date(dbItem.Date.replace(/-/g, "/"));
                        rowItem.StockCode = dbItem.StockCode;
                        rowItem.StockName = dbItem.StockName;
                        rowItem.ContentType = dbItem.ContentType;
                        rowItem.Date = dbItem.Date;
                        rowItem.Key = rowItem.StockCode + rowItem.StockName + rowItem.TradingDate.toString();
                        THSDataAnalyseV2.LoadDataSource("个股龙虎榜明细", rowItem, { AsDict: true, Keys: "Key" });
                    }
                }
            }
            else if ("DataStock" === pagerInfo.CollectionName && "资金流向" === pagerInfo.Filter.ContentType) {
                THSDataAnalyseV2.LoadDataSource("资金流向", dbItem);
            }
  
            if (true === pagerInfo.IsLastPage && true === isLastItem) { ///若是最后一页的最后一个项目
                if (0 < sourceArray.length) { 

                    ///若没有结束 开始处理第二个集合
                    var param2 = sourceArray.shift();
                     
                    sourceDB.FindProc(param2, callback, true);
                    console.log("开始加载下一个结果集... " + param2.CollectionName);

                }
                else if (0 === sourceArray.length) {///若全部数据遍历完毕
                    console.log("分析及保存数据...");
                    THSDataAnalyseV2.DataAnalyse();
                    THSDataAnalyseV2.SaveResult(targetDB);
                    
                }
            }
        }

        ///开始第一个集合遍历
        var param1 = sourceArray.shift();
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