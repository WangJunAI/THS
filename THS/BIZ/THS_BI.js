var MongoDB = require("../Core/MongoDB");
var PARAM_CHECKER = require("../Core/PARAM_CHECKER");
var TOOLS = require("../Core/TOOLS")
var fs = require('fs');

var $ = require('cheerio');


///同花顺数据分析
var THS_BI = {
    OverallAnalyse: function () { },///总体分析
    RecommandStock: function () { },///计算推荐股票
    CalGeographical: function () { },///按地域分布进行计算
    CalConception: function () { },///按涉及概念进行计算
    CalMainBusiness: function () { },///按主营业务进行计算
    CalNetAssets: function () { },///按每股净资产进行计算
    CalShareEarnings: function () { },///按每股收益进行计算
    CalGrowthRate: function () { },///按净利润增长率进行计算
    CalCashFlow: function () { },///按每股现金流进行计算
    CalWarning: function () { },///计算预警
    CalStock: function () { },///个股健康度评估计算
    CalPriceTrend: function () { },///个股价格走势计算评估计算
    CalTargetStock: function () { }, ///获取今日上涨股票
    CalFunds: function () { },///计算资金流入

    MemData: {},///内存数据

    DB: {
        Save: function () {
            console.log("正在保存BI数据");
            var db = THS_BI.DB.GetDB();
            db.Save("THSBI", THS_BI.MemData, function () {
                fs.writeFile('E:\\area.js', "var areaData="+JSON.stringify(THS_BI.MemData["地域分布"]));
                fs.writeFile('E:\\conception.js', "var conceptionData=" + JSON.stringify(THS_BI.MemData["概念分布"]));
                fs.writeFile('E:\\NetAssets.js', "var netAssetsData=" + JSON.stringify(THS_BI.MemData["每股净资产"]));
                fs.writeFile('E:\\ShareEarnings.js', "var shareEarningsData=" + JSON.stringify(THS_BI.MemData["每股收益"]));
                fs.writeFile('E:\\growthRate.js', "var growthRateData=" + JSON.stringify(THS_BI.MemData["净利润增长率"]));
                fs.writeFile('E:\\CashFlow.js', "var cashFlowData=" + JSON.stringify(THS_BI.MemData["每股现金流"]));
            }, 0);
        },
        GetDB: function () {
            var opt = MongoDB.GetEmptyOption();
            opt.url = "mongodb://192.168.0.140:27017/THSBI";
            THS_BI.DB.db = MongoDB.GetInst("THSBI", opt);
            return THS_BI.DB.db;
        },
        db:null,
    },

    Save: function () {
        THS_BI.RecommandStock();
        THS_BI.DB.Save();
    }
}

///内存数据初始化
THS_BI.MemData.Initial = function () {
    THS_BI.MemData["地域分布"] = {};///Key:地域 Value:[{StockCode,StockName}]
}
///
THS_BI.MemData.Enqueue = function (groupKey, key, value) {
    if (undefined === THS_BI.MemData[groupKey]) {
        THS_BI.MemData[groupKey] = {};
    }
    if (undefined === THS_BI.MemData[groupKey][key]) {
        THS_BI.MemData[groupKey][key] = [];
    }
    THS_BI.MemData[groupKey][key].push(value);
}

THS_BI.MemData.AddValue = function (groupKey, key, value) {
    if (undefined === THS_BI.MemData[groupKey]) {
        THS_BI.MemData[groupKey] = {};
    }
    if (undefined === THS_BI.MemData[groupKey][key]) {
        THS_BI.MemData[groupKey][key] = 0;
    }
    THS_BI.MemData[groupKey][key]+=value;
}

THS_BI.MemData.AddObject = function (groupKey, key, obj) {
    if (undefined === THS_BI.MemData[groupKey]) {
        THS_BI.MemData[groupKey] = {};
    }
    if (undefined === THS_BI.MemData[groupKey][key]) {
        THS_BI.MemData[groupKey][key] = {};
    }
    THS_BI.MemData[groupKey][key] =obj;
}
 
////按地域分布进行计算 source 是 Home.Company 属性
THS_BI.CalGeographical = function (stockCode,stockName , source) {
    var area = source.Value[0];
    THS_BI.MemData.Enqueue("地域分布", area, { StockCode: stockCode, StockName: stockName });
}

