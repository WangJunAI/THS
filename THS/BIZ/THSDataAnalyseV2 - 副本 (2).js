var TOOLS = require("../Core/TOOLS");
var PARAM_CHECKER = require("../Core/PARAM_CHECKER");
var THSDB = require("../BIZ/THSDB");
///同花顺数据分析
var THSDataAnalyseV2 = {
    DataIN: {"中间结果":[]},
    DataOUT: {},
    CoreDataDict: {}
}

///保存结果
THSDataAnalyseV2.SaveResult = function (db) {

    delete THSDataAnalyseV2.DataIN;

    var source = THSDataAnalyseV2.DataOUT;
    for (var key in source) {
        if (PARAM_CHECKER.IsArray(source[key])) {
            while (0 < source[key].length) {
                var item = source[key].pop();
                //console.log("A "+JSON.stringify(item));
                db.Save("DataResult", item, function (err, res, remaining) {
                    console.log("剩余 " + remaining);
                }, 0);
            }
        }
        else if (PARAM_CHECKER.IsObject(source[key])) {
            //console.log("O "+JSON.stringify(source[key]));
            db.Save("DataResult", source[key], function (err, res, remaining) {
                console.log("剩余 " + remaining);
            }, 0);
        }
    }
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
        console.log(keyName  + " " + "数组现有数据量 " + THSDataAnalyseV2.DataIN[keyName].length);
    }
    else if (PARAM_CHECKER.IsObject(option) && true === option.AsDict && PARAM_CHECKER.IsNotEmptyString(option.Keys)) {
        var key = dbItem[option.Keys];
        THSDataAnalyseV2.DataIN[keyName][key] = dbItem;
        console.log("添加数据到 "+keyName + " " + key + " " +new Date() );
    }
    else if (PARAM_CHECKER.IsObject(option) && true === option.AsDict && PARAM_CHECKER.IsArray(option.Keys)) {
        var key = "";
        for (var i = 0; i < option.Keys.length; i++) {
            key += dbItem[option.Keys[i]];
        }

        THSDataAnalyseV2.DataIN[keyName][key] = dbItem;
        console.log("添加数据到 " + keyName + " " + key + " " + new Date());
    }
}

///计算涨幅
THSDataAnalyseV2.CalIncrease=function (current, prev) {
    var res = (current.Closing - prev.Closing) / prev.Closing;///(当天收盘价-前一日收盘价)/前一日收盘价
    return res;
}

///计算涨幅
THSDataAnalyseV2.CalAmplitude = function (current, prev) {
    var res = (current.Max - current.Lowest) / prev.Closing;///股票振幅就是股票开盘后的当日最高价和最低价之间的差的绝对值与前日收盘价的百分比，它在一定程度上表现股票的活跃程度。
    res = (res < 0) ? -res : res;
    return res;
}


///获取目标股票日线
THSDataAnalyseV2.GetTargetStockByIncrease = function (increase) {
    

    var targetInc = TOOLS.Convertor.PercentToNumber(increase); ///目标股票涨幅
    var source = THSDataAnalyseV2.DataIN["日线数据"];
 
    var targetStockArray = [];
    var contentType = "涨幅在" + targetInc * 100 + "%以上的股票日线信号"; 
    for (var q = 0; q < source.length; q++) {
        var sourceItem = source[q];
        var dataArray = sourceItem.Data;
        ///遍历该股日线
        for (var k = 1; k < dataArray.length; k++) {
            var dataItem = dataArray[k];
            var itemInc = THSDataAnalyseV2.CalIncrease(dataItem, dataArray[k - 1]);///涨幅
            if (targetInc <= itemInc && parseInt(sourceItem.start) <= parseInt((new Date().getFullYear()-1).toString() + (new Date().getMonth() + 1).toString() + (new Date().getDate().toString()))) { ///上市日期一年以上
                ///添加额外信息
                dataItem.StockCode = sourceItem.StockCode;
                dataItem.StockName = sourceItem.StockName;
                dataItem.ContentType = contentType;
                dataItem.Increase = itemInc;///实际涨幅
                dataItem["涨幅"] = itemInc * 100 + "%";
                dataItem["成交均价"] = dataItem.Turnover / dataItem.Volume;
                dataItem.Amplitude = THSDataAnalyseV2.CalAmplitude(dataItem, dataArray[k - 1]);///振幅
                  
                var prev5KLineArray = THSDataAnalyseV2.GetTargetStockPrev5KLine(dataItem, dataArray); ///前5日K线信号
                 
                dataItem.Prev5KLine = prev5KLineArray;
                dataItem.Prev5LHBMX = THSDataAnalyseV2.GetTargetStockLHB(prev5KLineArray); ///前5日LHB明细
                dataItem.Prev5Funds = THSDataAnalyseV2.GetTargetStockFunds(prev5KLineArray);///前5日资金流信息
 
                targetStockArray.push(dataItem);
 
            }
        }
        
    }


    THSDataAnalyseV2.DataOUT[contentType] = targetStockArray;
    //THSDataAnalyseV2.DataIN["中间结果"] = THSDataAnalyseV2.DataIN["中间结果"].concat(targetStock);

    ///计算汇总

}

