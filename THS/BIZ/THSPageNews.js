var $ = require('cheerio');
var PARAM_CHECKER = require("../Core/PARAM_CHECKER");
var TOOLS = require("../Core/TOOLS");

var THSPageNews = {};

///从页面获取新闻列表的数据
THSPageNews.GetNewsList = function (dbItem) {
    var $page = $(dbItem.Page);
    var wapper = $page.find(".module-l.fl")[1];
    var list = $(wapper).find(".arc-title");
    var newsList = [];
    for (var k = 0; k < list.length; k++) {
        var listItem = $(list[k]);
        var title = $($(listItem).find("a")[0]).text().trim();
        var href = $($(listItem).find("a")[0]).attr("href");

        var item = {};
        item.Title = title;
        item.Href = href;

        newsList.push(item);
    }

    return newsList;
}

THSPageNews.GetNewsDetail = function (dbItem) {
    var $page = $(dbItem.Page);
    var title = $($page.find(".atc-head")).text();
    var createTime = $($page.find("#pubtime_baidu")).text();
    var sourceName = $($page.find("#sourcename")).text();
    var sourceHref = $($page.find("#sourcename")).attr("href");
    var content = $($page.find(".atc-content")).text();

    var item = {};
    item.Title = title;
    item.CreateTime = createTime;
    item.SourceHref = sourceHref;
    item.SourceName = sourceName;
    item.Content = content;

    return item;
}

module.exports = THSPageNews;