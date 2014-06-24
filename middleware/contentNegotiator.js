var mime = require('mime');

exports.negotiator = function(specs, fallback) {
    return function(req, res, next) {
        for (var mimeType in specs) {
            var insistContentType = req.header("Insist-Content-Type");
            var requestMimeType = mime.lookup(req.path);
            if (!specs.hasOwnProperty(mimeType)) {
                continue;
            }
            if (insistContentType == mimeType || !insistContentType
                    && (requestMimeType == mimeType
                            || requestMimeType == mime.default_type && req.accepts(mimeType))
                    ) {
                specs[mimeType].call(this, req, res, next);
                return;
            }

        }
        fallback.call(this, req, res, next);
    }
};