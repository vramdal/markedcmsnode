var jsDAV_ServerPlugin = require("../node_modules/jsDAV/lib/dav/plugin");
var Path = require("path");
var Url = require("url");
var Util = require("../node_modules/jsDAV/lib/shared/util");
var jsDAV_iFile = require("../node_modules/jsDAV/lib/DAV/interfaces/iFile");


var mimeTool = require("mime");
var Resource = require("../util/Resource");
var streamifier = require("streamifier");
var globalHandler = null;

var jsDAV_NonHttpRequest_Plugin = module.exports = jsDAV_ServerPlugin.extend({
	/**
	 * Plugin name
	 *
	 * @var String
	 */
	name: "nonHttpRequest",

	/**
	 * reference to handler class
	 *
	 * @var jsDAV_Handler
	 */
//	handler: null,

	initialize: function (handler) {
		globalHandler = handler;
	},

	getResource: function(path, callback) {
		globalHandler.getNodeForPath(path, function(err, node) {
			if (err) {
				return callback(err);
			}
			if (!node.hasFeature(jsDAV_iFile)) {
				return callback("Not a file");
			}
			node.getSize(function(err, size) {
				if (err) {
					return callback(err);
				}
				node.get(function(err, streamOrBuffer) {
					if (err) {
						return callback(err);
					}
					var stream = (streamOrBuffer instanceof Buffer)
							? streamifier.createReadStream(streamOrBuffer)
							: streamOrBuffer;
					return callback(null, new Resource("/" + path, mimeTool.lookup(path), stream, size));
				})
			});
		});
	}
});
