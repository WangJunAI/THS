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
THSDataAnalyseV2.LoadDataSource = function (keyName, dbItem, option) {

    //THSDataAnalyseV2.CoreDataDict[dbItem._id.toString()] = dbItem;
     
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

///计算振幅
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
            ///添加额外信息
            dataItem.StockCode = sourceItem.StockCode;
            dataItem.StockName = sourceItem.StockName;
            dataItem.ContentType = contentType;
            dataItem.Increase = itemInc;///实际涨幅
            dataItem["涨幅"] = itemInc * 100 + "%";
            dataItem["成交均价"] = dataItem.Turnover / dataItem.Volume;
            dataItem.Amplitude = THSDataAnalyseV2.CalAmplitude(dataItem, dataArray[k - 1]);///振幅
            dataItem.Prev5KLine = THSDataAnalyseV2.GetTargetStockPrev5KLine(dataItem, dataArray); ///前5日K线信号
            dataItem.Prev5LHBMX = THSDataAnalyseV2.GetTargetStockLHB(dataItem.Prev5KLine); ///前5日LHB明细
            dataItem.Prev5Funds = THSDataAnalyseV2.GetTargetStockFunds(dataItem.Prev5KLine);///前5日资金流信息

            ///计算
            THSDataAnalyseV2["个股一月内上涨次数分布"](dataItem);


            if (targetInc <= itemInc && 20170925 <= dataItem.Date ///一个月以内
                && parseInt(sourceItem.start) <= parseInt((new Date().getFullYear() - 1).toString() + (new Date().getMonth() + 1).toString() + (new Date().getDate().toString()))) { ///上市日期一年以上
                  

 
                targetStockArray.push(dataItem); ///目标日线信号

            }

        }
        
    }

     THSDataAnalyseV2.DataOUT[contentType] = targetStockArray;
     THSDataAnalyseV2["个股一月内上涨次数分布"](null, true);
}

///个股一月内上涨次数分布
THSDataAnalyseV2["个股一月内上涨次数分布"] = function (dataItem,hasFinish) {

    if (true === PARAM_CHECKER.IsObject(dataItem) && undefined === hasFinish) {
        ///每个股 1-3% 3-6 6-10
        var target = TOOLS.JSON.Initial(THSDataAnalyseV2.DataOUT["个股一月内上涨次数分布"], {});

        if (undefined === target[dataItem.StockName]) {
            target[dataItem.StockName] = TOOLS.JSON.Initial(target[dataItem.StockName], { "StockName": dataItem.StockName, "StockCode": dataItem.StockCode, "分布": { "下跌": 0, "3%以下": 0, "3%-7%": 0, "7%以上": 0 } });
        }

        if (dataItem.Increase <= 0) {
            target[dataItem.StockName]["分布"]["下跌"] += 1;
        }
        else if (0 < dataItem.Increase && dataItem.Increase <= 0.03) {
            target[dataItem.StockName]["分布"]["3%以下"] += 1;
        }
        else if (0.03 < dataItem.Increase && dataItem.Increase <= 0.07) {
            target[dataItem.StockName]["分布"]["3%-7%"] += 1;
        }
        else if (0.07 < dataItem.Increase && dataItem.Increase < 0.11) {
            target[dataItem.StockName]["分布"]["7%以上"] += 1;
        }


        THSDataAnalyseV2.DataOUT["个股一月内上涨次数分布"] = target;
    }
    else if (true === hasFinish) {
        ///字典转数组
        var srcObject = THSDataAnalyseV2.DataOUT["个股一月内上涨次数分布"];
        var array = [];
        for (var key in srcObject) {
            var item = srcObject[key];
            item.StockCode = key;
            array.push(item);
        }

        THSDataAnalyseV2.DataOUT["个股一月内上涨次数分布"] = array;
    }
}


THSDataAnalyseV2["连续上涨的概率"] = function (dataItem,hasFinish) {
   ///前一天涨 前二天张 前三天张....
   ///前一天 5%以下 .....
    if (true === PARAM_CHECKER.IsObject(dataItem) && undefined === hasFinish) {
        for (var k = 0; k < dataItem.length; k++) {

        }
    }
    else if (true === hasFinish) {

    }

}

