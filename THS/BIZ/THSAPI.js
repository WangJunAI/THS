
///同花顺接口
var THSAPI = {
    CMDMAP: { "今日最热营业部": {Method:"",Args:[]}},
    Facade: function (context) {
        THSAPI.CMDMAP[context.CMD].Method(context.Args);
    }

} 

module.exports = THSAPI;