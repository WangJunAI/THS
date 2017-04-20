loader = require('./ModuleLoader.js');
var $ = require('cheerio');
var mongo = require('./MongoDB.js');
var PARAM_CHECKER = require('./PARAM_CHECKER.js');
///本地文件服务
var LocalService = {
    
    ///获取指定文件夹下的子文件夹
    ///@depth,深度 1 - 下面一层  -1 --递归到最底层
    GetSubFolders: function (rootPath, depth, callback) {
        var fs = loader.LoadFileSystem();
        var checker = loader.LoadParamChecker();
        fs.readdir(rootPath, function (err,data) {
            var length = data.length;
            var array = [];
            var queue = [];
            for (var i = 0; i < length; i++) {
                var item = data[i];
                var stat = fs.statSync(rootPath+"\\"+item);
                if (stat.isDirectory()) {
                    ///若是目录
                    array.push(item);
                }
            }
            if (checker.IsFunction(callback)) {
                callback(err , array);
            }
        });
    },
    
    ///获取指定文件夹下的文件
    GetFiles: function (rootPath, depth, callback,returnAll) {
        var fs = loader.LoadFileSystem();
        var fileArray = [];
        LocalService.GetSubFolders(rootPath, depth, function (err, folders) {
            ///获取所有目录
            if (!PARAM_CHECKER.IsValid(folders)) {
                folders.push("\\");
            }
            var folderLength = folders.length;
            for (var i = 0; i < folderLength; i++) {
                var folderPath = folders[i];
                var files = fs.readdirSync(rootPath + "\\" + folderPath);                
                var filesLength = files.length;
                var array = [];
                for (var j = 0; j < filesLength; j++) {
                    var item = files[j];
                    var stat = fs.statSync(rootPath + "\\" + folderPath + "\\" + item);
                    if (stat.isFile()) {
                        ///若是文件
                        if (true === returnAll) {
                            array.push(rootPath + "\\" + folderPath + "\\" + item);
                        }
                        else {
                            callback(err, rootPath + "\\" + folderPath + "\\" + item);
                        }
                    }
                }

                if (true === returnAll && PARAM_CHECKER.IsFunction(callback)) {
                    callback(err, array);
                }
            }
        });    
    },
    
    ///获取指定文件
    ReadFile: function (filePath) {
        var fs = loader.LoadFileSystem();
        var content = fs.readFileSync(filePath, "utf8");
        return content;
    },
    
    ///监控指定路径的文件--无递归
    WatchPath: function (rootPath,callback) {
        var fs = loader.LoadFileSystem();
        var watcher = fs.watch(rootPath, function (event, fileName) {
            if (PARAM_CHECKER.IsFunction(callback)) {
                if (PARAM_CHECKER.IsString(fileName)) {
                    var buf = new Buffer(fileName, 'binary');
                    fileName = buf.toString();
                }

                callback(event, fileName);
            }
        });

        var i = 9;
    }
}

module.exports = LocalService;


//LocalService.WatchPath("F:\\test\\test2\\", function (event,fileName) {
//    console.log("有变化"+ event+" "+ fileName);
//});
 

//LocalService.GetSubFolders("F:\\test",9, function (err, files) { 
//    console.log(files);

//});


//LocalService.GetFiles("D:\\WangYiYunYinYue2", 1, function (err, filePath) {
//    var item = filePath;
//    var content = LocalService.ReadFile(item);
//    var jsonData = {
//        Path: item,
//        Content: content
//    }
//    mongo.Save("WYGeQu", jsonData, function () {
             
//    }, 1);
//});