var $ = require('cheerio');
var PARAM_CHECKER = require("../Core/PARAM_CHECKER");

var SINAPageAnalyse = {}


SINAPageAnalyse.GetDataFromPage = function (dbItem) {
    var res = {ContentType:"未定义"};
    if ("大单追踪实时数据" === dbItem.ContentType) {
        res = {
            ContentType: dbItem.ContentType,
            MD5: dbItem.MD5,
            TaskID: dbItem.TaskID,
            Url: dbItem.Url,
            Data: eval(dbItem.Page.replace(/\0/g, ''))
        }
    }
    else if ("SINA日线数据" === dbItem.ContentType) {
        res = SINAPageAnalyse.GetKLineFromPage(dbItem);
        res.JiDu = dbItem.JiDu;
        res.Year = dbItem.Year;
    }

    return res;
} 

SINAPageAnalyse.GetKLineFromPage = function (dbItem) {
    var $page = $(dbItem.Page);
    var $table = $page.find("#FundHoldSharesTable");
    var res = { Rows: [] };

    var linkArray = [];
    var trArray = $table.find("tbody tr");
    for (var k = 1; k < trArray.length; k++) {
        var tdArray = $(trArray[k]).find("td");
        var link = $($(tdArray[0]).find("a")).attr("href").trim();
        var c1 = $(tdArray[0]).text().trim();
        var c2 = $(tdArray[1]).text().trim();
        var c3 = $(tdArray[2]).text().trim();
        var c4 = $(tdArray[3]).text().trim();
        var c5 = $(tdArray[4]).text().trim();
        var c6 = $(tdArray[5]).text().trim();
        var c7 = $(tdArray[6]).text().trim();

        linkArray.push(link);
        var item = {};
        item["日期"] = c1;
        item["开盘价"] = c2;
        item["最高价"] = c3;
        item["收盘价"] = c4;
        item["最低价"] = c5;
        item["交易量(股)"] = c6;
        item["交易金额(元)"] = c7;

        res.Rows.push(item);
    }
     
    res["历史成交明细"] = linkArray;
    return res;

}

module.exports = SINAPageAnalyse;