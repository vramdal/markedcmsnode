var pathTool = require('path');
var fs = require("fs");
var mime = require('mime');


var rootDir = process.env["filePersistence.rootDir"];
var CONTENT = {prefix: "content", suffix: ".md"};
var PAGES = {prefix: "pages", suffix: ".json"};
var TEMPLATES = {prefix: "templates", suffix: ".jade"};
var ASSETS = {prefix: "assets"};

function getFilePath(type, pathStr) {
    return pathTool.join(rootDir, type.prefix, pathStr) + (type.suffix || '');
}

function getURLPath(type, filePath) {
	return filePath.substring(rootDir.length + 1 + type.length);
}

function _getFile(filePath, callBack, errorHandler) {
	fs.exists(filePath, function (exists) {
		if (!exists) {
			errorHandler(404);
		} else {
			fs.readFile(filePath, {"encoding": "utf8", "flag": "r"}, function (err, data) {
				if (err) {
					errorHandler(500, err);
				} else {
					callBack(data);
				}
			});
		}
	});
}

function _getFileSync(filePath) {
	if (!fs.existsSync(filePath)) {
		throw new Error(404);
	} else {
		return fs.readFileSync(filePath, {"encoding": "utf8", "flag": "r"});
	}
}

function _getJson(filePath, callBack, errorHandler) {
	_getFile(filePath, function(text) {
		var json;
		try {
			json = JSON.parse(text);
		} catch (e) {
			errorHandler(500, e);
			return;
		}
		callBack(json);
	}, errorHandler);
}

exports.getContentSync = function(pathStr) {
	return _getFileSync(getFilePath(CONTENT, pathStr));
};

exports.getContent = function(pathStr, callBack, errorHandler) {
	_getFile(getFilePath(CONTENT, pathStr), callBack, errorHandler);
};

exports.getPage = function(pathStr, callBack, errorHandler) {
	_getJson(getFilePath(PAGES, pathStr), callBack, errorHandler);
};

exports.getTemplate = function(pathStr, callBack, errorHandler) {
	_getFile(getFilePath(TEMPLATES, pathStr), callBack, errorHandler);
};

exports.getBinaryStream = function(pathStr, errorCallback) {
    var filePath = getFilePath(ASSETS, pathStr);
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
    var filePath = getFilePath(CONTENT, pathStr);
    var existed = fs.existsSync(filePath);
    fs.writeFile(filePath, content, function(err) {
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

exports.copyBinary = function(srcFilePath, successCallback, errorCallback) {
	var filePath = getFilePath(pathTool.basename(srcFilePath));
	var cbCalled = false;

	var rd = fs.createReadStream(srcFilePath);
	rd.on("error", function (err) {
		errorCallback(err);
	});
	var wr = fs.createWriteStream(filePath);
	wr.on("error", function (err) {
		errorCallback(err);
	});
	wr.on("close", function (ex) {
		successCallback(getURLPath(filePath));
	});
	rd.pipe(wr);

	function done(err) {
		if (!cbCalled) {
			cb(err);
			cbCalled = true;
		}
	}};