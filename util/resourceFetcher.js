var http = require("http");

module.exports = function(fetchObject, callback) {
    var options = {
        "host": "localhost",
        "port": 8080,
        "path": fetchObject.path,
        "headers": fetchObject.headers
    };

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
};
