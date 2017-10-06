var $ = require('cheerio');
var TOOLS = require("../Core/TOOLS");
var DataTools = require("../Core/DataTools");
var PARAM_CHECKER = require("../Core/PARAM_CHECKER");

///资金流向页面分析
var THSPageFundsTracking = {
    ///个股资金流
    GetPageData_ggzjl: function () { },///Url: http://data.10jqka.com.cn/funds/ggzjl/field/zdf/order/desc/page/3/ajax/1/
    GetPageData_ggzjlboard3: function () { },///Url: http://data.10jqka.com.cn/funds/ggzjl/board/3/field/zdf/order/desc/page/3/ajax/1/
    GetPageData_ggzjlboard5: function () { },///Url: http://data.10jqka.com.cn/funds/ggzjl/board/5/field/zdf/order/desc/page/3/ajax/1/
    GetPageData_ggzjlboard10: function () { },///Url: http://data.10jqka.com.cn/funds/ggzjl/board/10/field/zdf/order/desc/page/3/ajax/1/
    GetPageData_ggzjlboard20: function () { },///Url: http://data.10jqka.com.cn/funds/ggzjl/board/20/field/zdf/order/desc/page/3/ajax/1/

    ///概念资金流
    GetPageData_gnzjl: function () { },  ///Url:http://data.10jqka.com.cn/funds/gnzjl/field/tradezdf/order/desc/page/3/ajax/1/
    GetPageData_gnzjlboard3: function () { },  ///Url:http://data.10jqka.com.cn/funds/gnzjl/board/3/field/tradezdf/order/desc/page/3/ajax/1/
    GetPageData_gnzjlboard5: function () { },  ///Url:http://data.10jqka.com.cn/funds/gnzjl/board/5/field/tradezdf/order/desc/page/3/ajax/1/
    GetPageData_gnzjlboard10: function () { },  ///Url:http://data.10jqka.com.cn/funds/gnzjl/board/10/field/tradezdf/order/desc/page/3/ajax/1/
    GetPageData_gnzjlboard20: function () { },  ///Url:http://data.10jqka.com.cn/funds/gnzjl/board/20/field/tradezdf/order/desc/page/3/ajax/1/
    
    ///行业资金
    GetPageData_hyzjl: function () { },  ///Url:http://data.10jqka.com.cn/funds/hyzjl/field/tradezdf/order/desc/page/2/ajax/1/
    GetPageData_hyzjlboard3: function () { },  ///Url:http://data.10jqka.com.cn/funds/hyzjl/board/3/field/tradezdf/order/desc/page/2/ajax/1/
    GetPageData_hyzjlboard5: function () { },  ///Url:http://data.10jqka.com.cn/funds/hyzjl/board/5/field/tradezdf/order/desc/page/2/ajax/1/
    GetPageData_hyzjlboard10: function () { },  ///Url:http://data.10jqka.com.cn/funds/hyzjl/board/10/field/tradezdf/order/desc/page/2/ajax/1/
    GetPageData_hyzjlboard20: function () { },  ///Url:http://data.10jqka.com.cn/funds/hyzjl/board/20/field/tradezdf/order/desc/page/2/ajax/1/


    ///大单追踪 
    GetPageData_ddzz: function (data) { },  ///Url:http://data.10jqka.com.cn/funds/ddzz/order/asc/page/3/ajax/1/


};



///个股资金流 即时
THSPageFundsTracking.GetPageData_ggzjl = function (dbItem) {

    if ("个股资金即时" === dbItem.ContentType) {
        var item = TOOLS.HTML.TableToJson(dbItem.Page);
        for (var i = 0; i < item.Data.length; i++) {
            var data = item.Data[i];

            data.C1 = parseInt(data.C1);
            data.C4 = Number(data.C4);
            data.C5 = TOOLS.Convertor.PercentToNumber(data.C5);
            data.C6 = TOOLS.Convertor.PercentToNumber(data.C6);
            data.C7 = TOOLS.Convertor.UnitToNumber(data.C7);
            data.C8 = TOOLS.Convertor.UnitToNumber(data.C8);
            data.C9 = TOOLS.Convertor.UnitToNumber(data.C9);
            data.C10 = TOOLS.Convertor.UnitToNumber(data.C10);
            data.C11 = TOOLS.Convertor.UnitToNumber(data.C11);
            item.Data[i] = data;
        }
        return item;
    }
    return undefined;
  
}
///个股资金流 3日
THSPageFundsTracking.GetPageData_ggzjlboard3 = function (dbItem) {
    if ("个股资金3日" === dbItem.ContentType) {
        var item = TOOLS.HTML.TableToJson(dbItem.Page);
        for (var i = 0; i < item.Data.length; i++) {
            var data = item.Data[i];
            data.C1 = parseInt(data.C1);
            data.C4 = Number(data.C4);
            data.C5 = TOOLS.Convertor.PercentToNumber(data.C5);
            data.C6 = TOOLS.Convertor.PercentToNumber(data.C6);
            data.C7 = TOOLS.Convertor.UnitToNumber(data.C7);
 
            item.Data[i] = data;
        }
        return item;
    }
    return undefined;
}

