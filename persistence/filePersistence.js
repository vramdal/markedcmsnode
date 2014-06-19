var pathTool = require('path');
var fs = require("fs");


var rootDir = process.env.filePersistence.rootDir;

exports.getContent = function(pathStr, successCallback, errorCallback) {
	var filePath = pathTool.join(rootDir, pathStr);
	fs.readFile(filePath, "utf8", function(err, data) {
		if (err) {
			if (errorCallback) {
				errorCallback(err, pathStr);
			}
		} else {
			successCallback(data);
		}
	})
};