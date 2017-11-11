var PARAM_CHECKER = require("./PARAM_CHECKER");
var $ = require('cheerio');
var CryptoTools = require("../Core/CryptoTools");
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
        GetDaysInterval: function (day1, day2) {
            var res = (day1 - day2) / 1000 / 3600 / 24;
            return res;
        },
        ///字典转数组
        DictToArray: function (dictData,callback) {
            var arr = [];
            for (var key in dictData) {
                var item = {};
                if (true === PARAM_CHECKER.IsString(dictData[key]) || true === PARAM_CHECKER.IsNumber(dictData[key]) || true === PARAM_CHECKER.IsDate(dictData[key])) {
                    item[key] = dictData[key];
                }
                else if (true === PARAM_CHECKER.IsObject(dictData[key])) {
                    item = dictData[key];
                    item._DictKey = key;
                }

                if (true === PARAM_CHECKER.IsFunction(callback)) {
                    item = callback(item);
                }

                arr.push(item);
            }
            return arr;
        },

        ///数组转字典
        ArrayToDict: function (sourceArray, key) {

            var targetDict = {};

            for (var k = 0; k < sourceArray.length; k++) {
                var item = sourceArray[k];
                if (true === PARAM_CHECKER.IsEmptyString(key)) {
                    targetDict[item[key]] = item;
                }
                else if (true === PARAM_CHECKER.IsArray(key)) {
                    var keystr = key.join("");
                    targetDict[item[keystr]] = item;
                }
                else if (true === PARAM_CHECKER.IsFunction(key)) {
                    key(k, item, targetDict,sourceArray.length);
                }
            }

            return targetDict;
        },


        ///百分号转换 5% == 0.05
        PercentToNumber: function (input) {
            return Number(input.replace("%", "")) / Number(100.0);///
        },

        ///单位转换出错
        UnitToNumber: function (input) {
            input = input.replace("元", "").replace("股", "").replace("，", "");
            if (true === PARAM_CHECKER.Contains("万", input)) {
                var res = Number(input.replace("万", "")) * 10000;
                return res;
            }
            else if (true === PARAM_CHECKER.Contains("亿", input)) {
                var res = Number(input.replace("亿", "")) * 10000 * 10000;
                return res;
            }
            else if (true === PARAM_CHECKER.IsNumber(input)) {
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
        Classify: function (value, option) {
            var res = {};
            for (var k = 0; k < option.length; k++) {
                var item = option[k];
                if (0 === k) {
                    res[option.Name] = (value <= option.Value) ? 1 : 0;
                }
                else {
                    res[option.Name] = (option[k - 1].Value <= value && value <= option.Value) ? 1 : 0;
                }
            }
            return res;
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
        },
        ///多维json对象转化为二维对象
        MultiDTo2D: function (source,propertyName,rootID,layer) {
            var array = [];
            var item = {};
            layer = (undefined == layer) ? 0 : layer+1;
            for (var key in source) {
                item._ContentType = (undefined === propertyName) ? "Root" : propertyName;
                if (undefined === source._id  ) {
                    item._RootID = (undefined === propertyName) ? CryptoTools.MD5(JSON.stringify(source)) : rootID;
                    rootID = item._RootID;
                }
                else if (undefined != source._id&& undefined === item._RootID){
                    item._RootID = (undefined === propertyName) ? source._id.toString() : rootID;
                    rootID = item._RootID;
                }
                
                
                item._Layer = layer;
                var prop = source[key];
                //console.log(key + " " + prop);
                if (true === PARAM_CHECKER.IsObject(prop) &&undefined != prop._bsontype && "ObjectID" === prop._bsontype) {
                    item[key] = prop.toString();
                }
                if (PARAM_CHECKER.IsDate(prop) || PARAM_CHECKER.IsString(prop) || PARAM_CHECKER.IsNumber(prop)) {
                    ///若是基本数据类型
                    item[key] = prop;
                }
                else if (true === PARAM_CHECKER.IsObject(prop) && !PARAM_CHECKER.IsArray(prop) && "ObjectID" != prop._bsontype) {
                    var subArr = TOOLS.JSON.MultiDTo2D(prop, key, rootID,layer);
                    array = array.concat(subArr);
                }
                else if (true === PARAM_CHECKER.IsArray(prop)) {
                    for (var k = 0; k < prop.length; k++) {
                        var subArr = TOOLS.JSON.MultiDTo2D(prop[k], key + "_" + k, rootID, layer);
                        array = array.concat(subArr);
                    }
                }
            }
            array.push(item);
            return array;
        },
        Initial: function (input, defaultValue) {
            if (undefined === input) {
                input = defaultValue;
            }
            return input;
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