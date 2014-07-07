var http = require("http");
var fs = require("fs");

module.exports = function(fetchObject, callback) {
    fs.readFile(fetchObject.path, {"encoding": "utf8"}, function(err, str) {
        if (err) {
            callback(err);
        }
        callback(null, {"path": fetchObject.path, "content": str});
    });
 };
