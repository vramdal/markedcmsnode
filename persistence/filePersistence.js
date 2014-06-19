var pathTool = require('path');
var fs = require("fs");
var mime = require('mime');


var rootDir = process.env["filePersistence.rootDir"];

function getFilePath(pathStr) {
    return pathTool.join(rootDir, pathStr);
}
exports.getContent = function(pathStr, callBack, errorHandler) {
	var filePath = getFilePath(pathStr) + ".md";
    fs.exists(filePath, function(exists) {
        if (!exists) {
            errorHandler(404);
        } else {
            fs.readFile(filePath, {"encoding": "utf8", "flag": "r"}, function(err, data) {
                if (err) {
                    errorHandler(500, err);
                } else {
                    callBack(data);
                }
            });
        }
    });
};

exports.getBinaryStream = function(pathStr, errorCallback) {
    var filePath = getFilePath(pathStr);
       try {
           var stream = fs.createReadStream(pathStr, {
               flags: 'r', encoding: null, fd: null, mode: 0666, autoClose: true
           });
           var mimeType = mime.lookup(pathStr);
           return {
               "mimeType": mimeType,
               "stream": stream
           };
       } catch (e) {
           errorHandler(e, pathStr);
       }
};

exports.saveContent = function(pathStr, content, successCallback, errorCallback) {
    var filePath = getFilePath(pathStr);
    var existed = fs.existsSync(filePath);
    fs.writeFile(filePath + ".md", content, function(err) {
        if(err) {
            errorCallback(500, err);
        } else {
            successCallback(existed ? 201 : 200);
        }
    });
};

exports.saveBinary = function (pathStr, data, errorCallback) {
    var filePath = getFilePath(pathStr);
    fs.writeFile(filePath, data, function(err) {
        fs.writeFile(filePath, content, function(err) {
            if(err) {
                errorCallback(err);
            }
        });
    });
};