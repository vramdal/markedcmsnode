var fs = require("fs");
var path = require("path");
var multiparty = require("multiparty");

//noinspection JSUnusedLocalSymbols
exports.upload = function(db) {
    return function(req, res) {
        console.log("Upload");
        // Se https://www.npmjs.org/package/multiparty
        var form = new multiparty.Form({
            "uploadDir": __dirname + "/../../assets",
            "hash": "md5"
        });

        form.parse(req, function(err, fields, files) {
//            res.writeHead(200, {'content-type': 'text/plain'});
//            res.write('received upload:\n\n');
//            res.end(util.inspect({fields: fields, files: files}));
            var result = [];
            for (var fileName in files) {
                if (!files.hasOwnProperty(fileName)) {
                    continue;
                }
                var file = files[fileName][0];
                var parts = file.path.split("/");
                var newFileName = path.basename(file.path);
                result.push(
                        {
                            original: {
                                "path": "/assets/" + newFileName,
                                "originalFilename": file.originalFilename
                            }
                        }
                );
                console.log("File moved");
            }
            var collection = db.get("contentcollection");
            collection.insert(result);
            res.writeHead(201, {'Location': result[0].path});
            res.end(JSON.stringify(result));
//            res.json(result);
        });
//        res.json({"status": "OK"});
    };
};