///个股资金流 5日
THSPageFundsTracking.GetPageData_ggzjlboard5 = function (dbItem) {
    if ("个股资金5日" === dbItem.ContentType) {
        var item = TOOLS.HTML.TableToJson(dbItem.Page);
        for (var i = 0; i < item.Data.length; i++) {
            var data = item.Data[i];
            data.C1 = parseInt(data.C1);
            data.C4 = Number(data.C4);
            data.C5 = TOOLS.Convertor.PercentToNumber(data.C5);
            data.C6 = TOOLS.Convertor.PercentToNumber(data.C6);
            data.C7 = TOOLS.Convertor.UnitToNumber(data.C7);
            item.Data[i] = data;
        }
        return item;
    }
    return undefined;
}

///个股资金流 10日
THSPageFundsTracking.GetPageData_ggzjlboard10 = function (dbItem) {
    if ("个股资金10日" === dbItem.ContentType) {
        var item = TOOLS.HTML.TableToJson(dbItem.Page);
        for (var i = 0; i < item.Data.length; i++) {
            var data = item.Data[i];

            data.C1 = parseInt(data.C1);
            data.C4 = Number(data.C4);
            data.C5 = TOOLS.Convertor.PercentToNumber(data.C5);
            data.C6 = TOOLS.Convertor.PercentToNumber(data.C6);
            data.C7 = TOOLS.Convertor.UnitToNumber(data.C7);

            item.Data[i] = data;
        }
        return item;
    }
    return undefined;
}

///个股资金流 20日
THSPageFundsTracking.GetPageData_ggzjlboard20 = function (dbItem) {
    if ("个股资金20日" === dbItem.ContentType) {
        var item = TOOLS.HTML.TableToJson(dbItem.Page);
        for (var i = 0; i < item.Data.length; i++) {
            var data = item.Data[i];
            data.C1 = parseInt(data.C1);
            data.C4 = Number(data.C4);
            data.C5 = TOOLS.Convertor.PercentToNumber(data.C5);
            data.C6 = TOOLS.Convertor.PercentToNumber(data.C6);
            data.C7 = TOOLS.Convertor.UnitToNumber(data.C7);
            item.Data[i] = data;
        }
        return item;
    }
    return undefined;
}

///概念资金流 即时
THSPageFundsTracking.GetPageData_gnzjl = function (dbItem) {
    if ("概念资金即时" === dbItem.ContentType) {
        var item = TOOLS.HTML.TableToJson(dbItem.Page);
        for (var i = 0; i < item.Data.length; i++) {
            var data = item.Data[i];

            data.C1 = parseInt(data.C1);
            data.C3 = Number(data.C3);
            data.C4 = TOOLS.Convertor.PercentToNumber(data.C4);
            data.C5 = Number(data.C5);
            data.C6 = Number(data.C6);
            data.C7 = Number(data.C7);
            data.C8 = Number(data.C8);
            data.C10 = TOOLS.Convertor.PercentToNumber(data.C10);
            data.C11 = Number(data.C11);

            item.Data[i] = data;
        }
        return item;
    }
    return undefined;
}


///概念资金流 3日
THSPageFundsTracking.GetPageData_gnzjlboard3 = function (dbItem) {
    if ("概念资金3日" === dbItem.ContentType) {
        var item = TOOLS.HTML.TableToJson(dbItem.Page);
        for (var i = 0; i < item.Data.length; i++) {
            var data = item.Data[i];

            data.C1 = parseInt(data.C1);
            data.C3 = parseInt(data.C3);
            data.C4 = Number(data.C4);
            data.C5 = TOOLS.Convertor.PercentToNumber(data.C5);
            data.C6 = Number(data.C6);
            data.C7 = Number(data.C7);
            data.C8 = Number(data.C8);
             
            item.Data[i] = data;
        }
        return item;
    }
    return undefined;
}

