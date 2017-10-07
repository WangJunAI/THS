var TOOLS = require("../Core/TOOLS");

///同花顺数据分析
var THSDataAnalyse = {
    DataIN: {},
    DataOUT: {},
    FuncArray: [],
    ///加载全部数据集
    LoadDataSet: function (collectionName, dbItem) {
        console.log("数据分析加载数据集");
        if (undefined === THSDataAnalyse.DataIN[collectionName]) {
            THSDataAnalyse.DataIN[collectionName] = [];
        }
        THSDataAnalyse.DataIN[collectionName].push(dbItem);
    },

    ///统一计算
    Calculate: function () {

    },

    CalIncrease: function (current,prev) {
        var res = (current.Closing - prev.Closing) / prev.Closing;///(当天收盘价-前一日收盘价)/前一日收盘价
        return res;
    },

    Save: function (db) {
        console.log("保存前");
        for (var key in THSDataAnalyse.DataOUT) {
            var data = THSDataAnalyse.DataOUT[key];
            console.log(key);
            for (var prop in data) {
                var item = { Name: prop, data: data[prop], ContentType: key };

                db.Save("THSDataAnalyse",item , function () {
                    console.log("计算结果集保存完毕" );
                }, 0);
            }
        }


    },

    ///获取指定时间段以内的指定涨幅的股票
    GetTargetStockByIncrease: function (increase) {
        var sourceCollectionName = "DataKLine1006";
        increase = TOOLS.Convertor.PercentToNumber(increase);
        var source = THSDataAnalyse.DataIN[sourceCollectionName];

        var target = {};
        for (var i = 0; i < source.length; i++) {
            var itemData = source[i].data; ///涨幅数组
            for (var j = itemData.length-1; 0 < j; j--) {
                var arrItem = itemData[j];
                var arrItemPrev = itemData[j - 1];
                var inc = THSDataAnalyse.CalIncrease(arrItem, arrItemPrev);///实际股价涨幅
                if (increase <= inc) {
                    if (undefined === target[source[i].StockCode + source[i].StockName]) {
                        target[source[i].StockCode + source[i].StockName] = [];
                    }
                    arrItem.Increase = (inc)*100 + "%";
                    target[source[i].StockCode + source[i].StockName].push(arrItem);
                    //console.log(JSON.stringify(arrItem));
                }
            }
            console.log(i + " " + source.length);
        }
        console.log("赋值前");
        THSDataAnalyse.DataOUT["涨幅在5%以上的股票"] = target;
        console.log("赋值后");
    }
}



module.exports = THSDataAnalyse;