///获取目标股票前5天的K线图
THSDataAnalyseV2.GetTargetStockPrev5KLine = function (targetItem, klineArray) {
    ///获取前五日的K线图
    var day1 = targetItem.TradingDate;
    var resArray = [];
    for (var k = 0; k < klineArray.length; k++) {
        var day2 = klineArray[k].TradingDate;
        var days = TOOLS.Convertor.GetDaysInterval(day1, day2);
        
        if (0 < days && days < 6) {///前5天
            klineArray[k].Interval = days;///间隔
            klineArray[k].ContentType = targetItem.ContentType + "的前5日日线";
            klineArray[k].StockCode = targetItem.StockCode;
            klineArray[k].StockName = targetItem.StockName;
            klineArray[k].RefDate = day1;///目标日期
            if(0 < k) {
                klineArray[k].Increase = THSDataAnalyseV2.CalIncrease(klineArray[k], klineArray[k - 1]);
                klineArray[k]["涨幅"] = klineArray[k].Increase * 100 + "%";
                klineArray[k].Amplitude = THSDataAnalyseV2.CalAmplitude(klineArray[k], klineArray[k - 1]); ///振幅
            }
            klineArray[k]["成交均价"] = klineArray[k].Turnover / klineArray[k].Volume;
            resArray.push(klineArray[k]);
        }
    }

    return resArray;
}

///找指定日期的龙虎榜信息
THSDataAnalyseV2.GetTargetStockLHB = function (klineInfo) {
    if (true === PARAM_CHECKER.IsArray(klineInfo)) {
        var lhbmxArray = [];
        for (var k = 0; k < klineInfo.length; k++) {
            var arrItem = klineInfo[k];
            var lhbmxItem = THSDataAnalyseV2.GetTargetStockLHB(arrItem);
            lhbmxArray.push(lhbmxItem);
        }
        return lhbmxArray;
    }
    else if (true === PARAM_CHECKER.IsObject(klineInfo)) {
        var key = klineInfo.StockCode + klineInfo.StockName + klineInfo.TradingDate.toString();
        var source = THSDataAnalyseV2.DataIN["个股龙虎榜明细"];
        return source[key];
    }
}

///找指定日期的资金流信息
THSDataAnalyseV2.GetTargetStockFunds = function (klineInfo) {
    if (true === PARAM_CHECKER.IsArray(klineInfo)) {
        var fundsArray = [];
        for (var k = 0; k < klineInfo.length; k++) {
            var arrItem = klineInfo[k];
            var fundsItem = THSDataAnalyseV2.GetTargetStockFunds(arrItem);
            fundsArray.push(fundsItem);
        }
        return fundsArray;
    }
    else if (true === PARAM_CHECKER.IsObject(klineInfo)) {
        var key = klineInfo.StockCode+klineInfo.StockName+klineInfo.TradingDate.toString();
        var source = THSDataAnalyseV2.DataIN["资金流向字典"];
        return source[key];
    }
}

