var PARAM_CHECKER = require("./PARAM_CHECKER");

///常用工具
var TOOLS = {
    ///日期常用
    DATE: {
        ///根据起始日期，指定的天数，格式化字符 获取一组日期
        GetDateArray: function (count, startDate, formatter) { },
        ///获取现在日期和时间
        GetNow: function () { },
        ///获取指定日期的明天
        GetTomorrow: function (dat) { },
        ///获取指定日期的昨天
        GetYesterday: function (dat) { }
    }
}

///----方法实现-----
///获取现在日期和时间
TOOLS.DATE.GetNow = function (dat) {
    dat = (true === PARAM_CHECKER.IsInstanceOf(dat, Date)) ? dat : new Date();
    var res = {};
    res.Year = dat.getFullYear();
    res.Month = 1 + dat.getMonth();
    res.Day = dat.getDate();
    res.Hour = dat.getHours();
    res.Minute = dat.getMinutes();
    res.Second = dat.getSeconds();
    res.Millisecond = dat.getMilliseconds();
    res.TotalSeconds = dat.getTime();
    return res;
}

///根据起始日期，指定的天数，格式化字符 获取一组日期
TOOLS.DATE.GetDateArray = function (count, startDate, formatter) {
    if (PARAM_CHECKER.IsInt(count)) 
    {
        ///若数据有效
        var now = TOOLS.DATE.GetNow();

    }
}

///获取指定日期的昨天
TOOLS.DATE.GetYesterday = function (dat) {
    dat = (true === PARAM_CHECKER.IsInstanceOf(dat, Date)) ? dat : new Date();
    var tick = dat.getTime() - 1000 * 60 * 60 * 24;
    return new  Date(tick);
}

///获取指定日期的明天
TOOLS.DATE.GetTomorrow = function (dat) {
    dat = (true === PARAM_CHECKER.IsInstanceOf(dat, Date)) ? dat : new Date();
    var tick = dat.getTime() + 1000 * 60 * 60 * 24;
    return new Date(tick);
}

///获取指定日期的明天
TOOLS.DATE.GetOtherDay = function (dat,count) {
    dat = (true === PARAM_CHECKER.IsInstanceOf(dat, Date)) ? dat : new Date();
    var tick = dat.getTime() + count * 1000 * 60 * 60 * 24;
    return new Date(tick);
}


///获取一个数组
TOOLS.DATE.GetDateArray = function (count, startDate, formatter) {
    count = 30;
    var arr = [];
    startDate = (true === PARAM_CHECKER.IsInstanceOf(startDate, Date)) ? startDate : new Date(); ///获取开始时间
    for (var i = 0; i < count; i++) {
        var nextDay = TOOLS.DATE.GetOtherDay(startDate, i);
        //nextDay = TOOLS.DATE.GetNow(nextDay);
        arr.push(nextDay);
    }
    return arr;

}

//-----------------------
module.exports = TOOLS;