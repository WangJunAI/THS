var TOOLS = require("../Core/TOOLS");
var PARAM_CHECKER = require("../Core/PARAM_CHECKER");
var THSDB = require("../BIZ/THSDB");
///同花顺数据分析
var THSDataAnalyse = {
    DataIN: {},
    DataOUT: {},
    FuncArray: [],
    ///加载全部数据集
    LoadDataSet: function (collectionName, dbItem, asDict, dictKey) {
        console.log("数据分析加载数据集");
        if (undefined === THSDataAnalyse.DataIN[collectionName]) {
            THSDataAnalyse.DataIN[collectionName] = (true === asDict) ? {} : []; ///便于查询可做成字典
        }
        if (true === asDict && PARAM_CHECKER.IsNotEmptyString(dictKey)) {
            THSDataAnalyse.DataIN[collectionName][dbItem[dictKey]] = dbItem;
        }
        else if (true === asDict && PARAM_CHECKER.IsArray(dictKey)) {
            var key = "";
            for (var i = 0; i < dictKey.length; i++) {
                key += dbItem[dictKey[i]].toString();
            }
            THSDataAnalyse.DataIN[collectionName][key] = dbItem;
        }
        else {
            THSDataAnalyse.DataIN[collectionName].push(dbItem);
        }

    },

    ///统一计算
    Calculate: function () {

    },

    CalIncrease: function (current, prev) {
        var res = (current.Closing - prev.Closing) / prev.Closing;///(当天收盘价-前一日收盘价)/前一日收盘价
        return res;
    },

    Save: function () {
        var db = THSDB.GetMongo01();
        console.log("保存前");
        for (var key in THSDataAnalyse.DataOUT) {
            var data = THSDataAnalyse.DataOUT[key];
            console.log(key);
            var collectionName = "THSDataAnalyse7";
            if (PARAM_CHECKER.IsArray(data)) {
                while (0 < data.length) {

                    var item = data.pop();
                    console.log("准备保存" + item.StockCode + " " + item.StockName);

                    db.Save(collectionName, item, function (err, res, remaining) {
                        console.log("剩余数量 " + remaining);
                    }, 0);
                }
            }
            else if (PARAM_CHECKER.IsObject(data)) {

                for (var key in data) {
                    var item = data[key];
                    item.ContentType = key;//"龙虎榜明细券商参与V2";
                    item.Remark = "样本1004";
                    //console.log("要保存的对象大小" + JSON.stringify(data));
                    db.Save(collectionName, item, function (err, res, remaining) {
                        console.log("剩余数量 " + remaining);
                    }, 0);
                }

            }
        }





    },

    ///获取指定时间段以内的指定涨幅的股票
    GetTargetStockByIncrease: function (increase) {
        var sourceCollectionName = "DataKLine1006";///日线图
        increase = TOOLS.Convertor.PercentToNumber(increase);
        var source = THSDataAnalyse.DataIN[sourceCollectionName];
        var targetArray = [];
        for (var i = 0; i < source.length; i++) { ///遍历数据源

            var stockCode = source[i].StockCode;
            var stockName = source[i].StockName;

            var kLineArray = source[i].data; ///该股的日线数组

            for (var j = kLineArray.length - 1; 0 < j; j--) {
                var kline = kLineArray[j];///当日数据

                var klineDate = kline.Date.toString(); ///日线日期
                var klineDate = new Date(klineDate.slice(0, 4) + "/" + klineDate.slice(4, 6) + "/" + klineDate.slice(6, 8));///数据类型转换

                kline.StockCode = stockCode;
                kline.StockName = stockName;
                kline.ContentType = "涨幅在5%以上的股票日线信息";
                kline.ArchorDate = klineDate;

                var klinePrev = kLineArray[j - 1];///前一日数据
                var inc = THSDataAnalyse.CalIncrease(kline, klinePrev);///计算实际股价涨幅
                if (increase <= inc) {///若找得到符合的股票

                    kline["涨幅"] = (inc * 100.0) + "%";
                    kline["成交均价"] = (kline.Turnover / kline.Volume) / 100.0;
                    ///获取前5个交易日的成交额,成交量,平均股价
                    for (var k = 1; k <= 5; k++) {
                        if (0 <= j - k) {
                            var klinePrevItem = kLineArray[j - k];
                            klinePrevItem.ContentType = "涨幅在5%以上的股票日线信息前5个交易日成交日线";
                            klinePrevItem.ArchorDate = kline.Date;///锚点时间 
                            klinePrevItem.StockCode = stockCode;
                            klinePrevItem.stockName = stockName;
                            if (0 <= j - k - 1) {
                                var incPrev = THSDataAnalyse.CalIncrease(kLineArray[j - k], kLineArray[j - k - 1]);
                                klinePrevItem["涨幅"] = (incPrev * 100.0) + "%";
                                klinePrevItem["成交均价"] = (klinePrevItem.Turnover / klinePrevItem.Volume) / 100.0;
                            }

                            targetArray.push(klinePrevItem);///添加前5日信息
                        }

                    }

                    targetArray.push(kline);///添加日线信息


                    /////获取当日前5个交易日的龙虎榜信息
                    var lhbArr = THSDataAnalyse.GetLHBInfoByTargetStock(kline, klineDate);
                    targetArray = targetArray.concat(lhbArr);

                    var zjlArr = THSDataAnalyse.GetStockPageByTargetStock(stockCode, stockName, klineDate);
                    targetArray = targetArray.concat(zjlArr);
                }
            }
            console.log(i + " " + source.length);
        }
        console.log("赋值前");
        THSDataAnalyse.DataOUT["一月内涨幅在5%以上的股票K线信息"] = targetArray;
        console.log("赋值后");
    },

    ///获取目标股票的龙虎榜信息 
    GetLHBInfoByTargetStock: function (kline, startDate) {
        var sourceCollectionName = "DataGGLHB1006";///日线图
        var source = THSDataAnalyse.DataIN[sourceCollectionName];



        var stockCode = kline.StockCode;
        var stockName = kline.StockName;
        var archorDate = kline.ArchorDate;
        var lhbArr = [];
        var item = source[stockCode];
        console.log("Data " + stockCode)
        if (PARAM_CHECKER.IsObject(item) && PARAM_CHECKER.IsArray(item.Data)) {
            var arr = source[stockCode].Data; ///龙虎榜信息

            for (var i = 0; i < arr.length; i++) {
                var days = (startDate - arr[i].C1) / 1000 / 3600 / 24;
                if (0 < days && days <= 6) {
                    arr[i].ContentType = "上涨5%的前5日龙虎榜信息";
                    arr[i].StockCode = stockCode;
                    arr[i].StockName = stockName;
                    arr[i].ArchorDate = archorDate;
                    arr[i].ArchorDateInt = kline.Date;
                    lhbArr.push(arr[i]);
                }
            }

            lhbArr = THSDataAnalyse.GetLHBMXInfoByTargetStock(stockCode, lhbArr);///添加明细信息


            return lhbArr;
        }
        else {
            return [{ ContentType: "个股龙虎榜异常信息", StockCode: stockCode, StockName: stockName, ArchorDate: archorDate }];
        }
    },

    ///获取目标股票的龙虎榜信息 
    GetLHBMXInfoByTargetStock: function (stockCode, lhbArr) {
        var sourceCollectionName = "DataGGLHBMX1006";///日线图
        var source = THSDataAnalyse.DataIN[sourceCollectionName];
        for (var i = 0; i < lhbArr.length; i++) {
            var item = lhbArr[i];
            var date = item.C1.toString();
            var mx = source[stockCode + date];
            item["龙虎榜明细"] = mx;
            lhbArr[i] = item;
        }
        return lhbArr;
    },

    ///资金流
    GetStockPageByTargetStock: function (stockCode, stockName, archorDate) {
        var sourceCollectionName = "DataStockPage1006";///日线图
        var source = THSDataAnalyse.DataIN[sourceCollectionName];
        var array = []

        var funds = source[stockCode].Funds.List;
        for (var i = 0; i < funds.length; i++) {
            var item = funds[i];
            var days = (archorDate - item.C1) / 1000 / 3600 / 24;
            if (0 < days && days <= 6) {
                ///寻找5天之内的
                item.StockCode = stockCode;
                item.StockName = stockName;
                item.ArchorDate = archorDate;
                item.ContentType = "上涨5%的个股资金流向";
                array.push(item);
            }
        }


        return array;

    },

    ///计算价格趋势
    CalPirceTrend: function () {
        ///获取所有上涨5%的股票Kline
        ///获取符合条件的每个KLine的前五日龙虎榜机构

        var klineArchor = {};//"涨幅在5%以上的股票日线信息"];
        var klinePrev5 = [];//"涨幅在5%以上的股票日线信息前5个交易日成交日线"];
        var lhbPrev5 = [];//"上涨5%的前5日龙虎榜信息"];
        var lhbmxPrev5 = [];//"龙虎榜明细"];
        var fundsPrev5 = []//"上涨5%的个股资金流向"];///前五日

        var broker = {};
        var funds = {};

        var source = THSDataAnalyse.DataIN["THSDataAnalyse5"];
        while (0 < source.length) {
            var item = source.pop();
            if ("涨幅在5%以上的股票日线信息" === item.ContentType) {
                //klineArchor[item.StockCode + item.StockName + item.Date] = item;
            }
            else if ("涨幅在5%以上的股票日线信息前5个交易日成交日线" === item.ContentType) { ///Date关联int
                ///klinePrev5.push(item);
            }
            else if ("上涨5%的前5日龙虎榜信息" === item.ContentType) { ///包含明细
                //lhbPrev5.push(item);
                var mxArray = item["龙虎榜明细"].Data.Data;
                while (0 < mxArray.length) {
                    var mx = mxArray.pop();
                    if (7 === TOOLS.JSON.KeyCount(mx)) {
                        if (undefined === broker[mx.C2]) {
                            broker[mx.C2] = { "营业部": mx.C2, "参与": 0, "买入": 0, "卖出": 0, "前1日介入": { "买入": 0, "卖出": 0 }, "前2日介入": { "买入": 0, "卖出": 0 }, "前3日介入": { "买入": 0, "卖出": 0 }, "前4日介入": { "买入": 0, "卖出": 0 }, "前5日介入": { "买入": 0, "卖出": 0 }, "前6日介入": { "买入": 0, "卖出": 0 } };
                        }
                        broker[mx.C2]["参与"] = broker[mx.C2]["参与"] + 1;
                        console.log(mx.C2 + "  " + item.StockCode + " " + item.StockName + " " + "字典大小 " + TOOLS.JSON.KeyCount(broker) + " 参与 " + broker[mx.C2]["参与"] + " 买入 " + broker[mx.C2]["买入"]);
                        var days = (item.ArchorDate - item.C1) / 1000 / 3600 / 24;
                        console.log("日期间隔 " + days);
                        if (0 < (mx.C3 - mx.C5)) {
                            broker[mx.C2]["买入"] = broker[mx.C2]["买入"] + 1;
                            broker[mx.C2]["前" + days + "日介入"]["买入"] = broker[mx.C2]["前" + days + "日介入"]["买入"] + 1;
                        }
                        else if ((mx.C3 - mx.C5) < 0) {
                            broker[mx.C2]["卖出"] = broker[mx.C2]["卖出"] + 1;
                            broker[mx.C2]["前" + days + "日介入"]["卖出"] = broker[mx.C2]["前" + days + "日介入"]["卖出"] + 1;
                        }
                    }
                }
            }
            else if ("上涨5%的个股资金流向" === item.ContentType) {
                var days = (item.ArchorDate - item.C1) / 1000 / 3600 / 24;
                if (undefined === funds["前" + days + "日资金"]) {
                    funds["前" + days + "日资金"] = { "资金": { "流入": 0, "流出": 0 }, "大单占比": { "20%以上": 0, "10%到20%": 0, "10%以下": 0, "负值": 0} };
                }
                if (0 < item.C4) {
                    funds["前" + days + "日资金"]["资金"]["流入"] = funds["前" + days + "日资金"]["资金"]["流入"] + 1;
                }
                else {
                    funds["前" + days + "日资金"]["资金"]["流出"] = funds["前" + days + "日资金"]["资金"]["流出"] + 1;
                }


            }

        }

        //THSDataAnalyse.DataOUT["券商参与维度分析"] = broker;
        THSDataAnalyse.DataOUT["券商参与维度分析"] = funds;
    }
}



module.exports = THSDataAnalyse;