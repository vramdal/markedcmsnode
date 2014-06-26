function Resource(path, mimeType, stream) {
    this.path = path;
    this.mimeType = mimeType;
    this.stream = stream;

    this.getPath = function() {
        return this.path;
    };
    this.getMimeType = function() {
        return this.mimeType;
    };
    this.getStream = function() {
        return this.stream;
    };

}

module.exports = Resource;