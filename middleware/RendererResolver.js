var request = require("../node_modules/express/lib/request");

module.exports = function RendererResolver() {
    this.renderersMap = {};
    this.contentTypeList = [];

    this.registerRenderer = function(contentType, renderer) {
        this.renderersMap[contentType] = renderer;
        this.contentTypeList.push(contentType);
        this.contentTypeList.sort(function(a, b) {
            return b.length - a.length;
        });
    };

    this.resolveRenderer = function(mimeType) {
        var renderer = undefined;
        for (var i = 0; i < this.contentTypeList.length; i++) {
            var contentType = this.contentTypeList[i];
            if (contentType == mimeType) { // TODO: Implementer pattern matching
                renderer = this.renderersMap[contentType];
                break;
            }
        }
        return renderer;
    };

    this.render = function(resourceResolver) {
        var self = this;
        return function(req, response, next) {
            var resource = req["resource"];
            var renderer = self.resolveRenderer(resource.getMimeType());
            if (renderer) {
                try {
                    renderer(resource, response);
                } catch (e) {
                    next(e);
                }
            } else {
                next(406, "Ingen passende renderer");
            }
        }
    };
}

function matchesMimeType(mimeType, candidateMimeTypes) {
    return request.accepts.call({"Accept": mimeType}, candidateMimeTypes);
}


/*
 exports.pageRenderer = function(resourceResolver) {
 return function(req, res, next) {
 var resource = req["resource"];
 var stream = resource.getStream();
 var jsonString = "";
 stream.on("data", function(chunk) {
 jsonString += chunk;
 });
 stream.on("end", function() {
 console.log("Har lest: " + jsonString);
 var pageSpec = JSON.parse(jsonString);

 });
 }
 };*/