///概念资金流 5日
THSPageFundsTracking.GetPageData_gnzjlboard5 = function (dbItem) {
    if ("概念资金5日" === dbItem.ContentType) {
        var item = TOOLS.HTML.TableToJson(dbItem.Page);
        for (var i = 0; i < item.Data.length; i++) {
            var data = item.Data[i];

            data.C1 = parseInt(data.C1);
            data.C3 = parseInt(data.C3);
            data.C4 = Number(data.C4);
            data.C5 = TOOLS.Convertor.PercentToNumber(data.C5);
            data.C6 = Number(data.C6);
            data.C7 = Number(data.C7);
            data.C8 = Number(data.C8);

            item.Data[i] = data;
        }
        return item;
    }
    return undefined;
}

///概念资金流 10日
THSPageFundsTracking.GetPageData_gnzjlboard10 = function (dbItem) {
    if ("概念资金10日" === dbItem.ContentType) {
        var item = TOOLS.HTML.TableToJson(dbItem.Page);
        for (var i = 0; i < item.Data.length; i++) {
            var data = item.Data[i];

            data.C1 = parseInt(data.C1);
            data.C3 = parseInt(data.C3);
            data.C4 = Number(data.C4);
            data.C5 = TOOLS.Convertor.PercentToNumber(data.C5);
            data.C6 = Number(data.C6);
            data.C7 = Number(data.C7);
            data.C8 = Number(data.C8);

            item.Data[i] = data;
        }
        return item;
    }
    return undefined;
}

///概念资金流 20日
THSPageFundsTracking.GetPageData_gnzjlboard20 = function (dbItem) {
    if ("概念资金20日" === dbItem.ContentType) {
        var item = TOOLS.HTML.TableToJson(dbItem.Page);
        for (var i = 0; i < item.Data.length; i++) {
            var data = item.Data[i];

            data.C1 = parseInt(data.C1);
            data.C3 = parseInt(data.C3);
            data.C4 = Number(data.C4);
            data.C5 = TOOLS.Convertor.PercentToNumber(data.C5);
            data.C6 = Number(data.C6);
            data.C7 = Number(data.C7);
            data.C8 = Number(data.C8);

            item.Data[i] = data;
        }
        return item;
    }
    return undefined;
}

///行业资金 即时
THSPageFundsTracking.GetPageData_hyzjl = function (dbItem) {
    if ("行业资金即时" === dbItem.ContentType) {
        var item = TOOLS.HTML.TableToJson(dbItem.Page);
        for (var i = 0; i < item.Data.length; i++) {
            var data = item.Data[i];

            data.C1 = parseInt(data.C1);
            data.C3 = Number(data.C3);
            data.C4 = TOOLS.Convertor.PercentToNumber(data.C4);
            data.C5 = Number(data.C5);
            data.C6 = Number(data.C6);
            data.C7 = Number(data.C7);
            data.C8 = parseInt(data.C8);
            data.C10 = TOOLS.Convertor.PercentToNumber(data.C10);
            data.C11 = Number(data.C11);

            item.Data[i] = data;
        }
        return item;
    }
    return undefined;
}

///行业资金 3日
THSPageFundsTracking.GetPageData_hyzjlboard3 = function (dbItem) {
    if ("行业资金3日" === dbItem.ContentType) {
        var item = TOOLS.HTML.TableToJson(dbItem.Page);
        for (var i = 0; i < item.Data.length; i++) {
            var data = item.Data[i];

            data.C1 = parseInt(data.C1);
            data.C3 = parseInt(data.C3);
            data.C4 = Number(data.C4);
            data.C5 = TOOLS.Convertor.PercentToNumber(data.C5);
            data.C6 = Number(data.C6);
            data.C7 = Number(data.C7);
            data.C8 = Number(data.C8);

            item.Data[i] = data;
        }
        return item;
    }
    return undefined;
}

///行业资金 5日
THSPageFundsTracking.GetPageData_hyzjlboard5 = function (dbItem) {
    if ("行业资金5日" === dbItem.ContentType) {
        var item = TOOLS.HTML.TableToJson(dbItem.Page);
        for (var i = 0; i < item.Data.length; i++) {
            var data = item.Data[i];

            data.C1 = parseInt(data.C1);
            data.C3 = parseInt(data.C3);
            data.C4 = Number(data.C4);
            data.C5 = TOOLS.Convertor.PercentToNumber(data.C5);
            data.C6 = Number(data.C6);
            data.C7 = Number(data.C7);
            data.C8 = Number(data.C8);

            item.Data[i] = data;
        }
        return item;
    }
    return undefined;
}

