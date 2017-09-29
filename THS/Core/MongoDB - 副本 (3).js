var SYS = require('./CONST.js')
var PARAM_CHECKER = require("./PARAM_CHECKER.js");
var mongo = require('mongodb');
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
        QueueSaveCallBack:null
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
            newInstance._url = (PARAM_CHECKER.Contains('/', option))?option:"mongodb://192.168.0.140:27017/" + option;
        }

        return newInstance;
    },
    
    GetStatus: function () {
        setInterval(function () {
            console.log("Status-" + MongoDB.QueneIN.length + " - " + MongoDB.Status);
        }, 1000);
    },
    
    ///保存一个对象
    Save: function (collectionName , jsonData, callback, retryCount) {
        var item = {
            collectionName: collectionName,
            jsonData: jsonData,
            callback: callback,
            retryCount: retryCount
        }; 

        _THIS = this;

        _THIS.QueneIN.push(item);

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
                    
                    //if (PARAM_CHECKER.IsValid(jsonData._sourceDataId)) {
                    //    console.log("正处理 "+ jsonData._sourceDataId+"  日志深度"+ _THIS.QueueLog.length);
                    //}

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
                            callback(saveErr, result);
                        }
                        
                        _THIS._Save();
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
 
                    console.log(_THIS._url +" 队列已空 " + " - " + _THIS.Status+"  "+ _THIS.QueneIN.length);
 
                    if (PARAM_CHECKER.IsFunction(_THIS.CallBack.QueueSaveCallBack)) {
                        _THIS.CallBack.QueueSaveCallBack(_THIS.QueneIN.length);
                    }
 
                }
            }
            else if (null != db && "function" === typeof(db.close)){
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
    
    ///保存一个对象
    __Save: function (collectionName , jsonData, callback, retryCount) {
        var loader = MongoDB.GetLoader();
        var mongo = loader.LoadMongoDB();
        var checker = MongoDB.checker;
        mongo.connect(MongoDB._url, function (err, db) {
            if (null == err || undefined == err) {
                ///保存成功
                if (checker.IsValid(jsonData.ID)) {
                    ///若有ID,则插入
                    db.collection(collectionName).findOneAndUpdate({ ID: jsonData.ID }, { $set: jsonData }, { upsert: true }, function (err, result) {
                        db.close();
                        console.log("保存结果-" + result);
                    });
                }
                else {
                    MongoDB.GetNewID(collectionName, function (newId) {
                        jsonData.ID = newId;
                        db.collection(collectionName).insert(jsonData, function (err, result) {
                            db.close();
                            console.log("插入结果-" + result);
                        });
                    });
                }
            }
            else {
                db.close();
                console.log("保存失败-" + err);
            }
        });
    },
    
    ///移除一个对象
    Remove: function (collectionName , jsonData, callback, retryCount) {
        var item = {
            collectionName: collectionName,
            jsonData: jsonData,
            callback: callback,
            retryCount: retryCount
        };
        MongoDB.QueneRemove.push(item);
        
        if (0 < MongoDB.QueneRemove.length && 0 == MongoDB.Status) {
            MongoDB._Remove();
        }
    },
    
    ///移除一个对象
    _Remove: function () {
        var loader = MongoDB.GetLoader();
        var mongo = loader.LoadMongoDB();
        var checker = MongoDB.checker;
        mongo.connect(MongoDB._url, function (err, db) {
            if (null == err || undefined == err) {
                ///若打开成功
                if (0 < MongoDB.QueneRemove.length) {
                    MongoDB.Status = 1;
                    ///若队列中有数据
                    var queueItem = MongoDB.QueneRemove.pop();
                    var collectionName = queueItem.collectionName;
                    var jsonData = queueItem.jsonData;
                    var callback = queueItem.callback;
                    var retryCount = queueItem.retryCount;
                    
                    if (checker.IsString(jsonData._id)) {
                        var _id = new mongo.ObjectID(jsonData._id);
                        jsonData._id = _id;
                    }
                    
                    db.collection(collectionName).remove({ _id: jsonData._id }, function (err, result) {
                        db.close();
                        //MongoDB.QueneOUT.push({ callback: callback, err: err, result: result });
                        if (null == err) {
                            console.log("删除成功-" + MongoDB.QueneRemove.length + "-" + result.insertedCount + "-" + MongoDB.Status);
                        }
                        else {
                            MongoDB.Status = 0;
                            console.log("------------------------------删除失败-" + MongoDB.QueneRemove.length + "-" + JSON.stringify(err));
                        }
                        
                        if (checker.IsFunction(callback)) {
                            ///若是有回调
                            callback(err, result);
                        }
                        
                        MongoDB._Remove();
                    });
                }
                else {
                    MongoDB.Status = 0;
                    db.close();
                    console.log("队列已空" + "-" + MongoDB.Status);
                }
            }
            else {
                MongoDB.Status = 0;
                db.close();
                console.log("异常" + JSON.stringify(err) + "-" + MongoDB.Status);
            }
        });
    },
    
    ///加载一个集合
    LoadCollection: function (collectionName , jsonData, pageIndex , pageSize, callbackData, callbackEnd, callbackError) {
        var _THIS = this;
 
        if (PARAM_CHECKER.IsString(jsonData._id)) {
            var _id = new mongo.ObjectID(jsonData._id);
            jsonData._id = _id;
        }
        else if (PARAM_CHECKER.IsValid(jsonData._id)&& PARAM_CHECKER.IsArray(jsonData._id.$in)) {
            var k = 0;
            var idArrayLength = jsonData._id.$in.length;
            for (var k = 0; k < idArrayLength; k++) {
                jsonData._id.$in[k]= new mongo.ObjectID(jsonData._id.$in[k]);
            }
        }
        
        mongo.connect(_THIS._url, function (err, db) {
            if (null == err || undefined == err) {
                var collection = db.collection(collectionName);
                var summaryInfo = { TotalCount: -1 };
                //summaryInfo.TotalCount = collection.find(jsonData).count(jsonData);///总数统计
                var cursor = null;
                
                if (PARAM_CHECKER.IsObject(jsonData._Sort)) {
                    var sortFilter = jsonData._Sort;
                    delete jsonData._Sort;
                    cursor = collection.find(jsonData).sort(sortFilter).skip(pageIndex * pageSize).limit(pageSize);
                    
                }
                else  {
                    cursor = collection.find(jsonData).skip(pageIndex * pageSize).limit(pageSize);
                }

                cursor.on("data", function (data) {
                    if (PARAM_CHECKER.IsFunction(callbackData)) {
                        callbackData(data);
                    }
                });
                cursor.on("end", function (data) {
                    if (PARAM_CHECKER.IsFunction(callbackEnd)) {
                        // Assuming DB has an open connection...
                        db.collection(collectionName, function (err, collection) {
                            collection.count(function (err, count) {
                                // Assuming no errors, 'count' should have your answer
                                summaryInfo.TotalCount = count;
                                if (null != db ){
                                    db.close();
                                }
                                callbackEnd(data, summaryInfo);
                            });
                        });
                    }
                });
            }
            else {
                console.log("查找失败-" + err);
            }
        });
    },

    CreateEmptyFilter: function () {
        var json = {};


    },

    ///遍历一个集合
    Traverse: function (collectionName , jsonData,callbackData, callbackEnd, callbackError) {
        var loader = MongoDB.GetLoader();
        var mongo = loader.LoadMongoDB();
        var checker = MongoDB.checker;
        var _THIS = this;
        var _db = mongo;

        if (checker.IsString(jsonData._id)) {
            var _id = new mongo.ObjectID(jsonData._id);
            jsonData._id = _id;
        }
        else if (checker.IsValid(jsonData._id) && checker.IsArray(jsonData._id.$in)) {
            var k = 0;
            var idArrayLength = jsonData._id.$in.length;
            for (var k = 0; k < idArrayLength; k++) {
                jsonData._id.$in[k] = new mongo.ObjectID(jsonData._id.$in[k]);
            }
        }
        
        _db.connect(_THIS._url, function (err, db) {
            if (null == err || undefined == err) {
                var collection = db.collection(collectionName);
                var summaryInfo = { TotalCount: -1 };
                //summaryInfo.TotalCount = collection.find(jsonData).count(jsonData);///总数统计
                var cursor = null;
                
                if (checker.IsObject(jsonData._Sort)) {
                    var sortFilter = jsonData._Sort;
                    delete jsonData._Sort;
                    cursor = collection.find(jsonData).sort(sortFilter);
                    
                }
                else {
                    cursor = collection.find(jsonData);
                }
                
                cursor.on("data", function (data) {
                    if (checker.IsFunction(callbackData)) {
                        callbackData(data);
                    }
                });
                cursor.on("end", function (data) {
                    if (checker.IsFunction(callbackEnd)) {
                        
                        // Assuming DB has an open connection...
                        db.collection(collectionName, function (err, collection) {
                            collection.count(function (err, count) {
                                // Assuming no errors, 'count' should have your answer
                                summaryInfo.TotalCount = count;
                                callbackEnd(data, summaryInfo);
                            });
                        });
                    }
                });
            }
            else {
                console.log("查找失败-" + err);
            }
        });
    },

    ///执行特定的命令
    Execute: function () { 
    
    },
    
    ///保存一个对象
    Update: function (collectionName , jsonData, callback, retryCount) {
        var item = {
            collectionName: collectionName,
            jsonData: jsonData,
            callback: callback,
            retryCount: retryCount
        };
        MongoDB.QueueUpdate.push(item);
        
        if (0 < MongoDB.QueueUpdate.length && 0 == MongoDB.Status) {
            MongoDB._Update();
        }
    },
    
    ///更新
    _Update: function (collectionName , jsonData  , callbackEnd, callbackError) { 
        var loader = MongoDB.GetLoader();
        var mongo = loader.LoadMongoDB();
        var checker = MongoDB.checker;
        mongo.connect(MongoDB._url, function (err, db) {
            if (null == err || undefined == err) {
                ///若打开成功
                if (0 < MongoDB.QueueUpdate.length) {
                    MongoDB.Status = 1;
                    ///若队列中有数据
                    var queueItem = MongoDB.QueueUpdate.pop();
                    var collectionName = queueItem.collectionName;
                    var jsonData = queueItem.jsonData;
                    var callback = queueItem.callback;
                    var retryCount = queueItem.retryCount;
                    
                    
                    if (checker.IsString(jsonData._id)&& checker.IsObject(jsonData._UpdateData)) {
                        var _id = new mongo.ObjectID(jsonData._id);
                        jsonData._id = _id;
                        
                        
                        db.collection(collectionName).findOneAndUpdate({ _id: jsonData._id }, jsonData._UpdateData, { upsert: false }, function (err, result) {
                            db.close();
                            //MongoDB.QueneOUT.push({ callback: callback, err: err, result: result });
                            if (null == err) {
                                console.log("更新成功-" + MongoDB.QueueUpdate.length + "-" + result.insertedCount + "-" + MongoDB.Status);
                            }
                            else {
                                MongoDB.Status = 0;
                                console.log("------------------------------更新失败-" + MongoDB.QueueUpdate.length + "-" + JSON.stringify(err));
                            }
                            
                            if (checker.IsFunction(callback)) {
                                ///若是有回调
                                callback(err, result);
                            }
                            
                            MongoDB._Save();
                        });
                    }
                    else {
                        MongoDB.Status = 0;
                        db.close();
                        console.log("队列已空" + "-" + MongoDB.Status);
                    }
                }
            }
            else {
                MongoDB.Status = 0;
                db.close();
                console.log("异常" + JSON.stringify(err) + "-" + MongoDB.Status);
            }
        });
    },
    
    ///获取一个新ID
    GetNewID: function (collectionName,callback) { 
        var loader = MongoDB.GetLoader();
        var mongo = loader.LoadMongoDB();
        var checker = MongoDB.checker;
        mongo.connect(MongoDB._url, function (err, db) {
            if (null == err || undefined == err) {
                ///若有ID,则插入
                db.collection("CollectionID").findOneAndUpdate({ Collection: collectionName }, { $inc: { ID: 1 } }, { upsert: true, new: true }, function (err, result) {
                    db.close();
                    callback(result.value.ID);
                    //console.log("ID结果-" + JSON.stringify(result));
                });
            }
            else {
                console.log(JSON.stringify(err));
            }
        });
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
  
                });
                 
                cursor.on("end", function (data) {
                    if (PARAM_CHECKER.IsFunction(callbackEnd)) {
                        // Assuming DB has an open connection...
                        db.collection(collectionName, function (err, collection) {
                            collection.count(function (err, count) {
                                // Assuming no errors, 'count' should have your answer
                                summaryInfo.TotalCount = count;
                                summaryInfo.CurrentPage = { PageIndex: pageIndex, PageSize: pageSize };
                                summaryInfo.NextPage = { PageIndex: (pageIndex+1), PageSize: pageSize };
                                summaryInfo.IsLastPage = (pageIndex + 1) * pageSize < summaryInfo.TotalCount;
                                summaryInfo.DataArray = dataArray;
                                //summaryInfo.NextFunc = 
                                if (null != db) {
                                    db.close();
                                }
                                callbackEnd( summaryInfo);
                            });
                        });
                    }
                });
            }
            else {
                console.log("TraversePager查找失败-" + err);
            }
        });
    },
}

//导出函数*****************************//
///保存 
module.exports = MongoDB;