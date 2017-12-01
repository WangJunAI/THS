var THSDB = require("../BIZ/THSDB");
var PARAM_CHECKER = require("../Core/PARAM_CHECKER");
var THSPageAnalyse = require("../BIZ/THSPageAnalyse");
 
///同花顺接口
var THSAPI = {
    CMDMAP: { "今日最热营业部": {Method:"",Args:[]}},
    Facade: function (context,callback) {
        THSAPI[context.Method](context , callback);
    }
} 
 

///获取数据从Html中
THSAPI.GetDataFromHtml = function (context, callback) {
    var dbItem = context.Args;
    context.Args = "数据太长,服务端已清空";
    var res = THSPageAnalyse.GetDataFromPage(dbItem);
    callback(res);
}


module.exports = THSAPI;