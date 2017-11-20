var MongoDB = require("../Core/MongoDB");
var PARAM_CHECKER = require("../Core/PARAM_CHECKER");
var TOOLS = require("../Core/TOOLS")
var THSDB = require("../BIZ/THSDB");
var THSPageFundsTracking = require("../BIZ/THSPageFundsTracking");
var DataTools = require("../Core/DataTools");
var THSPageStock = require("../BIZ/THSPageStock");
var THSPageKLine = require("../BIZ/THSPageKLine");
var THSLHB = require("../BIZ/THSLHB");
var $ = require('cheerio');
var SINAPageAnalyse = require("../BIZ/SINAPageAnalyse");
var THSPageAnalyse = require("../BIZ/THSPageAnalyse");
///同花顺业务处理
var THS = {
    Task:[],
    ///页面遍历V2 一次性计算完全部数据
    TraversePager_Page: function () {

        var sourceDB = THSDB.GetMongo("PageSource");
        var targetDB = THSDB.GetMongo("DataSource");
        var targetCollectionMap = { "PageKLine": "DataKLine", "PageGGLHB": "DataGGLHB", "PageStock": "DataStock" };
        var sourceArray = [];

        sourceArray.push({ CollectionName: "PageKLine", Filter: {}, DB: sourceDB, Pager: { Index: 0, Size: 100 } });
        //sourceArray.push({ CollectionName: "PageGGLHB", Filter: {}, DB: sourceDB, Pager: { Index: 0, Size: 100 } });
        //sourceArray.push({ CollectionName: "PageStock", Filter: {}, DB: sourceDB, Pager: { Index: 0, Size: 100 } });


        var callback = function (dbItem, pagerInfo, isLastItem) {
            //if (true != pagerInfo.IsEmpty) {
                ///若集合不为空
                console.log("TraversePager_Page 当前遍历位置 " + pagerInfo.CollectionName + " " + pagerInfo.CurrentIndex + " " + pagerInfo.PageSize);
                var res = THSPageAnalyse.GetDataFromPage(dbItem, pagerInfo);

                targetDB.Save(targetCollectionMap[pagerInfo.CollectionName], res, function (err, res, remaining) {
                    if (0 === remaining) {
                        if (true === pagerInfo.IsLastPage && true === pagerInfo.IsLastItem) {
                            sourceArray.shift();///抛弃掉
                            if (0 < sourceArray.length) {
                                ///若没有结束 开始处理第二个集合
                                var param2 = sourceArray.slice(0, 1)[0];
                                sourceDB.FindProc(param2, callback, false);
                                console.log("开始加载下一个结果集... " + param2.CollectionName);

                            }
                            else if (0 === sourceArray.length) {///若全部数据遍历完毕
                                console.log("数据遍历完毕");
                                THS.ExcuteNextTask();
                            }
                        }
                        else {
                            var param3 = sourceArray.slice(0, 1)[0];
                            param3.Pager.Index = pagerInfo.NextIndex;
                            sourceDB.FindProc(param3, callback, false);
                        }
                    }
                });
            //}
            //else if (true === pagerInfo.IsEmpty) {
            //    THS.ExcuteNextTask();
            //}
        }

        ///开始第一个集合遍历
        param1 = sourceArray.slice(0, 1)[0];
        sourceDB.FindProc(param1, callback, false);
    },  

    ///新浪大单
    TraversePager_PageSINA: function () {
        var sourceDB = THSDB.GetMongo("SINA");
        var targetDB = THSDB.GetMongo("DataSource");
        var targetCollectionMap = { "DaDan": "DataDaDan"};
        var sourceArray = [];

        sourceArray.push({ CollectionName: "DaDan", Filter: {}, DB: sourceDB, Pager: { Index: 0, Size: 100 } });
 
        var callback = function (dbItem, pagerInfo, isLastItem) {
            console.log("TraversePager_PageSINA 当前遍历位置 " + pagerInfo.CollectionName + " " + pagerInfo.CurrentIndex + " " + pagerInfo.PageSize);
            var array = [];
            if ("DaDan" === pagerInfo.CollectionName) {
                var res = {
                    ContentType: dbItem.ContentType,
                    MD5: dbItem.MD5,
                    TaskID: dbItem.TaskID,
                    Url: dbItem.Url,
                    Data: eval(dbItem.Page.replace(/\0/g, ''))
                }
                array.push(res);
            }

            while (0 < array.length) {
                var arrItem = array.shift();
                targetDB.Save(targetCollectionMap[pagerInfo.CollectionName], arrItem, function (err, res, remaining) {
                    if (0 === remaining) {
                        ///全部保存完毕再开始下一页
                        if (true === pagerInfo.IsLastPage && true === pagerInfo.IsLastItem) {
                            sourceArray.shift();///抛弃掉
                            if (0 < sourceArray.length) {
                                ///若没有结束 开始处理第二个集合 
                                var param2 = sourceArray.slice(0, 1)[0];
                                sourceDB.FindProc(param2, callback, false);
                                console.log("开始加载下一个结果集... " + param2.CollectionName);

                            }
                            else if (0 === sourceArray.length) {///若全部数据遍历完毕
                                console.log("数据遍历完毕，执行下一步骤");
                                THS.ExcuteNextTask();
                            }
                        }
                        else {
                            var param3 = sourceArray.slice(0, 1)[0];
                            param3.Pager.Index = pagerInfo.NextIndex;
                            sourceDB.FindProc(param3, callback, false);
                        }
                    }
                });
            }
        }
        ///开始第一个集合遍历 
        param1 = sourceArray.slice(0, 1)[0];
        sourceDB.FindProc(param1, callback, false);
    },
   
    Run: function () {
        THS.Task.push(THS.TraversePager_Page);///页面数据抽取 
        //THS.Task.push(THS.TraversePager_PageSINA);///新浪大单数据
        THS.ExcuteNextTask();///执行下一步
    },

    ///执行下一个任务
    ExcuteNextTask: function () {
        if (0 < THS.Task.length) {
            var task = THS.Task.shift();
            task();
        }
        else {
            console.log("所有任务全部结束.")
        }
    },
 




 

}

module.exports = THS;