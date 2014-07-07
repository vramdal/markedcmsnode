function Resource(path, mimeType, stream, size) {
    this.path = path;
    this.mimeType = mimeType;
    this.stream = stream;
    this.size = size;

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
        stream.on("error", function(err) {
            callback(err);
        });
        stream.on("end", function () {
            console.log("Har lest: " + str);
            callback(null, str);
        });
    };
    this.getJSON = function(callback) {
        this.getString(function(err, str) {
            callback(err, JSON.parse(str))
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
	};
    this.getSize = function() {
        return this.size;
    }
}

module.exports = Resource;