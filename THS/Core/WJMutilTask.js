var cluster = require('cluster');
var mongo = require("../Core/MongoDB.js");
///汪俊多任务,灵活调用数据组件
WJMutilTask = {
    Data: {},
    Monitor: function () { },///监视器,
    Facade: function () { },///对外门面,HTTP通信
    Invoke: function () { },
    GetSatus: function () { },
    ProcessStatus: {}
}

///获取当前进程状态
WJMutilTask.GetSatus = function (processId) {
    var _THIS = this;
    if (undefined === processId) {
        _THIS.ProcessStatus["是否是主控进程", cluster.isMaster];
        _THIS.ProcessStatus["是否是工作进程", cluster.isWorker];
        _THIS.ProcessStatus["进程ID", process.pid];
    }
},

WJMutilTask.IsMaster = (function () {
return cluster.isMaster;
})(),

WJMutilTask.IsWorker = (function () {
    return cluster.isWorker;
})(),

WJMutilTask.Monitor = function () {
    setInterval(function () {
        WJMutilTask.GetSatus();
    }, 3000);
}

WJMutilTask.WorkProcess = function (cmd) {
    if (true === WJMutilTask.IsWorker) {
        process.on("message", function (cmd) {
            ///接收从主进程传来的消息
            console.log("子进程Recv " +JSON.stringify( cmd));
            cmd.Res = "正在处理";
            process.send(cmd);
            var opt = mongo.GetEmptyOption();
            opt.url = "mongodb://192.168.0.140:27017/cluster";
            var db = mongo.GetInst("ths", opt);
            db.Save("TestCluster", { "高性能": "读写分离" }, function () {
                cmd.Res = "处理完毕";
                process.send(cmd);
            }, 0);

            process.send(cmd);

 
        });
    }
}

WJMutilTask.CreateWorkProcessor = function (cmd) {
    if (true === WJMutilTask.IsMaster) {
        var worker = cluster.fork();
        WJMutilTask.Data[worker.id] = {};
        cmd.WorkId = worker.id;
        worker.on("message", function (cmd) {
            ///获取从工作进程传来的消息
            console.log("主进程Recv " + JSON.stringify(cmd));
            setTimeout(function () {
                //cluster.workers[cmd.WorkId].disconnect();
            }, 3000);
            
        });
        worker.send(cmd);
    }
},


    WJMutilTask.Facade = function (cmd) {
        console.log("Facade " + cluster.isMaster);
        if (true === WJMutilTask.IsMaster) {
            WJMutilTask.CreateWorkProcessor(cmd);
        }
        else if (true === WJMutilTask.IsWorker) {
            WJMutilTask.WorkProcess(cmd);
        }
    },

    WJMutilTask.Test = function () {
    var cmd = { "Command": "Test" };
        WJMutilTask.Facade(cmd);

    }


module.exports = WJMutilTask