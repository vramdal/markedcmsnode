exports.resolve = function(resourceProviderArr) {
    return function(req, res, next) {
        var path = req.resourcePath || req.path;
        resourceFetcher(resourceProviderArr, path,
                function(resource) {
                    resource.requestPath = req.path;
                    console.log("Got resource: ", resource);
                    next();
                },
                function(errorCode, error) {
//                    next("ResourceResolver error: " + errorCode + " " +  error);
                    res.writeHead(errorCode);
                    res.end(errorCode + " " + error);
                });
    }
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
            });
}