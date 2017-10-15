var TOOLS = require("../Core/TOOLS");
var PARAM_CHECKER = require("../Core/PARAM_CHECKER");
var THSDB = require("../BIZ/THSDB");
///同花顺数据分析
var THSDataAnalyseV2 = {
    DataIN: {},
    DataOUT: {}
}

///加载数据源
THSDataAnalyseV2.LoadDataSource = function (keyName,dbItem,option) {
    ///初始化容器
    if (undefined === option && undefined === THSDataAnalyseV2.DataIN[keyName]) {
        THSDataAnalyseV2.DataIN[keyName] = [];
    }
    else if (undefined === THSDataAnalyseV2.DataIN[keyName] && PARAM_CHECKER.IsObject(option) && true === option.AsDict) {
        THSDataAnalyseV2.DataIN[keyName] = {};
    }

    ///添加数据
    if (undefined === option) {
        THSDataAnalyseV2.DataIN[keyName].push(dbItem);
    }
    else if (PARAM_CHECKER.IsObject(option) && true === option.AsDict && PARAM_CHECKER.IsNotEmptyString(option.Keys)) {
        var key = dbItem[option.Keys];
        THSDataAnalyseV2.DataIN[keyName][key] = dbItem;
    }
    else if (PARAM_CHECKER.IsObject(option) && true === option.AsDict && PARAM_CHECKER.IsArray(option.Keys)) {
        var key = "";
        for (var i = 0; i < option.Keys.length; i++) {
            key += option.Keys[i];
        }

        THSDataAnalyseV2.DataIN[keyName][key] = dbItem;
    }
}

///获取目标股票日线
THSDataAnalyseV2.GetTargetStockByIncrease = function (increase) {
    increase = TOOLS.Convertor.PercentToNumber(increase); ///目标股票涨幅
    var targetData = [];

    THSDataAnalyseV2.DataIN["涨幅在" + increase * 100 + "%以上的股票日线"] = targetData;
}

///获取目标股票前5天的K线图
THSDataAnalyseV2.GetTargetStockPrev5KLine = function (source) {

}

///获取目标股票前5天的龙虎榜信息
THSDataAnalyseV2.GetTargetStockPrev5LHB = function () {

}

///获取最活跃的券商
THSDataAnalyseV2.GetMostActiveBroker = function () {

}

///获取次日命中股票
THSDataAnalyseV2.GetTargetStockNextDay = function () {

}

///前5日规律分析
THSDataAnalyseV2.GetMostActiveBroker = function () {
    ///龙虎榜 上榜类型 次日涨跌 买入 卖出 净买入
    ///龙虎榜明细 营业部 买入金额 占总成交比例 卖出金额/万	占总成交比例	净额/万 营业部联手 买卖净差
    ///资金流 涨跌幅 资金净流入 5日主力净额 大单(主力) 净额	净占比	中单(主力) 净额	净占比 小单(主力) 净额	净占比
}






module.exports = THSDataAnalyse;