var PARAM_CHECKER = require("../Core/PARAM_CHECKER");
var SINAPageAnalyse = require("../BIZ/SINAPageAnalyse");
 
///同花顺接口
var SINAAPI = {
    Facade: function (context,callback) {
        SINAAPI[context.Method](context , callback);
    }
} 
 

///获取数据从Html中
SINAAPI.GetDataFromHtml = function (context, callback) {
    var dbItem = context.Args;
    context.Args = "数据太长,服务端已清空";
    var res = SINAPageAnalyse.GetDataFromPage(dbItem);
    callback(res);
}


module.exports = SINAAPI;