///获取目标股票k线前5天的龙虎榜信息
THSDataAnalyseV2.GetTargetStockPrev5LHB = function () {
    ///先获取目标股票和日期 获取lhb信息
    var sourceLHB = THSDataAnalyseV2.DataIN["个股龙虎榜"];
    var sourceLHBMX = THSDataAnalyseV2.DataIN["个股龙虎榜明细"];
    var sourceKLinePrev5 = THSDataAnalyseV2.DataIN["涨幅在5%以上的股票日线的前5日日线"];
    var result = [];

    //while (0 < sourceLHB.length) {
    for (var d = 0; d < sourceLHB.length; d++) {
        
        var item = sourceLHB[d];
        //while (0 < item.Data.length) {
        for (var k = 0; k < item.Data.length; k++) {
            var itemData = item.Data.shift(); ///龙虎榜数据
            var key = item.StockCode + item.StockName + itemData.C1.toString();
            console.log("正在处理 "+key);
            if (true === PARAM_CHECKER.IsObject(sourceKLinePrev5[key])) {///找日期 股票一致
                itemData.Interval = sourceKLinePrev5[key].Interval;
                itemData.RefDate = sourceKLinePrev5[key].RefDate;
                itemData.StockCode = item.StockCode;
                itemData.StockName = item.StockName;
                itemData.RefID = item.RefID;
                itemData.ContentType = "涨幅在5%以上的股票日线的前5日对应的个股龙虎榜";
                result.push(itemData);
                ///添加龙虎榜明细
                var lhbmx = sourceLHBMX[key];
                lhbmx.ContentType = "涨幅在5%以上的股票日线的前5日对应的个股龙虎榜明细";
                result.push(lhbmx);
            }
        }
    }
     
    //THSDataAnalyseV2.DataOUT["涨幅在5%以上的股票日线的前5日对应的个股龙虎榜"]=result;
    THSDataAnalyseV2.DataIN["中间结果"] = THSDataAnalyseV2.DataIN["中间结果"].concat(result);
}

 
///获取目标股票k线前5天的资金流信息
THSDataAnalyseV2.GetTargetStockPrev5Funds = function () {
    var sourceFunds = THSDataAnalyseV2.DataIN["资金流向"];
    var sourceKLinePrev5 = THSDataAnalyseV2.DataIN["涨幅在5%以上的股票日线的前5日日线"];
    var result = [];

    //while (0 < sourceFunds.length) {
    for (var k = 0; k < sourceFunds.length; k++) {
        var item = sourceFunds[k];
        //while (0 < item.Rows.length) {
        for (var d = 0; d < item.Rows.length; d++) {
            var row = item.Rows[d];
            var key = item.StockCode + item.StockName + row.C1.toString();
            console.log(" GetTargetStockPrev5Funds 正在处理 " + key);
            if (true === PARAM_CHECKER.IsObject(sourceKLinePrev5[key])) {///找日期 股票一致
                row.ContentType = "涨幅在5%以上的股票日线的前5日对应的资金流向";
                row.StockCode = item.StockCode;
                row.StockName = item.StockName;
                row.Interval = sourceKLinePrev5[key].Interval;
                row.RefDate = sourceKLinePrev5[key].RefDate;

                result.push(row);
            }
        }
    }

    //THSDataAnalyseV2.DataOUT["涨幅在5%以上的股票日线的前5日对应的资金流向"] = result;
    THSDataAnalyseV2.DataIN["中间结果"] = THSDataAnalyseV2.DataIN["中间结果"].concat(result);
}

///获取最活跃的券商
THSDataAnalyseV2.GetMostActiveBroker = function (dbItem, hasFinish) {
    if (undefined === hasFinish) {
        if (undefined === THSDataAnalyseV2.DataOUT["营业部参与情况"]) {
            THSDataAnalyseV2.DataOUT["营业部参与情况"] = {};
        }

        var row = dbItem;

        if (undefined === THSDataAnalyseV2.DataOUT["营业部参与情况"][row.C2]) {
            THSDataAnalyseV2.DataOUT["营业部参与情况"][row.C2] = { "营业部": row.C2, "参与": 0, "买入": 0, "卖出": 0 }
        }


        if (undefined != row.C7) {
            THSDataAnalyseV2.DataOUT["营业部参与情况"][row.C2]["参与"] += 1;
            THSDataAnalyseV2.DataOUT["营业部参与情况"][row.C2]["买入"] += (0 < row.C7) ? 1 : 0;
            THSDataAnalyseV2.DataOUT["营业部参与情况"][row.C2]["卖出"] += (row.C7 < 0) ? 1 : 0;
        }
    }


    ///字典转数组
    var targetArray = [];
    if (true === hasFinish) {
        var sourceDict = THSDataAnalyseV2.DataOUT["营业部参与情况"];
        for (var key in sourceDict) {
            var dictItem = sourceDict[key];
            dictItem.ContentType = "营业部参与情况";
            targetArray.push(dictItem);
        }
        THSDataAnalyseV2.DataOUT["营业部参与情况"] = targetArray;
    }


}
 
