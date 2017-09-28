var $ = require('cheerio');

///资金流向页面分析
var THSPageFunds = {
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
    GetPageData_ddzz: function () { },  ///Url:http://data.10jqka.com.cn/funds/ddzz/order/asc/page/3/ajax/1/

};

///个股资金流 即时
THSPageFunds.GetPageData_ggzjl = function (pageHtml) {

    var $page = $(pageHtml);
    var theadTdArray = $page.find("thead th");
    var tbodyTrArray = $page.find("tbody tr");
    var res = { Column: {}, Data: [] };
    for (let i = 0; i < theadTdArray.length; i++) {
        let $td = $(theadTdArray[i]);
        res.Column["C" + (1 + i)] = $td.text();
    }

    for (let i = 0; i < tbodyTrArray.length; i++) {
        let tr = $(tbodyTrArray[i]);
        let item = {};
        for (let j = 0; j < tr.length; j++) {
            let $td = $(tr[j]);
            item["C" + (j + 1)] = $td.text();
        }
        res.Data.push(item);
    }

    return res;
    
}
///个股资金流 3日
THSPageFunds.GetPageData_ggzjlboard3 = function (pageHtml) {
    return THSPageFunds.GetPageData_ggzjl(pageHtml);
}

///个股资金流 5日
THSPageFunds.GetPageData_ggzjlboard5 = function (pageHtml) {
    return THSPageFunds.GetPageData_ggzjl(pageHtml);
}

///个股资金流 10日
THSPageFunds.GetPageData_ggzjlboard10 = function (pageHtml) {
    return THSPageFunds.GetPageData_ggzjl(pageHtml);
}

///个股资金流 20日
THSPageFunds.GetPageData_ggzjlboard20 = function (pageHtml) {
    return THSPageFunds.GetPageData_ggzjl(pageHtml);
}

///概念资金流 即时
THSPageFunds.GetPageData_gnzjl = function (pageHtml) {
    return THSPageFunds.GetPageData_ggzjl(pageHtml);
}


///概念资金流 3日
THSPageFunds.GetPageData_gnzjlboard3 = function (pageHtml) {
    return THSPageFunds.GetPageData_ggzjl(pageHtml);
}

///概念资金流 5日
THSPageFunds.GetPageData_gnzjlboard5 = function (pageHtml) {
    return THSPageFunds.GetPageData_ggzjl(pageHtml);
}

///概念资金流 10日
THSPageFunds.GetPageData_gnzjlboard10 = function (pageHtml) {
    return THSPageFunds.GetPageData_ggzjl(pageHtml);
}

///概念资金流 20日
THSPageFunds.GetPageData_gnzjlboard20 = function (pageHtml) {
    return THSPageFunds.GetPageData_ggzjl(pageHtml);
}

///行业资金 即时
THSPageFunds.GetPageData_hyzjl = function (pageHtml) {
    return THSPageFunds.GetPageData_ggzjl(pageHtml);
}

///行业资金 3日
THSPageFunds.GetPageData_hyzjlboard3 = function (pageHtml) {
    return THSPageFunds.GetPageData_ggzjl(pageHtml);
}

///行业资金 5日
THSPageFunds.GetPageData_hyzjlboard5 = function (pageHtml) {
    return THSPageFunds.GetPageData_ggzjl(pageHtml);
}

///行业资金 10日
THSPageFunds.GetPageData_hyzjlboard10 = function (pageHtml) {
    return THSPageFunds.GetPageData_ggzjl(pageHtml);
}

///行业资金 20日
THSPageFunds.GetPageData_hyzjlboard20 = function (pageHtml) {
    return THSPageFunds.GetPageData_ggzjl(pageHtml);
}

///大单追踪 
THSPageFunds.GetPageData_ddzz: function () {
    return THSPageFunds.GetPageData_ggzjl(pageHtml);
}




