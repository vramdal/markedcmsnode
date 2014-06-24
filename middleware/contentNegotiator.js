exports.negotiator = function(specs, fallback) {
    return function(req, res, next) {
        for (var mimeType in specs) {
            if (!specs.hasOwnProperty(mimeType)) {
                continue;
            }
            if (req.accepts(mimeType)) {
                specs[mimeType].call(this, req, res, next);
                return;
            }

        }
        fallback.call(this, req, res, next);
    }
};