///分析营业部的行为
THSDataAnalyseV2.BrokerBehaviorAnalyse = function (dbItem,hasFinish) {

    if (undefined === hasFinish) {
        ///从明细中获取营业部，获取上榜当日和第二天，第三天，第四天的走势（根据买入，卖出比例分）
        var sourceLHBMX = THSDataAnalyseV2.DataIN["个股龙虎榜明细"];
        var sourceKLineDict = THSDataAnalyseV2.DataIN["日线数据字典"];
        if (undefined === THSDataAnalyseV2.DataOUT["龙虎榜营业部买入或卖出后5天K线走势"]) {
            THSDataAnalyseV2.DataOUT["龙虎榜营业部买入或卖出后5天K线走势"] = [];
            THSDataAnalyseV2.DataOUT["龙虎榜营业部买入或卖出后5天总涨幅"] = {};
        }

        var targetArray = THSDataAnalyseV2.DataOUT["龙虎榜营业部买入或卖出后5天K线走势"];
        var yybOPDict = THSDataAnalyseV2.DataOUT["龙虎榜营业部买入或卖出后5天总涨幅"];


        var row = dbItem;
        var lhbDate = dbItem.TradingDate;///上龙虎榜的交易日

        var tmpArr = [];
        ///找后5天K线
        for (var d = 1; d <= 5; d++) {
            var date = new Date(lhbDate + 1000 * d * 3600 * 24);///上龙虎榜的后1-5天
            var key = dbItem.StockCode + dbItem.StockName + date.toString();
            var dictItem = sourceKLineDict[key];
            if (true === PARAM_CHECKER.IsObject(sourceKLineDict[key])) { ///找匹配的K线图
                var item = {
                    StockCode: dbItem.StockCode,
                    StockName: dbItem.StockName,
                    ContentType: "龙虎榜营业部买入或卖出后5天K线走势",
                    Broker: row.C2,
                    KLineDate: date,
                    LHBDate: lhbDate,
                    "龙虎榜净买入占比": row.C4 - row.C6,
                    Interval: d,
                    Increase: sourceKLineDict[key].Increase,
                    "涨幅": "后" + d + "天涨幅" + (sourceKLineDict[key].Increase * 100) + "%",
                    "是否老股": parseInt(sourceKLineDict[key].start)<=(new Date().getTime() - 1000*3600*24*180) ///上市日期至少在半年前
                }

                targetArray.push(item);
                tmpArr.push(item);
            }
        }

        ///龙虎榜营业部介入后5天成功情况
        if (undefined === yybOPDict[item.Broker]) {
            yybOPDict[item.Broker] = {ContentType: "龙虎榜营业部买入或卖出后5天总涨幅", YYB: item.Broker, "买入后5日总涨幅": -9999, "卖出后5日总涨幅": -9999, "买入次数": 0, "卖出次数": 0 };///初始化容器
        } 

        if (0 < row.C4 - row.C6 && true === item["是否老股"] ) {
            yybOPDict[item.Broker]["买入后5日总涨幅"] = (-9999 === yybOPDict[item.Broker]["买入后5日总涨幅"])? ((tmpArr[0].Increase + tmpArr[1].Increase + tmpArr[2].Increase + tmpArr[3].Increase + tmpArr[4].Increase) / 5) / 1:(yybOPDict[item.Broker]["买入后5日总涨幅"] + (tmpArr[0].Increase + tmpArr[1].Increase + tmpArr[2].Increase + tmpArr[3].Increase + tmpArr[4].Increase) / 5) / 2;
            yybOPDict[item.Broker]["买入次数"] += 1;
        }
        else if (row.C4 - row.C6 < 0 && true === item["是否老股"] ) {
            yybOPDict[item.Broker]["卖出后5日总涨幅"] = (-9999 === yybOPDict[item.Broker]["卖出后5日总涨幅"]) ? ((tmpArr[0].Increase + tmpArr[1].Increase + tmpArr[2].Increase + tmpArr[3].Increase + tmpArr[4].Increase) / 5) / 1 : (yybOPDict[item.Broker]["卖出后5日总涨幅"] + (tmpArr[0].Increase + tmpArr[1].Increase + tmpArr[2].Increase + tmpArr[3].Increase + tmpArr[4].Increase) / 5) / 2;
            yybOPDict[item.Broker]["卖出次数"] += 1;
        }



        THSDataAnalyseV2.DataOUT["龙虎榜营业部买入或卖出后5天K线走势"] = targetArray;
        THSDataAnalyseV2.DataOUT["龙虎榜营业部买入或卖出后5天总涨幅"]= yybOPDict ;


    }

         ///字典转数组
    if (true === hasFinish) {
        var yybOPDict = THSDataAnalyseV2.DataOUT["龙虎榜营业部买入或卖出后5天总涨幅"];
            var yybOPArray = [];
            for (var yybName in yybOPDict) {
                var item = yybOPDict[yybName];

                yybOPArray.push(item);
            }

            THSDataAnalyseV2.DataOUT["龙虎榜营业部买入或卖出后5天总涨幅"] = yybOPArray;

        }
 
}

