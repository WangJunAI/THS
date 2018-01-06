var $ = require('cheerio');
var PARAM_CHECKER = require("../Core/PARAM_CHECKER");
var TOOLS = require("../Core/TOOLS");

var TouTiaoPageAnalyse = {
};

///头条
TouTiaoPageAnalyse.GetSearchResultList = function (dbItem) {
    var res = JSON.parse(dbItem.Page.replace(/\0/g, ''));
    return    res;
}

TouTiaoPageAnalyse.GetArticle = function (dbItem) {
    var res = eval(dbItem.Page);
    return res;
}

TouTiaoPageAnalyse.GetDataFromPage = function (dbItem) {
    if (true === PARAM_CHECKER.IsNotEmptyString(dbItem.Page)) {
        if ("今日头条搜索列表" === dbItem.ContentType) {
            dbItem["PageData"] = TouTiaoPageAnalyse.GetSearchResultList(dbItem);
        }
        else if ("今日头条PC端正文" === dbItem.ContentType) {
            dbItem["PageData"] = TouTiaoPageAnalyse.GetArticle(dbItem);
        } 
    }
    else {
        dbItem._ProcResult = "Page字段不是非空html字符串";
    }
    return dbItem;
}


module.exports = TouTiaoPageAnalyse;