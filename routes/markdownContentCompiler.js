var async = require("async");
var fs = require("fs");

module.exports = function(req, res, next) {
    var resource = req["markedCms"].resource;
    resource.getString(function(err, mdText) {
        if (err) {
            next(err);
        }
        resource.content = mdText;
        var templateName = "includes/content";
        var templatePath = __dirname + "/../views/" + templateName + ".jade";
        fs.readFile(templatePath, {"encoding": "utf8"}, function(err, str) {
            if (err) {
                next(err);
            }
            resource.template = {};
            resource.template.path = templatePath;
            resource.template.content = str;
            next();
        });
    });

};