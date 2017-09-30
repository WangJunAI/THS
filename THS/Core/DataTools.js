var CryptoTools = require("./CryptoTools");
var MongoDB = require("../Core/MongoDB");
var PARAM_CHECKER = require("../Core/PARAM_CHECKER")

var DataTools = {
    Data: {
        DuplicateData: {}
    }
}
 ///数据去重
DataTools.CheckDuplicateData = function (id, filed, checkdata) {
    var md5Code = CryptoTools.MD5(checkdata);
    if (undefined === DataTools.Data.DuplicateData[md5Code]) {
        DataTools.Data.DuplicateData[md5Code] = [];
    }
    DataTools.Data.DuplicateData[md5Code].push(md5Code) ;
    var res = {
        Exist: 1 < DataTools.Data.DuplicateData[md5Code].length,
        Md5: md5Code,
        ItemID:id.toString()
    }
    return res;
}

///数据去重
DataTools.LogDuplicateData = function (db,collectionName,filedArray) {
    var callbackFind = function (pagerInfo) {
        ///获取一页数据以后
        var dataArray = pagerInfo.DataArray;
        while (0 < dataArray.length) {
            var qItem = dataArray.pop();
            var id = qItem._id;
            var field = "Page";
            var chkRes = DataTools.CheckDuplicateData(id, field, qItem[field]);
            chkRes.CollectionName = collectionName;
            if (true === chkRes.Exist) {
                ///将要删除的文档记录到其他表
                db.Save("LogDuplicateData0929", chkRes, function (err, res, remaining) {
                    console.log("发现重复数据 " + chkRes.Md5);
                    console.log("剩余数量 " + remaining + " 当前索引页面" + pagerInfo.CurrentIndex + "  ");
                    if (0 === remaining) {
                        ///当页数据处理完毕以后,遍历下一页
                        db.TraversePager(collectionName, {}, pagerInfo.NextIndex, pagerInfo.PageSize, callbackFind, callbackErr); ///分页遍历处理
                    }
                }, 0);
            }
            else {
                console.log("未发现重复" + JSON.stringify(chkRes));
                if (1 === dataArray.length) {
                    console.log("获取下一页数据 " + pagerInfo.NextIndex);
                    db.TraversePager(collectionName, {}, pagerInfo.NextIndex, pagerInfo.PageSize, callbackFind, callbackErr); ///分页遍历处理
                }
            }
        }
    }

    var callbackErr = function (err) { console.log("TraversePager " + err) };

    db.TraversePager(collectionName, {}, 0, 100, callbackFind, callbackErr);
 
}



module.exports = DataTools;