////按概念分布进行计算 source 是 Home.Company 属性
THS_BI.CalConception = function (stockCode, stockName, source) {
    var conception = source.Value[1].split(/，/g);
    for (var i = 0; i < conception.length; i++) {
        THS_BI.MemData.Enqueue("概念分布", conception[i].replace('.','_'), { StockCode: stockCode, StockName: stockName });
    }
}

////按主营业务进行计算 source 是 Home.Company 属性
THS_BI.CalMainBusiness = function (stockCode, stockName, source) {
    var business = source.Value[3].split(/[,。.;；、]/g);
    for (var i = 0; i < business.length; i++) {
        THS_BI.MemData.Enqueue("概念分布", business[i], { StockCode: stockCode, StockName: stockName });
    }
}

////按每股净资产进行计算 source 是 Home.Company 属性
THS_BI.CalNetAssets = function (stockCode, stockName, source) {
    var netAssets = source.Value[5];///每股净资产
    if (netAssets <= 0) {
        THS_BI.MemData.Enqueue("每股净资产", "负值", { StockCode: stockCode, StockName: stockName });
    }
    else if (0 < netAssets && netAssets < 2) {
        THS_BI.MemData.Enqueue("每股净资产", "2元以内", { StockCode: stockCode, StockName: stockName });
    }
    else if (2 < netAssets && netAssets <= 5) {
        THS_BI.MemData.Enqueue("每股净资产", "2至5元", { StockCode: stockCode, StockName: stockName });
    }
    else if (5 < netAssets && netAssets <= 8) {
        THS_BI.MemData.Enqueue("每股净资产", "5至8元", { StockCode: stockCode, StockName: stockName });
    }
    else if (8 < netAssets && netAssets <= 10) {
        THS_BI.MemData.Enqueue("每股净资产", "8至10元", { StockCode: stockCode, StockName: stockName });
    }
    else if (10 < netAssets && netAssets <= 1000) {
        THS_BI.MemData.Enqueue("每股净资产", "10元以上", { StockCode: stockCode, StockName: stockName });
    }
}

////按每股收益进行计算 source 是 Home.Company 属性
THS_BI.CalShareEarnings = function (stockCode, stockName, source) {
    var earnings = source.Value[6];///每股收益
    if (earnings <= 0) {
        THS_BI.MemData.Enqueue("每股收益", "负值", { StockCode: stockCode, StockName: stockName });
    }
    else if (0 < earnings && earnings<0.5) {
        THS_BI.MemData.Enqueue("每股收益", "5毛以内", { StockCode: stockCode, StockName: stockName });
    }
    else if (0.5 < earnings && earnings <= 1) {
        THS_BI.MemData.Enqueue("每股收益", "5毛至1元", { StockCode: stockCode, StockName: stockName });
    }
    else if (1 < earnings) {
        THS_BI.MemData.Enqueue("每股收益", "1元以上", { StockCode: stockCode, StockName: stockName });
    }

    if (0.5 < earnings) {
        THS_BI.MemData.AddValue("今日股票推荐", stockCode+stockName, 1);
    }
    
}

////按净利润增长率进行计算 source 是 Home.Company 属性
THS_BI.CalGrowthRate = function (stockCode, stockName, source) {
    var growthRate = source.Value[8];///净利润增长率
    if (growthRate <= 0) {
        THS_BI.MemData.Enqueue("净利润增长率", "负值", { StockCode: stockCode, StockName: stockName });
    }
    else if (0 < growthRate && growthRate < 20) {
        THS_BI.MemData.Enqueue("净利润增长率", "20%以内", { StockCode: stockCode, StockName: stockName });
    }
    else if (20 < growthRate && growthRate <= 100) {
        THS_BI.MemData.Enqueue("净利润增长率", "20%至100%", { StockCode: stockCode, StockName: stockName });
    }
    else if (100 < growthRate && growthRate <= 200) {
        THS_BI.MemData.Enqueue("净利润增长率", "100%至200%", { StockCode: stockCode, StockName: stockName });
    }
    else if (200 < growthRate && growthRate <= 300) {
        THS_BI.MemData.Enqueue("净利润增长率", "200%至300%", { StockCode: stockCode, StockName: stockName });
    }
    else if (300 < growthRate && growthRate <= 400) {
        THS_BI.MemData.Enqueue("净利润增长率", "300%至400%", { StockCode: stockCode, StockName: stockName });
    }
    else if (400 < growthRate && growthRate <= 500) {
        THS_BI.MemData.Enqueue("净利润增长率", "400%至500%", { StockCode: stockCode, StockName: stockName });
    }
    else if (500 < growthRate) {
        THS_BI.MemData.Enqueue("净利润增长率", "300%以上", { StockCode: stockCode, StockName: stockName });
    }

    if (100 < growthRate) {
        THS_BI.MemData.AddValue("今日股票推荐", stockCode+stockName, 1);
    }
}

