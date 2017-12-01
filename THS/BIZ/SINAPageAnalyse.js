var $ = require('cheerio');
var PARAM_CHECKER = require("../Core/PARAM_CHECKER");

var SINAPageAnalyse = {}


SINAPageAnalyse.GetDataFromPage = function (dbItem) {
    var res = {ContentType:"未定义"};
    if ("大单追踪实时数据" === dbItem.ContentType) {
        res = {
            Rows: eval(dbItem.Page.replace(/\0/g, ''))
        }
    }
    else if ("SINA个股历史交易" === dbItem.ContentType) {
        res = SINAPageAnalyse.GetKLineFromPage(dbItem);
        res.JiDu = dbItem.JiDu;
        res.Year = dbItem.Year;
    }

    return res;
} 

///获取日线数据
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

///获取融资融券信息
///Url http://vip.stock.finance.sina.com.cn/q/go.php/vInvestConsult/kind/rzrq/index.phtml?symbol=sz002230&bdate=2017-01-01&edate=2017-11-24
SINAPageAnalyse.GetRZRQFromPage = function (dbItem) {
    var $page = $(dbItem.Page);
    var $table = $page.find("#dataTable");
    var res = { Rows: [] };
    var trArray = $table.find("tbody tr");
    for (var k = 3; k < trArray.length;k++) {
        var tdArray = $(trArray[k]).find("td");
        var c1 = $(tdArray[0]).text().trim();//序号
        var c2 = $(tdArray[1]).text().trim();//日期
        var c3 = $(tdArray[2]).text().trim();//融资余额
        var c4 = $(tdArray[3]).text().trim();///融资买入额
        var c5 = $(tdArray[4]).text().trim();///融资偿还额
        var c6 = $(tdArray[5]).text().trim();///融券余量金额	
        var c7 = $(tdArray[6]).text().trim();///融券余量
        var c8 = $(tdArray[7]).text().trim();///融券卖出量
        var c9 = $(tdArray[8]).text().trim();///融券偿还量
        var c10 = $(tdArray[9]).text().trim();///融券余额

        var item = {};
        item["序号"] = c1;
        item["日期"] = c2;
        item["融资余额"] = c3;
        item["融资买入额"] = c4;
        item["融资偿还额"] = c5;
        item["融券余量金额"] = c6;
        item["融券余量"] = c7;
        item["融券卖出量"] = c8;
        item["融券偿还量"] = c9;
        item["融券余额"] = c10;
        res.Rows.push(item);

    }

    return res;
}

///获取个股交易明细信息
///http://vip.stock.finance.sina.com.cn/quotes_service/view/vMS_tradedetail.php?symbol=sh600048&date=2017-11-24&page=45
SINAPageAnalyse.GetGGJYMX = function () {
    var $page = $(dbItem.Page);
    var $table = $page.find("#dataTable");
    var res = { Rows: [] };
    var trArray = $table.find("tbody tr");
    for (var k = 3; k < trArray.length; k++) {
        var tdArray = $(trArray[k]).find("td,th");
        var c1 = $(tdArray[0]).text().trim();//成交时间
        var c2 = $(tdArray[1]).text().trim();//成交价	
        var c3 = $(tdArray[2]).text().trim();//涨跌幅
        var c4 = $(tdArray[3]).text().trim();///价格变动
        var c5 = $(tdArray[4]).text().trim();///成交量(手)	
        var c6 = $(tdArray[5]).text().trim();///成交额(元)	
        var c7 = $(tdArray[6]).text().trim();///性质

        var item = {};
        item["成交时间"] = c1;
        item["成交价"] = c2;
        item["涨跌幅"] = c3;
        item["价格变动"] = c4;
        item["成交量(手)"] = c5;
        item["成交额(元)"] = c6;
        item["性质"] = c7;
        res.Rows.push(item);

    }

    return res;

}



module.exports = SINAPageAnalyse;