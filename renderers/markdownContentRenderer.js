var pathTool = require("path");
var md = require("marked");
var async = require("async");
var jade = require("jade");

module.exports = function(req, res, next) {
    var resource = req["markedCms"].resource;
    var siteRootPath = req["markedCms"].siteRootPath;
    var jadeStr = resource.template.content;
    var templateFn = jade.compile(jadeStr, {
                'filename': pathTool.join(__dirname + "/../views", "includes/content.jade"),
                'pretty': true,
                'basedir': __dirname + "/../views"}
    );
    var contentBlock = {"id": resource.getPath(), "html": md(resource.content)};
    var html = templateFn({contentBlock: contentBlock});
    res.end(html);

};