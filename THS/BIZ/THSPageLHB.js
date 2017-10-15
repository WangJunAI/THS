var $ = require('cheerio');
var TOOLS = require("../Core/TOOLS");
var PARAM_CHECKER = require("../Core/PARAM_CHECKER");
///同花顺龙虎榜页面分析
var THSPageLHB = {

    ///从页面获取个股龙虎榜数据
    GetPageData_GGLHB: function (dbItem) {
        var $page = $(dbItem.Page);
        var tableHtml = $page.find("#ggsj table");
        var tableData = TOOLS.HTML.TableToJson(tableHtml);

        for (var i = 0; i < tableData.Data.length; i++) {
            var itemData = tableData.Data[i];

            itemData.C1 = TOOLS.Convertor.ToDate(itemData.C1);
            itemData.C3 = Number(itemData.C3);
            itemData.C4 = PARAM_CHECKER.IsNumber(itemData.C4) ? Number(itemData.C4) : itemData.C4;

            itemData.C5 = Number(itemData.C5) * 10000;
            itemData.C6 = Number(itemData.C6) * 10000;
            itemData.C7 = Number(itemData.C7) * 10000;


            tableData.Data[i] = itemData;
        }

        return tableData;
    },

    ///从页面获取个股龙虎榜明细数据
    GetPageData_GGLHBMX: function (dbItem) {
        var $page = $(dbItem.Page);

        var tableHtml = dbItem.Page;
        var tableData = TOOLS.HTML.TableToJson(tableHtml);

        var summaryText = $($page.find(".lhb-tipbox-hd-desc")).text().split(/ /g);
        var sumInfo = {};
        for (var i = 0; i < summaryText.length; i++) {
            var textItemArray = summaryText[i].split(/：/g);
            if (2 === textItemArray.length) {
                if (i === 0) {
                    sumInfo[textItemArray[0]] = TOOLS.Convertor.ToDate(textItemArray[1]);
                }
                else {
                    sumInfo[textItemArray[0]] = TOOLS.Convertor.UnitToNumber(textItemArray[1]);
                }
            }
        }

        for (var i = 0; i < tableData.Data.length; i++) {
            var data = tableData.Data[i];
            if (7 === TOOLS.JSON.KeyCount(data)) {
                data.C1 = parseInt(data.C1);
                data.C2 = data.C2.trim();
                data.C3 = Number(data.C3) * 10000;
                data.C4 = TOOLS.Convertor.PercentToNumber(data.C4);
                data.C5 = Number(data.C5) * 10000;
                data.C6 = TOOLS.Convertor.PercentToNumber(data.C6);
                data.C7 = Number(data.C7) * 10000;
            }
            else {
                var p=0;
            }


            tableData.Data[i] = data;
        }

        var res = {
            Summary:sumInfo,
            Column: tableData.Column,
            Rows:tableData.Data
        };


        return res;

    },

    ///从页面获取数据
    GetDataFromPage: function (dbItem) {
        var res = {};
        if ("个股龙虎榜" === dbItem.ContentType) {
            res = THSPageLHB.GetPageData_GGLHB(dbItem);
        }
        else if ("个股龙虎榜明细" === dbItem.ContentType) {
            res = THSPageLHB.GetPageData_GGLHBMX(dbItem);
        }
        return res;
    }
}

module.exports = THSPageLHB;