///获取次日命中股票
THSDataAnalyseV2.GetTargetStockNextDay = function () {

}

///个股分析 生成低维度数据集
THSDataAnalyseV2.GetStockAnalyse = function () {
    ///截至最后一个交易日
    ///风险(大宗交易),机会(新闻热度),基底(盈利情况,资本),资金(大单流入量,)
    var source = THSDataAnalyseV2.DataIN["首页概览"];
    var target1 = TOOLS.JSON.Initial(THSDataAnalyseV2.DataOUT["个股指标"]);
    for (var k = 0; k < source.length; k++) {
        var srcItem = source[k];
        var v12 = srcItem.Company.Value[12];///每股未分配利润

    }

}

///KLine分析
THSDataAnalyseV2.GetKLineAnalyse = function () {
    ///分析连续3日振幅在2-5的上涨概率
    var source = THSDataAnalyseV2.DataIN["日线数据"];
    var contentType = "连续三天换手率在5%到10%的日线接下来两天的涨幅概率";
    var target1 = TOOLS.JSON.Initial(THSDataAnalyseV2.DataOUT[contentType], { ContentType : contentType, "后2日下跌": 0, "后2日上涨2%以下": 0, "后2日上涨2%以上": 0});

 

    for (var k = 0; k < source.length; k++) {
        var srcItem = source[k];
        if (srcItem.start<= (new Date().getTime() - 1000 * 3600 * 24 * 360)) {
            for (var m = 3; m < srcItem.Data.length-2; m++) { 

                var incPrev1 = THSDataAnalyseV2.CalIncrease(srcItem.Data[m - 1], srcItem.Data[m - 2]);///前1日
                var incPrev2 = THSDataAnalyseV2.CalIncrease(srcItem.Data[m - 2], srcItem.Data[m - 3]);///前2日
                var incCur = THSDataAnalyseV2.CalIncrease(srcItem.Data[m], srcItem.Data[m - 1]);///当前
                var incNext1 = THSDataAnalyseV2.CalIncrease(srcItem.Data[m + 1], srcItem.Data[m]);///后1日
                var incNext2 = THSDataAnalyseV2.CalIncrease(srcItem.Data[m + 2], srcItem.Data[m + 1]);///后2日

                var ratePrev2 = srcItem.Data[m - 2].Rate;
                var ratePrev1 = srcItem.Data[m - 1].Rate;
                var rateCur = srcItem.Data[m].Rate;
                var rateNext1 = srcItem.Data[m + 1].Rate;
                var rateNext2 = srcItem.Data[m + 2].Rate;

                if (ratePrev2 <= 0.05) {

                }
                else {

                }

            }
        }
    }

    THSDataAnalyseV2.DataOUT["连续三天振幅在2%到5%的日线接下来两天的涨幅概率"] = target1;
}


