///同花顺新闻分析
var MongoDB = require("../Core/MongoDB");

var $ = require('cheerio');
var NEWS = {
    Load: function (url) {
        var opt = MongoDB.GetEmptyOption();
        opt.url = "mongodb://192.168.0.140:27017/ths";
        var db = MongoDB.GetInst("THSNews", opt);
        var insertArray = [];
        db.LoadCollection("news", { Status:"Downloaded" }, 0, 200, function (currentData) {
            //console.log(data);

            if ("ExtractLink" === currentData["Task"]) {
                ///若是分析链接
                ///文章列表处理
                var list = $(currentData.PageData).find(".list-con").find("li"); ///查找新闻链接
                var lastPageNum = parseInt($(currentData.PageData).find(".bottom-page .end").text());
                var pagerHref = $(currentData.PageData).find(".bottom-page .end").attr("href").replace(lastPageNum, "@@@"); ///分页链接模板
                 
                ///下载正文
                for (var i = 0; i < list.length; i++) {
                    var $listItem = $(list[i]); ///列表项

                    var href = $listItem.find(".arc-title a").attr("href");///文章所在链接
                    var text = $listItem.find(".arc-title a").text();///文章标题
                    var createTime = $listItem.find(".arc-title span").text(); ///创建时间
                    var summary = $listItem.find("a").text();///文章概要
                    //写入到数据库中
                    var listItemData = {
                        Url: href,
                        Text: text,
                        ArticleCreateTime: createTime,
                        ArticleSummary: summary,
                        CreateTime: new Date(),
                        UpdateTime: new Date(),
                        ItemType: "PageArticle",///文章列表
                        Status: "NotDownloaded",
                        Task: "ExtractArticle",///提取正文
                    }
                    console.log("分析正文" + insertArray.length);
                    insertArray.push(listItemData);
                }

                ///分页链接
                for (var i = 0; i < lastPageNum; i++) {
                    var href = pagerHref.replace("@@@", i);
                    //写入到数据库中
                    var pagerData = {
                        Url: href,
                        Text: i,
                        CreateTime: new Date(),
                        UpdateTime: new Date(),
                        ItemType: "Pager", ///分页
                        Task:"ExtractLink",
                        Status: "NotDownloaded"
                    }
                    console.log("分析链接 " + insertArray.length);
                    //db.Save("news", data, function () { }, 0);
                    insertArray.push(pagerData);// db.Save("news", data, function () { }, 0);
                }
            }
            else {
                console.log("未检测到任务");
            }

            currentData["Task"] = "Done";
            insertArray.push(currentData);

        }, function (endData) {
            ///全部结束
            console.log("数据读取完毕");
            while (0 < insertArray.length) {
                var itemData = insertArray.pop();
                console.log("写入数据 " + insertArray.length);
                db.Save("news", itemData, function () { }, 0);
            }

            }, function (data) { console.log(data); });
    }
}

module.exports = NEWS;