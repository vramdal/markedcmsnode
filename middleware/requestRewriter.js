exports.path = function(regex, replacementStr) {
    return function(req, res, next) {
        var path = req.resourcePath || req.path;
        if (regex.test(path)) {
            req.resourcePath = req.path.replace(regex, replacementStr);
        }
        next();
    }
};

exports.lastPart = function(regex, replacementStr) {
    return function(req, res, next) {
        var path = req.resourcePath || req.path;
        var parts = path.substring(1).split("/");
        var lastPart = parts[parts.length - 1];
        if (regex.test(lastPart)) {
            lastPart = lastPart.replace(regex, replacementStr);
            parts[parts.length - 1] = lastPart;
            req.resourcePath = "/" + parts.join("/");
        }
        next();
    }
};