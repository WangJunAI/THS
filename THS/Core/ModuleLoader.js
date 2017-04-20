
///模块加载器
var ModuleLoader = {
     
    ///加载各种模块
    Load: function (moduleArray) {
        var moduleDict = {};
        var initial = function (moduleArray) {
            moduleArray =("string" == typeof (moduleArray))?[moduleArray]:moduleArray;///若传入的是字符串
            if ("object" == typeof (moduleArray) && moduleArray.constructor == Array) {
                ///初始化各种模块
                var length = moduleArray.length;
                for (var i = 0; i < length; i++) {
                    var moduleName = moduleArray[i];
                    if (null == moduleDict[moduleName] || undefined == moduleDict[moduleName]) {
                        ///若没有初始化
                        module = require(moduleName);
                        if ("object" == typeof (module)|| "function" == typeof (module)) {
                            ///若初始化成功
                            moduleDict[moduleName] = module;
                            //console.log("成功初始化-"+moduleName);
                        }
                    }
                }
            }

            return moduleDict[moduleArray[0]];
        }
        return initial;
    }
}

///导出函数
exports.Load = function (moduleNameArray) { 
    return ModuleLoader.Load(moduleNameArray);
}

///加载MongoDB
exports.LoadMongoDB = function () {
    return ModuleLoader.Load()("mongodb");
}

///加载文件系统
exports.LoadFileSystem = function () {
    return ModuleLoader.Load()("fs");
}

exports.LoadParamChecker = function () { 
    return ModuleLoader.Load()("./PARAM_CHECKER");
}