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
    this.getString = function (callback) {
        var stream = this.getStream();
        var str = "";
        stream.on("data", function (chunk) {
            str += chunk;
        });
        stream.on("end", function () {
            console.log("Har lest: " + str);
            callback(str);
        });
    };
    this.getJSON = function(callback) {
        this.getString(function(str) {
            callback(JSON.parse(str))
        });
    };
	this.isError = function() {
		return mimeType.startsWith("error/");
	};
	this.getErrorCode = function() {
		if (!this.isError()) {
			return null;
		} else {
			return mimeType.substringAfter("error/");
		}
	}
}

module.exports = Resource;