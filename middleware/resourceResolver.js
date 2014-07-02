module.exports = function ResourceResolver(resourceProviderArr) {
    this.resourceProviderArr = resourceProviderArr;
    this.resolveRequest = function(siteRootPath) {
        var self = this;
        return function(req, res, next) {
            var path = (req instanceof String) ? req : (req.resourcePath || req.path);
            resourceFetcher(self.resourceProviderArr, path,
                    function(resource) {
                        console.log("Got resource: ", resource);
                        if (!(req instanceof String)) {
                            resource.requestPath = req.path;
                            resource.siteRootPath = siteRootPath;
                            req.resource = resource;
                        }
                        if (next) {
                            next();
                        }
                    },
                    function(errorCode, error) {
    //                    next("ResourceResolver error: " + errorCode + " " +  error);
                        res.writeHead(errorCode);
                        res.end(errorCode + " " + error);
                    });
        }
    };
    this.resolvePath = function(path, successCallback, errorCallback) {
        var self = this;
        resourceFetcher(self.resourceProviderArr, path, successCallback, errorCallback);
    };
};


function resourceFetcher(resourceProviderArr, path, resourceCb, errorCb) {
    if (resourceProviderArr.length == 0) {
        errorCb(404, "Not found");
        return;
    }
    var resourceProvider = resourceProviderArr[0];
    resourceProvider.getResource(path,
            function(resource) {
                if (!resource) {
                    resourceFetcher(resourceProviderArr.slice(1), path, resourceCb, errorCb)
                } else {
                    resourceCb(resource);
                }
            },
            function(error) {
                console.error("ResourceFetcher error", error);
				errorCb(404, error);
            });
}