///整体数据分析
THSDataAnalyseV2.DataAnalyse = function () {
    //THSDataAnalyseV2.GetSummaryInfo();

    //THSDataAnalyseV2.GetKLineAnalyse();///KLine分析

    THSDataAnalyseV2.GetTargetStockByIncrease("5%"); ///获取目标股票
    /////释放缓存
    //THSDataAnalyseV2.GetTargetStockPrev5LHB();///获取目标股票前5日的龙虎榜信息
    /////释放缓存
    //THSDataAnalyseV2.GetTargetStockPrev5Funds();///获取目标股票前5日的龙虎榜信息
    /////释放缓存
    //THSDataAnalyseV2.GetLaw();

    


}

///前5日规律分析
THSDataAnalyseV2.GetLaw = function () {
    var source = THSDataAnalyseV2.DataIN["中间结果"];
    var result1 = {
        ContentType:"前5日总体规律",
        Initial: function () {
            for (var i = 1; i < 6; i++) {
                result1["前" + i + "天涨幅2%以下"] = 0;
                result1["前" + i + "天涨幅2%到5%"] = 0;
                result1["前" + i + "天涨幅5%到8%"] = 0;
                result1["前" + i + "天涨幅8%以上"] = 0;
            }

            for (var i = 1; i < 6; i++) {
                result1["前" + i + "天振幅2%以下"] = 0;
                result1["前" + i + "天振幅2%到5%"] = 0;
                result1["前" + i + "天振幅5%到8%"] = 0;
                result1["前" + i + "天振幅8%以上"] = 0;
            }

            for (var i = 1; i < 6; i++) {
                result1["前" + i + "天换手率5%以下"] = 0;
                result1["前" + i + "天换手率5%到10%"] = 0;
                result1["前" + i + "天换手率10%到20%"] = 0;
                result1["前" + i + "天换手率20%以上"] = 0;
            }

            for (var i = 1; i < 6; i++) {
                result1["前" + i + "天龙虎榜上榜类型"] = {};
                result1["前" + i + "天上龙虎榜的次日涨跌2%以下"] = 0;
                result1["前" + i + "天上龙虎榜的次日涨跌2%到5%"] = 0;
                result1["前" + i + "天上龙虎榜的次日涨跌5%到8%"] = 0;
                result1["前" + i + "天上龙虎榜的次日涨跌8%以上"] = 0;
                result1["前" + i + "天龙虎榜买入卖出比例小于1"] = 0;
                result1["前" + i + "天龙虎榜买入卖出比例1到2"] = 0;
                result1["前" + i + "天龙虎榜买入卖出比例2到3"] = 0;
                result1["前" + i + "天龙虎榜买入卖出比例3以上"] = 0;

            }

            for (var i = 1; i < 6; i++) {
                result1["前" + i + "天资金大单净占比5%以下"] = 0;
                result1["前" + i + "天资金大单净占比5%到10%"] = 0;
                result1["前" + i + "天资金大单净占比10%到20%"] = 0;
                result1["前" + i + "天资金大单净占比20%以上"] = 0;

                result1["前" + i + "天资金中单净占比5%以下"] = 0;
                result1["前" + i + "天资金中单净占比5%到10%"] = 0;
                result1["前" + i + "天资金中单净占比10%到20%"] = 0;
                result1["前" + i + "天资金中单净占比20%以上"] = 0;

                result1["前" + i + "天资金小单净占比5%以下"] = 0;
                result1["前" + i + "天资金小单净占比5%到10%"] = 0;
                result1["前" + i + "天资金小单净占比10%到20%"] = 0;
                result1["前" + i + "天资金小单净占比20%以上"] = 0;
            }
        }
    };
    var result2 = {};

    result1.Initial();///初始化容器

    while (0<source.length) {
        var item = source.pop();
        console.log("正在处理 " + item.StockCode + item.StockName);
        if ("涨幅在5%以上的股票日线的前5日日线" === item.ContentType) {
            ///涨幅区域 振幅区域
           result1["前" + item.Interval + "天涨幅2%以下"] += (item.Increase <= 0.02) ? 1 : 0;
           result1["前" + item.Interval + "天涨幅2%到5%"] += (0.02 < item.Increase && item.Increase <= 0.05) ? 1 : 0;
           result1["前"+item.Interval + "天涨幅5%到8%"] += (0.05 < item.Increase && item.Increase <= 0.08) ? 1 : 0;
           result1["前"+item.Interval + "天涨幅8%以上"] += (0.08 < item.Increase) ? 1 : 0;

            ///振幅
           result1["前" + item.Interval + "天振幅2%以下"] += (item.Amplitude <= 0.02) ? 1 : 0;
           result1["前" + item.Interval + "天振幅2%到5%"] += (0.02 < item.Amplitude && item.Amplitude <= 0.05) ? 1 : 0;
           result1["前" + item.Interval + "天振幅5%到8%"] += (0.05 < item.Amplitude && item.Amplitude <= 0.08) ? 1 : 0;
           result1["前" + item.Interval + "天振幅8%以上"] += (0.08 < item.Amplitude) ? 1 : 0;

            ///换手率
           result1["前"+item.Interval + "天换手率5%以下"] += (item.Rate <= 5) ? 1 : 0;
           result1["前"+item.Interval + "天换手率5%到10%"] += (5 < item.Rate && item.Rate <= 10) ? 1 : 0;
           result1["前" + item.Interval + "天换手率10%到20%"] += (10 < item.Rate && item.Rate <= 20) ? 1 : 0;
           result1["前" + item.Interval + "天换手率20%以上"] += (20 < item.Rate) ? 1 : 0;

        }
        else if ("涨幅在5%以上的股票日线的前5日对应的个股龙虎榜" === item.ContentType) {
            ///类型 次日涨跌 买入 卖出 净买入
            if (undefined ===result1["前"+item.Interval + "天龙虎榜上榜类型"][item.C2]) {result1["前"+item.Interval + "天龙虎榜上榜类型"][item.C2] = 0; }
           result1["前"+item.Interval + "天龙虎榜上榜类型"][item.C2] += 1;
           result1["前"+item.Interval + "天上龙虎榜的次日涨跌2%以下"] += (item.C4 <= 2) ? 1 : 0;
           result1["前"+item.Interval + "天上龙虎榜的次日涨跌2%到5%"] += (2 < item.C4&& item.C4 <= 5) ? 1 : 0;
           result1["前"+item.Interval + "天上龙虎榜的次日涨跌5%到8%"] += (5 < item.C4 && item.C4 <= 8) ? 1 : 0;
           result1["前"+item.Interval + "天上龙虎榜的次日涨跌8%以上"] += (8 < item.C4) ? 1 : 0;

           result1["前"+item.Interval + "天龙虎榜买入卖出比例小于1"] += (item.C5 / item.C6 < 1) ? 1 : 0;
           result1["前" + item.Interval + "天龙虎榜买入卖出比例1到2"] += (1 < item.C5 / item.C6 && item.C5 / item.C6<=2 ) ? 1 : 0;
           result1["前" + item.Interval + "天龙虎榜买入卖出比例2到3"] += (2 < item.C5 / item.C6 && item.C5 / item.C6 <= 3) ? 1 : 0;
           result1["前" + item.Interval + "天龙虎榜买入卖出比例3以上"] += (3 < item.C5 / item.C6 ) ? 1 : 0;
 


        }
        else if ("涨幅在5%以上的股票日线的前5日对应的个股龙虎榜明细" === item.ContentType) {
            ///营业部 买入 成交比例 卖出 净额
            THSDataAnalyseV2.GetMostActiveBroker(item);
            THSDataAnalyseV2.BrokerBehaviorAnalyse(item);

        }
        else if ("涨幅在5%以上的股票日线的前5日对应的资金流向" === item.ContentType) {
            ///涨跌幅 5日主力净额 大单净额 占比 
            result1["前" +item.Interval + "天资金大单净占比5%以下"] += (item.C7 <= 5) ? 1 : 0;;
            result1["前" +item.Interval + "天资金大单净占比5%到10%"] += (5< item.C7 && item.C7 <= 10) ? 1 : 0;
            result1["前" +item.Interval + "天资金大单净占比10%到20%"] += (10 < item.C7 && item.C7 <= 20) ? 1 : 0;
            result1["前" +item.Interval + "天资金大单净占比20%以上"] += (20< item.C7) ? 1 : 0;;

            result1["前" +item.Interval + "天资金中单净占比5%以下"] += (item.C9 <=5) ? 1 : 0;;
            result1["前" +item.Interval + "天资金中单净占比5%到10%"] += (5 < item.C9 && item.C9 <= 10) ? 1 : 0;
            result1["前" +item.Interval + "天资金中单净占比10%到20%"] += (10 < item.C9 && item.C9 <= 20) ? 1 : 0;
            result1["前" +item.Interval + "天资金中单净占比20%以上"] += (20 < item.C9) ? 1 : 0;

            result1["前" +item.Interval + "天资金小单净占比5%以下"] += (item.C11 <= 5) ? 1 : 0;;
            result1["前" +item.Interval + "天资金小单净占比5%到10%"] += (5 < item.C11 && item.C11<= 10) ? 1 : 0;
            result1["前" +item.Interval + "天资金小单净占比10%到20%"] += (10 < item.C11 && item.C11 <= 20) ? 1 : 0;
            result1["前" +item.Interval + "天资金小单净占比20%以上"] += (20 < item.C11) ? 1 : 0;;
        }
    }

    THSDataAnalyseV2.GetMostActiveBroker(null, true);
    THSDataAnalyseV2.BrokerBehaviorAnalyse(null, true);
    THSDataAnalyseV2.DataOUT["前5日总体规律"] = result1;
}

