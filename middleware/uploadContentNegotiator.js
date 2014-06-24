exports.uploadNegotiator = function(specs, fallback) {
    return function(req, res, next) {
        for (var mimeType in specs) {
            if (!specs.hasOwnProperty(mimeType)) {
                continue;
            }
            if (req.headers["content-type"].indexOf(mimeType) == 0) {
                specs[mimeType].call(this, req, res, next);
                return;
            }

        }
        fallback.call(this, req, res, next);
    }
};