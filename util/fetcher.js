var fileFetcher = require("./fileFetcher");
var resourceFetcher = require("./resourceFetcher");

module.exports = function(fetchObj, callback) {
    if (fetchObj["repository"] == "file") {
        return fileFetcher(fetchObj, callback);
    } else if (fetchObj["repository"] == "resource") {
        return resourceFetcher(fetchObj, callback);
    } else {
        throw new Error("Unsupported repository: " + fetchObj["repository"]);
    }
};