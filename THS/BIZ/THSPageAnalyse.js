var THSPageKLine = require("../BIZ/THSPageKLine");
var THSPageLHB = require("../BIZ/THSPageLHB");
var THSPageStock = require("../BIZ/THSPageStock");
var THSPageNews = require("../BIZ/THSPageNews");
var SINAPageAnalyse = require("../BIZ/SINAPageAnalyse");
var $ = require('cheerio');
var PARAM_CHECKER = require("../Core/PARAM_CHECKER");
var mongo = require('mongodb');
var TOOLS = require("../Core/TOOLS");
///同花顺页面分析
var THSPageAnalyse = {

    ///从页面获取数据[旧代码]
    GetDataFromPage: function (dbItem) {
        var res = {};
        res.ContentType = dbItem.ContentType;
        res.PageID = dbItem._id;
        res.Url = dbItem.Url;
        res.PageMD5 = dbItem.MD5;
        res.TaskID = dbItem.TaskID;
        res.StockCode = dbItem.StockCode;
        res.StockName = dbItem.StockName;

        var data = {};
        if ("日线数据" === dbItem.ContentType) {
            data = THSPageKLine.GetDataFromPage(dbItem);
        }
        else if ("个股龙虎榜" === dbItem.ContentType) {
            res.RefID = dbItem.RefID;
            data = THSPageLHB.GetDataFromPage(dbItem);
        }
        else if ("个股龙虎榜明细" === dbItem.ContentType) {
            res.RefID = dbItem.RefID;
            res.Date = dbItem.Date;
            res.Rid = dbItem.Rid;
            res.ParentUrl = dbItem.ParentUrl;
            data = THSPageLHB.GetDataFromPage(dbItem);
        }
        else if ("资金流向" === dbItem.ContentType) {
            data = THSPageStock.GetDataFromPageV2(dbItem);
        }
        else if ("首页概览" === dbItem.ContentType) {
            data = THSPageStock.GetDataFromPageV2(dbItem);
        }
        else if ("SINA个股历史交易" === dbItem.ContentType) {
            data = SINAPageAnalyse.GetDataFromPage(dbItem);
        }
        else if ("大单追踪实时数据" === dbItem.ContentType)
        {
            data = SINAPageAnalyse.GetDataFromPage(dbItem);
        }
        else if ("THS财经要闻新闻列表" === dbItem.ContentType) {
            data = THSPageNews.GetNewsList(dbItem);
        }
        else if ("THS财经要闻新闻详细" === dbItem.ContentType) {
            data = THSPageNews.GetNewsDetail(dbItem);
        }
        ///降低维度
        for (var key in data) {
            if (undefined == res[key]) {
                res[key] = data[key];
            }
            else {
                throw "键重复" + key + "  " + JSON.stringify(data);
            }
        }

        return res;
    }
}


///THS资金流向
THSPageAnalyse.GetZJLX = function (dbItem) {
    var $page = $(dbItem.Page);
    ///历史资金数据一览
    var lszjsjylTrArray = $page.find("table.m_table_3 tr");
    var rows = [];
    ///表格行的第一,第二行是表头说明
    for (var i = 2; i < lszjsjylTrArray.length; i++) {
        var tdArray = $(lszjsjylTrArray[i]).children();
        var c1 = $(tdArray[0]).text();///日期
        var c2 = $(tdArray[1]).text();///收盘价
        var c3 = $(tdArray[2]).text();///涨跌幅
        var c4 = $(tdArray[3]).text();///资金净流入
        var c5 = $(tdArray[4]).text();///5日主力净额
        var c6 = $(tdArray[5]).text();///大单(主力) - 净额
        var c7 = $(tdArray[6]).text();///大单(主力) - 净占比
        var c8 = $(tdArray[7]).text();///中单 - 净额
        var c9 = $(tdArray[8]).text();///中单 - 净占比
        var c10 = $(tdArray[9]).text();///小单 - 净额
        var c11 = $(tdArray[10]).text();///小单 - 净占比
        var dataRow = {
            "日期": TOOLS.Convertor.ToDate(c1.substring(0, 4) + "/" + c1.substring(4, 6) + "/" + c1.substring(6, 8)),
            "收盘价": Number(c2),
            "涨跌幅": Number(c3.replace("%", "")),
            "资金净流入": Number(c4),
            "5日主力净额": Number(c5),
            "大单(主力)净额": Number(c6),
            "大单(主力)净占比": Number(c7.replace("%", "")),
            "中单净额": Number(c8),
            "中单净占比": Number(c9.replace("%", "")),
            "小单净额": Number(c10),
            "小单净占比": Number(c11.replace("%", "")),
        };
        rows.push(dataRow);
    }


    return rows;
}


THSPageAnalyse.GetDataFromPage = function (dbItem) {
    if (true === PARAM_CHECKER.IsNotEmptyString(dbItem.Page)) {
        if ("THS资金流向" === dbItem.ContentType) {
            dbItem["PageData"] = THSPageAnalyse.GetZJLX(dbItem);
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
module.exports = THSPageAnalyse;