////按每股现金流进行计算 source 是 Home.Company 属性
THS_BI.CalCashFlow = function (stockCode, stockName, source) {
    var cashFlow = source.Value[10];///每股现金流
    if (cashFlow <= 0) {
        THS_BI.MemData.Enqueue("每股现金流", "负值", { StockCode: stockCode, StockName: stockName });
    }
    else if (0 < cashFlow && cashFlow <0.5) {
        THS_BI.MemData.Enqueue("每股现金流", "5毛以内", { StockCode: stockCode, StockName: stockName });
    }
    else if (0.5 < cashFlow && cashFlow < 1) {
        THS_BI.MemData.Enqueue("每股现金流", "5毛至1元", { StockCode: stockCode, StockName: stockName });
    } 
    else if (1 < cashFlow && cashFlow < 2) {
        THS_BI.MemData.Enqueue("每股现金流", "1至2元", { StockCode: stockCode, StockName: stockName });
    }
    else if (2 < cashFlow && cashFlow <= 5) {
        THS_BI.MemData.Enqueue("每股现金流", "2至5元", { StockCode: stockCode, StockName: stockName });
    }
    else if (5 < cashFlow) {
        THS_BI.MemData.Enqueue("每股现金流", "5元以上", { StockCode: stockCode, StockName: stockName });
    }

    if (1 < cashFlow) {
        THS_BI.MemData.AddValue("今日股票推荐", stockCode+stockName, 1);
    }
}

///总体分析
THS_BI.OverallAnalyse = function (stockCode, stockName, source) {
    console.log("正在处理 " + stockCode + "  " + stockName);
    THS_BI.CalGeographical(stockCode, stockName, source);///按地域分布进行计算
    THS_BI.CalConception(stockCode, stockName, source);///按概念分布进行计算
    THS_BI.CalMainBusiness(stockCode, stockName, source);///按主营业务进行计算
    THS_BI.CalNetAssets(stockCode, stockName, source);///按每股净资产进行计算
    THS_BI.CalShareEarnings(stockCode, stockName, source);///按每股收益进行计算
    THS_BI.CalGrowthRate(stockCode, stockName, source);///按净利润增长率进行计算
    THS_BI.CalCashFlow(stockCode, stockName, source);///按每股现金流进行计算
}

THS_BI.FundsAnalyse = function (stockCode, stockName, source) {
    THS_BI.CalFunds(stockCode, stockName, source);
}

