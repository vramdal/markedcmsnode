var pathTool = require("path");
var md = require("marked");
var async = require("async");
var jade = require("jade");

module.exports = function(resourceResolver) {
    return function(resource, response) {
        resource.getJSON(function(pageSpec) {
            var siteRootPath = resource.siteRootPath;
            var templateName = pageSpec.template;
            var templateContent = pageSpec.content;
            var templatePath = "/templates/" + templateName + ".jade";
            var resourcesToFetch = [{identifier: templateName, path: templatePath}];
            for (var prop in templateContent) {
                if (templateContent.hasOwnProperty(prop)) {
                    var contentPath = templateContent[prop];
                    var fetchObj = {
                        identifier: contentPath,
                        path: pathTool.join("/content", contentPath)
                    };
                    resourcesToFetch.push(fetchObj);
                }
            }
            fetchResources(resourcesToFetch, resourceResolver, function(err, fetched) {
                if (err) {
                    console.error("Error fetching page: " + err);
                    response.end("<h1>" + err + "</h1>");
                }
                var jadeStr = fetched[templateName];
                var htmlContents = {};
                for(var prop in templateContent) {
                    if (!templateContent.hasOwnProperty(prop)) {
                        continue;
                    }
                    var contentPath = templateContent[prop];
                    htmlContents[prop] = {"id": contentPath, "html": md(fetched[contentPath])};
                }
                var templateFn = jade.compile(jadeStr, {
                            'filename': pathTool.join(siteRootPath, templatePath),
                            'pretty': true,
                            'basedir': __dirname + "/../views"}
                );
                var html = templateFn(htmlContents);
                response.end(html);
            });
        });
    }
};

function fetchResources(fetchObjects, resourceResolver, callback) {
    var iterator = function(fetchObject, callback) {
        resourceResolver.resolvePath(fetchObject.path,
                function(resource) {
                    try {
                        resource.getString(function (str) {
                            callback(null, str);
                        });
                    } catch (e) {
                        callback(e);
                    }
                },
                function(error) {
                    callback(error);
                });
    };
    async.map(fetchObjects, iterator, function(err, strings) {
        var result = {};
        for (var i = 0; i < strings.length; i++) {
            var fetchObject = fetchObjects[i];
            result[fetchObject["identifier"]] = strings[i];
        }
        callback(err, result);
    });

}