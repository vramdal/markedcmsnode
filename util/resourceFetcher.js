var http = require("http");
var pathTool = require("path");
function ResourceFetcher(resourceProvider) {
	this.resourceProvider = resourceProvider;
}
module.exports = ResourceFetcher;

ResourceFetcher.prototype.fetch = function(fetchObject, callback) {
    var headers = fetchObject.headers || {};
    headers["Connection"] = "keep-alive";
    var options = {
        "host": "localhost",
        "port": 8080,
        "path": fetchObject.path,
        "headers": headers
    };

    if (callback) {
		this.resourceProvider.getResource(fetchObject.path, function(err, resource) {
			if (err) {
				callback(err);
			}
			resource.getString(callback);
//			callback(null, resource.getString());
		});
/*
        http.get(options, function(resp) {
            var string = "";
            resp.on("data", function(chunk) {
                console.log("Fikk data for " + fetchObject.path + ": " + chunk);
                string += chunk;
            });
            resp.on("error", function(error) {
                console.log("Feil ved henting av " + fetchObject.path + ": " + error);
                string = error;
                callback(error);
            });
            resp.on("end", function(chunk) {
                console.log("Ferdig med henting av " + fetchObject.path + ": " + chunk);
                if (chunk) {
                    string += chunk;
                }
                callback(null, string);
            });
        });
*/
    } else {
		throw new Error("Ingen callback-funksjon");
/*
        var req = httpsync.get({
            url: "http://" + pathTool.join("127.0.0.1:8080", fetchObject.path),
            headers: headers,
            debug: true
        });
        var res = req.end();
        if (res.statusCode != 200) {
            throw new Error(fetchObject.path + " - " + req.statusCode);
        } else {
            return res.data;
        }

*/
    }
};
