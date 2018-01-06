var PARAM_CHECKER = require("../Core/PARAM_CHECKER");
var TouTiaoPageAnalyse = require("../BIZ/TouTiaoPageAnalyse");
 
///同花顺接口
var TouTiaoAPI = {
    Facade: function (context,callback) {
        TouTiaoAPI[context.Method](context , callback);
    }
} 
 

///获取数据从Html中
TouTiaoAPI.GetDataFromHtml = function (context, callback) {
    var dbItem = context.Args;
    context.Args = "数据太长,服务端已清空";
    var res = TouTiaoPageAnalyse.GetDataFromPage(dbItem);
    callback(res);
}


module.exports = TouTiaoAPI;