THSDataAnalyseV2["营业部的成功率"] = function () {
    var srcLHB = THSDataAnalyseV2.DataIN["个股龙虎榜"];
    var target = TOOLS.JSON.Initial(THSDataAnalyseV2.DataOUT["营业部的成功率"], {});
    for (var k = 0; k < srcLHB.length; k++) {
        var srcLHBItem = srcLHB[k];
        for (var m = 0; m < srcLHBItem.Data.length; m++) {
            var dataItem = srcLHBItem.Data[m];
            if (0.04 <= dataItem.C4 &&  dataItem.C4 <=0.09) {///若次日涨跌符合要求
                var key = srcLHBItem.StockCode + srcLHBItem.StockName + dataItem.C1.toString();
                var lhbmxItem = THSDataAnalyseV2.DataIN["个股龙虎榜明细"][key];
                if (true === PARAM_CHECKER.IsObject(lhbmxItem)) {
                    target[lhbmxItem.C2] = TOOLS.JSON.Initial(target[lhbmxItem.C2], { "买涨": 0, "买跌": 0 });
                    target[lhbmxItem.C2]["买涨"] += (0 < (lhbmxItem.C4 - lhbmxItem.C6)) ? 1 : 0;
                    target[lhbmxItem.C2]["买跌"] += ( (lhbmxItem.C4 - lhbmxItem.C6) <0) ? 1 : 0;
                }
            }
        }
    }

    target.ContentType = "涨幅4%-9%营业部的成功率";
    THSDataAnalyseV2.DataOUT["营业部的成功率"] = target;

}

THSDataAnalyseV2["资金大中小单占比上涨的概率"] = function () {

}

THSDataAnalyseV2["大单活跃度次日上涨的概率"] = function () {

}

THSDataAnalyseV2["优质股上涨的概率"] = function () {

}

THSDataAnalyseV2["指标命中上涨分布"] = function () {

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
            if (true === PARAM_CHECKER.IsObject(lhbmxItem)) {
                lhbmxArray.push(lhbmxItem);
            }
        }
        return lhbmxArray;
    }
    else if (true === PARAM_CHECKER.IsObject(klineInfo)) {
        var key = klineInfo.StockCode + klineInfo.StockName + klineInfo.TradingDate.toString();
        var source = THSDataAnalyseV2.DataIN["个股龙虎榜明细"];
        var sourceItem = source[key];
        return sourceItem;
    }
}

///找指定日期的资金流信息
THSDataAnalyseV2.GetTargetStockFunds = function (klineInfo) {
    if (true === PARAM_CHECKER.IsArray(klineInfo)) {
        var fundsArray = [];
        for (var k = 0; k < klineInfo.length; k++) {
            var arrItem = klineInfo[k];
            var fundsItem = THSDataAnalyseV2.GetTargetStockFunds(arrItem);
            if (true === PARAM_CHECKER.IsObject(fundsItem)) {
                fundsArray.push(fundsItem);
            }
        }
        return fundsArray;
    }
    else if (true === PARAM_CHECKER.IsObject(klineInfo)) {
        var key = klineInfo.StockCode+klineInfo.StockName+klineInfo.TradingDate.toString();
        var source = THSDataAnalyseV2.DataIN["资金流向字典"];
        var sourceItem = source[key];
        return sourceItem;
    }
}

 ///获取优质股票
THSDataAnalyseV2.GetHighQualityStock = function () {
    var source = THSDataAnalyseV2.DataIN["优质股字典"];
    var target = [];
    for (var key in source) {
        var item = source[key];
        item.ContentType = "优质股";
        target.push(item);
    }



    var length = target.length;
    THSDataAnalyseV2.DataOUT["优质股"] = target;
}


///整体数据分析
THSDataAnalyseV2.DataAnalyse = function () {
    THSDataAnalyseV2.GetSummaryInfo();
    THSDataAnalyseV2.GetHighQualityStock();
    THSDataAnalyseV2["营业部的成功率"]();
    //THSDataAnalyseV2.GetTargetStockByIncrease("5%"); ///获取目标股票
 
} 
///计算概要信息
THSDataAnalyseV2.GetSummaryInfo = function () {
    var source = THSDataAnalyseV2.DataIN["首页概览"];
    if (undefined === THSDataAnalyseV2.DataOUT["区域"]) {
        THSDataAnalyseV2.DataOUT["区域"] = {};
    }

    if (undefined === THSDataAnalyseV2.DataOUT["概念"]) {
        THSDataAnalyseV2.DataOUT["概念"] = {};
    }

    if (undefined === THSDataAnalyseV2.DataOUT["业务"]) {
        THSDataAnalyseV2.DataOUT["业务"] = {};
    }
    var target1 = THSDataAnalyseV2.DataOUT["区域"];
    var target2 = THSDataAnalyseV2.DataOUT["概念"];
    var target3 = THSDataAnalyseV2.DataOUT["业务"];

    for (var srcKey in source) {
        var dbItem = source[srcKey];
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
    target1 = TOOLS.Convertor.DictToArray(target1, function (item) { item.ContentType = "区域分析"; return item; });
    target2 = TOOLS.Convertor.DictToArray(target2, function (item) { item.ContentType = "概念分析"; return item; });
    target3 = TOOLS.Convertor.DictToArray(target3, function (item) { item.ContentType = "业务分析"; return item; });
    THSDataAnalyseV2.DataOUT["区域"] = target1;
    THSDataAnalyseV2.DataOUT["概念"] = target2;
    THSDataAnalyseV2.DataOUT["业务"] = target3;

},










module.exports = THSDataAnalyseV2;