exports.queryContent = function(queryArr, persistence) {
    var paths = undefined;
    for (var i = 0; i < queryArr.length; i++) {
        var criteria = queryArr[i];
        if (criteria["pathRegexp"]) {
            paths = persistence.matchers["pathRegexp"](paths, criteria["pathRegexp"]);
        }
    }
    var result = {};
    for (var p = 0; p < paths.length; p++) {
        var path = paths[p];
        result[path] = persistence.getContentSync(path);
    }
    return paths;
};