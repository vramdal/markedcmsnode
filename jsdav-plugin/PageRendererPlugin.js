var Path = require("path");
var jsdav = require("jsDAV/lib/jsdav");
var jsDAV_ServerPlugin = require("../node_modules/jsDAV/lib/DAV/plugin");
var Url = require("url");
var Util = require("../node_modules/jsDAV/lib/shared/util");
var jsDAV_iFile = require("../node_modules/jsDAV/lib/DAV/interfaces/iFile");
var Exc = require("./../node_modules/jsDAV/lib/shared/exceptions");
var iJsonRepresentation = require("./mongodav/iJsonRepresentation");
var jsDAV_Mongo_Directory = require("./mongodav/jsDAV_Mongo_Directory");
var globalHandler = null;

var jsDAV_JsonRenderer_Plugin = module.exports = jsDAV_ServerPlugin.extend({
	/**
	 * Plugin name
	 *
	 * @var String
	 */
	name: "pageRenderer",

	/**
	 * reference to handler class
	 *
	 * @var jsDAV_Handler
	 */
//	handler: null,

	initialize: function (handler) {
		handler.addEventListener("beforeMethod", this.httpGetInterceptor.bind(this));
		this.handler = handler;
	},

	accepts: function(supportsContentTypes, otherContentTypes) {
		var acceptHeader = this.handler.httpRequest.get("Accept");
		var accepted = [];
		for (var i = 0; i < supportsContentTypes.length; i++) {
			var supportedContentType = supportsContentTypes[i];
			var pos = acceptHeader.indexOf(supportedContentType);
			if (pos != -1) {
				accepted.push({type: supportedContentType, pri: pos});
			}
		}
		var denied = [];
		for (var i = 0; i < otherContentTypes.length; i++) {
			var otherContentType = otherContentTypes[i];
			var pos = acceptHeader.indexOf(otherContentType);
			if (pos != -1) {
				denied.push({type: otherContentType, pri: pos});
			}
		}
		var sorterFunc = function (typeA, typeB) {
			return typeA.pri - typeB.pri;
		};
		accepted.sort(sorterFunc);
		denied.sort(sorterFunc);
		if (accepted.length > 0 && denied.length == 0) {
			return true;
		} else if (accepted.length == 0) {
			return false;
		} else {
			return accepted[0].pri < denied[0].pri;
		}
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
		if (!this.accepts(["text/html"], ["application/xml", "application/json"])) {
			return e.next();
		}
		if (this.handler.httpRequest.query.directory) {
			return e.next();
		}
		var uri = this.handler.getRequestUri();
		var self = this;
		this.handler.getNodeForPath(uri, function (err, node) {
			if (err) {
				return self.handleError(err);
			} else {
				if (node.hasFeature(jsDAV_Mongo_Directory)) {
					e.stop();
					var json = node.getJson();
					// TODO: Work here
					self.handler.httpResponse.writeHead(200, {
								"content-type": "text/html; charset=utf-8"
							}
					);
					self.handler.httpResponse.write(json.title);
					self.handler.httpResponse.end();
				}
			}
			return e.next();
		});
	},
	handleError: function (err) {
		var self = this;
		if (err instanceof Exc.jsDAV_Exception) {
			err.getHTTPHeaders(this, function (err2, h) {
				if (err2) {
					console.error("Error writing error response", err2);
					return;
				}
				self.handler.httpResponse.writeHead(err.code, {"content-type": "text/html; charset=utf-8"});
				self.handler.httpResponse.end("<h1>" + err.code + " " + err.message + "</h1>");
			});
		}
	}
});
