var cluster = require('cluster');
var mongo = require("../Core/MongoDB.js");
var http = require('http'); 
///汪俊多任务,灵活调用数据组件
WJMutilTask = {
    Data: {},
    Monitor: function () { },///监视器,
    Facade: function () { },///对外门面,HTTP通信
    Invoke: function () { },
    GetSatus: function () { },
    ProcessStatus: {},
    Status: "",
    TaskQueue: [],
    TaskQueue2: [],
    Worker: null
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
        console.log(WJMutilTask.Status + " PID=" + process.pid);
    }, 3000);
}
WJMutilTask.DB = null;
var is1=0
WJMutilTask.WorkProcess = function (cmd) {
    
    if (true === cluster.isWorker && 0 === is1) {
        is1 = 1;
        WJMutilTask.Monitor();
        //process.on("message", function (cmd) {
        //    console.log("子进程接收到主进程的命令，并加入队列  " + Math.random() + " " + process.pid + " " + is1);
        //    cmd.Res = "已接收命令";
        //    //process.send(cmd);
        //});
        http.Server(function(req, res){
            res.writeHead(200);
            res.end('hello world  '+(++count)+"   "+Math.random());

            // notify master about the request
            //process.send({ cmd: 'notifyRequest' });
        }).listen(8660);
    }
}
var count = 0;

WJMutilTask.CreateWorkProcessor = function (cmd) {
    if (true === WJMutilTask.IsMaster) {
        WJMutilTask.TaskQueue.push(cmd);
        if (null === WJMutilTask.Worker) {
            WJMutilTask.Worker = cluster.fork();
            console.log("创建进程");
            var worker = WJMutilTask.Worker;
            //worker.on("message", function (resCmd) {
            //    console.log("主进程 接收到 " + JSON.stringify(resCmd) + Math.random() + " " + process.pid);

            //    //if ("已接收命令" === resCmd.Res) {
            //    //    if (0 < WJMutilTask.TaskQueue.length) {
            //    //        var nextCmd = WJMutilTask.TaskQueue.shift();
            //    //        nextCmd.Content = "来自Next";
            //    //        //worker.send(nextCmd);
            //    //        console.log("CreateWorkProcessor " + WJMutilTask.TaskQueue.length);
            //    //    }
            //    //}

            //});
        }
        var worker = WJMutilTask.Worker;
        //worker.send(cmd);
 
        var func = function (postData) {
            var options = {
                hostname: 'localhost',
                port: 8660,
                path: '/',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(JSON.stringify(postData))
                }
            };

            var req = http.request(options, function (res) {
                res.setEncoding('utf8');
                var rawData = "";
                res.on('data', function (chunk) {
                    console.log(rawData += chunk);
                });
                res.on('end', function () {
                    console.log(rawData);
                    if (0 < WJMutilTask.TaskQueue.length) {
                        func(WJMutilTask.TaskQueue.shift());
                    }
                });
            });

            req.on('error', function (e) {
                console.log(e.message);
            });

            // write data to request body
            req.write(JSON.stringify(cmd));
            req.end();
        }
        if (1 === WJMutilTask.TaskQueue.length) {
            func(cmd);
        }
    }
},


    WJMutilTask.Facade = function (cmd) {
        console.log("Facade " + cluster.isMaster + JSON.stringify(cmd));
        if (true === WJMutilTask.IsMaster) {
            WJMutilTask.CreateWorkProcessor(cmd);
        }
        else if (true === WJMutilTask.IsWorker) {
            WJMutilTask.WorkProcess(cmd);
        } 
    },

    WJMutilTask.Test = function () {
        if (true === WJMutilTask.IsMaster) {//
            for (var i = 0; i <200000; i++) {
            var cmd = { "Command": "Test", Data: { "Test": process.pid + " "+i+" "+Math.random() } };
            WJMutilTask.Facade(cmd);
            //WJMutilTask.TaskQueue.push(cmd);
            }
        }
        else {
            WJMutilTask.WorkProcess({ "Data": "初始化" + process.pid });
        }

    }


module.exports = WJMutilTask;