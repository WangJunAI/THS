
var MongoDB = require("../Core/MongoDB");
var TaskAPI = {
CollectionName:"Task"
};

TaskAPI.CreateTask = function (data, callback) {
    var db = MongoDB.GetDB("170");
    db.Save(this.CollectionName,data,callback);
}


TaskAPI.Facade=function (context, callback) {
    TaskAPI[context.Method](context, callback);
}

module.exports = TaskAPI;