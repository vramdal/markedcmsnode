var async = require("async");
var fs = require("fs");
var fileFetcher = require("../util/fileFetcher");

module.exports = function(req, res, next) {
    var resource = req["markedCms"].resource;
    var templateName = "includes/content";
    var templatePath = __dirname + "/../views/" + templateName + ".jade";
    async.parallel(
            {
                "resourceStr": function (callback) {
                    resource.getString(callback);
                },
                "templateObj": function (callback) {
                    fileFetcher({"path": templatePath}, callback);
                }
            },
            function (err, result) {
                if (err) {
                    return next(err);
                }
                resource.template = result["templateObj"];
                resource.content = result["resourceStr"];
                next();
            });
};