var mime = require("mime");

function Image(imgFileName) {
    this.filePath = __dirname + "/../../assets/" + imgFileName;
    this.getContentType = function() {
        return mime.lookup(this.filePath);
    }
}

exports.getImage = function(fileName) {
    return new Image(fileName);
};

exports.imageRequest = function(req) {
    var parts = /^\/assets\/(.+?)(?:\/.*)*$/.exec(req.path);
    var imgFileName = parts[1];
    return new Image(imgFileName);
};

exports.imageResizeRequest = function(req) {
    var image = this.imageRequest(req);
    var parts = req.route.regexp.exec(req.path);
    var width = parts[2].length > 0 ? parseInt(parts[2]) : undefined;
    var height = parts[3].length > 0 ?  parseInt(parts[3]) : undefined;
    image.requestedWith = width;
    image.requestedHeight = height;
    return image;
};