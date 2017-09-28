
///同花顺历史回测
///一次性获取所有资金和价格信息，计算上涨概率
var THSHistoryTest = {
    AllData:[],///DayLine数组
    PrepareData: function (itemData) {
        THSHistoryTest.AllData.push(itemData);
    },///准备数据
    CalPriceTrend: function () { }///计算价格趋势,例如,首次涨停,次日上涨指定幅度的概率,考虑成交量,换手率
};


//计算价格趋势,例如,首次涨停,次日上涨指定幅度的概率
THSHistoryTest.CalPriceTrend = function () {
 
}

///获取股票涨幅
THSHistoryTest.GetStockIncrease = function (current, prev) {
    return ((current.Closing - prev.Closing) / prev.Closing * 100);
},

    ///获取不同涨幅的股票
    THSHistoryTest.FindIncrease = function () {
        var sourceData = THSHistoryTest.AllData;
        var arr = [];

        for (var k = 1; k < 11; k++) {
            var val = k;
            var res = {
                "涨幅阈值": val
            };

            for (var i = 0; i < sourceData.length; i++) {
                var itemData = sourceData[i];
                var dayLine = itemData.DayLine.data;
                var stockCode = itemData.StockCode;
                var stockName = itemData.StockName;
                res[stockCode + stockName] = [];
                ///查找该股一个月的数据
                for (var j = 1; j < dayLine.length; j++) {
                    var curDay = dayLine[j];///当天的价格信息
                    var preDay = dayLine[j - 1];///前一天的价格信息

                    var increase = this.GetStockIncrease(curDay, preDay);
                    if (val <= increase) {///找大于等于指定幅度的股票信息,包含指定天数
                        res[stockCode + stockName].push({ date: curDay.Date, Increase: increase });
                    }
                }
            }

            arr.push(res);
        }


        return arr;
    },

    ///头天涨停,第二天继续涨5%的概率分布
    THSHistoryTest.CalProbability = function () {
        
    }




module.exports = THSHistoryTest;