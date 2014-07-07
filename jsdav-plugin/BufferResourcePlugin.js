var jsDAV_ServerPlugin = require("../node_modules/jsDAV/lib/dav/plugin");
var Fs = require("fs");
var Path = require("path");
var Url = require("url");
var Exc = require("../node_modules/jsDAV/lib/shared/exceptions");
var Util = require("../node_modules/jsDAV/lib/shared/util");
var jsDAV_iFile = require("../node_modules/jsDAV/lib/DAV/interfaces/iFile");


var mimeTool = require("mime");
var Resource = require("../util/Resource");

var jsDAV_BufferResource_Plugin = module.exports = jsDAV_ServerPlugin.extend({
    /**
     * Plugin name
     *
     * @var String
     */
    name: "bufferResource",

    /**
     * reference to handler class
     *
     * @var jsDAV_Handler
     */
    handler: null,

    initialize: function (handler) {
        this.handler = handler;
        handler.addEventListener("beforeMethod", this.httpGetInterceptor.bind(this));
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
        if (!this.handler.httpRequest["markedCms"] || !this.handler.httpRequest["markedCms"].bufferResource) {
            return e.next();
        }
        e.stop();
        var uri = this.handler.getRequestUri();
        var self = this;
        this.handler.getNodeForPath(uri, function (err, node) {
            if (err) {
                self.nextMiddleware(404, "Not found");
                return e.next();
            } else if (!node.hasFeature(jsDAV_iFile)) {
                // TODO: Har funnet noe, men det er ikke en fil (antakelig katalog).
                // TODO: Hva gjør vi?
                return e.next();
            }
            self.serveFile(e, node.path, uri);
            e.next();
        });
    },

    nextMiddleware: function (err) {
        return this.handler.httpRequest["markedCms"]["next"](err);
    },
    serveFile: function(e, path, uri) {
        var self = this;
        if (!this.assetCache)
            this.assetCache = {};
        if (!this.assetCache[path]) {
            Fs.stat(path, function(err, stat) {
                if (err)
                    return self.nextMiddleware(new Exc.NotFound("Could not find an asset with this name"));

                self.assetCache[path] = stat;
                return serveAsset(stat);
            });
        }
        else
            return serveAsset(this.assetCache[path]);
//        return e.next();

        function serveAsset(stat) {
            var mime = mimeTool.lookup(path);
            if (mime == "application/json" && path.endsWith(".page.json")) {
                mime = "X-mdcms/page";
            }

            var stream = Fs.createReadStream(path);
            self.handler.httpRequest["markedCms"].resource = new Resource(
                    "/" + uri, mime, stream, stat.size
            );
            return self.nextMiddleware();
        }
    }


});
