///参数检查器
var PARAM_CHECKER = {
    ///是否是字符串类型
    IsString: function (input) {
        return PARAM_CHECKER.IsValid(input) && "string" == typeof (input);
    },
    
    ///是否是空字符串
    IsEmptyString: function (input) { 
        return PARAM_CHECKER.IsString(input) && "" == input;
    },
    
    ///是否不是空字符串
    IsNotEmptyString: function (input) {
        return PARAM_CHECKER.IsString(input) && 0 < input.length;
    },

    
    ///是否有意义
    IsValid: function (input) {
        return null != input && undefined != input;
    },
    
    ///若是对象
    IsObject: function (input) {
        return PARAM_CHECKER.IsValid(input) && "object" == typeof (input);
    },
    
    ///若是数值
    IsArray: function (input) {
        return PARAM_CHECKER.IsValid(input) && "object" == typeof (input) && input.constructor == Array;
    },
    
    ///判断是否是函数
    IsFunction: function (input) {
        return PARAM_CHECKER.IsValid(input) && "function" == typeof (input);
    },
    
    ///判断是否是日期
    IsDate: function (input) {
        return PARAM_CHECKER.IsValid(input) && "Invalid Date" != new Date(input.toString()).toString();
    },
    
    ///是否是JS路径
    IsJSUrl: function (input) {
        var reg = new RegExp(/.js/i);
        var res = reg.test(input);
        return res;
    },
    ///是否是整数
    IsInt: function (input) {
        return !isNaN(parseInt(input));
    },

    ///是否是浮点数
    IsFloat: function (input) {
        return !isNaN(parseFloat(input));
    },

    ///是否是一个数字
    IsNumber: function (input) {
        return !isNaN(Number(input));
    },

    ///是否包含指定的字符
    Contains: function (keyword,input) {
        var reg = new RegExp(keyword,"ig");
        var res = reg.test(input);
        return res;
    },

    ///是否是指定类型的对象
    IsInstanceOf: function (obj,cls) {
        return (obj instanceof cls);
    }
}

/*以下是导出函数*/
 

module.exports = PARAM_CHECKER;