var fs = require("fs");
var gm = require("gm");
var mime = require("mime");
var multiparty = require("multiparty");
var images = require("../util/images");
var domain = require("domain");


var gmDomain = domain.create();
// http://strongloop.com/strongblog/robust-node-applications-error-handling/
gmDomain.on("error", function(err) {
	console.error("Error processing image", err);
	throw new Error("Hvafforno?", err);
});


//noinspection JSUnusedLocalSymbols

exports.imageResize = function(db) {
    return function(req, res) {
		gmDomain.run(function () {
			var image = images.imageResizeRequest(req);
			res.writeHead(200, {'Content-Type': image.getContentType()});
			gm(image.filePath)
					.resize(image.requestedWith, image.requestedHeight)
					.identify(function (err, data) {
						if (!err) console.log(data)
					})
					.stream(function streamOut(err, stdout, stderr) {
						if (err) return next(err);
						stdout.pipe(res); //pipe to response
	//                    res.end();

					});
//        res.end();
		});
    }
};

exports.suitableSizes = function(db) {
    return function(req, res) {
		gmDomain.run(function () {
			var image = images.imageRequest(req);
			gm(image.filePath)
					.size(function (err, value) {
						res.json({
							"original": {
								"width": value.width,
								"height": value.height
							}
						});
					});
		});
    }
};
