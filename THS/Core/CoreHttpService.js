var http = require("http");
var querystring = require('querystring');
var MongoDB = require("../Core/MongoDB");

var count = 0;
var dict = {};
var CoreHttpService = {
    Service: {
        "加密服务": {
            RequirePath:"../Core/CryptoTools",
        },

        "同花顺": {
            RequirePath: "../BIZ/THSAPI",
        },        
        "新浪": {
            RequirePath: "../BIZ/SINAAPI",
        },        
        "系统任务": {
            RequirePath: "../BIZ/TaskAPI",
        },

        Load: function (name) {
            if (undefined === CoreHttpService.Service[name].Service) {
                CoreHttpService.Service[name].Service = require(CoreHttpService.Service[name].RequirePath);
            }
            return CoreHttpService.Service[name].Service;
        }
    },
 
    Run: function (port) {

        ///配置项注册
        MongoDB.Register("140", "192.168.0.140", 27017, "StockTask");
        MongoDB.Register("170", "192.168.0.170", 27017, "StockTask");

        ///创建HTTP服务
        http.createServer(function (req, res) {

            //暂存请求体信息
            var context = "";
             
            //每当接收到请求体数据，累加到post中
            req.on('data', function (chunk) {
                context += chunk;  //一定要使用+=，如果body=chunk，因为请求favicon.ico，body会等于{}
            });

            //在end事件触发后，通过querystring.parse将post解析为真正的POST请求格式，然后向客户端返回。
            req.on('end', function () {
                 //解析参数
                context = JSON.parse(context);  //将一个字符串反序列化为一个对象
          
                CoreHttpService.Service.Load(context.CMD).Facade(context, function (returnVal) {
                    context.RES = returnVal;
                    CoreHttpService.Send(req, res, context);
                });

            });
            
 
 
        }).listen(port);
    },

    Send: function (req, res,data) {
        res.setHeader("Access-Control-Allow-Origin", "*"); //设置请求来源不受限制
        res.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
        res.setHeader("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS"); //请求方式
        res.setHeader("X-Powered-By", ' 3.2.1')
        res.setHeader("Content-Type", "application/json;charset=utf-8");

        res.writeHead(200);
 
        res.write(JSON.stringify(data));
        res.end();
        console.log((++count)+" "+data.CMD+" "+new Date());
    }


}

module.exports = CoreHttpService;