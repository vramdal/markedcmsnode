var pathTool = require('path');
var fs = require("fs");
var mime = require('mime');
var Resource = require('../util/Resource');


var rootDir = process.env["filePersistence.rootDir"];
var CONTENT = {prefix: "content"};
var PAGES = {prefix: "content", suffix: ".page.json"};
var TEMPLATES = {prefix: "templates", suffix: ".jade"};
var STATIC = {prefix: ""};
//var ASSETS = {prefix: "assets"};

function getFilePath(type, pathStr) {
    if (type) {
        return pathTool.join(rootDir, type.prefix, pathStr) + (type.suffix || '');
    } else {
        return pathTool.join(rootDir, pathStr);
    }
}

/*
function getURLPath(type, filePath) {
	return filePath.substring(rootDir.length + 1 + type.length);
}

*/
function _getFileContents(filePath, callBack, errorHandler) {
	console.info("Getting contents of " + filePath);
	fs.exists(filePath, function (exists) {
		if (!exists) {
			errorHandler(404, filePath);
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

exports.getResource = function(filePath, resourceCb, errorHandler) {
    var internalPath = getFilePath(null, filePath);
    try {
        fs.open(internalPath, "r", function (err, fd) {
            if (err) {
                console.error("Feil ved åpning av " + internalPath);
                errorHandler(err);
                return;
            }
            var stream;
            try {
                stream = fs.createReadStream(filePath, { "fd": fd });
            } catch (e) {
                return resourceCb(null);
            }
            return resourceCb(new Resource(filePath, getMimeType(internalPath), stream));
        });
    } catch (e) {
        return resourceCb(null);
    }
};

exports.getResourceSync = function(filePath) {
    var internalPath = getFilePath(null, filePath);
    var stream = fs.createReadStream(fs.openSync(internalPath, "r"));
    return new Resource(filePath, getMimeType(internalPath), stream);
};

function getMimeType(path) {
    if (pathTool.basename(path).endsWith(".page.json")) {
        return "markedcms/page";
    } else {
        return mime.lookup(path);
    }
}

function _getFileSync(filePath) {
	if (!fs.existsSync(filePath)) {
		throw new Error(404);
	} else {
		return fs.readFileSync(filePath, {"encoding": "utf8", "flag": "r"});
	}
}

function _getJson(filePath, callBack, errorHandler) {
	_getFileContents(filePath, function(text) {
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

exports.getTemplatesPath = function() {
    return pathTool.join(rootDir, TEMPLATES.prefix);
};

exports.getContent = function(pathStr, callBack, errorHandler) {
	_getFileContents(getFilePath(CONTENT, pathStr), callBack, errorHandler);
};

exports.getPage = function(pathStr, callBack, errorHandler) {
	_getJson(getFilePath(PAGES, pathStr), callBack, errorHandler);
};

exports.getStream = function(pathStr, callBack, errorHandler) {
    var filePath = getFilePath(CONTENT, pathStr);
	_getStream(filePath, callBack, errorHandler);
};

exports.getStaticStream = function(pathStr, callBack, errorHandler) {
	var filePath = getFilePath(STATIC, pathStr);
	_getStream(filePath, callBack, errorHandler);
};
function _getStream(filePath, callBack, errorHandler) {
	fs.exists(filePath, function (exists) {
		if (exists) {
			try {
				var stream = fs.createReadStream(filePath);
				callBack({
					"stream": stream,
					"contentType": getMimeType(filePath)
				});
			} catch (e) {
				errorHandler(500, e);
			}
		} else {
			errorHandler(404, "File not found");
		}
	});
}

exports.saveStream = function(readableStream, pathStr) {
    var filePath = getFilePath(CONTENT, pathStr);
    var exists = fs.existsSync(filePath);
    var writeStream = fs.createWriteStream(filePath);
    readableStream.pipe(writeStream);
    return exists;
};

exports.getTemplate = function(pathStr, callBack, errorHandler) {
    if (!pathStr) {
        errorHandler(500, "No template specified");
        return;
    }
	_getFileContents(getFilePath(TEMPLATES, pathStr), callBack, errorHandler);
};

exports.canInsert = function(pathStr, mimeType, callback) {
	callback(null, false);
};

/*
exports.getBinaryStream = function(pathStr, errorCallback) {
    var filePath = getFilePath(ASSETS, pathStr);
       try {
           var stream = fs.createReadStream(filePath, {
               flags: 'r', encoding: null, fd: null, mode: 0666, autoClose: true
           });
           var mimeType = mime.lookup(pathStr);
           return {
               "mimeType": mimeType,
               "stream": stream
           };
       } catch (e) {
           errorCallback(e, pathStr);
       }
};
*/

exports.saveContent = function(pathStr, content, successCallback, errorCallback) {
    var filePath = getFilePath(CONTENT, pathStr);
    var existed = fs.existsSync(filePath);
    fs.writeFile(filePath, content, function(err) {
        if(err) {
            errorCallback(500, err);
        } else {
            successCallback(existed ? 200 : 201);
        }
    });
};

/*
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
*/

/*
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
	}};*/
