var $ = require('cheerio');
var PARAM_CHECKER = require("../Core/PARAM_CHECKER");
var TOOLS = require("../Core/TOOLS");
var SINAPageAnalyse = {}


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
        item["日期"] = TOOLS.Convertor.ToDate(c1);
        item["开盘价"] = parseFloat(c2);
        item["最高价"] = parseFloat(c3);
        item["收盘价"] = parseFloat(c4);
        item["最低价"] = parseFloat(c5);
        item["交易量(股)"] = parseInt(c6);
        item["交易金额(元)"] = parseInt(c7);

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

    for (var k = 3; k < trArray.length; k++) {
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
SINAPageAnalyse.GetGGJYMX = function (dbItem) {
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

///获取个股财务摘要
///http://money.finance.sina.com.cn/corp/go.php/vFD_FinanceSummary/stockid/601888.phtml
SINAPageAnalyse.GetCWZY = function (dbItem) {
    var $page = $(dbItem.Page);
    var trArray = $page.find("#FundHoldSharesTable tbody tr");
    var array = [];
    var item = {};
    var length = trArray.length;

    for (var k = 0; k < length; k++) {
        var tr = trArray[k];
        var key = $(tr).find("td").first().text().trim();
        var value = $(tr).find("td").last().text().trim();

        if ("截止日期" === key) {
            item = {};
            array.push(item);
        }

        if (true === PARAM_CHECKER.IsNotEmptyString(key)) {
            item[key] = value;
        }

        if (true === PARAM_CHECKER.Contains("元", value)) {
            item[key] = parseFloat(value.replace("元", "").replace(/,/g, ""));
        }
        else if (PARAM_CHECKER.IsDate(value)) {
            item[key] = new Date(value);
        }
    }


    return array;
}

///获取大单数据
SINAPageAnalyse.GetDaDan = function (dbItem) {
    if (PARAM_CHECKER.IsNotEmptyString(dbItem.Page)) {
        var src = eval(dbItem.Page.replace(/\0/g, ''));
        if (PARAM_CHECKER.IsArray(src)) {
            var resArray = [];
            for (var k = 0; k < src.length; k++) {
                var item = {};
                item["StockCode"] = src[k]["symbol"].substring(2);
                item["StockName"] = src[k]["name"].replace(/ /g, "");
                item["交易时间"] = src[k]["ticktime"];
                item["成交价"] = parseFloat(src[k]["price"]);
                item["成交量"] = parseInt(src[k]["volume"]);
                item["之前价格"] = parseFloat(src[k]["prev_price"]);
                item["成交类型"] = src[k]["kind"];

                resArray.push(item);
            }
            return resArray;
        }
    }
    return [];
}

///SINA股市雷达
SINAPageAnalyse.GetStockRadar = function (dbItem) {
    var list = [];
    if (PARAM_CHECKER.IsNotEmptyString(dbItem.Page)) {
        var $page = $(dbItem.Page);
        var trArray = $page.find("tbody tr");
        for (var k = 0; k < trArray.length; k++) {
            var thArray = $(trArray[k]).find("th");

            var th1 = $(thArray[0]).text().trim();
            var th2 = $(thArray[1]).text().trim();
            var th3 = $(thArray[2]).text().trim();
            var th4 = $(thArray[3]).text().trim();
            var th5 = $(thArray[4]).text().trim();
            var th6 = $(thArray[5]).text().trim();
            var th7 = $(thArray[6]).text().trim();
            var th8 = $(thArray[7]).text().trim();
            var th9 = $(thArray[4]).text().trim();
            var th10 = $(thArray[5]).text().trim();
            var th11 = $(thArray[6]).text().trim();
            var th12 = $(thArray[7]).text().trim();

            var item1 = {};
            var item2 = {};
            var item3 = {};
            item1["异动时间"] = th1;
            item1["股票代码"] = th2;
            item1["股票简称"] = th3;
            item1["异动信息"] = th4;

            item2["异动时间"] = th5;
            item2["股票代码"] = th6;
            item2["股票简称"] = th7;
            item2["异动信息"] = th8;

            item3["异动时间"] = th9;
            item3["股票代码"] = th10;
            item3["股票简称"] = th11;
            item3["异动信息"] = th12;

            list.push(item1);
            list.push(item2);
            list.push(item3);
        } 
    }

    return list;
}

///公司简介
SINAPageAnalyse.GetGSJJ = function (dbItem) {
    var $page = $(dbItem.Page);
    var trArray = $page.find("#comInfo1 tbody tr");
    var item = {};
    for (var k = 0; k < trArray.length; k++) {
        var tdArray = $(trArray[k]).find("td");
        if (2 == tdArray.length) {
            var key = $(tdArray[0]).text().replace(/：/g, "").trim();
            var value = $(tdArray[1]).text().trim();
            item[key] = value;
        }
        else if (4 == tdArray.length) {
            var key1 = $(tdArray[0]).text().replace(/：/g, "").trim();
            var key2 = $(tdArray[2]).text().replace(/：/g, "").trim();
            var value1 = $(tdArray[1]).text().trim();
            var value2 = $(tdArray[3]).text().trim();
            item[key1] = value1;
            item[key2] = value2;
        }
    }


    item["上市日期"] = TOOLS.Convertor.ToDate(item["上市日期"]);

    return item;
}

///公司简介
SINAPageAnalyse.GetBKGN = function (dbItem) {
    var $page = $(dbItem.Page);
    var tbodyArray = $page.find("#con02-0 tbody");
    var item = { "所属板块": [], "所属概念": [] };
    if (2 == tbodyArray.length) {
        var trArray1 = $(tbodyArray[0]).find("tr");
        if (4 <= trArray1.length) {
            for (var k = 2; k < trArray1.length - 2 - 1; k++) {
                var value = $(trArray1[k]).find("td").first().text().trim();
                item["所属板块"].push(value);
            }
        }

        var trArray2= $(tbodyArray[1]).find("tr");
        if (3 <= trArray2.length) {
            for (var k = 2; k < trArray2.length - 2 ; k++) {
                var value = $(trArray2[k]).find("td").first().text().trim();
                item["所属概念"].push(value);
            }
        }
    }
    return item;
}


///从页面获取数据
SINAPageAnalyse.GetDataFromPage = function (dbItem) {
    if (true === PARAM_CHECKER.IsNotEmptyString(dbItem.Page)) {
        if ("SINA财务摘要" === dbItem.ContentType) {
            dbItem["PageData"] = SINAPageAnalyse.GetCWZY(dbItem);
        }
        else if ("SINA大单" === dbItem.ContentType) {
            dbItem["PageData"] = SINAPageAnalyse.GetDaDan(dbItem);
        }
        else if ("SINA历史交易" == dbItem.ContentType) {
            dbItem["PageData"] = SINAPageAnalyse.GetKLineFromPage(dbItem);
        }
        else if ("SINA公司简介" == dbItem.ContentType) {
            dbItem["PageData"] = SINAPageAnalyse.GetGSJJ(dbItem);
        }
        else if ("SINA板块概念" == dbItem.ContentType) {
            dbItem["PageData"] = SINAPageAnalyse.GetBKGN(dbItem);
        }
        else if ("SINA股市雷达" === dbItem.ContentType) {
            dbItem["PageData"] = SINAPageAnalyse.GetStockRadar(dbItem);
        }
        dbItem.Page = "数据太长服务端已清空";

        if (undefined == dbItem._ProcResult) {
            dbItem._ProcResult = "OK";
        }
    }
    else {
        dbItem._ProcResult = "Page字段不是非空html字符串";
    }
    return dbItem;
}



module.exports = SINAPageAnalyse;