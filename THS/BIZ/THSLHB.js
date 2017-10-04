var $ = require('cheerio');
var TOOLS = require("../Core/TOOLS");

///同花顺龙虎榜页面分析
var THSLHB = {

    ///从页面获取个股龙虎榜数据
    GetPageData_GGLHB: function (dbItem) {
        var $page = $(dbItem.Page);
        var tableHtml = $page.find("#ggsj table");
        var tableData = TOOLS.HTML.TableToJson(tableHtml);
        return tableData;
    },

    ///从页面获取个股龙虎榜数据
    GetPageData_GGLHBMX: function (dbItem) {
        var $page = $(dbItem.Page);

        var tableHtml = $page.find(".m_table table");
        var tableData = TOOLS.HTML.TableToJson(tableHtml);

        var summaryText = $($page.find(".lhb-tipbox-hd-desc")).text().split(/ /g);
        var sumInfo = {};
        for (var i = 0; i < summaryInfo.length; i++) {
            var textItemArray = summaryInfo[i].split(/：/g);
            if (2 === textItemArray.length) {
                sumInfo[textItemArray[0]] = textItemArray[1];
            }
        }
        var res = {
            Summary =sumInfo,
            Data=tableData
        };


        return res;

    }
}

module.exports = THSLHB;