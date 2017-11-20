
var PARAM_CHECKER = require("../Core/PARAM_CHECKER");

var SINAPageAnalyse = {}


SINAPageAnalyse.GetDataFromPage = function (dbItem) {
    var res = {ContentType:"未定义"};
    if ("大单追踪实时数据" === dbItem.ContentType) {
        res = {
            ContentType: dbItem.ContentType,
            MD5: dbItem.MD5,
            TaskID: dbItem.TaskID,
            Url: dbItem.Url,
            Data: eval(dbItem.Page.replace(/\0/g, ''))
        }
    }
    else if ("SINA日线数据" === dbItem.ContentType) {
        res = {
            StockCode: dbItem.StockCode,
            StockName: dbItem.StockName,
            ContentType: dbItem.ContentType,
            Url: dbItem.Url,
            MD5: dbItem.MD5,
            TaskID: dbItem.TaskID,
            JiDu: dbItem.JiDu,
            Year:dbItem.Year
        }
    }

    return res;
}

///转化为2维化数据
SINAPageAnalyse.ConvertTo2DData = function (dbItem) {
    var source = dbItem;//SINAPageAnalyse.GetDataFromPage(dbItem);
    var array = [];
    if (true === PARAM_CHECKER.IsObject(source) && true === PARAM_CHECKER.IsArray(source.Data)) {
        for (var k = 0; k < source.Data.length; k++) {
            var item = {
                ContentType: dbItem.ContentType,
                MD5: dbItem.MD5,
                TaskID: dbItem.TaskID,
                Url: dbItem.Url,
                StockCode: source.Data[k].symbol.substring(2),
                StockName: source.Data[k].name,
                TradingTime: source.Data[k].ticktime,
                Price: source.Data[k].price,
                Volume: source.Data[k].volume,
                PrevPrice: source.Data[k].prev_price,
                Kind: source.Data[k].kind,
                RowID: k,
                ContentType: "二维新浪大单数据"
            }
            array.push(item);
        }
    }
    else {
        var item = { ContentType: "无效数据", DATA: dbItem };
        array.push(item);
    }
    return array;
}

module.exports = SINAPageAnalyse;