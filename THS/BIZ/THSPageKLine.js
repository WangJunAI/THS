
///同花顺K线图页面分析 
var THSPageKLine = {
    ///日线数据分析
    AnalysePageDayLine: function (dbItem) {
        var jsonString = dbItem.Page;
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
            dayLine["Turnover"] = Number(arr[6]);//成交额
            dayLine["Rate"] = Number(arr[7]);//换手率

            lineArray.push(dayLine);
        }

        item.Column = {
            Date: "日期",
            Opening: "开盘价",
            Max: "最高价",
            Lowest: "最低价",
            Closing: "收盘价",
            Volume: "成交量",
            Turnover: "成交额",
            Rate:"换手率"
        }
        item.data = lineArray;
        return item;
    },

    GetDataFromPage: function (dbItem) {
        var jsonString = dbItem.Page;
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
            dayLine["Turnover"] = Number(arr[6]);//成交额
            dayLine["Rate"] = Number(arr[7]);//换手率
            dayLine["TradingDate"] = new Date(arr[0].slice(0, 4) + "/" + arr[0].slice(4, 6) + "/" + arr[0].slice(6, 8));///交易时间 Date属性 的时间格式 原始格式 20170913

            lineArray.push(dayLine);
        }

        item.Column = {
            Date: "日期",
            Opening: "开盘价",
            Max: "最高价",
            Lowest: "最低价",
            Closing: "收盘价",
            Volume: "成交量",
            Turnover: "成交额",
            Rate: "换手率"
        }
        item.Data = lineArray;
        delete item.data;

        return item;
    },

    ///生成
    ConvertTo2D: function (dbItem) {
        var array = [];
        for (var k = 0; k < dbItem.Data.length; k++) {
            var item = dbItem.Data[k];
            item.StockCode = dbItem.StockCode;
            item.StockName = dbItem.StockName;
            array.push(item);
        }

        return array;
    }
}


module.exports = THSPageKLine;