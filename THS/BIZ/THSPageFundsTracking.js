var $ = require('cheerio');
var TOOLS = require("../Core/TOOLS");
var DataTools = require("../Core/DataTools");

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
THSPageFundsTracking.GetPageData_ggzjl = function (tableHtml) {

    return TOOLS.HTML.TableToJson(tableHtml);
 
}
///个股资金流 3日
THSPageFundsTracking.GetPageData_ggzjlboard3 = function (data) {
    return THSPageFundsTracking.GetPageData_ggzjl(data.Page);
}

///个股资金流 5日
THSPageFundsTracking.GetPageData_ggzjlboard5 = function (data) {
    return THSPageFundsTracking.GetPageData_ggzjl(data.Page);
}

///个股资金流 10日
THSPageFundsTracking.GetPageData_ggzjlboard10 = function (data) {
    return THSPageFundsTracking.GetPageData_ggzjl(data.Page);
}

///个股资金流 20日
THSPageFundsTracking.GetPageData_ggzjlboard20 = function (data) {
    return THSPageFundsTracking.GetPageData_ggzjl(data.Page);
}

///概念资金流 即时
THSPageFundsTracking.GetPageData_gnzjl = function (data) {
    return THSPageFundsTracking.GetPageData_ggzjl(data.Page);
}


///概念资金流 3日
THSPageFundsTracking.GetPageData_gnzjlboard3 = function (data) {
    return THSPageFundsTracking.GetPageData_ggzjl(data.Page);
}

///概念资金流 5日
THSPageFundsTracking.GetPageData_gnzjlboard5 = function (data) {
    return THSPageFundsTracking.GetPageData_ggzjl(data.Page);
}

///概念资金流 10日
THSPageFundsTracking.GetPageData_gnzjlboard10 = function (data) {
    return THSPageFundsTracking.GetPageData_ggzjl(data.Page);
}

///概念资金流 20日
THSPageFundsTracking.GetPageData_gnzjlboard20 = function (data) {
    return THSPageFundsTracking.GetPageData_ggzjl(data.Page);
}

///行业资金 即时
THSPageFundsTracking.GetPageData_hyzjl = function (data) {
    return THSPageFundsTracking.GetPageData_ggzjl(data.Page);
}

///行业资金 3日
THSPageFundsTracking.GetPageData_hyzjlboard3 = function (data) {
    return THSPageFundsTracking.GetPageData_ggzjl(data.Page);
}

///行业资金 5日
THSPageFundsTracking.GetPageData_hyzjlboard5 = function (data) {
    return THSPageFundsTracking.GetPageData_ggzjl(data.Page);
}

///行业资金 10日
THSPageFundsTracking.GetPageData_hyzjlboard10 = function (data) {
    return THSPageFundsTracking.GetPageData_ggzjl(data.Page);
}

///行业资金 20日
THSPageFundsTracking.GetPageData_hyzjlboard20 = function (data) {
    return THSPageFundsTracking.GetPageData_ggzjl(data.Page);
}

///大单追踪 
THSPageFundsTracking.GetPageData_ddzz = function (data) {
    return THSPageFundsTracking.GetPageData_ggzjl(data.Page);
}


THSPageFundsTracking.CheckDuplicateData = function (data) {
    var id = data._id.toString();
    var res = DataTools.CheckDuplicateData(id, "Page", data.Page);
    return res;
}


module.exports = THSPageFundsTracking;