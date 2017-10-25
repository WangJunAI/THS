var crypto = require('crypto');
var buffer = require("buffer");

var CryptoTools = {
    MD5: function (input) {
        var md5 = crypto.createHash('md5');
        var buf = new Buffer(input);
        var str = buf.toString("binary");  ///
        var res = md5.update(str).digest("hex");
        return res;
        ///nodejs在进行md5加密时,发现同样的密文在,php 和nodejs中加密后的密文竟然不一样
        ///查其原因, nodejs在进行md5 时，中文没有转换成二进制编码，通过增加中间处理过程把字符串强制转换成二进制编码解决问题！！
    },

    Facade: function (param) {
        return CryptoTools[param.Method](param.Args);
    }
}

module.exports = CryptoTools;