var SYS = require('./CONST.js')
var PARAM_CHECKER = require("./PARAM_CHECKER.js");
var mongo = require('mongodb');
var fs = require('fs');
///MongoDB数据库操作器
var MongoDB = {
    _url: "mongodb://192.168.0.130:27017/WYGeQu",
    checker: require('./PARAM_CHECKER.js'),
    GetLoader: function () {
        var loader = null;
        var ret = function () {
            if (null == loader) {
                loader = require('./ModuleLoader.js');
            }
            return loader;
        }
        return ret();
    },

    QueneIN: [],
    QueneRemove: [], ///移除队列
    QueneOUT: [],
    QueueUpdate: [],
    QueueLog: [],
    Status: 0,
    CallBack: {
        QueueSaveCallBack: null
    },

    ///获取
    GetEmptyOption: function () {
        var option = {};
        option.url = "MongoDB的Url";
        return option;
    },

    ///获取一个新实例
    GetInst: function (name, option) {
        var newInstance = {};
        for (key in MongoDB) {
            newInstance[key] = MongoDB[key];
        }


        if (PARAM_CHECKER.IsObject(option)) {
            newInstance._url = option.url;
        }
        else if (PARAM_CHECKER.IsNotEmptyString(option)) {
            newInstance._url = (PARAM_CHECKER.Contains('/', option)) ? option : "mongodb://192.168.0.140:27017/" + option;
        }

        return newInstance;
    },

    GetStatus: function () {
        setInterval(function () {
            console.log("Status-" + MongoDB.QueneIN.length + " - " + MongoDB.Status);
        }, 1000);
    },

    ///保存一个对象
    Save: function (collectionName, jsonData, callback, retryCount) {
        var item = {
            collectionName: collectionName,
            jsonData: jsonData,
            callback: callback,
            retryCount: retryCount
        };

        _THIS = this;

        _THIS.QueneIN.push(item);
        console.log("数据已添加到保存队列,当前队列长度" + _THIS.QueneIN.length);
        if (0 < _THIS.QueneIN.length && 0 == _THIS.Status) {
            _THIS._Save();
        }
    },

    ///保存一个对象
    _Save: function () {
        var _THIS = this;
        _THIS.Status = 1; ///占用状态
        console.log("Url" + _THIS._url + "  保存队列深度-" + _THIS.QueneIN.length);

        mongo.connect(_THIS._url, function (connectionErr, db) {
            if ((null === connectionErr || undefined === connectionErr) && null != db) {
                ///若打开成功
                if (0 < _THIS.QueneIN.length) {

                    ///若队列中有数据
                    var queueItem = _THIS.QueneIN.pop();
                    var collectionName = queueItem.collectionName;
                    var jsonData = queueItem.jsonData;
                    var callback = queueItem.callback;
                    var retryCount = queueItem.retryCount;


                    if (!PARAM_CHECKER.IsValid(jsonData.CreateTime)) {
                        ///设置创建时间
                        jsonData.CreateTime = new Date();
                    }

                    if (!PARAM_CHECKER.IsValid(jsonData.UpdateTime)) {
                        ///设置更新时间
                        jsonData.UpdateTime = new Date();
                    }

                    if (!PARAM_CHECKER.IsValid(jsonData.ItemStatus)) {
                        ///设置实体状态
                        jsonData.ItemStatus = SYS.CONST.STATUS.Enable; ///表示启用
                    }

                    if (PARAM_CHECKER.IsNotEmptyString(jsonData._id)) {
                        var _id = new mongo.ObjectID(jsonData._id);
                        jsonData._id = _id;
                    }
                    else if (!PARAM_CHECKER.IsValid(jsonData._id) || PARAM_CHECKER.IsEmptyString(jsonData._id)) {
                        jsonData._id = mongo.ObjectID.createPk();
                    }
                    var objectLength = JSON.stringify(jsonData).length;
                    console.log("准备保存的对象的大小 " + objectLength);
                    if (objectLength <= 1024 * 1024 * 10) {///小于10M
                        db.collection(collectionName).findOneAndUpdate({ _id: jsonData._id }, { $set: jsonData }, { upsert: true }, function (saveErr, result) {
                            db.close();

                            if (null === saveErr) {
                                console.log("保存成功-" + _THIS.QueneIN.length + "-" + result.insertedCount + "-" + _THIS.Status);
                            }
                            else {
                                _THIS.Status = 0;
                                console.log(_THIS._url + " 保存失败- " + _THIS.QueneIN.length + " - " + JSON.stringify(saveErr));
                                throw saveErr;
                            }

                            if (PARAM_CHECKER.IsFunction(callback)) {
                                ///若是有回调
                                callback(saveErr, result, _THIS.QueneIN.length);
                            }

                            _THIS._Save();
                        });
                    }
                    else {
                        if (PARAM_CHECKER.IsFunction(callback)) {
                            ///若是有回调
                            callback("json对象太大", null, _THIS.QueneIN.length);
                        }
                        fs.writeFile('E:\\BigJson' + new Date().getTime() + '.js', JSON.stringify(jsonData));
                        _THIS._Save();
                    }
                }
                else {
                    _THIS.Status = 0;

                    try {
                        db.close();
                    }
                    catch (closeErr) {
                        //_THIS.QueueLog.push(closeErr);
                        console.log(closeErr);
                        throw closeErr;
                    }

                    console.log(_THIS._url + " 队列已空 " + " - " + _THIS.Status + "  " + _THIS.QueneIN.length);

                    if (PARAM_CHECKER.IsFunction(_THIS.CallBack.QueueSaveCallBack)) {
                        _THIS.CallBack.QueueSaveCallBack(_THIS.QueneIN.length);
                    }

                }
            }
            else if (null != db && "function" === typeof (db.close)) {
                _THIS.Status = 0;
                try {
                    db.close();
                }
                catch (closeErr) {
                    console.log("closeErr " + closeErr + " connectionErr" + connectionErr);
                    throw closeErr;
                }
                console.log("数据库连接打开异常" + JSON.stringify(connectionErr) + "-" + _THIS.Status);
            }
        });
    },


    ///移除一个对象
    Remove: function (collectionName, jsonData, callback, retryCount) {
        var item = {
            collectionName: collectionName,
            jsonData: jsonData,
            callback: callback,
            retryCount: retryCount
        };

        _THIS = this;
        _THIS.QueneRemove.push(item);

        if (0 < _THIS.QueneRemove.length && 0 == _THIS.Status) {
            _THIS._Remove();
        }
    },

    ///移除一个对象
    _Remove: function () {

        var _THIS = this;
        _THIS.Status = 1; ///占用状态

        mongo.connect(_THIS._url, function (err, db) {
            if (null == err || undefined == err) {
                ///若打开成功
                if (0 < _THIS.QueneRemove.length) {
                    ///若队列中有数据
                    var queueItem = _THIS.QueneRemove.pop();
                    var collectionName = queueItem.collectionName;
                    var jsonData = queueItem.jsonData;
                    var callback = queueItem.callback;
                    var retryCount = queueItem.retryCount;

                    if (PARAM_CHECKER.IsNotEmptyString(jsonData._id)) {
                        var _id = new mongo.ObjectID(jsonData._id);
                        jsonData._id = _id;
                    }

                    db.collection(collectionName).remove({ _id: jsonData._id }, function (err, result) {
                        db.close();
                        if (null === err) {
                            console.log("删除成功-" + _THIS.QueneRemove.length + "-" + result.insertedCount + "-" + _THIS.Status);
                        }
                        else {
                            _THIS.Status = 0;
                            console.log("删除失败-" + _THIS.QueneRemove.length + "-" + JSON.stringify(err));
                        }

                        if (PARAM_CHECKER.IsFunction(callback)) {
                            ///若是有回调
                            callback(err, result, _THIS.QueneRemove.length);
                        }

                        _THIS._Remove();
                    });
                }
                else {
                    _THIS.Status = 0;

                    try {
                        db.close();
                    }
                    catch (closeErr) {
                        //_THIS.QueueLog.push(closeErr);
                        console.log(closeErr);
                        throw closeErr;
                    }
                }
            }
            else if (null != db && "function" === typeof (db.close)) {
                _THIS.Status = 0;
                try {
                    db.close();
                }
                catch (closeErr) {
                    console.log("closeErr " + closeErr + " connectionErr" + connectionErr);
                    throw closeErr;
                }
                console.log("数据库连接打开异常" + JSON.stringify(connectionErr) + "-" + _THIS.Status);
            }
        });
    },


    CreateEmptyFilter: function () {
        var json = {};


    },


    ///执行特定的命令
    Execute: function () {

    },

    ///查找
    Find: function (collectionName, jsonData, pageIndex, pageSize, callbackEnd, callbackError) {
        var _THIS = this;
        _THIS.TraversePager(collectionName, jsonData, pageIndex, pageSize, callbackEnd, callbackError);
    },
    ///分页遍历
    TraversePager: function (collectionName, jsonData, pageIndex, pageSize, callbackEnd, callbackError) {
        var _THIS = this;

        if (PARAM_CHECKER.IsString(jsonData._id)) {
            var _id = new mongo.ObjectID(jsonData._id);
            jsonData._id = _id;
        }
        else if (PARAM_CHECKER.IsValid(jsonData._id) && PARAM_CHECKER.IsArray(jsonData._id.$in)) {
            var k = 0;
            var idArrayLength = jsonData._id.$in.length;
            for (var k = 0; k < idArrayLength; k++) {
                jsonData._id.$in[k] = new mongo.ObjectID(jsonData._id.$in[k]);
            }
        }

        mongo.connect(_THIS._url, function (err, db) {
            if (null == err || undefined == err) {
                var collection = db.collection(collectionName);
                var summaryInfo = { TotalCount: -1 };
                var cursor = null;

                if (PARAM_CHECKER.IsObject(jsonData._Sort)) {
                    var sortFilter = jsonData._Sort;
                    delete jsonData._Sort;
                    cursor = collection.find(jsonData).sort(sortFilter).skip(pageIndex * pageSize).limit(pageSize);

                }
                else {
                    cursor = collection.find(jsonData).skip(pageIndex * pageSize).limit(pageSize);
                }

                var dataArray = [];

                cursor.on("data", function (data) {
                    dataArray.push(data);
                    console.log("MongoDB 正在获取 " + collectionName + " 第" + dataArray.length + "个数据 " + "所在分页 " + pageIndex + " 分页大小 " + pageSize);
                });

                cursor.on("end", function (data) {
                    if (PARAM_CHECKER.IsFunction(callbackEnd)) {
                        // Assuming DB has an open connection...
                        summaryInfo.TotalCount = "暂空";
                        summaryInfo.CurrentIndex = pageIndex;
                        summaryInfo.NextIndex = (pageIndex + 1);
                        summaryInfo.PageSize = pageSize;
                        summaryInfo.IsLastPage = dataArray.length < pageSize;///获取的数据不满一页
                        summaryInfo.DataArray = dataArray;
                        summaryInfo.CollectionName = collectionName;
                        summaryInfo.Filter = jsonData;

                        if (null != db) {
                            db.close();
                        }
                        callbackEnd(summaryInfo);
                    }
                });
            }
            else {
                console.log("TraversePager查找失败-" + err);
            }
        });
    },
    ParamCreator: {

        EmptyFindProcParam: function () {
            var param = {};
            param.DB = "数据库对象";
            param.CollectionName = "要处理的集合名称";
            param.Filter = "查询过滤器";
            param.Pager = {};
            param.Pager.Index = 0;
            param.Pager.Size = 100;
            return param;
        }
    },
    ///找到后处理
    FindProc: function (source, callback, needTraverse) {
        var sourceDB = source.DB;///源数据库
        var sourceCollectionName = source.CollectionName;
        var sourceFilter = source.Filter;
        var sourcePageIndex = source.Pager.Index;
        var sourcePageSize = source.Pager.Size;

        needTraverse == (undefined === needTraverse) ? false : needTraverse;

        var callbackError = function (err) {
            console.log("MongoDB FindProc Err " + JSON.stringify(err));
        }
        ///找到后的回调
        var callbackFind = function (pagerInfo) {
            ///获取一页数据以后
            var dataArray = pagerInfo.DataArray;

            if (true === PARAM_CHECKER.IsFunction(callback) && (0 === dataArray.length)) { ///若没有数据
                pagerInfo.IsEmpty = true;
                callback(qItem, pagerInfo); ///业务处理
            }
            else {
                while (0 < dataArray.length) {
                    var qItem = dataArray.shift();
                    if (true === PARAM_CHECKER.IsFunction(callback)) {
                        var isLastItem = (0 === dataArray.length);///判断是否是最后一个元素
                        pagerInfo.IsLastItem = isLastItem;
                        callback(qItem, pagerInfo, isLastItem); ///业务处理
                    }
                }
                if (true === needTraverse && false === pagerInfo.IsLastPage) {
                    sourceDB.TraversePager(sourceCollectionName, sourceFilter, pagerInfo.NextIndex, pagerInfo.PageSize, callbackFind, callbackError);
                }
                else {
                    console.log("FindProc " + sourceCollectionName + " 遍历全部完毕");
                }
            }
        }

        ///开始循环遍历
        sourceDB.TraversePager(sourceCollectionName, sourceFilter, sourcePageIndex, sourcePageSize, callbackFind, callbackError);
    },

    Find: function (source, callback) {
        var _THIS = this;
        var array = [];
        var callbacItem = function (qItem, pagerInfo) {
            array.push(qItem);
            if (true === pagerInfo.IsLastPage && true === pagerInfo.IsLastItem) {
                callback(array, pagerInfo);
            }
        }
        _THIS.FindProc(source, callbacItem, false);

    },

    ///移动集合
    MoveCollection: function (sourceDB, TargetDB) {

    }

}

//导出函数*****************************//
///保存 
module.exports = MongoDB;