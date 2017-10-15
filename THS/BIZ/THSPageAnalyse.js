var THSPageKLine = require("../BIZ/THSPageKLine");
var THSPageLHB = require("../BIZ/THSPageLHB");


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
        else if ("个股龙虎榜" === dbItem.ContentType || "个股龙虎榜明细" === dbItem.ContentType) {
            data = THSPageLHB.GetDataFromPage(dbItem);
        }
        else if ("" === dbItem.ContentType) {

        }
        else if ("" === dbItem.ContentType) {

        }
        else if ("" === dbItem.ContentType) {

        }

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