'use strict';
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
ths.TraversePage();
//ths.TraverseData();

var wiki = require("./BIZ/WIKI");
//wiki.TraverseIndex();

 
console.log('Hello world');