////按资金流入进行计算 source 是 Funds 属性
THS_BI.CalFunds = function (stockCode, stockName, source) {
    ///分析维度: 2日内资金净流入;3日内资金净流入;4日内资金净流入;5日内资金净流入;
    ///分析维度: 2日内主力占比;3日内主力占比;4日内主力占比;5日内主力占比;
    ///分析维度: 2日内中单出逃占比;3日内中单出逃占比;4日内中单出逃占比;5日内中单出逃占比;
    ///分析维度: 2日内中单出逃占比;3日内中单出逃占比;4日内中单出逃占比;5日内中单出逃占比;
    var funds = source.List;
    var c1 = funds[0].C4; var c2 = funds[1].C4; var c3 = funds[2].C4; var c4 = funds[3].C4; var c5 = funds[5].C4; ///资金流入量
    var d1 = funds[0].C6; var d2 = funds[1].C6; var d3 = funds[2].C6; var d4 = funds[3].C6; var d5 = funds[5].C6; ///大单净额
    var e1 = funds[0].C7; var e2 = funds[1].C7; var e3 = funds[2].C7; var e4 = funds[3].C7; var e5 = funds[5].C7; ///大单占比
    var f1 = funds[0].C8; var f2 = funds[1].C8; var f3 = funds[2].C8; var f4 = funds[3].C8; var f5 = funds[5].C8; ///中单净额
    var g1 = funds[0].C9; var g2 = funds[1].C9; var g3 = funds[2].C9; var g4 = funds[3].C9; var g5 = funds[5].C9; ///中单占比


    ///2日资金流入量分析
    if (c1 + c2<0) {
        THS_BI.MemData.Enqueue("2日资金流入量", "负值", { StockCode: stockCode, StockName: stockName });
    }
    else if (0 < (c1 + c2) && (c1 + c2)<= 1000) {
        THS_BI.MemData.Enqueue("2日资金流入量", "1千万以内", { StockCode: stockCode, StockName: stockName });
    }
    else if (1000 < (c1 + c2) && (c1 + c2) <= 3000) {
        THS_BI.MemData.Enqueue("2日资金流入量", "1至3千万", { StockCode: stockCode, StockName: stockName });
    }
    else if (3000 < (c1 + c2) && (c1 + c2) <= 5000) {
        THS_BI.MemData.Enqueue("2日资金流入量", "3至5千万", { StockCode: stockCode, StockName: stockName });
    }
    else if (5000 < (c1 + c2) && (c1 + c2) <= 10000) {
        THS_BI.MemData.Enqueue("2日资金流入量", "5千万至1亿", { StockCode: stockCode, StockName: stockName });
    }
    else if (10000 < (c1 + c2) && (c1 + c2) <= 1000000) {
        THS_BI.MemData.Enqueue("2日资金流入量", "1亿以上", { StockCode: stockCode, StockName: stockName });
    }

    if (5000 < (c1 + c2)) {
        THS_BI.MemData.AddValue("今日股票推荐", stockCode+stockName, 1);
    }

    /////回测使用 前2,3天
    if (c2 + c3 < 0) {
        THS_BI.MemData.Enqueue("回测2日资金流入量", "负值", { StockCode: stockCode, StockName: stockName });
    }
    else if (0 < (c2 + c3) && (c2 + c3) <= 1000) {
        THS_BI.MemData.Enqueue("回测2日资金流入量", "1千万以内", { StockCode: stockCode, StockName: stockName });
    }
    else if (1000 < (c2 + c3) && (c2 + c3) <= 3000) {
        THS_BI.MemData.Enqueue("回测2日资金流入量", "1至3千万", { StockCode: stockCode, StockName: stockName });
    }
    else if (3000 < (c2 + c3) && (c2 + c3) <= 5000) {
        THS_BI.MemData.Enqueue("回测2日资金流入量", "3至5千万", { StockCode: stockCode, StockName: stockName });
    }
    else if (5000 < (c2 + c3) && (c2 + c3) <= 10000) {
        THS_BI.MemData.Enqueue("回测2日资金流入量", "5千万至1亿", { StockCode: stockCode, StockName: stockName });
    }
    else if (10000 < (c2 + c3) && (c2 + c3) <= 1000000) {
        THS_BI.MemData.Enqueue("回测2日资金流入量", "1亿以上", { StockCode: stockCode, StockName: stockName });
    }

    /////


    ///3日资金流入量分析
    if (c1 + c2 + c3 < 0) {
        THS_BI.MemData.Enqueue("3日资金流入量", "负值", { StockCode: stockCode, StockName: stockName });
    }
    else if (0 < (c1 + c2 + c3) && (c1 + c2 + c3) <= 1000) {
        THS_BI.MemData.Enqueue("3日资金流入量", "1千万以内", { StockCode: stockCode, StockName: stockName });
    }
    else if (1000 < (c1 + c2 + c3) && (c1 + c2 + c3) <= 3000) {
        THS_BI.MemData.Enqueue("3日资金流入量", "1至3千万", { StockCode: stockCode, StockName: stockName });
    }
    else if (3000 < (c1 + c2 + c3) && (c1 + c2 + c3) <= 5000) {
        THS_BI.MemData.Enqueue("3日资金流入量", "3至5千万", { StockCode: stockCode, StockName: stockName });
    }
    else if (5000 < (c1 + c2 + c3) && (c1 + c2 + c3) <= 10000) {
        THS_BI.MemData.Enqueue("3日资金流入量", "5千万至1亿", { StockCode: stockCode, StockName: stockName });
    }
    else if (10000 < (c1 + c2 + c3) && (c1 + c2 + c3) <= 1000000) {
        THS_BI.MemData.Enqueue("3日资金流入量", "1亿以上", { StockCode: stockCode, StockName: stockName });
    }

    if (5000 < (c1 + c2 + c3)) {
        THS_BI.MemData.AddValue("今日股票推荐", stockCode + stockName, 1);
    }

    /////回测使用
    if (c2 + c3 + c4 < 0) {
        THS_BI.MemData.Enqueue("回测3日资金流入量", "负值", { StockCode: stockCode, StockName: stockName });
    }
    else if (0 < (c2 + c3 + c4) && (c2 + c3 + c4) <= 1000) {
        THS_BI.MemData.Enqueue("回测3日资金流入量", "1千万以内", { StockCode: stockCode, StockName: stockName });
    }
    else if (1000 < (c2 + c3 + c4) && (c2 + c3 + c4) <= 3000) {
        THS_BI.MemData.Enqueue("回测3日资金流入量", "1至3千万", { StockCode: stockCode, StockName: stockName });
    }
    else if (3000 < (c2 + c3 + c4) && (c2 + c3 + c4) <= 5000) {
        THS_BI.MemData.Enqueue("回测3日资金流入量", "3至5千万", { StockCode: stockCode, StockName: stockName });
    }
    else if (5000 < (c2 + c3 + c4) && (c2 + c3 + c4) <= 10000) {
        THS_BI.MemData.Enqueue("回测3日资金流入量", "5千万至1亿", { StockCode: stockCode, StockName: stockName });
    }
    else if (10000 < (c2 + c3 + c4) && (c2 + c3 + c4) <= 1000000) {
        THS_BI.MemData.Enqueue("回测3日资金流入量", "1亿以上", { StockCode: stockCode, StockName: stockName });
    }

    /////



    ///2日内资金量全部为正
    if (0 < c1 && 0 < c2 ) {
        THS_BI.MemData.Enqueue("2日内资金量全部为正", "正值", { StockCode: stockCode, StockName: stockName });

        THS_BI.MemData.AddValue("今日股票推荐", stockCode + stockName, 1);

    }

    ///回测
    if (0 < c2 && 0 < c3) {
        THS_BI.MemData.Enqueue("回测2日内资金量全部为正", "正值", { StockCode: stockCode, StockName: stockName });
    }
    ///


    ///2日内资金量增加
    if (0 < c1 && 0 < c2 && c2 < c1) {
        THS_BI.MemData.Enqueue("2日内资金量全部为正且增加", "正值", { StockCode: stockCode, StockName: stockName });
        THS_BI.MemData.AddValue("今日股票推荐", stockCode+stockName, 1);
    }

    ///回测
    if (0 < c2 && 0 < c3 && c3 < c2) {
        THS_BI.MemData.Enqueue("回测2日内资金量全部为正且增加", "正值", { StockCode: stockCode, StockName: stockName });
    }




    ///2日内大单净额为正
    if (0 < d1 && 0 < d2) {
        THS_BI.MemData.Enqueue("2日内大单净额全部为正", "正值", { StockCode: stockCode, StockName: stockName });
        THS_BI.MemData.AddValue("今日股票推荐", stockCode + stockName, 1);

    }

    ///回测
    if (0 < d2 && 0 < d3) {
        THS_BI.MemData.Enqueue("回测2日内大单净额全部为正", "正值", { StockCode: stockCode, StockName: stockName });
    }

    ///2日内大单净额为正
    if (0 < d1 && 0 < d2 && d2 < d1) {
        THS_BI.MemData.Enqueue("2日内大单净额全部为正且增加", "正值", { StockCode: stockCode, StockName: stockName });
        THS_BI.MemData.AddValue("今日股票推荐", stockCode + stockName, 1);
        THS_BI.MemData.AddValue("今日股票推荐", stockCode + stockName, 1);

    }

    ///回测
    if (0 < d2 && 0 < d3 && d3 < d2) {
        THS_BI.MemData.Enqueue("回测2日内大单净额全部为正且增加", "正值", { StockCode: stockCode, StockName: stockName });
    }

    ///2日内大单占比为正
    if (0 < e1 && 0 < e2) {
        THS_BI.MemData.Enqueue("2日内大单占比全部为正", "正值", { StockCode: stockCode, StockName: stockName });
        THS_BI.MemData.AddValue("今日股票推荐", stockCode + stockName, 1);

    }

    ///回测
    if (0 < e2 && 0 < e3) {
        THS_BI.MemData.Enqueue("回测2日内大单占比全部为正", "正值", { StockCode: stockCode, StockName: stockName });
    }

    ///2日内大单占比全部为正且增加
    if (0 < e1 && 0 < e2 && e2 < e1) {
        THS_BI.MemData.Enqueue("2日内大单占比全部为正且增加", "正值", { StockCode: stockCode, StockName: stockName });
        THS_BI.MemData.AddValue("今日股票推荐", stockCode+stockName, 1);
    }

    ///回测
    if (0 < e2 && 0 < e3 && e3 < e2) {
        THS_BI.MemData.Enqueue("回测2日内大单占比全部为正且增加", "正值", { StockCode: stockCode, StockName: stockName });
    }

    ///2日内中单净额为正
    if (0 < f1 && 0 < f2) {
        THS_BI.MemData.Enqueue("2日内中单净额全部为正", "正值", { StockCode: stockCode, StockName: stockName });
    }

    if (0 < f2 && 0 < f3) {
        THS_BI.MemData.Enqueue("回测2日内中单净额全部为正", "正值", { StockCode: stockCode, StockName: stockName });
        THS_BI.MemData.AddValue("今日股票推荐", stockCode + stockName, 1);

    }

    ///2日内中单净额为正
    if (0 < f1 && 0 < f2 && f2 < f1) {
        THS_BI.MemData.Enqueue("2日内中单净额全部为正且增加", "正值", { StockCode: stockCode, StockName: stockName });
        THS_BI.MemData.AddValue("今日股票推荐", stockCode + stockName, 1);

    }

    ///回测
    if (0 < f2 && 0 < f3 && f3 < f2) {
        THS_BI.MemData.Enqueue("回测2日内中单净额全部为正且增加", "正值", { StockCode: stockCode, StockName: stockName });
    }

    ///2日内中单占比为正
    if (0 < g1 && 0 < g2) {
        THS_BI.MemData.Enqueue("2日内中单占比全部为正", "正值", { StockCode: stockCode, StockName: stockName });
        THS_BI.MemData.AddValue("今日股票推荐", stockCode + stockName, 1);

    }

    ///回测
    if (0 < g2 && 0 < g3) {
        THS_BI.MemData.Enqueue("回测2日内中单占比全部为正", "正值", { StockCode: stockCode, StockName: stockName });
    }

    ///2日内中单占比为正
    if (0 < g1 && 0 < g2 && g2 < g1) {
        THS_BI.MemData.Enqueue("2日内中单占比全部为正且增加", "正值", { StockCode: stockCode, StockName: stockName });
        THS_BI.MemData.AddValue("今日股票推荐", stockCode + stockName, 1);

    }

    ///回测
    if (0 < g2 && 0 < g3 && g3 < g2) {
        THS_BI.MemData.Enqueue("回测2日内中单占比全部为正且增加", "正值", { StockCode: stockCode, StockName: stockName });
    }

    ///2日内未出逃资金
    if (0 < (d1 + f1) && 0.8 <= (d1 + f1) / d1 && 0 < (d2 + f2) && 0.8 <= (d2 + f2) / d2) {
        THS_BI.MemData.Enqueue("2日内未出逃资金", "正值", { StockCode: stockCode, StockName: stockName });
        THS_BI.MemData.AddValue("今日股票推荐", stockCode+stockName, 1);
    }

    ///回测
    if (0 < (d2 + f2) && 0.8 <= (d2 + f2) / d2 && 0 < (d3 + f3) && 0.8 <= (d3 + f3) / d3) {
        THS_BI.MemData.Enqueue("回测2日内未出逃资金", "正值", { StockCode: stockCode, StockName: stockName });
    }
}

 

