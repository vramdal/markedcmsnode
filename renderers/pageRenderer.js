var pathTool = require("path");
var md = require("marked");
var async = require("async");
var jade = require("jade");

module.exports = function(req, res, next) {
    var resource = req["markedCms"].resource;
    var siteRootPath = req["markedCms"].siteRootPath;
    var templatePath = resource.compiled.template["path"];
    var jadeStr = resource.compiled.template["content"];
    var htmlContents = {};
    for(var prop in resource.compiled.templateContent) {
        if (!resource.compiled.templateContent.hasOwnProperty(prop)) {
            continue;
        }
        var contentPath = resource.compiled.templateContent[prop]["path"];
        var contentStr = resource.compiled.templateContent[prop]["content"];
        htmlContents[prop] = {
            "id": contentPath,
            "html": contentStr
        };
    }
    htmlContents["user"] = req.user;
    var templateFn = jade.compile(jadeStr, {
                'filename': pathTool.join(siteRootPath, templatePath),
                'pretty': true,
                'basedir': __dirname + "/../views"}
    );
    var html = templateFn(htmlContents);
    res.end(html);
};

