var PARAM_CHECKER = require("./PARAM_CHECKER");
var $ = require('cheerio');
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
        GetYesterday: function (dat) { },
         
    },
    Convertor: {
        ToDate: function (input, defaultValue) {
            input = input.replace('-', '/');
            var res = new Date(Date.parse(input))
            return res;
        },
        ///字典转数组
        DictToArray: function (dictData) {
            var arr = [];
            for (var item in dictData) {

            }
        },
        ///百分号转换 5% == 0.05
        PercentToNumber: function (input) {
            return Number(input.replace("%", "")) / Number(100.0);///
        },

        ///单位转换出错
        UnitToNumber: function (input) {
            input = input.replace("元", "").replace("股", "").replace("，", "");
            if (PARAM_CHECKER.Contains("万", input)) {
                var res = Number(input.replace("万", "")) * 10000;
                return res;
            }
            else if (PARAM_CHECKER.Contains("亿", input)) {
                var res = Number(input.replace("亿", "")) * 10000 * 10000;
                return res;
            }
            else if (PARAM_CHECKER.IsNumber(input)) {
                return Number(input);
            }
            throw "单位转换出错 " + "UnitToNumber";
        },
        DateFromISOToChina: function (date) {
            return date.setHours(date.getHours() + 8);
        },
        DateFromChinaToISO: function (date) {
            return date.setHours(date.getHours() - 8);
        }


    },
    STR: {
        LastSubString: function () { },
        LastChar: function (input) {
            var res = input.slice(-2, -1);
        },
        ///
        SubStringReplace: function (startIndex, endIndex, replaceObj) {

        },
        ///将转换为数字
        ToNumber: function (input) {
            input = input.replace("元", "");
            input = input.replace("不足", "");
            var res = "";
            if (new RegExp(/亿/).test(input)) {
                input = input.replace("亿", "");
                res = Number(input) * 10000 * 10000;
            }
            else if (new RegExp(/万/).test(input)) {
                input = input.replace("万", "");
                res = Number(input) * 10000 * 10000;
            }
            else if (new RegExp(/%/).test(input)) {
                input = input.replace("%", "");
                res = Number(input) * 0.01;
            }
            return res;
        }
    },
    HTML: {
        TableToJson: function (tableHtml,callback) {
            var $page = $(tableHtml);
            var theadTdArray = $page.find("thead th");
            var tbodyTrArray = $page.find("tbody tr");
            var res = { Column: {}, Data: [] };
            for (var i = 0; i < theadTdArray.length; i++) {
                var $td = $(theadTdArray[i]);
                res.Column["C" + (1 + i)] = $td.text().trim();
            }

            for (var i = 0; i < tbodyTrArray.length; i++) {
                var tdArray = $($(tbodyTrArray[i])[0]).find("td");
                var item = {};
                for (var j = 0; j < tdArray.length; j++) {
                    var $td = $(tdArray[j]);
                    if (PARAM_CHECKER.IsFunction(callback)) {
                        item["C" + (j + 1)] = callback({ Tag: "tbody", Row: i, Column: j }, $td, "在tbody 第" + i + "行 第" + j + "列");
                    }
                    else if (PARAM_CHECKER.IsObject(callback) && PARAM_CHECKER.IsFunction(callback["第" + (j + 1) + "列"])) {
                        item["C" + (j + 1)] = callback["第"+(j+1)+"列"]({ Tag: "tbody", Row: i, Column: j }, $td, "在tbody 第" + i + "行 第" + j + "列");
                    }
                    else {
                        item["C" + (j + 1)] = $td.text();
                    }
                }
                res.Data.push(item);
            }

            return res;
        }
    },
    Compare: {
        NumberCompare: function (value,lower, upper, lowerEq, upperEq) {
            if (PARAM_CHECKER.IsNumber(value)&&PARAM_CHECKER.IsNumber(lower) && PARAM_CHECKER.IsNumber(upper) && !PARAM_CHECKER.IsNumber(lowerEq) && !PARAM_CHECKER.IsNumber(upperEq) && lower < upper) {
                return lower < value && value < upper;
            }
            else if (PARAM_CHECKER.IsNumber(value) && PARAM_CHECKER.IsNumber(lower) && PARAM_CHECKER.IsNumber(upper) && !PARAM_CHECKER.IsNumber(lowerEq) && PARAM_CHECKER.IsNumber(upperEq) && lower <= upper) {
                return lower < value && value <= upper;
            }
            else if (PARAM_CHECKER.IsNumber(value) && PARAM_CHECKER.IsNumber(lower) && PARAM_CHECKER.IsNumber(upper) && PARAM_CHECKER.IsNumber(lowerEq) && !PARAM_CHECKER.IsNumber(upperEq) && lower <= upper) {
                return lower <= value && value < upper;
            }
            else if (PARAM_CHECKER.IsNumber(value) && PARAM_CHECKER.IsNumber(lower) && PARAM_CHECKER.IsNumber(upper) && PARAM_CHECKER.IsNumber(lowerEq) && PARAM_CHECKER.IsNumber(upperEq) && lower <= upper) {
                return lower <= value && value <= upper;
            }
            throw "NumberCompare 比较方法出错 lower=" + lower + " value=" + value + " upper=" + upper + " lowerEq=" + lowerEq + " upperEq=" + upperEq;
        }
    },
    JSON: {
        ///获取属性数量
        KeyCount: function (json) {
            var keyCount=0
            for (var key in json) {
                keyCount++;
            }
            return keyCount;
        }
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