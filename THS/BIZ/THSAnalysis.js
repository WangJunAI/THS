var MongoDB = require("../Core/MongoDB");
var PARAM_CHECKER = require("../Core/PARAM_CHECKER");
var TOOLS = require("../Core/TOOLS")

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
    MemData: {},///内存数据

    DB: {
        Save: function () {
            var db = THS_BI.DB.db;
            db.Save("THSBI", THS_BI.MemData, function () { }, 0);
        },
        GetDB: function () {
            var opt = MongoDB.GetEmptyOption();
            opt.url = "mongodb://192.168.0.140:27017/ths";
            THS_BI.DB.db = MongoDB.GetInst("ths", opt);
        },
        db:null,
    }
}

///内存数据初始化
THS_BI.MemData.Initial = function () {
    THS_BI.MemData["地域分布"] = {};///Key:地域 Value:[{StockCode,StockName}]
}
///
THS_BI.MemData.Add = function (groupKey, key, value) {
    THS_BI.MemData[groupKey][key].push(value);
}
 
////按地域分布进行计算 source 是 Home.Company 属性
THS_BI.CalGeographical = function (stockCode,stockName , source) {
    var area = source.Value[0];
    THS_BI.MemData.Add("地域分布", area, { StockCode: stockCode, StockName: stockName });
}

////按地域分布进行计算 source 是 Home.Company 属性
THS_BI.CalConception = function (stockCode, stockName, source) {
    var conception = source.Value[1].split(/，/g);
    for (var i = 0; i < conception.length; i++) {
        THS_BI.MemData.Add("概念分布", conception[i].replace('.','_'), { StockCode: stockCode, StockName: stockName });
    }
}

////按主营业务进行计算 source 是 Home.Company 属性
THS_BI.CalMainBusiness = function (stockCode, stockName, source) {
    var business = source.Value[3].split(/[,。.;；、]/g);
    for (var i = 0; i < business.length; i++) {
        THS_BI.MemData.Add("概念分布", business[i], { StockCode: stockCode, StockName: stockName });
    }
}

////按每股净资产进行计算 source 是 Home.Company 属性
THS_BI.CalNetAssets = function (stockCode, stockName, source) {
    var netAssets = source.Value[5];///每股净资产
    if (netAssets <= 0) {
        THS_BI.MemData.Add("每股净资产", "负值", { StockCode: stockCode, StockName: stockName });
    }
    else if (0 < earnings && earnings < 2) {
        THS_BI.MemData.Add("每股净资产", "2元以内", { StockCode: stockCode, StockName: stockName });
    }
    else if (2 < earnings && earnings <= 5) {
        THS_BI.MemData.Add("每股净资产", "2至5元", { StockCode: stockCode, StockName: stockName });
    }
    else if (5 < earnings) {
        THS_BI.MemData.Add("每股净资产", "5元以上", { StockCode: stockCode, StockName: stockName });
    }
}

////按每股收益进行计算 source 是 Home.Company 属性
THS_BI.CalShareEarnings = function (stockCode, stockName, source) {
    var earnings = source.Value[6];///每股收益
    if (earnings <= 0) {
        THS_BI.MemData.Add("每股收益", "负值", { StockCode: stockCode, StockName: stockName });
    }
    else if (0 < earnings && earnings<0.5) {
        THS_BI.MemData.Add("每股收益", "5毛以内", { StockCode: stockCode, StockName: stockName });
    }
    else if (0.5 < earnings && earnings <= 1) {
        THS_BI.MemData.Add("每股收益", "5毛至1元", { StockCode: stockCode, StockName: stockName });
    }
    else if (1 < earnings) {
        THS_BI.MemData.Add("每股收益", "1元以上", { StockCode: stockCode, StockName: stockName });
    }
}

////按净利润增长率进行计算 source 是 Home.Company 属性
THS_BI.CalGrowthRate = function (stockCode, stockName, source) {
    var growthRate = source.Value[8];///净利润增长率
    if (growthRate <= 0) {
        THS_BI.MemData.Add("净利润增长率", "负值", { StockCode: stockCode, StockName: stockName });
    }
    else if (0 < growthRate && growthRate < 20) {
        THS_BI.MemData.Add("净利润增长率", "20%以内", { StockCode: stockCode, StockName: stockName });
    }
    else if (20 < growthRate && growthRate <= 100) {
        THS_BI.MemData.Add("净利润增长率", "20%至100%", { StockCode: stockCode, StockName: stockName });
    }
    else if (100 < growthRate) {
        THS_BI.MemData.Add("净利润增长率", "100%以上", { StockCode: stockCode, StockName: stockName });
    }
}

////按每股现金流进行计算 source 是 Home.Company 属性
THS_BI.CalCashFlow = function (stockCode, stockName, source) {
    var cashFlow = source.Value[10];///每股现金流
    if (cashFlow <= 0) {
        THS_BI.MemData.Add("每股现金流", "负值", { StockCode: stockCode, StockName: stockName });
    }
    else if (0 < cashFlow && cashFlow < 2) {
        THS_BI.MemData.Add("每股现金流", "2元以内", { StockCode: stockCode, StockName: stockName });
    }
    else if (2 < cashFlow && cashFlow <= 5) {
        THS_BI.MemData.Add("每股现金流", "2至5元", { StockCode: stockCode, StockName: stockName });
    }
    else if (5 < cashFlow) {
        THS_BI.MemData.Add("每股现金流", "5元以上", { StockCode: stockCode, StockName: stockName });
    }
}