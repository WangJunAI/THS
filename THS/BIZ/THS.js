var MongoDB = require("../Core/MongoDB");
var PARAM_CHECKER = require("../Core/PARAM_CHECKER");
var TOOLS = require("../Core/TOOLS")
var THS_BI=require("../BIZ/THS_BI");

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
            Tag:"0918",
            Page: "Page" +"0918", ///原始页面,
            PageData: "PageData" + "0918",///页面一级提取数据
            Log: "Log" + "0918",///性能日志
            AnalysisResult: "AnalysisResult" +"0918",
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
    QueueW:[],
    SavePageData: function (item) {
        //if (undefined === THS.Dict[item.StockCode]) {
        //    THS.Dict[item.StockCode] = item;
        //}
        //else if (undefined != item.Home) {
        //    THS.Dict[item.StockCode].Home = item.Home;
        //}
        //else if (undefined != item.Funds) {
        //    THS.Dict[item.StockCode].Funds = item.Funds;
        //}
        //else if (undefined != item.Event) {
        //    THS.Dict[item.StockCode].Event = item.Event;
        //}
        //else if (undefined != item.Info) {
        //    THS.Dict[item.StockCode].Info = item.Info;
        //}
        //else if (undefined != item.Position) {
        //    THS.Dict[item.StockCode].Position = item.Position;
        //}
        //else if (undefined != item.News) {
        //    THS.Dict[item.StockCode].News = item.News;
        //}
        //else if (undefined != item.DayLine) {
        //    THS.Dict[item.StockCode].DayLine = item.DayLine;
        //}
         
        //if (undefined != THS.Dict[item.StockCode].Home
        //    && undefined != THS.Dict[item.StockCode].Funds
        //    && undefined != THS.Dict[item.StockCode].Event
        //    && undefined != THS.Dict[item.StockCode].Info
        //    && undefined != THS.Dict[item.StockCode].Position
        //    && undefined != THS.Dict[item.StockCode].News
        //    && undefined != THS.Dict[item.StockCode].DayLine
        //) {
        //    var collectionName = THS.Const.Collection.PageData;///原始页面所在集合
        //    var data = THS.Dict[item.StockCode];
        //    delete THS.Dict[item.StockCode];
        //    var db = THS.GetDB();
        //    db.Save(collectionName, data, function () { }, 0);
        //}

        {
            var collectionName = THS.Const.Collection.PageData;///原始页面所在集合
             var db = THS.GetDB();
             db.Save(collectionName, item, function () {console.log("保存完毕"+item.StockName) }, 0);
        }
    },
    TraversePage: function () {
        var db = THS.GetDB();
        var collectionName = THS.Const.Collection.Page;///原始页面所在集合

        ///日志计时
        THS.Log.Start("页面遍历TraversePage");
        //db.Traverse(collectionName, { $or: [/*{ "ContentType": "首页概览" },*//* { "ContentType": "资金流向" },*/ /*{ "ContentType": "公司资料" }, *//*{ "ContentType": "新闻公告" },*//*{ "ContentType": "主力持仓" },*/ /*{ "ContentType": "公司大事" }, */{ "ContentType": "日线数据" }] }, function (data) {//"StockCode": "002417" 

        db.Traverse(collectionName, { $or: [{ "ContentType": "日线数据" }] }, function (data) {//"StockCode": "002417" { "ContentType": "首页概览" }, { "ContentType": "资金流向" }
            var res = {};
            res.StockCode = data.StockCode;
            res.StockName = data.StockName;
            res.ContentType = data.ContentType;
            console.log("Traverse 正在分析页面 " + (++count) + "  " + res.StockCode + res.StockName + " " + data.ContentType);
            if ("首页概览" === data.ContentType) {
                var home = THS.AnalysePageHome(data);///OK
                res.Home = home;
            }
            else if ("资金流向" === data.ContentType) {
                var funds = THS.AnalysePageFunds(data);///OK
                res.Funds = funds;
            }
            else if ("公司资料" === data.ContentType) {
                var company = THS.AnalysePageCompany(data);///OK
                res.Info = company;
            }
            else if ("新闻公告" === data.ContentType) {
                var news = THS.AnalysePageNews(data);//OK
                res.News = news;
            }
            //else if ("财务分析" === data.ContentType) {
            //    //THS.AnalysePageFinance(data);
            //}
            //else if ("经营分析" === data.ContentType) {
            //    //THS.AnalysePageOperate(data);
            //}
            //else if ("股东股本" === data.ContentType) {
            //    //var holder = THS.AnalysePageHolder(data);

            //}
            else if ("主力持仓" === data.ContentType) {
                var position = THS.AnalysePagePosition(data);//OK
                res.Position = position;
            }
            else if ("公司大事" === data.ContentType) {
                var event = THS.AnalysePageEvent(data);//OK
                res.Event = event;
            }
            //else if ("分红融资" === data.ContentType) {
            //    //THS.AnalysePageBonus(data);
            //}
            //else if ("价值分析" === data.ContentType) {
            //    //THS.AnalysePageWorth(data);
            //}
            //else if ("行业分析" === data.ContentType) {
            //    //THS.AnalysePageField(data);
            //}
            else if ("日线数据" === data.ContentType) {
                var dayLine = THS.AnalysePageDayLine(data);///OK
                res.DayLine = dayLine;
            }

            //THS.SavePageData(res);
            THS.QueueW.push(res);
            console.log("Queue.Length " + THS.QueueW.length);
        }, function (endMsg) {
            console.log("遍历结束");

            while (0 < THS.QueueW.length) {
                var q = THS.QueueW.pop();
                console.log("开始保存一个数据" + q.StockName);
                THS.SavePageData(q);
            }


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
            
            console.log("已获取处理 " + res.StockCode + "--" + res.StockName + " " + data.ContentType);
            if (data.ContentType === "首页概览") {
                THS_BI.OverallAnalyse(res.StockCode, res.StockName, data.Home.Company);
            }
            else if (data.ContentType === "资金流向") {
                THS_BI.FundsAnalyse(res.StockCode, res.StockName, data.Funds);
            }
            else if (data.ContentType === "日线数据") {
                THS_BI.CalTargetStock(res.StockCode, res.StockName, data.DayLine);
            }

        }, function (endMsg) {
            THS.Log.Stop("页面数据遍历TraverseData");
            //THS.AnalyseDataDict.SaveData(); ///将分析结果写入数据库
            console.log("遍历结束");
            THS_BI.Save();


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
                C1: TOOLS.Convertor.ToDate(c1.substring(0, 4) + "/" + c1.substring(4, 6) + "/" + c1.substring(6, 8)),
                C2: Number(c2),
                C3: Number(c3.replace("%", "")),
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
        }
            ///数据组装
            funds.Column = { C1: "日期", C2: "收盘价", C3: "涨跌幅", C4: "资金净流入", C5: "5日主力净额", C6: "大单(主力) - 净额", C7: "大单(主力) - 净占比", C8: "中单 - 净额", C9: "中单 - 净占比", C10: "小单 - 净额", C11: "小单 - 净占比" };
            funds.List = fundsHistoryList;

            return funds;
        
         
        // console.log($(company_details).html()); ///这个会有编码问题
    },

    ///分析公司资料数据
    AnalysePageCompany: function (pageData) {
        var $page = $(pageData.Page);
        var Info = {};

        ///详细情况
        var baseTrArray = $page.find("#detail .m_table tbody tr"); ///详细情况
        var base = [];
        ///详细情况
        for (var i = 0; i < baseTrArray.length; i++) {
            var tdArray = $(baseTrArray[i]).children(); ///该行TD数组
            for (var j = 0; j < tdArray.length; j++) {
                var key = $(tdArray[j]).find("strong").text().replace("：", "");
                var value = null;
                if ("公司简介" === key) {
                     value = $(tdArray[j]).find("p").text();
                }
                else {
                     value = $(tdArray[j]).find("span").text();
                }
                
                base[key]= value;
            }
        }

 

        ///高管介绍
        ///预处理 移除$(".person_table").remove()
        $page.find("#manager .person_table").remove();

        var managerTabs = $page.find("#manager .m_tab li a");

        var manager = [];
        for (var i = 0; i < managerTabs.length; i++) {
            var tab = managerTabs[i];
            var tableName = $(tab).attr("targ");
            var tableTitle = $(tab).text();
            var group = { Tab: tableTitle,Mgr:[] };
            var trArray = $page.find("#manager  #" + tableName + " .managelist tbody").eq(0).children();// $("#manager #ml_001 .managelist tbody:eq(0)").children()
            for (var j = 0; j < trArray.length; j++) {
                var tdArray = $(trArray[j]).find("td");
                var c1 = { Name: $(tdArray[0]).text(), Job: $(tdArray[1]).text(), Holding: $(tdArray[2]).text()};
                var c2 = { Name: $(tdArray[3]).text(), Job: $(tdArray[4]).text(), Holding: $(tdArray[5]).text() };
                group.Mgr.push(c1);
                group.Mgr.push(c2);
            }
            manager.push(group);
        }


        ///发行相关
        var publishTdArray = $page.find("#publish .m_table tbody td"); ///发行相关
        var publish = {};
        for (var i = 0; i < publishTdArray.length; i++) {
            var td = publishTdArray[i];
            var key = $(td).find("strong").text().replace("：","");
            var value ="";
            if ("历史沿革" === key) {
                value = $(td).find("p").text();
            }
            else {
                value = $(td).find("span").text();
            }
            publish[key] = value;
        }



        ///参股控股公司
        var shareTrArray = $page.find("#ckg_table  tbody tr"); ///参股控股公司
        var share = [];
        for (var i = 0; i < shareTrArray.length; i++) {
            var tdArray = $(shareTrArray[i]).children();//
            var c1 = $(tdArray[0]).text();///序号
            var c2 = $(tdArray[1]).text();///关联公司名称
            var c3 = $(tdArray[2]).text();///参控关系
            var c4 = $(tdArray[3]).text();///参控比例
            var c5 = $(tdArray[4]).text();///投资金额(元)	
            var c6 = $(tdArray[5]).text();///被参控公司净利润(元)
            var c7 = $(tdArray[6]).text();///是否报表合并
            var c8 = $(tdArray[7]).text();///被参股公司主营业务

            var item = {
                C1: c1,
                C2: c2,
                C3: c3,
                C4: TOOLS.STR.ToNumber( c4),
                C5: TOOLS.STR.ToNumber( c5),
                C6:  TOOLS.STR.ToNumber( c6),
                C7: c7,
                C8: c8,
            };
            share.push(item);
        }

        Info["Intro"] = base;
        Info["Manager"] = manager;
        Info["Publish"] = publish;
        Info["Share"] = share;
        return Info;
    },

    ///分析新闻公告数据 http://stockpage.10jqka.com.cn/ajax/code/002417/type/news/
    AnalysePageNews: function (pageData) {
        var $page = $(pageData.Page.replace("success<!-- 热点新闻模板 -->",""));

        var news = {};
        ///热点新闻
        var hotNews = $page.find("#news dl");

        ///公司公告
        var newslist = $page.find("#pubs li");
        var companyNews = [];
        for (var i = 0; i < newslist.length; i++) {
            var li = newslist[i];
            var href = $(li).find("a").attr("href");
            var title = $(li).find("a").attr("title");
            var date = $(li).find("a span").text();
            var item = {
                Title: title,
                Href:href,
                Date:date
            };
            companyNews.push(item);
        }

        news["Publish"] = companyNews;
        return news;
    },

    ///分析财务分析数据
    AnalysePageFinance: function (pageData) {
        var $page = $(pageData.Page);
        var finance = {};

        var indicatorTabs = $page.find("#data-info .top_thead th");///季度数

    },

    ///分析经营分析数据
    AnalysePageOperate: function (pageData) {
        var $page = $(pageData.Page);

        ///主营介绍
        var items1 = $page.find("#intro .main_intro_list li");
        var mainIntro = [];
        for (var i = 0; i < items1.length; i++) {
            var $li = $(items1[i]);
            var key = $li.find("span").text();
            var value = $li.find("p").text();
            var item = { Key: key, Value: value };
            mainIntro.push(item);
        }

        ///运营业务数据
        var operating1 = $page.find("#operate_table tr");///累计值
        var operating2 = $page.find("#operate_table1 tr");///期末值
        var opData1 = [];///累计值 Cumulative value
        var opData2 = [];///Final value 期末值

        for (var i = 0; i < operating1.length; i++) {
            var tdArray = $(operating1[i]).children();
            var c1 = $(tdArray[0]).text();///业务名称
            var c2 = $(tdArray[1]).text();///时间
            var item = { C1: c1, C2: c2 };
            opData1.push(item);
        }

        for (var i = 0; i < operating2.length; i++) {
            var tdArray = $(operating2[i]).children();
            var c1 = $(tdArray[0]).text();///业务名称
            var c2 = $(tdArray[1]).text();///时间
            var item = { C1: c1, C2: c2 };
            opData2.push(item);
        }

        ///主营构成分析 $("#analysis .m_tab.mt15 li") $("#analysis .m_tab_content table tbody")
        var compositionTabs = $page.find("#analysis .m_tab.mt15 li");
        var composition = [];
        for (var i = 0; i < compositionTabs.length; i++) {
            var tab = $(compositionTabs[0]).text();
            var comTrArray = $("#analysis .m_tab_content table:eq(" + i + ") tbody tr");
            for (var i = 0; i < comTrArray.length; i++) {
                var tdArray = $(comTrArray[i]).children();
                var item = {};
                for (var j = 0; j < tdArray.length; j++) {
                    item["C" + j] = $(tdArray[j]).text();
                }
                composition.push(item);
            }
        }


        ///董事会经营评述
        var observeTabs = $page.find("#observe .m_tab li");
        var observeContents = $page.find("#observe .m_tab_content.m_tab_content2 ");
        var observe = {};
        for (var i = 0; i < observeContents.length; i++) {
            var content = $(observeContents[i]).text();
            var tab = $(observeTabs[i]).text();
            observe[tab] = content;
        }




    },

    ///分析股东股本数据
    AnalysePageHolder: function (pageData) {
        var $page = $(pageData.Page);
        var holder = {};

        ///股东人数
        var gdrsThArray = $page.find("#gdrsTable .data_tbody .top_thead tbody th");///季度数
        var gdrsTrArray = $page.find("#gdrsTable .data_tbody .tbody tbody tr"); ///股东人数  
        var gdrs = [];

        for (var i = 0; i < gdrsThArray.length; i++) { ///初始化
            var item = {
                Total: -1,///股东总人数(户)
                PreChange: -1,///较上期变化
                Circulating: -1,///人均流通股(股)
                Restricted: -1,///人均流通变化
                Industry: -1,///行业平均(户)
            }
            gdrs.push(item);
        }


        for (var i = 0; i < gdrsTrArray.length; i++) {
            var tr = gdrsTrArray[i];
            var tdArr = $(tr).children();
            if (7 === $(tr).children().length) {
                var c1 = $(tdArr[0]).text();///指标\日期
                var c2 = $(tdArr[1]).text();///季度
                var c3 = $(tdArr[2]).text();///季度
                var c4 = $(tdArr[3]).text();///季度
                var c5 = $(tdArr[4]).text();///季度
                var c6 = $(tdArr[5]).text();///季度 
                if (i === 0 || "股东总人数(户)" === c1) {
                    gdrs[0].Total = gdrs[1].Total = gdrs[2].Total = gdrs[3].Total = gdrs[4].Total = c2;
                }
                else if ("较上期变化" === c1) {
                    gdrs[0].PreChange = gdrs[1].PreChange = gdrs[2].PreChange = gdrs[3].PreChange = gdrs[4].PreChange = c3;
                }
                else if ("人均流通股(股)" === c1) {
                    gdrs[0].Circulating = gdrs[1].Circulating = gdrs[2].Circulating = gdrs[3].Circulating = gdrs[4].Circulating = c4;
                }
                else if ("人均流通变化" === c1) {
                    gdrs[0].Restricted = gdrs[1].Restricted = gdrs[2].Restricted = gdrs[3].Restricted = gdrs[4].Restricted = c5;
                }
                else if ("行业平均(户)" === c1) {
                    gdrs[0].Industry = gdrs[1].Industry = gdrs[2].Industry = gdrs[3].Industry = gdrs[4].Industry = c6;
                }
            }
        }


        ///十大流通股东
        var circulationDict = {};
        for (var t = 1; t < 6; t++) {
            var key = $($page.find("#bd_1 li").eq(t - 1)).text();

            var circulationTrArray = $page.find("##bd_list1 #fher_"+t+" table tbody  tr"); ///高管持股变动  
            var circulation = [];
            for (var i = 0; i < circulationTrArray.length; i++) {
                var tr = circulation[i];
                var tdArr = $(tr).children();
                if (7 === $(tr).children().length) {
                    var c1 = $(tdArr[0]).text();///机构或基金名称
                    var c2 = $(tdArr[1]).text();///持有数量(股)
                    var c3 = $(tdArr[2]).text();///持股变化(股)
                    var c4 = $(tdArr[3]).text();///占流通股比例
                    var c5 = $(tdArr[4]).text();///实际增减持
                    var c6 = $(tdArr[5]).text();///股份类型
                    var c7 = $(tdArr[6]).attr("onclick");///持股详情


                    var item = {
                        C1: c1,
                        C2: c2,
                        C3: c3,
                        C4: c4,
                        C5: c5,
                        C6: c6,
                        C7: c7,
                    };
                    circulation.push(item);
                }
            }

            circulationDict[key] = circulation;
        }


        ///十大股东
        var shareholderDict = {};
        for (var t = 1; t < 6; t++) {
            var key = $($page.find("#bd_0 li").eq(t - 1)).text();

            var shareholderTrArray = $page.find("#bd_list0 #fher_" + t + " table tbody  tr"); ///高管持股变动  
            var shareholder = [];
            for (var i = 0; i < shareholderTrArray.length; i++) {
                var tr = shareholder[i];
                var tdArr = $(tr).children();
                if (7 === $(tr).children().length) {
                    var c1 = $(tdArr[0]).text();///机构或基金名称
                    var c2 = $(tdArr[1]).text();///持有数量(股)
                    var c3 = $(tdArr[2]).text();///持股变化(股)
                    var c4 = $(tdArr[3]).text();///占流通股比例
                    var c5 = $(tdArr[4]).text();///实际增减持
                    var c6 = $(tdArr[5]).text();///股份类型
                    var c7 = $(tdArr[6]).attr("onclick");///持股详情


                    var item = {
                        C1: c1,
                        C2: c2,
                        C3: c3,
                        C4: c4,
                        C5: c5,
                        C6: c6,
                        C7: c7,
                    };
                    shareholder.push(item);
                }
            }

            shareholderDictDict[key] = circulation;
        }

        ///解禁时间表
        var liftingScheduleTrArray = $page.find("#liftban tbody  tr"); ///近期重要事件  
        var liftingSchedule = [];
        for (var i = 0; i < liftingScheduleTrArray.length; i++) {
            var tr = liftingScheduleTrArray[i];
            var tdArr = $(tr).children();
            if (2 === $(tr).children().length) {
                var c1 = $(tdArr[0]).text();///解禁日期
                var c2 = $(tdArr[1]).text();///解禁股成本(元)
                var c3 = $(tdArr[2]).text();///前日收盘价(元)
                var c4 = $(tdArr[3]).text();///解禁市值(元)
                var c5 = $(tdArr[4]).text();///解禁股占总股本比例
                var c6 = $(tdArr[5]).text();///解禁股份类型
                var c7 = $(tdArr[6]).text();///是否实际值
                 
                var item = {
                    C1: c1,
                    C2: c2,
                    C3: c3,
                    C4: c4,
                    C5: c5,
                    C6: c6,
                    C7: c7
                };
                liftingSchedule.push(item);
            }
        }

        ///总股本结构
        var capitTrArray = $page.find("#stockcapit tbody  tr"); ///近期重要事件  
        var capit = [];

        for (var i = 0; i < 6; i++) {
            var item = {
                Total: -1,///总股本(股)
                ATotal: -1,///A股总股本(股)
                Circulating : -1,///流通A股(股)
                Restricted : -1,///限售A股(股)
                Reason: -1,///变动原因
            }
            capit.push(item);
        }


        for (var i = 0; i < capitTrArray.length; i++) {
            var tr = capitTrArray[i];
            var tdArr = $(tr).children();
            if (7 === $(tr).children().length) {
                var c1 = $(tdArr[0]).text();///指标\日期
                var c2 = $(tdArr[1]).text();///季度
                var c3 = $(tdArr[2]).text();///季度
                var c4 = $(tdArr[3]).text();///季度
                var c5 = $(tdArr[4]).text();///季度
                var c6 = $(tdArr[5]).text();///季度 
                var c7 = $(tdArr[6]).text();///季度 

                if ("总股本(股)" === c1) {
                    capit[0].Total = capit[1].Total = capit[2].Total = capit[3].Total = capit[4].Total = c2;
                }
                else if ("A股总股本(股)" === c1) {
                    capit[0].ATotal = capit[1].ATotal = capit[2].ATotal = capit[3].ATotal = capit[4].ATotal = c3;
                }
                else if ("流通A股(股)" === c1) {
                    capit[0].Circulating = capit[1].Circulating = capit[2].Circulating = capit[3].Circulating = capit[4].Circulating = c4;
                }
                else if ("限售A股(股)" === c1) {
                    capit[0].Restricted = capit[1].Restricted = capit[2].Restricted = capit[3].Restricted = capit[4].Restricted = c5;
                }
                else if ("变动原因" === c1) {
                    capit[0].Reason = capit[1].Reason = capit[2].Reason = capit[3].Reason = capit[4].Reason = c6;
                }
            }
        }

        ///A股历次股本变动
        var stockChangeTrArray = $page.find("#astockchange tbody  tr"); ///近期重要事件  
        var stockChange = [];
        for (var i = 0; i < stockChangeTrArray.length; i++) {
            var tr = stockChangeTrArray[i];
            var tdArr = $(tr).children();
            if (5 === $(tr).children().length) {
                var c1 = $(tdArr[0]).text();///变动日期
                var c2 = $(tdArr[1]).text();///变动原因
                var c3 = $(tdArr[2]).text();///变动后A股总股本(股)
                var c4 = $(tdArr[3]).text();///变动后流通A股(股)
                var c5 = $(tdArr[4]).text();///变动后限售A股(股)


                var item = {
                    C1: c1,
                    C2: c2,
                    C3: c3,
                    C4: c4,
                    C5: c5,
                };
                stockChange.push(item);
            }
        }



    },

    ///分析主力持仓数据
    AnalysePagePosition: function (pageData) {
        var $page = $(pageData.Page);
        var position = {};

        ///机构持股汇总
        var organholdThArray = $page.find("#organhold thead  th"); ///近期重要事件  
        var organholdTrArray = $page.find("#organhold tbody  tr"); ///近期重要事件  
        var organhold = [];

        for (var i = 1; i < organholdThArray.length; i++) {
            var item = {
                Date: TOOLS.Convertor.ToDate($(organholdThArray[1]).text()),///时间
                Count: -1,///机构数量(家)
                Share: -1,///累计持有数量(股)
                MarketValue: -1,///累计市值(元)
                Ratio: -1,///持仓比例
                Change: -1,///较上期变化(股)
            }

            organhold.push(item);
        }
         

        for (var i = 0; i < organholdTrArray.length; i++) {
            var tr = organholdTrArray[i];
            var tdArr = $(tr).children();
            if (6 === $(tr).children().length) {
                var c1 = $(tdArr[0]).text();///主力进出\报告期
                var c2 = $(tdArr[1]).text();///季度
                var c3 = $(tdArr[2]).text();///季度
                var c4 = $(tdArr[3]).text();///季度
                var c5 = $(tdArr[4]).text();///季度
                var c6 = $(tdArr[5]).text();///季度 
                if ("机构数量(家)" === c1) {
                    organhold[0].Count = parseInt(c2);
                    organhold[1].Count = parseInt(c3);
                    organhold[2].Count = parseInt(c4);
                    organhold[3].Count = parseInt(c5);
                    organhold[4].Count = parseInt(c6);
                }
                else if ("累计持有数量(股)" === c1) {
                    organhold[0].Share = TOOLS.STR.ToNumber(c2);
                    organhold[1].Share = TOOLS.STR.ToNumber(c3);
                    organhold[2].Share = TOOLS.STR.ToNumber(c4);
                    organhold[3].Share = TOOLS.STR.ToNumber(c5);
                    organhold[4].Share = TOOLS.STR.ToNumber(c6);
                }
                else if ("累计市值(元)" === c1) {
                    organhold[0].MarketValue = TOOLS.STR.ToNumber( c2);
                    organhold[1].MarketValue = TOOLS.STR.ToNumber( c3);
                    organhold[2].MarketValue = TOOLS.STR.ToNumber(c4);
                    organhold[3].MarketValue = TOOLS.STR.ToNumber(c5);
                    organhold[4].MarketValue = TOOLS.STR.ToNumber(c6);
                }
                else if ("持仓比例" === c1) {
                    organhold[0].Ratio = TOOLS.STR.ToNumber(c2);
                    organhold[1].Ratio = TOOLS.STR.ToNumber( c3);
                    organhold[2].Ratio = TOOLS.STR.ToNumber( c4);
                    organhold[3].Ratio = TOOLS.STR.ToNumber( c5);
                    organhold[4].Ratio = TOOLS.STR.ToNumber( c6);
                }
                else if ("较上期变化(股)" === c1) {
                    organhold[0].Change = c2;
                    organhold[1].Change = c3;
                    organhold[2].Change = c4;
                    organhold[3].Change = c5;
                    organhold[4].Change = c6;
                }
            }
        }

        ///机构持股明细
        var shareholdingDetailTabArray = $page.find("#holdetail ul li a[targ]");
        var shareholdingDetail = [];

        for (var i = 0; i < shareholdingDetailTabArray.length; i++) {
            var tab = shareholdingDetailTabArray[i];
            var targ = $(tab).attr("targ");
            var tabTitle = $(tab).text();
            var trArray = $page.find("#holdetail #" + targ + " tbody tr");
            for (var j = 0; j < trArray.length; j++) {
                var tdArray = $(trArray[j]).children();
                if (6 === tdArray.length) {
                    var c1 = $(tdArray[0]).text();///日期机构或基金名称
                    var c2 = $(tdArray[1]).text();///机构类型
                    var c3 = $(tdArray[2]).text();///持有数量(股)
                    var c4 = $(tdArray[3]).text();///持股市值(元)
                    var c5 = $(tdArray[4]).text();///占流通股比例
                    var c6 = $(tdArray[5]).text();///增减情况(股)

                    var item = {
                        C1: c1,
                        C2: c2,
                        C3: TOOLS.STR.ToNumber(c3),
                        C4:  TOOLS.STR.ToNumber(c4),
                        C5: TOOLS.STR.ToNumber(c5),
                        C6: c6,
                    };
                    shareholdingDetail.push(item);
                }
            }
        }
 
        ///IPO获配机构
        var ipoallotTrArray = $page.find("#ipoallot tbody  tr"); ///近期重要事件  
        var ipoallot = [];
        for (var i = 0; i < ipoallotTrArray.length; i++) {
            var tr = ipoallotTrArray[i];
            var tdArr = $(tr).children();
            if (6 === $(tr).children().length) {
                var c1 = $(tdArr[0]).text();///序号
                var c2 = $(tdArr[1]).text();///机构名称
                var c3 = $(tdArr[2]).text();///获配数量(股)
                var c4 = $(tdArr[3]).text();///申购数量(股)
                var c5 = $(tdArr[4]).text();///锁定期(月)
                var c6 = $(tdArr[5]).text();///机构类型

                var item = {
                    C1: c1,
                    C2: c2,
                    C3: TOOLS.STR.ToNumber(c3),
                    C4: TOOLS.STR.ToNumber(c4),
                    C5: TOOLS.STR.ToNumber(c5),
                    C6: c6,
                };
                ipoallot.push(item);
            }
        }


        position["Organhold"] = organhold;
        position["Detail"] = shareholdingDetail;
        position["IPO"] = ipoallot;
        return position;
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
        var $page = $(pageData.Page);
        var trArray = $page.find("#bonus_table tbody tr");
        var bonus = [];
        for (var i = 0; i < trArray.length; i++) {
            var tdArray = $(trArray[i]).children();
            var item = {};
            for (var j = 0; j < length; j++) {
                item["C" + j] = $(tdArray[j]).text();
            }
            bonus.push(item);
        }

        ///增发概况
        var additionprofileTr = $page.find("#additionprofile_bd");
        var tableData = {};

    },

    ///分析价值分析数据
    AnalysePageWorth: function (pageData) {

    },

    ///分析行业分析数据
    AnalysePageField: function (pageData) {

    },

    ///日线数据分析
    AnalysePageDayLine: function (pageData) {
        var jsonString = pageData.Page;
        var str = jsonString.substring("quotebridge_v2_line_hs_000000_01_last(".length);
        str = str.substring(0, str.lastIndexOf(')'));
        var item = JSON.parse(str);
        var dayArray = item.data.split(/;/g);
        var lineArray = [];
        for (var i = 0; i < dayArray.length; i++) {
            var arr = dayArray[i].split(/,/g);
            var dayLine = {};
            dayLine["Date"] = parseInt(arr[0]);///日期，原始格式 20170913
            dayLine["Opening"] = Number(arr[1]);///开盘价
            dayLine["Max"] = Number(arr[2]);//最高价
            dayLine["Lowest"] = Number(arr[3]);//最低价
            dayLine["Closing"] = Number(arr[4]);//收盘价
            dayLine["Volume"] = Number(arr[5]);//成交量
            dayLine["Turnover"] = Number( arr[6]);//成交额
            dayLine["Rate"] = Number(arr[7]);//换手率

            lineArray.push(dayLine);
        }
        item.data = lineArray;
        return item;
    },

 

}

module.exports = THS;