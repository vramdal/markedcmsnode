exports.makeProxy = function(req, res, next, callback) {
    res.markedCms = {
        "string": "",
        "originalEnd": res.end,
        "originalWriteHead": res.writeHead,
        "originalWrite": res.write
    };
    res.writeHead = function(statusCode, reasonPhrase, headers) {
        res.markedCms.statusCode = statusCode;
        res.markedCms.reasonPhrase = reasonPhrase;
        res.markedCms.headers = headers;
    };
    res.write = function(chunk, encoding) {
        res.markedCms.string += chunk;
    };
    res.end = function(chunk, encoding) {
        if (chunk) {
            res.markedCms.string += chunk;
        }
        console.log("Data: " + res.markedCms.string);
//        res.markedCms.originalWriteHead.call(res, res.markedCms.statusCode, res.markedCms.reasonPhrase, res.markedCms.headers);
//        res.markedCms.originalEnd.call(res, res.markedCms.string);
        res.writeHead = res.markedCms.originalWriteHead;
        res.write = res.markedCms.originalWrite;
        res.end = res.markedCms.originalEnd;
        callback(req, res, next);
    };
    return res;
};

exports.unmakeProxy = function(res) {
    if (res.markedCms) {
        res.writeHead = res.markedCms.originalWriteHead;
        res.write = res.markedCms.originalWrite;
        res.end = res.markedCms.originalEnd;
        delete res.markedCms;
    }
    return res;
};