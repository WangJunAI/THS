var MongoDB = require("../Core/MongoDB");
var PARAM_CHECKER = require("../Core/PARAM_CHECKER");
var TOOLS = require("../Core/TOOLS")

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
    Const: {
        Collection: {
            Tag:"0904",
            Page: "Page" +"0903", ///原始页面,
            PageData: "PageData" + "0904",///页面一级提取数据
            Log: "Log" + "0904",///性能日志
            AnalysisResult: "AnalysisResult" +"0904",
        }
    },
    Log: {
        data: {},
        ///开始计时
        Start: function (logItemName) {
            THS.Log.data[logItemName] = { StartTime: new Date() };
        },
        ///
        Stop: function (logItemName) {
            THS.Log.data[logItemName].StopTime = new Date();
            THS.Log.data[logItemName].ItemName = logItemName;
            THS.Log.data[logItemName].Duration = THS.Log.data[logItemName].StopTime - THS.Log.data[logItemName].StartTime;
            var collectionName = THS.Const.Collection.Log;
            var db = THS.GetDB();
            db.Save(collectionName, THS.Log.data[logItemName], function () {
                delete THS.Log.data[logItemName];
            }, 0);
        }
    },
    Dict: {},
    DB: null,
    SavePageData: function (item) {
        if (undefined === THS.Dict[item.StockCode]) {
            THS.Dict[item.StockCode] = item;
        }
        else if (undefined != item.Home) {
            THS.Dict[item.StockCode].Home = item.Home;
        }
        else if (undefined != item.Funds) {
            THS.Dict[item.StockCode].Funds = item.Funds;
        }
        else if (undefined != item.Event) {
            THS.Dict[item.StockCode].Event = item.Event;
        }

        if (undefined != THS.Dict[item.StockCode].Home && undefined != THS.Dict[item.StockCode].Funds && undefined != THS.Dict[item.StockCode].Event) {
            var collectionName = THS.Const.Collection.PageData;///原始页面所在集合
            var data = THS.Dict[item.StockCode];
            delete THS.Dict[item.StockCode];
            var db = THS.GetDB();
            db.Save(collectionName, data, function () { }, 0);
        }
    },
    TraversePage: function () {
        var db = THS.GetDB();
        var collectionName = THS.Const.Collection.Page;///原始页面所在集合

        ///日志计时
        THS.Log.Start("页面遍历TraversePage");

        db.Traverse(collectionName, { }, function (data) {//"StockCode": "002417" 
            var res = {};
            res.StockCode = data.StockCode;
            res.StockName = data.StockName;
            res.ContentType = data.ContentType;
            console.log("Traverse 正在分析页面 " + (++count) + "  " + res.StockCode + res.StockName + " " + data.ContentType);
            if ("首页概览" === data.ContentType) {
                var home = THS.AnalysePageHome(data);
                res.Home = home;
            }
            else if ("资金流向" === data.ContentType) {
                var funds = THS.AnalysePageFunds(data);
                res.Funds = funds;
            }
            else if ("公司资料" === data.ContentType) {
                THS.AnalysePageCompany(data);
            }
            else if ("新闻公告" === data.ContentType) {
                THS.AnalysePageNews(data);
            }
            else if ("财务分析" === data.ContentType) {
                THS.AnalysePageFinance(data);
            }
            else if ("经营分析" === data.ContentType) {
                THS.AnalysePageOperate(data);
            }
            else if ("股东股本" === data.ContentType) {
                THS.AnalysePageHolder(data);
            }
            else if ("主力持仓" === data.ContentType) {
                THS.AnalysePagePosition(data);
            }
            else if ("公司大事" === data.ContentType) {
                var event = THS.AnalysePageEvent(data);
                res.Event = event;
            }
            else if ("分红融资" === data.ContentType) {
                THS.AnalysePageBonus(data);
            }
            else if ("价值分析" === data.ContentType) {
                THS.AnalysePageWorth(data);
            }
            else if ("行业分析" === data.ContentType) {
                THS.AnalysePageField(data);
            } 

            THS.SavePageData(res);

        }, function (endMsg) {
            console.log("遍历结束");
            THS.Log.Stop("页面遍历TraversePage");
        }, function (errMsg) {
            console.log("出错");
        });
    },

    ///页面数据分析
    TraverseData: function () {
        ///日志计时
        THS.Log.Start("页面数据遍历TraverseData");

        var db = THS.GetDB();
        var collectionName = THS.Const.Collection.PageData;
        db.Traverse(collectionName, {}, function (data) {
            var res = {};
            res.StockCode = data.StockCode;
            res.StockName = data.StockName;
            console.log("TraverseData 正在分析数据 " + (++count) + "  " + res.StockCode + res.StockName );
            THS.AnalyseData(data);

        }, function (endMsg) {
            THS.Log.Stop("页面数据遍历TraverseData");
            THS.AnalyseDataDict.SaveData(); ///将分析结果写入数据库
            console.log("遍历结束");
        }, function (errMsg) {
            console.log("出错");
        });
    },

    ///分析首页概览数据
    AnalysePageHome: function (pageData) {
        var $page = $(pageData.Page);
        var home = {};

        ///公司概况
        var $company_details = $($page.find(".company_details"));
        var company = { Key: [], Value: [] }; ///Key是结构 Value是值
        var dt_dd = $company_details.children();
        for (var i = 0; i < dt_dd.length; i++) {
            if (true === $(dt_dd[i]).is("dt")) {
                company.Key.push($(dt_dd[i]).text().replace('：', ''));
            }
            else if (true === $(dt_dd[i]).is("dd")) {
                var dd = $(dt_dd[i]).text();
                if ("string" === typeof ($(dt_dd[i]).attr("title")) && 0 < $(dt_dd[i]).attr("title").length) {
                    dd = $(dt_dd[i]).attr("title");///获取完整字符串
                }
                else  {
                    dd = dd.replace('元', '').replace('亿', '').replace('%', '');
                    if (false === isNaN(dd)) {
                        ///如果是数字
                        dd = Number(dd);
                    }
                    else if (false === isNaN(Date.parse(dd))) {
                        ///若转换日期成功
                        dd = TOOLS.Convertor.ToDate(dd);
                    }
                    
                } 
                company.Value.push(dd);
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
                Date: TOOLS.Convertor.ToDate("2017-" + date),
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
                Date: TOOLS.Convertor.ToDate("2017-"+date),
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
                Date: TOOLS.Convertor.ToDate("2017-" + date),
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
                Date: TOOLS.Convertor.ToDate("2017-" + date),
            };

            yjbg.push(item);
        }



        ///大宗交易
        var dzjyTrArray = $page.find("#deal tbody  tr"); ///大宗交易
        var dzjy = [];
        for (var i = 0; i < dzjyTrArray.length; i++) {
            var tr = dzjyTrArray[i];
            var tdArr = $(tr).children();
            if (7 === tdArr.length) {
                var c1 = $(tdArr[0]).text();///交易日期
                var c2 = $(tdArr[1]).text();///成交价(元)
                var c3 = $(tdArr[2]).text();///成交金额(万元)
                var c4 = $(tdArr[3]).text();///成交量(万股)
                var c5 = $(tdArr[4]).text();///溢价率
                var c6 = $(tdArr[5]).text();///买入营业部
                var c7 = $(tdArr[6]).text();///卖出营业部

                var item = {
                    C1: TOOLS.Convertor.ToDate(c1),
                    C2: Number(c2),
                    C3: Number(c3),
                    C4: Number(c4),
                    C5: Number(c5.replace('%','')),
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
            var tr = rzrqTrArray[i];
            var tdArr = $(tr).children();
            if (8 === $(tr).children().length) {
                var c1 = $(tdArr[0]).text();///交易日期
                var c2 = $(tdArr[1]).text();///融资余额(亿元)
                var c3 = $(tdArr[2]).text();///融资余额/流通市值
                var c4 = $(tdArr[3]).text();///融资买入额(亿元)
                var c5 = $(tdArr[4]).text();///融券卖出量(万股)
                var c6 = $(tdArr[5]).text();///融券余量(万股)
                var c7 = $(tdArr[6]).text();///融券余额(万元)
                var c8 = $(tdArr[7]).text();///融资融券余额(亿元)

                var item = {
                    C1: TOOLS.Convertor.ToDate(c1),
                    C2: Number(c2),
                    C3: Number(c3.replace('%', '')),
                    C4: Number(c4),
                    C5: Number(c5),
                    C6: Number(c6),
                    C7: Number(c7),
                    C8: Number(c8)
                };

                rzrq.push(item);
            }
        }



        ///龙虎榜概要信息
        var $lhbTodayTrArray = $page.find("#ml_001 tbody  tr"); ///今日龙虎榜数据  

        var $lhbYesterdayTrArray = $page.find("#ml_002 tbody  tr"); ///昨日龙虎榜数据

        ///今日龙虎榜数据分析  
        var lhbToday = [];
        var lhbTodayCal = {};
        for (var i = 0; i < $lhbTodayTrArray.length; i++) {
            var tdArray = $($lhbTodayTrArray[i]).children();
            if (1 === tdArray.length) {
                if ("买入总计" === $(tdArray[0]).text().substring(0, 4)) {
                    lhbTodayCal["MRZJ"] = Number($(tdArray[0]).text().replace("买入总计：", "").replace("万元", ""));
                }
                else if ("卖出总计" === $(tdArray[0]).text().substring(0, 4)) {
                    lhbTodayCal["MCZJ"] = Number($(tdArray[0]).text().replace("卖出总计：", "").replace("万元", ""));
                }
                else if ("买卖净差" === $(tdArray[0]).text().substring(0, 4)) {
                    lhbTodayCal["MMJC"] = Number($(tdArray[0]).text().replace("买卖净差：", "").replace("万元", ""));
                }
            }
            else if (1 < tdArray.length) {

                var href = $(tdArray[0]).find("a").attr("href");
                var yybName = $(tdArray[0]).text();///营业部名称
                var purchaseAmount = $(tdArray[1]).text();///买入金额
                var proportionTotalP = $(tdArray[2]).text();///占总成交比例	
                var salesAmount = $(tdArray[3]).text();///卖出金额
                var proportionTotalS = $(tdArray[4]).text();///占总成交比例	
                var lhbItem1 = {
                    Href: href,
                    YYBName: yybName,
                    MRJE: Number(purchaseAmount),
                    MRBL: Number(proportionTotalP.replace('%', '')),
                    MCJE: Number(salesAmount),
                    MCBL: Number(proportionTotalS.replace('%', ''))
                };
                lhbToday.push(lhbItem1);
            }
        }
        ///昨日龙虎榜数据分析  
        var lhbYesterday = [];
        var lhbYesterdayCal = {};
        for (var i = 0; i < $lhbYesterdayTrArray.length; i++) {
            var tdArray = $($lhbYesterdayTrArray[i]).children();
            if (1 === tdArray.length) {
                if ("买入总计" === $(tdArray[0]).text().substring(0, 4)) {
                    lhbYesterdayCal["MRZJ"] = Number($(tdArray[0]).text().replace("买入总计：", "").replace("万元", ""));
                }
                else if ("卖出总计" === $(tdArray[0]).text().substring(0, 4)) {
                    lhbYesterdayCal["MCZJ"] = Number($(tdArray[0]).text().replace("卖出总计：", "").replace("万元", ""));
                }
                else if ("买卖净差" === $(tdArray[0]).text().substring(0, 4)) {
                    lhbYesterdayCal["MMJC"] = Number($(tdArray[0]).text().replace("买卖净差：", "").replace("万元", ""));
                }
            }
            else if (1 < tdArray.length) {
                var href = $(tdArray[0]).find("a").attr("href");
                var yybName = $(tdArray[0]).text();///营业部名称
                var purchaseAmount = $(tdArray[1]).text();///买入金额
                var proportionTotalP = $(tdArray[2]).text();///占总成交比例	
                var salesAmount = $(tdArray[3]).text();///卖出金额
                var proportionTotalS = $(tdArray[4]).text();///占总成交比例	
                var lhbItem2 = {
                    Href: href,
                    YYBName: yybName,
                    MRJE: Number(purchaseAmount),
                    MRBL: Number(proportionTotalP.replace('%', '')),
                    MCJE: Number(salesAmount),
                    MCBL: Number(proportionTotalS.replace('%', '')),
                };

                lhbYesterday.push(lhbItem1);
            }
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
                Yesterday: lhbYesterday,
                TodayCal: lhbTodayCal,
                YestodayCal:lhbYesterdayCal,
            },
            Intro: {
                Company: "公司概况",
                GSXW: "公司新闻",
                GSGG: "公司公告",
                HYZX: "行业资讯",
                YJBG: "研究报告",
                DZJY: { Name: "大宗交易", Column: { C1: "交易日期", C2: "成交价(元)", C3: "成交金额(万元)", C4: "成交量(万股)", C5: "溢价率", C6: "买入营业部", C7: "卖出营业部"}},
                RZRQ: { Name: "融资融券", Column: { C1: "交易日期", C2: "融资余额(亿元)", C3: "融资余额/流通市值", C4: "融资买入额(亿元)", C5: "融券卖出量(万股)", C6: "融券余量(万股)", C7: "融券余额(万元)", C8: "融资融券余额(亿元)" } },
                LHB: { Name: "龙虎榜", Column: { Href: "营业部链接", YYBName: "营业部名称", MRJE: "买入金额", MRBL: "买入金额占总成交比例", MCJE: "卖出金额", MCBL: "卖出金额占总成交比例" }, Cal: { MRZJ: "买入总计", MCZJ: "卖出总计",MMJC: "买卖净差"}},
            }
        };

        if (0 < home.DZJY.length) {
            var q = 0;
        }
        if ( 0 < home.RZRQ.length) {
            var q = 0;
        }
        if (0 < home.LHB.Today.length) {
            var q = 0;
        }

        return home;

        // console.log($(company_details).html()); ///这个会有编码问题
    },
    ///分析资金流向数据
    AnalysePageFunds: function (pageData) {
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
                C1: TOOLS.Convertor.ToDate( c1.substring(0, 4) + "/" + c1.substring(4, 6) + "/" + c1.substring(6, 8)),
                C2: Number(c2),
                C3: Number(c3.replace("%","")),
                C4: Number(c4),
                C5: Number(c5),
                C6: Number(c6),
                C7: Number(c7.replace("%", "")),
                C8: Number(c8),
                C9: Number(c9.replace("%", "")),
                C10: Number(c10),
                C11: Number(c11.replace("%", "")),
            };
            fundsHistoryList.push(dataRow);

            ///数据组装
            funds.Column = { C1: "日期", C2: "收盘价", C3: "涨跌幅", C4: "资金净流入", C5: "5日主力净额", C6: "大单(主力) - 净额", C7: "大单(主力) - 净占比", C8: "中单 - 净额", C9: "中单 - 净占比", C10: "小单 - 净额", C11: "小单 - 净占比" };
            funds.List = fundsHistoryList;

            return funds;
        }
         
        // console.log($(company_details).html()); ///这个会有编码问题
    },

    ///分析公司资料数据
    AnalysePageCompany: function (pageData) {

    },

    ///分析新闻公告数据
    AnalysePageNews: function (pageData) {

    },

    ///分析财务分析数据
    AnalysePageFinance: function (pageData) {

    },

    ///分析经营分析数据
    AnalysePageOperate: function (pageData) {

    },

    ///分析股东股本数据
    AnalysePageHolder: function (pageData) {

    },

    ///分析主力持仓数据
    AnalysePagePosition: function (pageData) {

    },

    ///分析公司大事数据
    AnalysePageEvent: function (pageData) {
        var $page = $(pageData.Page);
        var event = {};

        ///近期重要事件
        var importantEventTrArray = $page.find("#tableList tbody  tr"); ///近期重要事件  
        var importantEvent = [];
        for (var i = 0; i < importantEventTrArray.length; i++) {
            var tr = importantEventTrArray[i];
            var tdArr = $(tr).children();
            if (2 === $(tr).children().length) {
                var c1 = $(tdArr[0]).text();///日期
                var c2 = $(tdArr[1]).find("strong").text();///类型
                var c3 = $(tdArr[1]).find("a").text().replace("详情>>", "").replace("更多>>", "");///标题
                var c4 = $(tdArr[1]).find("a").attr("href");///链接


                var item = {
                    C1: TOOLS.Convertor.ToDate(c1.replace('-','/')),
                    C2: c2.replace("：",""),
                    C3: c3,
                    C4: c4,
                };
                importantEvent.push(item);
            }
        }

        ///高管持股变动 
        var shareholdingTrArray = $page.find("#manager table tbody  tr"); ///高管持股变动  
        var shareholding = [];
        for (var i = 0; i < shareholdingTrArray.length; i++) {
            var tr = shareholdingTrArray[i];
            var tdArr = $(tr).children();
            if (7 === $(tr).children().length) {
                var c1 = $(tdArr[0]).text();///变动日期
                var c2 = $(tdArr[1]).text();///变动人
                var c3 = $(tdArr[2]).text();///与公司高管关系
                var c4 = $(tdArr[3]).text();///变动数量（股）
                var c5 = $(tdArr[4]).text();///交易均价（元）
                var c6 = $(tdArr[5]).text();///剩余股数（股）
                var c7 = $(tdArr[6]).text();///股份变动途径


                var item = {
                    C1: TOOLS.Convertor.ToDate(c1.replace('-', '/')),
                    C2: c2,
                    C3: c3,
                    C4: Number(c4.replace(/ /g, "").replace("增持", "").replace("减持", "-").replace("万", "")),
                    C5: Number(c5),
                    C6: Number(c6.replace("万","")),
                    C7: c7,
                };
                shareholding.push(item);
            }
        }

        ///股东持股变动
        var shareholderTrArray = $page.find("#holder_table  tbody  tr"); ///高管持股变动  
        var shareholder = [];
        for (var i = 0; i < shareholderTrArray.length; i++) {
            var tr = shareholderTrArray[i];
            var tdArr = $(tr).children();
            if (7 === $(tr).children().length) {
                var c1 = $(tdArr[0]).text();///公告日期
                var c2 = $(tdArr[1]).text();///变动股东
                var c3 = $(tdArr[2]).text();///变动数量(股)
                var c4 = $(tdArr[3]).text();///交易均价(元)
                var c5 = $(tdArr[4]).text();///剩余股份总数(股)
                var c6 = $(tdArr[5]).text();///变动期间
                var c7 = $(tdArr[6]).text();///变动途径

                c6 = c6.split(/-/);
                c6[0] = new Date(c6[0].replace('.', '/'));
                c6[1] = new Date(c6[1].replace('.', '/'));


                var item = {
                    C1: TOOLS.Convertor.ToDate(c1.replace('-', '/')),
                    C2: c2,
                    C3: Number(c3.replace("万", "").replace("增持", "").replace("减持", "-").replace("万", "")),
                    C4: Number(c4),
                    C5: Number(c5.replace("万", "")),
                    C6: c6,
                    C7: c7,
                };
                shareholder.push(item);
            }
        }

        event["Important"] = importantEvent;
        event["Senior"] = shareholding;
        event["Shareholder"] = shareholder;
        return event;
    },

    ///分析分红融资数据
    AnalysePageBonus: function (pageData) {

    },

    ///分析价值分析数据
    AnalysePageWorth: function (pageData) {

    },

    ///分析行业分析数据
    AnalysePageField: function (pageData) {

    },
    AnalyseDataDict: {
        Intro:"",
        Area: {
            Name: "地域分布",
            Result: {}
        },
        Conception: {
            Name: "概念分布",
            Result: {}
        },

        MainBusiness: {
            Name: "主营业务分布",
            Result: {}
        },
        EarningsShare: {
            Name: "每股收益分布",
            Result: {
                "负值": [],///0
                "2毛以下": [],///
                "2至5毛": [],
                "5毛1元": [],
                "1元以上": [],
            },
            Coefficient: {
                "负值": 0,
                "2毛以下": 20,
                "2至5毛": 50,
                "5毛1元": 100,
                "1元以上": 200,
            }
        },
        NetProfitGrowthRate: {
            Name: "净利润增长率分布",
            Result: {
                "负值": [],
                "0至10%": [],
                "10%至30%": [],
                "30%至50%": [],
                "50%至100%": [],
                "100%至300%": [],
                "300%及以上": [],
            },
            Coefficient: {
                "负值": 0,
                "0至10%":10,
                "10%至30%": 20,
                "30%至50%": 50,
                "50%至100%": 100,
                "100%至300%": 200,
                "300%及以上": 500,
            }
        },
        CashFlowShare: {
            Name: "每股现金流",
            Result: {
                "负值": [],
                "5毛以下": [],
                "5毛1元": [],
                "1至2元": [],
                "2元以上": [],
            },
            Coefficient: {
                "负值": 0,
                "5毛以下": 20,
                "5毛1元": 50,
                "1至2元": 100,
                "2元以上": 200,
            }
        },
        LHB: {
            Name: "龙虎榜二日净买入数据分析",///分析两天内净买入量
            Result: {
                "负值": [],
                "2000万以下": [],
                "2000万至5000万": [],
                "5000万以上": [],
            },
            Coefficient: {
                "负值":0,
                "2000万以下": 20,
                "2000万至5000万": 50,
                "5000万以上": 100,
            }
        },

        BlockTrade: {
            Name: "大宗交易",///
            Result: {
                "负值": [],
                "正值": [],
            },
            Coefficient: {
                "负值": -50,
                "正值": 50,
            }
        },

        MarginTrading: {
            Name: "融资融券",
            Result: {
                "增长": [],
                "减少": [],
            },
            Coefficient: {
                "增长": 50,
                "减少": -50,
            }
        },
        RecommendationDict: {
        },
        ///添加到主营业务维度
        AddToArea: function (stockCode, stockName,areaName) {
            ///添加到地域维度
            if (undefined === THS.AnalyseDataDict.Area.Result[areaName]) {
                ///若没有定义,则初始化
                THS.AnalyseDataDict.Area.Result[areaName] = [];
            }
            THS.AnalyseDataDict.Area.Result[areaName].push({ StockCode: stockCode, StockName: stockName });
        },
        ///添加到概念维度
        AddToConception: function (stockCode, stockName, conceptionString) {

            var conceptionArray = conceptionString.split('，');

            for (var i = 0; i < conceptionArray.length; i++) {
                var conception = conceptionArray[i].trim().replace('.','_');
                ///添加到概念维度
                if (undefined === THS.AnalyseDataDict.Conception.Result[conception]) {
                    ///若没有定义,则初始化
                    THS.AnalyseDataDict.Conception.Result[conception] = [];
                }
                THS.AnalyseDataDict.Conception.Result[conception].push({ StockCode: stockCode, StockName: stockName });
            }
        },

        ///添加到主营业务维度
        AddToMainBusiness: function (stockCode, stockName,businessString) {
            var businessArray = businessString.split(/[,。.;；、]/);

            for (var i = 0; i < businessArray.length; i++) {
                var business = businessArray[i].trim().replace('.', '_');
                //console.log(stockCode + "  " + stockName + " " + business);
                ///添加到主营业务维度
                if ("" != business) {
                    if (undefined === THS.AnalyseDataDict.MainBusiness.Result[business]) {
                        ///若没有定义,则初始化
                        THS.AnalyseDataDict.MainBusiness.Result[business] = [];
                    }
                    THS.AnalyseDataDict.MainBusiness.Result[business].push({ StockCode: stockCode, StockName: stockName });
                }
            }
        },

        ///添加到每股收益维度 负值,0-2,2-5,5-10,10以上
        AddToEarningsShare: function (stockCode, stockName, earnings) {
            ///初始化
            if (earnings<0) {
                THS.AnalyseDataDict.EarningsShare.Result["负值"].push({ StockCode: stockCode, StockName: stockName, Earnings:earnings });
            }
            else if (0 < earnings && earnings<=0.2) {
                THS.AnalyseDataDict.EarningsShare.Result["2毛以下"].push({ StockCode: stockCode, StockName: stockName, Earnings:earnings });
            }
            else if (0.2 < earnings && earnings <= 0.5) {
                THS.AnalyseDataDict.EarningsShare.Result["2至5毛"].push({ StockCode: stockCode, StockName: stockName, Earnings:earnings });
            }
            else if (0.5 < earnings && earnings <= 1.0) {
                THS.AnalyseDataDict.EarningsShare.Result["5毛1元"].push({ StockCode: stockCode, StockName: stockName, Earnings:earnings });
            }
            else if (1.0 < earnings ) {
                THS.AnalyseDataDict.EarningsShare.Result["1元以上"].push({ StockCode: stockCode, StockName: stockName, Earnings:earnings });
            }
        },

        ///添加到净利润增长率
        AddToNetProfitGrowthRate: function (stockCode, stockName, netProfitGrowthRate) {
            ///初始化
            if (netProfitGrowthRate < 0) {
                THS.AnalyseDataDict.NetProfitGrowthRate.Result["负值"].push({ StockCode: stockCode, StockName: stockName, NetProfitGrowthRate: netProfitGrowthRate });
            }
            else if (0 * 0.01 < netProfitGrowthRate && netProfitGrowthRate <= 10 * 0.01) {
                THS.AnalyseDataDict.NetProfitGrowthRate.Result["0至10%"].push({ StockCode: stockCode, StockName: stockName, NetProfitGrowthRate: netProfitGrowthRate });
            }
            else if (10 * 0.01 < netProfitGrowthRate && netProfitGrowthRate <= 30 * 0.01) {
                THS.AnalyseDataDict.NetProfitGrowthRate.Result["10%至30%"].push({ StockCode: stockCode, StockName: stockName, NetProfitGrowthRate: netProfitGrowthRate });
            }
            else if (30 * 0.01 < netProfitGrowthRate && netProfitGrowthRate <= 50 * 0.01) {
                THS.AnalyseDataDict.NetProfitGrowthRate.Result["30%至50%"].push({ StockCode: stockCode, StockName: stockName, NetProfitGrowthRate: netProfitGrowthRate });
            }
            else if (50 * 0.01 < netProfitGrowthRate && netProfitGrowthRate <= 100 * 0.01) {
                THS.AnalyseDataDict.NetProfitGrowthRate.Result["50%至100%"].push({ StockCode: stockCode, StockName: stockName, NetProfitGrowthRate: netProfitGrowthRate });
            }
            else if (100 * 0.01 < netProfitGrowthRate && netProfitGrowthRate <= 300 * 0.01) {
                THS.AnalyseDataDict.NetProfitGrowthRate.Result["100%至300%"].push({ StockCode: stockCode, StockName: stockName, NetProfitGrowthRate: netProfitGrowthRate });
            }
            else if (300 * 0.01 < netProfitGrowthRate) {
                THS.AnalyseDataDict.NetProfitGrowthRate.Result["300%及以上"].push({ StockCode: stockCode, StockName: stockName, NetProfitGrowthRate: netProfitGrowthRate });
            }
        },

        ///添加到每股现金流维度
        AddToCashFlowShare: function (stockCode, stockName, cashFlowShare) {
            ///初始化
            if (cashFlowShare < 0) {
                THS.AnalyseDataDict.CashFlowShare.Result["负值"].push({ StockCode: stockCode, StockName: stockName, CashFlowShare: cashFlowShare });
            }
            else if (0 < cashFlowShare && cashFlowShare <= 0.5) {
                THS.AnalyseDataDict.CashFlowShare.Result["5毛以下"].push({ StockCode: stockCode, StockName: stockName, CashFlowShare: cashFlowShare });
            }
            else if (0.5 < cashFlowShare && cashFlowShare <= 1.0) {
                THS.AnalyseDataDict.CashFlowShare.Result["5毛1元"].push({ StockCode: stockCode, StockName: stockName, CashFlowShare: cashFlowShare });
            }
            else if (1.0 < cashFlowShare && cashFlowShare <= 2.0) {
                THS.AnalyseDataDict.CashFlowShare.Result["1至2元"].push({ StockCode: stockCode, StockName: stockName, CashFlowShare: cashFlowShare });
            }
            else if (2.0 < cashFlowShare) {
                THS.AnalyseDataDict.CashFlowShare.Result["2元以上"].push({ StockCode: stockCode, StockName: stockName, CashFlowShare: cashFlowShare });
            }
        },

        ///添加到龙虎榜分析
        AddToLHB: function (stockCode, stockName, lhb) {

            if (0 < lhb.Today.length && 0 < lhb.Yesterday.length) ///连续两天都有动作
            {
                var todayMMJC = lhb.TodayCal.MMJC;
                var yesterdayMMJC = lhb.YestodayCal.MMJC;
                var mmjc = (todayMMJC + yesterdayMMJC);
                if (mmjc < 0) {
                    THS.AnalyseDataDict.LHB.Result["负值"].push({ StockCode: stockCode, StockName: stockName, LHBMMJC: mmjc });
                }
                else if (0 < mmjc && mmjc <= 2000) {
                    THS.AnalyseDataDict.LHB.Result["2000万以下"].push({ StockCode: stockCode, StockName: stockName, LHBMMJC: mmjc });
                }
                else if (2000 < mmjc && mmjc <= 5000) {
                    THS.AnalyseDataDict.LHB.Result["2000万至5000万"].push({ StockCode: stockCode, StockName: stockName, LHBMMJC: mmjc });
                }
                else if (5000 < mmjc) {
                    THS.AnalyseDataDict.LHB.Result["5000万以上"].push({ StockCode: stockCode, StockName: stockName, LHBMMJC: mmjc });
                }
            }
        },

        ///添加到大宗交易
        AddToBlockTrade: function (stockCode, stockName, blockTrade) {
            if (0 < blockTrade.length) ///若最近有大宗交易
            {
                var curBlockTrade = blockTrade[0].C1; 
                var premiumRate = blockTrade[0].C5;
                if (((new Date() - curBlockTrade) / 1000 / 3600 / 24) < 7)///七天之内
                if (premiumRate < 0) {
                    THS.AnalyseDataDict.BlockTrade.Result["负值"].push({ StockCode: stockCode, StockName: stockName, PremiumRate: premiumRate });
                }
                else if (0 < premiumRate) {
                    THS.AnalyseDataDict.BlockTrade.Result["正值"].push({ StockCode: stockCode, StockName: stockName, PremiumRate: premiumRate });
                }
            }
        },

        ///添加到融资融券
        AddToMarginTrading: function (stockCode, stockName, marginTrading) {
            if (0 < marginTrading.length) ///若最近有融资融券
            {
                var first = marginTrading[0].C3;
                var last = marginTrading[marginTrading.length - 1].C3;
                var proportion = first - last;
                if (proportion < 0) {
                    THS.AnalyseDataDict.MarginTrading.Result["减少"].push({ StockCode: stockCode, StockName: stockName, Proportion: proportion });
                }
                else if (0 < proportion) {
                    THS.AnalyseDataDict.MarginTrading.Result["增长"].push({ StockCode: stockCode, StockName: stockName, Proportion: proportion });
                }
            }
        },

        ///生成推荐值
        CreateRecommendedValue: function () {
            var earningsShare = this.EarningsShare.Result;
            var netProfitGrowthRate = this.NetProfitGrowthRate.Result;
            var cashFlowShare = this.CashFlowShare.Result;
            var lhb = this.LHB.Result;
            var blockTrade = this.BlockTrade.Result;
            var marginTrading = this.MarginTrading.Result;

            ///股票推荐字典
            var stockCodeDict = {
                Add: function (stockItem, coefficient, groupCoefficient) {
                    if (undefined === stockCodeDict[stockItem.StockCode]) {
                        ///初始化
                        stockCodeDict[stockItem.StockCode] = { StockCode: stockItem.StockCode, StockName: stockItem.StockName, RecommendValue: 0 };
                    }
                    stockCodeDict[stockItem.StockCode].RecommendValue += coefficient;
                }
            };

            var recommendValue = {};

            for (var key in earningsShare) {
                var coefficient = this.EarningsShare.Coefficient[key];///系数
                var stockCodeArray = earningsShare[key];///要分析的股票
                for (var i = 0; i < stockCodeArray.length; i++) {
                    var item = stockCodeArray[i];
                    stockCodeDict.Add(item, coefficient, 1);
                }
            }

            for (var key in netProfitGrowthRate) {
                var coefficient = this.NetProfitGrowthRate.Coefficient[key];///系数
                var stockCodeArray = netProfitGrowthRate[key];///要分析的股票
                for (var i = 0; i < stockCodeArray.length; i++) {
                    var item = stockCodeArray[i];
                    stockCodeDict.Add(item, coefficient, 1);
                }
            }

            for (var key in cashFlowShare) {
                var coefficient = this.CashFlowShare.Coefficient[key];///系数
                var stockCodeArray = cashFlowShare[key];///要分析的股票
                for (var i = 0; i < stockCodeArray.length; i++) {
                    var item = stockCodeArray[i];
                    stockCodeDict.Add(item, coefficient, 1);
                }
            }

            for (var key in lhb) {
                var coefficient = this.LHB.Coefficient[key];///系数
                var stockCodeArray = lhb[key];///要分析的股票
                for (var i = 0; i < stockCodeArray.length; i++) {
                    var item = stockCodeArray[i];
                    stockCodeDict.Add(item, coefficient, 1);
                }
            }

            for (var key in blockTrade) {
                var coefficient = this.BlockTrade.Coefficient[key];///系数
                var stockCodeArray = blockTrade[key];///要分析的股票
                for (var i = 0; i < stockCodeArray.length; i++) {
                    var item = stockCodeArray[i];
                    stockCodeDict.Add(item, coefficient, 1);
                }
            }

            for (var key in marginTrading) {
                var coefficient = this.MarginTrading.Coefficient[key];///系数
                var stockCodeArray = marginTrading[key];///要分析的股票
                for (var i = 0; i < stockCodeArray.length; i++) {
                    var item = stockCodeArray[i];
                    stockCodeDict.Add(item, coefficient, 1);
                }
            }

            

            var c = 0;
            for (var stockCode in stockCodeDict) {
                var item = stockCodeDict[stockCode];
                var recommendValue = item.RecommendValue;
                if (undefined === this.RecommendationDict[recommendValue]) {
                    ///初始化
                    this.RecommendationDict[recommendValue] = [];
                    console.log("初始化")
                }
                this.RecommendationDict[recommendValue].push(item);
                console.log((++c)+"  "+item);
            }

            var db = THS.GetDB();
            var collectionName = THS.Const.Collection.AnalysisResult;
            db.Save(collectionName, this.RecommendationDict, function () {
                console.log("推荐分析数据保存完毕");
            }, 0);
        },

        ///保存数据到数据库中
        SaveData: function () {

            this.CreateRecommendedValue();
 

            var db = THS.GetDB();
            var collectionName = THS.Const.Collection.AnalysisResult;
            db.Save(collectionName, THS.AnalyseDataDict, function () {
                console.log("分析数据保存完毕")
            }, 0);
        }


    },
    ///数据分析
    AnalyseData: function (data) {
        var stockCode = data.StockCode;
        var stockName = data.StockName;

        var company = data.Home.Company.Value; ///公司基本信息，数组
        var lhb = data.Home.LHB;///龙虎榜
        var blockTrade = data.Home.DZJY;///大宗交易
        var marginTrading = data.Home.RZRQ;///融资融券

        THS.AnalyseDataDict.AddToArea(stockCode,stockName,company[0]);///地域维度分析
        THS.AnalyseDataDict.AddToConception(stockCode, stockName, company[1]);///概念维度分析
        THS.AnalyseDataDict.AddToMainBusiness(stockCode, stockName, company[3]);///概念维度分析
        THS.AnalyseDataDict.AddToEarningsShare(stockCode, stockName, company[6]);///每股收益分析
        THS.AnalyseDataDict.AddToNetProfitGrowthRate(stockCode, stockName, company[8]);///净利润增长率分析
        THS.AnalyseDataDict.AddToCashFlowShare(stockCode, stockName, company[10]);///每股现金流分析
        THS.AnalyseDataDict.AddToLHB(stockCode, stockName, lhb);///龙虎榜分析
        THS.AnalyseDataDict.AddToBlockTrade(stockCode, stockName, blockTrade);///大宗交易分析
        THS.AnalyseDataDict.AddToMarginTrading(stockCode, stockName, marginTrading);///融资融券分析



    }

}

module.exports = THS;