THS_BI.RecommandStock = function () {
    ///每股收益5毛以上
    ///且净利润增长100 % 以上
    ///且每股现金流1元以上
    ///且2日资金量3000万以上
    ///且2日资金量全部为正且增加 
    var dict = THS_BI.MemData["今日股票推荐"];
    var res = {};
    for (var key in dict) {
        if (undefined === res[dict[key]]) {
            res[dict[key]] = [];
        }
        res[dict[key]].push(key);
    }
    THS_BI.MemData["最终结果"] = res;


    ///回测命中
    var stockCodeArray = THS_BI.MemData["目标股票"]["上涨2%及以上"];
    var com1 = { name: "回测2日资金流入量", data: THS_BI.MemData["回测2日资金流入量"] };
    var com2 = { name: "回测3日资金流入量", data: THS_BI.MemData["回测3日资金流入量"] };
    var com3 = { name: "回测2日内资金量全部为正", data: THS_BI.MemData["回测2日内资金量全部为正"] };
    var com4 = { name: "回测2日内资金量全部为正且增加", data: THS_BI.MemData["回测2日内资金量全部为正且增加"] };
    var com5 = { name: "回测2日内大单净额全部为正", data: THS_BI.MemData["回测2日内大单净额全部为正"] };
    var com6 = { name: "回测2日内大单净额全部为正且增加", data: THS_BI.MemData["回测2日内大单净额全部为正且增加"] };
    var com7 = { name: "回测2日内大单占比全部为正", data: THS_BI.MemData["回测2日内大单占比全部为正"] };
    var com8 = { name: "回测2日内中单净额全部为正", data: THS_BI.MemData["回测2日内中单净额全部为正"] };
    var com9 = { name: "回测2日内中单占比全部为正", data: THS_BI.MemData["回测2日内中单占比全部为正"] };
    var comA = { name: "回测2日内未出逃资金", data: THS_BI.MemData["回测2日内未出逃资金"] };
    var comB = { name: "回测2日内大单占比全部为正且增加", data: THS_BI.MemData["回测2日内大单占比全部为正且增加"] };
    var comC = { name: "回测2日内中单净额全部为正且增加", data: THS_BI.MemData["回测2日内中单净额全部为正且增加"]};
    var comD = { name: "回测2日内中单占比全部为正且增加", data: THS_BI.MemData["回测2日内中单占比全部为正且增加"] };

    var q = [com1, com2, com3, com4, com5, com6, com7, com8, com9, comA, comB, comC, comD];

    for (var i = 0; i < stockCodeArray.length; i++) {
        var stock = stockCodeArray[i];
        for (var j = 0; j < q.length; j++) {
            var com = q[j].data;
            var cname = q[j].name;
            for (var key in com) {
                var exq = com[key];
                for (var k = 0; k < exq.length; k++) {
                    var test = exq[k];
                    if (stock.StockCode === test.StockCode) {
                        stock.Hit += 1;
                        stock.Source.push(cname + ">" + key);
                    }
                }
            }
        }
    }

    THS_BI.MemData.AddObject("回测效果", "初步数据",stockCodeArray);
    var hitDict = {};
    for (var i = 0; i < stockCodeArray.length; i++) {
        var stock = stockCodeArray[i];
        if (undefined === hitDict[stock.Source.length]) {
            hitDict[stock.Source.length] = [];
        }
        hitDict[stock.Source.length].push(stock);
    }

    THS_BI.MemData.AddObject("回测命中", "最终数据", hitDict);
}

///获取目标股票，今日上涨2%股票，source 是 DayLine属性 涨幅=(现价-上一个交易日收盘价)/上一个交易日收盘价*100% 
THS_BI.CalTargetStock = function (stockCode, stockName, source) {
    var item1 = source.data[source.data.length - 1];///最后一天
    var item2 = source.data[source.data.length - 2];///最后一天的前一天

    if (2<=((item1.Closing - item2.Closing) / item2.Closing*100)) {
        THS_BI.MemData.Enqueue("目标股票", "上涨2%及以上", { StockCode: stockCode, StockName: stockName, increase: ((item1.Closing - item2.Closing) / item2.Closing * 100), Hit: 0,Source:[] });
    }
}

module.exports = THS_BI;