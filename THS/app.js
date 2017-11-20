 
var ths = require("./BIZ/THS");
  
//ths.Run();
 
var wj = require("../THS/Core/WJMutilTask"); 
 
var svr = require("../THS/Core/CoreHttpService");
svr.Run();
 

console.log('Hello world ' + process.pid);
