
var HTTP = require("../Core/HTTP");
var $ = require("cheerio");
var TOOLS = require("../Core/TOOLS");

///同花顺监控程序
var THSMonitor = {
    Data: {
        coreData: {
            "营业部": {
                "国信证券股份有限公司佛山季华六路证券营业部": {}
            }
        },
        ///检测是否存在于
        ExistInList: function (listName, brokerYYBName) {
            return (undefined != THSMonitor.Data.coreData[listName][brokerYYBName]);
        },

        ///加载营业部数据
        LoadBrokerYYB: function (brokerYYBName) {
            if (undefined === THSMonitor.Data.coreData["营业部"][brokerYYBName]) {
                THSMonitor.Data.coreData["营业部"][brokerYYBName] = {}
            }
            THSMonitor.Data.coreData["营业部"][brokerYYBName] = {};
        }
    },
    ///监控龙虎榜
    WatchingLHB: function () {
        console.log();
        var watchingFunc = function () {
            console.log("正在监控龙虎榜 " + new Date());
            var url = "http://data.10jqka.com.cn/market/longhu/";
            
            var callback = function (data) {
                var $page = $(data);
                var list = $page.find("#ggmx .rightcol.fr .stockcont"); ///龙虎榜上的股票
                for (var i = 0; i < list.length; i++) {
                    var $listItem = $(list[i]);
                    var stockCode = $listItem.attr("stockcode");
                    var tableArray = $listItem.find(".cell-cont.cjmx table");///买入卖出表格
                    for (var j = 0; j< tableArray.length; j++) {
                        var table = tableArray[j];
                        var tableData = TOOLS.HTML.TableToJson(table, {
                            "第1列": function (position, td, msg) {
                                var res = "暂空";
                                var yyb = $(td).find("a").attr("title").trim();
                                var href = $(td).find("a").attr("href").trim();
                                return yyb;
                            }
                        });

                        for (var k = 0;k < tableData.Data.length; k++) { ///表格里的行
                            var row = tableData.Data[k];
                            if (THSMonitor.Data.ExistInList("营业部", row.C1)) {
                                if (0 === j) {///买入表格
                                    console.log("找到要监控的买入金额最大的前5名营业部：" + row.C1 + " 股票代码：" + stockCode);
                                }
                                else if (1 === j){///卖出表格
                                    console.log("找到要监控的卖出金额最大的前5名营业部：" + row.C1 + " 股票代码：" + stockCode);
                                }
                            }
                            else {
                                //console.log("尚未发现要监控的营业部");
                            }
                        }


                    }
                }
                
            }
            var option = {};
            option.header = {
                "Accept": "text / html, application/xhtml+xml,application/xml;q=0.9, image/webp,image/apng, */*;q=0.8",
                "Accept-Encoding":"gzip, deflate",
                "Accept-Language":"zh-CN,zh;q=0.8,en-US;q=0.6,en;q=0.4",
                "Cache-Control": "max-age=0",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36",
                "Host":"data.10jqka.com.cn"
            };

            HTTP.Get(url, "GBK", callback,option);
        }

        setInterval(watchingFunc, 5 * 1000);
    }
}

module.exports = THSMonitor;