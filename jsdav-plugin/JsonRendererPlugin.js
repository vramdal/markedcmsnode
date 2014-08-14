var Path = require("path");
var jsdav = require("jsDAV/lib/jsdav");
var jsDAV_ServerPlugin = require("../node_modules/jsDAV/lib/DAV/plugin");
var Url = require("url");
var Util = require("../node_modules/jsDAV/lib/shared/util");
var jsDAV_iFile = require("../node_modules/jsDAV/lib/DAV/interfaces/iFile");
var Exc = require("./../node_modules/jsDAV/lib/shared/exceptions");
var iJsonRepresentation = require("./mongodav/iJsonRepresentation");
var globalHandler = null;
var BaseRenderer_Plugin = require("./BaseRendererPlugin");

var jsDAV_JsonRenderer_Plugin = module.exports = BaseRenderer_Plugin.extend({
	/**
	 * Plugin name
	 *
	 * @var String
	 */
	name: "jsonRenderer",

	/**
	 * reference to handler class
	 *
	 * @var jsDAV_Handler
	 */
//	handler: null,

	initialize: function (handler) {
		registeredContentTypes.push("application/json");
        handler.addEventListener("beforeMethod", this.httpGetInterceptor.bind(this));
        this.handler = handler;
	},

    /**
     * This method intercepts GET requests to collections and returns the html
     *
     * @param {String} method
     * @return bool
     */
    httpGetInterceptor: function (e, method) {
        if (method != "GET")
            return e.next();
        var acceptHeader = this.handler.httpRequest.get("Accept");
        var jsonPriority = acceptHeader.indexOf("application/json");
        var htmlPriority = Math.max(acceptHeader.indexOf("text/html"), acceptHeader.indexOf("application/xhtml+xml"));
        if (!(jsonPriority != -1 && jsonPriority > htmlPriority || jsonPriority != -1 && htmlPriority == -1)) {
            return e.next();
        }
        e.stop();
        var uri = this.handler.getRequestUri();
        var self = this;
        this.handler.getNodeForPath(uri, function (err, node) {
            if (err) {
                return self.handleError(err);
            } else {
                if (node.hasFeature(iJsonRepresentation)) {
                    var json = node.getJson();
                    if (json["_id"]) {
                        delete json["_id"];
                    }
                    var jsonStr = JSON.stringify(json);
                    self.handler.httpResponse.writeHead(200, {
                                "content-type": "application/json; charset=utf-8",
                                "content-length": jsonStr.length
                            }
                    );
                    self.handler.httpResponse.write(jsonStr);
					self.handler.httpResponse.end();
                }
            }
            return e.next();
        });
    },
	handleError: function(err) {
		var self = this;
		if (err instanceof Exc.jsDAV_Exception) {
			err.getHTTPHeaders(this, function (err2, h) {
				if (err2) {
					console.error("Error writing error response", err2);
					return;
				}
				self.handler.httpResponse.writeHead(err.code, {"content-type": "application/json; charset=utf-8"});
				self.handler.httpResponse.end(JSON.stringify({"code": err.code, "message": err.message}));
			});
		}
	}
});
