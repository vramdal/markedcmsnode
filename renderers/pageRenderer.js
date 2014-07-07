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
        htmlContents[prop] = {"id": contentPath, "html": md(contentStr)};
    }
    var templateFn = jade.compile(jadeStr, {
                'filename': pathTool.join(siteRootPath, templatePath),
                'pretty': true,
                'basedir': __dirname + "/../views"}
    );
    var html = templateFn(htmlContents);
    res.end(html);
};

/*
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
*/

exports.renderProxiedResponse = function(req, res, next) {
    var fetchResource = function(fetchObject, callback) {
        var options = {
            "host": "localhost",
            "port": 8080,
            "path": fetchObject.path
        };
        http.get(options, function(resp) {
            var string = "";
            resp.on("data", function(chunk) {
                console.log("Fikk data for " + fetchObject.path + ": " + chunk);
                string += chunk;
            });
            resp.on("error", function(error) {
                console.log("Feil ved henting av " + fetchObject.path + ": " + error);
                string = error;
                callback(error);
            });
            resp.on("end", function(chunk) {
                console.log("Ferdig med henting av " + fetchObject.path + ": " + chunk);
                if (chunk) {
                    string += chunk;
                }
                callback(null, string);
            });
        });
    };
    fetchResource({identifier: req.path, path: req.path}, function(error, string) {
        if (error) {
            next(error);
            return;
        }
        var pageSpec = JSON.parse(string);
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
        async.map(resourcesToFetch, fetchResource, function(err, strings) {
            var result = {};
            for (var i = 0; i < strings.length; i++) {
                var fetchObject = resourcesToFetch[i];
                result[fetchObject["identifier"]] = strings[i];
            }
    //        callback(err, result);
            res.json(result);
        });
    });

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