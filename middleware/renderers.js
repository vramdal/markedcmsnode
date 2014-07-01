var md = require('marked');

var renderersMap = {};
var contentTypeList = [];

exports.registerRenderer = function(contentType, renderer) {
	renderersMap[contentType] = renderer;
	contentTypeList.push(contentType);
	contentTypeList.sort(function(a, b) {
		return b.length - a.length;
	});
};

exports.render = function(resourceResolver) {
	return function(req, res, next) {
		var resource = req["resource"];
		var mimeType = resource.getMimeType();
		var renderer = undefined;
		for (var i = 0; i < contentTypeList.length; i++) {
			var contentType = contentTypeList[i];
			if (contentType == mimeType) { // TODO: Implementer pattern matching
				renderer = renderersMap[contentType];
				break;
			}
		}
		if (renderer) {
			try {
				renderer.render(resource, res);
			} catch (e) {
				next(e);
			}
		} else {
			next(406, "Ingen passende renderer");
		}
	}
};

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
};