﻿'use strict';
//var http = require("./Core/HttpService");
//http.Get("http://data.10jqka.com.cn/ifmarket/lhbggxq/report/2017-03-27/", "gbk", function (res) {
//    console.log(res);
//});

var tool = require("./Core/TOOLS");
var res = tool.DATE.GetNow();
res = tool.DATE.GetDateArray();

var news = require("./BIZ/NEWS");
//news.Load();
var ths = require("./BIZ/THS");
 
//ths.ClearPageFundsTracking();///数据清理

//ths.TraversePager_PageKLine();///日线图
//ths.TraversePager_PageStock();///个股详情
//ths.TraversePager_FundsTracking();///大单追踪
///ths.TraversePager_PageGGLHB();///个股龙虎榜
//ths.TraversePager_PageGGLHBMX();///个股龙虎榜明细
//ths.TraversePager_PageStockFunds();///资金流
ths.TraversePager_Data();
//ths.Test();


var log = require("../THS/Core/LOG");

 




//var wiki = require("./BIZ/WIKI");
//wiki.TraverseIndex();

 
console.log('Hello world');
