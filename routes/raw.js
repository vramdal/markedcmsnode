var multiparty = require("multiparty");

exports.getFile = function(persistence) {
    return function(req, res, next) {
        persistence.getStream(req.path, function(fileSpec) {
            res.setHeader("Content-Type", fileSpec["contentType"]);
            fileSpec.stream.pipe(res);
        }, function(errorCode, error) {
            res.writeHead(errorCode, error);
            res.end(error);
        });
    }
};

exports.getStaticFile = function(persistence) {
	return function(req, res, next) {
		persistence.getStaticStream(req.path, function (fileSpec) {
			res.setHeader("Content-Type", fileSpec["contentType"]);
			fileSpec.stream.pipe(res);
		}, function (errorCode, error) {
			res.writeHead(errorCode, error);
			res.end(error);
		});
	}
};

exports.saveText = function(persistence) {
    return function(req, res) {
        var data = '';
         req.setEncoding('utf8');
         req.on('data', function(chunk) {
             data += chunk;
         });
         req.on('end', function() {
             req.rawBody = data;
             persistence.saveContent(req.path, data, function(httpCode) {
                 res.writeHead(httpCode);
                 res.end("");
             }, function(errorCode, error) {
                 res.writeHead(errorCode, error);
                 res.end(error);
             });
//             res.writeHead(200);
//             res.end();
             console.log("Raw body: " + req.rawBody);
         });
/*
        var form = new multiparty.Form();
        form.on("error", function(err) {
            console.log("Feil ved parsing av form", err);
            res.writeHead(400, "Nope");
            res.end("Niks");
        });
        form.on("part", function(part) {
            console.log("Fikk part", part);
        });
        form.on("end", function() {
            console.log("Ferdig med behandling av form");
            res.setHeader("text/plain");
            res.end("Mottok data");
        });
        form.parse(req);
*/
/*
        req.on("data", function(chunk) {
            console.log("Fikk data: " + chunk);
        });
        req.on("end", function() {
            res.writeHead(200, "OK", {"Content-Type": "markdown"});
            res.end();
        });
*/
/*
        var content = req.body;
        persistence.saveContent(req.path, content, function(httpCode) {
            res.writeHead(httpCode);
            res.end("");
        }, function(errorCode, error) {
            res.writeHead(errorCode, error);
            res.end(error);
        });
*/
    }
};