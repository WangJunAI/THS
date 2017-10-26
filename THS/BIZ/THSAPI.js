var THSDB = require("../BIZ/THSDB");
var PARAM_CHECKER = require("../Core/PARAM_CHECKER");
 
///同花顺接口
var THSAPI = {
    CMDMAP: { "今日最热营业部": {Method:"",Args:[]}},
    Facade: function (context,callback) {
        THSAPI[context.Method](context , callback);
    }
} 

///获取最热的营业部
THSAPI.GetHotestYYB = function (context,callback) {
    var db = THSDB.GetMongo02();
    var sourceCollection = THSDB.Mongo02Table.DataGGLHB;

    var filter = context.Args;//{ "ContentType": "个股龙虎榜明细", "Date": { $eq: "2017-10-24" } };//{ "ContentType": { $eq: "个股龙虎榜" }, "Data.0.C1": { $gt: new Date("2017/10/23 15:00:00") } };///获取指定交易日的
    var param = db.ParamCreator.EmptyFindProcParam();
    param.DB = db;
    param.CollectionName = sourceCollection;
    param.Filter = filter;
    param.Pager.Size = 10000 * 10000;

    var findEndCallback = function (dataArray, pagerInfo) {
        ///获取到数据
        var result = {};
        while (0<dataArray.length){
            var dataArrayItem = dataArray.shift();
            
            for (var k = 0; k < dataArrayItem.Rows.length; k++) {
                if (true === PARAM_CHECKER.IsNotEmptyString(dataArrayItem.Rows[k].C2)) {
                    result[dataArrayItem.Rows[k].C2] = {};
                }
            } 
        }

        callback(result, pagerInfo);
    }
    db.Find(param,findEndCallback);

}


module.exports = THSAPI;