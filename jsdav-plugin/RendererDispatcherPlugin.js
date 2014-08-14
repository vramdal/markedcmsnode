var Path = require("path");
var jsdav = require("jsDAV/lib/jsdav");
var jsDAV_ServerPlugin = require("../node_modules/jsDAV/lib/DAV/plugin");
var Url = require("url");
var Exc = require("./../node_modules/jsDAV/lib/shared/exceptions");
var iJsonRepresentation = require("./mongodav/iJsonRepresentation");

module.exports = jsDAV_ServerPlugin.extend({
	/**
	 * Plugin name
	 *
	 * @var String
	 */
	name: undefined,

    rendererMap: {},

	/**
	 * reference to handler class
	 *
	 * @var jsDAV_Handler
	 */
//	handler: null,

	initialize: function (handler) {
        handler.addEventListener("beforeMethod", this.httpGetInterceptor.bind(this));
        for (var i = 0; i < this.renderers.length; i++) {
            var renderer = this.renderers[i];
            this.rendererMap[renderer.getSupportedContentType()] = renderer;
        }
        this.handler = handler;
	},

    getSupportedContentType: function() {
        return [];
    },

    /**
     * This method intercepts GET requests to collections and returns the html
     *
     * @param e
     * @param {String} method
     * @return bool
     */
    httpGetInterceptor: function (e, method) {
        if (method != "GET")
            return e.next();
        if (this.handler.httpRequest.query.directory) {
            return e.next();
        }
        var acceptHeader = this.handler.httpRequest.get("Accept");
        var contentTypes = acceptHeader.split(",");
        var renderer = undefined;
        for (var i = 0; i < contentTypes.length; i++) {
            var contentType = contentTypes[i];
            if (this.rendererMap[contentType]) {
                renderer = this.rendererMap[contentType];
                break;
            }
        }
        if (!renderer) {
            e.next();
        }
        var uri = this.handler.getRequestUri();
        var self = this;
        this.handler.getNodeForPath(uri, function (err, node) {
            if (err) {
                return e.next(err);
            }
            if (!node.hasFeature(iJsonRepresentation)) {
                return e.next();
            }
            var document = node.getJson();
            if (!renderer.acceptsResourceType(document.resourceType)) {
                return e.next();
            }
            e.stop();
            if (document["_id"]) {
                delete document["_id"];
            }
            if (err) {
                return e(err);
            } else if (!document) {
                return self.handleError(new Exc.FileNotFound("No resource fond at " + uri));
            }
            return renderer.renderDocument(document, function(err, str) {
                if (err) {
                    return self.handleError(err);
                }
                self.handler.httpResponse.writeHead(200, {
                            "content-type": renderer.getSupportedContentType() + "; charset=utf-8",
                            "content-length": str.length
                        }
                );
                self.handler.httpResponse.write(str);
                self.handler.httpResponse.end();
                e.next();
            });
        });
    },
    handleError: function(renderer, err) {
        var self = this;
        self.handler.httpResponse.writeHead(err.code, {"content-type": renderer.getSupportedContentType() + "; charset=utf-8"});
        if (err instanceof Exc.jsDAV_Exception) {
            err.getHTTPHeaders(this, function (err2, h) {
                if (err2) {
                    console.error("Error writing error response", err2);
                    return;
                }
                self.handler.httpResponse.end(renderer.renderError(err));
            });
        } else {
            err.code = 500;
            err.message = "Internal server error";
            self.handler.httpResponse.end(renderer.renderError(err));

        }
    }
});

module.exports.renderers = [];
