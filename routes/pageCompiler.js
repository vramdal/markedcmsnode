var pathTool = require("path");
var md = require("marked");
var async = require("async");
var jade = require("jade");
var http = require("http");
var merge = require("merge");
//var resourceFetcher = require("../util/resourceFetcher");

module.exports = function(req, res, next) {
    req["markedCms"].resource.getJSON(function(err, pageSpec) {
        var templateName = pageSpec.template;
        var templateContent = pageSpec.content;
        var templatePath = "/templates/" + templateName + ".jade";
        var resourcesToFetch = [{identifier: "template" /*templateName*/, path: templatePath}];
		var resourceFetcher = req["markedCms"].resourceFetcher;
        for (var prop in templateContent) {
            if (templateContent.hasOwnProperty(prop)) {
                var contentPath = templateContent[prop];
                var fetchObj = {
                    identifier: prop,
                    path: pathTool.join("/content", contentPath),
                    clazz: "templateContent",
                    headers: {
                        "X-MarkedCms-BufferResource": "true",
                        "X-MarkedCms-Render": "true"
                    }
                };
                resourcesToFetch.push(fetchObj);
            }
        }
        async.map(resourcesToFetch, resourceFetcher.fetch.bind(resourceFetcher), function(err, strings) {
            if (err) {
                next(err);
            }
            var result = {};
            for (var i = 0; i < strings.length; i++) {
                var fetchObject = resourcesToFetch[i];
                var partResult = {};
                var identifier = fetchObject["identifier"];
                partResult = {};
                partResult["content"] = strings[i];
                partResult["path"] = fetchObject["path"];
                var clazz = fetchObject["clazz"];
                if (clazz && !result[clazz]) {
                    result[clazz] = {};
                }
                if (clazz) {
                    result[clazz][identifier] = partResult;
                } else {
                    result[identifier] = partResult;
                }
            }
            //        callback(err, result);
//            result.templatePath = templatePath;
            req["markedCms"].resource.compiled = result;
            next();
        });
    });
};