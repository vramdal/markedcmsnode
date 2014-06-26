var md = require('marked');

exports.pageRenderer = function(resourceResolver) {
    return function(req, res, next) {
        var resource = req["resource"];
        resourceResolver()
    }
};