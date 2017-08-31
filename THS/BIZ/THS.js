var MongoDB = require("../Core/MongoDB");
var PARAM_CHECKER = require("../Core/PARAM_CHECKER");

var $ = require('cheerio');
var count = 0;
///同花顺业务处理
var THS = {
    GetDB: function () {
        var opt = MongoDB.GetEmptyOption();
        opt.url = "mongodb://192.168.0.140:27017/ths";
        var db = MongoDB.GetInst("ths", opt);
        if (null === THS.DB) {
            THS.DB = db;
        }
        return THS.DB;
    },
    Dict: {},
    DB: null,
    SaveData: function (item) {
        if (undefined === THS.Dict[item.StockCode]) {
            THS.Dict[item.StockCode] = item;
        }
        else if (undefined != item.Home) {
            THS.Dict[item.StockCode].Home = item.Home;
        }
        else if (undefined != item.Funds) {
            THS.Dict[item.StockCode].Funds = item.Funds;
        }

        if (undefined != THS.Dict[item.StockCode].Home && undefined != THS.Dict[item.StockCode].Funds) {
            var data = THS.Dict[item.StockCode];
            delete THS.Dict[item.StockCode];
            var db = THS.GetDB();
            db.Save("AnalysisData3", data, function () { }, 0);
        }
        //var db = THS.GetDB();
        //db.Save("AnalysisData3", item, function () { }, 0);
    },
    TraverseData: function () {
        var db = THS.GetDB();
        db.Traverse("Page", {}, function (data) {
            var res = {};
            res.StockCode = data.StockCode;
            res.StockName = data.StockName;
            res.ContentType = data.ContentType;
            console.log("Traverse 正在处理 " + (++count) + "  " + res.StockCode + res.StockName + " " + data.ContentType);
            if ("首页概览" === data.ContentType) {
                var home = THS.AnalyseHome(data);
                res.Home = home;
                //THS.SaveData(res);
            }
            else if ("资金流向" === data.ContentType) {
                var funds = THS.AnalyseFunds(data);
                res.Funds = funds;
                //THS.SaveData(res);
            }
            else if ("公司资料" === data.ContentType) {
                THS.AnalyseCompany(data);
            }
            else if ("新闻公告" === data.ContentType) {
                THS.AnalyseNews(data);
            }
            else if ("财务分析" === data.ContentType) {
                THS.AnalyseFinance(data);
            }
            else if ("经营分析" === data.ContentType) {
                THS.AnalyseOperate(data);
            }
            else if ("股东股本" === data.ContentType) {
                THS.AnalyseHolder(data);
            }
            else if ("主力持仓" === data.ContentType) {
                THS.AnalysePosition(data);
            }
            else if ("公司大事" === data.ContentType) {
                THS.AnalyseEvent(data);
            }
            else if ("分红融资" === data.ContentType) {
                THS.AnalyseBonus(data);
            }
            else if ("价值分析" === data.ContentType) {
                THS.AnalyseWorth(data);
            }
            else if ("行业分析" === data.ContentType) {
                THS.AnalyseField(data);
            }

            //if (!(undefined === res.Home || null === res.Home) || !(undefined === res.Funds || null === res.Funds)) {
            //    db.Save("AnalysisData1", res, function () { }, 0);
            //}
            THS.SaveData(res);

        }, function (endMsg) {
            console.log("遍历结束");
        }, function (errMsg) {
            console.log("出错");
        });
    },

    ///分析首页概览数据
    AnalyseHome: function (pageData) {
        var $page = $(pageData.Page);
        var home = {};

        ///公司概况
        var $company_details = $($page.find(".company_details"));
        var company = { Key: [], Value: [] };
        var dt_dd = $company_details.children();
        for (var i = 0; i < dt_dd.length; i++) {
            if (true === $(dt_dd[i]).is("dt")) {
                company.Key.push($(dt_dd[i]).text().replace('：', ''));
            }
            else if (true === $(dt_dd[i]).is("dd")) {
                company.Value.push($(dt_dd[i]).text());
            }
        }

        ///公司新闻
        var gsxwLiArray = $page.find("[stat='f10_spqk_gsxw'] li");
        var gsxw = [];
        for (var i = 0; i < gsxwLiArray.length; i++) {
            var li = gsxwLiArray[i];
            var text = $(li).find("a").text();
            var href = $(li).find("a").attr("href");
            var date = $(li).find(".news_date").text();
            var item = {
                Text: text,
                Href: href,
                Date: date,
            };

            gsxw.push(item);
        }


        ///公司公告
        var gsggLiArray = $page.find("[stat='f10_spqk_gsgg'] li");
        var gsgg = [];
        for (var i = 0; i < gsggLiArray.length; i++) {
            var li = gsggLiArray[i];
            var text = $(li).find("a").text();
            var href = $(li).find("a").attr("href");
            var date = $(li).find(".news_date").text();
            var item = {
                Text: text,
                Href: href,
                Date: date,
            };

            gsgg.push(item);
        }

        ///行业资讯
        var hyzxLiArray = $page.find("[stat='f10_spqk_hyzx'] li");
        var hyzx = [];
        for (var i = 0; i < hyzxLiArray.length; i++) {
            var li = hyzxLiArray[i];
            var text = $(li).find("a").text();
            var href = $(li).find("a").attr("href");
            var date = $(li).find(".news_date").text();
            var item = {
                Text: text,
                Href: href,
                Date: date,
            };

            hyzx.push(item);
        }

        ///研究报告
        var yjbgLiArray = $page.find("[stat='f10_spqk_yjbg'] li");
        var yjbg = [];
        for (var i = 0; i < yjbgLiArray.length; i++) {
            var li = yjbgLiArray[i];
            var text = $(li).find("a").text();
            var href = $(li).find("a").attr("href");
            var date = $(li).find(".news_date").text();
            var item = {
                Text: text,
                Href: href,
                Date: date,
            };

            yjbg.push(item);
        }



        ///大宗交易
        var dzjyTrArray = $page.find("#deal tbody  tr"); ///大宗交易
        var dzjy = [];
        for (var i = 0; i < dzjyTrArray.length; i++) {
            var tr = dzjyTrArray[i];
            if (PARAM_CHECKER.IsArray(tr) && 7 === tr.length) {
                var c1 = $(tr[0]).text();///交易日期
                var c2 = $(tr[1]).text();///成交价(元)
                var c3 = $(tr[2]).text();///成交金额(万元)
                var c4 = $(tr[3]).text();///成交量(万股)
                var c5 = $(tr[4]).text();///溢价率
                var c6 = $(tr[5]).text();///买入营业部
                var c7 = $(tr[7]).text();///卖出营业部

                var item = {
                    C1: c1,
                    C2: c2,
                    C3: c3,
                    C4: c4,
                    C5: c5,
                    C6: c6,
                    C7: c7,
                };

                dzjy.push(item);
            }
        }

        ///融资融券
        var rzrqTrArray = $page.find("#margin tbody  tr"); ///今日龙虎榜数据  
        var rzrq = [];
        for (var i = 0; i < rzrqTrArray.length; i++) {
            var tr = dzjyTrArray[i];
            if (PARAM_CHECKER.IsArray(tr) && 8 === tr.length) {
                var c1 = $(tr[0]).text();///交易日期
                var c2 = $(tr[1]).text();///融资余额(亿元)
                var c3 = $(tr[2]).text();///融资余额/流通市值
                var c4 = $(tr[3]).text();///融资买入额(亿元)
                var c5 = $(tr[4]).text();///融券卖出量(万股)
                var c6 = $(tr[5]).text();///融券余量(万股)
                var c7 = $(tr[6]).text();///融券余额(万元)
                var c8 = $(tr[7]).text();///融资融券余额(亿元)

                var item = {
                    C1: c1,
                    C2: c2,
                    C3: c3,
                    C4: c4,
                    C5: c5,
                    C6: c6,
                    C7: c7,
                    C8: c8
                };

                rzrq.push(item);
            }
        }



        ///龙虎榜概要信息
        var $lhbTodayTrArray = $page.find("#ml_001 tbody  tr"); ///今日龙虎榜数据  

        var $lhbYesterdayTrArray = $page.find("#ml_002 tbody  tr"); ///昨日龙虎榜数据

        ///今日龙虎榜数据分析  
        var lhbToday = [];
        for (var i = 0; i < $lhbTodayTrArray.length; i++) {
            var tdArray = $($lhbTodayTrArray[i]).children();
            var href = $(tdArray[0]).find("a").attr("href");
            var yybName = $(tdArray[0]).text();///营业部名称
            var purchaseAmount = $(tdArray[1]).text();///买入金额
            var proportionTotalP = $(tdArray[2]).text();///占总成交比例	
            var salesAmount = $(tdArray[2]).text();///卖出金额
            var proportionTotalS = $(tdArray[3]).text();///占总成交比例	
            var lhbItem1 = {
                Href: href,
                YYBName: yybName,
                MRJE: purchaseAmount,
                MRBL: proportionTotalP,
                MCJE: salesAmount,
                MCBL: proportionTotalS
            };
            lhbToday.push(lhbItem1);
        }
        ///昨日龙虎榜数据分析  
        var lhbYesterday = [];
        for (var i = 0; i < $lhbYesterdayTrArray.length; i++) {
            var tdArray = $($lhbYesterdayTrArray[i]).children();
            var href = $(tdArray[0]).find("a").attr("href");
            var yybName = $(tdArray[0]).text();///营业部名称
            var purchaseAmount = $(tdArray[1]).text();///买入金额
            var proportionTotalP = $(tdArray[2]).text();///占总成交比例	
            var salesAmount = $(tdArray[2]).text();///卖出金额
            var proportionTotalS = $(tdArray[3]).text();///占总成交比例	
            var lhbItem2 = {
                Href: href,
                YYBName: yybName,
                MRJE: purchaseAmount,
                MRBL: proportionTotalP,
                MCJE: salesAmount,
                MCBL: proportionTotalS
            };

            lhbYesterday.push(lhbItem1);
        }


        home = {
            Company: company, ///公司概况
            GSXW: gsxw,///公司新闻
            GSGG: gsgg,///公司公告
            HYZX: hyzx,///行业资讯
            YJBG: yjbg,///研究报告
            DZJY: dzjy,///大宗交易
            RZRQ: rzrq,///融资融券
            LHB: {///龙虎榜
                Today: lhbToday,
                Yesterday: lhbYesterday
            }
        };

        return home;

        // console.log($(company_details).html()); ///这个会有编码问题
    },
    ///分析资金流向数据
    AnalyseFunds: function (pageData) {
        var $page = $(pageData.Page);
        var funds = {};
        ///历史资金数据一览
        var lszjsjylTrArray = $page.find("table.m_table_3 tr");
        var fundsHistoryList = [];
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
                C1: c1,
                C2: c2,
                C3: c3,
                C4: c4,
                C5: c5,
                C6: c6,
                C7: c7,
                C8: c8,
                C9: c9,
                C10: c10,
                C11: c11,
            };
            fundsHistoryList.push(dataRow);

            ///数据组装
            funds.HistoryList = fundsHistoryList;
            return funds;
        }





        // console.log($(company_details).html()); ///这个会有编码问题
    },

    ///分析公司资料数据
    AnalyseCompany: function (pageData) {

    },

    ///分析新闻公告数据
    AnalyseNews: function (pageData) {

    },

    ///分析财务分析数据
    AnalyseFinance: function (pageData) {

    },

    ///分析经营分析数据
    AnalyseOperate: function (pageData) {

    },

    ///分析股东股本数据
    AnalyseHolder: function (pageData) {

    },

    ///分析主力持仓数据
    AnalysePosition: function (pageData) {

    },

    ///分析公司大事数据
    AnalyseEvent: function (pageData) {

    },

    ///分析分红融资数据
    AnalyseBonus: function (pageData) {

    },

    ///分析价值分析数据
    AnalyseWorth: function (pageData) {

    },

    ///分析行业分析数据
    AnalyseField: function (pageData) {

    },

}

module.exports = THS;