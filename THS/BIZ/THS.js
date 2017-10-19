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
 
///同花顺业务处理
var THS = {

 

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
 

    ///页面遍历V2 一次性计算完全部数据
    TraversePager_DataV3: function () {
 
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
                THSDataAnalyseV2.LoadDataSource("日线数据字典", dbItem); ///加载日线数据，用于龙虎榜查找后
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

                    ///若没有结束 开始处理第二个集合
                    var param2 = sourceArray.shift();
                     
                    sourceDB.FindProc(param2, callback, true);
                    console.log("开始加载下一个结果集... " + param2.CollectionName);

                }
                else if (0 === sourceArray.length) {///若全部数据遍历完毕
                    console.log("分析及保存数据...");
                    //THSDataAnalyseV2.GetTargetStockPrev5LHB();///龙虎榜信息
                    //THSDataAnalyseV2.GetTargetStockPrev5Funds();///资金流信息
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