///计算概要信息
THSDataAnalyseV2.GetSummaryInfo = function () {
    var source = THSDataAnalyseV2.DataIN["首页概览"];
    if (undefined === THSDataAnalyseV2.DataOUT["区域"]) {
        THSDataAnalyseV2.DataOUT["区域"] = {};
    }

    if (undefined === THSDataAnalyseV2.DataOUT["概念"]) {
        THSDataAnalyseV2.DataOUT["概念"] = { };
    }

    if (undefined === THSDataAnalyseV2.DataOUT["业务"]) {
        THSDataAnalyseV2.DataOUT["业务"] = { };
    }
    var target1 = THSDataAnalyseV2.DataOUT["区域"];
    var target2 = THSDataAnalyseV2.DataOUT["概念"];
    var target3 = THSDataAnalyseV2.DataOUT["业务"];

    for (var m = 0; m < source.length; m++) {
        var dbItem = source[m];
        var area = dbItem.Company.Value[0].trim();
        var conception = dbItem.Company.Value[1].trim().split(/[，、]/g);
        var biz = dbItem.Company.Value[3].trim().split(/[；、。，]/g);
        if (undefined === target1[area]) {
            target1[area] = { "总数": 0 };
        }

        target1[area]["总数"] += 1;

        for (var k = 0; k < conception.length; k++) {
            conception[k] = conception[k].trim().replace(/\./g, '_');
            if (undefined === target2[conception[k]] && PARAM_CHECKER.IsString(conception[k])) {
                target2[conception[k]] = { "总数": 0 };
            }
            target2[conception[k]]["总数"] += 1;
        }

        for (var k = 0; k < biz.length; k++) {
            biz[k] = biz[k].trim().replace(/\./g, '_');
            if (undefined === target3[biz[k]] && PARAM_CHECKER.IsString(biz[k])) {
                target3[biz[k]] = { "总数": 0 };
            }
            target3[biz[k]]["总数"] += 1;
        }

    }

    delete target1[""];
    delete target2[""];
    delete target3[""];

    ///字段转数组
    target1 = TOOLS.Convertor.DictToArray(target1, function (item) { item.ContentType = "区域分析";  return item; });
    target2 = TOOLS.Convertor.DictToArray(target2, function (item) {  item.ContentType = "概念分析";  return item; });
    target3 = TOOLS.Convertor.DictToArray(target3, function (item) {  item.ContentType = "业务分析";   return item; });
    THSDataAnalyseV2.DataOUT["区域"] = target1;
    THSDataAnalyseV2.DataOUT["概念"] = target2;
    THSDataAnalyseV2.DataOUT["业务"] = target3;

}








module.exports = THSDataAnalyseV2;