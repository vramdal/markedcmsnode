module.exports = function (resourceResolver) {
	return function (resource, response) {
		response.head(resource.getErrorCode());
		response.end("Error: " + resource.getErrorCode())
	};
};