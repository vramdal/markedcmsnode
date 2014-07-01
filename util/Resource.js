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
    this.getJSON = function(callback) {
        var stream = this.getStream();
        var jsonString = "";
        stream.on("data", function(chunk) {
            jsonString += chunk;
        });
        stream.on("end", function() {
            console.log("Har lest: " + jsonString);
            callback(JSON.parse(jsonString));
        });
    }

}

module.exports = Resource;