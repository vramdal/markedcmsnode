var async = require("async");

module.exports = function ResourceResolver(resourceProviderArr) {
    this.resourceProviderArr = resourceProviderArr;
    this.resolveRequest = function(siteRootPath) {
        var self = this;
        return function(req, res, next) {
            var path = (req instanceof String) ? req : (req.resourcePath || req.path);
			if (req.method && (req.method == "GET" || req.method == "PUT" || req.method == "DELETE")) {
				resourceFetcher(self.resourceProviderArr, path,
						function (resource) {
							console.log("Got resource: ", resource.getPath());
							if (resource == null) {
								resource = new Resource(path, "error/404", null);
							}
							if (!(req instanceof String)) {
								resource.requestPath = req.path;
								resource.siteRootPath = siteRootPath;
								req.resource = resource;
							}
							if (next) {
								next();
							}
						},
						function (errorCode, error) {
							//                    next("ResourceResolver error: " + errorCode + " " +  error);
							res.writeHead(errorCode);
							res.end(errorCode + " " + error);
						});
			} else if (req.method == "POST") {
				self.findResourceProviderForNewResource(path, req.contentType, function (resourceProvider) {
					console.log("Ville opprettet " + path + " med resourceProvider " + resourceProvider);
					// TODO
					res.writeHead(201);
					res.end("OK");
				});
			}
        }
    };
	this.findResourceProviderForNewResource = function(path, mimeType, callback) {
		async.detectSeries(this.resourceProviderArr,
				function(resourceProvider, truthCallback) {
					resourceProvider.canInsert(path, mimeType, function (err, bool) {
						if (err) {
							truthCallback(false);
						}
						truthCallback(bool);
					});
				},
				function (firstMatchingResourceProvider) {
					callback(firstMatchingResourceProvider);
				});
	};
    this.resolvePath = function(path, successCallback, errorCallback) {
        var self = this;
        resourceFetcher(self.resourceProviderArr, path, successCallback, errorCallback);
    };
};


function resourceFetcher(resourceProviderArr, path, resourceCb, errorCb) {
    if (resourceProviderArr.length == 0) {
		resourceCb(null);
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