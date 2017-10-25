var THSPageKLine = require("../BIZ/THSPageKLine");
var THSPageLHB = require("../BIZ/THSPageLHB");
var THSPageStock = require("../BIZ/THSPageStock");

///同花顺页面分析
var THSPageAnalyse = {

    ///从页面获取数据
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
        else if ("" === dbItem.ContentType) {

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

module.exports = THSPageAnalyse;