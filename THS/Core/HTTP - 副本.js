///Http协议
var HTTP = {
    http: require("http"),
    iconv: require('iconv-lite'),
    checker: require("./PARAM_CHECKER"), ///参数检查器
    bufferHelper: require('bufferhelper'), ///缓存器
    QueueIN: [],
    Status: 0,
    Get: function (url, encoding, callback,option) {
        HTTP.QueueIN.push({ url: url, encoding: encoding, callback: callback,option:option });
        if (HTTP.QueueIN.length<=100 && 0 == HTTP.Status) {
            HTTP._Get();
        }
    },
    ///通过Get方式获取
    _Get: function (){
        if (0 < HTTP.QueueIN.length) {
            var queueItem = HTTP.QueueIN.pop();
            var url = queueItem.url;
            var encoding = queueItem.encoding;
            var callback = queueItem.callback;
            var option = queueItem.option;

            var checker = HTTP.checker;
            encoding = (checker.IsValid(encoding))?encoding:"utf8";
            var buffer = new HTTP.bufferHelper();
            HTTP.Status = 1;
           
            HTTP.http.get(url, function (res) {
                //console.log("statusCode: ", res.statusCode);
                if (res.statusCode == 200) {
                    res.on('data', function (d) {
                        buffer.concat(d);
                    });
                    
                    res.on('end', function () {
                        HTTP.Status = 0;
                        callback(HTTP.iconv.decode(buffer.toBuffer(), encoding));
                        HTTP._Get();
                        console.log("Http:" + HTTP.Status + "-" + HTTP.QueueIN.length);
                    });
                }
                else {
                    HTTP.Status = 0;
                    console.log("下载出错:" + HTTP.Status + " - " + url);
                    HTTP._Get();
                }

            }).on('error', function (e) {
                HTTP.Status = 0;
                HTTP.QueueIN.push(queueItem);
                HTTP._Get();
                //callback(err);
                console.err("err " + JSON.stringify(e));
                
            });
        }
    }
}

module.exports = HTTP;