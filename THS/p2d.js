﻿'use strict';
//var http = require("./Core/HttpService");
//http.Get("http://data.10jqka.com.cn/ifmarket/lhbggxq/report/2017-03-27/", "gbk", function (res) {
//    console.log(res);
//});

var tool = require("./Core/TOOLS");
var res = tool.DATE.GetNow();
res = tool.DATE.GetDateArray();

var news = require("./BIZ/NEWS");
 
var ths = require("./BIZ/THS");
 
 
ths.TraversePager_PageV2();
 
 
 




var log = require("../THS/Core/LOG");

var wj = require("../THS/Core/WJMutilTask"); 

//wj.Test();

var lhbMonitor = require("../THS/BIZ/THSMonitor");
///lhbMonitor.WatchingLHB();
//ths.TraversePager_ForMonitor();

//var wiki = require("./BIZ/WIKI");
//wiki.TraverseIndex();

 
console.log('Hello world');