///行业资金 10日
THSPageFundsTracking.GetPageData_hyzjlboard10 = function (dbItem) {
    if ("行业资金10日" === dbItem.ContentType) {
        var item = TOOLS.HTML.TableToJson(dbItem.Page);
        for (var i = 0; i < item.Data.length; i++) {
            var data = item.Data[i];

            data.C1 = parseInt(data.C1);
            data.C3 = parseInt(data.C3);
            data.C4 = Number(data.C4);
            data.C5 = TOOLS.Convertor.PercentToNumber(data.C5);
            data.C6 = Number(data.C6);
            data.C7 = Number(data.C7);
            data.C8 = Number(data.C8);

            item.Data[i] = data;
        }
        return item;
    }
    return undefined;
}

///行业资金 20日
THSPageFundsTracking.GetPageData_hyzjlboard20 = function (dbItem) {
    if ("行业资金20日" === dbItem.ContentType) {
        var item = TOOLS.HTML.TableToJson(dbItem.Page);
        for (var i = 0; i < item.Data.length; i++) {
            var data = item.Data[i];

            data.C1 = parseInt(data.C1);
            data.C3 = parseInt(data.C3);
            data.C4 = Number(data.C4);
            data.C5 = TOOLS.Convertor.PercentToNumber(data.C5);
            data.C6 = Number(data.C6);
            data.C7 = Number(data.C7);
            data.C8 = Number(data.C8);

            item.Data[i] = data;
        }
        return item;
    }
    return undefined;
}


///大单追踪 (实时)
THSPageFundsTracking.GetPageData_ddzz = function (dbItem) {
    var item = TOOLS.HTML.TableToJson(dbItem.Page);
    for (var i = 0; i < item.Data.length; i++) {
        var data = item.Data[i];
        data.C1 = TOOLS.Convertor.ToDate(data.C1);
        data.C4 = Number(data.C4);
        data.C5 = Number(data.C5);
        data.C6 = Number(data.C6);
        data.C8 = TOOLS.Convertor.PercentToNumber(data.C8);
        data.C9 = Number(data.C9);
        item.Data[i] = data;
    }
    return item;
}


///获取页面数据
THSPageFundsTracking.GetPageData = function (dbItem) {
    var res = {};

    ///个股资金流
    res["个股资金即时"] = THSPageFundsTracking.GetPageData_ggzjl(dbItem);
    res["个股资金3日"] = THSPageFundsTracking.GetPageData_ggzjlboard3(dbItem);
    res["个股资金5日"] = THSPageFundsTracking.GetPageData_ggzjlboard5(dbItem);
    res["个股资金10日"] = THSPageFundsTracking.GetPageData_ggzjlboard10(dbItem);
    res["个股资金20日"] = THSPageFundsTracking.GetPageData_ggzjlboard20(dbItem);

    ///概念资金流
    res["概念资金即时"] = THSPageFundsTracking.GetPageData_gnzjl(dbItem);
    res["概念资金3日"] = THSPageFundsTracking.GetPageData_gnzjlboard3(dbItem);
    res["概念资金5日"] = THSPageFundsTracking.GetPageData_gnzjlboard5(dbItem);
    res["概念资金10日"] = THSPageFundsTracking.GetPageData_gnzjlboard10(dbItem);
    res["概念资金20日"] = THSPageFundsTracking.GetPageData_gnzjlboard20(dbItem);

    ///行业资金
    res["行业资金即时"] = THSPageFundsTracking.GetPageData_hyzjl(dbItem);
    res["行业资金3日"] = THSPageFundsTracking.GetPageData_hyzjlboard3(dbItem);
    res["行业资金5日"] = THSPageFundsTracking.GetPageData_hyzjlboard5(dbItem);
    res["行业资金10日"] = THSPageFundsTracking.GetPageData_hyzjlboard10(dbItem);
    res["行业资金20日"] = THSPageFundsTracking.GetPageData_hyzjlboard20(dbItem);
     
    for (var key in res) {
        if (!PARAM_CHECKER.IsValid(res[key])) {
            ///若属性不可用,则删除
            delete res[key];
        }
    }
    
    return res;
};


THSPageFundsTracking.CheckDuplicateData = function (dbItem) {
    var id = data._id.toString();
    var res = DataTools.CheckDuplicateData(id, "Page", data.Page);
    return res;
}


module.exports = THSPageFundsTracking;