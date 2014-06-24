var fs = require("fs");
var path = require("path");
var multiparty = require("multiparty");

//noinspection JSUnusedLocalSymbols
exports.upload = function(persistence) {
    return function(req, res) {
        console.log("Upload");
        // Se https://www.npmjs.org/package/multiparty
        var form = new multiparty.Form(/*{
            "uploadDir": __dirname + "/../assets",
            "hash": "md5"
        }*/);

        form.on("part", function(part) {
            if (part.filename) {
                console.log("Mottok fil " + part.filename);
                persistence.saveStream(part, req.path);
            } else {
                console.log("Mottok noe annet enn fil");
            }

        });
        form.on("close", function() {
            res.statusCode = 201;
            res.setHeader("Location", req.path);
            res.end("Lastet opp");
        });
        form.on("error", function(err) {
            res.writeHead(400);
            res.end(err + "");
        });
        form.parse(req);
/*            var result = [];
			if (!files || files.length == 0) {
				res.status(400);
				res.json({"error": "No files"});
			}
            for (var fileName in files) {
                if (!files.hasOwnProperty(fileName)) {
                    continue;
                }
                var file = files[fileName][0];
				persistence.copyBinary(file.path,
						function(urlPath) {
							result.push({
								original: {
									"path": urlPath
								}
							});
							res.writeHead(201, {'Location': result[0].path});
							res.end(JSON.stringify(result));

						},
						function(err){
							res.status(500);
							res.end("Error " + 500);
						});
            }
			});*/
    };
};
